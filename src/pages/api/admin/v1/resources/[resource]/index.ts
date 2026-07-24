import type { APIRoute } from "astro";
import { getResourceDescriptor } from "@/lib/admin/resourceRegistry";
import { decodeGitFile, encodeBase64Utf8, listGitFiles, safeResourcePath } from "@/lib/admin/gitContent";
import { githubFetch } from "@/lib/admin/githubClient";
import { getRuntimeEnvironment } from "@/lib/admin/storage";
import { requireAuth } from "@/pages/api/admin/v1/_auth";

export const prerender = false;

function githubPath(path: string): string {
	return path
		.split("/")
		.map((part) => encodeURIComponent(part))
		.join("/");
}


function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

export const GET: APIRoute = async ({ request, locals, params }) => {
	const auth = await requireAuth(request, locals);
	if (!auth.ok) return auth.response;
	const descriptor = getResourceDescriptor(params.resource ?? "");
	if (!descriptor) return json({ code: "NOT_FOUND", message: "Resource not found" }, 404);
	if (descriptor.source === "gist" || descriptor.source === "media") {
		return json({ items: [], total: 0, source: descriptor.source });
	}
	const env = getRuntimeEnvironment(locals);
	const resourcePath = descriptor.path ?? "";
	try {
		const files = await listGitFiles(resourcePath, env);
		if (files.length === 1 && files[0].type !== "dir" && files[0].content !== undefined) {
			const file = decodeGitFile(files[0] as { name: string; path: string; sha: string; content?: string });
			return json({ items: [{ id: file.name, path: file.path, sha: file.sha, content: file.content }], total: 1 });
		}
		const items = files
			.filter((item) => item.type === "file")
			.filter((item) => /\.(md|mdx)$/i.test(String(item.name)) || descriptor.source === "git-jsonc" || descriptor.source === "git-config")
			.map((item) => ({
				id: String(item.path).slice(resourcePath.length + 1),
				name: String(item.name),
				path: String(item.path),
				sha: String(item.sha),
			}));
		return json({ items, total: items.length, source: descriptor.source });
	} catch (error) {
		return json({ code: "UPSTREAM_ERROR", message: String(error) }, 502);
	}
};

export const POST: APIRoute = async ({ request, locals, params }) => {
	const auth = await requireAuth(request, locals);
	if (!auth.ok) return auth.response;
	const descriptor = getResourceDescriptor(params.resource ?? "");
	if (!descriptor || descriptor.source !== "git-markdown") {
		return json({ code: "FORBIDDEN", message: "Resource does not support creation" }, 403);
	}
	const body = (await request.json()) as {
		id?: string;
		content?: string;
		message?: string;
	};
	if (!body.id || body.content === undefined) {
		return json({ code: "BAD_REQUEST", message: "id and content are required" }, 400);
	}
	const relative = body.id.endsWith(".md") || body.id.endsWith(".mdx") ? body.id : `${body.id}.md`;
	const path = safeResourcePath(descriptor.path ?? "", relative);
	const env = getRuntimeEnvironment(locals);
	try {
		const response = await githubFetch(`contents/${githubPath(path)}`, {
			method: "PUT",
			body: JSON.stringify({
				message: body.message || `Create ${params.resource}: ${relative}`,
				content: encodeBase64Utf8(body.content),
				branch: env.GITHUB_BRANCH ?? process.env.GITHUB_BRANCH ?? "main",
			}),
		}, env);
		const result = await response.json();
		if (!response.ok) return json({ code: "UPSTREAM_ERROR", message: "GitHub create failed", details: result }, response.status);
		return json({ id: relative, revision: (result as { content?: { sha?: string } }).content?.sha ?? "" }, 201);
	} catch (error) {
		return json({ code: "UPSTREAM_ERROR", message: String(error) }, 502);
	}
};
