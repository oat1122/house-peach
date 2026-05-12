import type { MetadataRoute } from 'next';

import { env } from '@/env';

/**
 * robots.txt for crawlers. Disallows admin + API routes, points to the
 * sitemap. Keep this in sync with `middleware.ts` — anything blocked there
 * for unauthenticated traffic should also be disallowed here so well-behaved
 * crawlers don't waste budget on 401/redirect responses.
 */
export default function robots(): MetadataRoute.Robots {
  const origin = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/api/'],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
