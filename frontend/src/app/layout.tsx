import type { Metadata } from "next";
import './globals.css'
import { UserProvider } from '@/context/UserContext'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://acadifyapp.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'AcadifyApp',
    template: '%s | AcadifyApp',
  },
  description: 'Explorá carreras universitarias, revisá correlativas y planificá tu avance materia por materia.',
  keywords: ['carreras universitarias', 'correlativas', 'plan de estudios', 'materias', 'universidades'],
  authors: [{ name: 'AcadifyApp' }],
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: 'AcadifyApp',
    title: 'AcadifyApp',
    description: 'Explorá carreras universitarias, revisá correlativas y planificá tu avance materia por materia.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AcadifyApp',
    description: 'Explorá carreras universitarias, revisá correlativas y planificá tu avance materia por materia.',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
      <UserProvider>
        {children}
      </UserProvider>
      </body>
    </html>
  );
}
