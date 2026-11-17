// Checks the built site in dist/: SEO basics, WhatsApp CTAs, JSON-LD and
// leftover placeholders.
//   node scripts/check-dist.mjs            report placeholders as warnings
//   node scripts/check-dist.mjs --strict   fail on placeholders or sample content (pre-launch gate)
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'node-html-parser';

const DIST = 'dist';
const strict = process.argv.includes('--strict');
const errors = [];
const warnings = [];
const placeholderHits = new Map();

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : path.endsWith('.html') ? [path] : [];
  });
}

const routeOf = (file) => '/' + relative(DIST, file).replace(/index\.html$/, '').replace(/\.html$/, '');

// JSON-LD rules: required properties per @type.
const REQUIRED = {
  LocalBusiness: ['@id', 'name', 'url', 'address', 'areaServed'],
  WebSite: ['name', 'url'],
  Service: ['name', 'serviceType', 'provider', 'areaServed'],
  BreadcrumbList: ['itemListElement'],
  FAQPage: ['mainEntity'],
  CreativeWork: ['name', 'image', 'url'],
  Article: ['headline', 'dateModified', 'author', 'publisher'],
};
const EXPECTED = [
  [/^\/signage\/[^/]+\/$/, ['Service', 'BreadcrumbList', 'FAQPage']],
  [/^\/portfolio\/[^/]+\/$/, ['CreativeWork', 'BreadcrumbList']],
  [/^\/guides\/[^/]+\/$/, ['Article', 'BreadcrumbList']],
  [/^\/faq\/$/, ['BreadcrumbList']],
];
const FORBIDDEN = ['aggregateRating', 'review', 'reviewRating', 'ratingValue'];

