# 配置体系模块说明

## 1. 模块概述

配置体系是 Firefly 博客主题的"神经中枢"，所有功能行为、视觉表现、页面开关都由 `src/config/` 下的 TypeScript 配置对象驱动。组件层只负责渲染，业务逻辑几乎全部配置化。

共 **30 个配置文件**，通过 `index.ts` barrel export 统一导出，配合 `src/types/` 下的类型接口实现完整的类型安全。

---

## 2. 文件清单与分类

### 按功能域分类

| 分类 | 文件 | 导出对象 | 行数 |
|---|---|---|---|
| **核心** | `siteConfig.ts` | `siteConfig` | 307 |
| | `profileConfig.ts` | `profileConfig` | 55 |
| **视觉/样式** | `backgroundWallpaper.ts` | `backgroundWallpaper` | 174 |
| | `displaySettingsConfig.ts` | `displaySettingsConfig` | 52 |
| | `fontConfig.ts` | `fontConfig`、`fontsList` | 113 |
| | `effectsConfig.ts` | `sakuraConfig` | 55 |
| **布局** | `sidebarConfig.ts` | `sidebarLayoutConfig` | 423 |
| | `navBarConfig.ts` | `navBarConfig`、`navBarSearchConfig`、`LinkPresets` | 322 |
| **内容** | `commentConfig.ts` | `commentConfig` | 85 |
| | `friendsConfig.ts` | `friendsPageConfig`、`friendsConfig`、`getEnabledFriends()` | 337 |
| | `galleryConfig.ts` | `galleryConfig` | 42 |
| | `dynamicConfig.ts` | `dynamicConfig` | - |
| | `announcementConfig.ts` | `announcementConfig` | - |
| **功能** | `musicConfig.ts` | `musicPlayerConfig` | 67 |
| | `coverImageConfig.ts` | `coverImageConfig` | 36 |
| | `expressiveCodeConfig.ts` | `expressiveCodeConfig` | 46 |
| | `mermaidConfig.ts` | `mermaidConfig` | - |
| | `plantumlConfig.ts` | `plantumlConfig` | - |
| **统计分析** | `analyticsConfig.ts` | `analyticsConfig` | 49 |
| **其他** | `footerConfig.ts` | `footerConfig` | 6 |
| | `licenseConfig.ts` | `licenseConfig` | - |
| | `sponsorConfig.ts` | `sponsorConfig` | 78 |
| | `pioConfig.ts` | `live2dWidgetConfig`、`spineModelConfig` | - |
| | `relationshipConfig.ts` | `relationshipConfig` | - |
| **Barrel** | `index.ts` | 所有配置 + 类型的统一导出 | 69 |

### Barrel Export（`index.ts`）

所有配置通过 `index.ts` 统一导出，组件中使用：

```typescript
import { siteConfig, backgroundWallpaper, sidebarLayoutConfig } from "@/config";
```

不直接引用具体配置文件路径，仅 `index.ts` 内部使用相对路径。

---

## 3. 类型系统

每个配置对象都有对应的 TypeScript 接口，分布在 `src/types/` 下：

| 类型文件 | 导出接口 |
|---|---|
| `siteConfig.ts` | `SiteConfig` |
| `sidebarConfig.ts` | `SidebarLayoutConfig`、`WidgetComponentConfig`、`WidgetComponentType` |
| `backgroundWallpaper.ts` | `BackgroundWallpaperConfig` |
| `displaySettingsConfig.ts` | `DisplaySettingsConfig` |
| `navBarConfig.ts` | `NavBarConfig`、`NavBarLink`、`NavBarSearchConfig` |
| `commentConfig.ts` | `CommentConfig` |
| `friendsConfig.ts` | `FriendsPageConfig`、`FriendLink` |
| `galleryConfig.ts` | `GalleryConfig`、`GalleryAlbum` |
| `musicConfig.ts` | `MusicPlayerConfig` |
| `analyticsConfig.ts` | `AnalyticsConfig` |
| `coverImageConfig.ts` | `CoverImageConfig` |
| `expressiveCodeConfig.ts` | `ExpressiveCodeConfig` |
| `fontConfig.ts` | `FontSelectionConfig`、`FontDefinition` |
| `effectsConfig.ts` | `SakuraConfig` |
| `profileConfig.ts` | `ProfileConfig` |
| `licenseConfig.ts` | `LicenseConfig` |
| `sponsorConfig.ts` | `SponsorConfig`、`SponsorItem`、`SponsorMethod` |
| `footerConfig.ts` | `FooterConfig` |
| `announcementConfig.ts` | `AnnouncementConfig` |
| `dynamicConfig.ts` | `DynamicConfig` |
| `mermaidConfig.ts` | `MermaidConfig` |
| `plantumlConfig.ts` | `PlantUMLConfig` |
| `adConfig.ts` | `AdConfig` |
| `relationshipConfig.ts` | `RelationshipConfig` |
| `pioConfig.ts` | Live2D/Spine 相关类型 |

