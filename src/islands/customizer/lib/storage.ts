import { parseDesign, type Design } from './design';

const KEY = 'signDesigner.v1';

/** Autosave. localStorage can be missing, full or blocked, so nothing here may throw. */
export function saveDesign(design: Design): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(design));
  } catch {
    // Usually the quota: an uploaded photo is the big part, so retry without it.
    try {
      const light: Design = design.background.kind === 'upload' ? { ...design, background: { kind: 'preset', id: 'dark-wall' } } : design;
      localStorage.setItem(KEY, JSON.stringify({ ...light, layers: light.layers.filter((l) => l.type === 'text') }));
    } catch {
      /* give up quietly */
    }
  }
}

export function loadDesign(): Design | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? parseDesign(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function clearDesign(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
