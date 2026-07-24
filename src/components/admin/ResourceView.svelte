<script module lang="ts">
	import type { ResourceDescriptor } from "./types";

	type ResourceItem = {
		id: string;
		name?: string;
		path?: string;
		sha?: string;
		content?: string;
		title?: string;
		published?: string;
		[key: string]: unknown;
	};

	type ViewState = {
		items: ResourceItem[];
		loadedResource: string;
		selected: ResourceItem | null;
		editorContent: string;
		showEditor: boolean;
		previewText: string;
	};

	// 模块级缓存：每个 resource.id 维护独立的同步结果与编辑草稿，
	// 组件卸载不丢失，切换回该界面时还原上次状态而非清空重加载。
	const viewCache = new Map<string, ViewState>();
</script>

<script lang="ts">
	import Icon from "@iconify/svelte";
	import { adminFetch } from "./api";
	import type { ResourceDescriptor } from "./types";
	import { sourceLabels } from "./constants";
	import Button from "./ui/Button.svelte";
	import Banner from "./ui/Banner.svelte";
	import EmptyState from "./ui/EmptyState.svelte";

	// viewCache 由 <script module> 块提供，在组件块内自动可见

	export let resource: ResourceDescriptor;
	export let onBack: () => void;

	type ResourceItem = {
		id: string;
		name?: string;
		path?: string;
		sha?: string;
		content?: string;
		title?: string;
		published?: string;
		[key: string]: unknown;
	};

	let items: ResourceItem[] = [];
	let selected: ResourceItem | null = null;
	let editorContent = "";
	let loading = true;
	let saving = false;
	let error = "";
	let loadedResource = "";
	let showEditor = false;
	let previewText = "";
	let previewBusy = false;

	function persist() {
		viewCache.set(resource.id, {
			items,
			loadedResource,
			selected,
			editorContent,
			showEditor,
			previewText,
		});
	}

	async function load() {
		loading = true;
		error = "";
		try {
			if (resource.id === "moments") {
				items = await adminFetch<ResourceItem[]>("moments/");
			} else if (resource.id === "notebooks") {
				items = await adminFetch<ResourceItem[]>("notebooks/");
			} else if (resource.id === "media") {
				const result = await adminFetch<{ items?: ResourceItem[] }>("images/");
				items = result.items ?? [];
			} else {
				const result = await adminFetch<{ items: ResourceItem[] }>(`resources/${resource.id}/`);
				items = result.items ?? [];
			}
			loadedResource = resource.id;
			persist();
		} catch (loadError) {
			error = loadError instanceof Error ? loadError.message : "资源加载失败";
		} finally {
			loading = false;
		}
	}

	async function edit(item: ResourceItem) {
		selected = item;
		if (resource.source === "git-markdown" || resource.source === "git-config" || resource.source === "git-jsonc") {
			try {
				const detail = await adminFetch<ResourceItem>(`resources/${resource.id}/${encodeURIComponent(item.id)}/`);
				selected = { ...item, ...detail };
				editorContent = detail.content ?? "";
			} catch (loadError) {
				error = loadError instanceof Error ? loadError.message : "资源读取失败";
				editorContent = "";
			}
		} else if (resource.id === "notebooks" && item.name) {
			try {
				const data = await adminFetch<{ entries?: ResourceItem[] }>(`notebooks/${encodeURIComponent(item.name)}/`);
				editorContent = JSON.stringify(data.entries ?? [], null, 2);
			} catch (loadError) {
				error = loadError instanceof Error ? loadError.message : "笔记加载失败";
				editorContent = "[]";
			}
		} else {
			editorContent = item.content ?? JSON.stringify(item, null, 2);
		}
		showEditor = true;
		persist();
	}

	function create() {
		selected = null;
		editorContent = resource.source === "git-markdown" ? "---\ntitle: \npublished: \n---\n" : "";
		showEditor = true;
		persist();
	}

	async function save() {
		if (!selected && resource.source !== "git-markdown") return;
		saving = true;
		error = "";
		try {
			if (resource.id === "moments") {
				const payload = JSON.parse(editorContent) as Record<string, unknown>;
				const path = selected ? `moments/${encodeURIComponent(selected.id)}/` : "moments/";
				await adminFetch(path, { method: selected ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
			} else if (resource.id === "notebooks" && selected?.name) {
				const entries = JSON.parse(editorContent) as ResourceItem[];
				await adminFetch(`notebooks/${encodeURIComponent(selected.name)}/`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ entries }),
				});
			} else if (selected) {
				await adminFetch(`resources/${resource.id}/${encodeURIComponent(selected.id)}/`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ content: editorContent, sha: selected.sha, message: `Update ${resource.label}: ${selected.id}` }),
				});
			} else {
				const id = window.prompt("请输入新建文件名（不含扩展名）");
				if (!id) return;
				await adminFetch(`resources/${resource.id}/`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ id, content: editorContent, message: `Create ${resource.label}: ${id}` }),
				});
			}
			showEditor = false;
			await load();
		} catch (saveError) {
			error = saveError instanceof Error ? saveError.message : "保存失败";
		} finally {
			saving = false;
		}
	}

	async function runPreview() {
		if (!editorContent) {
			error = "请先打开或创建一项资源";
			showEditor = true;
			return;
		}
		previewBusy = true;
		error = "";
		try {
			const result = await adminFetch<{ valid: boolean; metadata?: Record<string, unknown>; previewMode: string }>("preview/", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ resourceId: resource.id, content: editorContent }),
			});
			previewText = `${result.previewMode} · ${result.valid ? "校验通过" : "校验失败"}${result.metadata ? `\n${JSON.stringify(result.metadata, null, 2)}` : ""}`;
			persist();
		} catch (previewError) {
			error = previewError instanceof Error ? previewError.message : "预览失败";
		} finally {
			previewBusy = false;
		}
	}

	async function cancelEdit() {
		showEditor = false;
		selected = null;
		previewText = "";
		persist();
	}

	async function remove(item: ResourceItem) {
		const itemKey = String(item.id ?? item.key ?? item.name ?? "");
		if (!confirm(`确定删除 ${itemKey}？`)) return;
		try {
			const path = resource.id === "media" ? `images/${encodeURIComponent(itemKey)}/` : `resources/${resource.id}/${encodeURIComponent(itemKey)}/`;
			await adminFetch(path, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ sha: item.sha, message: `Delete ${resource.label}: ${itemKey}` }),
			});
			await load();
		} catch (removeError) {
			error = removeError instanceof Error ? removeError.message : "删除失败";
		}
	}

	async function uploadMedia(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		if (!input.files?.length) return;
		for (const file of Array.from(input.files)) {
			const form = new FormData();
			form.append("file", file);
			try {
				await adminFetch("images/upload/", { method: "POST", body: form });
			} catch (uploadError) {
				error = uploadError instanceof Error ? uploadError.message : "上传失败";
				return;
			}
		}
		input.value = "";
		await load();
	}

	// 切换 resource 时按缓存还原独立结果与编辑草稿，缓存空才首次加载。
	// AdminApp 复用同一个 ResourceView 实例、只更新 resource prop，
	// 不能用 onMount（只跑一次），必须用响应式语句追踪 resource.id 变化。
	let restored = false;
	$: if (resource.id) {
		if (restored) {} // 占位，让 Svelte 把 restored 视为依赖
		const cached = viewCache.get(resource.id);
		if (cached) {
			// 缓存命中：还原上次结果与编辑草稿，不触发同步
			items = cached.items;
			loadedResource = cached.loadedResource;
			selected = cached.selected;
			editorContent = cached.editorContent;
			showEditor = cached.showEditor;
			previewText = cached.previewText;
			loading = false;
			restored = true;
		} else if (!restored || loadedResource !== resource.id) {
			// 首次进入或缓存不存在：加载一次，结果写回缓存
			restored = true;
			void load();
		}
	}
