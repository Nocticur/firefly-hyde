// 外部说说数据源配置（基于 GitHub Gist，完全免费）
// 数据存储在 GitHub Gist 中，通过 GitHub API 读写
// 添加新说说不会修改仓库中的任何代码

export const externalMomentsConfig: {
	enable: boolean;
	gistId: string;
	fileName: string;
	defaultAuthor: string;
	defaultAvatar: string;
	githubToken: string;
} = {
	// 是否启用外部说说数据源
	enable: true,

	// GitHub Gist ID（创建 Gist 后从 URL 中获取）
	gistId: "ee329e8726b8d77b68f23c602ae76f8c",

	// Gist 中的文件名
	fileName: "moments.json",

	// 默认作者信息
	defaultAuthor: "Hyde",
	defaultAvatar:
		"https://i.postimg.cc/7YLVJqnp/wei-xin-tu-pian-2026-05-07-020150-883.jpg",

	// GitHub Token（从环境变量 GITHUB_TOKEN 读取，不再存入源码）
	githubToken: process.env.GITHUB_TOKEN || "",
};
