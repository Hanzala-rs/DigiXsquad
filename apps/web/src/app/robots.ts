import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  // Only production is indexable; staging/dev builds ask crawlers to stay out.
  const indexable = process.env.APP_ENV === 'production';
  return {
    rules: indexable
      ? { userAgent: '*', allow: '/', disallow: ['/admin', '/track'] }
      : { userAgent: '*', disallow: '/' },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
