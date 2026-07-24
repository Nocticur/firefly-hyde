import type { APIRoute } from "astro";
import type { ResourceDescriptor } from "@/lib/admin/contracts";
import { getResourceDescriptor } from "@/lib/admin/resourceRegistry";
import { requireAuth } from "@/pages/api/admin/v1/_auth";
import { writeAudit } from "@/lib/admin/audit";
import { getRuntimeBindings, getRuntimeEnvironment } from "@/lib/admin/storage";
import { gistGet, gistUpdate, gistCreate } from "@/lib/admin/gist";
import { decodeGitFile, encodeBase64Utf8, safeResourcePath } from "@/lib/admin/gitContent";
import { githubFetch } from "@/lib/admin/githubClient";

export const prerender = false;

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

function githubPath(path: string): string {
	return path.split("/").map((part) => encodeURIComponent(part)).join("/");
}

async function gitPut(
	descriptor: ResourceDescriptor,
	itemId: string | undefined,
	payload: Record<string, unknown>,
	sha: string | undefined,
	message: string | undefined,
	env: Record<string, unknown>,
): Promise<{ revision: string }> {
	const relative = String(itemId ?? payload.id ?? "");
	const singleFile = /\.(?:ts|tsx|json|jsonc|html|md|mdx)$/i.test(descriptor.path ?? "");
	const path = descriptor.source === "git-jsonc" || (descriptor.source === "git-config" && singleFile)
		? descriptor.path ?? ""
		: safeResourcePath(descriptor.path ?? "", relative);
	const branch = String(env.GITHUB_BRANCH ?? process.env.GITHUB_BRANCH ?? "main");
	if (itemId) {
		// 更新：先 GET 比对 sha，避免 stale write
		const getResp = await githubFetch(`contents/${githubPath(path)}`, undefined, env);
		const getData = await getResp.json();
		if (!getResp.ok) throw new Error(`GitHub GET failed: ${getResp.status}`);
		const current = decodeGitFile(getData as { name: string; path: string; sha: string; content?: string });
		if (sha && current.sha !== sha) {
			throw new Error(`CONFLICT: File changed since it was loaded (expected ${sha}, got ${current.sha})`);
		}
		const resp = await githubFetch(`contents/${githubPath(path)}`, {
			method: "PUT",
			body: JSON.stringify({
				message: message || `Update ${descriptor.id}: ${relative}`,
				content: encodeBase64Utf8(String(payload.content ?? "")),
				sha: current.sha,
				branch,
			}),
		}, env);
		const result = await resp.json();
		if (!resp.ok) throw new Error(`GitHub update failed: ${resp.status}`);
		return { revision: (result as { content?: { sha?: string } }).content?.sha ?? "" };
	}
	// 新建
	const resp = await githubFetch(`contents/${githubPath(path)}`, {
		method: "PUT",
		body: JSON.stringify({
			message: message || `Create ${descriptor.id}: ${relative}`,
			content: encodeBase64Utf8(String(payload.content ?? "")),
			branch,
		}),
	}, env);
	const result = await resp.json();
	if (!resp.ok) throw new Error(`GitHub create failed: ${resp.status}`);
	return { revision: (result as { content?: { sha?: string } }).content?.sha ?? "" };
}

const MOMENT_FIELDS = ["content", "published", "images", "tags", "location", "pinned"] as const;

function pickMomentFields(payload: Record<string, unknown>): Record<string, unknown> {
	const allowed: Record<string, unknown> = {};
	for (const key of MOMENT_FIELDS) {
		if (key in payload) allowed[key] = payload[key];
	}
	return allowed;
}

