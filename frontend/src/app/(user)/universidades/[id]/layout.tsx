import type { Metadata } from 'next'
import { apiFetch } from '@/lib/api'

type Props = {
  params: Promise<{ id: string }>
  children: React.ReactNode
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  try {
    const res = await apiFetch(`/universities/${id}`)
    if (!res.ok) return {}
    const university = await res.json()
    const location = university.location ? ` — ${university.location}` : ''
    return {
      title: university.name,
      description: `${university.name}${location}. Explorá sus carreras, plan de estudios y recursos disponibles.`,
      openGraph: {
        title: university.name,
        description: `${university.name}${location}. Explorá carreras y recursos disponibles.`,
      },
    }
  } catch {
    return {}
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
