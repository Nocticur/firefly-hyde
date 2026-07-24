import {
	checkRateLimitLocal,
	createSession as createSessionLocal,
	deleteSessionLocal,
	validateSessionLocal,
	writeAuditLocal,
} from "./d1";

export interface D1PreparedStatementLike {
	bind(...values: unknown[]): D1PreparedStatementLike;
	run(): Promise<unknown>;
	first<T>(): Promise<T | null>;
	all<T>(): Promise<{ results: T[] }>;
}

export interface D1DatabaseLike {
	prepare(sql: string): D1PreparedStatementLike;
}

export interface KVNamespaceLike {
	get(key: string): Promise<string | null>;
	put(
		key: string,
		value: string,
		options?: { expirationTtl?: number },
	): Promise<void>;
	delete(key: string): Promise<void>;
}

export interface RuntimeBindings {
	ADMIN_DB?: D1DatabaseLike;
	ADMIN_CACHE?: KVNamespaceLike;
}

const localCache = new Map<string, { value: string; expiresAt: number | null }>();

export function getRuntimeBindings(locals: unknown): RuntimeBindings {
	const runtime = (locals as { runtime?: { env?: RuntimeBindings } } | undefined)
		?.runtime;
	return {
		ADMIN_DB: runtime?.env?.ADMIN_DB,
		ADMIN_CACHE: runtime?.env?.ADMIN_CACHE,
	};
}

export function getRuntimeEnvironment(
	locals: unknown,
): Record<string, unknown> {
	const runtimeEnv = (
		(locals as { runtime?: { env?: Record<string, unknown> } } | undefined)
			?.runtime?.env ?? {}
	);
	// Astro 7 把 .env 注入 import.meta.env（非 process.env）；dev server SSR 下
	// process.env 不含这些值，需读 import.meta.env 才能取到凭据
	const importMetaEnv = (import.meta as { env?: Record<string, unknown> }).env ?? {};
	const processEnv = (typeof process !== "undefined" && process.env) ? process.env : {};
	return { ...processEnv, ...importMetaEnv, ...runtimeEnv };
}

export function createAdminStore(bindings: RuntimeBindings = {}) {
	const database = bindings.ADMIN_DB;
	const cache = bindings.ADMIN_CACHE;

	return {
		async createSession(tokenHash: string, expiresAt: number): Promise<void> {
			if (!database) return createSessionLocal(tokenHash, expiresAt);
			await database
				.prepare(
					"INSERT INTO admin_sessions (token_hash, expires_at) VALUES (?, ?)",
				)
				.bind(tokenHash, expiresAt)
				.run();
		},

		async validateSession(
			tokenHash: string,
		): Promise<{ valid: boolean; expiresAt: number | null }> {
			if (!database) return validateSessionLocal(tokenHash);
			const now = Math.floor(Date.now() / 1000);
			const row = await database
				.prepare(
					"SELECT expires_at FROM admin_sessions WHERE token_hash = ? AND expires_at > ?",
				)
				.bind(tokenHash, now)
				.first<{ expires_at: number }>();
			return row
				? { valid: true, expiresAt: row.expires_at }
				: { valid: false, expiresAt: null };
		},

		async deleteSession(tokenHash: string): Promise<void> {
			if (!database) return deleteSessionLocal(tokenHash);
			await database
				.prepare("DELETE FROM admin_sessions WHERE token_hash = ?")
				.bind(tokenHash)
				.run();
		},

		async checkRateLimit(
			ip: string,
			route: string,
			maxRequests: number,
			windowSeconds: number,
		): Promise<{ allowed: boolean; remaining: number }> {
			if (!database) {
				return checkRateLimitLocal(ip, route, maxRequests, windowSeconds);
			}
			const now = Math.floor(Date.now() / 1000);
			const windowStart = Math.floor(now / windowSeconds) * windowSeconds;
			const row = await database
				.prepare(
					`INSERT INTO admin_rate_limits (ip, route, window_start, count)
					 VALUES (?, ?, ?, 1)
					 ON CONFLICT (ip, route, window_start)
					 DO UPDATE SET count = count + 1
					 RETURNING count`,
				)
				.bind(ip, route, windowStart)
				.first<{ count: number }>();
			const count = row?.count ?? 1;
			return {
				allowed: count <= maxRequests,
				remaining: Math.max(0, maxRequests - count),
			};
		},

		async writeAudit(
			actor: string,
			action: string,
			resource: string,
			status: string,
			requestId: string,
		): Promise<void> {
			if (!database) {
				return writeAuditLocal(actor, action, resource, status, requestId);
			}
			await database
				.prepare(
					`INSERT INTO admin_audit_log
					 (actor, action, resource, status, request_id)
					 VALUES (?, ?, ?, ?, ?)`,
				)
				.bind(actor, action, resource, status, requestId)
				.run();
		},

		async getCache<T>(key: string): Promise<T | null> {
			let value: string | null;
			if (cache) {
				value = await cache.get(key);
			} else {
				const entry = localCache.get(key);
				if (entry?.expiresAt && entry.expiresAt <= Date.now()) {
					localCache.delete(key);
					return null;
				}
				value = entry?.value ?? null;
			}
			if (!value) return null;
			try {
				return JSON.parse(value) as T;
			} catch {
				return null;
			}
		},

		async setCache(
			key: string,
			value: unknown,
			ttlSeconds = 300,
		): Promise<void> {
			const serialized = JSON.stringify(value);
			if (cache) {
				await cache.put(key, serialized, { expirationTtl: ttlSeconds });
				return;
			}
			localCache.set(key, {
				value: serialized,
				expiresAt: ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null,
			});
		},

		async deleteCache(key: string): Promise<void> {
			if (cache) await cache.delete(key);
			else localCache.delete(key);
		},
	};
}

export type AdminStore = ReturnType<typeof createAdminStore>;
