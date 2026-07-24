# 特色功能模块说明

## 1. 模块概述

Features 模块是 Firefly 博客主题的功能层，包含两大类组件：

- **核心功能组件**（`components/features/`）：加密文章、Live2D/Spine 看板娘、背景视频、音乐播放器、樱花特效、打字机文字等
- **页面级交互组件**（`components/pages/`）：动画追踪、番剧追踪、动态/说说、相册、搜索
- **数据定义**（`data/`）：设备、日记、项目、技能、时间线等结构化数据

技术选型：**Astro 组件**用于静态展示和构建时渲染；**Svelte 组件**用于需要客户端交互的功能（搜索、筛选、弹窗、API 数据获取）。

---

## 2. 文件清单与分类

### 2.1 根组件（`components/features/`）

| 文件 | 行数 | 技术 | 用途 |
|---|---|---|---|
| `MusicPlayer.astro` | 894 | Astro | 音乐播放器 UI（歌词、播放列表、控制面板） |
| `MusicManager.astro` | 566 | Astro | 音乐播放管理器（状态管理、Meting API 集成） |
| `SakuraEffect.astro` | 569 | Astro + Worker | 樱花特效（OffscreenCanvas 加速渲染） |
| `Live2DWidget.astro` | 460 | Astro | Live2D 看板娘（模型加载、菜单、提示气泡） |
| `SpineModel.astro` | 459 | Astro | Spine 3D 模型（点击交互、fallback 加载） |
| `BackgroundPlayer.astro` | 228 | Astro | 背景视频播放器（多视频切换、控制按钮） |
| `FancyboxManager.astro` | 211 | Astro | 图片灯箱管理（SVG 预处理、Fancybox 集成） |
| `EncryptedContent.astro` | 205 | Astro | AES-GCM 加密内容解密（浏览器端解密） |
| `FontSetup.astro` | 90 | Astro | 字体加载（Astro Font API + CSS 变量） |
| `ScrollProgressBar.astro` | 101 | Astro | 滚动进度条（渐变动画） |
| `TitleChange.astro` | 27 | Astro | 标签页标题切换动画（离开/回到标签页） |
| `TypewriterText.astro` | ~80 | Astro + TS class | 打字机文字效果（支持数组文本循环） |
| `EncryptedPost.astro` | 13 | Astro | 加密文章包装器（委托 EncryptedContent） |
| `KatexManager.astro` | 3 | Astro | KaTeX CSS 加载（数学公式支持） |

### 2.2 子目录组件

| 子目录 | 组件 | 数据来源 | 用途 |
|---|---|---|---|
| `devices/` | `DeviceCard.astro`（25行） | `data/devices.ts` | 设备卡片（图片、规格、价格） |
| `diary/` | `MomentCard.astro`（521行） | `data/diary.ts` | 日记/说说卡片（轮播、视频、标签、嵌套内容） |
| `page-header/` | `PageHeader.astro`（24行） | - | 页面标题头（标题 + 副标题） |
| `projects/` | `ProjectCard.astro`（139行） | `data/projects.ts` | 项目展示卡片（技术栈、状态、链接） |
| `skills/` | `SkillCard.astro`（177行） | `data/skills.ts` | 技能卡片（进度条、等级、经验） |
| `timeline/` | `TimelineCard.astro`（348行） | `data/timeline.ts` | 时间线卡片（节点、链接、技能标签） |

### 2.3 页面级交互组件（`components/pages/`）

| 子目录 | 主要组件 | 技术 | 用途 |
|---|---|---|---|
| `anime/` | `AnimeGrid.svelte`（139行） | Svelte | 动画网格（搜索、筛选、排序、分页） |
| | `AnimeCard.svelte`（144行） | Svelte | 动画卡片（hover 效果、LQIP） |
| | `AnimeDetailModal.svelte`（200行） | Svelte | 动画详情弹窗（Portal 渲染） |
| `bangumi/` | `BangumiGrid.svelte`（88行） | Svelte | 番剧网格（API 数据获取、分类切换） |
| | `BangumiSection.svelte`（190行） | Svelte | 番剧分区（状态筛选、瀑布流） |
| | `Card.svelte`（203行） | Svelte | 番剧卡片（封面 fallback、状态徽章） |
| | `FilterControls.svelte`（33行） | Svelte | 筛选控件 |
| | `TabNav.svelte`（64行） | Svelte | 标签导航（URL hash 集成） |
| `dynamic/` | `DynamicFeed.svelte`（312行） | Svelte | 动态 Feed（API 获取、搜索、年份筛选） |
| | `DynamicItem.astro`（91行） | Astro | 动态条目（头像、时间、内容） |
| | `DynamicGallery.astro`（63行） | Astro | 动态图片画廊 |
| | `DynamicItemTemplate.astro`（47行） | Astro | 动态条目模板 |
| `gallery/` | `AlbumCard.astro` | Astro | 相册卡片 |
| | `PhotoCard.astro` | Astro | 照片卡片 |
| 根目录 | `AdvancedSearch.svelte`（191行） | Svelte | 全文搜索（Pagefind、debounce、高亮） |

