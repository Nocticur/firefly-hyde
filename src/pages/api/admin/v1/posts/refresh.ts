import type { APIRoute } from "astro";
import { requireAuth } from "@/pages/api/admin/v1/_auth";
import { githubFetch } from "@/lib/admin/githubClient";
import {
	parseFrontmatter,
	parsePostFrontmatter,
} from "@/lib/admin/frontmatter";
import { upsertPostIndex } from "@/lib/admin/postIndex";
import { writeAudit } from "@/lib/admin/audit";
import { getRuntimeBindings, getRuntimeEnvironment } from "@/lib/admin/storage";
import { decodeBase64Utf8, listGitFiles } from "@/lib/admin/gitContent";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
	const auth = await requireAuth(request, locals);
	if (!auth.ok) return auth.response;

	const rid = crypto.randomUUID();
	const bindings = getRuntimeBindings(locals);
	const env = getRuntimeEnvironment(locals);
	const postsPath = String(env.POSTS_PATH ?? process.env.POSTS_PATH ?? "src/content/posts");
	const branch = String(env.GITHUB_BRANCH ?? process.env.GITHUB_BRANCH ?? "main");

	try {
		const files = await listGitFiles(postsPath, env);
		const mdFiles = files.filter(
			(f) => f.type === "file" && /\.(md|mdx)$/i.test(String(f.name)),
		) as Array<{ name: string; path: string; type: string }>;
		let processed = 0;
		const failures: Array<{ id: string; message: string }> = [];

		for (const file of mdFiles) {
			try {
				const slug = file.name.replace(/\.md$/, "");
				const fileResponse = await githubFetch(`contents/${file.path}`, undefined, env);
				const fileData = (await fileResponse.json()) as {
					content: string;
					sha: string;
				};
				// 用 UTF-8 安全解码替换 atob，避免中文 frontmatter 解码错乱
				const decoded = decodeBase64Utf8(fileData.content);
				const { frontmatter: rawFm } = parseFrontmatter(decoded);
				const fm = parsePostFrontmatter(rawFm);
				await upsertPostIndex(slug, fileData.sha, fm, bindings);
				processed++;
			} catch (err) {
				failures.push({ id: file.name, message: String(err) });
			}
		}

		await writeAudit(
			"admin",
			"post.index.refresh",
			`${processed} posts`,
			"success",
			rid,
			bindings,
		);
		return new Response(JSON.stringify({ processed, failures }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (err) {
		await writeAudit("admin", "post.index.refresh", "error", "failure", rid, bindings);
		return new Response(
			JSON.stringify({ code: "UPSTREAM_ERROR", message: String(err) }),
			{ status: 502, headers: { "Content-Type": "application/json" } },
		);
	}
};
