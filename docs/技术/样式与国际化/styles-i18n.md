# 样式系统与国际化模块说明

## 1. 模块概述

Styles 模块（23 个文件，约 2700 行）和 i18n 模块（8 个文件）共同构成了 Firefly 博客主题的视觉和语言基础。

- **Styles**：CSS 变量定义、全局样式、组件样式、动画过渡、响应式设计
- **i18n**：6 种语言的翻译支持，约 200+ 个翻译键

---

## 2. 样式系统

### 2.1 文件清单

| 文件 | 格式 | 行数 | 用途 |
|---|---|---|---|
| `main.css` | CSS | 591 | 入口文件：Tailwind v4 + 所有子样式 + 自定义工具类 |
| `layout-styles.css` | CSS | 831 | 布局样式（网格、侧边栏、Banner、壁纸模式） |
| `navbar.css` | CSS | 321 | 导航栏（毛玻璃、透明模式、响应式） |
| `widget-responsive.css` | CSS | 452 | Widget 响应式布局系统 |
| `dynamic.css` | CSS | 743 | 动态/说说页面（Feed、搜索、画廊、评论） |
| `markdown-extend.styl` | Stylus | 506 | Markdown 扩展（admonition、GitHub 卡片、图表） |
| `variables.styl` | Stylus | ~120 | CSS 变量定义（亮色/暗色主题） |
| `markdown.css` | CSS | 221 | Markdown 基础样式 |
| `toc.css` | CSS | 155 | 目录样式（滚动高亮、层级缩进） |
| `transition.css` | CSS | 131 | Swup 页面过渡 + 全局动画 |
| `fancybox-custom.css` | CSS | 121 | Fancybox 灯箱自定义 |
| `expressive-code.css` | CSS | 69 | 代码高亮样式 |
| `banner-title.css` | CSS | 63 | Banner 标题（响应式字体、毛玻璃） |
| `categories.css` | CSS | 57 | 分类按钮（MD3 Filled Tonal Chip） |
| `scrollbar.css` | CSS | 84 | 滚动条样式 |
| `custom-scrollbar.css` | CSS | 38 | 自定义滚动条 |
| `anime-bangumi.css` | CSS | 37 | 动画/番剧网格布局 |
| `waves.css` | CSS | 204 | 水波纹动画（视差效果） |
| `gallery.css` | CSS | 8 | 相册瀑布流布局 |
| `tags.css` | CSS | 26 | 标签云（MD3 Filter Chip） |
| `display-settings.css` | CSS | 168 | 显示设置面板（滑块、控件） |
| `photoswipe.css` | CSS | 33 | PhotoSwipe 灯箱按钮 |
| `dynamic.css` | CSS | 743 | 动态页面完整样式 |
| `mouse.css` | CSS | 25 | 自定义鼠标样式 |

### 2.2 技术栈

| 技术 | 用途 | 入口 |
|---|---|---|
| **Tailwind CSS v4** | 原子类框架 | `main.css`（`@import 'tailwindcss'`） |
| **Stylus** | CSS 预处理器 | `variables.styl`、`markdown-extend.styl` |
| **原生 CSS** | 组件样式、动画 | 其余 21 个 `.css` 文件 |
| **CSS 变量** | 主题系统 | `variables.styl` 中定义 |
| **oklch 色彩空间** | 动态主题色 | `oklch(0.70 0.14 var(--hue))` |

### 2.3 主题系统

**亮色/暗色切换**：
- `variables.styl` 定义两套 CSS 变量（`:root` 和 `.dark`）
- `main.css` 配置 `@custom-variant dark (&:where(.dark, .dark *))`
- JavaScript 通过 `setting-utils.ts` 切换 `.dark` class

**主题色动态化**：
- `--hue` CSS 变量由 `siteConfig.themeColor.hue` 通过 JS 设置
- 所有颜色使用 `oklch(0.xx 0.xx var(--hue))` 格式
- 用户可通过 DisplaySettings 面板实时调整色相（0-360）

**关键 CSS 变量**（`variables.styl`）：

| 变量 | 说明 |
|---|---|
| `--primary` | 主题色（oklch 基于 --hue） |
| `--page-bg` | 页面背景色 |
| `--card-bg` | 卡片背景色 |
| `--btn-content` | 按钮文字色 |
| `--btn-regular-bg` | 按钮背景色 |
| `--deep-text` | 深色文字 |
| `--line-divider` | 分割线颜色 |
| `--selection-bg` | 选中背景色 |
| `--codeblock-bg` | 代码块背景 |
| `--float-panel-bg` | 浮动面板背景 |

### 2.4 动画系统

**Swup 页面过渡**（`transition.css`）：
- `.transition-main`：主内容区过渡（opacity + transform，120ms）
- `.transition-leaving`：离开动画（反向方向）
- `html.is-changing` / `html.is-leaving` / `html.is-animating`：Swup 状态类
- `.transition-swup-fade`：侧边栏淡入淡出

