import type { APIRoute } from "astro";
import { requireAuth } from "@/pages/api/admin/v1/_auth";
import { githubFetch } from "@/lib/admin/githubClient";
import {
	parseFrontmatter,
	parsePostFrontmatter,
	createPostFile,
	patchFrontmatter,
} from "@/lib/admin/frontmatter";
import { upsertPostIndex } from "@/lib/admin/postIndex";
import { writeAudit } from "@/lib/admin/audit";
import { getRuntimeBindings, getRuntimeEnvironment } from "@/lib/admin/storage";

export const prerender = false;

export const PUT: APIRoute = async ({ request, params, locals }) => {
	const auth = await requireAuth(request, locals);
	if (!auth.ok) return auth.response;

	const slug = params.slug;
	const rid = crypto.randomUUID();
	const bindings = getRuntimeBindings(locals);
	const env = getRuntimeEnvironment(locals);
	const body = (await request.json()) as {
		sha: string;
		frontmatter?: Record<string, unknown>;
		content?: string;
		message?: string;
	};

	if (!body.sha) {
		return new Response(
			JSON.stringify({ code: "BAD_REQUEST", message: "sha is required" }),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}

	const postsPath = String(env.POSTS_PATH ?? process.env.POSTS_PATH ?? "src/content/posts");
	const branch = String(env.GITHUB_BRANCH ?? process.env.GITHUB_BRANCH ?? "main");
	const mdPath = `${postsPath}/${slug}.md`;

	try {
		const getResponse = await githubFetch(`contents/${mdPath}`, undefined, env);
		const currentFile = (await getResponse.json()) as {
			content: string;
			sha: string;
		};

		if (currentFile.sha !== body.sha) {
			return new Response(
				JSON.stringify({
					code: "CONFLICT",
					message: "SHA mismatch: file was modified since last fetch",
				}),
				{ status: 409, headers: { "Content-Type": "application/json" } },
			);
		}

		const decoded = atob(currentFile.content);
		let newContent: string;

		if (body.frontmatter || body.content !== undefined) {
			if (body.frontmatter && body.content !== undefined) {
				newContent = createPostFile(
					slug!,
					body.content,
					body.frontmatter as any,
				);
			} else if (body.frontmatter) {
				newContent = patchFrontmatter(
					currentFile.content,
					body.frontmatter as any,
				);
			} else {
				newContent = decoded;
			}
		} else {
			newContent = decoded;
		}

		const encoded = btoa(unescape(encodeURIComponent(newContent)));
		const putResponse = await githubFetch(`contents/${mdPath}`, {
			method: "PUT",
			body: JSON.stringify({
				message: body.message || `Update post: ${slug}`,
				content: encoded,
				sha: body.sha,
				branch,
			}),
		}, env);
		const result = (await putResponse.json()) as { content: { sha: string } };
		const newSha = result.content.sha;

		if (body.frontmatter) {
			const rawFm = parseFrontmatter(newContent).frontmatter;
			await upsertPostIndex(slug!, newSha, parsePostFrontmatter(rawFm), bindings);
		}
		await writeAudit("admin", "post.update", slug!, "success", rid, bindings);

		return new Response(JSON.stringify({ slug, sha: newSha }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (err) {
		await writeAudit("admin", "post.update", slug!, "failure", rid, bindings);
		return new Response(
			JSON.stringify({ code: "UPSTREAM_ERROR", message: String(err) }),
			{ status: 502, headers: { "Content-Type": "application/json" } },
		);
	}
};
