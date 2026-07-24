import { ApiError } from "./errors";
import { createAdminStore, type RuntimeBindings } from "./storage";

export async function checkRateLimit(
	ip: string,
	route: string,
	maxRequests: number,
	windowSeconds: number,
	bindings: RuntimeBindings = {},
): Promise<void> {
	const { allowed } = await createAdminStore(bindings).checkRateLimit(
		ip,
		route,
		maxRequests,
		windowSeconds,
	);
	if (!allowed) {
		throw new ApiError(429, "RATE_LIMITED", "Too many requests, try again later");
	}
}
