import type { APIRoute } from "astro";
import { requireAuth } from "@/pages/api/admin/v1/_auth";
import { gistGet, gistUpdate } from "@/lib/admin/gist";
import { writeAudit } from "@/lib/admin/audit";
import { getRuntimeBindings, getRuntimeEnvironment } from "@/lib/admin/storage";

export const prerender = false;

function getConfig(env: Record<string, unknown>) {
	return {
		gistId: String(env.MOMENTS_GIST_ID ?? process.env.MOMENTS_GIST_ID ?? ""),
		fileName: String(env.MOMENTS_FILE_NAME ?? process.env.MOMENTS_FILE_NAME ?? "moments.json"),
	};
}

const MOMENT_FIELDS = ["content", "published", "images", "tags", "location", "pinned"] as const;

function pickMomentFields(body: Record<string, unknown>): Record<string, unknown> {
	const allowed: Record<string, unknown> = {};
	for (const key of MOMENT_FIELDS) {
		if (key in body) allowed[key] = body[key];
	}
	return allowed;
}

export const PUT: APIRoute = async ({ request, params, locals }) => {
	const auth = await requireAuth(request, locals);
	if (!auth.ok) return auth.response;
	const rid = crypto.randomUUID();
	const bindings = getRuntimeBindings(locals);

	const env = getRuntimeEnvironment(locals);
	const { gistId, fileName } = getConfig(env);
	const id = String(params.id ?? "");
	const body = (await request.json()) as Record<string, unknown>;

	if (!gistId) {
		return new Response(
			JSON.stringify({ code: "BAD_REQUEST", message: "Gist not configured" }),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}

	try {
		const gist = await gistGet(gistId, env);
		const content = gist.files[fileName]?.content ?? "[]";
		const moments = JSON.parse(content) as Record<string, unknown>[];
		const idx = moments.findIndex((m) => m.id === id);
		if (idx === -1) {
			await writeAudit("admin", "moments.update", id, "failure", rid, bindings);
			return new Response(
				JSON.stringify({ code: "NOT_FOUND", message: "Moment not found" }),
				{ status: 404, headers: { "Content-Type": "application/json" } },
			);
		}
		// 白名单字段，禁止覆盖 id / 注入任意键 (RULE-SEC-RUN-001 IDOR / 003 输入验证)
		moments[idx] = { ...moments[idx], ...pickMomentFields(body), id: moments[idx].id };
		await gistUpdate(gistId, {
			[fileName]: { content: JSON.stringify(moments, null, 2) },
		}, env);
		await writeAudit("admin", "moments.update", id, "success", rid, bindings);
		return new Response(JSON.stringify(moments[idx]), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (err) {
		await writeAudit("admin", "moments.update", id, "failure", rid, bindings);
		return new Response(
			JSON.stringify({ code: "UPSTREAM_ERROR", message: String(err) }),
			{ status: 502, headers: { "Content-Type": "application/json" } },
		);
	}
};

export const DELETE: APIRoute = async ({ request, params, locals }) => {
	const auth = await requireAuth(request, locals);
	if (!auth.ok) return auth.response;
	const rid = crypto.randomUUID();
	const bindings = getRuntimeBindings(locals);

	const env = getRuntimeEnvironment(locals);
	const { gistId, fileName } = getConfig(env);
	const id = String(params.id ?? "");

	if (!gistId) {
		return new Response(
			JSON.stringify({ code: "BAD_REQUEST", message: "Gist not configured" }),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}

	try {
		const gist = await gistGet(gistId, env);
		const content = gist.files[fileName]?.content ?? "[]";
		const moments = JSON.parse(content) as Record<string, unknown>[];
		const filtered = moments.filter((m) => m.id !== id);
		await gistUpdate(gistId, {
			[fileName]: { content: JSON.stringify(filtered, null, 2) },
		}, env);
		await writeAudit("admin", "moments.delete", id, "success", rid, bindings);
		return new Response(null, { status: 204 });
	} catch (err) {
		await writeAudit("admin", "moments.delete", id, "failure", rid, bindings);
		return new Response(
			JSON.stringify({ code: "UPSTREAM_ERROR", message: String(err) }),
			{ status: 502, headers: { "Content-Type": "application/json" } },
		);
	}
};
