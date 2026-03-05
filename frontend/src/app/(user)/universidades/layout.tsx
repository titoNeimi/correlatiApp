import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Universidades',
  description: 'Explorá el directorio de universidades. Filtrá por ciudad, enfoque y tipo institucional.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
