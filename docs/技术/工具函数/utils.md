# 工具函数模块说明

## 1. 模块概述

Utils 模块是 Firefly 博客主题的工具层，共 **20 个文件**，提供内容查询、图片处理、URL 生成、日期格式化、加密、TOC 生成、主题设置、导航等核心功能。被布局、页面、组件广泛引用。

---

## 2. 文件清单与分类

### 2.1 按运行环境

| 环境 | 文件数 | 文件列表 |
|---|---|---|
| **仅服务端** | 13 | content-utils、image-utils、layout-utils、responsive-utils、crypto-utils、date-utils、dynamic-utils、gallery-utils、lqip-utils、language-utils、gist-api、build-platform、fontHelper |
| **仅客户端** | 5 | setting-utils、navigation-utils、toc-utils、timeFormat、icon-loader |
| **通用** | 2 | url-utils、toc-shared |

### 2.2 按功能域

| 功能域 | 文件 | 核心函数 |
|---|---|---|
| **内容查询** | `content-utils.ts`（478行） | `getSortedPosts()`、`getTagList()`、`getArchiveList()`、`getCategoryList()`、`getRelatedPosts()` |
| | `dynamic-utils.ts`（27行） | `sortDynamics()`、`dynamicSlug()`、`dynamicPlainText()` |
| **URL/路由** | `url-utils.ts`（92行） | `getPostUrlBySlug()`、`getTagUrl()`、`getCategoryUrl()`、`url()` |
| | `navigation-utils.ts`（174行） | `navigateToPage()`、`isSwupReady()`、`preloadPage()` |
| **图片/媒体** | `image-utils.ts`（126行） | `processCoverImageSync()`、`getApiUrlList()`、`getImageFormats()` |
| | `lqip-utils.ts`（78行） | `getLqipGradient()`、`getLqipStyle()` |
| | `gallery-utils.ts`（61行） | `scanAlbumPhotos()`、`getAlbumCover()` |
| **布局/响应式** | `layout-utils.ts`（87行） | `getBackgroundImages()`、`isHomePage()`、`getBannerOffset()` |
| | `responsive-utils.ts`（226行） | `getResponsiveSidebarConfig()`、`generateGridClasses()` |
| **主题/设置** | `setting-utils.ts`（1452行） | `setTheme()`、`setWallpaperMode()`、`initWallpaperMode()` |
| **日期/时间** | `date-utils.ts`（121行） | `formatDateI18n()`、`formatDynamicDate()` |
| | `timeFormat.ts`（44行） | `formatRelativeTime()` |
| **加密/安全** | `crypto-utils.ts`（47行） | `encryptContent()` |
| **UI/交互** | `toc-utils.ts`（433行） | `TOCManager` 类（IntersectionObserver、滚动高亮） |
| | `toc-shared.ts`（131行） | `computeTocItems()`、`renderTocItemHTML()` |
| | `icon-loader.ts`（267行） | `IconLoader` 单例（重试、懒加载） |
| **数据/集成** | `gist-api.ts`（239行） | `getGistContent()`、`getMomentsFromGist()` |
| | `language-utils.ts`（40行） | `getLanguageDisplayName()` |
| | `fontHelper.ts`（39行） | `collectUsedFontCssVars()` |
| | `build-platform.ts`（67行） | `detectBuildPlatform()` |

---

## 3. 核心工具详解

### 3.1 内容查询（content-utils.ts，478 行）

最核心的工具模块，提供所有内容集合的查询和处理：

**排序文章**：
```typescript
getSortedPosts(): CollectionEntry<"posts">[]
// 排序规则：pinned 优先 → 发布日期降序
// 自动填充 prevSlug/nextSlug（上一篇/下一篇链接）
```

**标签聚合**：
```typescript
getTagList(): Tag[]
// 聚合来源：posts + moments + 外部 Gist 动态
// 返回：{ name, count }[] 按字母排序
```

**统一归档**：
```typescript
getArchiveList(): ArchiveItem[]
// 合并 4 种类型：post | moment | bangumi | life
// bangumi 数据通过 API 实时获取
```

**相关文章推荐**：
```typescript
getRelatedPosts(currentPost, allPosts, maxCount): PostForList[]
// 算法：Jaccard 相似度（标签 + 标题分词）+ 时间衰减 + 分类加成
```

### 3.2 URL 生成（url-utils.ts，92 行）

| 函数 | 输出 | 示例 |
|---|---|---|
| `getPostUrlBySlug(slug)` | `/posts/{slug}/` | `/posts/hello-world/` |
| `getTagUrl(tag)` | `/archive/?tag={tag}` | `/archive/?tag=astro` |
| `getCategoryUrl(category)` | `/categories/{category}/` | `/categories/tech/` |
| `url(path)` | `{BASE_URL}{path}` | `/blog/hello-world/` |
| `removeFileExtension(id)` | 去除扩展名 | `hello.md` → `hello` |

### 3.3 图片处理

**image-utils.ts**（126 行）：
- `processCoverImageSync(image, seed)`：处理封面图，`image: "api"` 时返回随机图 API URL
- `getApiUrlList(image, seed)`：生成所有 API URL（带 seed 参数确保一致性）
- `getImageFormats()`：返回优化格式（webp、avif）
- `getImageQuality()`：返回图片质量（默认 85）

