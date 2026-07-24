function bytesToBinary(bytes: Uint8Array): string {
	let binary = "";
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return binary;
}

export function encodeBase64Utf8(value: string): string {
	return btoa(bytesToBinary(new TextEncoder().encode(value)));
}

export function decodeBase64Utf8(value: string): string {
	const binary = atob(value.replace(/\s/g, ""));
	const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
	return new TextDecoder().decode(bytes);
}

export function safeResourcePath(root: string, relativePath: string): string {
	const normalizedRoot = root.replace(/\\/g, "/").replace(/\/+$/, "");
	const normalizedRelative = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
	const candidate = `${normalizedRoot}/${normalizedRelative}`;
	const segments = candidate.split("/");
	const rootDepth = normalizedRoot.split("/").filter(Boolean).length;
	let depth = rootDepth;
	for (const segment of segments.slice(rootDepth)) {
		if (!segment || segment === ".") continue;
		if (segment === "..") depth--;
		else depth++;
		if (depth < rootDepth) throw new Error("Path traversal is not allowed");
	}
	if (/^[a-zA-Z]:|^\/\//.test(normalizedRelative)) {
		throw new Error("Path traversal is not allowed");
	}
	return candidate;
}

export interface GitContentFile {
	name: string;
	path: string;
	sha: string;
	content?: string;
	type?: "file" | "dir";
}

export function decodeGitFile(file: GitContentFile): GitContentFile & { content: string } {
	return { ...file, content: decodeBase64Utf8(file.content ?? "") };
}

function githubPath(path: string): string {
	return path.split("/").map((part) => encodeURIComponent(part)).join("/");
}

// 单目录请求的退避重试：处理 GitHub 403/429 次级限流
async function githubContentsWithRetry(
	root: string,
	env: Record<string, unknown>,
	maxRetries = 3,
): Promise<Response> {
	const urlPath = `contents/${githubPath(root)}`;
	let lastError: unknown;
	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		const response = await githubFetch(urlPath, undefined, env);
		// 403/429 视为限流，退避后重试；其余状态立即返回
		if (response.status !== 403 && response.status !== 429) return response;
		lastError = new Error(`GitHub rate-limited: ${response.status}`);
		// 指数退避：500ms / 1s / 2s，加抖动避免雪崩
		const backoff = 500 * 2 ** attempt + Math.floor(Math.random() * 200);
		await new Promise((resolve) => setTimeout(resolve, backoff));
	}
	throw lastError;
}

async function listGitDir(
	root: string,
	env: Record<string, unknown>,
	remaining: number,
): Promise<Array<Record<string, unknown>>> {
	const response = await githubContentsWithRetry(root, env);
	const result = await response.json();
	if (!response.ok) throw new Error(`GitHub contents request failed: ${response.status}`);
	if (!Array.isArray(result)) return [result as Record<string, unknown>];
	return result as Array<Record<string, unknown>>;
}

// 并发节流：避免一次展开过多子目录触发 GitHub 次级限流
const MAX_CONCURRENT_DIRS = 4;

export async function listGitFiles(
	root: string,
	env: Record<string, unknown>,
	remaining = 1000,
): Promise<Array<Record<string, unknown>>> {
	if (remaining <= 0) return [];
	const top = await listGitDir(root, env, remaining);
	if (top.length === 1 && top[0].type !== "dir" && top[0].content !== undefined) {
		return top;
	}
	const files: Array<Record<string, unknown>> = [];
	const dirs: Array<{ path: string }> = [];
	for (const item of top) {
		if (files.length >= remaining) break;
		if (item.type === "dir") dirs.push({ path: String(item.path) });
		else files.push(item);
	}
	// 子目录按 MAX_CONCURRENT_DIRS 分批串行批内并发，避免 GitHub 限流
	for (let i = 0; i < dirs.length; i += MAX_CONCURRENT_DIRS) {
		if (files.length >= remaining) break;
		const batch = dirs.slice(i, i + MAX_CONCURRENT_DIRS);
		const budget = remaining - files.length;
		const results = await Promise.all(
			batch.map((dir) => listGitFiles(String(dir.path), env, budget).catch(() => [])),
		);
		for (const sub of results) {
			for (const item of sub) {
				if (files.length >= remaining) break;
				files.push(item);
			}
		}
	}
	return files;
}
import { githubFetch } from "./githubClient";
