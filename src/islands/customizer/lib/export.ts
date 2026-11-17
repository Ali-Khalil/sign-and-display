/** Client-side file helpers. Nothing here talks to a server. */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
}

export function downloadText(text: string, filename: string, type: string): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  downloadDataUrl(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

const readAsDataUrl = (file: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

/**
 * Reads an image file in the browser and scales it down so its longest side
 * is at most `maxSide`. SVGs are kept as they are.
 */
export async function readImage(file: File, maxSide: number, keepAlpha: boolean): Promise<{ src: string; width: number; height: number }> {
  if (!/^image\/(png|jpeg|svg\+xml|webp)$/.test(file.type)) throw new Error('Please choose a PNG, JPG or SVG image.');
  const original = await readAsDataUrl(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('That image could not be read.'));
    el.src = original;
  });
  const longest = Math.max(img.naturalWidth, img.naturalHeight) || maxSide;
  const k = Math.min(1, maxSide / longest);
  const width = Math.max(1, Math.round((img.naturalWidth || maxSide) * k));
  const height = Math.max(1, Math.round((img.naturalHeight || maxSide) * k));
  if (file.type === 'image/svg+xml') return { src: original, width, height };
  if (k === 1 && file.size < 400_000) return { src: original, width, height };

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
  return { src: keepAlpha ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.85), width, height };
}
