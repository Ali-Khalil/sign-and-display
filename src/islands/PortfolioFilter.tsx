import { useEffect, useState } from 'preact/hooks';

interface Props {
  types: { slug: string; title: string }[];
}

/**
 * Filter chips for the portfolio grid. The cards are plain server-rendered
 * HTML ([data-project] with data-types), so without JavaScript every project
 * is simply shown. Until the island is ready the chips are invisible but keep
 * their space, so nothing shifts when they appear; the page hides them
 * completely when JavaScript is off.
 */
export default function PortfolioFilter({ types }: Props) {
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState('all');

  useEffect(() => {
    const fromHash = decodeURIComponent(location.hash.slice(1));
    if (types.some((t) => t.slug === fromHash)) setActive(fromHash);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    let shown = 0;
    document.querySelectorAll<HTMLElement>('[data-project]').forEach((card) => {
      const match = active === 'all' || (card.dataset.types ?? '').split(' ').includes(active);
      const item = card.closest('li') ?? card;
      item.toggleAttribute('hidden', !match);
      if (match) shown++;
    });
    const status = document.getElementById('portfolio-count');
    if (status) status.textContent = `${shown} project${shown === 1 ? '' : 's'}`;
    history.replaceState(null, '', active === 'all' ? location.pathname : `#${active}`);
  }, [active, ready]);

  const chips = [{ slug: 'all', title: 'All' }, ...types];

  return (
    <div
      id="portfolio-filter"
      role="group"
      aria-label="Filter projects by sign type"
      class="flex flex-wrap gap-2"
      style={ready ? undefined : { visibility: 'hidden' }}
    >
      {chips.map((chip) => (
        <button
          type="button"
          aria-pressed={active === chip.slug}
          onClick={() => setActive(chip.slug)}
          class="min-h-11 rounded-full border border-line px-4 text-[0.95rem] font-medium aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-white"
        >
          {chip.title}
        </button>
      ))}
    </div>
  );
}
