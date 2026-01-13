'use client'
import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Building2, Info, MapPin, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { apiFetch, getApiErrorMessage } from '@/lib/api'
import { useUser } from '@/context/UserContext'
import { ElectivePool } from '@/types/electives'
import { ClientPageShell } from '@/components/layout/client-page-shell'

type DegreeProgramSubject = {
  id: string
  name: string
  subjectYear: number
  requirements?: Array<string | { id?: string; name?: string }>
}

type DegreeProgramDetail = {
  id: string
  name: string
  university?: {
    id: string
    name: string
    location?: string
  }
  subjects?: DegreeProgramSubject[]
  created_at?: string
  updated_at?: string
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

const normalizeRequirement = (req: string | { id?: string; name?: string; minStatus?: string }) => {
  if (typeof req === 'string') {
    return { label: req, status: 'passed' }
  }
  return {
    label: req.name ?? 'Correlativa',
    status: req.minStatus ?? 'passed'
  }
}

const getRequirementStatusLabel = (status?: string) => {
  if (status === 'final_pending') return 'Final pendiente'
  return 'Aprobada'
}

const getRequirementStatusClasses = (status?: string) => {
  if (status === 'final_pending') {
    return 'bg-amber-500/20 text-amber-100 border-amber-400/40'
  }
  return 'bg-emerald-500/20 text-emerald-100 border-emerald-400/40'
}

const renderSubjectCard = (subject: DegreeProgramSubject) => (
  <div key={subject.id} className="bg-white rounded-xl border border-slate-100 p-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-slate-900">{subject.name}</p>
        {subject.requirements && subject.requirements.length ? (
          <div className="mt-2 inline-flex items-center gap-2 text-xs text-slate-600">
            <span>Correlativas</span>
            <span className="relative group inline-flex">
              <Info className="w-4 h-4 text-slate-500" />
              <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-64 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                <div className="space-y-2">
                  {subject.requirements.map((req, index) => {
                    const normalized = normalizeRequirement(req as typeof req & { minStatus?: string })
                    return (
                      <div key={`${subject.id}-${index}`} className="flex items-center justify-between gap-2">
                        <span className="text-white/90">{normalized.label}</span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getRequirementStatusClasses(normalized.status)}`}
                        >
                          {getRequirementStatusLabel(normalized.status)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </span>
            </span>
          </div>
        ) : (
          <p className="text-xs text-slate-500 mt-2">Sin correlativas</p>
        )}
      </div>
    </div>
  </div>
)

async function fetchProgram(id: string): Promise<DegreeProgramDetail | null> {
  const response = await apiFetch(`/degreeProgram/${id}`, { cache: 'no-store' })
  if (response.status === 404) return null
  if (!response.ok) return null
  return response.json()
}

async function fetchProgramSubjects(id: string): Promise<DegreeProgramSubject[] | null> {
  const response = await apiFetch(`/subjects/${id}`, { cache: 'no-store' })
  if (!response.ok) return null
  return response.json()
}

async function fetchElectivePools(id: string): Promise<ElectivePool[] | null> {
  const response = await apiFetch(`/degreeProgram/${id}/electivePools`, { cache: 'no-store' })
  if (!response.ok) return null
  return response.json()
}

export default function CareerDetailPage() {
  const params = useParams<{ id: string }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const { user, isLoggedIn, isLoading: isLoadingUser, refresh } = useUser()
  const [loading, setLoading] = useState(true)
  const [program, setProgram] = useState<DegreeProgramDetail | null>(null)
  const [subjects, setSubjects] = useState<DegreeProgramSubject[]>([])
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<'enroll' | 'unenroll' | 'favorite' | null>(null)
  const [favoriteProgramIds, setFavoriteProgramIds] = useState<string[]>([])
  const [enrolledProgramIds, setEnrolledProgramIds] = useState<string[]>([])
  const [programsLoading, setProgramsLoading] = useState(false)
  const [electivePools, setElectivePools] = useState<ElectivePool[]>([])

  useEffect(() => {
    if (!id) {
      setError('No se encontro la carrera.')
      setLoading(false)
      return
    }

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [programData, subjectsData, poolsData] = await Promise.all([
          fetchProgram(id),
          fetchProgramSubjects(id),
          fetchElectivePools(id)
        ])
        if (!programData) {
          setError('No se pudo cargar la carrera.')
          setLoading(false)
          return
        }
        setProgram(programData)
        setSubjects(subjectsData ?? programData.subjects ?? [])
        setElectivePools(poolsData ?? [])
      } catch (err) {
        setError(getApiErrorMessage(err, 'Error inesperado'))
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id])

  const subjectsByYear = useMemo(() => {
    const validSubjects = subjects.filter((subject) => Number.isFinite(subject.subjectYear))
    return validSubjects.reduce<Record<number, DegreeProgramSubject[]>>((acc, subject) => {
      acc[subject.subjectYear] ||= []
      acc[subject.subjectYear].push(subject)
      return acc
    }, {})
  }, [subjects])

  const years = useMemo(() => {
    return Object.keys(subjectsByYear)
      .map(Number)
      .sort((a, b) => a - b)
  }, [subjectsByYear])

  const selectedSubjects = useMemo(() => {
    if (selectedYear === null) return []
    return subjectsByYear[selectedYear] ?? []
  }, [selectedYear, subjectsByYear])

  const selectedPoolSubjects = useMemo(() => {
    if (!selectedPoolId) return []
    return electivePools.find((pool) => pool.id === selectedPoolId)?.subjects ?? []
  }, [electivePools, selectedPoolId])

  const loginUrl = useMemo(() => {
    if (!id) return '/login'
    return `/login?next=${encodeURIComponent(`/carreras/${id}`)}`
  }, [id])

  const loadPrograms = useCallback(async () => {
    try {
      setProgramsLoading(true)
      const response = await apiFetch('/me/programs', { credentials: 'include' })
      if (!response.ok) return
      const data = (await response.json()) as {
        favoriteProgramIds?: string[]
        enrolledProgramIds?: string[]
      }
      setFavoriteProgramIds(data.favoriteProgramIds ?? [])
      setEnrolledProgramIds(data.enrolledProgramIds ?? [])
    } catch {
      setFavoriteProgramIds([])
      setEnrolledProgramIds([])
    } finally {
      setProgramsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isLoggedIn) {
      setFavoriteProgramIds([])
      setEnrolledProgramIds([])
      setProgramsLoading(false)
      return
    }
    loadPrograms()
  }, [isLoggedIn, id, loadPrograms])

  const isEnrolled = useMemo(() => {
    if (!id) return false
    return enrolledProgramIds.includes(id)
  }, [enrolledProgramIds, id])

  const isFavorite = useMemo(() => {
    if (!id) return false
    return favoriteProgramIds.includes(id)
  }, [favoriteProgramIds, id])

  const handleEnrollmentClick = async () => {
    if (isLoadingUser || actionLoading || !id) return
    if (!isLoggedIn) {
      setActionMessage('Necesitas iniciar sesion para inscribirte.')
      return
    }
    setActionMessage(null)
    setActionLoading('enroll')
    try {
      const response = await apiFetch(`/me/programs/${id}/enroll`, {
        method: 'POST',
        credentials: 'include'
      })
      if (response.status === 401) {
        setActionMessage('Necesitas iniciar sesion para inscribirte.')
        return
      }
      if (response.status === 409) {
        setActionMessage('Ya estas inscripto en esta carrera.')
        await loadPrograms()
        return
      }
      if (!response.ok) {
        setActionMessage('No se pudo completar la inscripcion.')
        return
      }
      setEnrolledProgramIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
      await refresh()
    } catch (err) {
      setActionMessage(getApiErrorMessage(err, 'Error inesperado'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnenrollClick = async () => {
    if (isLoadingUser || actionLoading || !id) return
    if (!isLoggedIn) {
      setActionMessage('Necesitas iniciar sesion para desinscribirte.')
      return
    }
    setActionMessage(null)
    setActionLoading('unenroll')
    try {
      const response = await apiFetch(`/me/programs/${id}/enroll`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (response.status === 401) {
        setActionMessage('Necesitas iniciar sesion para desinscribirte.')
        return
      }
      if (response.status === 409) {
        setActionMessage('No estas inscripto en esta carrera.')
        await loadPrograms()
        return
      }
      if (!response.ok) {
        setActionMessage('No se pudo completar la desinscripcion.')
        return
      }
      setEnrolledProgramIds((prev) => prev.filter((programId) => programId !== id))
      await refresh()
    } catch (err) {
      setActionMessage(getApiErrorMessage(err, 'Error inesperado'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleFavoriteClick = async () => {
    if (isLoadingUser || actionLoading || !id) return
    if (!isLoggedIn) {
      setActionMessage('Necesitas iniciar sesion para guardar favoritos.')
      return
    }
    setActionMessage(null)
    setActionLoading('favorite')
    try {
      const response = await apiFetch(`/me/programs/${id}/favorite`, {
        method: isFavorite ? 'DELETE' : 'POST',
        credentials: 'include'
      })
      if (response.status === 401) {
        setActionMessage('Necesitas iniciar sesion para guardar favoritos.')
        return
      }
      if (response.status === 409) {
        setActionMessage(isFavorite ? 'No esta en favoritos.' : 'Ya esta en favoritos.')
        return
      }
      if (response.status === 404) {
        setActionMessage('No se encontro la carrera.')
        return
      }
      if (!response.ok) {
        setActionMessage('No se pudo actualizar favoritos.')
        return
      }
      setFavoriteProgramIds((prev) => {
        if (isFavorite) {
          return prev.filter((programId) => programId !== id)
        }
        if (prev.includes(id)) return prev
        return [...prev, id]
      })
    } catch (err) {
      setActionMessage(getApiErrorMessage(err, 'Error inesperado'))
    } finally {
      setActionLoading(null)
    }
  }

  useEffect(() => {
    if (years.length === 0) return
    if (selectedPoolId) return
    if (selectedYear === null || !years.includes(selectedYear)) {
      setSelectedYear(years[0])
    }
  }, [years, selectedYear, selectedPoolId])

  useEffect(() => {
    if (selectedYear !== null) {
      setSelectedPoolId(null)
    }
  }, [selectedYear])

  useEffect(() => {
    if (selectedPoolId) {
      setSelectedYear(null)
    }
  }, [selectedPoolId])

  useEffect(() => {
    if (selectedPoolId && !electivePools.some((pool) => pool.id === selectedPoolId)) {
      setSelectedPoolId(null)
    }
  }, [electivePools, selectedPoolId])

  const isPageLoading = loading || isLoadingUser || (isLoggedIn && programsLoading)

  if (isPageLoading) {
    return (
      <ClientPageShell mainClassName="max-w-6xl py-10">
          <div className="rounded-3xl border border-slate-100 shadow-xl p-6 sm:p-8 bg-white/80 backdrop-blur-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1 space-y-4">
                <div className="h-4 w-28 rounded-full bg-slate-200 animate-pulse" />
                <div className="h-8 w-2/3 rounded-xl bg-slate-200 animate-pulse" />
                <div className="flex gap-3">
                  <div className="h-4 w-40 rounded-full bg-slate-200 animate-pulse" />
                  <div className="h-4 w-32 rounded-full bg-slate-200 animate-pulse" />
                </div>
                <div className="h-4 w-3/4 rounded-full bg-slate-200 animate-pulse" />
                <div className="flex gap-3">
                  <div className="h-10 w-32 rounded-xl bg-slate-200 animate-pulse" />
                  <div className="h-10 w-48 rounded-xl bg-slate-200 animate-pulse" />
                </div>
              </div>
              <div className="bg-slate-900 text-white rounded-2xl p-6 min-w-[240px]">
                <div className="h-3 w-16 rounded-full bg-slate-700 animate-pulse" />
                <div className="mt-4 space-y-3">
                  <div className="h-4 w-full rounded-full bg-slate-700 animate-pulse" />
                  <div className="h-4 w-3/4 rounded-full bg-slate-700 animate-pulse" />
                  <div className="h-4 w-2/3 rounded-full bg-slate-700 animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] mt-10">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-2">
                  <div className="h-5 w-40 rounded-full bg-slate-200 animate-pulse" />
                  <div className="h-4 w-52 rounded-full bg-slate-200 animate-pulse" />
                </div>
                <div className="h-8 w-24 rounded-xl bg-slate-200 animate-pulse" />
              </div>
              <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
                <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 h-fit space-y-3">
                  <div className="h-3 w-16 rounded-full bg-slate-200 animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-10 rounded-xl bg-slate-200 animate-pulse" />
                    <div className="h-10 rounded-xl bg-slate-200 animate-pulse" />
                    <div className="h-10 rounded-xl bg-slate-200 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-5 w-40 rounded-full bg-slate-200 animate-pulse" />
                  <div className="h-20 rounded-xl bg-slate-200 animate-pulse" />
                  <div className="h-20 rounded-xl bg-slate-200 animate-pulse" />
                  <div className="h-20 rounded-xl bg-slate-200 animate-pulse" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6">
              <div className="h-5 w-32 rounded-full bg-slate-200 animate-pulse" />
              <div className="mt-4 space-y-3">
                <div className="h-16 rounded-xl bg-slate-200 animate-pulse" />
                <div className="h-16 rounded-xl bg-slate-200 animate-pulse" />
                <div className="h-16 rounded-xl bg-slate-200 animate-pulse" />
              </div>
            </div>
          </div>
      </ClientPageShell>
    )
  }

  if (!program || error) {
    return (
      <ClientPageShell mainClassName="max-w-3xl py-12">
        <h2 className="text-2xl text-slate-900">{error ?? 'No se pudo cargar la carrera.'}</h2>
      </ClientPageShell>
    )
  }

  return (
    <ClientPageShell mainClassName="max-w-6xl py-10">
        <section className="rounded-3xl border border-slate-100 shadow-xl p-6 sm:p-8 bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/carreras"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver
                </Link>
                <span className="inline-flex items-center gap-2 bg-slate-900 text-white px-3 py-1 rounded-full text-xs font-semibold tracking-wide">
                  <Sparkles className="w-4 h-4" />
                  Perfil de carrera
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-4">{program.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mt-3">
                <span className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  {program.university?.name ?? 'Universidad'}
                </span>
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {program.university?.location ?? 'Ubicacion pendiente'}
                </span>
              </div>
              <p className="text-slate-600 mt-4 max-w-2xl">
                Revisa el plan de estudios, materias por anio y opciones de inscripcion.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                {isEnrolled ? (
                  <button
                    type="button"
                    onClick={handleUnenrollClick}
                    className="inline-flex items-center justify-center gap-2 bg-white text-rose-600 px-6 py-3 rounded-xl text-sm font-semibold border border-rose-200 hover:border-rose-300 transition-colors"
                    disabled={isLoadingUser || actionLoading === 'unenroll'}
                  >
                    {actionLoading === 'unenroll' ? 'Desinscribiendo...' : 'Desinscribirme'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleEnrollmentClick}
                    className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors"
                    disabled={isLoadingUser || actionLoading === 'enroll'}
                  >
                    {actionLoading === 'enroll' ? 'Inscribiendo...' : 'Inscribirme'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleFavoriteClick}
                  className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-xl text-sm font-semibold border border-slate-200 hover:border-slate-300 transition-colors"
                  disabled={isLoadingUser || actionLoading === 'favorite'}
                >
                  {actionLoading === 'favorite'
                    ? 'Actualizando...'
                    : isFavorite
                      ? 'Quitar de favoritos'
                      : 'Guardar en favoritos'}
                </button>
              </div>
              {actionMessage && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {actionMessage}
                  {!isLoggedIn && (
                    <Link href={loginUrl} className="ml-2 font-semibold underline">
                      Ir a login
                    </Link>
                  )}
                </div>
              )}
            </div>
            <div className="bg-slate-900 text-white rounded-2xl p-6 min-w-[240px]">
              <p className="text-xs uppercase tracking-wide text-slate-300">Resumen</p>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span>Materias</span>
                  <span className="font-semibold">{subjects.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Años</span>
                  <span className="font-semibold">{years.length || 'Pendiente'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Actualizado</span>
                  <span className="font-semibold">{formatDate(program.updated_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] mt-10">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Plan de estudios</h2>
                <p className="text-slate-600">Materias organizadas por anio.</p>
              </div>
              <div className="text-sm text-slate-500 bg-slate-100 px-3 py-2 rounded-xl">
                Orden actual: Año
              </div>
            </div>

            {years.length === 0 && electivePools.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-600">
                Esta carrera aun no tiene materias asociadas.
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
                <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 h-fit">
                  <p className="text-xs uppercase tracking-wide text-slate-500 mb-3">Años y pools</p>
                  <div className="space-y-2">
                    {years.map((year) => (
                      <button
                        key={`year-${year}`}
                        type="button"
                        onClick={() => setSelectedYear(year)}
                        className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition-all ${
                          selectedYear === year
                            ? 'bg-slate-900 text-white shadow-md border border-slate-900'
                            : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {year}° Anio
                      </button>
                    ))}
                    {electivePools.map((pool) => (
                      <button
                        key={`pool-${pool.id}`}
                        type="button"
                        onClick={() => setSelectedPoolId(pool.id)}
                        className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition-all ${
                          selectedPoolId === pool.id
                            ? 'bg-amber-600 text-white shadow-md border border-amber-600'
                            : 'bg-white text-amber-800 border border-amber-200 hover:border-amber-300'
                        }`}
                      >
                        {pool.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {selectedYear !== null
                        ? `${selectedYear}° Anio`
                        : selectedPoolId
                          ? electivePools.find((pool) => pool.id === selectedPoolId)?.name ?? 'Pool'
                          : 'Selecciona un anio o pool'}
                    </h3>
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                      {selectedYear !== null
                        ? selectedSubjects.length
                        : selectedPoolSubjects.length}{' '}
                      materias
                    </span>
                  </div>
                  <div className="space-y-3">
                    {selectedYear !== null &&
                      selectedSubjects.map((subject) => renderSubjectCard(subject))}
                    {selectedPoolId &&
                      selectedPoolSubjects.map((subject) =>
                        renderSubjectCard({
                          id: subject.id,
                          name: subject.name,
                          subjectYear: subject.year ?? 0,
                          requirements: [],
                        })
                      )}
                    {selectedYear !== null && selectedSubjects.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-600">
                        No hay materias para este anio.
                      </div>
                    )}
                    {selectedPoolId && selectedPoolSubjects.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-600">
                        No hay electivas en este pool.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-slate-900">Acciones rapidas</h3>
              <div className="mt-4 space-y-3 text-sm">
                <button className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 hover:border-slate-300 transition-colors">
                  Ver requisitos de ingreso
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 hover:border-slate-300 transition-colors">
                  Descargar plan oficial
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 hover:border-slate-300 transition-colors">
                  Contactar coordinacion
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-700 text-white rounded-2xl p-6">
              <h3 className="text-lg font-semibold">Inscripcion y seguimiento</h3>
              <p className="text-slate-200 text-sm mt-2">
                Proximo formulario, requisitos y calendario se conectan mas adelante.
              </p>
              <div className="mt-4 space-y-3">
                {['Estado de admision', 'Documentacion', 'Seguimiento'].map((item) => (
                  <div key={item} className="bg-white/10 rounded-xl px-4 py-3 flex items-center justify-between text-sm">
                    <span>{item}</span>
                    <BookOpen className="w-4 h-4 text-white/70" />
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </ClientPageShell>
  )
}
