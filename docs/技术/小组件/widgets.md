# 小组件模块说明

## 1. 模块概述

Widget 模块是 Firefly 博客主题的侧边栏组件层，共 **22 个文件**（`widget/` 19 个 + `widgets/` 3 个），提供 17 种可配置的侧边栏 widget。所有 widget 通过 `sidebarLayoutConfig` 配置驱动渲染，支持 top（固定）和 sticky（粘性）两种定位模式。

---

## 2. 文件清单与分类

### widget/ 目录（19 个文件）

| 文件 | 行数 | 用途 | 数据来源 |
|---|---|---|---|
| `Profile.astro` | ~80 | 用户资料卡片（头像、名字、签名、社交链接） | `profileConfig` |
| `Calendar.astro` | ~120 | 日历热力图（文章发布日期可视化） | `allPostMeta.json` API |
| `Categories.astro` | ~60 | 分类列表（文章计数） | `content-utils` |
| `Tags.astro` | ~60 | 标签云（标签计数） | `content-utils` |
| `SidebarTOC.astro` | ~80 | 文章目录（IntersectionObserver 高亮） | `toc-shared` |
| `SiteStats.astro` | ~80 | 站点统计（运行天数、文章数、字数、分类、标签） | `content-utils` |
| `SiteInfo.astro` | ~40 | 站点信息（版本号、主题名） | `package.json` |
| `Announcement.astro` | ~40 | 公告组件 | `announcementConfig` |
| `Music.astro` | ~30 | 侧边栏音乐播放器入口 | `musicPlayerConfig` |
| `Advertisement.astro` | ~30 | 广告位 | `adConfig` |
| `Dynamic.astro` | ~30 | 动态组件入口 | `dynamicConfig` |
| `Schedule.astro` | ~40 | 日程组件 | - |
| `RelationshipTimer.astro` | ~40 | 恋爱计时 | `relationshipConfig` |
| `QuoteOfTheDay.astro` | ~40 | 今日一言 | 外部 API |
| `Weather.astro` | ~80 | 天气预报 | 外部 API + 缓存 |
| `UmamiStats.astro` | ~40 | Umami 统计数据 | `analyticsConfig` |
| `AiSummary.astro` | ~30 | AI 摘要 | - |
| `SpineModel.astro` | ~30 | Spine 模型入口 | `pioConfig` |
| `WelcomeToast.astro` | ~60 | 欢迎提示弹窗 | - |

### widgets/ 目录（3 个文件）

| 文件 | 行数 | 用途 |
|---|---|---|
| `TimeGreeting.astro` | ~80 | 时间问候语（实时时钟 + 时段问候 + 风景图） |
| `GlobalAudio.astro` | ~30 | 全局音频控制 |
| `MusicPlayer.astro` | ~30 | 音乐播放器入口 |

---

## 3. Widget 组件映射

SideBar.astro 中的 `componentMap` 定义了 type 值到组件的映射：

| type 值 | 组件 | 说明 |
|---|---|---|
| `profile` | Profile | 用户资料 |
| `announcement` | Announcement | 公告 |
| `categories` | Categories | 分类列表 |
| `tags` | Tags | 标签云 |
| `sidebarToc` | SidebarTOC | 文章目录 |
| `advertisement` | Advertisement | 广告位 |
| `stats` | SiteStats | 站点统计 |
| `calendar` | Calendar | 日历热力图 |
| `music` | Music | 音乐入口 |
| `siteInfo` | SiteInfo | 站点信息 |
| `schedule` | Schedule | 日程 |
| `relationship` | RelationshipTimer | 恋爱计时 |
| `quoteOfTheDay` | QuoteOfTheDay | 今日一言 |
| `timeGreeting` | TimeGreeting | 时间问候 |
| `umamiStats` | UmamiStats | Umami 统计 |
| `weather` | Weather | 天气预报 |
| `dynamic` | Dynamic | 动态组件 |

---

## 4. 核心 Widget 详解

### 4.1 用户资料（Profile.astro）

