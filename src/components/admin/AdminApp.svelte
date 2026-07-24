<script lang="ts">
	import Icon from "@iconify/svelte";
	import { onDestroy, onMount } from "svelte";
	import { adminFetch, setCsrfToken } from "./api";
	import Dashboard from "./Dashboard.svelte";
	import ResourceView from "./ResourceView.svelte";
	import type { EnvironmentStatus, ResourceDescriptor, ResourceGroup } from "./types";
	import { groupLabels, groupIcons, resourceIcons } from "./constants";
	import Input from "./ui/Input.svelte";
	import Button from "./ui/Button.svelte";
	import EmptyState from "./ui/EmptyState.svelte";

	export let initialRoute = "dashboard";

	type AuthState = "checking" | "authenticated" | "guest";

	let authState: AuthState = "checking";
	let username = "";
	let password = "";
	let loginError = "";
	let busy = false;
	let resources: ResourceDescriptor[] = [];
	let environment: EnvironmentStatus | null = null;
	let route = initialRoute || "dashboard";
	let mobileNavOpen = false;
	let sidebarCollapsed = false;
	let toastMessage = "";
	let toastKind: "success" | "error" = "success";
	let toastTimer: ReturnType<typeof setTimeout> | undefined;

	$: currentResource = resources.find((resource) => resource.id === route);
	$: groupedResources = Object.entries(groupLabels).map(([group, label]) => ({
		group: group as ResourceGroup,
		label,
		items: resources.filter((resource) => resource.group === group),
	}));

	function showToast(message: string, kind: "success" | "error" = "success") {
		toastMessage = message;
		toastKind = kind;
		if (toastTimer) clearTimeout(toastTimer);
		toastTimer = setTimeout(() => (toastMessage = ""), 3200);
	}

	function navigate(nextRoute: string, replace = false) {
		route = nextRoute || "dashboard";
		mobileNavOpen = false;
		const path = route === "dashboard" ? "/admin/" : `/admin/${route}/`;
		if (replace) history.replaceState({ route }, "", path);
		else history.pushState({ route }, "", path);
	}

	function routeFromPath(): string {
		return location.pathname.replace(/^\/admin\/?/, "").replace(/\/$/, "") || "dashboard";
	}

	async function loadAdminData() {
		const [resourceResult, environmentResult] = await Promise.all([
			adminFetch<{ items: ResourceDescriptor[] }>("resources/"),
			adminFetch<EnvironmentStatus>("environment/status/"),
		]);
		resources = resourceResult.items;
		environment = environmentResult;
	}

	async function checkAuth() {
		try {
			const session = await adminFetch<{ csrfToken: string }>("auth/me/");
			setCsrfToken(session.csrfToken);
			authState = "authenticated";
			await loadAdminData();
		} catch {
			authState = "guest";
		}
	}

	function encodeBasic(value: string): string {
		const bytes = new TextEncoder().encode(value);
		let binary = "";
		for (const byte of bytes) binary += String.fromCharCode(byte);
		return btoa(binary);
	}

	async function login() {
		if (!username.trim() || !password) {
			loginError = "请输入用户名和密码";
			return;
		}
		busy = true;
		loginError = "";
		try {
			const session = await adminFetch<{ csrfToken: string }>("auth/login/", {
				method: "POST",
				headers: { Authorization: `Basic ${encodeBasic(`${username}:${password}`)}` },
			});
			setCsrfToken(session.csrfToken);
			password = "";
			authState = "authenticated";
			await loadAdminData();
		} catch (error) {
			loginError = error instanceof Error ? error.message : "登录失败";
		} finally {
			busy = false;
		}
	}

	async function logout() {
		try {
			await adminFetch("auth/logout/", { method: "POST" });
		} finally {
			setCsrfToken("");
			resources = [];
			environment = null;
			authState = "guest";
			navigate("dashboard", true);
		}
	}

	function handlePopState() {
		route = routeFromPath();
		mobileNavOpen = false;
	}

	onMount(() => {
		route = routeFromPath();
		window.addEventListener("popstate", handlePopState);
		checkAuth();
	});

	onDestroy(() => {
		window.removeEventListener("popstate", handlePopState);
		if (toastTimer) clearTimeout(toastTimer);
	});