async function gistPut(
	descriptor: ResourceDescriptor,
	itemId: string | undefined,
	payload: Record<string, unknown>,
	env: Record<string, unknown>,
): Promise<{ revision: string; newGistId?: string }> {
	if (descriptor.id === "moments") {
		const gistId = String(env.MOMENTS_GIST_ID ?? process.env.MOMENTS_GIST_ID ?? "");
		const fileName = String(env.MOMENTS_FILE_NAME ?? process.env.MOMENTS_FILE_NAME ?? "moments.json");
		const list = await (gistId
			? gistGet(gistId, env).then((g) => JSON.parse(g.files[fileName]?.content ?? "[]"))
			: Promise.resolve([])) as Record<string, unknown>[];
		if (itemId) {
			const idx = list.findIndex((m) => m.id === itemId);
			if (idx === -1) throw new Error("NOT_FOUND: Moment not found");
			// 白名单字段，禁止覆盖 id
			list[idx] = { ...list[idx], ...pickMomentFields(payload), id: list[idx].id };
		} else {
			list.unshift({ id: `moment-${Date.now()}`, ...pickMomentFields(payload) });
		}
		const fileContent = JSON.stringify(list, null, 2);
		if (gistId) {
			await gistUpdate(gistId, { [fileName]: { content: fileContent } }, env);
			return { revision: gistId };
		}
		const created = await gistCreate("firefly-moments", { [fileName]: { content: fileContent } }, env);
		return { revision: created.id, newGistId: created.id };
	}
	if (descriptor.id === "notebooks") {
		const gists = (() => {
			try {
				return JSON.parse(String(env.NOTEBOOK_GISTS_JSON ?? process.env.NOTEBOOK_GISTS_JSON ?? "{}")) as Record<string, string>;
			} catch {
				return {};
			}
		})();
		const name = String(itemId ?? payload.name ?? "");
		const gistId = gists[name];
		const FILE_NAME = "notebooks-entries.json";
		const entries = Array.isArray(payload.entries) ? payload.entries : [];
		const fileContent = JSON.stringify(entries, null, 2);
		if (gistId) {
			await gistUpdate(gistId, { [FILE_NAME]: { content: fileContent } }, env);
			return { revision: gistId };
		}
		const created = await gistCreate(`firefly-notebook:${name}`, { [FILE_NAME]: { content: fileContent } }, env);
		return { revision: created.id, newGistId: created.id };
	}
	throw new Error(`FORBIDDEN: ${descriptor.id} does not support gist publish`);
}

export const POST: APIRoute = async ({ request, locals }) => {
	const auth = await requireAuth(request, locals);
	if (!auth.ok) return auth.response;
	const rid = crypto.randomUUID();
	const bindings = getRuntimeBindings(locals);
	const body = (await request.json()) as {
		resourceId?: string;
		itemId?: string;
		payload?: Record<string, unknown>;
		baseRevision?: { value?: string };
		message?: string;
	};
	const descriptor = getResourceDescriptor(body.resourceId ?? "");
	if (!descriptor || !body.payload) {
		await writeAudit("admin", "publish", body.resourceId ?? "unknown", "failure", rid, bindings);
		return json({ code: "BAD_REQUEST", message: "resourceId and payload are required" }, 400);
	}
	const env = getRuntimeEnvironment(locals);
	const mode = descriptor.source === "gist" ? "gist" : "git";
	try {
		let result: { revision: string; newGistId?: string };
		if (descriptor.source === "gist") {
			result = await gistPut(descriptor, body.itemId, body.payload, env);
		} else {
			result = await gitPut(
				descriptor,
				body.itemId,
				body.payload,
				body.baseRevision?.value,
				body.message,
				env,
			);
		}
		await writeAudit("admin", `publish:${descriptor.id}`, body.itemId ?? "new", "success", rid, bindings);
		return json({
			mode,
			revision: { type: mode, value: result.revision },
			newGistId: result.newGistId,
		});
	} catch (error) {
		await writeAudit("admin", `publish:${descriptor.id}`, body.itemId ?? "new", "failure", rid, bindings);
		const message = String(error);
		const status = message.startsWith("CONFLICT") ? 409
			: message.startsWith("NOT_FOUND") ? 404
			: message.startsWith("FORBIDDEN") ? 403
			: 502;
		const code = status === 502 ? "UPSTREAM_ERROR" : message.split(":")[0];
		return json({ code, message }, status);
	}
};
