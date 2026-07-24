# 评论系统与控件模块说明

## 1. 模块概述

评论与控件模块包含 `components/comment/`（6 个文件）、`components/controls/`（10 个文件）、`components/moments/`（2 个文件），共 **18 个文件**，提供 6 种评论引擎适配、浮动控件、亮暗切换、搜索、归档面板、动态卡片等功能。

---

## 2. 文件清单

### components/comment/（6 个文件，约 372 行）

| 文件 | 行数 | 用途 |
|---|---|---|
| `index.astro` | 77 | 评论入口（根据 `commentConfig.type` 分发） |
| `Twikoo.astro` | 95 | Twikoo 评论（含访问量统计） |
| `Giscus.astro` | 69 | Giscus 评论（GitHub Discussions） |
| `Artalk.astro` | 54 | Artalk 评论 |
| `Disqus.astro` | 44 | Disqus 评论 |
| `Waline.astro` | 33 | Waline 评论 |

### components/controls/（10 个文件，约 2620 行）

| 文件 | 行数 | 技术 | 用途 |
|---|---|---|---|
| `DisplaySettingsIntegrated.svelte` | 1194 | Svelte | 显示设置面板（主题色、壁纸、布局、特效） |
| `FloatingTOC.astro` | 380 | Astro | 浮动目录（文章页右侧） |
| `ArchivePanel.astro` | 370 | Astro | 归档面板（时间线、筛选） |
| `Search.svelte` | 243 | Svelte | 搜索控件（Pagefind 集成） |
| `LightDarkSwitch.svelte` | 157 | Svelte | 亮暗模式切换 |
| `FloatingControls.astro` | 82 | Astro | 浮动控件容器 |
| `BackToTop.astro` | 64 | Astro | 回到顶部 |
| `BackToHome.astro` | 50 | Astro | 回到首页 |
| `BackToComment.astro` | 47 | Astro | 回到评论区 |
| `ScrollDownIndicator.astro` | 33 | Astro | 向下滚动指示 |

### components/moments/（2 个文件，约 810 行）

| 文件 | 行数 | 用途 |
|---|---|---|
| `MomentCard.astro` | 632 | 动态卡片（图片轮播、视频、标签）—— 注意：与 `features/diary/MomentCard.astro`（521行）是不同文件，前者用于动态 Feed，后者用于日记条目 |
| `MomentsCover.astro` | 178 | 动态封面（朋友圈风格） |

---

## 3. 核心组件详解

### 评论系统（comment/index.astro）

**分发逻辑**：
```typescript
// 根据 commentConfig.type 渲染对应评论组件
switch (commentConfig.type) {
  case "twikoo": return <Twikoo />;
  case "waline": return <Waline />;
  case "giscus": return <Giscus />;
  case "artalk": return <Artalk />;
  case "disqus": return <Disqus />;
  default: return null;
}
```

**支持的评论引擎**：

| 引擎 | 特点 | 配置文件 |
|---|---|---|
| Twikoo | 国内主流、支持访问量统计 | `commentConfig.twikoo` |
| Waline | 轻量、支持表情和登录模式 | `commentConfig.waline` |
| Giscus | 基于 GitHub Discussions | `commentConfig.giscus` |
| Artalk | 自托管、支持多语言 | `commentConfig.artalk` |
| Disqus | 国际主流 | `commentConfig.disqus` |

### DisplaySettingsIntegrated.svelte（1194 行）

最大的控件组件，集成所有显示设置：
- 主题色选择器（色相滑块）
- 壁纸模式切换（banner/fullscreen/overlay/none）
- 水波纹开关
- 渐变过渡开关
- 樱花特效开关
- 卡片边框开关
- 布局切换（grid/list/magazine）
- 轮播开关

### FloatingTOC.astro（380 行）

文章页浮动目录：
- IntersectionObserver 滚动追踪
- 当前标题高亮
- 点击跳转
- 移动端适配

### ArchivePanel.astro（370 行）

归档面板：
- 时间线渲染（posts + moments + bangumi + life）
- 查询参数筛选（`?category=`、`?tag=`）
- 年份折叠/展开

---

## 4. 编码约定

### 评论组件模式

```astro
---
interface Props {
  id?: string;
}
---
<div id={id || "twikoo-container"}></div>
<script is:inline define:vars={{ ... }}>
  // 初始化评论系统
</script>
```

### 控件组件模式

- Svelte 组件通过 `client:load` 挂载（需要立即交互）
- Astro 组件用于静态布局
- 所有控件使用 CSS 变量主题

---

## 5. 技术债与改进建议

| 问题 | 严重度 | 建议 |
|---|---|---|
| `DisplaySettingsIntegrated.svelte` 1194 行 | 中 | 可拆分为 ThemeSettings、WallpaperSettings、EffectSettings 等子组件 |
| `MomentCard.astro` 632 行 | 低 | 可拆分为图片轮播、视频播放、标签显示等子组件 |
| `ArchivePanel.astro` 370 行 | 低 | 可抽取时间线渲染逻辑为独立组件 |
| 评论系统无统一错误处理 | 低 | 各引擎加载失败时缺乏统一降级 |
