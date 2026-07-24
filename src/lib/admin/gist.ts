const API = "https://api.github.com";

function getGistToken(env?: Record<string, unknown>): string {
	const value = env?.GITHUB_GIST_TOKEN ?? env?.GITHUB_TOKEN ?? process.env.GITHUB_GIST_TOKEN ?? process.env.GITHUB_TOKEN ?? "";
	return typeof value === "string" ? value : "";
}

export async function gistGet(
	gistId: string,
	env?: Record<string, unknown>,
): Promise<{ files: Record<string, { content: string }> }> {
	const token = getGistToken(env);
	const r = await fetch(`${API}/gists/${gistId}`, {
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: "application/vnd.github+json",
		},
	});
	if (!r.ok) throw new Error(`Gist GET failed: ${r.status}`);
	return r.json() as Promise<{ files: Record<string, { content: string }> }>;
}

export async function gistUpdate(
	gistId: string,
	files: Record<string, { content: string }>,
	env?: Record<string, unknown>,
): Promise<void> {
	const token = getGistToken(env);
	const r = await fetch(`${API}/gists/${gistId}`, {
		method: "PATCH",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ files }),
	});
	if (!r.ok) throw new Error(`Gist PATCH failed: ${r.status}`);
}

export async function gistCreate(
	description: string,
	files: Record<string, { content: string }>,
	env?: Record<string, unknown>,
): Promise<{ id: string }> {
	const token = getGistToken(env);
	const r = await fetch(`${API}/gists`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ description, public: false, files }),
	});
	if (!r.ok) throw new Error(`Gist POST failed: ${r.status}`);
	return r.json() as Promise<{ id: string }>;
}
