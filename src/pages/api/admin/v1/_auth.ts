import { getSessionToken, isCsrfRequestValid } from "@/lib/admin/auth";
import { validateSession } from "@/lib/admin/crypto";
import { getRuntimeBindings } from "@/lib/admin/storage";

export async function requireAuth(
	request: Request,
	locals?: unknown,
): Promise<{ ok: true } | { ok: false; response: Response }> {
	const token = getSessionToken(request);
	if (!token) {
		return {
			ok: false,
			response: new Response(
				JSON.stringify({ code: "UNAUTHORIZED", message: "Missing token" }),
				{ status: 401, headers: { "Content-Type": "application/json" } },
			),
		};
	}
	if (!isCsrfRequestValid(request)) {
		return {
			ok: false,
			response: new Response(
				JSON.stringify({ code: "FORBIDDEN", message: "Invalid CSRF token" }),
				{ status: 403, headers: { "Content-Type": "application/json" } },
			),
		};
	}
	const { valid } = await validateSession(token, getRuntimeBindings(locals));
	if (!valid) {
		return {
			ok: false,
			response: new Response(
				JSON.stringify({ code: "UNAUTHORIZED", message: "Invalid session" }),
				{ status: 401, headers: { "Content-Type": "application/json" } },
			),
		};
	}
	return { ok: true };
}
