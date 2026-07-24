# 类型定义与构建工具模块说明

## 1. 模块概述

本模块包含 `types/`（29 个文件）、`constants/`（4 个文件）、`workers/`（1 个文件）、`scripts/`（5 个文件），共 **39 个文件**，提供 TypeScript 类型定义、全局常量、Web Worker 和构建时脚本。

---

## 2. 文件清单

### types/（29 个文件，约 3056 行）

与 `src/config/` 一一对应的类型接口：

| 类型文件 | 行数 | 对应配置 | 导出接口 |
|---|---|---|---|
| `siteConfig.ts` | 230 | `siteConfig` | `SiteConfig` |
| `sidebarConfig.ts` | 95 | `sidebarLayoutConfig` | `SidebarLayoutConfig`、`WidgetComponentConfig`、`WidgetComponentType` |
| `backgroundWallpaper.ts` | 99 | `backgroundWallpaper` | `BackgroundWallpaperConfig` |
| `fontConfig.ts` | 84 | `fontConfig` | `FontSelectionConfig`、`FontDefinition` |
| `pioConfig.ts` | 75 | `live2dWidgetConfig` | `PioConfig`、`SpineModelConfig` |
| `commentConfig.ts` | 63 | `commentConfig` | `CommentConfig` |
| `musicConfig.ts` | 59 | `musicPlayerConfig` | `MusicPlayerConfig` |
| `config.ts` | 57 | 通用 | `Favicon`、`ImageFormat`、`LIGHT_DARK_MODE`、`WALLPAPER_MODE` |
| `bangumi.ts` | 56 | - | `UserSubjectCollection` |
| `displaySettingsConfig.ts` | 51 | `displaySettingsConfig` | `DisplaySettingsConfig` |
| `expressiveCodeConfig.ts` | 50 | `expressiveCodeConfig` | `ExpressiveCodeConfig` |
| `sakura-worker.ts` | 51 | - | Worker 消息类型 |
| `analyticsConfig.ts` | 26 | `analyticsConfig` | `AnalyticsConfig` |
| `effectsConfig.ts` | 26 | `sakuraConfig` | `SakuraConfig` |
| `sponsorConfig.ts` | 29 | `sponsorConfig` | `SponsorConfig`、`SponsorItem`、`SponsorMethod` |
| `navBarConfig.ts` | 20 | `navBarConfig` | `NavBarConfig`、`NavBarLink`、`NavBarSearchConfig` |
| `friendsConfig.ts` | 18 | `friendsConfig` | `FriendsPageConfig`、`FriendLink` |
| `galleryConfig.ts` | 18 | `galleryConfig` | `GalleryConfig`、`GalleryAlbum` |
| `mermaidConfig.ts` | 18 | `mermaidConfig` | `MermaidConfig` |
| `anime.ts` | 17 | - | 动画数据类型 |
| `plantumlConfig.ts` | 16 | `plantumlConfig` | `PlantUMLConfig` |
| `announcementConfig.ts` | 14 | `announcementConfig` | `AnnouncementConfig` |
| `dynamicConfig.ts` | 10 | `dynamicConfig` | `DynamicConfig` |
| `profileConfig.ts` | 11 | `profileConfig` | `ProfileConfig` |
| `RelationshipConfig.ts` | 9 | `relationshipConfig` | `RelationshipConfig` |
| `coverImageConfig.ts` | 9 | `coverImageConfig` | `CoverImageConfig` |
| `licenseConfig.ts` | 6 | `licenseConfig` | `LicenseConfig` |
| `footerConfig.ts` | 4 | `footerConfig` | `FooterConfig` |
| `iconify-svelte-offline.d.ts` | 20 | - | Svelte 声明文件 |

### constants/（4 个文件，约 223 行）

| 文件 | 行数 | 用途 |
|---|---|---|
| `constants.ts` | 26 | 全局常量（BANNER_HEIGHT=35vh、PAGE_WIDTH=100rem、主题模式、壁纸模式） |
| `icon.ts` | 44 | 默认 favicon 配置 |
| `icons-data.json` | 102 | 图标数据（预加载的图标信息） |
| `lqips.json` | 51 | LQIP 数据（18 字符 hex 颜色值） |