### 2.4 数据文件（`data/`）

| 文件 | 导出 | 数据结构 | 说明 |
|---|---|---|---|
| `devices.ts` | `devicesData: DeviceCategory` | `{ [category]: Device[] }` | 按类别分组的设备（数码、家电等） |
| `diary.ts` | 日记数据数组 | `DiaryItem[]` | 日记条目（内容、图片、视频） |
| `moments.ts` | 动态数据数组 | - | 说说/动态条目 |
| `music.ts` / `music.json` | 音乐数据 | - | 本地音乐列表 |
| `projects.ts` | `projectsData: Project[]` | `Project` | 项目展示数据 |
| `skills.ts` | `skillsData: Skill[]` | `Skill` | 技能树数据 |
| `timeline.ts` | 时间线数据数组 | `TimelineItem[]` | 时间线条目 |

---

## 3. 核心功能详解

### 3.1 加密系统

**组件**：`EncryptedContent.astro`（205行）+ `EncryptedPost.astro`（13行）

**工作流程**：
1. 文章 frontmatter 中设置 `password: "xxx"` 启用加密
2. 构建时内容被加密，存储在 `data-encrypted-*` HTML 属性中
3. 浏览器端通过 Web Crypto API（`crypto.subtle.importKey`）导入密码
4. 使用 AES-GCM 算法解密内容
5. 解密后动态插入 DOM

**关键特性**：
- 密码不发送到服务器，完全浏览器端解密
- 支持密码提示（`passwordHint`）
- 解密失败时显示错误提示

### 3.2 音乐播放器

**组件**：`MusicPlayer.astro`（894行）+ `MusicManager.astro`（566行）

**架构**：
- `MusicManager`：状态管理器，处理播放列表、播放状态、API 调用
- `MusicPlayer`：UI 组件，渲染控制面板、歌词、播放列表

**支持的模式**：
- `meting`：通过 Meting API 获取音乐（支持网易云、QQ 音乐、酷狗等）
- `local`：使用本地音乐文件（`/assets/music/`）

**功能特性**：
- 播放/暂停/上一首/下一首
- 进度条拖拽
- 音量控制
- 播放模式切换（列表循环/单曲循环/随机）
- 歌词同步显示
- 迷你播放器（导航栏）
- 侧边栏播放器
- 全局播放器同步（`syncWithGlobalPlayer`）

### 3.3 Live2D / Spine 看板娘

**Live2D 组件**：`Live2DWidget.astro`（460行）
- 加载 Live2D 模型（支持多模型切换）
- 自定义菜单（图标、标签、动作）
- 提示气泡（欢迎消息、随机消息、打字机效果）
- 响应式定位（bottom-left / bottom-right）
- 过渡动画（slide / fade）

**Spine 组件**：`SpineModel.astro`（459行）
- 加载 Spine 3D 模型
- 点击交互（MessageBox 弹窗）
- Fallback 加载（主模型失败时尝试备用模型）
- 响应式尺寸

### 3.4 樱花特效

**组件**：`SakuraEffect.astro`（569行）

**技术实现**：
- 使用 Web Worker + OffscreenCanvas 加速渲染
- 主线程仅负责创建和销毁 Worker
- Canvas 绑定到 DOM 元素，Worker 直接操作像素

**可配置项**（`sakuraConfig`）：
- 樱花数量、尺寸范围、不透明度范围
- 水平/垂直移动速度、旋转速度、消失速度
- 层级（z-index）、越界限制次数

### 3.5 背景视频播放器

**组件**：`BackgroundPlayer.astro`（228行）

**功能**：
- 支持单个或多个视频（数组）
- 播放/暂停控制
- 上一个/下一个视频切换
- 播放模式：`order`（顺序循环）/ `random`（随机切换）
- 跨页面状态保持（Swup 切页不重置）
- 加载错误处理（自动跳过失败视频）

### 3.6 数据展示页面

**技能树**（`skills/`）：
- 数据：`data/skills.ts` → `Skill` 接口（id、name、category、level、experience）
- 渲染：`SkillCard.astro`（进度条、等级徽章、经验时长）

**项目展示**（`projects/`）：
- 数据：`data/projects.ts` → `Project` 接口（id、title、techStack、status、demoUrl）
- 渲染：`ProjectCard.astro`（图片、技术栈标签、操作按钮）

**时间线**（`timeline/`）：
- 数据：`data/timeline.ts` → `TimelineItem` 接口（title、type、startDate、skills、links）
- 渲染：`TimelineCard.astro`（节点、类型图标、技能标签、链接）

