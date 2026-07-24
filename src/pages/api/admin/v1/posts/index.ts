import type { APIRoute } from "astro";
import { requireAuth } from "@/pages/api/admin/v1/_auth";
import { queryPostIndex } from "@/lib/admin/postIndex";
import { getRuntimeBindings } from "@/lib/admin/storage";

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
	const auth = await requireAuth(request, locals);
	if (!auth.ok) return auth.response;

	const url = new URL(request.url);
	const cursor = url.searchParams.get("cursor") ?? undefined;
	const limit = url.searchParams.get("limit")
		? parseInt(url.searchParams.get("limit")!, 10)
		: undefined;
	const draftStr = url.searchParams.get("draft");
	const draft = draftStr !== null ? draftStr === "true" : undefined;
	const search = url.searchParams.get("search") ?? undefined;

	const result = await queryPostIndex({ cursor, limit, draft, search }, getRuntimeBindings(locals));
	return new Response(JSON.stringify(result), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
};
