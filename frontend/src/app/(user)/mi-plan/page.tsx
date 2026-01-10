'use client'

import { useUser } from '@/context/UserContext'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import UserSubjectsGate from '@/components/userSubjectGate'
import { SubjectStatus, SubjectsFromProgram, SubjectDTO } from '@/types/subjects'
import { computeAvailability } from '@/lib/subject_status'
import { apiFetch, apiFetchJson, getApiErrorMessage } from '@/lib/api'
import { BookOpen, CheckCircle2, ClipboardList, Info, Sparkles } from 'lucide-react'

type Subject = {
  id: string
  name: string
  subjectYear: number
  status: SubjectStatus
}

const statusConfig: Record<SubjectStatus, { label: string; classes: string; borderColor: string }> = {
  not_available: {
    label: 'No disponible',
    classes: 'bg-slate-100 border-slate-200 text-slate-500',
    borderColor: 'border-l-slate-300'
  },
  available: {
    label: 'Disponible',
    classes: 'bg-amber-50 border-amber-200 text-amber-700',
    borderColor: 'border-l-amber-300'
  },
  in_progress: {
    label: 'Cursando',
    classes: 'bg-sky-50 border-sky-200 text-sky-700',
    borderColor: 'border-l-sky-300'
  },
  passed: {
    label: 'Aprobada',
    classes: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    borderColor: 'border-l-emerald-300'
  },
  passed_with_distinction: {
    label: 'Promocionada',
    classes: 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700',
    borderColor: 'border-l-fuchsia-300'
  },
  final_pending: {
    label: 'Final pendiente',
    classes: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    borderColor: 'border-l-indigo-300'
  }
}

const statusOrder: SubjectStatus[] = ['not_available', 'available', 'in_progress', 'final_pending', 'passed', 'passed_with_distinction']
const STORAGE_KEY = 'mi-plan_state'
const LEGACY_STORAGE_KEY = 'tuCarrera_state'

