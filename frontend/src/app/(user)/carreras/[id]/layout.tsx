import type { Metadata } from 'next'
import { apiFetch } from '@/lib/api'

type Props = {
  params: Promise<{ id: string }>
  children: React.ReactNode
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  try {
    const res = await apiFetch(`/degreeProgram/${id}`)
    if (!res.ok) return {}
    const program = await res.json()
    const university = program.university?.name ? ` en ${program.university.name}` : ''
    return {
      title: program.name,
      description: `Plan de estudios de ${program.name}${university}. Revisá materias, correlativas y organizá tu avance.`,
      openGraph: {
        title: program.name,
        description: `Plan de estudios de ${program.name}${university}.`,
      },
    }
  } catch {
    return {}
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
