import type { APIRoute } from "astro";
import { API_VERSION } from "@/lib/admin/contracts";
import { listResourceDescriptors } from "@/lib/admin/resourceRegistry";

export const GET: APIRoute = () => {
	return new Response(
		JSON.stringify({
			apiVersion: API_VERSION,
			modules: [
				"resources",
				"posts",
				"config",
				"images",
				"moments",
				"notebooks",
				"deployments",
			],
			resources: listResourceDescriptors(),
			limits: { pageSizeMax: 100, uploadBytesMax: 10 * 1024 * 1024 },
		}),
		{ status: 200, headers: { "Content-Type": "application/json" } },
	);
};
export const prerender = false;