**constants.ts 关键常量**：

| 常量 | 值 | 说明 |
|---|---|---|
| `BANNER_HEIGHT` | 35 | Banner 高度（vh） |
| `BANNER_HEIGHT_EXTEND` | 30 | Banner 延伸高度 |
| `MAIN_PANEL_OVERLAPS_BANNER_HEIGHT` | 5.5 | 主内容区与 Banner 重叠高度（rem） |
| `PAGE_WIDTH` | 100 | 页面最大宽度（rem） |
| `LIGHT_MODE` / `DARK_MODE` / `SYSTEM_MODE` | "light"/"dark"/"system" | 主题模式 |
| `WALLPAPER_BANNER` / `WALLPAPER_FULLSCREEN` / `WALLPAPER_OVERLAY` / `WALLPAPER_NONE` | 壁纸模式字符串 | |
| `UNCATEGORIZED` | "uncategorized" | 默认分类名 |
| `PAGE_SIZE` | 8 | 每页文章数 |

### workers/（1 个文件，419 行）

| 文件 | 行数 | 用途 |
|---|---|---|
| `sakura.worker.ts` | 419 | 樱花特效 Web Worker（OffscreenCanvas 渲染） |

**Worker 功能**：
- 接收 Canvas 和配置参数
- 在 OffscreenCanvas 上绘制樱花动画
- 支持启动/停止/配置更新消息

### scripts/（5 个文件，约 699 行）

| 文件 | 行数 | 用途 | 触发方式 |
|---|---|---|---|
| `generate-lqips.ts` | 140 | 生成 LQIP 数据（18 字符 hex） | `pnpm lqips` |
| `subset-fonts.ts` | 375 | 字体子集化（扫描页面字符生成 woff2） | 构建时自动 |
| `quarantine-bad-posts.mjs` | 71 | 隔离有问题的文章 | 手动执行 |
| `new-post.js` | 59 | 新建文章模板 | `pnpm new-post <name>` |
| `new-dynamic.js` | 54 | 新建动态模板 | 手动执行 |

---

## 3. 核心工具详解

### 类型系统架构

```
src/config/*.ts（配置对象）
  ↓ import type
src/types/*.ts（类型接口定义）
  ↓ import type
src/components/**（组件 Props 类型）
```

**类型文件命名约定**：与配置文件一一对应（`siteConfig.ts` → `types/siteConfig.ts`）

### LQIP 生成管道

```
scripts/generate-lqips.ts
  ↓ 扫描 src/ 和 public/ 目录图片
  ↓ 提取 3 个主色（6 字符 hex）
  ↓ 输出 18 字符紧凑格式
  ↓
src/constants/lqips.json
  ↓
src/utils/lqip-utils.ts（解码为 CSS 渐变）
  ↓
ImageWrapper.astro（渲染占位渐变）
```

### 构建脚本模式

- 使用 `node:` 前缀导入 Node.js 内置模块
- 使用 `process.cwd()` 获取项目根目录
- 通过 `pnpm` scripts 触发（`package.json` 中配置）

---

## 4. 编码约定

### 类型定义模式

```typescript
// types/xxxConfig.ts
export interface XxxConfig {
  // 配置项类型定义
}
```

### 常量引用

```typescript
import { BANNER_HEIGHT, PAGE_WIDTH } from "@/constants/constants";
import { defaultFavicons } from "@/constants/icon";
```

### Worker 通信

```typescript
// 主线程
const worker = new Worker(new URL("./workers/sakura.worker.ts", import.meta.url), { type: "module" });
worker.postMessage({ type: "init", canvas, config });

// Worker 内部
self.onmessage = (e) => { ... };
```

---

## 5. 技术债与改进建议

| 问题 | 严重度 | 建议 |
|---|---|---|
| `types/siteConfig.ts` 230 行 | 低 | 可按功能域拆分为多个子类型文件 |
| `sakura.worker.ts` 419 行 | 低 | Worker 逻辑复杂，可抽取配置和渲染为独立函数 |
| `subset-fonts.ts` 375 行 | 低 | 构建脚本较长，可拆分为扫描和生成两个阶段 |
| 类型文件与配置文件 1:1 映射 | 低 | 增加维护成本，但保持了一致性 |
