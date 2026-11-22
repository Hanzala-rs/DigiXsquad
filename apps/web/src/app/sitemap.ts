import type { MetadataRoute } from 'next';
import { getSquads } from '@/lib/catalog';
import { siteUrl } from '@/lib/site-url';

const staticRoutes: { path: string; priority: number }[] = [
  { path: '', priority: 1 },
  { path: '/squads', priority: 0.9 },
  { path: '/roles', priority: 0.9 },
  { path: '/hire', priority: 0.9 },
  { path: '/government', priority: 0.8 },
  { path: '/private-sector', priority: 0.8 },
  { path: '/how-it-works', priority: 0.7 },
  { path: '/engagement-models', priority: 0.7 },
  { path: '/about', priority: 0.7 },
  { path: '/contact', priority: 0.6 },
  { path: '/privacy', priority: 0.2 },
  { path: '/terms', priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const squads = await getSquads();
  return [
    ...staticRoutes.map(({ path, priority }) => ({ url: `${siteUrl}${path}`, priority })),
    ...squads.map((s) => ({ url: `${siteUrl}/squads/${s.slug}`, priority: 0.8 })),
  ];
}