**入场动画**：
- `.onload-animation`：fadeInUp 入场动画
- `--content-delay`：动画延迟变量（150ms）
- 支持 `animation-delay` 实现错开效果

**水波纹动画**（`waves.css`，204 行）：
- 多层视差波浪效果
- 用户可通过 HTML 属性控制可见性
- 移动端优化（高度和定位调整）

---

## 3. 国际化系统

### 3.1 文件清单

| 文件 | 行数 | 用途 |
|---|---|---|
| `i18nKey.ts` | 519 | 翻译键枚举定义（200+ 个键） |
| `translation.ts` | 50 | 翻译查找函数 |
| `languages/zh_CN.ts` | ~200 | 简体中文翻译 |
| `languages/zh_TW.ts` | ~200 | 繁体中文翻译 |
| `languages/en.ts` | ~200 | 英语翻译 |
| `languages/ja.ts` | ~200 | 日语翻译 |
| `languages/ru.ts` | ~200 | 俄语翻译 |
| `languages/ko.ts` | ~200 | 韩语翻译 |

### 3.2 翻译键定义（`i18nKey.ts`，519 行）

使用 TypeScript `enum` 定义所有翻译键，按功能分组：

| 分组 | 示例键 |
|---|---|
| 基础 UI | `home`、`about`、`archive`、`search`、`tags`、`categories` |
| 搜索 | `searchNoResults`、`searchTypeSomething`、`searchLoading` |
| 动态 | `dynamic`、`latestDynamics`、`dynamicSearch`、`dynamicLoadMore` |
| 评论 | `comments`、`commentSection`、`commentSubtitle` |
| 设置 | `themeColor`、`lightMode`、`darkMode`、`settingsTabAppearance` |
| 统计 | `siteStats`、`siteStatsPostCount`、`wordCount`、`pageViews` |
| 日历 | `calendar`、`calendarJanuary`-`calendarDecember` |
| 音乐 | `music`、`playList`、`lyrics` |

### 3.3 翻译查找与降级（`translation.ts`，50 行）

```typescript
export function i18n(key: I18nKey): string {
  const lang = siteConfig.lang || "en";
  const currentLang = getTranslation(lang);
  const value = currentLang[key];
  // 降级：当前语言 → 中文 → 英文
  if (!value && lang !== "zh_cn") return zh_CN[key] || defaultTranslation[key];
  return value;
}
```

**语言代码映射**：
- `en` / `en_us` / `en_gb` / `en_au` → English
- `zh_cn` → 简体中文
- `zh_tw` → 繁体中文
- `ja` / `ja_jp` → 日语
- `ru` / `ru_ru` → 俄语
- `ko` / `ko_kr` → 韩语

### 3.4 支持的语言

| 语言 | 文件 | 代码 | 降级顺序 |
|---|---|---|---|
| 简体中文 | `zh_CN.ts` | `zh_CN` | - |
| 繁体中文 | `zh_TW.ts` | `zh_TW` | zh_CN → en |
| 英语 | `en.ts` | `en` | - |
| 日语 | `ja.ts` | `ja` | zh_CN → en |
| 俄语 | `ru.ts` | `ru` | zh_CN → en |
| 韩语 | `ko.ts` | `ko` | zh_CN → en |

---

## 4. 编码约定

### 样式引用

```astro
---
import "@/styles/main.css";           // Layout.astro
import "@/styles/markdown.css";       // MainGridLayout.astro
import "@/styles/expressive-code.css"; // MainGridLayout.astro
import "@/styles/toc.css";            // SidebarTOC.astro
---
```

### CSS 变量使用

```css
/* 组件中引用主题变量 */
color: var(--primary);
background: var(--card-bg);
border-color: var(--line-divider);
```

### i18n 使用

```astro
---
import I18nKey from "@/i18n/i18nKey";
import { i18n } from "@/i18n/translation";
---
<h1>{i18n(I18nKey.home)}</h1>
```

### Tailwind v4 自定义工具类

```css
/* main.css 中定义 */
@utility expand-animation { ... }
@utility btn-plain { ... }
@utility btn-regular { ... }
@utility card-base { ... }
```

---

## 5. 技术债与改进建议

| 问题 | 严重度 | 建议 |
|---|---|---|
| `variables.styl` 使用 Stylus | 低 | 增加构建依赖，可考虑迁移到原生 CSS |
| `main.css` 导入 12 个子样式 | 低 | 可按功能域合并（如动画类、组件类） |
| 部分 CSS 文件仅 20-30 行 | 低 | `gallery.css`（8行）、`mouse.css`（25行）可合并 |
| i18n 新增键需修改 6 个文件 | 低 | 可考虑使用 JSON 格式或 i18n 框架 |
| `dynamic.css` 743 行过大 | 低 | 可拆分为 dynamic-feed.css、dynamic-gallery.css 等 |
| `layout-styles.css` 831 行过大 | 低 | 可拆分为 banner.css、sidebar.css 等 |
