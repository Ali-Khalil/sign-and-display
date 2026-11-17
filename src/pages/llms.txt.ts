import type { APIRoute } from 'astro';
import { isPlaceholder, site } from '../config/site';
import { getGuides, getServices, getTypes } from '../lib/content';
import { hoursText } from '../lib/hours';

/** Short markdown summary of the business for AI answer engines. */
export const GET: APIRoute = async ({ site: base }) => {
  const url = (path: string) => new URL(path, base).href;
  const types = await getTypes();
  const guides = await getGuides();
  const services = await getServices();
  const { city, region } = site.address;

  const contact = [
    !isPlaceholder(site.whatsapp) && `- WhatsApp / phone: +${site.whatsapp}`,
    !isPlaceholder(site.email) && `- Email: ${site.email}`,
    !isPlaceholder(site.address.street) && `- Address: ${site.address.street}, ${city}, ${region}, Pakistan`,
    `- Opening hours: ${hoursText().join(', ')}`,
    `- Contact page: ${url('/contact/')}`,
  ].filter(Boolean);

  const lines = [
    `# ${isPlaceholder(site.name) ? `Signboard workshop in ${city}` : site.name}`,
    '',
    `> Signboard workshop in ${city}, ${region}, Pakistan. Makes 2D and 3D signboards, LED-illuminated signs, neon signs and nameplates. Orders and quotes are handled on WhatsApp; there is no online checkout.`,
    '',
    `Main service areas: ${site.serviceAreas.join(', ')}.${site.nationwide ? ' Orders are also taken from anywhere in Pakistan.' : ''}`,
    '',
    '## Contact',
    ...contact,
    '',
    '## Signage types',
    ...(types.length
      ? types.map((t) => `- [${t.data.title}](${url(`/signage/${t.id}/`)}): ${t.data.shortDescription}`)
      : [`- [All signage types](${url('/signage/')})`]),
    ...(services.length ? ['', '## Other services', ...services.map((s) => `- [${s.data.title}](${url(`/${s.id}/`)}): ${s.data.shortDescription}`)] : []),
    '',
    '## Key pages',
    `- [All signage types](${url('/signage/')})`,
    `- [Portfolio](${url('/portfolio/')})`,
    `- [FAQ](${url('/faq/')})`,
    `- [About](${url('/about/')})`,
    ...(guides.length ? ['', '## Guides', ...guides.map((g) => `- [${g.data.title}](${url(`/guides/${g.id}/`)}): ${g.data.description}`)] : []),
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
