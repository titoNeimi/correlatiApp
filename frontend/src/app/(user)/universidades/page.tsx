'use client'
import React, { useEffect, useState } from 'react'
import { Building2, Filter, Globe, GraduationCap, MapPin, Search, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { apiFetchJson, getApiErrorMessage } from '@/lib/api'
import { ClientPageShell } from '@/components/layout/client-page-shell'
import { LoadingState } from '@/components/ui/loading-state'

type UniversityResponse = {
  data: University[],
  count: number,
  page?: number,
  limit?: number,
}

const getInstitutionLabel = (value?: University['institution_type']) => {
  if (value === 'public') return 'Publica'
  if (value === 'private') return 'Privada'
  if (value === 'mixed') return 'Mixta'
  return 'Pendiente'
}

const getInstitutionStyles = (value?: University['institution_type']) => {
  if (value === 'public') {
    return {
      accent: 'from-blue-50 via-white to-indigo-50',
      badge: 'bg-blue-100 text-blue-700',
    }
  }
  if (value === 'private') {
    return {
      accent: 'from-rose-50 via-white to-pink-50',
      badge: 'bg-rose-100 text-rose-700',
    }
  }
  if (value === 'mixed') {
    return {
      accent: 'from-emerald-50 via-white to-cyan-50',
      badge: 'bg-emerald-100 text-emerald-700',
    }
  }
  return {
    accent: 'from-slate-50 via-white to-gray-50',
    badge: 'bg-slate-200 text-slate-700',
  }
}

export default function UniversitiesPage() {
  const [loading, setLoading] = useState<boolean>(true)
  const [universities, setUniversities] = useState<University[]>([])
  const [error, setError] = useState<string | null>(null)
  const [totalPrograms, setTotalPrograms] = useState<number>(0)
  const [uniqueLocations, setUniqueLocations] = useState<number>(0)
  const [page, setPage] = useState<number>(1)
  const [totalCount, setTotalCount] = useState<number>(0)
  const limit = 12

  useEffect(() => {
    const totalPrograms = universities.reduce((total, university) => total + (university.degreePrograms?.length ?? 0), 0)
    const uniqueLocations = Array.from(new Set(universities.map((university) => university.location).filter(Boolean))).length
    setTotalPrograms(totalPrograms)
    setUniqueLocations(uniqueLocations)
  }, [universities])

  const locationFilters = Array.from(
    new Set(universities.map((university) => university.location?.trim()).filter(Boolean) as string[])
  ).slice(0, 8)
  const focusFilters = Array.from(
    new Set(
      universities.flatMap((university) => (university.focus_tags ?? []).map((tag) => tag.tag.trim()).filter(Boolean))
    )
  ).slice(0, 10)
  const serviceFilters = Array.from(
    new Set(
      universities.flatMap((university) =>
        (university.additional_information ?? []).map((info) => info.title.trim()).filter(Boolean)
      )
    )
  ).slice(0, 8)


  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        setLoading(true)
        setError(null)
        const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() })
        const data = await apiFetchJson<UniversityResponse>(`/universities?${params.toString()}`)
        setUniversities(data.data)
        setTotalCount(typeof data.count === 'number' ? data.count : data.data.length)
      } catch (error) {
        setError(getApiErrorMessage(error, "No se pudo realizar el fetch"))
      } finally{
        setLoading(false)
      }
    }
    fetchUniversities()
  }, [page, limit])

  const totalPages = totalCount ? Math.max(1, Math.ceil(totalCount / limit)) : 1

  if (loading){
    return (
      <ClientPageShell mainClassName="max-w-3xl py-12">
        <LoadingState title="Cargando universidades" description="Preparando el directorio academico." />
      </ClientPageShell>
    )
  }
  if (!loading && error){
    return (
      <ClientPageShell mainClassName="max-w-3xl py-12">
        <h1 className="text-2xl text-slate-900">{error}</h1>
      </ClientPageShell>
    )
  }

  return (
    <ClientPageShell>
      <section className="mb-10">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] p-6 sm:p-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-3 py-1 rounded-full text-xs font-semibold tracking-wide">
                <Sparkles className="w-4 h-4" />
                Directorio academico
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-4">
                Encuentra la universidad ideal para tu camino
              </h1>
              <p className="text-slate-600 mt-3 leading-relaxed">
                Explora instituciones y prepara tu proximo paso.
                El directorio ahora incluye tipo institucional, enfoque y recursos destacados.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium">
                  <GraduationCap className="w-4 h-4" />
                  {totalCount || universities.length} universidades activas
                </div>
                <div className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium">
                  <Building2 className="w-4 h-4" />
                  {totalPrograms} carreras destacadas
                </div>
                <div className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium">
                  <MapPin className="w-4 h-4" />
                  {uniqueLocations} ciudades
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-700 text-white rounded-2xl p-6">
              <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-slate-200">
                <Filter className="w-4 h-4" />
                Busqueda rapida
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
                  <Search className="w-4 h-4 text-white/70" />
                  <input
                    type="text"
                    placeholder="Buscar universidad, ciudad o carrera"
                    className="bg-transparent text-sm text-white placeholder:text-white/60 outline-none flex-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white/10 rounded-xl px-4 py-3">
                    <p className="text-white/70 text-xs">Tipo</p>
                    <p className="font-semibold">{Array.from(new Set(universities.map((u) => getInstitutionLabel(u.institution_type)))).length} tipos</p>
                  </div>
                  <div className="bg-white/10 rounded-xl px-4 py-3">
                    <p className="text-white/70 text-xs">Enfoques</p>
                    <p className="font-semibold">{focusFilters.length || 'Sin datos'}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl px-4 py-3">
                    <p className="text-white/70 text-xs">Recursos</p>
                    <p className="font-semibold">{serviceFilters.length || 'Sin datos'}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl px-4 py-3">
                    <p className="text-white/70 text-xs">Sitios web</p>
                    <p className="font-semibold">{universities.filter((u) => Boolean(u.website)).length}</p>
                  </div>
                </div>
                <button className="w-full bg-white text-slate-900 font-semibold py-3 rounded-xl hover:bg-slate-100 transition-colors">
                  Ver universidades
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-center gap-3 pb-6">
        <button
          type="button"
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          disabled={page <= 1}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:border-slate-100 disabled:text-slate-400 disabled:hover:bg-transparent transition-colors"
        >
          Anterior
        </button>
        <span className="text-sm text-slate-600">
          Pagina {page} de {totalPages}
        </span>
        <button
          type="button"
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={page >= totalPages}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:border-slate-100 disabled:text-slate-400 disabled:hover:bg-transparent transition-colors"
        >
          Siguiente
        </button>
      </div>

        <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6 h-fit">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Filtros visibles</h2>
            <div className="space-y-5 text-sm">
              <div>
                <p className="text-slate-500 mb-2">Ubicacion</p>
                <div className="flex flex-wrap gap-2">
                  {(locationFilters.length > 0 ? locationFilters : ['Sin ubicaciones']).map((region) => (
                    <span key={region} className="px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                      {region}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-slate-500 mb-2">Tipo de institucion</p>
                <div className="space-y-2">
                  {(['public', 'private', 'mixed'] as const).map((type) => (
                    <div key={type} className="flex items-center justify-between text-slate-700">
                      <span>{getInstitutionLabel(type)}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                        {universities.filter((university) => university.institution_type === type).length}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-slate-500 mb-2">Enfoque academico</p>
                <div className="flex flex-wrap gap-2">
                  {(focusFilters.length > 0 ? focusFilters : ['Sin enfoque']).map((focus) => (
                    <span key={focus} className="px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                      {focus}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-slate-500 mb-2">Servicios</p>
                <div className="space-y-2">
                  {(serviceFilters.length > 0 ? serviceFilters : ['Sin recursos']).map((service) => (
                    <label key={service} className="flex items-center gap-2 text-slate-700">
                      <input type="checkbox" checked readOnly className="rounded border-slate-300" />
                      {service}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Universidades destacadas</h2>
                <p className="text-slate-600">Explora la oferta academica y sus fortalezas principales.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600">
                  Ordenar por: Popularidad
                </div>
                <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold">
                  Ver mapa
                </button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {universities.map((university) => {
                const style = getInstitutionStyles(university.institution_type)
                const focusSummary =
                  university.primary_focus?.trim() ||
                  (university.focus_tags ?? []).map((tag) => tag.tag).filter(Boolean).slice(0, 2).join(' · ') ||
                  'Sin enfoque especificado'
                return (
                  <article
                    key={university.id}
                    className={`bg-gradient-to-br ${style.accent} rounded-2xl border border-slate-100 shadow-lg p-6 hover:shadow-xl transition-all`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${style.badge}`}>
                          {getInstitutionLabel(university.institution_type)}
                        </span>
                        <h3 className="text-xl font-bold text-slate-900 mt-3">{university.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-slate-600 mt-2">
                          <MapPin className="w-4 h-4" />
                          {university.location ?? 'Ubicacion pendiente'}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                          <Globe className="w-4 h-4" />
                          {university.website ?? 'Sitio pendiente'}
                        </div>
                      </div>
                      <div className="bg-white/80 rounded-xl px-3 py-2 text-center shadow-sm">
                        <p className="text-xs text-slate-500">Carreras</p>
                        <p className="text-lg font-bold text-slate-900">{university.degreePrograms?.length ?? 0}</p>
                      </div>
                    </div>

                    <div className="mt-4 bg-white/70 rounded-xl p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Enfoque</p>
                      <p className="text-sm text-slate-700 font-medium">{focusSummary}</p>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-semibold text-slate-800 mb-2">Carreras destacadas</p>
                      <div className="flex flex-wrap gap-2">
                        {(university.degreePrograms ?? []).slice(0, 3).map((program) => (
                          <span key={program.id} className="px-3 py-1 rounded-full bg-white/80 text-slate-700 text-xs">
                            {program.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <GraduationCap className="w-4 h-4" />
                        <span>Admisiones abiertas</span>
                      </div>
                      <Link href={`/universidades/${university.id}`} className="text-sm font-semibold text-slate-900 hover:text-slate-700 transition-colors">
                        Ver perfil →
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="bg-slate-900 text-white rounded-3xl p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-2xl font-bold">Suma tu universidad favorita</h3>
                  <p className="text-slate-200 mt-2 max-w-2xl">
                    Construimos este directorio con aportes de estudiantes. Sugiere una institucion y la incorporamos.
                  </p>
                </div>
                <Link prefetch={false} href={"/sugerencias?formulario=universidad"} className="bg-white text-slate-900 px-6 py-3 rounded-xl font-semibold hover:bg-slate-100 transition-colors">
                  Sugerir universidad
                </Link>
              </div>
            </div>
          </div>
        </section>
      </ClientPageShell>
  )
}
