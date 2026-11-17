import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Content collections. The file name (without .md) is the URL slug.
 * Entries with `draft: true` are sample content: they show in `pnpm dev` and
 * `pnpm build:preview`, and are left out of the production build.
 */
export const LIGHTING = ['none', 'front-lit', 'backlit', 'halo-lit', 'neon'] as const;

const faq = z.object({ q: z.string(), a: z.string() });

const signageTypes = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/signage-types' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      order: z.number().default(100),
      shortDescription: z.string().max(160),
      /** Answer-first paragraph, 40–60 words: what is it and who is it for. */
      summary: z.string(),
      heroImage: image(),
      heroAlt: z.string(),
      bestFor: z.array(z.string()).default([]),
      materials: z.array(z.string()).default([]),
      /** Rows of the "Materials & options" table. */
      options: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
      lightingOptions: z.array(z.enum(LIGHTING)).default([]),
      environment: z.enum(['indoor', 'outdoor', 'both']).default('both'),
      /** 1 = lowest cost, 3 = highest. Leave out to hide. */
      relativeCost: z.number().int().min(1).max(3).optional(),
      typicalSizes: z.array(z.string()).default([]),
      turnaround: z.string().optional(),
      installationIncluded: z.boolean().optional(),
      /** Key in src/config/pricing.ts. */
      priceKey: z.string().optional(),
      customizerMode: z.enum(['flat-board', '3d-letters', 'led', 'neon']).optional(),
      faqs: z.array(faq).default([]),
      /** Slugs of related signage types. */
      related: z.array(z.string()).default([]),
      seo: z
        .object({
          title: z.string().max(60).optional(),
          description: z.string().max(155).optional(),
          keywords: z.array(z.string()).optional(),
        })
        .default({}),
      updated: z.coerce.date(),
      draft: z.boolean().default(false),
    }),
});

const portfolio = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/portfolio' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      /** Only with the client's permission. */
      client: z.string().optional(),
      /** Leave out for example designs. */
      city: z.string().optional(),
      date: z.coerce.date(),
      /** Signage type slugs. */
      types: z.array(z.string()).default([]),
      materials: z.array(z.string()).default([]),
      size: z.string().optional(),
      lighting: z.string().optional(),
      /** First image is the cover. */
      images: z.array(z.object({ src: image(), alt: z.string() })).min(1),
      featured: z.boolean().default(false),
      /** An example made with the sign designer, not a photo of a finished job. */
      example: z.boolean().default(false),
      summary: z.string(),
      draft: z.boolean().default(false),
    }),
});

const guides = defineCollection({
  loader: glob({ pattern: '*.{md,mdx}', base: './src/content/guides' }),
  schema: z.object({
    title: z.string().max(70),
    description: z.string().max(155),
    updated: z.coerce.date(),
    author: z.string().optional(),
    faqs: z.array(faq).default([]),
    relatedTypes: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const faqs = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/faqs' }),
  schema: z.object({
    q: z.string(),
    a: z.string(),
    topic: z.string().default('General'),
    order: z.number().default(100),
    /** Show on the home page. */
    home: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

/**
 * Services that are not signs (e.g. branded welcome kits). Each entry gets
 * its own page at /<file-name>/, so the file name must not clash with an
 * existing page such as "about" or "contact".
 */
const services = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/services' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      /** Short name for menus and cards. */
      navLabel: z.string(),
      order: z.number().default(100),
      shortDescription: z.string().max(160),
      /** Answer-first paragraph, 40–60 words. */
      summary: z.string(),
      heroImage: image().optional(),
      heroAlt: z.string().optional(),
      /** The things that can be included, each with a short note. */
      items: z.array(z.object({ name: z.string(), text: z.string() })).default([]),
      bestFor: z.array(z.string()).default([]),
      /** Steps from enquiry to delivery. */
      steps: z.array(z.object({ title: z.string(), text: z.string() })).default([]),
      /** Blanks in the pre-filled WhatsApp message, e.g. "Number of kits". */
      enquiryFields: z.array(z.string()).default([]),
      faqs: z.array(faq).default([]),
      seo: z
        .object({
          title: z.string().max(60).optional(),
          description: z.string().max(155).optional(),
        })
        .default({}),
      updated: z.coerce.date(),
      draft: z.boolean().default(false),
    }),
});

const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(155),
    updated: z.coerce.date().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { signageTypes, portfolio, guides, faqs, pages, services };