---

## 4. 配置层级与依赖关系

### 核心配置依赖树

```
siteConfig（站点核心）
├── themeColor.hue → 影响全局 CSS 变量 --hue
├── pages.* → 控制 13 个页面的路由开关
├── navbar → 影响 Navbar.astro 渲染
├── postListLayout → 影响文章列表布局模式
├── pagination → 影响分页数量
└── imageOptimization → 影响图片加载质量

backgroundWallpaper（视觉核心）
├── mode → 影响 MainGridLayout 壁纸渲染策略（banner/fullscreen/overlay/none）
├── src → 影响背景图片加载（desktop/mobile 分离）
├── common → 影响遮罩、文字、导航栏透明度、水波纹、渐变
└── banner/fullscreen/overlay → 各模式专属配置

sidebarLayoutConfig（布局核心）
├── position → 影响 CSS Grid 列数（left/right/both）
├── leftComponents/rightComponents → 影响 widget 渲染顺序和类型
└── mobileBottomComponents → 影响移动端底部组件
```

### 功能开关的三层体系

| 层级 | 配置路径 | 作用 | 示例 |
|---|---|---|---|
| 一级 | `siteConfig.pages.*` | 控制页面是否可访问（false → 404） | `pages.friends = false` |
| 二级 | `displaySettingsConfig.*` | 控制设置面板中各项是否可切换 | `themeColorSwitchable = true` |
| 三级 | 各配置对象内部 `enable` | 控制具体功能是否生效 | `galleryConfig.albums[].password` |

---

## 5. 核心配置详解

### 5.1 siteConfig（站点核心，307 行）

承载站点基础信息、主题色、导航栏、页面开关、文章布局、分页、图片优化等：

```typescript
siteConfig = {
  title: "Hyde Blog",           // 站点标题
  subtitle: "...",              // 副标题
  site_url: "https://...",      // 站点 URL
  description: "...",           // SEO 描述
  keywords: [...],              // SEO 关键词（27 个）
  lang: "zh_CN",                // 语言

  themeColor: {
    hue: 270,                   // 主题色色相（0-360）
    fixed: false,               // 是否固定不可切换
    defaultMode: "system",      // 默认亮暗模式
  },

  navbar: {
    logo: { type: "image", value: "..." },
    title: "Hyde",
    widthFull: true,
    menuAlign: "center",
    stickyNavbar: true,
  },

  pages: {                      // 13 个页面开关
    friends: true, sponsor: true, guestbook: true,
    bangumi: true, gallery: true, devices: true,
    diary: true, projects: true, timeline: true,
    skills: true, anime: true, dynamic: true,
  },

  postListLayout: {             // 文章列表布局
    defaultMode: "grid",        // grid | list | magazine
    grid: { masonry: false, columns: 2 },
  },

  pagination: { postsPerPage: 12 },
  imageOptimization: { quality: 85 },
}
```

### 5.2 backgroundWallpaper（壁纸系统，174 行）

控制博客背景视觉效果，支持 4 种模式：

```typescript
backgroundWallpaper = {
  mode: "banner",               // "banner" | "fullscreen" | "overlay" | "none"
  playerEnable: true,           // 视频播放按钮

  src: {
    desktop: ["https://..."],   // 桌面端图片（支持数组/字符串/API）
    mobile: ["...avif"],        // 移动端图片
    playerUrl: ["...mp4"],      // 背景视频
  },

  common: {
    dimOpacity: 0.2,            // 遮罩暗度
    homeText: { enable: true, title: "...", subtitle: "..." },
    navbar: { transparentMode: "semi", enableBlur: true, blur: 20 },
    waves: { enable: true },    // 水波纹效果
    gradient: { enable: true }, // 渐变过渡
    carousel: { enable: true, interval: 5000, transitionEffect: "fade" },
  },

  banner: { position: "0% 20%" },
  overlay: { opacity: 0.8, blur: 0, cardOpacity: 0.6 },
}
```

### 5.3 sidebarLayoutConfig（侧边栏布局，423 行）

控制侧边栏位置、组件编排、响应式行为：

```typescript
sidebarLayoutConfig = {
  enable: true,
  position: "both",             // "left" | "right" | "both"
  tabletSidebar: "left",        // 平板端显示哪侧
  hideSidebarOnPostPage: false,
  showBothSidebarsOnPostPage: true,

  leftComponents: [             // 左侧栏组件列表
    { type: "profile", enable: true, position: "top", showOnPostPage: false },
    { type: "announcement", enable: true, position: "top" },
    { type: "music", enable: true, position: "sticky" },
    { type: "categories", enable: true, position: "sticky" },
    { type: "tags", enable: true, position: "sticky" },
    // ... 共 18 种组件类型
  ],

  rightComponents: [...],       // 右侧栏组件列表
  mobileBottomComponents: [...], // 移动端底部组件
}
```

