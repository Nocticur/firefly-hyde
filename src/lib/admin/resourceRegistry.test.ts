import assert from "node:assert/strict";
import test from "node:test";
import {
	getEnvironmentStatus,
	getResourceDescriptor,
	listResourceDescriptors,
} from "./resourceRegistry";

test("resource registry covers every front-end management area", () => {
	const resources = listResourceDescriptors();
	const ids = new Set(resources.map((resource) => resource.id));

	for (const id of [
		"posts",
		"spec-pages",
		"dynamic",
		"moments",
		"notebooks",
		"projects",
		"skills",
		"timeline",
		"diary",
		"devices",
		"music",
		"friends",
		"sponsors",
		"gallery",
		"site-config",
		"navigation",
		"appearance",
		"integrations",
		"media",
	]) {
		assert.ok(ids.has(id), `missing resource: ${id}`);
	}

	assert.ok(resources.every((resource) => resource.label.length > 0));
	assert.ok(resources.every((resource) => resource.group.length > 0));
});

test("resource lookup returns a stable descriptor", () => {
	const posts = getResourceDescriptor("posts");
	assert.equal(posts?.source, "git-markdown");
	assert.equal(posts?.capabilities.create, true);
	assert.equal(posts?.capabilities.preview, true);
	assert.equal(getResourceDescriptor("missing"), undefined);
});

test("environment status never exposes secret values", () => {
	const status = getEnvironmentStatus({
		GITHUB_TOKEN: "secret-token",
		GITHUB_OWNER: "owner",
		GITHUB_REPO: "repo",
		IMG_BED_TOKEN: "image-token",
		TELEGRAM_CHAT_ID: "chat-id",
		TELEGRAM_BOT_TOKEN: "telegram-token",
	});

	assert.deepEqual(status, {
		github: true,
		gist: true,
		imageBed: false,
		telegram: true,
		weather: false,
		huggingFace: false,
	});
	assert.equal(JSON.stringify(status).includes("secret-token"), false);
});
