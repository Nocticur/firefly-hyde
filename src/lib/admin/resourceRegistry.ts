import type {
	AdminResourceGroup,
	AdminResourceSource,
	EnvironmentStatus,
	ResourceCapabilities,
	ResourceDescriptor,
} from "./contracts";

const EDITABLE: ResourceCapabilities = {
	create: true,
	update: true,
	delete: true,
	reorder: true,
	preview: true,
};

const CONFIGURABLE: ResourceCapabilities = {
	create: false,
	update: true,
	delete: false,
	reorder: false,
	preview: true,
};

const MEDIA: ResourceCapabilities = {
	create: false,
	update: false,
	delete: true,
	reorder: false,
	preview: false,
};

const GIST_COLLECTION: ResourceCapabilities = {
	create: true,
	update: true,
	delete: false,
	reorder: true,
	preview: true,
};

function resource(
	id: string,
	label: string,
	description: string,
	group: AdminResourceGroup,
	source: AdminResourceSource,
	path: string | undefined,
	capabilities: ResourceCapabilities = EDITABLE,
): ResourceDescriptor {
	return { id, label, description, group, source, path, capabilities };
}

const RESOURCES: readonly ResourceDescriptor[] = [
	resource("posts", "文章", "Markdown 文章与 Frontmatter", "content", "git-markdown", "src/content/posts"),
	resource("spec-pages", "专题页面", "关于、友链说明、留言板与其他专题", "content", "git-markdown", "src/content/spec"),
	resource("dynamic", "动态", "站内动态内容", "content", "git-markdown", "src/content/dynamic"),
	resource("moments", "朋友圈", "GitHub Gist 朋友圈内容", "content", "gist", undefined, GIST_COLLECTION),
	resource("notebooks", "笔记本", "GitHub Gist 笔记本与笔记", "content", "gist", undefined, GIST_COLLECTION),
	resource("projects", "项目", "项目展示与状态", "content", "git-config", "src/data/projects.ts"),
	resource("skills", "技能", "技能树与熟练度", "content", "git-config", "src/data/skills.ts"),
	resource("timeline", "时间线", "经历与里程碑", "content", "git-config", "src/data/timeline.ts"),
	resource("diary", "日记", "图文、视频与地点日记", "content", "git-config", "src/data/diary.ts"),
	resource("devices", "设备", "设备分类与详情", "content", "git-config", "src/data/devices.ts"),
	resource("music", "音乐", "歌曲、歌单与播放器数据", "content", "git-jsonc", "src/data/music.json"),
	resource("friends", "友链", "友链列表、标签和排序", "operations", "git-config", "src/config/friendsConfig.ts"),
	resource("sponsors", "赞助", "赞助方式与赞助者", "operations", "git-config", "src/config/sponsorConfig.ts"),
	resource("gallery", "相册", "相册元数据与访问设置", "operations", "git-config", "src/config/galleryConfig.ts"),
	resource("site-config", "站点信息", "站点、页面与个人资料", "settings", "git-config", "src/config/siteConfig.ts", CONFIGURABLE),
	resource("profile", "个人资料", "头像、名称、简介和社交链接", "settings", "git-config", "src/config/profileConfig.ts", CONFIGURABLE),
	resource("announcement", "公告", "首页公告栏内容与链接", "settings", "git-jsonc", "src/config/data/announcement.json", CONFIGURABLE),
	resource("navigation", "导航栏", "导航菜单、搜索和链接预设", "settings", "git-config", "src/config/navBarConfig.ts", CONFIGURABLE),
	resource("sidebar", "侧栏布局", "左右侧栏和移动端组件", "settings", "git-config", "src/config/sidebarConfig.ts", CONFIGURABLE),
	resource("appearance", "外观与布局", "主题、壁纸、字体与显示设置", "settings", "git-config", "src/config/backgroundWallpaper.ts", CONFIGURABLE),
	resource("cover-image", "封面图", "文章封面和随机图 API", "settings", "git-jsonc", "src/config/data/cover-image.json", CONFIGURABLE),
	resource("integrations", "外部服务", "评论、统计、图表与外部 API", "settings", "git-config", "src/config/commentConfig.ts", CONFIGURABLE),
	resource("analytics", "数据统计", "Google、Umami、Clarity 等统计服务", "settings", "git-config", "src/config/analyticsConfig.ts", CONFIGURABLE),
	resource("music-config", "音乐播放器", "播放器行为、歌单和本地音乐", "settings", "git-config", "src/config/musicConfig.ts", CONFIGURABLE),
	resource("effects", "特效", "樱花、看板娘和渲染特效", "settings", "git-config", "src/config/effectsConfig.ts", CONFIGURABLE),
	resource("footer", "页脚", "页脚开关和自定义 HTML", "settings", "git-jsonc", "src/config/data/footer.json", CONFIGURABLE),
	resource("footer-html", "页脚 HTML", "备案号、版权和自定义标记", "settings", "git-config", "src/config/FooterConfig.html", CONFIGURABLE),
	resource("license", "许可证", "文章版权和许可协议", "settings", "git-config", "src/config/licenseConfig.ts", CONFIGURABLE),
	resource("fonts", "字体", "全局字体和字体提供商", "settings", "git-config", "src/config/fontConfig.ts", CONFIGURABLE),
	resource("code-style", "代码样式", "代码高亮、折叠和语言徽章", "settings", "git-config", "src/config/expressiveCodeConfig.ts", CONFIGURABLE),
	resource("mermaid", "Mermaid 图表", "Mermaid 服务器和主题", "settings", "git-config", "src/config/mermaidConfig.ts", CONFIGURABLE),
	resource("plantuml", "PlantUML 图表", "PlantUML 服务器和主题", "settings", "git-config", "src/config/plantumlConfig.ts", CONFIGURABLE),
	resource("widget-model", "看板娘", "Spine 与 Live2D 模型", "settings", "git-config", "src/config/pioConfig.ts", CONFIGURABLE),
	resource("dynamic-config", "动态设置", "动态页面标题、评论和分页", "settings", "git-jsonc", "src/config/data/dynamic.json", CONFIGURABLE),
	resource("display-settings", "显示设置", "前台用户设置面板开关", "settings", "git-jsonc", "src/config/data/display-settings.json", CONFIGURABLE),
	resource("relationship", "关系计时", "恋爱计时内容与头像", "settings", "git-jsonc", "src/config/data/relationship.json", CONFIGURABLE),
	resource("translations", "多语言文案", "中文、英文、日文等界面文案", "settings", "git-config", "src/i18n/languages", CONFIGURABLE),
	resource("media", "媒体库", "仓库素材与图床媒体", "operations", "media", undefined, MEDIA),
];

export function listResourceDescriptors(): ResourceDescriptor[] {
	return RESOURCES.map((item) => ({
		...item,
		capabilities: { ...item.capabilities },
	}));
}

export function getResourceDescriptor(id: string): ResourceDescriptor | undefined {
	const item = RESOURCES.find((candidate) => candidate.id === id);
	return item ? { ...item, capabilities: { ...item.capabilities } } : undefined;
}

export function getEnvironmentStatus(
	env: Record<string, string | undefined>,
): EnvironmentStatus {
	return {
		github: Boolean(env.GITHUB_TOKEN && env.GITHUB_OWNER && env.GITHUB_REPO),
		gist: Boolean(env.GITHUB_GIST_TOKEN || env.GITHUB_TOKEN),
		imageBed: Boolean(env.IMG_BED_URL && env.IMG_BED_TOKEN),
		telegram: Boolean(env.TELEGRAM_CHAT_ID && env.TELEGRAM_BOT_TOKEN),
		weather: Boolean(env.WEATHER_API_KEY),
		huggingFace: Boolean(env.HUGGINGFACE_TOKEN),
	};
}
