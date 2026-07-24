# 页面路由系统模块说明

## 1. 模块概述

Pages 模块是 Firefly 博客主题的路由层，负责 URL 到页面内容的映射。基于 Astro 的文件路由系统，共 **37 个文件**，分为三种类型：

- **静态页面**（20 个 `.astro`）：文件名直接对应 URL
- **动态路由**（5 个 `.astro`）：通过 `getStaticPaths()` 在构建时生成参数化路径
- **API 端点**（6 个 `.ts`）：导出 `GET` 函数，返回数据或生成资源
- **其他**（6 个文件）：子目录页面、索引页等

所有页面与内容集合（`content.config.ts`）和工具函数（`content-utils.ts`、`url-utils.ts`）紧密协作。

---

## 2. 文件清单与分类

### 2.1 静态页面

| 文件 | URL | 功能开关 | 说明 |
|---|---|---|---|
| `404.astro` | `/404/` | 无 | 404 错误页 |
| `about.astro` | `/about/` | 无 | 关于页（读取 spec 集合） |
| `archive.astro` | `/archive/` | 无 | 归档时间线（posts + moments + bangumi + life） |
| `search.astro` | `/search/` | 无 | 全文搜索（Pagefind） |
| `friends.astro` | `/friends/` | `pages.friends` | 友情链接 |
| `sponsor.astro` | `/sponsor/` | `pages.sponsor` | 赞助页 |
| `guestbook.astro` | `/guestbook/` | `pages.guestbook` | 留言板 |
| `bangumi.astro` | `/bangumi/` | `pages.bangumi` | 番剧追踪 |
| `anime.astro` | `/anime/` | `pages.anime` | 动画追踪 |
| `moments.astro` | `/moments/` | `pages.moments` | 动态/说说 |
| `moments/pinned.astro` | `/moments/pinned/` | 无 | 置顶动态 |
| `diary.astro` | `/diary/` | `pages.diary` | 日记 |
| `music.astro` | `/music/` | `pages.music` | 音乐 |
| `projects.astro` | `/projects/` | `pages.projects` | 项目展示 |
| `skills.astro` | `/skills/` | `pages.skills` | 技能树 |
| `devices.astro` | `/devices/` | `pages.devices` | 设备清单 |
| `timeline.astro` | `/timeline/` | `pages.timeline` | 时间线 |
| `rss.astro` | `/rss/` | 无 | RSS 订阅说明页 |

**子目录页面**：

| 文件 | URL | 说明 |
|---|---|---|
| `admin/index.astro` | `/admin/` | 后台管理入口（独立 HTML，不使用 MainGridLayout） |
| `admin/moments.astro` | `/admin/moments/` | 动态管理 |
| `admin/notebooks.astro` | `/admin/notebooks/` | 笔记本管理 |
| `dynamic/index.astro` | `/dynamic/` | 动态内容页 |
| `dynamic/comments.astro` | `/dynamic/comments/` | 动态评论 |
| `life/notebooks/remote-entry.astro` | `/life/notebooks/remote-entry/` | 远程笔记本入口 |

### 2.2 动态路由

| 文件 | URL 模式 | 说明 |
|---|---|---|
| `[...page].astro` | `/page/{n}/` | 文章分页列表 |
| `posts/[...slug].astro` | `/posts/{slug}/` | 文章详情页（主路由） |
| `blog/[...slug].astro` | `/blog/{slug}/` | 文章详情页（备选路由，与 posts 几乎相同） |
| `categories/[category].astro` | `/categories/{category}/` | 分类下的文章列表 |
| `gallery/[album].astro` | `/gallery/{album}/` | 相册详情页 |

**索引页**（静态动态路由）：

| 文件 | URL | 说明 |
|---|---|---|
| `categories/index.astro` | `/categories/` | 分类总览 |
| `gallery/index.astro` | `/gallery/` | 相册总览 |
| `tags/index.astro` | `/tags/` | 标签云 |

### 2.3 API 端点

| 文件 | URL | 返回格式 | 说明 |
|---|---|---|---|
| `api/allPostMeta.json.ts` | `/api/allPostMeta.json` | JSON | 所有文章元数据（用于日历等 widget） |
| `api/dynamic.json.ts` | `/api/dynamic.json` | JSON | 动态内容列表（含渲染后的 HTML） |
| `rss.xml.ts` | `/rss.xml` | XML | RSS Feed（使用 Astro Container API 渲染 MDX） |
| `robots.txt.ts` | `/robots.txt` | text | Robots 协议文件 |
| `og/[...slug].ts` | `/og/{slug}.png` | PNG | OG 图片（satori 生成） |
| `[slug].ts` | `/{slug}.png` | PNG | OG 图片（另一实现） |

---

## 3. 内容集合定义

定义在 `src/content.config.ts`，使用 Astro v2 Content Layer API：

### posts 集合

