import type { APIRoute } from "astro";
import { requireAuth } from "@/pages/api/admin/v1/_auth";
import { getRuntimeEnvironment } from "@/lib/admin/storage";

export const prerender = false;

function getNotebookGists(env: Record<string, unknown>): Record<string, string> {
	try {
		return JSON.parse(String(env.NOTEBOOK_GISTS_JSON ?? process.env.NOTEBOOK_GISTS_JSON ?? "{}"));
	} catch {
		return {};
	}
}

export const GET: APIRoute = async ({ request, locals }) => {
	const auth = await requireAuth(request, locals);
	if (!auth.ok) return auth.response;

	const env = getRuntimeEnvironment(locals);
	const gists = getNotebookGists(env);
	const notebooks = Object.entries(gists).map(([name, gistId]) => ({
		name,
		gistId,
		configured: !!gistId,
	}));
	return new Response(JSON.stringify(notebooks), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
};
