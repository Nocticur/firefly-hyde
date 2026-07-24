export type ApiErrorCode =
	| "BAD_REQUEST"
	| "UNAUTHORIZED"
	| "FORBIDDEN"
	| "NOT_FOUND"
	| "CONFLICT"
	| "RATE_LIMITED"
	| "UPSTREAM_ERROR"
	| "INTERNAL_ERROR";

export class ApiError extends Error {
	constructor(
		public status: number,
		public code: ApiErrorCode,
		message: string,
		public details?: unknown,
	) {
		super(message);
	}
}
