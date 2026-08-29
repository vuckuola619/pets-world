import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'

/** robots.txt for the static export (served from Cloudflare Pages) */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: 'https://pets-world.pages.dev/sitemap.xml',
  }
}
