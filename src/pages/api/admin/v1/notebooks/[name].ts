import type { APIRoute } from "astro";
import { requireAuth } from "@/pages/api/admin/v1/_auth";
import { gistGet, gistUpdate, gistCreate } from "@/lib/admin/gist";
import { writeAudit } from "@/lib/admin/audit";
import { getRuntimeBindings, getRuntimeEnvironment } from "@/lib/admin/storage";

export const prerender = false;

function getNotebookGists(env: Record<string, unknown>): Record<string, string> {
	try {
		return JSON.parse(String(env.NOTEBOOK_GISTS_JSON ?? process.env.NOTEBOOK_GISTS_JSON ?? "{}"));
	} catch {
		return {};
	}
}

const FILE_NAME = "notebooks-entries.json";

// 笔记本条目白名单字段，禁止调用方注入任意键 (RULE-SEC-RUN-001/003)
const ENTRY_FIELDS = ["id", "title", "content", "summary", "tags", "url", "pinned", "order"] as const;

function sanitizeEntries(entries: unknown): Record<string, unknown>[] {
	if (!Array.isArray(entries)) return [];
	return entries
		.filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
		.map((item) => {
			const allowed: Record<string, unknown> = {};
			for (const key of ENTRY_FIELDS) {
				if (key in item) allowed[key] = item[key];
			}
			return allowed;
		});
}

export const GET: APIRoute = async ({ request, params, locals }) => {
	const auth = await requireAuth(request, locals);
	if (!auth.ok) return auth.response;

	const env = getRuntimeEnvironment(locals);
	const name = String(params.name ?? "");
	const gists = getNotebookGists(env);
	const gistId = gists[name];

	if (!gistId) {
		return new Response(JSON.stringify({ entries: [] }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	}

	try {
		const gist = await gistGet(gistId, env);
		const content = gist.files[FILE_NAME]?.content ?? "[]";
		const entries = JSON.parse(content);
		return new Response(JSON.stringify({ entries }), {
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

export const PUT: APIRoute = async ({ request, params, locals }) => {
	const auth = await requireAuth(request, locals);
	if (!auth.ok) return auth.response;
	const rid = crypto.randomUUID();
	const bindings = getRuntimeBindings(locals);

	const env = getRuntimeEnvironment(locals);
	const name = String(params.name ?? "");
	const body = (await request.json()) as {
		entries?: unknown;
	};
	const gists = getNotebookGists(env);
	const gistId = gists[name];

	// 强类型校验：entries 必须是数组
	const entries = sanitizeEntries(body.entries);
	const fileContent = JSON.stringify(entries, null, 2);

	try {
		if (gistId) {
			await gistUpdate(gistId, {
				[FILE_NAME]: { content: fileContent },
			}, env);
			await writeAudit("admin", "notebook.update", name ?? "unknown", "success", rid, bindings);
			return new Response(JSON.stringify({ entries }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		}
		const result = await gistCreate(`firefly-notebook:${name}`, {
			[FILE_NAME]: { content: fileContent },
		}, env);
		await writeAudit("admin", "notebook.create", name ?? "unknown", "success", rid, bindings);
		return new Response(
			JSON.stringify({ entries, _newGistId: result.id }),
			{ status: 200, headers: { "Content-Type": "application/json" } },
		);
	} catch (err) {
		await writeAudit("admin", "notebook.write", name ?? "unknown", "failure", rid, bindings);
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
	const name = String(params.name ?? "");
	const gists = getNotebookGists(env);
	const gistId = gists[name];

	if (!gistId) {
		return new Response(
			JSON.stringify({ code: "NOT_FOUND", message: "Notebook gist not configured" }),
			{ status: 404, headers: { "Content-Type": "application/json" } },
		);
	}

	try {
		// 清空笔记本：写入空数组而非删除 gist（保留 gist 以便复用 id）
		await gistUpdate(gistId, {
			[FILE_NAME]: { content: "[]" },
		}, env);
		await writeAudit("admin", "notebook.clear", name ?? "unknown", "success", rid, bindings);
		return new Response(null, { status: 204 });
	} catch (err) {
		await writeAudit("admin", "notebook.clear", name ?? "unknown", "failure", rid, bindings);
		return new Response(
			JSON.stringify({ code: "UPSTREAM_ERROR", message: String(err) }),
			{ status: 502, headers: { "Content-Type": "application/json" } },
		);
	}
};
