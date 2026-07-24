import type { APIRoute } from "astro";
import { githubFetch } from "@/lib/admin/githubClient";
import { getRuntimeEnvironment } from "@/lib/admin/storage";
import { requireAuth } from "@/pages/api/admin/v1/_auth";

export const prerender = false;

export const GET: APIRoute = async ({ request, locals, params }) => {
	const auth = await requireAuth(request, locals);
	if (!auth.ok) return auth.response;
	const sha = params.sha;
	if (!sha) return new Response(JSON.stringify({ code: "BAD_REQUEST", message: "sha is required" }), { status: 400 });
	const env = getRuntimeEnvironment(locals);
	try {
		const response = await githubFetch(`commits/${encodeURIComponent(sha)}/check-runs?per_page=20`, undefined, env);
		const data = (await response.json()) as { check_runs?: Array<{ name: string; status: string; conclusion: string | null; html_url?: string }> };
		if (!response.ok) {
			return new Response(JSON.stringify({ code: "UPSTREAM_ERROR", message: "Unable to read deployment checks" }), { status: response.status, headers: { "Content-Type": "application/json" } });
		}
		const checks = data.check_runs ?? [];
		const failed = checks.some((check) => check.conclusion === "failure");
		const running = checks.some((check) => check.status !== "completed");
		const state = failed ? "failure" : running ? "in_progress" : checks.length ? "success" : "queued";
		return new Response(JSON.stringify({ sha, state, checks }), { status: 200, headers: { "Content-Type": "application/json" } });
	} catch (error) {
		return new Response(JSON.stringify({ code: "UPSTREAM_ERROR", message: String(error) }), { status: 502, headers: { "Content-Type": "application/json" } });
	}
};
