import assert from "node:assert/strict";
import test from "node:test";
import {
	getSessionToken,
	isCsrfRequestValid,
	parseCookies,
	serializeCsrfCookie,
	serializeSessionCookie,
	verifyAdminPassword,
} from "./auth";

test("parses encoded cookie values", () => {
	assert.deepEqual(parseCookies("session_token=a%2Fb; admin_csrf=token-1"), {
		session_token: "a/b",
		admin_csrf: "token-1",
	});
});

test("session cookie takes precedence over bearer compatibility token", () => {
	const request = new Request("https://example.com/api", {
		headers: {
			Cookie: "session_token=cookie-token",
			Authorization: "Bearer bearer-token",
		},
	});
	assert.equal(getSessionToken(request), "cookie-token");
});

test("unsafe requests require a matching csrf cookie and header", () => {
	const valid = new Request("https://example.com/api", {
		method: "POST",
		headers: { Cookie: "admin_csrf=csrf-value", "X-CSRF-Token": "csrf-value" },
	});
	const invalid = new Request("https://example.com/api", {
		method: "POST",
		headers: { Cookie: "admin_csrf=csrf-value", "X-CSRF-Token": "different" },
	});
	assert.equal(isCsrfRequestValid(valid), true);
	assert.equal(isCsrfRequestValid(invalid), false);
	assert.equal(isCsrfRequestValid(new Request("https://example.com/api")), true);
});

test("auth cookies use strict secure attributes", () => {
	const session = serializeSessionCookie("token", 3600);
	const csrf = serializeCsrfCookie("csrf", 3600);
	for (const cookie of [session, csrf]) {
		assert.match(cookie, /Secure/);
		assert.match(cookie, /SameSite=Strict/);
		assert.match(cookie, /Path=\//);
	}
	assert.match(session, /HttpOnly/);
	assert.doesNotMatch(csrf, /HttpOnly/);
});

test("verifies a sha256 admin password without exposing the password", async () => {
	assert.equal(
		await verifyAdminPassword(
			"correct horse battery staple",
			"c4bbcb1fbec99d65bf59d85c8cb62ee2db963f0fe106f483d9afa73bd4e39a8a",
		),
		true,
	);
	assert.equal(
		await verifyAdminPassword(
			"wrong",
			"c4bbcb1fbec99d65bf59d85c8cb62ee2db963f0fe106f483d9afa73bd4e39a8a",
		),
		false,
	);
});
