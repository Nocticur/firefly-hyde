<script lang="ts">
	import Icon from "@iconify/svelte";
	import type { EnvironmentStatus, ResourceDescriptor } from "./types";
	import { sourceLabels } from "./constants";
	import Button from "./ui/Button.svelte";
	import EmptyState from "./ui/EmptyState.svelte";

	export let resources: ResourceDescriptor[] = [];
	export let environment: EnvironmentStatus | null = null;
	export let onNavigate: (id: string) => void;

	$: contentCount = resources.filter((item) => item.group === "content").length;
	$: operationCount = resources.filter((item) => item.group === "operations").length;
	$: settingsCount = resources.filter((item) => item.group === "settings").length;
	$: readiness = environment
		? Object.values(environment).filter(Boolean).length
		: 0;

	const sourceColorMap: Record<string, string> = {
		"git-markdown": "#3b9eff",
		"git-config": "#f59e0b",
		"git-jsonc": "#a78bfa",
		"gist": "#10b981",
		"media": "#f472b6",
	};
</script>

<section class="overview" aria-labelledby="overview-title">
	<div class="page-heading">
		<div>
			<p class="eyebrow">工作台</p>
			<h1 id="overview-title">站点总览</h1>
			<p class="subtitle">集中查看内容来源、服务状态和常用入口。</p>
		</div>
		<Button variant="primary" icon="material-symbols:add-rounded" onclick={() => onNavigate("posts")}>
			新建文章
		</Button>
	</div>

	<div class="metric-strip">
		<div class="metric-card">
			<div class="metric-icon"><Icon icon="material-symbols:article-outline-rounded" width="22" /></div>
			<div class="metric-body">
				<span>内容资源</span>
				<strong>{contentCount}</strong>
			</div>
		</div>
		<div class="metric-card">
			<div class="metric-icon"><Icon icon="material-symbols:campaign-outline-rounded" width="22" /></div>
			<div class="metric-body">
				<span>运营资源</span>
				<strong>{operationCount}</strong>
			</div>
		</div>
		<div class="metric-card">
			<div class="metric-icon"><Icon icon="material-symbols:tune-rounded" width="22" /></div>
			<div class="metric-body">
				<span>配置分组</span>
				<strong>{settingsCount}</strong>
			</div>
		</div>
		<div class="metric-card">
			<div class="metric-icon"><Icon icon="material-symbols:check-circle-outline-rounded" width="22" /></div>
			<div class="metric-body">
				<span>服务就绪</span>
				<strong>{readiness}<small>/6</small></strong>
			</div>
		</div>
	</div>

	<div class="overview-grid">
		<section class="resource-section" aria-labelledby="resource-heading">
			<div class="section-heading">
				<h2 id="resource-heading">资源目录</h2>
				<span>{resources.length} 项</span>
			</div>
			<div class="resource-table">
				{#each resources.slice(0, 8) as resource}
					<button class="resource-row" onclick={() => onNavigate(resource.id)}>
						<span class="resource-mark" style="background: {sourceColorMap[resource.source] ?? '#3b9eff'}"></span>
						<span class="resource-copy">
							<strong>{resource.label}</strong>
							<small>{resource.description}</small>
						</span>
						<span class="source-tag" style="color: {sourceColorMap[resource.source] ?? '#3b9eff'}; background: {sourceColorMap[resource.source] ?? '#3b9eff'}15">{sourceLabels[resource.source]}</span>
						<Icon icon="material-symbols:chevron-right-rounded" width="20" />
					</button>
				{/each}
			</div>
		</section>

		<section class="service-section" aria-labelledby="service-heading">
			<div class="section-heading">
				<h2 id="service-heading">服务状态</h2>
				<span>仅显示连接状态</span>
			</div>
			{#if environment}
				<div class="service-list">
					{#each Object.entries(environment) as [name, ready]}
						<div class="service-row">
							<span class:ready class="status-dot"></span>
							<span>{name}</span>
							<strong>{ready ? "已配置" : "未配置"}</strong>
						</div>
					{/each}
				</div>
			{:else}
				<EmptyState icon="material-symbols:cloud-off-outline-rounded" title="正在读取服务状态…" description="正在连接后端服务，请稍候。" />
			{/if}
		</section>
	</div>
</section>

<style>
	.overview { max-width: 1180px; margin: 0 auto; }
	.page-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 28px; }
	.eyebrow { margin: 0 0 6px; color: #3b9eff; font-size: 12px; font-weight: 700; }
	h1 { margin: 0; font-size: 28px; line-height: 1.2; letter-spacing: 0; color: #e2e8f0; }
	.subtitle { margin: 8px 0 0; color: #64748b; }

	/* ── Metric Cards (dark glass) ── */
	.metric-strip {
		display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 16px;
		margin-bottom: 24px;
	}
	.metric-card {
		display: flex; align-items: center; gap: 14px;
		padding: 20px;
		border: 1px solid rgba(91, 168, 232, 0.08);
		border-radius: var(--ad-radius-md, 12px);
		background: rgba(17, 25, 40, 0.5);
		backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
		transition: border-color 200ms ease, box-shadow 200ms ease;
	}
	.metric-card:hover {
		border-color: rgba(91, 168, 232, 0.15);
		box-shadow: 0 0 24px rgba(56, 129, 216, 0.08);
	}
	.metric-icon {
		display: grid; place-items: center; width: 44px; height: 44px; flex-shrink: 0;
		border-radius: 10px;
		background: rgba(91, 168, 232, 0.08);
		color: #3b9eff;
	}
	.metric-body span { display: block; color: #64748b; font-size: 12px; }
	.metric-body strong { display: block; margin-top: 4px; font-size: 22px; font-variant-numeric: tabular-nums; color: #e2e8f0; }
	.metric-body small { color: #64748b; font-size: 14px; }

	/* ── Grid ── */
	.overview-grid { display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(260px, .8fr); gap: 24px; }
	.resource-section, .service-section { min-width: 0; }
	.section-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
	.section-heading h2 { margin: 0; font-size: 16px; color: #e2e8f0; }
	.section-heading span { color: #64748b; font-size: 12px; }

	/* ── Resource Table ── */
	.resource-table, .service-list {
		overflow: hidden; border: 1px solid rgba(91, 168, 232, 0.08); border-radius: var(--ad-radius-lg, 16px);
		background: rgba(17, 25, 40, 0.5);
		backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
	}
	.resource-row {
		display: grid; grid-template-columns: 6px minmax(0, 1fr) auto 20px; align-items: center;
		width: 100%; gap: 12px; padding: 14px 16px;
		border: 0; border-bottom: 1px solid rgba(91, 168, 232, 0.06);
		background: transparent; color: #e2e8f0; text-align: left; cursor: pointer;
		transition: background 150ms ease;
	}
	.resource-row:last-child { border-bottom: 0; }
	.resource-row:hover { background: rgba(91, 168, 232, 0.05); }
	.resource-mark { width: 4px; height: 28px; border-radius: 2px; }
	.resource-copy { min-width: 0; }
	.resource-copy strong, .resource-copy small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.resource-copy strong { font-size: 13px; color: #e2e8f0; }
	.resource-copy small { margin-top: 3px; color: #64748b; font-size: 12px; }
	.source-tag {
		display: inline-block;
		padding: 2px 8px;
		border-radius: 6px;
		font: 11px var(--ff-font-mono);
		font-weight: 600;
		white-space: nowrap;
	}

	/* ── Service List ── */
	.service-row { display: grid; grid-template-columns: 9px 1fr auto; align-items: center; gap: 9px; padding: 13px 14px; border-bottom: 1px solid rgba(91, 168, 232, 0.06); font-size: 13px; color: #94a3b8; }
	.service-row:last-child { border-bottom: 0; }
	.service-row strong { color: #64748b; font-size: 11px; }
	.status-dot { width: 8px; height: 8px; border-radius: 50%; background: #374151; }
	.status-dot.ready {
		background: #10b981;
		box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
	}

	@media (prefers-reduced-motion: no-preference) {
		.status-dot.ready { animation: status-pulse 2s ease-in-out infinite; }
		@keyframes status-pulse {
			0%, 100% { box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2); }
			50% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.08); }
		}
	}

	@media (max-width: 900px) { .overview-grid { grid-template-columns: 1fr; } }
	@media (max-width: 640px) {
		.page-heading { align-items: stretch; flex-direction: column; margin-bottom: 20px; }
		.metric-strip { grid-template-columns: 1fr 1fr; }
		.source-tag { display: none; }
		.resource-row { grid-template-columns: 6px minmax(0, 1fr) 20px; }
	}
</style>
