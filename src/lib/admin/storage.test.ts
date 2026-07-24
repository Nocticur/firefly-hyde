import assert from "node:assert/strict";
import test from "node:test";
import { createAdminStore, getRuntimeBindings } from "./storage";

class FakeStatement {
	values: unknown[] = [];
	constructor(
		readonly sql: string,
		private readonly firstValue: unknown = null,
	) {}
	bind(...values: unknown[]) {
		this.values = values;
		return this;
	}
	async run() {
		return { success: true };
	}
	async first<T>() {
		return this.firstValue as T | null;
	}
	async all<T>() {
		return { results: [] as T[] };
	}
}

class FakeDatabase {
	statements: FakeStatement[] = [];
	nextFirst: unknown = null;
	prepare(sql: string) {
		const statement = new FakeStatement(sql, this.nextFirst);
		this.statements.push(statement);
		return statement;
	}
}

class FakeKv {
	values = new Map<string, string>();
	async get(key: string) {
		return this.values.get(key) ?? null;
	}
	async put(key: string, value: string) {
		this.values.set(key, value);
	}
	async delete(key: string) {
		this.values.delete(key);
	}
}

test("extracts Cloudflare bindings from Astro locals", () => {
	const db = new FakeDatabase();
	const cache = new FakeKv();
	assert.deepEqual(
		getRuntimeBindings({ runtime: { env: { ADMIN_DB: db, ADMIN_CACHE: cache } } }),
		{ ADMIN_DB: db, ADMIN_CACHE: cache },
	);
});

test("stores sessions in D1 when ADMIN_DB is available", async () => {
	const db = new FakeDatabase();
	const store = createAdminStore({ ADMIN_DB: db });
	await store.createSession("hash", 1234);

	assert.match(db.statements[0].sql, /INSERT INTO admin_sessions/);
	assert.deepEqual(db.statements[0].values, ["hash", 1234]);
});

test("reads and writes JSON cache values through ADMIN_CACHE", async () => {
	const cache = new FakeKv();
	const store = createAdminStore({ ADMIN_CACHE: cache });
	await store.setCache("deployment:abc", { state: "queued" }, 60);
	assert.deepEqual(await store.getCache("deployment:abc"), { state: "queued" });
	await store.deleteCache("deployment:abc");
	assert.equal(await store.getCache("deployment:abc"), null);
});
