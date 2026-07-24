import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const postsCollection = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
	schema: z.object({
		title: z.string(),
		published: z.date(),
		updated: z.date().optional(),
		draft: z.boolean().optional().default(false),
		description: z.string().optional().default(""),
		descriptionSource: z.string().optional().default(""),
		image: z.string().optional().default(""),
		tags: z.array(z.string()).optional().default([]),
		category: z.string().optional().nullable().default(""),
		lang: z.string().optional().default(""),
		pinned: z.boolean().optional().default(false),
		author: z.string().optional().default(""),
		sourceLink: z.string().optional().default(""),
		licenseName: z.string().optional().default(""),
		licenseUrl: z.string().optional().default(""),
		comment: z.boolean().optional().default(true),
		password: z.string().optional().default(""),
		passwordHint: z.string().optional().default(""),

		/* For internal use */
		prevTitle: z.string().default(""),
		prevSlug: z.string().default(""),
		nextTitle: z.string().default(""),
		nextSlug: z.string().default(""),
	}),
});

const specCollection = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/spec" }),
	schema: z.object({}),
});

const ziyuanCollection = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/ziyuan" }),
	schema: z.object({
		title: z.string(),
		quotes: z.array(
			z.object({
				text: z.string(),
				author: z.string(),
			}),
		),
	}),
});

const momentsCollection = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/moments" }),
	schema: z.object({
		published: z.date(),
		tags: z.array(z.string()).optional().default([]),
		location: z.string().optional().default(""),
	}),
});

const dynamicCollection = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/dynamic" }),
	schema: z.object({
		published: z.date(),
	}),
});

export const collections: Record<string, any> = {
	dynamic: dynamicCollection,
	moments: momentsCollection,
	posts: postsCollection,
	spec: specCollection,
	ziyuan: ziyuanCollection,
};