function checkNode(node, route) {
  const type = node['@type'];
  for (const key of REQUIRED[type] ?? []) {
    if (node[key] === undefined || node[key] === '' || (Array.isArray(node[key]) && !node[key].length)) {
      errors.push(`${route}: ${type} is missing "${key}"`);
    }
  }
  if (type === 'LocalBusiness') {
    const a = node.address ?? {};
    for (const key of ['addressLocality', 'addressRegion', 'addressCountry']) {
      if (!a[key]) errors.push(`${route}: LocalBusiness address is missing "${key}"`);
    }
  }
  if (type === 'BreadcrumbList') {
    node.itemListElement?.forEach((item, i) => {
      if (item.position !== i + 1 || !item.name || !/^https?:\/\//.test(item.item ?? '')) {
        errors.push(`${route}: breadcrumb ${i + 1} is malformed`);
      }
    });
  }
  if (type === 'FAQPage') {
    for (const q of node.mainEntity ?? []) {
      if (q['@type'] !== 'Question' || !q.name || !q.acceptedAnswer?.text) errors.push(`${route}: FAQ entry is malformed`);
    }
  }
  if (type === 'Service' && node.offers) {
    const min = node.offers.priceSpecification?.minPrice;
    if (typeof min !== 'number' || node.offers.priceSpecification?.priceCurrency !== 'PKR') {
      errors.push(`${route}: Service offer needs a numeric minPrice in PKR`);
    }
  }
  if (type === 'CreativeWork') {
    for (const img of node.image ?? []) {
      if (img['@type'] !== 'ImageObject' || !/^https?:\/\//.test(img.url ?? '')) errors.push(`${route}: CreativeWork image is malformed`);
    }
  }
}

function findForbidden(value, route) {
  if (Array.isArray(value)) return value.forEach((v) => findForbidden(v, route));
  if (value && typeof value === 'object') {
    for (const [key, v] of Object.entries(value)) {
      if (FORBIDDEN.includes(key)) errors.push(`${route}: JSON-LD must not contain "${key}"`);
      findForbidden(v, route);
    }
  }
}

const files = walk(DIST).filter((f) => !f.includes(`${DIST}/spike/`));
const titles = new Map();
let schemaNodes = 0;

for (const file of files) {
  const route = routeOf(file);
  const html = readFileSync(file, 'utf8');
  const root = parse(html);
  const is404 = route === '/404';

  // Head
  const title = root.querySelector('title')?.text.trim() ?? '';
  const description = root.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
  if (!title) errors.push(`${route}: missing <title>`);
  else if (title.length > 60) errors.push(`${route}: title is ${title.length} chars (max 60): "${title}"`);
  if (!description) errors.push(`${route}: missing meta description`);
  else if (description.length > 155) errors.push(`${route}: description is ${description.length} chars (max 155)`);
  if (!root.querySelector('link[rel="canonical"]')) errors.push(`${route}: missing canonical`);
  if (!root.querySelector('html')?.getAttribute('lang')) errors.push(`${route}: missing lang`);
  for (const prop of ['og:title', 'og:description', 'og:image', 'og:url']) {
    if (!root.querySelector(`meta[property="${prop}"]`)) errors.push(`${route}: missing ${prop}`);
  }
  // The social image must really exist in the build.
  const ogImage = root.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? '';
  if (ogImage && !existsSync(join(DIST, new URL(ogImage).pathname))) errors.push(`${route}: og:image file is missing (${new URL(ogImage).pathname})`);
  if (!is404) {
    if (titles.has(title)) errors.push(`${route}: duplicate title with ${titles.get(title)}`);
    titles.set(title, route);
  }

  // Structure
  const h1s = root.querySelectorAll('h1');
  if (h1s.length !== 1) errors.push(`${route}: has ${h1s.length} <h1> (must be 1)`);
  let last = 0;
  for (const h of root.querySelectorAll('h1,h2,h3,h4,h5,h6')) {
    const level = Number(h.tagName[1]);
    if (last && level > last + 1) errors.push(`${route}: heading jumps from h${last} to h${level} ("${h.text.trim().slice(0, 40)}")`);
    last = level;
  }
  for (const tag of ['main', 'footer']) if (!root.querySelector(tag)) errors.push(`${route}: missing <${tag}>`);
  for (const img of root.querySelectorAll('img')) {
    const src = img.getAttribute('src') ?? '';
    if (img.getAttribute('alt') === undefined) errors.push(`${route}: image without alt (${src})`);
    const inDialog = img.closest('dialog');
    if (!inDialog && (!img.getAttribute('width') || !img.getAttribute('height'))) errors.push(`${route}: image without width/height (${src})`);
  }

  // WhatsApp: at least one pre-filled link that names the page it came from.
  const wa = root.querySelectorAll('a[href^="https://wa.me/"]');
  if (!wa.length) errors.push(`${route}: no WhatsApp link`);
  for (const a of wa) {
    const href = a.getAttribute('href').replace(/&amp;/g, '&');
    const text = new URL(href).searchParams.get('text') ?? '';
    if (!text.includes('(From: http')) errors.push(`${route}: WhatsApp link is not pre-filled with the page URL`);
    if (!a.getAttribute('data-wa-location')) errors.push(`${route}: WhatsApp link without data-wa-location`);
  }

  // JSON-LD
  const types = [];
  for (const script of root.querySelectorAll('script[type="application/ld+json"]')) {
    let data;
    try {
      data = JSON.parse(script.text);
    } catch {
      errors.push(`${route}: JSON-LD does not parse`);
      continue;
    }
    if (data['@context'] !== 'https://schema.org') errors.push(`${route}: JSON-LD has wrong @context`);
    findForbidden(data, route);
    for (const node of data['@graph'] ?? [data]) {
      schemaNodes++;
      types.push(node['@type']);
      checkNode(node, route);
    }
  }
  for (const type of ['LocalBusiness', 'WebSite']) if (!types.includes(type)) errors.push(`${route}: missing ${type} JSON-LD`);
  for (const [pattern, expected] of EXPECTED) {
    if (pattern.test(route)) for (const type of expected) if (!types.includes(type)) errors.push(`${route}: missing ${type} JSON-LD`);
  }

  // Placeholders and sample content
  for (const match of html.matchAll(/\{\{[A-Z_]+\}\}|92X{6,}|0300-X{4,}/g)) {
    placeholderHits.set(match[0], (placeholderHits.get(match[0]) ?? 0) + 1);
  }
  if (/Preview build with sample content|SAMPLE IMAGE|Sample (project|answer|text|guide)/.test(html)) {
    (strict ? errors : warnings).push(`${route}: contains sample content`);
  }
}

for (const [token, count] of placeholderHits) {
  (strict ? errors : warnings).push(`placeholder ${token} appears ${count} times: fill it in src/config/site.ts`);
}

const sampleWarnings = warnings.filter((w) => w.includes('sample content'));
const otherWarnings = warnings.filter((w) => !w.includes('sample content'));
if (sampleWarnings.length) console.warn(`warning: ${sampleWarnings.length} pages contain sample content (preview build)`);
for (const w of otherWarnings) console.warn(`warning: ${w}`);
for (const e of errors) console.error(`error: ${e}`);
console.log(`\nChecked ${files.length} pages, ${schemaNodes} JSON-LD nodes: ${errors.length} errors, ${warnings.length} warnings.`);
process.exit(errors.length ? 1 : 0);
