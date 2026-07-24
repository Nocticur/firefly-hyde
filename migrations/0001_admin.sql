CREATE TABLE IF NOT EXISTS admin_sessions (
	token_hash TEXT PRIMARY KEY,
	created_at INTEGER NOT NULL DEFAULT (unixepoch()),
	expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS admin_sessions_expires_at
	ON admin_sessions (expires_at);

CREATE TABLE IF NOT EXISTS admin_rate_limits (
	ip TEXT NOT NULL,
	route TEXT NOT NULL,
	window_start INTEGER NOT NULL,
	count INTEGER NOT NULL DEFAULT 0,
	PRIMARY KEY (ip, route, window_start)
);

CREATE TABLE IF NOT EXISTS admin_audit_log (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	actor TEXT NOT NULL,
	action TEXT NOT NULL,
	resource TEXT NOT NULL,
	status TEXT NOT NULL,
	request_id TEXT NOT NULL,
	created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS admin_audit_log_created_at
	ON admin_audit_log (created_at DESC);

CREATE TABLE IF NOT EXISTS admin_post_index (
	slug TEXT PRIMARY KEY,
	sha TEXT NOT NULL,
	title TEXT NOT NULL,
	published TEXT NOT NULL,
	updated TEXT,
	draft INTEGER NOT NULL DEFAULT 0,
	description TEXT NOT NULL DEFAULT '',
	image TEXT NOT NULL DEFAULT '',
	tags_json TEXT NOT NULL DEFAULT '[]',
	category TEXT,
	indexed_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS admin_post_index_published
	ON admin_post_index (published DESC, slug ASC);

CREATE TABLE IF NOT EXISTS admin_publish_jobs (
	id TEXT PRIMARY KEY,
	resource_id TEXT NOT NULL,
	item_id TEXT,
	mode TEXT NOT NULL,
	revision TEXT,
	state TEXT NOT NULL,
	url TEXT,
	error TEXT,
	created_at INTEGER NOT NULL DEFAULT (unixepoch()),
	updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
