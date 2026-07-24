import type { APIRoute } from "astro";
import { requireAuth } from "@/pages/api/admin/v1/_auth";
import { githubFetch } from "@/lib/admin/githubClient";
import { createPostFile, parsePostFrontmatter } from "@/lib/admin/frontmatter";
import { upsertPostIndex } from "@/lib/admin/postIndex";
import { writeAudit } from "@/lib/admin/audit";
import { getRuntimeBindings, getRuntimeEnvironment } from "@/lib/admin/storage";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
	const auth = await requireAuth(request, locals);
	if (!auth.ok) return auth.response;

	const rid = crypto.randomUUID();
	const bindings = getRuntimeBindings(locals);
	const env = getRuntimeEnvironment(locals);
	const body = (await request.json()) as {
		slug: string;
		frontmatter: Record<string, unknown>;
		content: string;
		message?: string;
	};

	if (!body.slug || !body.frontmatter?.title) {
		return new Response(
			JSON.stringify({
				code: "BAD_REQUEST",
				message: "slug and frontmatter.title are required",
			}),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}

	const postsPath = String(env.POSTS_PATH ?? process.env.POSTS_PATH ?? "src/content/posts");
	const branch = String(env.GITHUB_BRANCH ?? process.env.GITHUB_BRANCH ?? "main");
	const mdPath = `${postsPath}/${body.slug}.md`;
	const parsedFrontmatter = parsePostFrontmatter(body.frontmatter);
	const fileContent = createPostFile(body.slug, body.content, parsedFrontmatter);
	const encoded = btoa(unescape(encodeURIComponent(fileContent)));

	try {
		const response = await githubFetch(`contents/${mdPath}`, {
			method: "PUT",
			body: JSON.stringify({
				message: body.message || `Create post: ${body.slug}`,
				content: encoded,
				branch,
			}),
		}, env);
		const result = (await response.json()) as { content: { sha: string } };
		const sha = result.content.sha;
		await upsertPostIndex(body.slug, sha, parsedFrontmatter, bindings);
		await writeAudit("admin", "post.create", body.slug, "success", rid, bindings);
		return new Response(JSON.stringify({ slug: body.slug, sha }), {
			status: 201,
			headers: { "Content-Type": "application/json" },
		});
	} catch (err) {
		await writeAudit("admin", "post.create", body.slug, "failure", rid, bindings);
		return new Response(
			JSON.stringify({ code: "UPSTREAM_ERROR", message: String(err) }),
			{ status: 502, headers: { "Content-Type": "application/json" } },
		);
	}
};
