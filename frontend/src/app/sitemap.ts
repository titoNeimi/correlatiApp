import type { MetadataRoute } from 'next'
import { apiFetch } from '@/lib/api'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://acadifyapp.com'

const staticRoutes: MetadataRoute.Sitemap = [
  {
    url: siteUrl,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 1,
  },
  {
    url: `${siteUrl}/carreras`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.9,
  },
  {
    url: `${siteUrl}/universidades`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  },
  {
    url: `${siteUrl}/sugerencias`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.4,
  },
]

async function fetchCarreraUrls(): Promise<MetadataRoute.Sitemap> {
  try {
    const res = await apiFetch('/degreeProgram?page=1&limit=500')
    if (!res.ok) return []
    const data = await res.json()
    return (data.data ?? []).map((p: { id: string; updated_at?: string }) => ({
      url: `${siteUrl}/carreras/${p.id}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch {
    return []
  }
}

async function fetchUniversidadUrls(): Promise<MetadataRoute.Sitemap> {
  try {
    const res = await apiFetch('/universities?page=1&limit=500')
    if (!res.ok) return []
    const data = await res.json()
    return (data.data ?? []).map((u: { id: string; updated_at?: string }) => ({
      url: `${siteUrl}/universidades/${u.id}`,
      lastModified: u.updated_at ? new Date(u.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [carreras, universidades] = await Promise.all([
    fetchCarreraUrls(),
    fetchUniversidadUrls(),
  ])
  return [...staticRoutes, ...carreras, ...universidades]
}
