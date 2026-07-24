# 插件系统模块说明

## 1. 模块概述

Plugins 模块是 Firefly 博客主题的 Markdown/HTML 处理管道，共 **20 个文件**，通过 remark（AST 转换）和 rehype（HAST 转换）插件扩展 Markdown 渲染能力。

核心功能：Mermaid/PlantUML 图表渲染、GitHub 仓库卡片、图片网格布局、邮箱加密保护、外部链接处理、阅读时间计算等。

---

## 2. 文件清单与分类

### 按处理阶段

| 阶段 | 文件数 | 文件 |
|---|---|---|
| **remark（MDAST）** | 6 | remark-reading-time、remark-excerpt、remark-mermaid、remark-plantuml、remark-image-grid、remark-directive-rehype |
| **rehype（HAST）** | 8 | rehype-mermaid、rehype-plantuml、rehype-component-github-card、rehype-diagram-panzoom、rehype-external-links、rehype-figure、rehype-email-protection、rehype-image-referrerpolicy |
| **客户端脚本** | 4 | diagram-panzoom-script.js、plantuml-render-script.js、plantuml-theme-switch.js、plantuml-encoder.js |
| **共享工具** | 2 | utils/diagramConstants.js、utils/extractText.js |

### 完整文件清单

| 文件 | 类型 | 行数 | 用途 |
|---|---|---|---|
| `remark-reading-time.mjs` | remark | 15 | 计算阅读时间和字数 |
| `remark-excerpt.js` | remark | 17 | 提取文章摘要（第一段） |
| `remark-mermaid.js` | remark | 24 | Mermaid 代码块标记 |
| `remark-plantuml.js` | remark | ~30 | PlantUML 代码块标记 |
| `remark-image-grid.js` | remark | ~120 | 图片网格布局（`[grid]` 语法） |
| `remark-directive-rehype.js` | remark | ~80 | Markdown 指令解析（admonition 提示块） |
| `rehype-mermaid.mjs` | rehype | ~150 | Mermaid 图表渲染（WASM 构建时渲染） |
| `rehype-plantuml.mjs` | rehype | ~100 | PlantUML 图表渲染 |
| `rehype-component-github-card.mjs` | rehype | ~80 | GitHub 仓库卡片组件 |
| `rehype-diagram-panzoom.mjs` | rehype | 25 | 图表缩放/全屏交互脚本注入 |
| `rehype-external-links.mjs` | rehype | 43 | 外部链接添加 `target="_blank"` |
| `rehype-figure.mjs` | rehype | 64 | 图片转换为 figure+figcaption |
| `rehype-email-protection.mjs` | rehype | ~60 | 邮箱地址加密保护（Base64/ROT13） |
| `rehype-image-referrerpolicy.mjs` | rehype | 50 | 图片 referrerpolicy 设置 |
| `plantuml-encoder.js` | 工具 | ~30 | PlantUML 编码器 |
| `plantuml-render-script.js` | 客户端 | ~40 | PlantUML 客户端渲染脚本 |
| `plantuml-theme-switch.js` | 客户端 | ~30 | PlantUML 主题切换脚本 |
| `diagram-panzoom-script.js` | 客户端 | ~80 | 图表缩放/全屏客户端脚本 |
| `utils/diagramConstants.js` | 工具 | 32 | 图表 CSS 类名常量 |
| `utils/extractText.js` | 工具 | ~10 | 文本提取工具 |

---

## 3. 处理管道

### 3.1 Astro 配置中的插件注册顺序

**Remark 插件**（`astro.config.mjs` → `markdown.processor.remarkPlugins`）：

| 序号 | 插件 | 来源 | 说明 |
|---|---|---|---|
| 1 | `remarkAdmonitionToBlockquoteCallout` | 第三方 | Python 风格 admonition 转换（条件启用） |
| 2 | `remarkMath` | 第三方 | 数学公式支持 |
| 3 | `remarkReadingTime` | 自定义 | 阅读时间计算 |
| 4 | `remarkImageGrid` | 自定义 | 图片网格布局 |
| 5 | `remarkExcerpt` | 自定义 | 文章摘要提取 |
| 6 | `remarkDirective` | 第三方 | Markdown 指令语法 |
| 7 | `remarkSectionize` | 第三方 | 章节结构化 |
| 8 | `parseDirectiveNode` | 自定义 | 自定义指令解析 |
| 9 | `remarkMermaid` | 自定义 | Mermaid 代码块标记 |
| 10 | `remarkPlantuml` | 自定义 | PlantUML 代码块标记 |

