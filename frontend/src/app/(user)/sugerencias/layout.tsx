import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sugerencias',
  description: 'Enviá sugerencias para mejorar el catálogo: nuevas universidades, carreras, o reportes de errores.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
