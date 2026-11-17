import { getCollection, type CollectionEntry } from 'astro:content';

/**
 * Drafts (sample content) are shown in `pnpm dev` and when SHOW_DRAFTS=true
 * (`pnpm build:preview`). The production build never includes them.
 */
export const showDrafts = import.meta.env.DEV || process.env.SHOW_DRAFTS === 'true';

const visible = <T extends { data: { draft: boolean } }>(entry: T) => showDrafts || !entry.data.draft;

export type SignageType = CollectionEntry<'signageTypes'>;
export type Project = CollectionEntry<'portfolio'>;
export type Guide = CollectionEntry<'guides'>;
export type Faq = CollectionEntry<'faqs'>;
export type Service = CollectionEntry<'services'>;

export async function getTypes(): Promise<SignageType[]> {
  const all = await getCollection('signageTypes', visible);
  return all.sort((a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title));
}

export async function getProjects(): Promise<Project[]> {
  const all = await getCollection('portfolio', visible);
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export async function getGuides(): Promise<Guide[]> {
  const all = await getCollection('guides', visible);
  return all.sort((a, b) => b.data.updated.getTime() - a.data.updated.getTime());
}

export async function getFaqs(): Promise<Faq[]> {
  const all = await getCollection('faqs', visible);
  return all.sort((a, b) => a.data.order - b.data.order);
}

export async function getServices(): Promise<Service[]> {
  const all = await getCollection('services', visible);
  return all.sort((a, b) => a.data.order - b.data.order);
}

export async function getPage(id: string): Promise<CollectionEntry<'pages'> | undefined> {
  const all = await getCollection('pages', visible);
  return all.find((p) => p.id === id);
}

/** True when the build contains any sample (draft) content. */
export async function hasSampleContent(): Promise<boolean> {
  if (!showDrafts) return false;
  const lists = await Promise.all([
    getCollection('signageTypes'),
    getCollection('portfolio'),
    getCollection('guides'),
    getCollection('faqs'),
    getCollection('pages'),
    getCollection('services'),
  ]);
  return lists.some((list) => list.some((e) => e.data.draft));
}

export const LIGHTING_LABELS: Record<string, string> = {
  none: 'Non-lit',
  'front-lit': 'Front-lit',
  backlit: 'Backlit',
  'halo-lit': 'Halo-lit',
  neon: 'Neon',
};

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}
