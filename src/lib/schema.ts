/**
 * JSON-LD builders. Everything is generated from config and content; values
 * the owner has not supplied are left out, and no rating or review markup is
 * ever produced.
 */
import { hasGeo, isPlaceholder, site } from '../config/site';
import { getRate } from '../config/pricing';
import type { Guide, Project, Service, SignageType } from './content';

type Node = Record<string, unknown>;

export interface Crumb {
  name: string;
  href: string;
}
export interface QA {
  q: string;
  a: string;
}

const DAYS: Record<string, string> = {
  Mo: 'Monday',
  Tu: 'Tuesday',
  We: 'Wednesday',
  Th: 'Thursday',
  Fr: 'Friday',
  Sa: 'Saturday',
  Su: 'Sunday',
};
const DAY_ORDER = Object.keys(DAYS);

/** 'Mo-Sa 10:00-20:00' → OpeningHoursSpecification. */
export function parseOpeningHours(spec: string): Node | null {
  const match = /^([A-Za-z,-]+)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/.exec(spec.trim());
  if (!match) return null;
  const [, dayPart, opens, closes] = match;
  const days: string[] = [];
  for (const chunk of dayPart!.split(',')) {
    const [from, to] = chunk.split('-');
    const start = DAY_ORDER.indexOf(from!);
    const end = to ? DAY_ORDER.indexOf(to) : start;
    if (start < 0 || end < 0) return null;
    for (let i = start; i <= end; i++) days.push(DAYS[DAY_ORDER[i]!]!);
  }
  return { '@type': 'OpeningHoursSpecification', dayOfWeek: days, opens, closes };
}

export function absolute(path: string, base: URL | string): string {
  return new URL(path, base).href;
}

const businessId = (base: URL | string) => absolute('/#business', base);

/** The main cities, plus the whole country when orders are taken nationwide. */
function areaServed(): Node[] {
  const cities: Node[] = site.serviceAreas.map((name) => ({ '@type': 'City', name }));
  return site.nationwide ? [...cities, { '@type': 'Country', name: 'Pakistan' }] : cities;
}

export function localBusiness(base: URL | string): Node {
  const sameAs = [...Object.values(site.social), site.googleBusinessProfileUrl].filter((u) => u !== '');
  const hours = site.openingHours.map(parseOpeningHours).filter((h) => h !== null);
  const address: Node = {
    '@type': 'PostalAddress',
    addressLocality: site.address.city,
    addressRegion: site.address.region,
    addressCountry: site.address.country,
  };
  if (!isPlaceholder(site.address.street)) address.streetAddress = site.address.street;
  if (!isPlaceholder(site.address.postalCode)) address.postalCode = site.address.postalCode;

  const node: Node = {
    '@type': 'LocalBusiness',
    '@id': businessId(base),
    name: site.name,
    url: absolute('/', base),
    logo: absolute('/logo.png', base),
    image: absolute('/og-default.jpg', base),
    address,
    areaServed: areaServed(),
  };
  if (!isPlaceholder(site.nameUrdu)) node.alternateName = site.nameUrdu;
  if (!isPlaceholder(site.whatsapp)) node.telephone = `+${site.whatsapp}`;
  if (!isPlaceholder(site.email)) node.email = site.email;
  if (hasGeo) node.geo = { '@type': 'GeoCoordinates', latitude: site.geo.lat, longitude: site.geo.lng };
  if (hours.length) node.openingHoursSpecification = hours;
  if (sameAs.length) node.sameAs = sameAs;
  return node;
}

export function webSite(base: URL | string): Node {
  return {
    '@type': 'WebSite',
    '@id': absolute('/#website', base),
    name: site.name,
    url: absolute('/', base),
    inLanguage: 'en',
    publisher: { '@id': businessId(base) },
  };
}

export function breadcrumbList(crumbs: Crumb[], base: URL | string): Node {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: absolute(c.href, base),
    })),
  };
}

export function faqPage(items: QA[]): Node | null {
  if (!items.length) return null;
  return {
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

export function service(type: SignageType, pageUrl: string, base: URL | string): Node {
  const node: Node = {
    '@type': 'Service',
    name: type.data.title,
    serviceType: type.data.title,
    description: type.data.shortDescription,
    url: pageUrl,
    provider: { '@id': businessId(base) },
    areaServed: areaServed(),
  };
  const from = getRate(type.data.priceKey)?.startingFrom;
  if (typeof from === 'number') {
    node.offers = {
      '@type': 'Offer',
      priceSpecification: { '@type': 'PriceSpecification', minPrice: from, priceCurrency: 'PKR' },
    };
  }
  return node;
}

/** Service node for a non-sign service page. No price is given. */
export function otherService(service: Service, pageUrl: string, base: URL | string): Node {
  return {
    '@type': 'Service',
    name: service.data.title,
    serviceType: service.data.title,
    description: service.data.shortDescription,
    url: pageUrl,
    provider: { '@id': businessId(base) },
    areaServed: areaServed(),
  };
}

export function creativeWork(project: Project, pageUrl: string, imageUrls: string[], base: URL | string): Node {
  return {
    '@type': 'CreativeWork',
    name: project.data.title,
    description: project.data.summary,
    url: pageUrl,
    dateCreated: project.data.date.toISOString().slice(0, 10),
    locationCreated: { '@type': 'City', name: project.data.city },
    creator: { '@id': businessId(base) },
    image: project.data.images.map((img, i) => ({
      '@type': 'ImageObject',
      url: absolute(imageUrls[i] ?? '', base),
      caption: img.alt,
    })),
  };
}

export function article(guide: Guide, pageUrl: string, base: URL | string): Node {
  const author = guide.data.author
    ? { '@type': 'Person', name: guide.data.author }
    : { '@id': businessId(base) };
  return {
    '@type': 'Article',
    headline: guide.data.title,
    description: guide.data.description,
    url: pageUrl,
    dateModified: guide.data.updated.toISOString().slice(0, 10),
    author,
    publisher: { '@id': businessId(base) },
    image: absolute('/og-default.jpg', base),
  };
}

export function graph(nodes: (Node | null | undefined)[]): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes.filter(Boolean) });
}
