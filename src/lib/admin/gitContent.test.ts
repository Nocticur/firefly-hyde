import assert from "node:assert/strict";
import test from "node:test";
import { decodeBase64Utf8, encodeBase64Utf8, safeResourcePath } from "./gitContent";

test("round trips unicode Git content through base64", () => {
	const source = "---\ntitle: 中文标题\n---\n正文与 emoji ✨";
	assert.equal(decodeBase64Utf8(encodeBase64Utf8(source)), source);
});

test("builds paths only inside the registered resource root", () => {
	assert.equal(
		safeResourcePath("src/content/posts", "Firefly/快速开始.md"),
		"src/content/posts/Firefly/快速开始.md",
	);
	assert.throws(
		() => safeResourcePath("src/content/posts", "../../.env"),
		/path traversal/i,
	);
	assert.throws(
		() => safeResourcePath("src/content/posts", "C:\\secrets.txt"),
		/path traversal/i,
	);
});
