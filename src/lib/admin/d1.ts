/**
 * Data access layer.
 * Local dev: JSON file storage in .data/admin/
 * Production (Cloudflare): D1 binding via env.DB
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

// ---- JSON file store helpers (local dev) ----
const DATA_DIR = ".data/admin";

function ensureDataDir() {
	if (!existsSync(DATA_DIR)) {
		mkdirSync(DATA_DIR, { recursive: true });
	}
}

function readJson<T>(file: string, fallback: T): T {
	ensureDataDir();
	const fp = path.join(DATA_DIR, file);
	if (!existsSync(fp)) return fallback;
	return JSON.parse(readFileSync(fp, "utf8")) as T;
}

function writeJson(file: string, data: unknown) {
	ensureDataDir();
	const fp = path.join(DATA_DIR, file);
	writeFileSync(fp, JSON.stringify(data, null, 2), "utf8");
}

// ---- Interfaces ----
export interface SiteConfig {
	key: string;
	value: string;
	updated_at: string;
}

export interface PostIndexItem {
	slug: string;
	sha: string;
	title: string;
	published: string;
	updated: string | null;
	draft: boolean;
	description: string;
	image: string;
	tags: string[];
	category: string | null;
	indexed_at: number;
}

interface PostIndexRow {
	slug: string;
	sha: string;
	title: string;
	published: string;
	updated: string | null;
	draft: number;
	description: string;
	image: string;
	tags_json: string;
	category: string | null;
	indexed_at: number;
}

function rowToItem(row: PostIndexRow): PostIndexItem {
	return {
		slug: row.slug,
		sha: row.sha,
		title: row.title,
		published: row.published,
		updated: row.updated,
		draft: row.draft === 1,
		description: row.description,
		image: row.image,
		tags: JSON.parse(row.tags_json || "[]"),
		category: row.category,
		indexed_at: row.indexed_at,
	};
}

// ---- Cursor helpers ----
function encodeCursor(published: string, slug: string): string {
	return Buffer.from(JSON.stringify({ published, slug })).toString("base64url");
}

function decodeCursor(cursor: string): { published: string; slug: string } {
	return JSON.parse(Buffer.from(cursor, "base64url").toString());
}

// ================================================================
//  JSON-file-backed implementations (used when CF_WORKERS is unset)
// ================================================================

// --- Auth sessions ---
interface SessionRow {
	token_hash: string;
	created_at: number;
	expires_at: number;
}

const SESSIONS_FILE = "auth_sessions.json";

function getSessions(): SessionRow[] {
	return readJson<SessionRow[]>(SESSIONS_FILE, []);
}

function saveSessions(rows: SessionRow[]) {
	writeJson(SESSIONS_FILE, rows);
}

export async function createSession(
	tokenHash: string,
	expiresAt: number,
): Promise<void> {
	const now = Math.floor(Date.now() / 1000);
	const sessions = getSessions();
	sessions.push({ token_hash: tokenHash, created_at: now, expires_at: expiresAt });
	saveSessions(sessions);
}

export async function validateSessionLocal(
	tokenHash: string,
): Promise<{ valid: boolean; expiresAt: number | null }> {
	const now = Math.floor(Date.now() / 1000);
	const sessions = getSessions();
	const row = sessions.find(
		(s) => s.token_hash === tokenHash && s.expires_at > now,
	);
	if (!row) return { valid: false, expiresAt: null };
	return { valid: true, expiresAt: row.expires_at };
}

export async function deleteSessionLocal(tokenHash: string): Promise<void> {
	const sessions = getSessions().filter((s) => s.token_hash !== tokenHash);
	saveSessions(sessions);
}

// --- Rate limits ---
const RATELIMITS_FILE = "rate_limits.json";

interface RateLimitRow {
	ip: string;
	route: string;
	window_start: number;
	count: number;
}

export async function checkRateLimitLocal(
	ip: string,
	route: string,
	maxRequests: number,
	windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number }> {
	const now = Math.floor(Date.now() / 1000);
	const windowStart = Math.floor(now / windowSeconds) * windowSeconds;
	const rows = readJson<RateLimitRow[]>(RATELIMITS_FILE, []);
	const idx = rows.findIndex(
		(r) => r.ip === ip && r.route === route && r.window_start === windowStart,
	);
	const currentCount = idx >= 0 ? rows[idx].count : 0;
	if (currentCount >= maxRequests) return { allowed: false, remaining: 0 };
	if (idx >= 0) rows[idx].count++;
	else rows.push({ ip, route, window_start: windowStart, count: 1 });
	writeJson(RATELIMITS_FILE, rows);
	return { allowed: true, remaining: maxRequests - currentCount - 1 };
}

// --- Site config ---
const CONFIG_FILE = "site_config.json";

export async function getConfigLocal(key: string): Promise<SiteConfig | null> {
	const rows = readJson<SiteConfig[]>(CONFIG_FILE, []);
	return rows.find((r) => r.key === key) ?? null;
}

export async function getAllConfigLocal(): Promise<SiteConfig[]> {
	return readJson<SiteConfig[]>(CONFIG_FILE, []);
}

export async function setConfigLocal(
	key: string,
	value: string,
): Promise<void> {
	const rows = readJson<SiteConfig[]>(CONFIG_FILE, []);
	const idx = rows.findIndex((r) => r.key === key);
	const now = new Date().toISOString();
	if (idx >= 0) {
		rows[idx].value = value;
		rows[idx].updated_at = now;
	} else {
		rows.push({ key, value, updated_at: now });
	}
	writeJson(CONFIG_FILE, rows);
}

export async function deleteConfigLocal(key: string): Promise<void> {
	const rows = readJson<SiteConfig[]>(CONFIG_FILE, []).filter(
		(r) => r.key !== key,
	);
	writeJson(CONFIG_FILE, rows);
}

// --- Post index ---
const POSTINDEX_FILE = "post_index.json";

export async function queryPostIndexLocal(options: {
	cursor?: string;
	limit?: number;
	draft?: boolean;
	search?: string;
}): Promise<{ items: PostIndexItem[]; nextCursor: string | null; total: number }> {
	const limit = options.limit ?? 20;
	let rows = readJson<PostIndexRow[]>(POSTINDEX_FILE, []);

	if (options.draft !== undefined) {
		rows = rows.filter((r) => r.draft === (options.draft ? 1 : 0));
	}
	if (options.search) {
		const q = options.search.toLowerCase();
		rows = rows.filter(
			(r) =>
				r.title.toLowerCase().includes(q) ||
				r.slug.toLowerCase().includes(q) ||
				r.description.toLowerCase().includes(q),
		);
	}
	const total = rows.length;
	rows.sort((a, b) =>
		b.published.localeCompare(a.published) || a.slug.localeCompare(b.slug),
	);

	let start = 0;
	if (options.cursor) {
		const cur = decodeCursor(options.cursor);
		start = rows.findIndex(
			(r) =>
				r.published < cur.published ||
				(r.published === cur.published && r.slug > cur.slug),
		);
		if (start < 0) start = rows.length;
	}

	const sliced = rows.slice(start, start + limit + 1);
	const hasMore = sliced.length > limit;
	const items = sliced.slice(0, limit).map(rowToItem);
	const nextCursor =
		hasMore && items.length > 0
			? encodeCursor(
					items[items.length - 1].published,
					items[items.length - 1].slug,
				)
			: null;

	return { items, nextCursor, total };
}

export async function getPostBySlugLocal(
	slug: string,
): Promise<PostIndexItem | null> {
	const rows = readJson<PostIndexRow[]>(POSTINDEX_FILE, []);
	const row = rows.find((r) => r.slug === slug);
	return row ? rowToItem(row) : null;
}

export async function upsertPostIndexLocal(
	slug: string,
	sha: string,
	frontmatter: Record<string, unknown>,
): Promise<void> {
	const rows = readJson<PostIndexRow[]>(POSTINDEX_FILE, []);
	const now = Math.floor(Date.now() / 1000);
	const tags = Array.isArray(frontmatter.tags)
		? (frontmatter.tags as unknown[]).map(String)
		: [];
	const existing = rows.findIndex((r) => r.slug === slug);
	const row: PostIndexRow = {
		slug,
		sha,
		title: String(frontmatter.title ?? ""),
		published: String(frontmatter.published ?? ""),
		updated: frontmatter.updated ? String(frontmatter.updated) : null,
		draft: frontmatter.draft ? 1 : 0,
		description: String(frontmatter.description ?? ""),
		image: String(frontmatter.image ?? ""),
		tags_json: JSON.stringify(tags),
		category: frontmatter.category ? String(frontmatter.category) : null,
		indexed_at: now,
	};
	if (existing >= 0) rows[existing] = row;
	else rows.push(row);
	writeJson(POSTINDEX_FILE, rows);
}

export async function removePostIndexLocal(slug: string): Promise<void> {
	const rows = readJson<PostIndexRow[]>(POSTINDEX_FILE, []).filter(
		(r) => r.slug !== slug,
	);
	writeJson(POSTINDEX_FILE, rows);
}

// --- Audit log ---
interface AuditRow {
	id: number;
	actor: string;
	action: string;
	resource: string;
	status: string;
	request_id: string;
	created_at: number;
}

const AUDIT_FILE = "audit_log.json";

export async function writeAuditLocal(
	actor: string,
	action: string,
	resource: string,
	status: string,
	requestId: string,
): Promise<void> {
	const rows = readJson<AuditRow[]>(AUDIT_FILE, []);
	const now = Math.floor(Date.now() / 1000);
	const maxId = rows.reduce((m, r) => Math.max(m, r.id), 0);
	rows.push({
		id: maxId + 1,
		actor,
		action,
		resource,
		status,
		request_id: requestId,
		created_at: now,
	});
	writeJson(AUDIT_FILE, rows);
}