```typescript
defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),                          // 文章标题
    published: z.date(),                        // 发布日期
    updated: z.date().optional(),               // 更新日期
    draft: z.boolean().optional().default(false), // 草稿标记（生产环境不显示）
    description: z.string().optional().default(""),
    image: z.string().optional().default(""),    // 封面图（支持 "api" 随机图）
    tags: z.array(z.string()).optional().default([]),
    category: z.string().optional().nullable().default(""),
    pinned: z.boolean().optional().default(false), // 置顶
    password: z.string().optional().default(""),  // 加密密码
    comment: z.boolean().optional().default(true), // 是否启用评论
    // ... 其他字段
  }),
});
```

### spec 集合

```typescript
defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/spec" }),
  schema: z.object({}),  // 无 schema 约束
});
```

用于 about、friends 等特殊页面的内容，通过 `getEntry("spec", "friends")` 获取。

### dynamic 集合

```typescript
defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/dynamic" }),
  schema: z.object({
    published: z.date(),
  }),
});
```

---

## 4. 路由生成规则

### 静态路由

Astro 的文件路由：`src/pages/about.astro` → `/about/`

### 动态路由（`getStaticPaths`）

**分页路由**（`[...page].astro`）：

```typescript
export const getStaticPaths = (async ({ paginate }) => {
  const allBlogPosts = await getSortedPosts();
  const pageSize = siteConfig.pagination.postsPerPage; // 默认 8
  return paginate(allBlogPosts, { pageSize });
}) satisfies GetStaticPaths;
// 生成: /page/1/, /page/2/, ...
```

**文章路由**（`posts/[...slug].astro`）：

```typescript
export async function getStaticPaths() {
  const blogEntries = await getSortedPosts();
  return blogEntries.map((entry) => ({
    params: { slug: removeFileExtension(entry.id) },
    props: { entry },
  }));
}
// 生成: /posts/hello-world/, /posts/my-first-post/, ...
```

**分类路由**（`categories/[category].astro`）：

```typescript
export async function getStaticPaths() {
  const categories = await getCategoryList();
  return categories.map((category) => ({
    params: { category: category.name },
    props: { category },
  }));
}
// 生成: /categories/programming/, /categories/design/, ...
```

**相册路由**（`gallery/[album].astro`）：

```typescript
export async function getStaticPaths() {
  return galleryConfig.albums.map((album) => ({
    params: { album: album.name },
    props: { album },
  }));
}
// 生成: /gallery/vacation-2024/, /gallery/family/, ...
```

### URL 生成工具（`url-utils.ts`）

| 函数 | 输出 | 示例 |
|---|---|---|
| `getPostUrlBySlug(slug)` | `/posts/{slug}/` | `/posts/hello-world/` |
| `getTagUrl(tag)` | `/archive/?tag={tag}` | `/archive/?tag=astro` |
| `getCategoryUrl(category)` | `/categories/{category}/` | `/categories/programming/` |
| `getCategoryPageUrl()` | `/categories/` | `/categories/` |
| `url(path)` | `{BASE_URL}{path}` | `/blog/hello-world/` |
| `removeFileExtension(id)` | 去除扩展名 | `hello-world.md` → `hello-world` |

---

## 5. 核心机制

### 5.1 功能开关模式

每个可选页面在 `siteConfig.pages` 中有对应的布尔开关：

```typescript
// 页面顶部检查
if (!siteConfig.pages.friends) {
  return Astro.redirect("/404/");
}
```

受影响的页面及其开关：

| 开关 | 页面 |
|---|---|
| `pages.friends` | friends.astro |
| `pages.sponsor` | sponsor.astro |
| `pages.guestbook` | guestbook.astro |
| `pages.bangumi` | bangumi.astro |
| `pages.anime` | anime.astro |
| `pages.gallery` | gallery/ |
| `pages.diary` | diary.astro |
| `pages.moments` | moments.astro |
| `pages.music` | music.astro |
| `pages.projects` | projects.astro |
| `pages.skills` | skills.astro |
| `pages.devices` | devices.astro |
| `pages.timeline` | timeline.astro |

### 5.2 数据获取模式

| 模式 | 用途 | 示例 |
|---|---|---|
| `getCollection()` | 获取集合全部数据 | archive.astro、og/[...slug].ts |
| `getEntry("spec", id)` | 获取单个 spec 条目 | friends.astro、about.astro |
| `getSortedPosts()` | 排序文章列表（含 prev/next） | [...page].astro、rss.xml.ts |
| `getSortedPostsList()` | 轻量文章列表（无 body） | CategoryBar、widget |
| `getTagList()` | 聚合标签计数 | tags/index.astro |
| `getArchiveList()` | 统一归档（4 种类型） | archive.astro |
| `getCategoryList()` | 分类及文章计数 | categories/index.astro |
| `getRelatedPosts()` | 相关文章推荐 | [...slug].astro |
| `render(entry)` | 渲染 Markdown 为 HTML | [...slug].astro、friends.astro |
| `import.meta.glob()` | 构建时导入图片元数据 | [...slug].astro（封面图） |

