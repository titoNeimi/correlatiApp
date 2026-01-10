'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BookOpen, GraduationCap, Heart, MapPin, Sparkles } from 'lucide-react'
import { apiFetch, apiFetchJson, getApiErrorMessage } from '@/lib/api'
import { useUser } from '@/context/UserContext'

type DegreeProgramDTO = {
  id: string
  name: string
  university?: { id: string; name: string }
  subjects?: { id: string }[]
}

type MeProgramsResponse = {
  enrolledProgramIds?: string[]
  favoriteProgramIds?: string[]
}

type DegreeProgramResponse = {
  count: number
  data: DegreeProgramDTO[]
}

export default function MyProgramsPage() {
  const { isLoggedIn, isLoading: isLoadingUser } = useUser()
  const [enrolledPrograms, setEnrolledPrograms] = useState<DegreeProgramDTO[]>([])
  const [favoritePrograms, setFavoritePrograms] = useState<DegreeProgramDTO[]>([])
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isLoadingUser) return

    if (!isLoggedIn) {
      setLoading(false)
      return
    }

    const loadPrograms = async () => {
      try {
        setLoading(true)
        setError(null)

        const meResponse = await apiFetch('/me/programs', { credentials: 'include' })
        if (meResponse.status === 401) {
          setError('Necesitas iniciar sesion para ver tus carreras.')
          setLoading(false)
          return
        }
        if (!meResponse.ok) {
          throw new Error('No se pudieron cargar tus carreras.')
        }

        const meData = (await meResponse.json()) as MeProgramsResponse
        const enrolledIds = meData.enrolledProgramIds ?? []
        const favoriteProgramIds = meData.favoriteProgramIds ?? []

        setFavoriteIds(favoriteProgramIds)

        if (enrolledIds.length === 0 && favoriteProgramIds.length === 0) {
          setEnrolledPrograms([])
          setFavoritePrograms([])
          setLoading(false)
          return
        }

        const degreePrograms = await apiFetchJson<DegreeProgramResponse>('/degreeProgram')
        const list = Array.isArray(degreePrograms.data) ? degreePrograms.data : []
        setEnrolledPrograms(list.filter((program) => enrolledIds.includes(program.id)))
        setFavoritePrograms(list.filter((program) => favoriteProgramIds.includes(program.id)))
      } catch (err) {
        setError(getApiErrorMessage(err, 'No se pudieron cargar tus carreras.'))
      } finally {
        setLoading(false)
      }
    }

    loadPrograms()
  }, [isLoggedIn, isLoadingUser])

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds])

  if (isLoadingUser || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white/80 rounded-3xl border border-slate-100 shadow-xl p-8">
            <div className="h-4 w-32 rounded-full bg-slate-200 animate-pulse" />
            <div className="mt-4 h-8 w-2/3 rounded-xl bg-slate-200 animate-pulse" />
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-40 rounded-2xl bg-slate-200 animate-pulse" />
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-6">Inicia sesion para ver tus carreras</h2>
            <p className="text-slate-600 mt-3">
              Tus carreras inscriptas se muestran en este espacio personalizado.
            </p>
            <div className="mt-6">
              <Link
                href="/login?next=%2Fmis-carreras"
                className="inline-flex items-center justify-center bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors"
              >
                Iniciar sesion
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900">Ocurrio un problema</h2>
            <p className="text-slate-600 mt-3">{error}</p>
            <div className="mt-6">
              <Link
                href="/carreras"
                className="inline-flex items-center justify-center bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors"
              >
                Explorar carreras
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <section className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-100 shadow-xl p-6 sm:p-8 mb-10">
          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-3 py-1 rounded-full text-xs font-semibold tracking-wide">
                <Sparkles className="w-4 h-4" />
                Mis carreras
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-4">
                Tu recorrido academico, en un solo lugar
              </h2>
              <p className="text-slate-600 mt-3 max-w-2xl">
                Accede rapido a las carreras en las que estas inscripto y continua tu plan desde aca.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium">
                  <GraduationCap className="w-4 h-4" />
                  {enrolledPrograms.length} carreras activas
                </div>
                <div className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium">
                  <Heart className="w-4 h-4" />
                  {favoriteIds.length} favoritas
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-white rounded-2xl p-6">
              <p className="text-sm uppercase tracking-wide text-slate-200">Acciones rapidas</p>
              <div className="mt-4 space-y-3 text-sm">
                <div className="bg-white/10 rounded-xl px-4 py-3">
                  <p className="text-white/70 text-xs">Seguimiento</p>
                  <p className="font-semibold">Revisa tu avance por materia</p>
                </div>
                <div className="bg-white/10 rounded-xl px-4 py-3">
                  <p className="text-white/70 text-xs">Favoritos</p>
                  <p className="font-semibold">Guarda carreras para despues</p>
                </div>
                <Link
                  href="/carreras"
                  className="block text-center bg-white text-slate-900 font-semibold py-3 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Ver catalogo completo
                </Link>
              </div>
            </div>
          </div>
        </section>

        {enrolledPrograms.length === 0 && favoritePrograms.length === 0 ? (
          <section className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mt-6">Todavia no agregaste carreras</h3>
            <p className="text-slate-600 mt-3">
              Explora el catalogo, inscribite y guarda favoritos para verlos aca.
            </p>
            <div className="mt-6">
              <Link
                href="/carreras"
                className="inline-flex items-center justify-center bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors"
              >
                Explorar carreras
              </Link>
            </div>
          </section>
        ) : (
          <section>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Carreras inscriptas</h3>
                <p className="text-slate-600">Accesos directos a tu plan academico.</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600">
                Actualizado con tus inscripciones
              </div>
            </div>

            {enrolledPrograms.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-6 text-sm text-slate-600 mb-10">
                Aun no tenes carreras inscriptas. Usa favoritos mientras elegis.
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
                {enrolledPrograms.map((program) => (
                  <article
                    key={program.id}
                    className="flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="bg-slate-900 text-white p-2 rounded-lg">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      {favoriteSet.has(program.id) && (
                        <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-xs font-semibold">
                          <Heart className="w-3 h-3" />
                          Favorita
                        </span>
                      )}
                    </div>

                    <h4 className="text-xl font-bold text-slate-900 mb-2">{program.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                      <MapPin className="w-4 h-4" />
                      {program.university?.name || 'Universidad'}
                    </div>

                    <div className="flex items-center justify-between text-sm text-slate-600 mb-4">
                      <span>{program.subjects?.length ?? 0} materias</span>
                      <Link
                        href={`/carreras/${program.id}`}
                        prefetch={false}
                        className="text-sm font-semibold text-slate-900 hover:text-slate-700 transition-colors"
                      >
                        Ver detalle →
                      </Link>
                    </div>

                    <div className="mt-auto pt-2">
                      <Link
                        href={`/mi-plan?programId=${program.id}`}
                        className="inline-flex items-center justify-center w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                      >
                        Ir a mi plan
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Carreras favoritas</h3>
                <p className="text-slate-600">Guardadas para consultar o inscribirte luego.</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600">
                {favoritePrograms.length} favoritas
              </div>
            </div>

            {favoritePrograms.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-6 text-sm text-slate-600">
                No tenes carreras en favoritos por ahora.
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {favoritePrograms.map((program) => (
                  <article
                    key={program.id}
                    className="flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="bg-rose-50 text-rose-600 p-2 rounded-lg">
                        <Heart className="w-5 h-5" />
                      </div>
                      <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-xs font-semibold">
                        Favorita
                      </span>
                    </div>

                    <h4 className="text-xl font-bold text-slate-900 mb-2">{program.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                      <MapPin className="w-4 h-4" />
                      {program.university?.name || 'Universidad'}
                    </div>

                    <div className="flex items-center justify-between text-sm text-slate-600 mb-4">
                      <span>{program.subjects?.length ?? 0} materias</span>
                      <Link
                        href={`/carreras/${program.id}`}
                        prefetch={false}
                        className="text-sm font-semibold text-slate-900 hover:text-slate-700 transition-colors"
                      >
                        Ver detalle →
                      </Link>
                    </div>

                    <div className="mt-auto pt-2">
                      <Link
                        href={`/mi-plan?programId=${program.id}`}
                        className="inline-flex items-center justify-center w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        Ir a mi plan
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
