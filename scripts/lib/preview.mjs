// Starts `astro preview` in the background for scripts and stops it again.
import { execFileSync } from 'node:child_process';

const astro = (...args) => execFileSync('pnpm', ['exec', 'astro', 'preview', ...args], { stdio: 'pipe' }).toString();

export async function startPreview(port = 4390) {
  try {
    astro('stop');
  } catch {
    /* nothing was running */
  }
  astro('--background', '--port', String(port));
  const url = `http://localhost:${port}`;
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(url)).ok) return { url, stop: () => astro('stop') };
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  astro('stop');
  throw new Error(`Preview server did not start on ${url}`);
}
