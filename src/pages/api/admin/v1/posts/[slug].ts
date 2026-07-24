import type { APIRoute } from "astro";
import { requireAuth } from "@/pages/api/admin/v1/_auth";
import { getPostBySlug } from "@/lib/admin/postIndex";
import { githubFetch } from "@/lib/admin/githubClient";
import {
	parseFrontmatter,
	parsePostFrontmatter,
} from "@/lib/admin/frontmatter";
import { writeAudit } from "@/lib/admin/audit";
import { getRuntimeBindings, getRuntimeEnvironment } from "@/lib/admin/storage";

export const prerender = false;

export const GET: APIRoute = async ({ request, params, locals }) => {
	const auth = await requireAuth(request, locals);
	if (!auth.ok) return auth.response;

	const slug = params.slug;
	const bindings = getRuntimeBindings(locals);
	const env = getRuntimeEnvironment(locals);
	if (!slug) {
		return new Response(
			JSON.stringify({ code: "BAD_REQUEST", message: "Missing slug" }),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}

	const indexEntry = await getPostBySlug(slug, bindings);
	if (!indexEntry) {
		return new Response(
			JSON.stringify({ code: "NOT_FOUND", message: `Post "${slug}" not found` }),
			{ status: 404, headers: { "Content-Type": "application/json" } },
		);
	}

	const postsPath = String(env.POSTS_PATH ?? process.env.POSTS_PATH ?? "src/content/posts");
	try {
		const response = await githubFetch(`contents/${postsPath}/${slug}.md`, undefined, env);
		const file = (await response.json()) as { content: string; sha: string };
		const decoded = atob(file.content);
		const { frontmatter: rawFm, body } = parseFrontmatter(decoded);
		const frontmatter = parsePostFrontmatter(rawFm);
		return new Response(
			JSON.stringify({ slug, sha: file.sha, frontmatter, content: body }),
			{ status: 200, headers: { "Content-Type": "application/json" } },
		);
	} catch (err) {
		return new Response(
			JSON.stringify({ code: "UPSTREAM_ERROR", message: String(err) }),
			{ status: 502, headers: { "Content-Type": "application/json" } },
		);
	}
};
