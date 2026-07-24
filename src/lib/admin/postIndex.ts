import {
	getPostBySlugLocal,
	queryPostIndexLocal,
	removePostIndexLocal,
	upsertPostIndexLocal,
} from "./d1";
import type { PostFrontmatter } from "./contracts";
import type { RuntimeBindings } from "./storage";

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
}

function rowToItem(row: PostIndexRow) {
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
	};
}

export async function queryPostIndex(
	options: { cursor?: string; limit?: number; draft?: boolean; search?: string },
	bindings: RuntimeBindings = {},
): Promise<unknown> {
	if (!bindings.ADMIN_DB) return queryPostIndexLocal(options);
	const clauses: string[] = [];
	const values: unknown[] = [];
	if (options.draft !== undefined) {
		clauses.push("draft = ?");
		values.push(options.draft ? 1 : 0);
	}
	if (options.search) {
		clauses.push("(title LIKE ? OR slug LIKE ? OR description LIKE ?)");
		const query = `%${options.search}%`;
		values.push(query, query, query);
	}
	const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
	const limit = Math.min(100, Math.max(1, options.limit ?? 20));
	const result = await bindings.ADMIN_DB
		.prepare(
			`SELECT slug, sha, title, published, updated, draft, description, image, tags_json, category
			 FROM admin_post_index ${where}
			 ORDER BY published DESC, slug ASC LIMIT ?`,
		)
		.bind(...values, limit)
		.all<PostIndexRow>();
	return { items: result.results.map(rowToItem), nextCursor: null, total: result.results.length };
}

export async function getPostBySlug(
	slug: string,
	bindings: RuntimeBindings = {},
): Promise<unknown> {
	if (!bindings.ADMIN_DB) return getPostBySlugLocal(slug);
	const row = await bindings.ADMIN_DB
		.prepare(
			"SELECT slug, sha, title, published, updated, draft, description, image, tags_json, category FROM admin_post_index WHERE slug = ?",
		)
		.bind(slug)
		.first<PostIndexRow>();
	return row ? rowToItem(row) : null;
}

export async function upsertPostIndex(
	slug: string,
	sha: string,
	frontmatter: PostFrontmatter,
	bindings: RuntimeBindings = {},
): Promise<void> {
	if (!bindings.ADMIN_DB) return upsertPostIndexLocal(slug, sha, frontmatter);
	const tags = JSON.stringify(frontmatter.tags ?? []);
	await bindings.ADMIN_DB
		.prepare(
			`INSERT INTO admin_post_index
			 (slug, sha, title, published, updated, draft, description, image, tags_json, category)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			 ON CONFLICT (slug) DO UPDATE SET
			 sha = excluded.sha,
			 title = excluded.title,
			 published = excluded.published,
			 updated = excluded.updated,
			 draft = excluded.draft,
			 description = excluded.description,
			 image = excluded.image,
			tags_json = excluded.tags_json,
			category = excluded.category,
			indexed_at = unixepoch()`,
		)
		.bind(
			slug,
			sha,
			frontmatter.title ?? "",
			frontmatter.published ?? "",
			frontmatter.updated ?? null,
			frontmatter.draft ? 1 : 0,
			frontmatter.description ?? "",
			frontmatter.image ?? "",
			tags,
			frontmatter.category ?? null,
		)
		.run();
}

export async function removePostIndex(
	slug: string,
	bindings: RuntimeBindings = {},
): Promise<void> {
	if (!bindings.ADMIN_DB) return removePostIndexLocal(slug);
	await bindings.ADMIN_DB
		.prepare("DELETE FROM admin_post_index WHERE resource_id = 'posts' AND item_id = ?")
		.bind(slug)
		.run();
}
