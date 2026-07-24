import { parseDocument, stringify } from "yaml";
import type { PostFrontmatter } from "./contracts";

export function parseFrontmatter(content: string): {
	frontmatter: Record<string, unknown>;
	body: string;
} {
	if (!content || !content.startsWith("---")) {
		return { frontmatter: {}, body: content || "" };
	}
	const normalized = content.replace(/\r\n/g, "\n");
	const endMatch = normalized.match(/^---\n([\s\S]*?)\n---\n?/);
	if (!endMatch) {
		return { frontmatter: {}, body: normalized };
	}
	const yamlStr = endMatch[1];
	const body = normalized.slice(endMatch[0].length);
	const doc = parseDocument(yamlStr);
	const frontmatter = doc.toJS() as Record<string, unknown>;
	return { frontmatter: frontmatter || {}, body };
}

export function parsePostFrontmatter(
	raw: Record<string, unknown>,
): PostFrontmatter {
	const fm: PostFrontmatter = { title: "", published: "" };
	for (const [key, value] of Object.entries(raw)) {
		if (key === "title") fm.title = String(value ?? "");
		else if (key === "published") fm.published = String(value ?? "");
		else if (key === "updated") fm.updated = String(value ?? "");
		else if (key === "draft") fm.draft = Boolean(value);
		else if (key === "description") fm.description = String(value ?? "");
		else if (key === "descriptionSource")
			fm.descriptionSource = String(value ?? "");
		else if (key === "image") fm.image = String(value ?? "");
		else if (key === "tags")
			fm.tags = Array.isArray(value) ? value.map(String) : [];
		else if (key === "category")
			fm.category = value ? String(value) : null;
		else if (key === "lang") fm.lang = String(value ?? "");
		else if (key === "pinned") fm.pinned = Boolean(value);
		else if (key === "author") fm.author = String(value ?? "");
		else if (key === "sourceLink") fm.sourceLink = String(value ?? "");
		else if (key === "licenseName") fm.licenseName = String(value ?? "");
		else if (key === "licenseUrl") fm.licenseUrl = String(value ?? "");
		else if (key === "comment") fm.comment = Boolean(value);
		else if (key === "password") fm.password = String(value ?? "");
		else if (key === "passwordHint")
			fm.passwordHint = String(value ?? "");
		else {
			(fm as Record<string, unknown>)[key] = value;
		}
	}
	return fm;
}

export function patchFrontmatter(
	source: string,
	updates: Partial<PostFrontmatter>,
): string {
	const normalized = source.replace(/\r\n/g, "\n");
	const endMatch = normalized.match(/^---\n([\s\S]*?)\n---\n?/);
	if (!endMatch) return source;
	const yamlStr = endMatch[1];
	const body = normalized.slice(endMatch[0].length);
	const doc = parseDocument(yamlStr);
	for (const [key, value] of Object.entries(updates)) {
		if (value !== undefined) doc.set(key, value);
	}
	const newYaml = stringify(doc);
	return `---\n${newYaml}---\n${body}`;
}

export function createPostFile(
	slug: string,
	body: string,
	meta: PostFrontmatter,
): string {
	const doc = parseDocument("");
	for (const [key, value] of Object.entries(meta)) {
		if (value !== undefined) doc.set(key, value);
	}
	if (meta.title) doc.set("title", meta.title);
	const yamlStr = stringify(doc);
	return `---\n${yamlStr}---\n${body}`;
}