**Rehype 插件**（`astro.config.mjs` → `markdown.processor.rehypePlugins`）：

| 序号 | 插件 | 来源 | 说明 |
|---|---|---|---|
| 1 | `rehypeKatex` | 第三方 | LaTeX 数学公式渲染 |
| 2 | `rehypeCallouts` | 第三方 | Callout 组件 |
| 3 | `rehypeSlug` | 第三方 | 标题自动生成 slug |
| 4 | `rehypeMermaid` | 自定义 | Mermaid 图表渲染 |
| 5 | `rehypePlantuml` | 自定义 | PlantUML 图表渲染 |
| 6 | `rehypeDiagramPanZoom` | 自定义 | 图表交互脚本注入 |
| 7 | `rehypeFigure` | 自定义 | 图片 figure 转换 |
| 8 | `rehypeImageReferrerPolicy` | 自定义 | 图片 referrerpolicy |
| 9 | `rehypeExternalLinks` | 自定义 | 外部链接处理 |
| 10 | `rehypeEmailProtection` | 自定义 | 邮箱加密保护 |
| 11 | `rehypeComponents` | 第三方 | 自定义组件（GitHub 卡片） |
| 12 | `rehypeAutolinkHeadings` | 第三方 | 标题自动链接 |

### 3.2 处理流程

```
Markdown 源码
  ↓ remark 阶段（MDAST 转换）
  ├── remarkReadingTime → 写入 frontmatter.minutes/words
  ├── remarkExcerpt → 写入 frontmatter.excerpt
  ├── remarkImageGrid → [grid] 语法转换为图片网格容器
  ├── remarkDirective + parseDirectiveNode → :::note 等 admonition 解析
  ├── remarkMermaid → mermaid 代码块标记为自定义节点
  └── remarkPlantuml → plantuml 代码块标记为自定义节点
  ↓ rehype 阶段（HAST 转换）
  ├── rehypeKatex → 数学公式渲染
  ├── rehypeMermaid → Mermaid → SVG（WASM 构建时渲染，浅色+深色两套）
  ├── rehypePlantuml → PlantUML → 交互式容器
  ├── rehypeDiagramPanZoom → 注入缩放/全屏客户端脚本
  ├── rehypeFigure → 图片 → figure+figcaption
  ├── rehypeImageReferrerPolicy → 添加 referrerpolicy
  ├── rehypeExternalLinks → 外部链接添加 target="_blank"
  ├── rehypeEmailProtection → 邮箱地址加密
  └── rehypeComponents → GitHub 仓库卡片渲染
  ↓ HTML 输出
  ↓ 客户端脚本（浏览器端）
  ├── diagram-panzoom-script.js → 图表缩放/全屏交互
  ├── plantuml-render-script.js → PlantUML 渲染
  └── plantuml-theme-switch.js → 主题切换
```

---

## 4. 核心插件详解

### 4.1 Mermaid 图表管道

**两阶段处理**：

1. **remark-mermaid.js**：将 ` ```mermaid ` 代码块转换为自定义节点类型，存入 `data-mermaid-code` 属性
2. **rehype-mermaid.mjs**：使用 `@mermanjs/web` WASM 在构建时将 Mermaid 源码渲染为两套静态 SVG（浅色+深色主题）
3. **rehype-diagram-panzoom.mjs**：注入客户端缩放/全屏交互脚本

**关键特性**：
- 构建时渲染（非客户端），SEO 友好
- 双主题支持（浅色/深色通过 CSS class 切换）
- MDX 兼容：将代码存为子节点防止 MDX 编译器丢失

### 4.2 PlantUML 图表管道

**两阶段处理**：

1. **remark-plantuml.js**：将 ` ```plantuml ` 代码块标记为 `div.plantuml-container`
2. **rehype-plantuml.mjs**：转换为交互式 `.plantuml-diagram-container`，注入主题切换脚本

**客户端脚本**：
- `plantuml-encoder.js`：PlantUML 源码编码为 URL
- `plantuml-render-script.js`：客户端渲染和错误处理
- `plantuml-theme-switch.js`：亮暗主题切换

