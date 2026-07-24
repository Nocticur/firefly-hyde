// Astro 7 把 .env 变量注入 import.meta.env（非 process.env），
// lib 模块需读 import.meta.env 才能在 dev server 下取到凭据
function getEnv(key: string, env?: Record<string, unknown>): string {
	const fromEnv = env?.[key];
	if (typeof fromEnv === "string" && fromEnv) return fromEnv;
	const fromProcess = process.env[key];
	if (typeof fromProcess === "string" && fromProcess) return fromProcess;
	// import.meta.env 在 SSR 运行时由 Astro 注入
	const fromImportMeta = (import.meta as { env?: Record<string, unknown> }).env?.[key];
	if (typeof fromImportMeta === "string" && fromImportMeta) return fromImportMeta;
	return "";
}

function requireEnv(key: string, env?: Record<string, unknown>): string {
	const val = getEnv(key, env);
	if (!val) throw new Error(`Missing env: ${key}`);
	return val;
}

// GitHub Contents API 与 Gist API 共用同一类凭据：token 互为兜底，
// 避免 dev server 下因 Astro env 加载差异导致 git 链 502 而 gist 链正常的不对称失败
function resolveGitToken(env?: Record<string, unknown>): string {
	const token = getEnv("GITHUB_TOKEN", env) || getEnv("GITHUB_GIST_TOKEN", env);
	if (!token) throw new Error("Missing env: GITHUB_TOKEN (or GITHUB_GIST_TOKEN)");
	return token;
}

export function githubFetch(
	urlPath: string,
	init?: RequestInit,
	env?: Record<string, unknown>,
): Promise<Response> {
	const owner = requireEnv("GITHUB_OWNER", env);
	const repo = requireEnv("GITHUB_REPO", env);
	const token = resolveGitToken(env);
	const fullUrl = `https://api.github.com/repos/${owner}/${repo}/${urlPath}`;
	const headers: Record<string, string> = {
		Accept: "application/vnd.github+json",
		Authorization: `Bearer ${token}`,
		"X-GitHub-Api-Version": "2022-11-28",
		...(init?.headers as Record<string, string> ?? {}),
	};
	return fetch(fullUrl, { ...init, headers });
}