**支持的 widget 类型**（`WidgetComponentType`）：

```
profile | announcement | categories | tags | sidebarToc
advertisement | stats | calendar | music | siteInfo
schedule | relationship | quoteOfTheDay | timeGreeting
umamiStats | weather | dynamic
```

### 5.4 displaySettingsConfig（显示设置面板，52 行）

控制用户可通过设置面板切换的所有选项：

```typescript
displaySettingsConfig = {
  themeColorSwitchable: true,       // 主题色选择器
  layoutSwitchable: true,           // 文章列表布局切换
  cardBorderSwitchable: true,       // 卡片边框和阴影
  cardFollowThemeSwitchable: true,  // 卡片跟随主题色
  wallpaperModeSwitchable: true,    // 壁纸模式切换
  wavesSwitchable: true,            // 水波纹动画
  gradientSwitchable: true,         // 渐变过渡
  bannerTitleSwitchable: true,      // 横幅标题
  bannerCarouselSwitchable: true,   // 壁纸轮播
  overlaySwitchable: {              // 全屏透明模式参数
    opacity: true, blur: true, cardOpacity: true,
  },
  sakuraSwitchable: true,           // 樱花特效
}
```

### 5.5 其他重要配置

**commentConfig** — 评论系统（支持 6 种）：

| 类型 | 关键配置 |
|---|---|
| `twikoo` | envId、lang、visitorCount、jsUrl |
| `waline` | serverURL、lang、emoji、login |
| `artalk` | server、locale |
| `giscus` | repo、repoId、category、mapping |
| `disqus` | shortname |

**musicPlayerConfig** — 音乐播放器：

- `mode`: `"meting"`（Meting API）或 `"local"`（本地音乐）
- `meting`: api、server（netease/tencent/kugou）、type、id
- `local.playlist[]`: name、artist、url、cover、lrc

**navBarConfig** — 导航栏链接：

- 使用 `LinkPresets` 预设链接（20 个常用页面）
- 支持二级子菜单（children 数组）
- `navBarSearchConfig`: 搜索方法（PageFind）

**friendsConfig** — 友链：

- `friendsPageConfig`: 页面标题、描述、评论开关
- `friendsConfig[]`: 287 条友链数据（title、desc、siteurl、imgurl、tags、weight、enabled）
- `getEnabledFriends()`: 按权重排序的启用友链

**fontConfig** — 字体：

- `fontsList[]`: Astro Font API 字体定义（支持 google/fontsource/local/bunny 等 provider）
- `fontConfig.selected`: 正文字体
- `fontConfig.bannerSubtitle`: Banner 副标题字体
- `fontConfig.code`: 代码字体
- `fontConfig.subsetFonts`: 本地字体子集化配置

---

## 6. 编码约定

### 配置文件结构

```typescript
import type { XxxConfig } from "../types/xxxConfig";

export const xxxConfig: XxxConfig = {
  // 配置项，带行注释说明
};
```

### 引用方式

```typescript
// 组件中（推荐）
import { siteConfig, backgroundWallpaper } from "@/config";

// index.ts 中（唯一使用相对路径的地方）
export { siteConfig } from "./siteConfig";
```

### 图片路径三种格式

| 格式 | 示例 | 说明 |
|---|---|---|
| public 目录 | `/assets/images/logo.webp` | 以 `/` 开头，不优化 |
| src 目录 | `assets/images/avatar.avif` | 不以 `/` 开头，自动优化 |
| 远程 URL | `https://example.com/logo.png` | 以 `http` 开头，不优化 |

### 注释规范

- 配置项上方使用 `//` 行注释说明用途
- 复杂配置项使用 `/** */` 块注释
- 可选值在注释中列出（如 `"light" 亮色, "dark" 暗色`）

---

## 7. 技术债与改进建议

| 问题 | 严重度 | 建议 |
|---|---|---|
| `siteConfig.ts` 承载过多职责（307行） | 中 | 可拆分为 `themeConfig`、`pageConfig`、`postConfig` 等子配置 |
| `backgroundWallpaper.ts` 含约 100 行注释 | 低 | 可抽取为独立配置文档，减少文件体积 |
| `sidebarConfig.ts` 423 行 | 低 | 组件列表可考虑外部化（JSON/数据文件） |
| `friendsConfig.ts` 硬编码 287 条友链 | 低 | 可考虑通过 API 或内容集合管理，避免配置文件膨胀 |
| 部分配置项缺乏运行时校验 | 低 | 如 `hue` 范围应为 0-360，`volume` 应为 0-1，建议添加 Zod schema |
| 配置项命名不一致 | 低 | `siteConfig` 用 `site_url`（下划线），其他用 camelCase，建议统一 |
