import type { APIRoute } from "astro";
import { getResourceDescriptor } from "@/lib/admin/resourceRegistry";
import { parseFrontmatter, parsePostFrontmatter } from "@/lib/admin/frontmatter";
import { requireAuth } from "@/pages/api/admin/v1/_auth";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
	const auth = await requireAuth(request, locals);
	if (!auth.ok) return auth.response;
	const body = (await request.json()) as { resourceId?: string; content?: string };
	const descriptor = getResourceDescriptor(body.resourceId ?? "");
	if (!descriptor || body.content === undefined) {
		return new Response(JSON.stringify({ code: "BAD_REQUEST", message: "resourceId and content are required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}
	let metadata: Record<string, unknown> = {};
	if (descriptor.source === "git-markdown") {
		metadata = parsePostFrontmatter(parseFrontmatter(body.content).frontmatter);
	}
	return new Response(
		JSON.stringify({
			resourceId: descriptor.id,
			valid: true,
			metadata,
			content: body.content,
			previewMode: descriptor.source === "git-markdown" ? "markdown" : "raw",
		}),
		{ status: 200, headers: { "Content-Type": "application/json" } },
	);
};
