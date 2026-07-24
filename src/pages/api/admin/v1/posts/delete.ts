import type { APIRoute } from "astro";
import { requireAuth } from "@/pages/api/admin/v1/_auth";
import { githubFetch } from "@/lib/admin/githubClient";
import { removePostIndex } from "@/lib/admin/postIndex";
import { writeAudit } from "@/lib/admin/audit";
import { getRuntimeBindings, getRuntimeEnvironment } from "@/lib/admin/storage";

export const prerender = false;

export const DELETE: APIRoute = async ({ request, params, locals }) => {
	const auth = await requireAuth(request, locals);
	if (!auth.ok) return auth.response;

	const slug = params.slug;
	const rid = crypto.randomUUID();
	const bindings = getRuntimeBindings(locals);
	const env = getRuntimeEnvironment(locals);
	const body = (await request.json().catch(() => ({}))) as { sha?: string };

	const postsPath = String(env.POSTS_PATH ?? process.env.POSTS_PATH ?? "src/content/posts");
	const branch = String(env.GITHUB_BRANCH ?? process.env.GITHUB_BRANCH ?? "main");
	const mdPath = `${postsPath}/${slug}.md`;

	try {
		let sha = body.sha;
		if (!sha) {
			const getResponse = await githubFetch(`contents/${mdPath}`, undefined, env);
			const file = (await getResponse.json()) as { sha: string };
			sha = file.sha;
		}

		await githubFetch(`contents/${mdPath}`, {
			method: "DELETE",
			body: JSON.stringify({
				message: `Delete post: ${slug}`,
				sha,
				branch,
			}),
		}, env);

		await removePostIndex(slug!, bindings);
		await writeAudit("admin", "post.delete", slug!, "success", rid, bindings);
		return new Response(null, { status: 204 });
	} catch (err) {
		await writeAudit("admin", "post.delete", slug!, "failure", rid, bindings);
		return new Response(
			JSON.stringify({ code: "UPSTREAM_ERROR", message: String(err) }),
			{ status: 502, headers: { "Content-Type": "application/json" } },
		);
	}
};