**设备清单**（`devices/`）：
- 数据：`data/devices.ts` → `DeviceCategory`（按类别分组的 `Device[]`）
- 渲染：`DeviceCard.astro`（图片、规格、价格、外链）

**日记/说说**（`diary/`）：
- 数据：`data/diary.ts` → `DiaryItem`
- 渲染：`MomentCard.astro`（521行，最复杂的数据卡片）
  - 图片轮播、视频播放
  - 标签显示
  - 嵌套内容（回复/引用）
  - 时间格式化

---

## 4. 页面交互组件

### 4.1 动画追踪（anime）

**组件**：`AnimeGrid.svelte` + `AnimeCard.svelte` + `AnimeDetailModal.svelte`

**功能**：
- 搜索（debounce 300ms）
- Tab 导航（按类型/季度筛选）
- 排序（评分、日期）
- 分页（ClientPagination）
- 详情弹窗（Portal 渲染、键盘 Escape 关闭）
- 渐进式图片加载（LQIP 占位）

### 4.2 番剧追踪（bangumi）

**组件**：`BangumiGrid.svelte` + `BangumiSection.svelte` + `Card.svelte`

**功能**：
- 支持静态数据和 API 动态获取两种模式
- 5 个分类：book（书籍）、anime（动画）、music（音乐）、game（游戏）、real（影视）
- 状态筛选：collect（收藏）、doing（在看）、wish（想看）、on_hold（搁置）、dropped（弃坑）
- 瀑布流布局
- 封面图 fallback 系统（medium → common → small → large）

### 4.3 动态/说说（dynamic）

**组件**：`DynamicFeed.svelte` + `DynamicItem.astro` + `DynamicGallery.astro`

**功能**：
- 从外部 API 获取动态数据
- 搜索和年份筛选
- 分页
- 图片画廊（Fancybox 集成）
- 内联评论
- 模板渲染系统（documentFragment）

### 4.4 相册（gallery）

**组件**：`AlbumCard.astro` + `PhotoCard.astro`

**功能**：
- 相册卡片展示（封面、名称、描述、位置、日期）
- 照片瀑布流展示
- 密码保护相册

### 4.5 搜索（AdvancedSearch）

**组件**：`AdvancedSearch.svelte`（191行）

**功能**：
- Pagefind 全文搜索集成
- Debounce 300ms 防抖
- 生产环境：动态加载 Pagefind 脚本
- 开发环境：Mock 搜索结果
- 结果高亮显示

---

## 5. 编码约定

### 组件技术选型

| 场景 | 技术 | 原因 |
|---|---|---|
| 静态展示 | Astro 组件 | 构建时渲染，零 JS 开销 |
| CSS-only 效果 | Astro 组件 | 无需客户端 JS |
| 客户端交互 | Svelte 组件 | 响应式状态管理 |
| API 数据获取 | Svelte 组件 | 客户端 fetch |
| 复杂动画 | Astro + Worker | OffscreenCanvas 加速 |

### 数据驱动模式

```
data/*.ts（数据定义）
  ↓ import type
features/*/types.ts（Props 类型定义）
  ↓ import
features/*/*.astro（组件渲染）
```

### 功能组件共同特征

- **大量内联 JS**：交互逻辑写在 `<script>` 块中
- **CSS 变量主题**：使用 `var(--primary)`、`var(--card-bg)` 等
- **fadeInUp 动画**：入场动画统一使用 fadeInUp + animation-delay
- **i18n**：所有文本通过 `i18n(I18nKey.xxx)` 国际化
- **配置驱动**：功能行为由 `src/config/` 下的配置对象控制

### Svelte 组件模式

- 状态管理：Svelte 4 reactive（`$:` 语法）
- API 数据：`fetch()` + `onMount`
- 分页：自定义 `ClientPagination` 组件
- 搜索：debounce 300ms + 客户端过滤
- URL 集成：hash 路由（`location.hash`）

---

## 6. 技术债与改进建议

| 问题 | 严重度 | 建议 |
|---|---|---|
| `MusicPlayer.astro` 894 行 | 高 | 可拆分为 ControlPanel、Lyrics、Playlist 等子组件 |
| `SakuraEffect.astro` 569 行 | 中 | Worker 逻辑可抽取为独立 `.js` 文件 |
| `devices/index.ts` 导出 diary 的 `MomentCard` | 中 | 疑似 copy-paste 错误，应修正为导出 `DeviceCard` |
| `data/` 目录数据硬编码 | 低 | 更新数据需修改代码，可考虑外部化（JSON/API） |
| `DynamicFeed.svelte` 312 行 | 低 | 模板渲染逻辑可抽取为独立函数 |
| `MomentCard.astro` 521 行 | 低 | 日记卡片功能复杂，可拆分子组件 |
