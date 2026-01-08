'use client'
import React, { useEffect, useState } from 'react'
import { Building2, Filter, Globe, GraduationCap, MapPin, Search, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { apiFetchJson, getApiErrorMessage } from '@/lib/api'

type UniversityResponse = {
  data: University[],
  count: number,
}

// Placeholder metadata until these fields exist in backend/domain.
const universityMetaPool: Array<{ accent: string; badge: string; focus: string; type: string }> = [
  {
    accent: 'from-blue-50 via-white to-indigo-50',
    badge: 'bg-blue-100 text-blue-700',
    focus: 'Investigacion y extension',
    type: 'Publica'
  },
  {
    accent: 'from-amber-50 via-white to-orange-50',
    badge: 'bg-amber-100 text-amber-700',
    focus: 'Ingenieria aplicada',
    type: 'Publica'
  },
  {
    accent: 'from-emerald-50 via-white to-green-50',
    badge: 'bg-emerald-100 text-emerald-700',
    focus: 'Salud y ciencias',
    type: 'Publica'
  },
  {
    accent: 'from-sky-50 via-white to-cyan-50',
    badge: 'bg-sky-100 text-sky-700',
    focus: 'Exactas y tecnologia',
    type: 'Publica'
  },
  {
    accent: 'from-purple-50 via-white to-fuchsia-50',
    badge: 'bg-purple-100 text-purple-700',
    focus: 'Humanidades y ciencias',
    type: 'Publica'
  },
  {
    accent: 'from-rose-50 via-white to-pink-50',
    badge: 'bg-rose-100 text-rose-700',
    focus: 'Negocios e innovacion',
    type: 'Privada'
  },
  {
    accent: 'from-slate-50 via-white to-gray-50',
    badge: 'bg-slate-200 text-slate-700',
    focus: 'Economia y diseno',
    type: 'Privada'
  },
  {
    accent: 'from-lime-50 via-white to-emerald-50',
    badge: 'bg-lime-100 text-lime-700',
    focus: 'Ciencias de la salud',
    type: 'Privada'
  }
]

const getUniversityMeta = (id: string) => {
  const hash = Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return universityMetaPool[hash % universityMetaPool.length]
}

export default function UniversitiesPage() {
  const [loading, setLoading] = useState<boolean>(true)
  const [universities, setUniversities] = useState<University[]>([])
  const [error, setError] = useState<string | null>(null)
  const [totalPrograms, setTotalPrograms] = useState<number>(0)
  const [uniqueLocations, setUniqueLocations] = useState<number>(0)

  useEffect(() => {
    const totalPrograms = universities.reduce((total, university) => total + (university.degreePrograms?.length ?? 0), 0)
    const uniqueLocations = Array.from(new Set(universities.map((university) => university.location).filter(Boolean))).length
    setTotalPrograms(totalPrograms)
    setUniqueLocations(uniqueLocations)
  }, [universities])
  

  const placeholderFilters = ['CABA', 'Buenos Aires', 'Santa Fe', 'Cordoba']
  const placeholderFocus = ['Salud', 'Ingenieria', 'Negocios', 'Arte', 'Ciencias']
  const placeholderServices = ['Becas activas', 'Orientacion vocacional', 'Bolsa de trabajo']


  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const data = await apiFetchJson<UniversityResponse>('/universities')
        setUniversities(data.data)
      } catch (error) {
        setError(getApiErrorMessage(error, "No se pudo realizar el fetch"))
      } finally{
        setLoading(false)
      }
    }
    fetchUniversities()
  }, [])

  if (loading){
    return (<h1 className='text-2xl'>Cargando</h1>)
  }
  if (!loading && error){
    return (<h1 className='text-2xl'>{error}</h1>)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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
                  Los filtros y etiquetas avanzadas quedan listos para conectar mas adelante.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <div className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium">
                    <GraduationCap className="w-4 h-4" />
                    {universities.length} universidades activas
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
                    {/* TODO: hook real filters once the data exists */}
                    <div className="bg-white/10 rounded-xl px-4 py-3">
                      <p className="text-white/70 text-xs">Tipo</p>
                      <p className="font-semibold">Pendiente</p>
                    </div>
                    <div className="bg-white/10 rounded-xl px-4 py-3">
                      <p className="text-white/70 text-xs">Modalidad</p>
                      <p className="font-semibold">Pendiente</p>
                    </div>
                    <div className="bg-white/10 rounded-xl px-4 py-3">
                      <p className="text-white/70 text-xs">Rango</p>
                      <p className="font-semibold">Pendiente</p>
                    </div>
                    <div className="bg-white/10 rounded-xl px-4 py-3">
                      <p className="text-white/70 text-xs">Ranking</p>
                      <p className="font-semibold">Pendiente</p>
                    </div>
                  </div>
                  <button className="w-full bg-white text-slate-900 font-semibold py-3 rounded-xl hover:bg-slate-100 transition-colors">
                    Aplicar filtros
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6 h-fit">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Filtros visibles</h2>
            <div className="space-y-5 text-sm">
              <div>
                <p className="text-slate-500 mb-2">Ubicacion</p>
                <div className="flex flex-wrap gap-2">
                  {/* TODO: replace placeholder filters */}
                  {placeholderFilters.map((region) => (
                    <span key={region} className="px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                      {region}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-slate-500 mb-2">Tipo de institucion</p>
                <div className="space-y-2">
                  {['Publica', 'Privada', 'Mixta'].map((type) => (
                    <label key={type} className="flex items-center gap-2 text-slate-700">
                      <input type="checkbox" className="rounded border-slate-300" />
                      {type}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-slate-500 mb-2">Enfoque academico</p>
                <div className="flex flex-wrap gap-2">
                  {/* TODO: replace placeholder focus */}
                  {placeholderFocus.map((focus) => (
                    <span key={focus} className="px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                      {focus}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-slate-500 mb-2">Servicios</p>
                <div className="space-y-2">
                  {/* TODO: replace placeholder services */}
                  {placeholderServices.map((service) => (
                    <label key={service} className="flex items-center gap-2 text-slate-700">
                      <input type="checkbox" className="rounded border-slate-300" />
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
                const meta = getUniversityMeta(university.id)
                return (
                  <article
                    key={university.id}
                    className={`bg-gradient-to-br ${meta.accent} rounded-2xl border border-slate-100 shadow-lg p-6 hover:shadow-xl transition-all`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${meta.badge}`}>
                          {meta.type}
                        </span>
                        <h3 className="text-xl font-bold text-slate-900 mt-3">{university.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-slate-600 mt-2">
                          <MapPin className="w-4 h-4" />
                          {university.location}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                          <Globe className="w-4 h-4" />
                          {university.website}
                        </div>
                      </div>
                      <div className="bg-white/80 rounded-xl px-3 py-2 text-center shadow-sm">
                        <p className="text-xs text-slate-500">Carreras</p>
                        <p className="text-lg font-bold text-slate-900">{university.degreePrograms?.length ?? 0}</p>
                      </div>
                    </div>

                    <div className="mt-4 bg-white/70 rounded-xl p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Enfoque</p>
                      <p className="text-sm text-slate-700 font-medium">{meta.focus}</p>
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
      </main>
    </div>
  )
}
