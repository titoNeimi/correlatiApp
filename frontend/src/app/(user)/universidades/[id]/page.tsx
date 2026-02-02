'use client'
import React, { useEffect, useState } from 'react'
import { ArrowRight, Building2, Globe, GraduationCap, MapPin, Sparkles } from 'lucide-react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { apiFetch, getApiErrorMessage } from '@/lib/api'
import { ClientPageShell } from '@/components/layout/client-page-shell'
import { LoadingState } from '@/components/ui/loading-state'

const universityHighlightPool: Array<{ tone: string }> = [
  { tone: 'from-blue-50 via-white to-indigo-50' },
  { tone: 'from-amber-50 via-white to-orange-50' },
  { tone: 'from-emerald-50 via-white to-green-50' },
  { tone: 'from-sky-50 via-white to-cyan-50' },
  { tone: 'from-purple-50 via-white to-fuchsia-50' },
  { tone: 'from-rose-50 via-white to-pink-50' },
  { tone: 'from-slate-50 via-white to-gray-50' },
  { tone: 'from-lime-50 via-white to-emerald-50' }
]

const getUniversityHighlight = (id: string) => {
  const hash = Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return universityHighlightPool[hash % universityHighlightPool.length]
}

const getInstitutionLabel = (value?: string) => {
  if (value === 'public') return 'Publica'
  if (value === 'private') return 'Privada'
  if (value === 'mixed') return 'Mixta'
  return 'Pendiente'
}

const formatDate = (value?: string) => {
  if (!value) return 'Pendiente'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Pendiente'
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(parsed)
}

export default function UniversityDetailPage() {
  const params = useParams<{ id: string }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id

  const [loading, setLoading] = useState<boolean>(true)
  const [university, setUniversity] = useState<University | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notFoundState, setNotFoundState] = useState<boolean>(false)

  useEffect(() => {
    if (!id) {
      setError('No se encontro el id de la universidad.')
      setLoading(false)
      return
    }

    const fetchUniversity = async () => {
      try {
        const response = await apiFetch(`/universities/${id}`)
        if (response.status === 404) {
          setNotFoundState(true)
          return
        }
        if (!response.ok) {
          setError('Fallo el fetch')
          return
        }
        const data = await response.json()
        setUniversity(data)
      } catch (error) {
        setError(getApiErrorMessage(error, 'No se pudo hacer el fetch'))
      } finally {
        setLoading(false)
      }
    }
    fetchUniversity()
  }, [id])

  if (loading) {
    return (
      <ClientPageShell mainClassName="max-w-3xl py-12">
        <LoadingState title="Cargando universidad" description="Buscando la informacion mas reciente." />
      </ClientPageShell>
    )
  }

  if (notFoundState) {
    return (
      <ClientPageShell mainClassName="max-w-3xl py-12">
        <h2 className="text-2xl text-slate-900">Universidad no encontrada.</h2>
      </ClientPageShell>
    )
  }

  if (!university || error) {
    return (
      <ClientPageShell mainClassName="max-w-3xl py-12">
        <h2 className="text-2xl text-slate-900">{error ?? 'No se pudo cargar la universidad.'}</h2>
      </ClientPageShell>
    )
  }

  const highlight = getUniversityHighlight(university.id)
  const programs = university.degreePrograms ?? []
  const focusTags = (university.focus_tags ?? []).map((tag) => tag.tag).filter(Boolean)
  const quickLinks =
    university.quick_links && university.quick_links.length > 0
      ? university.quick_links
      : university.website
        ? [{ label: 'Sitio oficial', url: university.website }]
        : []
  const additionalInfo = university.additional_information ?? []

  return (
    <ClientPageShell mainClassName="max-w-6xl py-10">
        <section className={`rounded-3xl border border-slate-100 shadow-xl p-6 sm:p-8 bg-gradient-to-br ${highlight.tone}`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-3 py-1 rounded-full text-xs font-semibold tracking-wide">
                <Sparkles className="w-4 h-4" />
                Perfil universitario
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-4">{university.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mt-3">
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {university.location ?? 'Ubicacion pendiente'}
                </span>
                <span className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  {getInstitutionLabel(university.institution_type)}
                </span>
              </div>
              <p className="text-slate-600 mt-4 max-w-2xl">
                {university.summary?.trim() || 'Sin resumen disponible.'}
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                {university.website ? (
                  <a
                    href={university.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    Ir al sitio oficial
                  </a>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-500">
                    <Globe className="w-4 h-4" />
                    Sitio oficial pendiente
                  </div>
                )}
              </div>
            </div>
            <div className="bg-white/80 rounded-2xl border border-white/70 shadow-lg p-5 min-w-[240px]">
              <p className="text-xs uppercase tracking-wide text-slate-500">Carreras disponibles</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{programs.length}</p>
              <p className="text-sm text-slate-600 mt-2">Programas activos en el catalogo.</p>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                <GraduationCap className="w-4 h-4" />
                Ultima actualizacion: {formatDate(university.updated_at)}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] mt-10">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Carreras y programas</h2>
                <p className="text-slate-600">Todas las carreras asociadas a esta universidad.</p>
              </div>
              <div className="text-sm text-slate-500 bg-slate-100 px-3 py-2 rounded-xl">
                Orden actual: Popularidad
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {programs.map((program) => (
                <div key={program.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-5 sm:p-6 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">{program.name}</h3>
                      <p className="text-sm text-slate-500 mt-2">Plan actualizado {formatDate(program.updated_at)}</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-700 bg-white px-3 py-1 rounded-full border border-slate-200">
                      Activa
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <Link href={`/carreras/${program.id}`} className="inline-flex items-center gap-1 text-slate-900 font-semibold hover:text-slate-700 transition-colors">
                      Ver plan
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-slate-900">Enfoque academico</h3>
              <p className="text-slate-600 mt-2">{university.primary_focus ?? 'Pendiente'}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {focusTags.length === 0 ? (
                  <span className="text-xs text-slate-500">Sin tags cargados.</span>
                ) : (
                  focusTags.map((tag) => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                      {tag}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-slate-900">Accesos rapidos</h3>
              {quickLinks.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">No hay accesos rapidos disponibles.</p>
              ) : (
                <div className="mt-4 space-y-3 text-sm">
                  {quickLinks.map((link) => (
                    <a
                      key={link.id ?? link.url}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 hover:border-slate-300 transition-colors"
                    >
                      {link.label}
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-700 text-white rounded-2xl p-6">
              <h3 className="text-lg font-semibold">Informacion adicional</h3>
              {additionalInfo.length === 0 ? (
                <p className="text-slate-200 text-sm mt-2">No hay informacion adicional disponible.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {additionalInfo.map((card) => (
                    <div key={card.id ?? card.title} className="bg-white/10 rounded-xl px-4 py-3">
                      <p className="text-sm font-semibold">{card.title}</p>
                      {card.description && <p className="text-xs text-white/70">{card.description}</p>}
                      {card.status && <span className="text-xs font-semibold text-white/80">{card.status}</span>}
                      {card.url && (
                        <a
                          href={card.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-white underline underline-offset-2"
                        >
                          Ver mas
                          <ArrowRight className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </section>
      </ClientPageShell>
  )
}