### 4.3 图片处理插件

**rehype-figure.mjs**（64 行）：
- 将带 alt 文本的 `<img>` 转换为 `<figure>` + `<figcaption>`
- 自动添加 `referrerpolicy="no-referrer"`（通过 `image-utils.ts` 的 `shouldAddNoReferrer()`）

**rehype-image-referrerpolicy.mjs**（50 行）：
- 为匹配 `noReferrerDomains` 的图片添加 `referrerpolicy="no-referrer"`
- 支持通配符域名匹配（如 `*.example.com`）

**remark-image-grid.js**（~120 行）：
- 解析 `[grid]...[/grid]` 语法，创建响应式图片网格
- 自动根据图片数量计算列数（最多 4 列）

### 4.4 链接处理插件

**rehype-external-links.mjs**（43 行）：
- 为外部链接添加 `target="_blank" rel="noopener noreferrer"`
- 跳过本站链接（通过 `siteUrl` 配置判断）

**rehype-email-protection.mjs**（~60 行）：
- 加密 `mailto:` 链接（Base64 或 ROT13 编码）
- 浏览器端解码脚本注入

**rehype-component-github-card.mjs**（~80 行）：
- 渲染 `::github{repo="owner/repo"}` 指令为 GitHub 仓库卡片
- 包含头像、语言、描述、星标数、Fork 数

### 4.5 内容提取插件

**remark-reading-time.mjs**（15 行）：
- 使用 `reading-time` 库计算阅读时间
- 写入 `data.astro.frontmatter.minutes` 和 `.words`

**remark-excerpt.js**（17 行）：
- 提取文章第一段作为摘要
- 写入 `data.astro.frontmatter.excerpt`

**remark-directive-rehype.js**（~80 行）：
- 解析 `:::note`、`:::warning` 等 admonition 指令
- 支持 30+ 种提示块类型

---

## 5. Markdown 扩展语法

| 语法 | 插件 | 示例 |
|---|---|---|
| Mermaid 图表 | remark-mermaid + rehype-mermaid | ` ```mermaid ` |
| PlantUML 图表 | remark-plantuml + rehype-plantuml | ` ```plantuml ` |
| 图片网格 | remark-image-grid | `[grid]![img1](url1)![img2](url2)[/grid]` |
| Admonition 提示块 | remark-directive-rehype | `:::note\n内容\n:::` |
| GitHub 卡片 | rehype-component-github-card | `::github{repo="owner/repo"}` |
| 数学公式 | remark-math + rehype-katex | `$inline$` 或 `$$block$$` |

---

## 6. 编码约定

### 插件函数签名

**Remark 插件**：
```javascript
export function remarkXxx() {
  return (tree, { data }) => {
    visit(tree, "code", (node) => { ... });
    // 可写入 frontmatter
    data.astro.frontmatter.xxx = value;
  };
}
```

**Rehype 插件**：
```javascript
export default function rehypeXxx(options = {}) {
  return (tree) => {
    visit(tree, "element", (node) => { ... });
  };
}
```

### 脚本注入模式

rehype 插件通过 `?raw` 导入客户端脚本，在构建时注入到 HTML：
```javascript
import clientScript from "./xxx-script.js?raw";
const script = h("script", { type: "text/javascript" }, clientScript);
tree.children = [...tree.children, script];
```

使用 `WeakSet` 避免同一 tree 多次注入。

### 共享常量

图表相关 CSS 类名集中在 `utils/diagramConstants.js` 中管理，rehype 插件和客户端脚本共用。

---

## 7. 技术债与改进建议

| 问题 | 严重度 | 建议 |
|---|---|---|
| `rehype-mermaid.mjs` 使用 WASM 渲染 | 中 | 增加构建复杂度，但提升了 SEO 和性能 |
| 客户端脚本（`.js`）使用 `?raw` 导入 | 低 | 缺乏类型检查，可考虑 TypeScript 重写 |
| `remark-image-grid.js` 使用文本匹配 | 低 | `[grid]` 非标准 Markdown 语法，可考虑使用 remark-directive |
| `remark-mermaid.js` 和 `rehype-mermaid.mjs` 紧密耦合 | 低 | 功能上是一个整体，但分布在两个文件中 |
| 插件注册顺序敏感 | 低 | 顺序在 `astro.config.mjs` 中硬编码，修改需谨慎 |
