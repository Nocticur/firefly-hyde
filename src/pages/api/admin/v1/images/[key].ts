import type { APIRoute } from "astro";
import { requireAuth } from "@/pages/api/admin/v1/_auth";
import { imageBedDelete } from "@/lib/admin/imageBed";
import { getRuntimeEnvironment } from "@/lib/admin/storage";

export const prerender = false;

export const DELETE: APIRoute = async ({ request, params, locals }) => {
	const auth = await requireAuth(request, locals);
	if (!auth.ok) return auth.response;

	const key = params.key;
	try {
		await imageBedDelete(key ?? "", getRuntimeEnvironment(locals));
		return new Response(null, { status: 204 });
	} catch (err) {
		return new Response(
			JSON.stringify({ code: "UPSTREAM_ERROR", message: String(err) }),
			{ status: 502, headers: { "Content-Type": "application/json" } },
		);
	}
};
