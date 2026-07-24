export type ResourceGroup = "content" | "operations" | "settings" | "system";
export type ResourceSource = "git-markdown" | "git-config" | "git-jsonc" | "gist" | "media";

export interface ResourceDescriptor {
	id: string;
	label: string;
	description: string;
	group: ResourceGroup;
	source: ResourceSource;
	path?: string;
	capabilities: {
		create: boolean;
		update: boolean;
		delete: boolean;
		reorder: boolean;
		preview: boolean;
	};
}

export interface EnvironmentStatus {
	github: boolean;
	gist: boolean;
	imageBed: boolean;
	telegram: boolean;
	weather: boolean;
	huggingFace: boolean;
}
