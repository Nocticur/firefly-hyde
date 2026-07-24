import type { ResourceDescriptor, ResourceGroup } from "./types";

export const groupLabels: Record<ResourceGroup, string> = {
  content: "内容",
  operations: "运营",
  settings: "站点设置",
  system: "系统",
};

export const groupIcons: Record<ResourceGroup, string> = {
  content: "material-symbols:edit-note-rounded",
  operations: "material-symbols:campaign-outline-rounded",
  settings: "material-symbols:tune-rounded",
  system: "material-symbols:shield-outline-rounded",
};

export const resourceIcons: Record<string, string> = {
  posts: "material-symbols:article-outline-rounded",
  "spec-pages": "material-symbols:description-outline-rounded",
  dynamic: "material-symbols:bolt-rounded",
  moments: "material-symbols:photo-camera-back-outline-rounded",
  notebooks: "material-symbols:book-2-outline-rounded",
  projects: "material-symbols:deployed-code-outline-rounded",
  skills: "material-symbols:school-outline-rounded",
  timeline: "material-symbols:timeline-rounded",
  diary: "material-symbols:auto-stories-outline-rounded",
  devices: "material-symbols:devices-other-rounded",
  music: "material-symbols:library-music-outline-rounded",
  friends: "material-symbols:group-outline-rounded",
  sponsors: "material-symbols:favorite-outline-rounded",
  gallery: "material-symbols:photo-library-outline-rounded",
  "site-config": "material-symbols:language-rounded",
  navigation: "material-symbols:view-sidebar-outline-rounded",
  appearance: "material-symbols:palette-outline-rounded",
  integrations: "material-symbols:hub-outline-rounded",
  media: "material-symbols:perm-media-outline-rounded",
};

export const sourceLabels: Record<ResourceDescriptor["source"], string> = {
  "git-markdown": "Git Markdown",
  "git-config": "Git Config",
  "git-jsonc": "Git JSONC",
  gist: "GitHub Gist",
  media: "Git + 图床",
};
