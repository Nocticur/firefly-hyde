import type { APIRoute } from "astro";
import { requireAuth } from "@/pages/api/admin/v1/_auth";
import { gistGet, gistUpdate, gistCreate } from "@/lib/admin/gist";
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

export const GET: APIRoute = async ({ request, locals }) => {
	const auth = await requireAuth(request, locals);
	if (!auth.ok) return auth.response;

	const env = getRuntimeEnvironment(locals);
	const { gistId, fileName } = getConfig(env);
	if (!gistId) {
		return new Response(JSON.stringify([]), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	}
	try {
		const gist = await gistGet(gistId, env);
		const content = gist.files[fileName]?.content ?? "[]";
		const moments = JSON.parse(content);
		return new Response(JSON.stringify(moments), {
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

export const POST: APIRoute = async ({ request, locals }) => {
	const auth = await requireAuth(request, locals);
	if (!auth.ok) return auth.response;
	const rid = crypto.randomUUID();
	const bindings = getRuntimeBindings(locals);

	const env = getRuntimeEnvironment(locals);
	const { gistId, fileName } = getConfig(env);
	const body = (await request.json()) as Record<string, unknown>;

	try {
		let moments: Record<string, unknown>[] = [];
		if (gistId) {
			const gist = await gistGet(gistId, env);
			const content = gist.files[fileName]?.content ?? "[]";
			moments = JSON.parse(content);
		}

		// 白名单字段，禁止调用方覆盖 id / 注入任意键
		const newMoment = {
			id: "moment-" + Date.now(),
			content: typeof body.content === "string" ? body.content : "",
			published: typeof body.published === "string" ? body.published : new Date().toISOString(),
			images: Array.isArray(body.images) ? body.images : [],
			tags: Array.isArray(body.tags) ? body.tags : [],
			location: typeof body.location === "string" ? body.location : "",
			pinned: typeof body.pinned === "boolean" ? body.pinned : false,
			...pickMomentFields(body),
		};
		moments.unshift(newMoment);

		const fileContent = JSON.stringify(moments, null, 2);
		if (gistId) {
			await gistUpdate(gistId, { [fileName]: { content: fileContent } }, env);
		} else {
			const result = await gistCreate("firefly-moments", {
				[fileName]: { content: fileContent },
			}, env);
			await writeAudit("admin", "moments.create", result.id, "success", rid, bindings);
			return new Response(
				JSON.stringify({ ...newMoment, _newGistId: result.id }),
				{ status: 201, headers: { "Content-Type": "application/json" } },
			);
		}

		await writeAudit("admin", "moments.create", newMoment.id, "success", rid, bindings);
		return new Response(JSON.stringify(newMoment), {
			status: 201,
			headers: { "Content-Type": "application/json" },
		});
	} catch (err) {
		await writeAudit("admin", "moments.create", "error", "failure", rid, bindings);
		return new Response(
			JSON.stringify({ code: "UPSTREAM_ERROR", message: String(err) }),
			{ status: 502, headers: { "Content-Type": "application/json" } },
		);
	}
};
