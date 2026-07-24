import type { APIRoute } from "astro";
import {
	serializeCsrfCookie,
	serializeSessionCookie,
	verifyAdminPassword,
} from "@/lib/admin/auth";
import { createSessionToken, hashToken } from "@/lib/admin/crypto";
import { checkRateLimit } from "@/lib/admin/rateLimiter";
import { writeAudit } from "@/lib/admin/audit";
import {
	getRuntimeBindings,
	getRuntimeEnvironment,
} from "@/lib/admin/storage";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
	const ip =
		request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
		"unknown";
	const rid = crypto.randomUUID();
	const bindings = getRuntimeBindings(locals);
	const runtimeEnv = getRuntimeEnvironment(locals);

	try {
		await checkRateLimit(ip, "/api/admin/v1/auth/login", 10, 60, bindings);
	} catch {
		return new Response(
			JSON.stringify({ code: "RATE_LIMITED", message: "Too many requests" }),
			{ status: 429, headers: { "Content-Type": "application/json" } },
		);
	}

	const authHeader = request.headers.get("Authorization");
	if (!authHeader || !authHeader.startsWith("Basic ")) {
		return new Response(
			JSON.stringify({ code: "UNAUTHORIZED", message: "Missing credentials" }),
			{ status: 401, headers: { "Content-Type": "application/json" } },
		);
	}

	const decoded = atob(authHeader.slice(6));
	const [username, password] = decoded.split(":");

	const adminUser = String(
		runtimeEnv.ADMIN_USERNAME ?? import.meta.env.ADMIN_USERNAME ?? "",
	);
	const adminPasswordHash = String(
		runtimeEnv.ADMIN_PASSWORD_HASH ?? import.meta.env.ADMIN_PASSWORD_HASH ?? "",
	);
	const legacyPassword = String(
		runtimeEnv.ADMIN_PASSWORD ?? import.meta.env.ADMIN_PASSWORD ?? "",
	);
	const validPassword = adminPasswordHash
		? await verifyAdminPassword(password, adminPasswordHash)
		: Boolean(legacyPassword) &&
			(await hashToken(password)) === (await hashToken(legacyPassword));

	if (username !== adminUser || !validPassword) {
		await writeAudit("admin", "auth.login", "auth", "failure", rid, bindings);
		return new Response(
			JSON.stringify({ code: "UNAUTHORIZED", message: "Invalid credentials" }),
			{ status: 401, headers: { "Content-Type": "application/json" } },
		);
	}

	const { token, expiresAt } = await createSessionToken(bindings);
	const csrfToken = crypto.randomUUID();
	await writeAudit("admin", "auth.login", "auth", "success", rid, bindings);
	const headers = new Headers({ "Content-Type": "application/json" });
	headers.append("Set-Cookie", serializeSessionCookie(token, 86400));
	headers.append("Set-Cookie", serializeCsrfCookie(csrfToken, 86400));

	return new Response(
		JSON.stringify({ actor: "admin", expiresAt, csrfToken, expires_in: 86400 }),
		{
		status: 200,
		headers,
		},
	);
};
