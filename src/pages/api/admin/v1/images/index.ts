import type { APIRoute } from "astro";
import { requireAuth } from "@/pages/api/admin/v1/_auth";
import { getRuntimeEnvironment } from "@/lib/admin/storage";

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
	const auth = await requireAuth(request, locals);
	if (!auth.ok) return auth.response;

	const bedUrl = (process.env.IMG_BED_URL ?? "").replace(/\/+$/, "");
	const runtimeEnv = getRuntimeEnvironment(locals);
	const configuredBedUrl = String(runtimeEnv.IMG_BED_URL ?? bedUrl).replace(/\/+$/, "");
	if (!configuredBedUrl) {
		return new Response(JSON.stringify({ items: [], total: 0 }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	}

	try {
		const token = String(runtimeEnv.IMG_BED_TOKEN ?? process.env.IMG_BED_TOKEN ?? "");
		const url = new URL(configuredBedUrl);
		url.searchParams.set("action", "list");
		const headers: Record<string, string> = {};
		if (token) headers["Authorization"] = `Bearer ${token}`;
		const r = await fetch(url.toString(), { headers });
		if (!r.ok) throw new Error(`List failed: ${r.status}`);
		const result = await r.json();
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
