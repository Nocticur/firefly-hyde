import type { APIRoute } from "astro";
import { requireAuth } from "@/pages/api/admin/v1/_auth";
import { imageBedUpload } from "@/lib/admin/imageBed";
import { getRuntimeEnvironment } from "@/lib/admin/storage";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
	const auth = await requireAuth(request, locals);
	if (!auth.ok) return auth.response;

	try {
		const formData = await request.formData();
		const file = formData.get("file") as File | null;
		if (!file) {
			return new Response(
				JSON.stringify({ code: "BAD_REQUEST", message: "No file provided" }),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}
		const result = await imageBedUpload(file, getRuntimeEnvironment(locals));
		return new Response(JSON.stringify(result), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (err) {
		return new Response(
			JSON.stringify({ code: "UPSTREAM_ERROR", message: String(err) }),
			{ status: 502, headers: { "Content-Type": "application/json" } },
		);
	}
};
