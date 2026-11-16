import { site } from '../config/site';

const DAY_NAMES: Record<string, string> = {
  Mo: 'Mon',
  Tu: 'Tue',
  We: 'Wed',
  Th: 'Thu',
  Fr: 'Fri',
  Sa: 'Sat',
  Su: 'Sun',
};

function to12h(time: string): string {
  const [h = 0, m = 0] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour}${suffix}` : `${hour}:${String(m).padStart(2, '0')}${suffix}`;
}

/** 'Mo-Sa 10:00-20:00' → 'Mon–Sat 10am–8pm' */
export function hoursText(): string[] {
  return site.openingHours.map((spec) => {
    const [days = '', times = ''] = spec.split(/\s+/);
    const dayText = days.replace(/[A-Z][a-z]/g, (d) => DAY_NAMES[d] ?? d).replace(/-/g, '–');
    const [open, close] = times.split('-');
    return open && close ? `${dayText} ${to12h(open)}–${to12h(close)}` : spec;
  });
}