**lqip-utils.ts**（78 行）：
- `getLqipGradient(src)`：将 18 字符 hex 解码为 CSS 渐变
- 格式：`6e3b38ae7472af7574` → `linear-gradient(135deg, #6e3b38 0%, #ae7472 50%, #af7574 100%)`

**gallery-utils.ts**（61 行）：
- `scanAlbumPhotos(albumId)`：扫描 `public/gallery/{albumId}/` 目录
- 支持 `urls.txt` 文件添加远程图片
- 自动将 `cover.*` 排到首位

### 3.4 布局计算

**layout-utils.ts**（87 行）：
- `getBackgroundImages()`：解析壁纸配置，返回 `{ desktop[], mobile[] }`
- `isHomePage(pathname)`：判断是否为首页
- `getBannerOffset(position)`：计算 Banner 偏移量

**responsive-utils.ts**（226 行）：
- `getResponsiveSidebarConfig()`：根据 position 生成响应式配置
- `generateGridClasses(config)`：生成 CSS Grid 列类
  - 移动端：`grid-cols-1`
  - 平板端：`md:grid-cols-[17.5rem_1fr]`
  - 桌面端：`xl:grid-cols-[17.5rem_1fr_17.5rem]`
- `generateSidebarClasses(config)`：左侧栏容器类
- `generateRightSidebarClasses(config)`：右侧栏容器类

### 3.5 主题管理（setting-utils.ts，1452 行）

最大的工具模块，管理所有客户端显示设置：

**主题管理**：
- `getDefaultTheme()`：获取默认亮暗模式
- `getSystemTheme()`：获取系统主题
- `resolveTheme(theme)`：解析 system 模式为实际主题
- `setTheme(theme)`：设置主题并持久化到 localStorage

**壁纸模式**：
- `initWallpaperMode()`：初始化壁纸模式
- `setWallpaperMode(mode)`：切换壁纸模式
- `applyWallpaperModeToDocument(mode)`：应用模式到 DOM

**其他设置**：
- 覆盖层透明度/模糊度调节
- 樱花特效开关
- 水波纹开关
- 渐变过渡开关
- 卡片边框开关

### 3.6 TOC 目录（toc-utils + toc-shared）

**toc-shared.ts**（131 行）— 通用逻辑：
- `computeTocItems(headings, maxLevel)`：从标题数组计算 TOC 结构
- `renderTocItemHTML(item)`：渲染单个 TOC 项 HTML

**toc-utils.ts**（433 行）— 客户端管理：
- `TOCManager` 类：
  - `setupObserver()`：IntersectionObserver 滚动追踪
  - `updateActiveState()`：高亮当前可见标题
  - `bindClickEvents()`：点击 TOC 项滚动到标题
  - `updateTOCContent()`：Swup 切页后更新 TOC

### 3.7 加密（crypto-utils.ts，47 行）

使用 Node.js crypto 模块实现 AES-256-GCM 加密：

```typescript
encryptContent(html, password, slug): string
// 输出格式：base64(salt[16] + iv[12] + authTag[16] + ciphertext)
// 盐和 IV 通过 HMAC-SHA256 从密码+slug 派生（确定性）
// 使 sessionStorage 密码缓存在页面重载后可靠工作
```

### 3.8 导航（navigation-utils.ts，174 行）

统一页面导航，支持 Swup 无刷新跳转：

- `navigateToPage(url, options)`：智能导航（外部链接→新窗口、锚点→滚动、Swup→无刷新）
- `isSwupReady()` / `waitForSwup(timeout)`：Swup 状态检测
- `preloadPage(url)`：Swup 预加载
- `getCurrentPath()` / `isHomePage()` / `isPostPage()`：路径判断

---

## 4. 编码约定

### 函数导出模式

所有工具文件使用**命名导出**，不使用默认导出：

```typescript
export function getSortedPosts(): Promise<CollectionEntry<"posts">[]> { ... }
export function navigateToPage(url: string, options?: {...}): void { ... }
```

### 类型定义位置

- 简单类型：在工具文件内定义（如 `ArchiveItem`、`TOCConfig`）
- 复杂类型：在 `src/types/` 下定义，通过 import 引用
- 接口优先于 type

### 客户端代码特征

- 使用 `typeof window !== "undefined"` 环境检测
- 声明全局类型（`declare global { interface Window { ... } }`）
- 提供降级方案（如 Swup 不可用时回退普通跳转）

### 服务端代码特征

- 使用 `import.meta.env.PROD` 判断环境
- 使用 `import.meta.glob()` 导入构建时数据
- 使用 `fs`/`path` 进行文件系统操作

---

## 5. 技术债与改进建议

| 问题 | 严重度 | 建议 |
|---|---|---|
| `setting-utils.ts` 1452 行 | 高 | 可拆分为 theme-utils、wallpaper-utils、display-utils 等 |
| `url-utils.ts` 和 `navigation-utils.ts` 函数重复 | 中 | `url()` 和 `pathsEqual()` 在两处都有定义，建议合并 |
| `content-utils.ts` 中 `getTagList()` 包含 `fetch()` | 低 | 混合了服务端和网络请求，可考虑分离远程数据获取 |
| `build-platform.ts` 仅构建脚本使用 | 低 | 可考虑移至 `scripts/` 目录 |
| `toc-utils.ts` 433 行 | 低 | TOCManager 类可拆分为独立文件 |
