// Lists the business facts the owner still has to supply.
//   node scripts/placeholders.mjs
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const todo = [];

const siteSrc = read('src/config/site.ts').split('export const site')[1] ?? '';
for (const m of siteSrc.matchAll(/(\w+):\s*'([^']*)'/g)) {
  const [, key, value] = m;
  if (value === '' || value.includes('{{') || /X{4,}/.test(value)) todo.push(`site.ts  ${key}: ${value || '(empty)'}`);
}
if (/geo:\s*\{\s*lat:\s*0,\s*lng:\s*0/.test(siteSrc)) todo.push('site.ts  geo: map coordinates not set');
if (/whyUs:\s*\[\]/.test(siteSrc)) todo.push('site.ts  whyUs: no "why us" points (section hidden)');

const nullPrices = (read('src/config/pricing.ts').match(/const empty[^;]+;/)?.[0].match(/null/g) ?? []).length;
if (nullPrices) todo.push('pricing.ts  all rates are empty (prices hidden)');
if (/cloudflareToken:\s*''/.test(read('src/config/analytics.ts'))) todo.push('analytics.ts  cloudflareToken: (empty, no analytics)');
if (read('src/styles/global.css').includes('{{BRAND}}')) todo.push('global.css  {{BRAND}} colours and display font');

console.log(todo.length ? `Still to be supplied by the owner (${todo.length}):\n` + todo.map((t) => '  - ' + t).join('\n') : 'No placeholders left.');
