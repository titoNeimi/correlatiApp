'use client'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { apiFetch, getApiErrorMessage } from '@/lib/api'
import { useUser } from '@/context/UserContext'
import { ClientPageShell } from '@/components/layout/client-page-shell'

type MinStatus = 'passed' | 'final_pending'
type SubjectTerm = 'annual' | 'semester' | 'quarterly' | 'bimonthly'

type EditableRequirement = {
  id: string
  name: string
  minStatus: MinStatus
}

type EditableSubject = {
  id: string
  name: string
  subjectYear: number | null
  term: SubjectTerm
  requirements: EditableRequirement[]
}

type ProgramInfo = {
  id: string
  name: string
  university?: { name: string }
  approvalStatus?: string
  publicRequested?: boolean
}

type EditDraft = {
  name: string
  subjectYear: number | null
  term: SubjectTerm
}

type AddReqDraft = {
  requirementId: string
  minStatus: MinStatus
}

const TERM_LABELS: Record<SubjectTerm, string> = {
  annual: 'Anual',
  semester: 'Semestral',
  quarterly: 'Cuatrimestral',
  bimonthly: 'Bimestral',
}

const YEAR_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8]

async function fetchProgram(id: string): Promise<ProgramInfo | null> {
  const res = await apiFetch(`/degreeProgram/${id}`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

async function fetchSubjects(programId: string): Promise<EditableSubject[]> {
  const res = await apiFetch(`/subjects/${programId}`, { cache: 'no-store' })
  if (!res.ok) return []
  const raw = await res.json()
  return (raw as Array<{
    id: string
    name: string
    subjectYear?: number | null
    year?: number | null
    term?: string
    requirements?: Array<{ id: string; name?: string; minStatus?: string }>
  }>).map((s) => ({
    id: s.id,
    name: s.name,
    subjectYear: s.subjectYear ?? s.year ?? null,
    term: (s.term as SubjectTerm) || 'annual',
    requirements: (s.requirements ?? []).map((r) => ({
      id: r.id,
      name: r.name ?? r.id,
      minStatus: (r.minStatus as MinStatus) ?? 'passed',
    })),
  }))
}

export default function EditDegreeProgramPage() {
  const params = useParams<{ id: string }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const router = useRouter()
  const { user, isLoggedIn, isLoading: isLoadingUser } = useUser()

  const [program, setProgram] = useState<ProgramInfo | null>(null)
  const [subjects, setSubjects] = useState<EditableSubject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // add form state
  const [addName, setAddName] = useState('')
  const [addYear, setAddYear] = useState<number>(1)
  const [addTerm, setAddTerm] = useState<SubjectTerm>('annual')
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  // inline edit state: subjectId -> draft
  const [editDrafts, setEditDrafts] = useState<Record<string, EditDraft>>({})
  const [editLoading, setEditLoading] = useState<Record<string, boolean>>({})
  const [editError, setEditError] = useState<Record<string, string>>({})

  // delete state
  const [deleteLoading, setDeleteLoading] = useState<Record<string, boolean>>({})

  // add requirement state: subjectId -> draft
  const [reqDrafts, setReqDrafts] = useState<Record<string, AddReqDraft>>({})
  const [reqLoading, setReqLoading] = useState<Record<string, boolean>>({})
  const [reqError, setReqError] = useState<Record<string, string>>({})
  const [reqFormOpen, setReqFormOpen] = useState<Record<string, boolean>>({})

  // remove requirement loading: `${subjectId}-${reqId}`
  const [removeReqLoading, setRemoveReqLoading] = useState<Record<string, boolean>>({})

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const [prog, subs] = await Promise.all([fetchProgram(id), fetchSubjects(id)])
      if (!prog) {
        setError('No se pudo cargar la carrera.')
        return
      }
      setProgram(prog)
      setSubjects(subs)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error inesperado al cargar la carrera.'))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  // auth guard
  useEffect(() => {
    if (isLoadingUser) return
    if (!isLoggedIn) {
      router.replace(`/carreras/${id}`)
    }
  }, [isLoadingUser, isLoggedIn, id, router])

  const isAdmin = user?.role === 'admin' || user?.role === 'staff'

  const subjectsByYear = useMemo(() => {
    const groups: Record<string, EditableSubject[]> = { null: [] }
    for (const s of subjects) {
      const key = s.subjectYear !== null ? String(s.subjectYear) : 'null'
      if (!groups[key]) groups[key] = []
      groups[key].push(s)
    }
    return groups
  }, [subjects])

  const sortedYearKeys = useMemo(() => {
    return Object.keys(subjectsByYear)
      .filter((k) => k !== 'null')
      .sort((a, b) => Number(a) - Number(b))
  }, [subjectsByYear])

  const handleAddSubject = async () => {
    if (!addName.trim()) {
      setAddError('El nombre es obligatorio.')
      return
    }
    setAddError(null)
    setAddLoading(true)
    try {
      const res = await apiFetch('/subjects', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addName.trim(),
          subjectYear: addYear,
          year: addYear,
          term: addTerm,
          degreeProgramID: id,
        }),
      })
      if (res.status === 401 || res.status === 403) {
        setAddError('Sin permisos para editar esta carrera.')
        return
      }
      if (!res.ok) {
        setAddError('No se pudo agregar la materia.')
        return
      }
      const created = await res.json()
      setSubjects((prev) => [
        ...prev,
        {
          id: created.id,
          name: created.name,
          subjectYear: created.subjectYear ?? created.year ?? addYear,
          term: (created.term as SubjectTerm) || addTerm,
          requirements: [],
        },
      ])
      setAddName('')
    } catch (err) {
      setAddError(getApiErrorMessage(err, 'Error al agregar la materia.'))
    } finally {
      setAddLoading(false)
    }
  }

  const startEdit = (subject: EditableSubject) => {
    setEditDrafts((prev) => ({
      ...prev,
      [subject.id]: {
        name: subject.name,
        subjectYear: subject.subjectYear,
        term: subject.term,
      },
    }))
    setEditError((prev) => ({ ...prev, [subject.id]: '' }))
  }

  const cancelEdit = (subjectId: string) => {
    setEditDrafts((prev) => {
      const next = { ...prev }
      delete next[subjectId]
      return next
    })
    setEditError((prev) => ({ ...prev, [subjectId]: '' }))
  }

  const saveEdit = async (subject: EditableSubject) => {
    const draft = editDrafts[subject.id]
    if (!draft) return
    if (!draft.name.trim()) {
      setEditError((prev) => ({ ...prev, [subject.id]: 'El nombre es obligatorio.' }))
      return
    }
    setEditLoading((prev) => ({ ...prev, [subject.id]: true }))
    setEditError((prev) => ({ ...prev, [subject.id]: '' }))
    try {
      const res = await apiFetch(`/subjects/${subject.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: draft.name.trim(),
          subjectYear: draft.subjectYear,
          year: draft.subjectYear,
          term: draft.term,
        }),
      })
      if (res.status === 401 || res.status === 403) {
        setEditError((prev) => ({ ...prev, [subject.id]: 'Sin permisos para editar.' }))
        return
      }
      if (!res.ok) {
        setEditError((prev) => ({ ...prev, [subject.id]: 'No se pudo guardar.' }))
        return
      }
      setSubjects((prev) =>
        prev.map((s) =>
          s.id === subject.id
            ? { ...s, name: draft.name.trim(), subjectYear: draft.subjectYear, term: draft.term }
            : s
        )
      )
      cancelEdit(subject.id)
    } catch (err) {
      setEditError((prev) => ({
        ...prev,
        [subject.id]: getApiErrorMessage(err, 'Error al guardar.'),
      }))
    } finally {
      setEditLoading((prev) => ({ ...prev, [subject.id]: false }))
    }
  }

  const handleDelete = async (subjectId: string) => {
    if (!window.confirm('¿Eliminar esta materia? Esta acción no se puede deshacer.')) return
    setDeleteLoading((prev) => ({ ...prev, [subjectId]: true }))
    try {
      const res = await apiFetch(`/subjects/${subjectId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.status === 401 || res.status === 403) {
        setError('Sin permisos para eliminar materias.')
        return
      }
      if (!res.ok) {
        setError('No se pudo eliminar la materia.')
        return
      }
      setSubjects((prev) => {
        const remaining = prev.filter((s) => s.id !== subjectId)
        // remove any requirements pointing to deleted subject
        return remaining.map((s) => ({
          ...s,
          requirements: s.requirements.filter((r) => r.id !== subjectId),
        }))
      })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al eliminar.'))
    } finally {
      setDeleteLoading((prev) => ({ ...prev, [subjectId]: false }))
    }
  }

  const openReqForm = (subjectId: string) => {
    setReqFormOpen((prev) => ({ ...prev, [subjectId]: true }))
    setReqDrafts((prev) => ({ ...prev, [subjectId]: { requirementId: '', minStatus: 'passed' } }))
    setReqError((prev) => ({ ...prev, [subjectId]: '' }))
  }

  const closeReqForm = (subjectId: string) => {
    setReqFormOpen((prev) => ({ ...prev, [subjectId]: false }))
    setReqError((prev) => ({ ...prev, [subjectId]: '' }))
  }

  const addRequirement = async (subject: EditableSubject) => {
    const draft = reqDrafts[subject.id]
    if (!draft?.requirementId) {
      setReqError((prev) => ({ ...prev, [subject.id]: 'Selecciona una materia.' }))
      return
    }
    if (subject.requirements.some((r) => r.id === draft.requirementId)) {
      setReqError((prev) => ({ ...prev, [subject.id]: 'Esa correlativa ya existe.' }))
      return
    }
    setReqLoading((prev) => ({ ...prev, [subject.id]: true }))
    setReqError((prev) => ({ ...prev, [subject.id]: '' }))
    try {
      const updatedRequirements = [
        ...subject.requirements.map((r) => ({ id: r.id, minStatus: r.minStatus })),
        { id: draft.requirementId, minStatus: draft.minStatus },
      ]
      const res = await apiFetch(`/subjects/${subject.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirements: updatedRequirements }),
      })
      if (res.status === 401 || res.status === 403) {
        setReqError((prev) => ({ ...prev, [subject.id]: 'Sin permisos para editar.' }))
        return
      }
      if (!res.ok) {
        setReqError((prev) => ({ ...prev, [subject.id]: 'No se pudo agregar la correlativa.' }))
        return
      }
      const reqSubject = subjects.find((s) => s.id === draft.requirementId)
      setSubjects((prev) =>
        prev.map((s) =>
          s.id === subject.id
            ? {
                ...s,
                requirements: [
                  ...s.requirements,
                  {
                    id: draft.requirementId,
                    name: reqSubject?.name ?? draft.requirementId,
                    minStatus: draft.minStatus,
                  },
                ],
              }
            : s
        )
      )
      closeReqForm(subject.id)
    } catch (err) {
      setReqError((prev) => ({
        ...prev,
        [subject.id]: getApiErrorMessage(err, 'Error al agregar correlativa.'),
      }))
    } finally {
      setReqLoading((prev) => ({ ...prev, [subject.id]: false }))
    }
  }

  const removeRequirement = async (subject: EditableSubject, reqId: string) => {
    const key = `${subject.id}-${reqId}`
    setRemoveReqLoading((prev) => ({ ...prev, [key]: true }))
    try {
      const updatedRequirements = subject.requirements
        .filter((r) => r.id !== reqId)
        .map((r) => ({ id: r.id, minStatus: r.minStatus }))
      const res = await apiFetch(`/subjects/${subject.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirements: updatedRequirements }),
      })
      if (!res.ok) return
      setSubjects((prev) =>
        prev.map((s) =>
          s.id === subject.id
            ? { ...s, requirements: s.requirements.filter((r) => r.id !== reqId) }
            : s
        )
      )
    } catch {
      // silently fail; user can retry
    } finally {
      setRemoveReqLoading((prev) => ({ ...prev, [key]: false }))
    }
  }

  if (isLoadingUser || loading) {
    return (
      <ClientPageShell mainClassName="max-w-4xl py-10">
        <div className="space-y-4">
          <div className="h-6 w-48 rounded-full bg-slate-200 animate-pulse" />
          <div className="h-8 w-2/3 rounded-xl bg-slate-200 animate-pulse" />
          <div className="h-48 rounded-2xl bg-slate-200 animate-pulse" />
          <div className="h-32 rounded-2xl bg-slate-200 animate-pulse" />
        </div>
      </ClientPageShell>
    )
  }

  if (error || !program) {
    return (
      <ClientPageShell mainClassName="max-w-3xl py-12">
        <h2 className="text-2xl text-slate-900">{error ?? 'No se pudo cargar la carrera.'}</h2>
        <Link href={`/carreras/${id}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Volver al detalle
        </Link>
      </ClientPageShell>
    )
  }

  const renderSubjectCard = (subject: EditableSubject) => {
    const isEditing = !!editDrafts[subject.id]
    const draft = editDrafts[subject.id]
    const isDeleting = deleteLoading[subject.id]
    const isSaving = editLoading[subject.id]
    const isReqOpen = reqFormOpen[subject.id]
    const reqDraft = reqDrafts[subject.id]
    const isReqSaving = reqLoading[subject.id]

    const availableReqs = subjects.filter(
      (s) => s.id !== subject.id && !subject.requirements.some((r) => r.id === s.id)
    )

    return (
      <div key={subject.id} className="bg-white rounded-xl border border-slate-100 p-4 space-y-3">
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre</label>
              <input
                type="text"
                value={draft.name}
                onChange={(e) => setEditDrafts((prev) => ({ ...prev, [subject.id]: { ...draft, name: e.target.value } }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Año</label>
                <select
                  value={draft.subjectYear ?? ''}
                  onChange={(e) =>
                    setEditDrafts((prev) => ({
                      ...prev,
                      [subject.id]: { ...draft, subjectYear: e.target.value ? Number(e.target.value) : null },
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <option value="">Sin año</option>
                  {YEAR_OPTIONS.map((y) => (
                    <option key={y} value={y}>{y}° año</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Cursada</label>
                <select
                  value={draft.term}
                  onChange={(e) =>
                    setEditDrafts((prev) => ({
                      ...prev,
                      [subject.id]: { ...draft, term: e.target.value as SubjectTerm },
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  {Object.entries(TERM_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            {editError[subject.id] && (
              <p className="text-xs text-red-600">{editError[subject.id]}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => saveEdit(subject)}
                disabled={isSaving}
                className="inline-flex items-center gap-1 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-800 disabled:opacity-60"
              >
                <Check className="w-3 h-3" />
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={() => cancelEdit(subject.id)}
                disabled={isSaving}
                className="inline-flex items-center gap-1 bg-white text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 hover:border-slate-300"
              >
                <X className="w-3 h-3" />
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{subject.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{TERM_LABELS[subject.term]}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => startEdit(subject)}
                className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 px-2 py-1 rounded-lg border border-slate-200 hover:border-slate-300 text-xs font-semibold transition-colors"
              >
                <Pencil className="w-3 h-3" />
                Editar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(subject.id)}
                disabled={isDeleting}
                className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 px-2 py-1 rounded-lg border border-rose-200 hover:border-rose-300 text-xs font-semibold transition-colors disabled:opacity-60"
              >
                <Trash2 className="w-3 h-3" />
                {isDeleting ? '...' : 'Eliminar'}
              </button>
            </div>
          </div>
        )}

        {/* Requirements */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Correlativas</p>
          {subject.requirements.length === 0 ? (
            <p className="text-xs text-slate-400">Sin correlativas</p>
          ) : (
            <div className="space-y-1">
              {subject.requirements.map((req) => {
                const removeKey = `${subject.id}-${req.id}`
                return (
                  <div key={req.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-2.5 py-1.5">
                    <div>
                      <span className="text-xs text-slate-700 font-medium">{req.name}</span>
                      <span className={`ml-2 text-[10px] font-semibold rounded-full px-1.5 py-0.5 ${
                        req.minStatus === 'final_pending'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {req.minStatus === 'final_pending' ? 'Final pendiente' : 'Aprobada'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRequirement(subject, req.id)}
                      disabled={removeReqLoading[removeKey]}
                      className="text-rose-500 hover:text-rose-700 text-xs font-semibold disabled:opacity-60"
                    >
                      {removeReqLoading[removeKey] ? '...' : 'Quitar'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {isReqOpen ? (
            <div className="mt-2 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={reqDraft?.requirementId ?? ''}
                  onChange={(e) =>
                    setReqDrafts((prev) => ({
                      ...prev,
                      [subject.id]: { ...prev[subject.id], requirementId: e.target.value },
                    }))
                  }
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <option value="">Selecciona materia</option>
                  {availableReqs.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <select
                  value={reqDraft?.minStatus ?? 'passed'}
                  onChange={(e) =>
                    setReqDrafts((prev) => ({
                      ...prev,
                      [subject.id]: { ...prev[subject.id], minStatus: e.target.value as MinStatus },
                    }))
                  }
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <option value="passed">Aprobada</option>
                  <option value="final_pending">Final pendiente</option>
                </select>
              </div>
              {reqError[subject.id] && (
                <p className="text-xs text-red-600">{reqError[subject.id]}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => addRequirement(subject)}
                  disabled={isReqSaving}
                  className="inline-flex items-center gap-1 bg-slate-900 text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-slate-800 disabled:opacity-60"
                >
                  <Check className="w-3 h-3" />
                  {isReqSaving ? 'Guardando...' : 'Agregar'}
                </button>
                <button
                  type="button"
                  onClick={() => closeReqForm(subject.id)}
                  className="inline-flex items-center gap-1 text-slate-600 px-3 py-1 rounded-lg text-xs font-semibold border border-slate-200 hover:border-slate-300"
                >
                  <X className="w-3 h-3" />
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openReqForm(subject.id)}
              className="mt-2 inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 text-xs font-semibold"
            >
              <Plus className="w-3 h-3" />
              Agregar correlativa
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <ClientPageShell mainClassName="max-w-4xl py-10">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/carreras/${id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al detalle
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">{program.name}</h1>
        {program.university?.name && (
          <p className="mt-1 text-slate-500 text-sm">{program.university.name}</p>
        )}
        {!isAdmin && (
          <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 inline-block">
            Solo puedes editar esta carrera mientras no sea aprobada y publicada.
          </p>
        )}
      </div>

      {/* Add Subject Form */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Agregar nueva materia</h2>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre</label>
            <input
              type="text"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder="Ej: Algebra I"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddSubject() }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Año</label>
            <select
              value={addYear}
              onChange={(e) => setAddYear(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>{y}° año</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Cursada</label>
            <select
              value={addTerm}
              onChange={(e) => setAddTerm(e.target.value as SubjectTerm)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              {Object.entries(TERM_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
        </div>
        {addError && <p className="mt-2 text-sm text-red-600">{addError}</p>}
        <button
          type="button"
          onClick={handleAddSubject}
          disabled={addLoading}
          className="mt-4 inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-60 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {addLoading ? 'Agregando...' : 'Agregar materia'}
        </button>
      </section>

      {/* Subject List */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Materias</h2>
        <p className="text-sm text-slate-500 mb-6">{subjects.length} {subjects.length === 1 ? 'materia' : 'materias'} en total</p>

        {subjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
            Esta carrera aún no tiene materias. Usa el formulario de arriba para agregar la primera.
          </div>
        ) : (
          <div className="space-y-8">
            {/* Subjects without year */}
            {(subjectsByYear['null'] ?? []).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Sin año asignado</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {subjectsByYear['null'].map(renderSubjectCard)}
                </div>
              </div>
            )}

            {/* Subjects by year */}
            {sortedYearKeys.map((yearKey) => (
              <div key={yearKey}>
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
                  {yearKey}° Año
                  <span className="ml-2 text-xs text-slate-400 font-normal normal-case">
                    ({subjectsByYear[yearKey].length} {subjectsByYear[yearKey].length === 1 ? 'materia' : 'materias'})
                  </span>
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {subjectsByYear[yearKey].map(renderSubjectCard)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </ClientPageShell>
  )
}
