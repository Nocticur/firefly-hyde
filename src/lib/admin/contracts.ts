export const API_VERSION = "2.0.0";

export type AdminResourceGroup =
	| "content"
	| "operations"
	| "settings"
	| "system";

export type AdminResourceSource =
	| "git-markdown"
	| "git-config"
	| "git-jsonc"
	| "gist"
	| "media";

export interface ResourceCapabilities {
	create: boolean;
	update: boolean;
	delete: boolean;
	reorder: boolean;
	preview: boolean;
}

export interface ResourceDescriptor {
	id: string;
	label: string;
	description: string;
	group: AdminResourceGroup;
	source: AdminResourceSource;
	path?: string;
	capabilities: ResourceCapabilities;
}

export interface ResourceRevision {
	type: "git" | "gist";
	value: string;
}

export interface ResourceDraft<T = unknown> {
	resourceId: string;
	itemId?: string;
	payload: T;
	baseRevision?: ResourceRevision;
	updatedAt: string;
}

export interface PublishRequest<T = unknown> {
	resourceId: string;
	itemId?: string;
	payload: T;
	baseRevision?: ResourceRevision;
	message: string;
}

export interface PublishResult {
	mode: "git" | "gist";
	revision: ResourceRevision;
	commitUrl?: string;
	deploymentStatus?: DeploymentStatus;
}

export type DeploymentState = "queued" | "in_progress" | "success" | "failure";

export interface DeploymentStatus {
	sha: string;
	state: DeploymentState;
	url?: string;
	updatedAt: string;
}

export interface EnvironmentStatus {
	github: boolean;
	gist: boolean;
	imageBed: boolean;
	telegram: boolean;
	weather: boolean;
	huggingFace: boolean;
}

export type AdminModule =
	| "resources"
	| "posts"
	| "config"
	| "images"
	| "moments"
	| "notebooks"
	| "deployments";

export interface CursorPage<T> {
	items: T[];
	nextCursor: string | null;
	total: number;
	failures?: Array<{ id: string; message: string }>;
}

export interface CapabilitiesResponse {
	apiVersion: typeof API_VERSION;
	modules: AdminModule[];
	resources: ResourceDescriptor[];
	limits: { pageSizeMax: number; uploadBytesMax: number };
}

export interface PostFrontmatter {
	title: string;
	published: string;
	updated?: string;
	draft?: boolean;
	description?: string;
	descriptionSource?: string;
	image?: string;
	tags?: string[];
	category?: string | null;
	lang?: string;
	pinned?: boolean;
	author?: string;
	sourceLink?: string;
	licenseName?: string;
	licenseUrl?: string;
	comment?: boolean;
	password?: string;
	passwordHint?: string;
	[key: string]: unknown;
}

export interface PostDetail {
	slug: string;
	sha: string;
	frontmatter: PostFrontmatter;
	content: string;
}
