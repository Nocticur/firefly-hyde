import type { APIRoute } from "astro";
import { getEnvironmentStatus } from "@/lib/admin/resourceRegistry";
import { getRuntimeEnvironment } from "@/lib/admin/storage";
import { requireAuth } from "@/pages/api/admin/v1/_auth";

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
	const auth = await requireAuth(request, locals);
	if (!auth.ok) return auth.response;
	const runtime = getRuntimeEnvironment(locals);
	const env: Record<string, string | undefined> = {};
	for (const key of [
		"GITHUB_TOKEN",
		"GITHUB_GIST_TOKEN",
		"GITHUB_OWNER",
		"GITHUB_REPO",
		"IMG_BED_URL",
		"IMG_BED_TOKEN",
		"TELEGRAM_CHAT_ID",
		"TELEGRAM_BOT_TOKEN",
		"WEATHER_API_KEY",
		"HUGGINGFACE_TOKEN",
	]) {
		const value = runtime[key] ?? process.env[key];
		env[key] = typeof value === "string" ? value : undefined;
	}
	return new Response(JSON.stringify(getEnvironmentStatus(env)), {
		status: 200,
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "private, no-store",
		},
	});
};
