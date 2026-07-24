# 通用组件模块说明

## 1. 模块概述

通用组件模块包含 `components/common/`（16 个文件）、`components/atoms/`（4 个文件）、`components/misc/`（4 个文件），共 **24 个文件**，提供图片处理、分页、按钮、下拉菜单、Widget 外壳、图标、版权、分享等基础 UI 组件。

---

## 2. 文件清单

### components/common/（16 个文件，约 1922 行）

| 文件 | 行数 | 技术 | 用途 |
|---|---|---|---|
| `CoverImage.astro` | 353 | Astro | 封面图（随机图 API fallback、LQIP、响应式） |
| `Pagination.astro` | 223 | Astro | 分页组件（上一页/下一页/页码） |
| `PioMessageBox.astro` | 309 | Astro | Live2D 消息框（打字机效果） |
| `ClientPagination.svelte` | 186 | Svelte | 客户端分页（无刷新） |
| `FloatingButton.astro` | 188 | Astro | 浮动按钮（展开菜单） |
| `ImageWrapper.astro` | 138 | Astro | 图片包装器（优化格式、LQIP 占位、referrerpolicy） |
| `WidgetLayout.astro` | 136 | Astro | Widget 统一外壳（标题、折叠、动画） |
| `CopyMessage.svelte` | 140 | Svelte | 复制内容提示弹窗 |
| `Icon.svelte` | 59 | Svelte | 图标组件（Iconify 集成） |
| `DropdownItem.svelte` | 47 | Svelte | 下拉菜单项 |
| `DropdownItem.astro` | 41 | Astro | 下拉菜单项（静态版） |
| `ButtonLink.astro` | 43 | Astro | 链接按钮 |
| `DropdownPanel.svelte` | 20 | Svelte | 下拉面板 |
| `DropdownPanel.astro` | 15 | Astro | 下拉面板（静态版） |
| `ButtonTag.astro` | 15 | Astro | 标签按钮 |
| `Markdown.astro` | 9 | Astro | Markdown 渲染包装器 |

### components/atoms/（4 个文件，约 114 行）

| 文件 | 行数 | 用途 |
|---|---|---|
| `FilterTabs.astro` | 113 | 筛选标签页（分类/状态切换） |
| `Icon/Icon.astro` | - | 图标原子组件 |
| `Icon/types.ts` | - | 图标类型定义 |
| `index.ts` | 1 | 模块导出 |

### components/misc/（4 个文件，约 1015 行）

| 文件 | 行数 | 技术 | 用途 |
|---|---|---|---|
| `SharePoster.svelte` | 536 | Svelte | 分享海报（Canvas 生成） |
| `RecommendedPost.astro` | 228 | Astro | 相关文章推荐 |
| `License.astro` | 93 | Astro | 版权声明（CC 协议） |
| `Icon.astro` | 34 | Astro | 图标组件 |

---

## 3. 核心组件详解

### ImageWrapper.astro（138 行）

图片处理的核心组件，被布局和页面广泛使用：
- 支持 Astro `<Picture>` 优化格式（webp、avif）
- LQIP 占位渐变（从 `lqip-utils.ts` 获取）
- 自动添加 `referrerpolicy="no-referrer"`（通过 `shouldAddNoReferrer()`）
- 响应式 `widths` 和 `sizes` 配置

### CoverImage.astro（353 行）

文章封面图组件：
- 支持本地图片、远程 URL、随机图 API 三种来源
- API 模式下按顺序尝试多个 API，全部失败使用 fallback
- 渐进式加载（LQIP → 完整图）
- 响应式尺寸（桌面/移动端不同 widths）

### WidgetLayout.astro（136 行）

所有 Widget 的统一外壳：
- 标题渲染（可选显示/隐藏）
- 折叠/展开功能
- 入场动画（onload-animation + animation-delay）
- `card-base` 样式类

### Pagination.astro（223 行）/ ClientPagination.svelte（186 行）

两套分页组件：
- `Pagination.astro`：服务端渲染，用于文章列表页
- `ClientPagination.svelte`：客户端分页，用于搜索结果等动态内容

---

## 4. 编码约定

### 组件技术选型

| 场景 | 技术 | 原因 |
|---|---|---|
| 静态展示 | Astro 组件 | 构建时渲染 |
| 客户端交互 | Svelte 组件 | 响应式状态 |
| 通用外壳 | Astro 组件 | 零 JS 开销 |

### Props 模式

```astro
interface Props {
  class?: string;
  style?: string;
  // 组件特定 props
}
```

---

## 5. 技术债与改进建议

| 问题 | 严重度 | 建议 |
|---|---|---|
| `CoverImage.astro` 353 行 | 低 | 可拆分为 API fallback 和本地图片两个子组件 |
| `SharePoster.svelte` 536 行 | 低 | Canvas 逻辑复杂，可抽取为工具函数 |
| `PioMessageBox.astro` 309 行 | 低 | Live2D 消息框与 Live2DWidget 耦合 |
| DropdownItem/DropdownPanel 有 Astro+Svelte 双版本 | 低 | 可考虑统一为 Svelte 版 |
