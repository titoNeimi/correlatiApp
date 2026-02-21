import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  Compass,
  GraduationCap,
  LayoutDashboard,
  MapPinned,
  Sparkles,
  Users
} from 'lucide-react'
import { PageShell } from '@/components/layout/page-shell'

const onboardingSteps = [
  {
    title: 'Explora carreras',
    description: 'Encuentra un plan de estudio y revisa materias por ano.',
    href: '/carreras',
    cta: 'Ver carreras',
    icon: GraduationCap,
    tone: 'from-sky-50 via-white to-cyan-50',
    badge: 'bg-sky-100 text-sky-700'
  },
  {
    title: 'Guarda tus favoritas',
    description: 'Arma una lista corta para comparar opciones con calma.',
    href: '/mis-carreras',
    cta: 'Ir a mis carreras',
    icon: BookOpen,
    tone: 'from-amber-50 via-white to-orange-50',
    badge: 'bg-amber-100 text-amber-700'
  },
  {
    title: 'Empieza tu plan',
    description: 'Marca avance por materia y proyecta los proximos semestres.',
    href: '/mi-plan',
    cta: 'Abrir mi plan',
    icon: LayoutDashboard,
    tone: 'from-emerald-50 via-white to-teal-50',
    badge: 'bg-emerald-100 text-emerald-700'
  }
]

const quickLinks = [
  {
    title: 'Universidades',
    description: 'Filtra por ciudad, enfoque y tipo institucional.',
    href: '/universidades',
    icon: MapPinned
  },
  {
    title: 'Comunidad',
    description: 'Comparte sugerencias y ayudanos a mejorar el catalogo.',
    href: '/sugerencias',
    icon: Users
  }
]

export default function HomePage() {
  return (
    <PageShell>
      <section className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-100 shadow-xl p-6 sm:p-8 mb-10">
        <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
          <div>
            <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-3 py-1 rounded-full text-xs font-semibold tracking-wide">
              <Sparkles className="w-4 h-4" />
              Bienvenida
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 mt-4 leading-tight">
              Bienvenido a CorrelatiApp
            </h1>
            <p className="text-slate-600 mt-4 max-w-2xl text-base sm:text-lg">
              Tu espacio para entender la carrera que eliges, organizar materias y avanzar con un plan claro.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <Link
                href="/carreras"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                Empezar ahora
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Crear cuenta gratis
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium">
                <GraduationCap className="w-4 h-4" />
                500+ carreras
              </div>
              <div className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium">
                <Users className="w-4 h-4" />
                50+ universidades
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-amber-50 p-6">
            <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-sky-100/70 blur-xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-amber-100/70 blur-xl" />
            <div className="relative">
              <p className="text-sm uppercase tracking-wide text-slate-500">Si es tu primera vez</p>
              <h2 className="text-xl font-bold mt-3 text-slate-900">Empieza en menos de 5 minutos</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="rounded-xl border border-sky-100 bg-white/90 px-4 py-3">
                  <p className="text-slate-500 text-xs">Paso 1</p>
                  <p className="font-semibold text-slate-900">Busca una carrera en el catalogo</p>
                </div>
                <div className="rounded-xl border border-amber-100 bg-white/90 px-4 py-3">
                  <p className="text-slate-500 text-xs">Paso 2</p>
                  <p className="font-semibold text-slate-900">Revisa su estructura y correlativas</p>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-white/90 px-4 py-3">
                  <p className="text-slate-500 text-xs">Paso 3</p>
                  <p className="font-semibold text-slate-900">Carga tus materias y sigue tu avance</p>
                </div>
                <Link
                  href="/mi-plan"
                  className="block text-center bg-slate-900 text-white font-semibold py-3 rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Ir a mi plan
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <div className="flex items-center gap-2 mb-6 text-slate-900">
          <Compass className="w-5 h-5" />
          <h2 className="text-2xl sm:text-3xl font-bold">Como empezar</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {onboardingSteps.map((step) => (
            <article
              key={step.title}
              className={`rounded-2xl border border-slate-100 bg-gradient-to-br ${step.tone} p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
            >
              <div className={`inline-flex p-2 rounded-xl ${step.badge}`}>
                <step.icon className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-4">{step.title}</h3>
              <p className="text-slate-600 mt-2 text-sm leading-relaxed">{step.description}</p>
              <Link
                href={step.href}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-slate-700"
              >
                {step.cta}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 mb-10">
        {quickLinks.map((link) => (
          <article key={link.title} className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6">
            <div className="bg-slate-900 text-white inline-flex p-2 rounded-lg">
              <link.icon className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mt-4">{link.title}</h3>
            <p className="text-slate-600 mt-2 text-sm">{link.description}</p>
            <Link
              href={link.href}
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Abrir
              <ArrowRight className="w-4 h-4" />
            </Link>
          </article>
        ))}
      </section>

      <section className="bg-gradient-to-br from-amber-50 via-white to-sky-50 rounded-3xl border border-slate-200 p-6 sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Listo para arrancar tu recorrido academico</h2>
            <p className="text-slate-600 mt-2 max-w-2xl">
              Crea tu cuenta para guardar tu progreso y continuar desde cualquier dispositivo.
            </p>
          </div>
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            Crear cuenta
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </PageShell>
  )
}
