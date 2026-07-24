import type { APIRoute } from "astro";
import {
	clearCsrfCookie,
	clearSessionCookie,
	getSessionToken,
	isCsrfRequestValid,
} from "@/lib/admin/auth";
import { deleteSession } from "@/lib/admin/crypto";
import { getRuntimeBindings } from "@/lib/admin/storage";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
	const token = getSessionToken(request);
	if (!token) {
		return new Response(null, { status: 204 });
	}
	if (!isCsrfRequestValid(request)) {
		return new Response(
			JSON.stringify({ code: "FORBIDDEN", message: "Invalid CSRF token" }),
			{ status: 403, headers: { "Content-Type": "application/json" } },
		);
	}
	await deleteSession(token, getRuntimeBindings(locals));
	const headers = new Headers();
	headers.append("Set-Cookie", clearSessionCookie());
	headers.append("Set-Cookie", clearCsrfCookie());
	return new Response(null, { status: 204, headers });
};
