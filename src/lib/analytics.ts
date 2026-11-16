/**
 * Client-side event helper. Events go to GA4 when it is enabled; Cloudflare
 * Web Analytics has no custom events, so there they are a no-op. Every event
 * is also dispatched as a DOM event (`site:track`) so tests can observe it.
 */
export type TrackParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function track(event: string, params: TrackParams = {}): void {
  window.dispatchEvent(new CustomEvent('site:track', { detail: { event, params } }));
  window.gtag?.('event', event, params);
}
