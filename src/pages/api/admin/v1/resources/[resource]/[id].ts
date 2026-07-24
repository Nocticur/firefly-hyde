import type { APIRoute } from "astro";
import { getResourceDescriptor } from "@/lib/admin/resourceRegistry";
import { decodeGitFile, encodeBase64Utf8, safeResourcePath } from "@/lib/admin/gitContent";
import { githubFetch } from "@/lib/admin/githubClient";
import { getRuntimeEnvironment } from "@/lib/admin/storage";
import { requireAuth } from "@/pages/api/admin/v1/_auth";

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

async function getFile(path: string, env: Record<string, unknown>) {
	const response = await githubFetch(`contents/${githubPath(path)}`, undefined, env);
	const data = await response.json();
	if (!response.ok) throw new Error(`GitHub GET failed: ${response.status}`);
	return decodeGitFile(data as { name: string; path: string; sha: string; content?: string });
}

export const GET: APIRoute = async ({ request, locals, params }) => {
	const auth = await requireAuth(request, locals);
	if (!auth.ok) return auth.response;
	const descriptor = getResourceDescriptor(params.resource ?? "");
	if (!descriptor || descriptor.source === "gist" || descriptor.source === "media") {
		return json({ code: "NOT_FOUND", message: "Resource item not found" }, 404);
	}
	const relative = decodeURIComponent(params.id ?? "");
	const singleFile = /\.(?:ts|tsx|json|jsonc|html|md|mdx)$/i.test(descriptor.path ?? "");
	const path = descriptor.source === "git-jsonc" || (descriptor.source === "git-config" && singleFile)
		? descriptor.path ?? ""
		: safeResourcePath(descriptor.path ?? "", relative);
	try {
		const file = await getFile(path, getRuntimeEnvironment(locals));
		return json({ id: relative, path: file.path, sha: file.sha, content: file.content });
	} catch (error) {
		return json({ code: "UPSTREAM_ERROR", message: String(error) }, 502);
	}
};

export const PUT: APIRoute = async ({ request, locals, params }) => {
	const auth = await requireAuth(request, locals);
	if (!auth.ok) return auth.response;
	const descriptor = getResourceDescriptor(params.resource ?? "");
	if (!descriptor || descriptor.source === "gist" || descriptor.source === "media") {
		return json({ code: "FORBIDDEN", message: "Resource does not support Git updates" }, 403);
	}
	const body = (await request.json()) as { content?: string; sha?: string; message?: string };
	if (body.content === undefined || !body.sha) {
		return json({ code: "BAD_REQUEST", message: "content and sha are required" }, 400);
	}
	const relative = decodeURIComponent(params.id ?? "");
	const singleFile = /\.(?:ts|tsx|json|jsonc|html|md|mdx)$/i.test(descriptor.path ?? "");
	const path = descriptor.source === "git-jsonc" || (descriptor.source === "git-config" && singleFile)
		? descriptor.path ?? ""
		: safeResourcePath(descriptor.path ?? "", relative);
	const env = getRuntimeEnvironment(locals);
	try {
		const current = await getFile(path, env);
		if (current.sha !== body.sha) {
			return json({ code: "CONFLICT", message: "File changed since it was loaded", currentSha: current.sha }, 409);
		}
		const response = await githubFetch(`contents/${githubPath(path)}`, {
			method: "PUT",
			body: JSON.stringify({
				message: body.message || `Update ${params.resource}: ${relative}`,
				content: encodeBase64Utf8(body.content),
				sha: body.sha,
				branch: env.GITHUB_BRANCH ?? process.env.GITHUB_BRANCH ?? "main",
			}),
		}, env);
		const result = await response.json();
		if (!response.ok) return json({ code: "UPSTREAM_ERROR", message: "GitHub update failed", details: result }, response.status);
		return json({ id: relative, revision: (result as { content?: { sha?: string } }).content?.sha ?? "" });
	} catch (error) {
		return json({ code: "UPSTREAM_ERROR", message: String(error) }, 502);
	}
};

export const DELETE: APIRoute = async ({ request, locals, params }) => {
	const auth = await requireAuth(request, locals);
	if (!auth.ok) return auth.response;
	const descriptor = getResourceDescriptor(params.resource ?? "");
	if (!descriptor || descriptor.source !== "git-markdown" || !descriptor.capabilities.delete) {
		return json({ code: "FORBIDDEN", message: "Resource does not support deletion" }, 403);
	}
	const body = (await request.json()) as { sha?: string; message?: string };
	if (!body.sha) return json({ code: "BAD_REQUEST", message: "sha is required" }, 400);
	const relative = decodeURIComponent(params.id ?? "");
	const path = safeResourcePath(descriptor.path ?? "", relative);
	const env = getRuntimeEnvironment(locals);
	try {
		const current = await getFile(path, env);
		if (current.sha !== body.sha) {
			return json({ code: "CONFLICT", message: "File changed since it was loaded", currentSha: current.sha }, 409);
		}
		const response = await githubFetch(`contents/${githubPath(path)}`, {
			method: "DELETE",
			body: JSON.stringify({
				message: body.message || `Delete ${params.resource}: ${relative}`,
				sha: body.sha,
				branch: env.GITHUB_BRANCH ?? process.env.GITHUB_BRANCH ?? "main",
			}),
		}, env);
		if (!response.ok) return json({ code: "UPSTREAM_ERROR", message: "GitHub delete failed" }, response.status);
		return new Response(null, { status: 204 });
	} catch (error) {
		return json({ code: "UPSTREAM_ERROR", message: String(error) }, 502);
	}
};
