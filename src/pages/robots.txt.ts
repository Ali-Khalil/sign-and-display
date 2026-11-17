import type { APIRoute } from 'astro';
import { site } from '../config/site';

/** Allows everything; AI crawlers are named explicitly (see site.ts). */
export const GET: APIRoute = ({ site: base }) => {
  const lines = ['User-agent: *', 'Allow: /', 'Disallow: /spike/', ''];
  for (const bot of site.aiCrawlers) {
    lines.push(`User-agent: ${bot}`, site.allowAiCrawlers ? 'Allow: /' : 'Disallow: /', '');
  }
  lines.push(`Sitemap: ${new URL('/sitemap-index.xml', base).href}`, '');
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