**排序规则**（`getSortedPosts`）：
1. 置顶文章优先（`pinned: true`）
2. 同级按发布日期降序
3. 自动填充 `prevSlug`/`nextSlug`（上一篇/下一篇链接）

### 5.3 文章详情页（最复杂的页面）

`posts/[...slug].astro` 是功能最密集的页面，集成了：

| 功能 | 组件/机制 | 说明 |
|---|---|---|
| 封面图 | `CoverImage` + `processCoverImageSync` | 支持本地图、远程图、API 随机图 |
| Markdown 渲染 | `render(entry)` → `Markdown` | 支持 MDX |
| 加密文章 | `EncryptedPost` | 密码保护内容 |
| 数学公式 | `KatexManager` | KaTeX 渲染 |
| 评论系统 | `Comment` | 可配置的评论组件 |
| 版权声明 | `License` | 基于 `licenseConfig` |
| 相关推荐 | `RecommendedPost` | Jaccard 相似度算法 |
| 分享海报 | `SharePoster`（Svelte） | 社交分享图片 |
| AI 摘要 | `AiSummary` | AI 生成的文章摘要 |
| Banner 元信息 | `bannerPostMeta` | 传递给 MainGridLayout 的文章元信息 |
| 导航链接 | `prevSlug`/`nextSlug` | 上一篇/下一篇导航 |

### 5.4 归档与搜索

**归档页**（`archive.astro`）：
- 统一展示 4 种内容类型：posts、moments、bangumi、life
- 通过查询参数筛选：`?category=`、`?tag=`、`?uncategorized`
- 服务端渲染统计数字（各类型数量 + 总计）
- 使用 `ArchivePanel` 组件渲染时间线

**搜索页**（`search.astro`）：
- 使用 Pagefind 全文搜索库（构建时生成索引）
- Svelte 组件 `AdvancedSearch` 处理搜索交互
- 生产环境动态加载：先 `fetch HEAD` 检查可用性，再动态 `import()`
- 搜索结果支持摘要片段（`excerptLength: 20`）

### 5.5 OG 图片生成

`og/[...slug].ts` 使用 satori 库在服务端生成 Open Graph 图片：

- **预渲染**：`export const prerender = true`，构建时生成所有 PNG
- **字体**：动态获取 Google Fonts Noto Sans SC（Regular + Bold）
- **输出**：`/og/{slug}.png`，供社交媒体分享使用
- **条件生成**：仅在 `siteConfig.post.generateOgImages` 为 true 时生成

### 5.6 RSS 生成

`rss.xml.ts` 使用 Astro Container API 渲染 MDX 内容：

- 使用 `@astrojs/rss` 生成标准 RSS Feed
- 通过 `experimental_AstroContainer` 渲染 MDX 内容为 HTML
- 加密文章显示密码保护提示（不暴露内容）
- 使用 `sanitize-html` 清理 HTML 输出
- 过滤无效 XML 字符

---

## 6. 编码约定

### 页面文件结构

```astro
---
// 1. import（布局 → 组件 → 配置 → 工具 → 类型）
// 2. 功能开关检查
// 3. 数据获取
// 4. 计算逻辑
---
<MainGridLayout title={...} description={...}>
  <!-- 页面内容 -->
</MainGridLayout>
```

### 关键约定

- **所有页面必须包裹 `<MainGridLayout>`**，传递 `title`、`description` 等 props
- **i18n**：标题和描述使用 `i18n(I18nKey.xxx)` 国际化
- **动画类**：内容容器使用 `onload-animation` 类触发入场动画
- **卡片容器**：使用 `card-base` 类作为内容卡片基础样式
- **功能开关**：可选页面在 frontmatter 顶部检查 `siteConfig.pages.*`
- **API 端点**：导出 `GET` 函数，返回 `Response` 对象
- **动态路由**：slug 由 `removeFileExtension(entry.id)` 统一处理

### 数据获取顺序

1. 功能开关检查（`siteConfig.pages.*`）→ 不通过则重定向 404
2. 内容获取（`getCollection`/`getEntry`/`getSortedPosts`）
3. 内容渲染（`render(entry)` 获取 `Content` 和 `headings`）
4. 封面图处理（`processCoverImageSync`）
5. 传递给模板组件

---

## 7. 技术债与改进建议

| 问题 | 严重度 | 说明 |
|---|---|---|
| `blog/[...slug].astro` 与 `posts/[...slug].astro` 几乎完全重复 | 中 | 两个文件各约 200 行，逻辑高度一致，建议合并或建立共享模块 |
| OG 图片路由重复 | 低 | `og/[...slug].ts` 和 `[slug].ts` 功能重叠，建议保留一个 |
| `archive.astro` 硬编码 "生活" | 低 | 未走 i18n 国际化，直接使用中文字符串 |
| spec 页面缺乏容错 | 低 | `getEntry("spec", "friends")` 返回 null 时仅 throw Error，建议优雅降级 |
| `friends.astro` 使用 `getEntry` + `render` | 低 | spec 集合无 schema 约束，可能缺少字段校验 |