最常用的 widget，显示在侧边栏顶部：
- 头像图片（`profileConfig.avatar`，使用 `ImageWrapper` 优化）
- 用户名（`profileConfig.name`）
- 个人签名（`profileConfig.bio`）
- 社交链接（`profileConfig.links[]`，支持 icon 和 showName 两种样式）
- 点击头像跳转到关于页

### 4.2 日历热力图（Calendar.astro）

客户端渲染的日历组件：
- 通过 `fetch("/api/allPostMeta.json")` 获取所有文章元数据
- 渲染当年日历网格，有文章发布的日期高亮
- 支持热力图模式（`showHeatmap`）
- 月份和星期名称使用 i18n 国际化
- 点击日期跳转到对应文章

### 4.3 站点统计（SiteStats.astro）

构建时渲染的统计组件：
- 运行天数（基于 `siteConfig.siteStartDate`）
- 文章总数（`getSortedPosts()`）
- 总字数（遍历文章 body，分别计算中英文字符）
- 分类数（`getCategoryList()`）
- 标签数（`getTagList()`）

### 4.4 文章目录（SidebarTOC.astro）

文章详情页的目录组件：
- 使用 `computeTocItems()` 从 headings 生成 TOC 结构
- 支持最多 3 级标题（`maxLevel: 3`）
- 加密文章不在服务端渲染目录（避免标题泄露）
- 客户端通过 `TOCManager` 类实现 IntersectionObserver 滚动高亮

### 4.5 天气预报（Weather.astro）

客户端渲染的天气组件：
- 通过外部 API 获取天气数据
- 30 分钟本地缓存（localStorage）
- 支持折叠/展开（默认折叠，高度 9rem）
- 加载状态、错误状态、重试按钮
- 显示城市、温度、天气图标、预报

### 4.6 时间问候（TimeGreeting.astro）

客户端渲染的实时时钟组件：
- 实时时钟（每秒更新）
- 时段问候（根据时间显示不同问候语）
- 时段图标（夜晚/早晨/中午/傍晚）
- 风景背景图（随机 API）
- 星期和日期显示

---

## 5. 编码约定

### Widget 组件结构

所有 widget 遵循统一模式：

```astro
---
interface Props {
  class?: string;
  style?: string;
  widgetConfig?: WidgetComponentConfig;
}
const { class: className, style, widgetConfig } = Astro.props;
const showTitle = widgetConfig?.showTitle !== false;
---
<WidgetLayout name={i18n(I18nKey.xxx)} showTitle={showTitle} class={className} style={style}>
  <!-- widget 内容 -->
</WidgetLayout>
```

### 数据获取模式

| 模式 | 使用 widget | 说明 |
|---|---|---|
| `content-utils` 函数 | Categories、Tags、SiteStats | 构建时获取内容集合数据 |
| API 调用（客户端） | Calendar、UmamiStats | 浏览器端 fetch JSON API |
| 外部 API | Weather、QuoteOfTheDay | 第三方天气/语录 API |
| 配置读取 | Profile、Announcement、SiteInfo | 直接读取 `src/config/` |
| 无数据 | WelcomeToast、Advertisement | 纯 UI 组件 |

### WidgetLayout 外壳

所有 widget 使用 `WidgetLayout.astro`（`src/components/common/`）作为外壳：
- 统一标题渲染
- 支持折叠/展开
- 入场动画（onload-animation）
- `card-base` 样式类

---

## 6. 技术债与改进建议

| 问题 | 严重度 | 建议 |
|---|---|---|
| `widget/` 和 `widgets/` 两个目录命名易混淆 | 中 | 建议合并为一个目录，统一命名 |
| `WelcomeToast.astro` 硬编码中文 | 低 | "正在加载..."、"欢迎来到我的博客" 未走 i18n |
| `Weather.astro` 硬编码中文 | 低 | "加载中..."、"加载失败" 未走 i18n |
| `TimeGreeting.astro` 硬编码英文星期名 | 低 | 使用 `is:inline` 脚本，无法直接使用 i18n |
| 部分 widget 缺乏错误处理 | 低 | API 调用失败时无降级方案 |