</script>

<svelte:head>
	<title>Firefly 后台管理</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

{#if authState === "checking"}
	<div class="loading-screen" aria-live="polite">
		<div class="brand-symbol"><Icon icon="material-symbols:flare-rounded" width="25" /></div>
		<span>正在验证会话</span>
	</div>
{:else if authState === "guest"}
	<main class="login-screen">
		<section class="login-panel" aria-labelledby="login-title">
			<div class="login-brand">
				<div class="brand-symbol"><Icon icon="material-symbols:flare-rounded" width="25" /></div>
				<div><strong>Firefly</strong><span>内容管理</span></div>
			</div>
			<div class="login-heading">
				<p>管理员入口</p>
				<h1 id="login-title">登录后台</h1>
			</div>
			<form onsubmit={(e) => { e.preventDefault(); login(); }}>
				<Input id="admin-user" label="用户名" bind:value={username} autocomplete="username" placeholder="管理员用户名" />
				<Input id="admin-password" label="密码" type="password" bind:value={password} onkeydown={(event) => event.key === "Enter" && login()} autocomplete="current-password" placeholder="管理员密码" error={loginError} />
				<Button type="submit" size="lg" className="login-submit" disabled={busy}>{busy ? "正在登录" : "登录"}</Button>
			</form>
		</section>
		<aside class="login-context">
			<span>Git 驱动内容平台</span>
			<strong>编辑、预览、提交，<br />每次修改都有版本记录。</strong>
			<div class="context-line"><i></i>目标分支 <code>main</code></div>
		</aside>
	</main>
{:else}
	<div class="admin-shell" class:sidebar-collapsed={sidebarCollapsed}>
		<div class:open={mobileNavOpen} class="mobile-scrim" role="button" tabindex="0" aria-label="关闭导航" onclick={() => (mobileNavOpen = false)} onkeydown={(event) => event.key === "Escape" && (mobileNavOpen = false)}></div>
		<aside class:open={mobileNavOpen} class="sidebar">
			<div class="sidebar-brand">
				<div class="brand-symbol"><Icon icon="material-symbols:flare-rounded" width="23" /></div>
				{#if !sidebarCollapsed}
					<div><strong>Firefly</strong><span>Admin</span></div>
				{/if}
				<button class="mobile-close" aria-label="关闭导航" onclick={() => (mobileNavOpen = false)}><Icon icon="material-symbols:close-rounded" width="22" /></button>
			</div>
			<nav aria-label="后台导航">
				<button class:active={route === "dashboard"} onclick={() => navigate("dashboard")} title="工作台">
					<Icon icon="material-symbols:space-dashboard-outline-rounded" width="20" />
					{#if !sidebarCollapsed}<span>工作台</span>{/if}
				</button>
				{#each groupedResources as section}
					{#if section.items.length}
						<div class="nav-section">
							{#if !sidebarCollapsed}
								<div class="nav-label"><Icon icon={groupIcons[section.group]} width="15" />{section.label}</div>
							{/if}
							{#each section.items as resource}
								<button class:active={route === resource.id} onclick={() => navigate(resource.id)} title={resource.label}>
									<Icon icon={resourceIcons[resource.id] ?? "material-symbols:circle-outline"} width="19" />
									{#if !sidebarCollapsed}<span>{resource.label}</span>{/if}
								</button>
							{/each}
						</div>
					{/if}
				{/each}
				<div class="nav-section">
					{#if !sidebarCollapsed}
						<div class="nav-label"><Icon icon={groupIcons.system} width="15" />系统</div>
					{/if}
					<button class:active={route === "deployments"} onclick={() => navigate("deployments")} title="发布记录"><Icon icon="material-symbols:rocket-launch-outline-rounded" width="19" />{#if !sidebarCollapsed}<span>发布记录</span>{/if}</button>
					<button class:active={route === "audit"} onclick={() => navigate("audit")} title="审计日志"><Icon icon="material-symbols:history-rounded" width="19" />{#if !sidebarCollapsed}<span>审计日志</span>{/if}</button>
				</div>
			</nav>
			<div class="sidebar-footer">
				{#if !sidebarCollapsed}
					<a href="/" target="_blank"><Icon icon="material-symbols:open-in-new-rounded" width="18" />查看前台</a>
					<button onclick={logout}><Icon icon="material-symbols:logout-rounded" width="18" />退出</button>
				{:else}
					<a href="/" target="_blank" title="查看前台"><Icon icon="material-symbols:open-in-new-rounded" width="18" /></a>
					<button onclick={logout} title="退出"><Icon icon="material-symbols:logout-rounded" width="18" /></button>
				{/if}
			</div>
		</aside>

		<div class="workspace">
			<header class="topbar">
				<button class="menu-button" aria-label="打开导航" onclick={() => (mobileNavOpen = true)}><Icon icon="material-symbols:menu-rounded" width="23" /></button>
				<button class="collapse-toggle" aria-label={sidebarCollapsed ? "展开侧栏" : "收起侧栏"} onclick={() => (sidebarCollapsed = !sidebarCollapsed)}>
					<Icon icon={sidebarCollapsed ? "material-symbols:keyboard-double-arrow-right-rounded" : "material-symbols:keyboard-double-arrow-left-rounded"} width="20" />
				</button>
				<div class="publish-rail">
					<span class="rail-status"></span>
					<strong>main</strong>
					<span>Git 发布通道</span>
				</div>
				<div class="topbar-actions">
					<nav class="breadcrumb" aria-label="面包屑">
						<button class:current={route === "dashboard"} onclick={() => navigate("dashboard")}>工作台</button>
						{#if route !== "dashboard" && currentResource}
							<span class="breadcrumb-sep">/</span>
							<span class="breadcrumb-current">{currentResource.label}</span>
						{:else if route === "audit" || route === "deployments"}
							<span class="breadcrumb-sep">/</span>
							<span class="breadcrumb-current">{route === "audit" ? "审计日志" : "发布记录"}</span>
						{/if}
					</nav>
					{#if route === "dashboard"}
						<button aria-label="刷新状态" title="刷新状态" onclick={() => loadAdminData().then(() => showToast("状态已刷新"))}><Icon icon="material-symbols:refresh-rounded" width="20" /></button>
					{/if}
					<div class="avatar">A</div>
				</div>
			</header>
			<main class="content-area">
				{#if route === "dashboard"}
					<Dashboard {resources} {environment} onNavigate={navigate} />
				{:else if currentResource}
					<ResourceView resource={currentResource} onBack={() => navigate("dashboard")} />
				{:else}
					<EmptyState icon="material-symbols:settings-outline-rounded" title={route === "audit" ? "审计日志" : "发布记录"} description="该视图将在状态数据同步后显示。" />
				{/if}
			</main>
		</div>
	</div>
	{#if toastMessage}<div class:error={toastKind === "error"} class="toast" role="status">{toastMessage}</div>{/if}
{/if}

<style>
	/* ── Admin Dark Theme Variables ── */
	:global(.admin-shell), .admin-shell {
		--ad-base: #0b0f1a;
		--ad-surface: rgba(17, 25, 40, 0.75);
		--ad-surface-solid: #111827;
		--ad-surface-hover: rgba(25, 38, 62, 0.6);
		--ad-card: rgba(17, 25, 40, 0.6);
		--ad-sidebar: #0d1321;
		--ad-sidebar-active: rgba(91, 168, 232, 0.12);
		--ad-border: rgba(91, 168, 232, 0.08);
		--ad-border-strong: rgba(91, 168, 232, 0.15);
		--ad-text: #e2e8f0;
		--ad-text-secondary: #94a3b8;
		--ad-text-muted: #64748b;
		--ad-accent: #3b9eff;
		--ad-accent-hover: #5ba8e8;
		--ad-accent-glow: rgba(91, 168, 232, 0.25);
		--ad-success: #10b981;
		--ad-danger: #ef4444;
		--ad-warning: #f59e0b;
		--ad-radius-sm: 8px;
		--ad-radius-md: 12px;
		--ad-radius-lg: 16px;
	}

	/* ── Global Reset & Dark Base ── */
	:global(*) { box-sizing: border-box; }
	:global(html) { background: #0b0f1a; }
	:global(body) {
		margin: 0; min-width: 320px;
		background: #0b0f1a;
		color: #e2e8f0;
		font-family: var(--ff-font-base);
		letter-spacing: 0;
	}
	:global(button), :global(input) { font: inherit; }
	:global(button:focus-visible), :global(a:focus-visible), :global(input:focus-visible) { outline: 2px solid rgba(91, 168, 232, 0.4); outline-offset: 2px; }

	/* ── Deep Blue Glow Background ── */
	:global(body)::before {
		content: "";
		position: fixed;
		top: -20%;
		left: -10%;
		width: 60%;
		height: 70%;
		border-radius: 50%;
		background: radial-gradient(ellipse, rgba(56, 129, 216, 0.12) 0%, rgba(91, 168, 232, 0.05) 40%, transparent 70%);
		pointer-events: none;
		z-index: 0;
	}
	:global(body)::after {
		content: "";
		position: fixed;
		bottom: -30%;
		right: -15%;
		width: 55%;
		height: 60%;
		border-radius: 50%;
		background: radial-gradient(ellipse, rgba(59, 130, 246, 0.08) 0%, transparent 65%);
		pointer-events: none;
		z-index: 0;
	}

	/* ── Loading ── */
	.loading-screen {
		display: flex; align-items: center; justify-content: center; gap: 12px;
		min-height: 100vh; color: #64748b;
	}
	.brand-symbol {
		display: grid; place-items: center; width: 38px; height: 38px; border-radius: var(--ad-radius-md);
		background: linear-gradient(135deg, #1e40af, #7c3aed);
		color: white;
		box-shadow: 0 0 24px rgba(59, 130, 246, 0.3);
	}

	/* ── Login ── */
	.login-screen {
		display: grid; grid-template-columns: minmax(0, 460px) minmax(0, 1fr); min-height: 100vh;
		background: #0b0f1a;
		position: relative; z-index: 1;
	}
	.login-panel {
		display: flex; flex-direction: column; justify-content: center; padding: clamp(32px, 7vw, 76px);
		background: #0d1321;
		border-right: 1px solid rgba(91, 168, 232, 0.08);
	}
	.login-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 76px; }
	.login-brand > div:last-child span, .sidebar-brand span { display: block; color: #64748b; font: 11px var(--ff-font-mono); }
	.login-heading p { margin: 0 0 8px; color: #3b9eff; font-size: 12px; font-weight: 700; }
	.login-heading h1 { margin: 0 0 34px; font-size: 30px; letter-spacing: 0; color: #e2e8f0; }
	.login-panel form { display: flex; flex-direction: column; gap: var(--ff-space-4); }
	:global(.login-submit) { width: 100%; margin-top: var(--ff-space-2); }
	.login-context {
		display: flex; justify-content: center; flex-direction: column; padding: clamp(42px, 8vw, 130px);
		background: linear-gradient(135deg, #111827 0%, #0b0f1a 100%);
		color: white;
		position: relative; overflow: hidden;
	}
	.login-context::after {
		content: ""; position: absolute; top: -50px; right: -50px; width: 400px; height: 400px; border-radius: 50%;
		background: radial-gradient(circle, rgba(56, 129, 216, 0.12) 0%, transparent 70%);
	}
	.login-context > span { color: #f59e0b; font-size: 12px; font-weight: 700; position: relative; z-index: 1; }
	.login-context > strong { max-width: 760px; margin: 20px 0 46px; font-size: clamp(30px, 4.6vw, 58px); line-height: 1.18; position: relative; z-index: 1; }
	.context-line { display: flex; align-items: center; gap: 9px; color: #94a3b8; font-size: 13px; position: relative; z-index: 1; }
	.context-line i { width: 9px; height: 9px; border-radius: 50%; background: #10b981; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15); }
	.context-line code { color: #e2e8f0; }

	/* ── Shell ── */
	.admin-shell { min-height: 100vh; position: relative; z-index: 1; }

	/* ── Sidebar ── */
	.sidebar {
		position: fixed; z-index: 30; inset: 0 auto 0 0; display: flex; flex-direction: column; width: 244px;
		background: #0d1321;
		border-right: 1px solid rgba(91, 168, 232, 0.08);
		color: #e2e8f0;
		transition: width var(--ff-transition-base);
	}
	.sidebar-collapsed .sidebar { width: 64px; }
	.sidebar-brand {
		display: flex; align-items: center; gap: 11px; min-height: 72px; padding: 0 18px;
		border-bottom: 1px solid rgba(91, 168, 232, 0.08);
	}
	.sidebar-brand .brand-symbol { width: 34px; height: 34px; }
	.sidebar-brand strong { display: block; color: #e2e8f0; }
	.mobile-close { display: none; margin-left: auto; border: 0; background: transparent; color: #94a3b8; }

	/* ── Sidebar Nav ── */
	.sidebar nav { flex: 1; overflow-y: auto; padding: 12px 10px 24px; scrollbar-width: thin; scrollbar-color: rgba(91, 168, 232, 0.15) transparent; }
	.sidebar nav button {
		display: flex; align-items: center; width: 100%; min-height: 38px; gap: 10px; padding: 0 10px;
		border: 0; border-radius: var(--ad-radius-sm); background: transparent;
		color: #94a3b8; text-align: left; cursor: pointer;
		transition: background 120ms ease, color 120ms ease;
		position: relative;
	}
	.sidebar nav button:hover { background: rgba(91, 168, 232, 0.08); color: #e2e8f0; }
	.sidebar nav button.active {
		background: rgba(91, 168, 232, 0.12); color: #3b9eff;
		font-weight: 600;
	}
	.sidebar nav button.active::before {
		content: ""; position: absolute; left: 0; top: 8px; bottom: 8px; width: 3px;
		background: #3b9eff; border-radius: 0 2px 2px 0;
	}
	.sidebar nav button span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.nav-section { margin-top: 18px; }
	.nav-label { display: flex; align-items: center; gap: 6px; padding: 0 10px 7px; color: #4b5563; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }

	/* ── Sidebar Footer ── */
	.sidebar-footer { display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid rgba(91, 168, 232, 0.08); }
	.sidebar-footer a, .sidebar-footer button {
		display: flex; align-items: center; justify-content: center; gap: 6px; min-height: 52px;
		border: 0; background: transparent; color: #64748b; font-size: 12px; text-decoration: none; cursor: pointer;
		transition: color 120ms ease, background 120ms ease;
	}
	.sidebar-footer a:hover, .sidebar-footer button:hover { color: #3b9eff; background: rgba(91, 168, 232, 0.06); }

	/* ── Workspace ── */
	.workspace { min-height: 100vh; margin-left: 244px; transition: margin-left var(--ff-transition-base); }
	.sidebar-collapsed .workspace { margin-left: 64px; }

	/* ── Topbar ── */
	.topbar {
		position: sticky; z-index: 20; top: 0; display: flex; align-items: center; height: 60px; padding: 0 24px;
		border-bottom: 1px solid rgba(91, 168, 232, 0.08);
		background: rgba(11, 15, 26, 0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
	}
	.menu-button { display: none; }
	.collapse-toggle {
		display: grid; place-items: center; width: 36px; height: 36px; margin-right: 8px;
		border: 1px solid rgba(91, 168, 232, 0.1); border-radius: var(--ad-radius-sm);
		background: rgba(17, 25, 40, 0.5); color: #94a3b8; cursor: pointer;
		transition: color 120ms ease, border-color 120ms ease, background 120ms ease;
	}
	.collapse-toggle:hover { color: #3b9eff; border-color: rgba(91, 168, 232, 0.25); background: rgba(91, 168, 232, 0.08); }
	.publish-rail { display: flex; align-items: center; gap: 8px; color: #64748b; font-size: 12px; }
	.publish-rail strong { color: #94a3b8; font-family: var(--ff-font-mono); }
	.rail-status { width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.25); }
	.topbar-actions { display: flex; align-items: center; gap: 10px; margin-left: auto; }
	.topbar-actions button, .menu-button {
		display: grid; place-items: center; width: 36px; height: 36px;
		border: 1px solid rgba(91, 168, 232, 0.1); border-radius: var(--ad-radius-sm);
		background: rgba(17, 25, 40, 0.5); color: #94a3b8; cursor: pointer;
		transition: color 120ms ease, border-color 120ms ease, background 120ms ease;
	}
	.topbar-actions button:hover { color: #3b9eff; border-color: rgba(91, 168, 232, 0.25); background: rgba(91, 168, 232, 0.08); }
	.avatar {
		display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%;
		background: linear-gradient(135deg, #1e40af, #7c3aed);
		color: white; font-weight: 800; font-size: 13px;
	}

	/* ── Breadcrumb ── */
	.breadcrumb { display: flex; align-items: center; gap: 4px; font-size: 13px; margin-right: 8px; }
	.breadcrumb button {
		background: transparent; border: 0; color: #64748b; cursor: pointer; padding: 0; font-size: 13px;
		transition: color 120ms ease;
	}
	.breadcrumb button:hover { color: #3b9eff; }
	.breadcrumb button.current { color: #e2e8f0; font-weight: 600; }
	.breadcrumb-sep { color: #4b5563; margin: 0 2px; }
	.breadcrumb-current { color: #e2e8f0; font-weight: 600; }

	/* ── Content ── */
	.content-area { padding: 30px clamp(18px, 3vw, 42px) 60px; }

	/* ── Toast ── */
	.toast {
		position: fixed; z-index: 60; right: 24px; bottom: 24px; padding: 11px 15px;
		border-radius: var(--ad-radius-md);
		background: #065f46; color: #a7f3d0;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4); font-size: 13px;
		border: 1px solid rgba(16, 185, 129, 0.2);
	}
	.toast.error { background: #7f1d1d; color: #fecaca; border-color: rgba(239, 68, 68, 0.2); }

	/* ── Mobile Scrim ── */
	.mobile-scrim { display: none; }

	/* ── Transitions ── */
	@media (prefers-reduced-motion: no-preference) {
		.sidebar { transition: transform 0.2s ease, width var(--ff-transition-base); }
	}

	/* ── Tablet ── */
	@media (max-width: 820px) {
		.sidebar { transform: translateX(-100%); width: 244px; }
		.sidebar.open { transform: translateX(0); }
		.mobile-close { display: grid; place-items: center; }
		.mobile-scrim.open { position: fixed; z-index: 25; inset: 0; display: block; background: rgba(0, 0, 0, 0.6); }
		.workspace { margin-left: 0; }
		.sidebar-collapsed .workspace { margin-left: 0; }
		.menu-button { display: grid; margin-right: 12px; }
		.collapse-toggle { display: none; }
		.content-area { padding-top: 22px; }
	}

	/* ── Mobile ── */
	@media (max-width: 700px) {
		.login-screen { grid-template-columns: 1fr; }
		.login-panel { min-height: 100vh; padding: 30px 24px; border-right: 0; }
		.login-brand { margin-bottom: 56px; }
		.login-context { display: none; }
		.publish-rail > span:last-child { display: none; }
		.topbar { height: 56px; padding: 0 14px; }
		.content-area { padding-inline: 15px; }
		.toast { right: 15px; bottom: 15px; left: 15px; text-align: center; }
		.breadcrumb { display: none; }
	}
</style>
