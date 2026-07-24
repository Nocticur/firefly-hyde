const SESSION_DURATION = 86400; // 24 hours

import { createAdminStore, type RuntimeBindings } from "./storage";

export async function hashToken(token: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(token);
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createSessionToken(
	bindings: RuntimeBindings = {},
): Promise<{
	token: string;
	expiresAt: number;
}> {
	const token = crypto.randomUUID();
	const tokenHash = await hashToken(token);
	const now = Math.floor(Date.now() / 1000);
	const expiresAt = now + SESSION_DURATION;
	await createAdminStore(bindings).createSession(tokenHash, expiresAt);
	return { token, expiresAt };
}

export async function validateSession(
	token: string,
	bindings: RuntimeBindings = {},
): Promise<{ valid: boolean; expiresAt: number | null }> {
	const tokenHash = await hashToken(token);
	return createAdminStore(bindings).validateSession(tokenHash);
}

export async function deleteSession(
	token: string,
	bindings: RuntimeBindings = {},
): Promise<void> {
	const tokenHash = await hashToken(token);
	await createAdminStore(bindings).deleteSession(tokenHash);
}

export const createSessionTokenLocal: typeof createSessionToken = createSessionToken;
export const validateSessionLocal: typeof validateSession = validateSession;
export const deleteSessionLocal: typeof deleteSession = deleteSession;
