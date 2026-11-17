import type { APIRoute, GetStaticPaths } from 'astro';
import { ogEntries, renderOgImage } from '../../lib/og';

export const getStaticPaths: GetStaticPaths = async () =>
  [...(await ogEntries())].map(([slug, title]) => ({ params: { slug }, props: { title } }));

export const GET: APIRoute = async ({ props }) =>
  new Response(new Uint8Array(await renderOgImage(props.title as string)), {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