export default function SubjectsPage() {
  const { user, isLoading: isLoadingUser } = useUser()
  const searchParams = useSearchParams()
  const programIdParam = searchParams.get('programId') ?? ''
  const isHydratedRef = useRef(false)
  const baselineStatusRef = useRef<{
    programId: string
    statuses: Map<string, SubjectStatus>
  } | null>(null)
  const localChangesRef = useRef<{ programId: string; changes: Record<string, SubjectStatus> } | null>(null)

  const [selectedProgramId, setSelectedProgramId] = useState<string>('')
  const [subjectsData, setSubjectsData] = useState<SubjectsFromProgram | null>(null)
  const [subjects, setSubjects] = useState<SubjectDTO[]>([])
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  const fetchUserSubjects = useCallback(async (programId: string) => {
    if (!programId) return
    try {
      setLoadingSubjects(true)
      setError(null)
      setSelectedProgramId(programId)

      const data = await apiFetchJson<SubjectsFromProgram>(`/me/subjects/${programId}`, {
        method: 'GET',
        credentials: 'include'
      })

      const baseSubjects = data.subjects ?? []
      const baseComputed = computeAvailability(baseSubjects)
      baselineStatusRef.current = {
        programId,
        statuses: new Map(baseComputed.map((subject) => [subject.id, subject.status]))
      }

      const localChanges = localChangesRef.current
      const mergedSubjects = baseComputed.map((subject) => {
        if (localChanges?.programId !== programId) return subject
        const override = localChanges.changes[subject.id]
        return override ? { ...subject, status: override } : subject
      })

      data.subjects = computeAvailability(mergedSubjects)

      setSubjectsData(data)
      setSubjects(data.subjects)
    } catch (e) {
      setError(getApiErrorMessage(e, 'Error inesperado'))
    } finally {
      setLoadingSubjects(false)
    }
  }, [])

  const subjectsByYear = useMemo(() => {
    return subjects.reduce<Record<number, Subject[]>>((acc, s) => {
      ;(acc[s.subjectYear] ||= []).push(s)
      return acc
    }, {})
  }, [subjects])

  const years = useMemo(() => Object.keys(subjectsByYear).map(Number).sort((a, b) => a - b), [subjectsByYear])

  const statusCounts = useMemo(() => {
    return subjects.reduce<Record<SubjectStatus, number>>((acc, subject) => {
      acc[subject.status] += 1
      return acc
    }, {
      not_available: 0,
      available: 0,
      in_progress: 0,
      final_pending: 0,
      passed: 0,
      passed_with_distinction: 0
    })
  }, [subjects])

  const [includeFinalPending, setIncludeFinalPending] = useState(false)

  const completedCount = statusCounts.passed + statusCounts.passed_with_distinction
  const totalCount = subjects.length || 1
  const progressNumerator = includeFinalPending
    ? completedCount + statusCounts.final_pending
    : completedCount
  const progressPercent = Math.min(100, Math.round((progressNumerator / totalCount) * 100))

  const handleRightClick = (e: React.MouseEvent, subjectId: string) => {
    e.preventDefault()
    if (subjects.find((s) => s.id === subjectId)?.status === 'not_available') return
    setSubjects((prev) => {
      const updated = prev.map((s) => {
        if (s.id !== subjectId) return s
        const i = statusOrder.indexOf(s.status)
        const next = statusOrder[(i + 1) % statusOrder.length]
        return { ...s, status: next }
      })
      return computeAvailability(updated)
    })
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as {
          programId?: string
          changes?: Record<string, SubjectStatus>
          selectedProgramId?: string
          subjectsData?: SubjectsFromProgram | null
          subjects?: SubjectDTO[]
        }

        if (parsed.programId && parsed.changes) {
          localChangesRef.current = { programId: parsed.programId, changes: parsed.changes }
        } else if (parsed.subjects && (parsed.subjectsData?.id || parsed.selectedProgramId)) {
          const programId = parsed.subjectsData?.id || parsed.selectedProgramId || ''
          const changes = parsed.subjects.reduce<Record<string, SubjectStatus>>((acc, subject) => {
            if (subject.status !== 'not_available') {
              acc[subject.id] = subject.status
            }
            return acc
          }, {})
          if (programId) {
            localChangesRef.current = { programId, changes }
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ programId, changes }))
          }
        }
      } catch (e) {
        console.log(e)
      }
    }
    isHydratedRef.current = true
  }, [])

  useEffect(() => {
    if (!subjectsData) return
    const baseline = baselineStatusRef.current
    if (!baseline || baseline.programId !== subjectsData.id) return

    const changes = subjects.reduce<Record<string, SubjectStatus>>((acc, subject) => {
      const baseStatus = baseline.statuses.get(subject.id)
      if (baseStatus && baseStatus !== subject.status) {
        acc[subject.id] = subject.status
      }
      return acc
    }, {})

    if (Object.keys(changes).length === 0) {
      localStorage.removeItem(STORAGE_KEY)
      localChangesRef.current = null
      return
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ programId: subjectsData.id, changes }))
    localChangesRef.current = { programId: subjectsData.id, changes }
  }, [subjectsData, subjects])

  const handleSave = useCallback(async () => {
    const programId = subjectsData?.id || selectedProgramId || programIdParam
    if (!programId) return
    try {
      setIsSaving(true)
      setSaveMessage(null)
      const payload = subjects
        .filter((subject) => subject.status !== 'not_available')
        .map((subject) => ({
          id: subject.id,
          status: subject.status
        }))
      const response = await apiFetch(`/me/subjects/${programId}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjects: payload })
      })
      if (!response.ok) {
        throw new Error('No se pudieron guardar los cambios.')
      }
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(LEGACY_STORAGE_KEY)
      localChangesRef.current = null
      if (subjectsData?.id) {
        baselineStatusRef.current = {
          programId: subjectsData.id,
          statuses: new Map(subjects.map((subject) => [subject.id, subject.status]))
        }
      }
      setSaveMessage('Cambios guardados.')
    } catch (err) {
      setSaveMessage(getApiErrorMessage(err, 'No se pudieron guardar los cambios.'))
    } finally {
      setIsSaving(false)
    }
  }, [programIdParam, selectedProgramId, subjects, subjectsData?.id])

  useEffect(() => {
    if (!saveMessage) return
    setSaveMessage(null)
  }, [subjects])

  useEffect(() => {
    if (!isHydratedRef.current) return
    if (!programIdParam) return
    if (programIdParam === subjectsData?.id && subjectsData) return
    fetchUserSubjects(programIdParam)
  }, [fetchUserSubjects, programIdParam, selectedProgramId, subjectsData])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">

        {loadingSubjects && (
          <div className="mt-6 text-sm text-slate-600">Cargando materias...</div>
        )}
        {error && <div className="mt-6 text-sm text-red-600">{error}</div>}

        {subjectsData && !(programIdParam && loadingSubjects) && (
          <section className="mt-10">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-lg px-6 py-5 sm:px-8 sm:py-6 mb-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{subjectsData.name}</h2>
                  <p className="text-slate-600 mt-2">{subjectsData.university}</p>
                </div>
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 font-medium text-slate-700">
                    {subjects.length} materias
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 font-medium text-emerald-700">
                    {statusCounts.in_progress} cursando
                  </span>
                </div>
              </div>
              <div className="mt-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Progreso general</p>
                    <p className="text-xs text-slate-500">
                      {progressNumerator} de {subjects.length} materias
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-slate-900"
                        checked={includeFinalPending}
                        onChange={(event) => setIncludeFinalPending(event.target.checked)}
                      />
                      Incluir finales pendientes
                    </label>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving || subjects.length === 0}
                      className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
                    >
                      {isSaving ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </div>
                </div>
                <div className="mt-3 h-3 w-full rounded-full bg-slate-100">
                  <div
                    className="h-3 rounded-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>{progressPercent}% completado</span>
                  {saveMessage && <span className="text-slate-600">{saveMessage}</span>}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-md px-4 py-4 sm:px-6 sm:py-5 mb-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Estados de las materias</h3>
              <p className="text-sm text-slate-500 mb-4">
                Podes cambiar el estado con click derecho en cada materia.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {Object.entries(statusConfig).map(([status, config]) => (
                  <div key={status} className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded border ${config.classes}`} />
                    <span className="text-sm text-slate-700">{config.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {years.map((year) => (
                <div key={year} className="bg-white rounded-2xl border border-slate-100 shadow-lg overflow-hidden">
                  <div className="bg-slate-900 text-white p-4 text-center">
                    <h3 className="text-xl font-bold">{year}° Año</h3>
                    <p className="text-sm opacity-75">{subjectsByYear[year].length} materias</p>
                  </div>

                  <div className="p-4 space-y-3">
                    {subjectsByYear[year].map((subject) => (
                      <div
                        key={subject.id}
                        onContextMenu={(event) => handleRightClick(event, subject.id)}
                        className={`
                          p-4 rounded-xl border border-l-4 cursor-pointer
                          transition-all duration-200 hover:-translate-y-1 hover:shadow-lg
                          ${statusConfig[subject.status].classes}
                          ${statusConfig[subject.status].borderColor}
                          select-none
                        `}
                      >
                        <h4 className="font-semibold text-sm leading-tight mb-2">{subject.name}</h4>
                        <div className="flex items-center justify-between">
                          <span className="text-xs opacity-80">{statusConfig[subject.status].label}</span>
                          <div className="w-2 h-2 rounded-full bg-current opacity-50" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-900 text-white rounded-3xl px-8 py-6 my-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
                {Object.entries(statusConfig).map(([status, config]) => (
                  <div key={status}>
                    <div className="text-2xl font-bold">{statusCounts[status as SubjectStatus]}</div>
                    <div className="text-sm opacity-75">{config.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {!subjectsData && !loadingSubjects && !error && (
          <section className="mt-10 bg-white rounded-3xl border border-slate-100 shadow-lg px-8 py-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-6">Selecciona una carrera para comenzar</h2>
            <p className="text-slate-600 mt-3">
              Elegi una carrera desde el selector para ver tus materias y actualizar su estado.
            </p>
          </section>
        )}

        <div className="my-6">
          <UserSubjectsGate
            user={user ? { id: user.id } : null}
            isLoading={isLoadingUser}
            fetchUserSubjects={fetchUserSubjects}
            initialProgramId={programIdParam}
          />
        </div>
      </main>
    </div>
  )
}