</script>

<section class="resource-view">
	<button class="back-button" onclick={onBack} aria-label="返回工作台">
		<Icon icon="material-symbols:arrow-back-rounded" width="19" />
		工作台
	</button>
	<header>
		<div>
			<p>{sourceLabels[resource.source]}</p>
			<h1>{resource.label}</h1>
			<span>{resource.description}</span>
		</div>
		<div class="header-actions">
			<Button variant="secondary" size="sm" onclick={load} disabled={loading} icon={loading ? "material-symbols:progress-activity" : "material-symbols:sync-rounded"}>
				{loading ? "同步中" : "刷新"}
			</Button>
			{#if resource.id === "media"}
				<label class="upload-label"><Button variant="primary" size="sm" icon="material-symbols:upload-rounded" onclick={() => {}}>上传</Button><input type="file" accept="image/*" multiple onchange={uploadMedia} /></label>
			{/if}
			{#if resource.capabilities.create}
				<Button variant="primary" size="sm" icon="material-symbols:add-rounded" onclick={create}>新建</Button>
			{/if}
		</div>
	</header>

	<div class="source-bar">
		<div><span>内容来源</span><strong>{sourceLabels[resource.source]}</strong></div>
		<div><span>仓库路径</span><code>{resource.path ?? "由外部适配器提供"}</code></div>
		<div class="state"><span></span>{loading ? "正在同步" : `${items.length} 项已同步`}</div>
	</div>

	{#if error}<Banner kind="error">{error}</Banner>{/if}
	{#if showEditor}
		<section class="editor-panel">
			<div class="editor-heading">
				<div>
					<span>{selected ? "编辑资源" : "新建资源"}</span>
					<strong>{selected?.id ?? resource.label}</strong>
				</div>
				<div class="editor-actions">
					<Button variant="secondary" size="sm" onclick={cancelEdit}>取消</Button>
					<Button variant="secondary" size="sm" onclick={runPreview} disabled={previewBusy} icon="material-symbols:preview-outline-rounded">{previewBusy ? "校验中" : "预览"}</Button>
					<Button variant="primary" size="sm" onclick={save} disabled={saving}>{saving ? "提交中" : "提交修改"}</Button>
				</div>
			</div>
			<textarea bind:value={editorContent} aria-label="资源内容"></textarea>
			{#if previewText}<pre class="preview-pane">{previewText}</pre>{/if}
		</section>
	{/if}

	<section class="items-section">
		<div class="section-heading"><h2>资源列表</h2><span>{loading ? "正在同步…" : `${items.length} 项`}</span></div>
		{#if !loading && !items.length}
			<EmptyState icon="material-symbols:inventory-2-outline-rounded" title="暂无 {resource.label}" description="当前来源没有可显示的资源，或尚未配置对应连接。" actionLabel={resource.capabilities.create ? "创建第一项" : ""} onAction={resource.capabilities.create ? create : undefined} />
		{:else}
			<div class="item-table">
				{#each items as item}
					<div class="item-row">
						<div><strong>{item.title ?? item.name ?? item.id ?? item.key}</strong><small>{item.published ?? item.path ?? item.id ?? item.key}</small></div>
						<div class="item-actions">{#if resource.id !== "media"}<Button variant="ghost" size="sm" onclick={() => edit(item)} icon="material-symbols:edit-outline-rounded">编辑</Button>{/if}{#if resource.capabilities.delete}<Button variant="danger" size="sm" onclick={() => remove(item)} icon="material-symbols:delete-outline-rounded">删除</Button>{/if}</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>
</section>

<style>
	.resource-view { max-width: 1180px; margin: 0 auto; }
	.back-button {
		display: inline-flex; align-items: center; gap: 6px; margin: 0 0 18px; padding: 0;
		border: 0; background: transparent; color: #94a3b8; cursor: pointer;
		transition: color 120ms ease;
	}
	.back-button:hover { color: #3b9eff; }

	header { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 24px; }
	header p { margin: 0 0 6px; color: #3b9eff; font: 11px var(--ff-font-mono); }
	h1 { margin: 0; font-size: 28px; letter-spacing: 0; color: #e2e8f0; }
	header span { display: block; margin-top: 8px; color: #64748b; }
	.header-actions { display: flex; gap: 8px; align-items: center; }
	.upload-label { cursor: pointer; }
	.upload-label input { display: none; }

	/* ── Source Bar ── */
	.source-bar {
		display: grid; grid-template-columns: .7fr 1.4fr auto; align-items: center; gap: 22px;
		padding: 14px 16px; border: 1px solid rgba(91, 168, 232, 0.08); border-radius: var(--ad-radius-lg, 16px);
		background: rgba(17, 25, 40, 0.5);
		backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
	}
	.source-bar span { display: block; color: #64748b; font-size: 11px; }
	.source-bar strong, .source-bar code { display: block; margin-top: 3px; color: #94a3b8; font-size: 12px; }
	.source-bar code { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.state { display: flex; align-items: center; gap: 7px; color: #64748b; font-size: 12px; }
	.state span { width: 8px; height: 8px; border-radius: 50%; background: #f59e0b; }

	/* ── Editor Panel ── */
	.editor-panel {
		margin-top: 18px; border: 1px solid rgba(91, 168, 232, 0.08); border-radius: var(--ad-radius-lg, 16px);
		background: rgba(17, 25, 40, 0.5);
		backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
		overflow: hidden;
	}
	.editor-heading {
		display: flex; align-items: center; justify-content: space-between; gap: 12px;
		padding: 14px 16px; border-bottom: 1px solid rgba(91, 168, 232, 0.08);
	}
	.editor-heading span, .editor-heading strong { display: block; }
	.editor-heading span { color: #64748b; font-size: 11px; }
	.editor-heading strong { margin-top: 3px; font-size: 13px; color: #e2e8f0; }
	.editor-actions { display: flex; gap: 8px; }
	.editor-panel textarea {
		display: block; width: 100%; min-height: 300px; padding: 16px; border: 0; resize: vertical;
		background: rgba(11, 15, 26, 0.6); color: #e2e8f0;
		font: 13px/1.65 var(--ff-font-mono); outline: 0;
	}
	.editor-panel textarea::placeholder { color: #4b5563; }
	.preview-pane {
		margin: 0; padding: 14px 16px; border-top: 1px solid rgba(91, 168, 232, 0.08);
		background: rgba(59, 158, 255, 0.04); color: #94a3b8;
		font: 12px/1.6 var(--ff-font-mono); white-space: pre-wrap;
	}

	/* ── Items Section ── */
	.items-section { margin-top: 24px; }
	.section-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
	.section-heading h2 { margin: 0; font-size: 16px; color: #e2e8f0; }
	.section-heading span { color: #64748b; font-size: 12px; }
	.item-table {
		overflow: hidden; border: 1px solid rgba(91, 168, 232, 0.08); border-radius: var(--ad-radius-lg, 16px);
		background: rgba(17, 25, 40, 0.5);
		backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
	}
	.item-row {
		display: flex; align-items: center; justify-content: space-between; gap: 18px;
		padding: 14px 16px; border-bottom: 1px solid rgba(91, 168, 232, 0.06);
		transition: background 150ms ease;
	}
	.item-row:last-child { border-bottom: 0; }
	.item-row:hover { background: rgba(91, 168, 232, 0.05); }
	.item-row strong, .item-row small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.item-row strong { font-size: 13px; color: #e2e8f0; }
	.item-row small { margin-top: 4px; color: #64748b; font-size: 12px; }
	.item-actions { display: flex; flex: 0 0 auto; gap: 6px; }

	@media (max-width: 700px) {
		header { align-items: stretch; flex-direction: column; }
		.source-bar { grid-template-columns: 1fr; gap: 12px; }
		.item-row { align-items: stretch; flex-direction: column; gap: 10px; }
	}
</style>
