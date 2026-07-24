let csrfToken = "";

export function setCsrfToken(value: string): void {
	csrfToken = value;
}

export async function adminFetch<T>(
	path: string,
	init: RequestInit = {},
): Promise<T> {
	const method = (init.method ?? "GET").toUpperCase();
	const headers = new Headers(init.headers);
	if (!["GET", "HEAD", "OPTIONS"].includes(method) && csrfToken) {
		headers.set("X-CSRF-Token", csrfToken);
	}
	const response = await fetch(`/api/admin/v1/${path.replace(/^\/+/, "")}`, {
		...init,
		headers,
		credentials: "same-origin",
	});
	if (!response.ok) {
		const body = (await response.json().catch(() => null)) as {
			message?: string;
			code?: string;
		} | null;
		throw new Error(body?.message ?? `请求失败 (${response.status})`);
	}
	if (response.status === 204) return undefined as T;
	return response.json() as Promise<T>;
}
