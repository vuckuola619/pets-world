import type { MetadataRoute } from 'next'
import { atlasProfiles } from '../data/atlasProfiles'

export const dynamic = 'force-static'

const BASE_URL = 'https://pets-world.pages.dev'

/** Covers every statically generated species profile plus the main routes */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/quiz`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/about`, changeFrequency: 'yearly', priority: 0.3 },
  ]
  const profileRoutes: MetadataRoute.Sitemap = atlasProfiles.map((profile) => ({
    url: `${BASE_URL}/animal/${profile.slug}`,
    lastModified: new Date(profile.updatedAt),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))
  return [...staticRoutes, ...profileRoutes]
}
