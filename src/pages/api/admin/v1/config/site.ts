import type { APIRoute } from "astro";
import { requireAuth } from "@/pages/api/admin/v1/_auth";
import { getAllConfigLocal, setConfigLocal, deleteConfigLocal } from "@/lib/admin/d1";

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
	const auth = await requireAuth(request, locals);
	if (!auth.ok) return auth.response;

	const configs = await getAllConfigLocal();
	return new Response(JSON.stringify(configs), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
};

export const PUT: APIRoute = async ({ request, locals }) => {
	const auth = await requireAuth(request, locals);
	if (!auth.ok) return auth.response;

	const body = (await request.json()) as {
		key: string;
		value: string;
		delete?: boolean;
	};

	if (!body.key) {
		return new Response(
			JSON.stringify({ code: "BAD_REQUEST", message: "key is required" }),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}

	if (body.delete) {
		await deleteConfigLocal(body.key);
	} else {
		await setConfigLocal(body.key, body.value ?? "");
	}

	return new Response(JSON.stringify({ ok: true }), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
};
