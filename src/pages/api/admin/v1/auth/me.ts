import type { APIRoute } from "astro";
import { getSessionToken, parseCookies, CSRF_COOKIE } from "@/lib/admin/auth";
import { validateSession } from "@/lib/admin/crypto";
import { getRuntimeBindings } from "@/lib/admin/storage";

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
	const token = getSessionToken(request);
	if (!token) {
		return new Response(
			JSON.stringify({ code: "UNAUTHORIZED", message: "Missing token" }),
			{ status: 401, headers: { "Content-Type": "application/json" } },
		);
	}
	const { valid, expiresAt } = await validateSession(
		token,
		getRuntimeBindings(locals),
	);
	if (!valid) {
		return new Response(
			JSON.stringify({ code: "UNAUTHORIZED", message: "Invalid session" }),
			{ status: 401, headers: { "Content-Type": "application/json" } },
		);
	}
	const csrfToken = parseCookies(request.headers.get("Cookie"))[CSRF_COOKIE] ?? "";
	return new Response(JSON.stringify({ actor: "admin", expiresAt, csrfToken }), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
};
