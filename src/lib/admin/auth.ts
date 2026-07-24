const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export const SESSION_COOKIE = "session_token";
export const CSRF_COOKIE = "admin_csrf";

export function parseCookies(header: string | null): Record<string, string> {
	if (!header) return {};
	const result: Record<string, string> = {};
	for (const part of header.split(";")) {
		const separator = part.indexOf("=");
		if (separator < 0) continue;
		const key = part.slice(0, separator).trim();
		const rawValue = part.slice(separator + 1).trim();
		if (!key) continue;
		try {
			result[key] = decodeURIComponent(rawValue);
		} catch {
			result[key] = rawValue;
		}
	}
	return result;
}

export function getSessionToken(request: Request): string {
	const cookies = parseCookies(request.headers.get("Cookie"));
	if (cookies[SESSION_COOKIE]) return cookies[SESSION_COOKIE];
	const authorization = request.headers.get("Authorization");
	return authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
}

function secureEqual(left: string, right: string): boolean {
	if (!left || left.length !== right.length) return false;
	let difference = 0;
	for (let index = 0; index < left.length; index++) {
		difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
	}
	return difference === 0;
}

export async function verifyAdminPassword(
	password: string,
	expectedHash: string,
): Promise<boolean> {
	if (!password || !/^[a-f\d]{64}$/i.test(expectedHash)) return false;
	const digest = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(password),
	);
	const actualHash = Array.from(new Uint8Array(digest))
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
	return secureEqual(actualHash, expectedHash.toLowerCase());
}

export function isCsrfRequestValid(request: Request): boolean {
	if (SAFE_METHODS.has(request.method.toUpperCase())) return true;
	const cookieToken = parseCookies(request.headers.get("Cookie"))[CSRF_COOKIE] ?? "";
	const headerToken = request.headers.get("X-CSRF-Token") ?? "";
	return secureEqual(cookieToken, headerToken);
}

function serializeCookie(
	name: string,
	value: string,
	maxAge: number,
	httpOnly: boolean,
): string {
	return [
		`${name}=${encodeURIComponent(value)}`,
		"Path=/",
		`Max-Age=${maxAge}`,
		"Secure",
		"SameSite=Strict",
		httpOnly ? "HttpOnly" : "",
	]
		.filter(Boolean)
		.join("; ");
}

export function serializeSessionCookie(token: string, maxAge: number): string {
	return serializeCookie(SESSION_COOKIE, token, maxAge, true);
}

export function serializeCsrfCookie(token: string, maxAge: number): string {
	return serializeCookie(CSRF_COOKIE, token, maxAge, false);
}

export function clearSessionCookie(): string {
	return serializeSessionCookie("", 0);
}

export function clearCsrfCookie(): string {
	return serializeCsrfCookie("", 0);
}
