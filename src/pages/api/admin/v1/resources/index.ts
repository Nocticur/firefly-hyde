import type { APIRoute } from "astro";
import { listResourceDescriptors } from "@/lib/admin/resourceRegistry";
import { requireAuth } from "@/pages/api/admin/v1/_auth";

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
	const auth = await requireAuth(request, locals);
	if (!auth.ok) return auth.response;
	return new Response(JSON.stringify({ items: listResourceDescriptors() }), {
		status: 200,
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "private, no-store",
		},
	});
};
