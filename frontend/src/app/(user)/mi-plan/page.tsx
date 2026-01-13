'use client'

import { useUser } from '@/context/UserContext'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import UserSubjectsGate from '@/components/userSubjectGate'
import { SubjectStatus, SubjectsFromProgram, SubjectDTO } from '@/types/subjects'
import { computeAvailability } from '@/lib/subject_status'
import { apiFetch, apiFetchJson, getApiErrorMessage } from '@/lib/api'
import { ElectivePool, ElectiveRequirementType, ElectiveRule } from '@/types/electives'
import { BookOpen, } from 'lucide-react'
import { ClientPageShell } from '@/components/layout/client-page-shell'

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
  const [electivePools, setElectivePools] = useState<ElectivePool[]>([])
  const [electiveRules, setElectiveRules] = useState<ElectiveRule[]>([])
  const [loadingElectives, setLoadingElectives] = useState(false)
  const [electiveError, setElectiveError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  const normalizeSubjectYear = (subject: SubjectDTO & { year?: number | null }) => {
    const raw = typeof subject.subjectYear === 'number' ? subject.subjectYear : subject.year ?? 0
    return Number.isFinite(raw) ? raw : 0
  }

  const fetchElectives = useCallback(async (programId: string) => {
    if (!programId) {
      setElectivePools([])
      setElectiveRules([])
      return
    }
    try {
      setLoadingElectives(true)
      setElectiveError(null)
      const [pools, rules] = await Promise.all([
        apiFetchJson<ElectivePool[]>(`/degreeProgram/${programId}/electivePools`, { credentials: 'include' }),
        apiFetchJson<ElectiveRule[]>(`/degreeProgram/${programId}/electiveRules`, { credentials: 'include' })
      ])
      setElectivePools(pools ?? [])
      setElectiveRules(rules ?? [])
    } catch (e) {
      setElectivePools([])
      setElectiveRules([])
      setElectiveError(getApiErrorMessage(e, 'No se pudieron cargar las electivas'))
    } finally {
      setLoadingElectives(false)
    }
  }, [])

  const fetchUserSubjects = useCallback(async (programId: string) => {
    if (!programId) return
    try {
      setLoadingSubjects(true)
      setError(null)
      setSelectedProgramId(programId)
      void fetchElectives(programId)

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

      const computedSubjects = computeAvailability(mergedSubjects)
      data.subjects = computedSubjects.map((subject) => ({
        ...subject,
        subjectYear: normalizeSubjectYear(subject as SubjectDTO & { year?: number | null })
      }))

      setSubjectsData(data)
      setSubjects(data.subjects)
    } catch (e) {
      setError(getApiErrorMessage(e, 'Error inesperado'))
    } finally {
      setLoadingSubjects(false)
    }
  }, [])

  const electiveIds = useMemo(() => {
    const ids = new Set<string>()
    electivePools.forEach((pool) => {
      pool.subjects?.forEach((subject) => ids.add(subject.id))
    })
    return ids
  }, [electivePools])

  const nonElectiveSubjects = useMemo(() => {
    return subjects.filter((subject) => !subject.is_elective && !electiveIds.has(subject.id))
  }, [subjects, electiveIds])

  const subjectsByYear = useMemo(() => {
    return nonElectiveSubjects.reduce<Record<number, Subject[]>>((acc, s) => {
      ;(acc[s.subjectYear] ||= []).push(s)
      return acc
    }, {})
  }, [nonElectiveSubjects])

  const years = useMemo(() => Object.keys(subjectsByYear).map(Number).sort((a, b) => a - b), [subjectsByYear])

  const statusBySubjectId = useMemo(() => {
    return new Map(subjects.map((subject) => [subject.id, subject.status]))
  }, [subjects])

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

  const completedCount = nonElectiveSubjects.reduce((acc, subject) => {
    if (subject.status === 'passed' || subject.status === 'passed_with_distinction') {
      return acc + 1
    }
    return acc
  }, 0)
  const finalPendingCount = nonElectiveSubjects.reduce((acc, subject) => {
    if (subject.status === 'final_pending') {
      return acc + 1
    }
    return acc
  }, 0)
  const totalCount = nonElectiveSubjects.length || 1
  const progressNumerator = includeFinalPending
    ? completedCount + finalPendingCount
    : completedCount
  const progressPercent = Math.min(100, Math.round((progressNumerator / totalCount) * 100))

  const requirementTypeLabels: Record<ElectiveRequirementType, string> = {
    hours: 'horas',
    credits: 'créditos',
    subject_count: 'materias'
  }

  const formatRuleScope = (rule: ElectiveRule) => {
    if (rule.applies_to_year) {
      if (rule.applies_from_year === rule.applies_to_year) {
        return `${rule.applies_from_year}° año`
      }
      return `${rule.applies_from_year}° a ${rule.applies_to_year}° año`
    }
    return `${rule.applies_from_year}° año en adelante`
  }

  const formatMinimumValue = (value: number) => {
    return Number.isInteger(value) ? `${value}` : value.toString()
  }

  const getElectiveProgress = (rule: ElectiveRule) => {
    const poolSubjects = electivePools.find((pool) => pool.id === rule.pool_id)?.subjects ?? []
    const completedStatuses = includeFinalPending
      ? new Set<SubjectStatus>(['passed', 'passed_with_distinction', 'final_pending'])
      : new Set<SubjectStatus>(['passed', 'passed_with_distinction'])
    const completedSubjects = poolSubjects.filter((subject) => {
      const status = statusBySubjectId.get(subject.id)
      return status ? completedStatuses.has(status) : false
    })

    let achieved = 0
    let target = rule.minimum_value
    let displayLabel = requirementTypeLabels[rule.requirement_type]
    switch (rule.requirement_type) {
      case 'hours':
        achieved = completedSubjects.reduce((acc, subject) => acc + (subject.hours ?? 0), 0)
        break
      case 'credits':
        achieved = completedSubjects.reduce((acc, subject) => acc + (subject.credits ?? 0), 0)
        break
      case 'subject_count':
        achieved = completedSubjects.length
        target = rule.minimum_value
        break
      default:
        achieved = 0
    }

    const percent = target > 0
      ? Math.min(100, Math.round((achieved / target) * 100))
      : 0

    return { achieved, percent, target, displayLabel }
  }

  const formatYearLabel = (year: number) => {
    if (year === 0) return 'Sin año'
    return `${year}° Año`
  }

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
    <ClientPageShell mainClassName="max-w-7xl py-2">

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
                    <h3 className="text-xl font-bold">{formatYearLabel(year)}</h3>
                    <p className="text-sm opacity-75">{subjectsByYear[year]?.length ?? 0} materias</p>
                  </div>

                  <div className="p-4 space-y-3">
                    {(subjectsByYear[year] ?? []).map((subject) => (
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

            {(loadingElectives || electiveError || electivePools.length > 0 || electiveRules.length > 0) && (
              <section className="mb-10">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-5">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Electivas</h3>
                    <p className="text-sm text-slate-500">
                      Pools y reglas vigentes para tu plan de estudios.
                    </p>
                  </div>
                  {loadingElectives && (
                    <span className="text-xs text-slate-500">Cargando electivas...</span>
                  )}
                </div>
                {electiveError && (
                  <div className="mb-4 text-sm text-red-600">{electiveError}</div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-base font-semibold text-slate-900">Pools</h4>
                      <span className="text-xs text-slate-500">{electivePools.length} pools</span>
                    </div>
                    {electivePools.length === 0 && (
                      <p className="text-sm text-slate-500">No hay pools configurados.</p>
                    )}
                    <div className="space-y-4">
                      {electivePools.map((pool) => (
                        <details
                          key={pool.id}
                          className="rounded-xl border border-slate-100 bg-slate-50/40 p-4"
                        >
                          <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2">
                            <div>
                              <h5 className="text-sm font-semibold text-slate-900">{pool.name}</h5>
                              <span className="mt-1 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                                Electivas
                              </span>
                            </div>
                            <span className="text-xs text-slate-500">
                              {(pool.subjects?.length ?? 0)} materias
                            </span>
                          </summary>
                          {pool.description && (
                            <p className="text-xs text-slate-500 mt-2">{pool.description}</p>
                          )}
                          {pool.subjects && pool.subjects.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {pool.subjects.map((subject) => {
                                const status = statusBySubjectId.get(subject.id) ?? 'not_available'
                                return (
                                  <span
                                    key={subject.id}
                                    onContextMenu={(event) => handleRightClick(event, subject.id)}
                                    className="inline-flex flex-wrap items-center gap-2 rounded-full bg-white px-3 py-1 text-xs text-slate-600 border border-slate-200 cursor-pointer select-none"
                                  >
                                    <span className="text-amber-700 font-semibold">Electiva</span>
                                    {subject.name}
                                    {subject.year ? <span className="text-slate-400">{subject.year}°</span> : null}
                                    <span className={`rounded-full border px-2 py-0.5 text-[11px] ${statusConfig[status].classes}`}>
                                      {statusConfig[status].label}
                                    </span>
                                  </span>
                                )
                              })}
                            </div>
                          ) : (
                            <p className="mt-3 text-xs text-slate-500">Sin materias asociadas.</p>
                          )}
                        </details>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-base font-semibold text-slate-900">Reglas</h4>
                      <span className="text-xs text-slate-500">{electiveRules.length} reglas</span>
                    </div>
                    {electiveRules.length === 0 && (
                      <p className="text-sm text-slate-500">No hay reglas configuradas.</p>
                    )}
                    <div className="space-y-3">
                      {electiveRules.map((rule) => {
                        const progress = getElectiveProgress(rule)
                        const requirementLabel = requirementTypeLabels[rule.requirement_type]
                        return (
                          <div key={rule.id} className="rounded-xl border border-slate-100 bg-slate-50/40 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {rule.pool?.name ?? 'Pool sin nombre'}
                                </p>
                                <p className="text-xs text-slate-500">{formatRuleScope(rule)}</p>
                              </div>
                              <span className="text-xs text-slate-500 uppercase tracking-wide">
                                {requirementLabel}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-slate-700">
                              Requiere {formatMinimumValue(rule.minimum_value)} {requirementLabel}
                            </p>
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-xs text-slate-500">
                                <span>
                                  {formatMinimumValue(progress.achieved)} / {formatMinimumValue(progress.target)} {progress.displayLabel}
                                </span>
                                <span>{progress.percent}%</span>
                              </div>
                              <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                                <div
                                  className="h-2 rounded-full bg-emerald-500 transition-all duration-300"
                                  style={{ width: `${progress.percent}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </section>
            )}
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
      </ClientPageShell>
  )
}
