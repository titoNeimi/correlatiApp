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
type ElectiveRequirementType = 'hours' | 'credits' | 'subject_count'

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
  is_elective: boolean
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
  is_elective: boolean
}

type AddReqDraft = {
  requirementId: string
  minStatus: MinStatus
}

type ElectivePoolEntry = {
  id: string
  name: string
  description?: string
  subjects?: { id: string; name: string }[]
}

type ElectiveRuleEntry = {
  id: string
  pool_id: string
  applies_from_year: number
  applies_to_year?: number | null
  requirement_type: ElectiveRequirementType
  minimum_value: number
  pool?: ElectivePoolEntry
}

const TERM_LABELS: Record<SubjectTerm, string> = {
  annual: 'Anual',
  semester: 'Semestral',
  quarterly: 'Cuatrimestral',
  bimonthly: 'Bimestral',
}

const REQ_TYPE_LABELS: Record<ElectiveRequirementType, string> = {
  hours: 'Horas',
  credits: 'Créditos',
  subject_count: 'Cantidad de materias',
}

const YEAR_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8]

async function fetchProgram(id: string): Promise<ProgramInfo | null> {
  const res = await apiFetch(`/degreeProgram/${id}`, { credentials: 'include', cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

async function fetchSubjects(programId: string): Promise<EditableSubject[]> {
  const res = await apiFetch(`/subjects/${programId}`, { credentials: 'include', cache: 'no-store' })
  if (!res.ok) return []
  const raw = await res.json()
  return (raw as Array<{
    id: string
    name: string
    subjectYear?: number | null
    year?: number | null
    term?: string
    is_elective?: boolean
    requirements?: Array<{ id: string; name?: string; minStatus?: string }>
  }>).map((s) => ({
    id: s.id,
    name: s.name,
    subjectYear: s.subjectYear ?? s.year ?? null,
    term: (s.term as SubjectTerm) || 'annual',
    is_elective: s.is_elective ?? false,
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
  const [addIsElective, setAddIsElective] = useState(false)
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

  // elective pools & rules
  const [electivePools, setElectivePools] = useState<ElectivePoolEntry[]>([])
  const [electiveRules, setElectiveRules] = useState<ElectiveRuleEntry[]>([])

  // new pool form
  const [newPoolName, setNewPoolName] = useState('')
  const [newPoolDescription, setNewPoolDescription] = useState('')
  const [newPoolLoading, setNewPoolLoading] = useState(false)
  const [newPoolError, setNewPoolError] = useState<string | null>(null)

  // pool subject draft: poolId -> subjectId
  const [poolSubjectDraft, setPoolSubjectDraft] = useState<Record<string, string>>({})
  const [poolSubjectLoading, setPoolSubjectLoading] = useState<Record<string, boolean>>({})
  const [deletePoolLoading, setDeletePoolLoading] = useState<Record<string, boolean>>({})
  const [removePoolSubjectLoading, setRemovePoolSubjectLoading] = useState<Record<string, boolean>>({})

  // new rule form
  const [newRulePoolId, setNewRulePoolId] = useState('')
  const [newRuleFromYear, setNewRuleFromYear] = useState<number>(1)
  const [newRuleToYear, setNewRuleToYear] = useState<string>('')
  const [newRuleType, setNewRuleType] = useState<ElectiveRequirementType>('subject_count')
  const [newRuleMinValue, setNewRuleMinValue] = useState<number>(1)
  const [newRuleLoading, setNewRuleLoading] = useState(false)
  const [newRuleError, setNewRuleError] = useState<string | null>(null)
  const [deleteRuleLoading, setDeleteRuleLoading] = useState<Record<string, boolean>>({})

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const [prog, subs, poolsRes, rulesRes] = await Promise.all([
        fetchProgram(id),
        fetchSubjects(id),
        apiFetch(`/degreeProgram/${id}/electivePools`, { credentials: 'include', cache: 'no-store' }),
        apiFetch(`/degreeProgram/${id}/electiveRules`, { credentials: 'include', cache: 'no-store' }),
      ])
      if (!prog) {
        setError('No se pudo cargar la carrera.')
        return
      }
      setProgram(prog)
      setSubjects(subs)
      setElectivePools(poolsRes.ok ? await poolsRes.json() : [])
      setElectiveRules(rulesRes.ok ? await rulesRes.json() : [])
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

  const electiveSubjects = useMemo(() => subjects.filter((s) => s.is_elective), [subjects])

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
          is_elective: addIsElective,
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
          is_elective: created.is_elective ?? addIsElective,
          requirements: [],
        },
      ])
      setAddName('')
      setAddIsElective(false)
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
        is_elective: subject.is_elective,
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
          is_elective: draft.is_elective,
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
            ? { ...s, name: draft.name.trim(), subjectYear: draft.subjectYear, term: draft.term, is_elective: draft.is_elective }
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
        return remaining.map((s) => ({
          ...s,
          requirements: s.requirements.filter((r) => r.id !== subjectId),
        }))
      })
      setElectivePools((prev) =>
        prev.map((pool) => ({
          ...pool,
          subjects: pool.subjects?.filter((s) => s.id !== subjectId),
        }))
      )
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

  // ── Elective Pool handlers ──────────────────────────────────────────────────

  const handleCreatePool = async () => {
    if (!newPoolName.trim()) {
      setNewPoolError('El nombre es obligatorio.')
      return
    }
    setNewPoolError(null)
    setNewPoolLoading(true)
    try {
      const res = await apiFetch(`/degreeProgram/${id}/electivePools`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPoolName.trim(),
          description: newPoolDescription.trim() || undefined,
        }),
      })
      if (!res.ok) {
        setNewPoolError('No se pudo crear el pool.')
        return
      }
      const created: ElectivePoolEntry = await res.json()
      setElectivePools((prev) => [...prev, { ...created, subjects: [] }])
      setNewPoolName('')
      setNewPoolDescription('')
    } catch (err) {
      setNewPoolError(getApiErrorMessage(err, 'Error al crear el pool.'))
    } finally {
      setNewPoolLoading(false)
    }
  }

  const handleDeletePool = async (poolId: string) => {
    if (!window.confirm('¿Eliminar este pool? También se eliminarán las reglas asociadas.')) return
    setDeletePoolLoading((prev) => ({ ...prev, [poolId]: true }))
    try {
      const res = await apiFetch(`/degreeProgram/${id}/electivePools/${poolId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) return
      setElectivePools((prev) => prev.filter((p) => p.id !== poolId))
      setElectiveRules((prev) => prev.filter((r) => r.pool_id !== poolId))
    } catch {
      // silently fail
    } finally {
      setDeletePoolLoading((prev) => ({ ...prev, [poolId]: false }))
    }
  }

  const handleAddSubjectToPool = async (poolId: string) => {
    const subjectId = poolSubjectDraft[poolId]
    if (!subjectId) return
    setPoolSubjectLoading((prev) => ({ ...prev, [poolId]: true }))
    try {
      const res = await apiFetch(`/degreeProgram/${id}/electivePools/${poolId}/subjects`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject_id: subjectId }),
      })
      if (!res.ok) return
      const subject = subjects.find((s) => s.id === subjectId)
      setElectivePools((prev) =>
        prev.map((p) =>
          p.id === poolId
            ? { ...p, subjects: [...(p.subjects ?? []), { id: subjectId, name: subject?.name ?? subjectId }] }
            : p
        )
      )
      setPoolSubjectDraft((prev) => ({ ...prev, [poolId]: '' }))
    } catch {
      // silently fail
    } finally {
      setPoolSubjectLoading((prev) => ({ ...prev, [poolId]: false }))
    }
  }

  const handleRemoveSubjectFromPool = async (poolId: string, subjectId: string) => {
    const key = `${poolId}-${subjectId}`
    setRemovePoolSubjectLoading((prev) => ({ ...prev, [key]: true }))
    try {
      const res = await apiFetch(`/degreeProgram/${id}/electivePools/${poolId}/subjects/${subjectId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) return
      setElectivePools((prev) =>
        prev.map((p) =>
          p.id === poolId ? { ...p, subjects: p.subjects?.filter((s) => s.id !== subjectId) } : p
        )
      )
    } catch {
      // silently fail
    } finally {
      setRemovePoolSubjectLoading((prev) => ({ ...prev, [key]: false }))
    }
  }

  // ── Elective Rule handlers ──────────────────────────────────────────────────

  const handleCreateRule = async () => {
    if (!newRulePoolId) {
      setNewRuleError('Seleccioná un pool.')
      return
    }
    if (newRuleMinValue <= 0) {
      setNewRuleError('El valor mínimo debe ser mayor a 0.')
      return
    }
    setNewRuleError(null)
    setNewRuleLoading(true)
    try {
      const res = await apiFetch(`/degreeProgram/${id}/electiveRules`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pool_id: newRulePoolId,
          applies_from_year: newRuleFromYear,
          applies_to_year: newRuleToYear !== '' ? Number(newRuleToYear) : null,
          requirement_type: newRuleType,
          minimum_value: newRuleMinValue,
        }),
      })
      if (!res.ok) {
        setNewRuleError('No se pudo crear la regla.')
        return
      }
      const created: ElectiveRuleEntry = await res.json()
      const pool = electivePools.find((p) => p.id === newRulePoolId)
      setElectiveRules((prev) => [...prev, { ...created, pool }])
      setNewRulePoolId('')
      setNewRuleFromYear(1)
      setNewRuleToYear('')
      setNewRuleType('subject_count')
      setNewRuleMinValue(1)
    } catch (err) {
      setNewRuleError(getApiErrorMessage(err, 'Error al crear la regla.'))
    } finally {
      setNewRuleLoading(false)
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    setDeleteRuleLoading((prev) => ({ ...prev, [ruleId]: true }))
    try {
      const res = await apiFetch(`/degreeProgram/${id}/electiveRules/${ruleId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) return
      setElectiveRules((prev) => prev.filter((r) => r.id !== ruleId))
    } catch {
      // silently fail
    } finally {
      setDeleteRuleLoading((prev) => ({ ...prev, [ruleId]: false }))
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
            <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
              <input
                type="checkbox"
                checked={draft.is_elective}
                onChange={(e) =>
                  setEditDrafts((prev) => ({ ...prev, [subject.id]: { ...draft, is_elective: e.target.checked } }))
                }
                className="w-4 h-4 rounded border-slate-300 focus:ring-slate-400"
              />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Electiva</span>
            </label>
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
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-slate-900">{subject.name}</p>
                {subject.is_elective && (
                  <span className="text-[10px] font-semibold rounded-full px-1.5 py-0.5 bg-violet-100 text-violet-700">
                    Electiva
                  </span>
                )}
              </div>
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
        <label className="mt-4 flex items-center gap-2 cursor-pointer select-none w-fit">
          <input
            type="checkbox"
            checked={addIsElective}
            onChange={(e) => setAddIsElective(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 focus:ring-slate-400"
          />
          <span className="text-sm font-medium text-slate-600">Materia electiva</span>
        </label>
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
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Materias</h2>
        <p className="text-sm text-slate-500 mb-6">{subjects.length} {subjects.length === 1 ? 'materia' : 'materias'} en total</p>

        {subjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
            Esta carrera aún no tiene materias. Usa el formulario de arriba para agregar la primera.
          </div>
        ) : (
          <div className="space-y-8">
            {(subjectsByYear['null'] ?? []).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Sin año asignado</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {subjectsByYear['null'].map(renderSubjectCard)}
                </div>
              </div>
            )}
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

      {/* Elective Pools */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Pools de electivas</h2>
        <p className="text-sm text-slate-500 mb-6">Agrupá materias electivas en pools para definir reglas de cursada.</p>

        {electivePools.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 mb-6">
            {electivePools.map((pool) => {
              const pooledIds = new Set(pool.subjects?.map((s) => s.id) ?? [])
              const availableForPool = electiveSubjects.filter((s) => !pooledIds.has(s.id))
              return (
                <div key={pool.id} className="rounded-xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{pool.name}</p>
                      {pool.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{pool.description}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeletePool(pool.id)}
                      disabled={deletePoolLoading[pool.id]}
                      className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 px-2 py-1 rounded-lg border border-rose-200 hover:border-rose-300 text-xs font-semibold transition-colors disabled:opacity-60 shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                      {deletePoolLoading[pool.id] ? '...' : 'Eliminar'}
                    </button>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                      Materias ({pool.subjects?.length ?? 0})
                    </p>
                    {(pool.subjects?.length ?? 0) === 0 ? (
                      <p className="text-xs text-slate-400">Sin materias asignadas</p>
                    ) : (
                      <div className="space-y-1">
                        {pool.subjects!.map((s) => {
                          const removeKey = `${pool.id}-${s.id}`
                          return (
                            <div key={s.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-2.5 py-1.5">
                              <span className="text-xs text-slate-700 font-medium">{s.name}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveSubjectFromPool(pool.id, s.id)}
                                disabled={removePoolSubjectLoading[removeKey]}
                                className="text-rose-500 hover:text-rose-700 text-xs font-semibold disabled:opacity-60"
                              >
                                {removePoolSubjectLoading[removeKey] ? '...' : 'Quitar'}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  {availableForPool.length > 0 && (
                    <div className="flex gap-2">
                      <select
                        value={poolSubjectDraft[pool.id] ?? ''}
                        onChange={(e) => setPoolSubjectDraft((prev) => ({ ...prev, [pool.id]: e.target.value }))}
                        className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
                      >
                        <option value="">Agregar electiva...</option>
                        {availableForPool.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleAddSubjectToPool(pool.id)}
                        disabled={!poolSubjectDraft[pool.id] || poolSubjectLoading[pool.id]}
                        className="inline-flex items-center gap-1 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-800 disabled:opacity-60"
                      >
                        <Plus className="w-3 h-3" />
                        {poolSubjectLoading[pool.id] ? '...' : 'Agregar'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="rounded-xl border border-slate-200 p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-700">Nuevo pool</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre</label>
              <input
                type="text"
                value={newPoolName}
                onChange={(e) => setNewPoolName(e.target.value)}
                placeholder="Ej: Optativas de especialidad"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Descripción (opcional)</label>
              <input
                type="text"
                value={newPoolDescription}
                onChange={(e) => setNewPoolDescription(e.target.value)}
                placeholder="Descripción del pool"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
          </div>
          {newPoolError && <p className="text-xs text-red-600">{newPoolError}</p>}
          <button
            type="button"
            onClick={handleCreatePool}
            disabled={newPoolLoading}
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-60 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {newPoolLoading ? 'Creando...' : 'Crear pool'}
          </button>
        </div>
      </section>

      {/* Elective Rules */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Reglas de electivas</h2>
        <p className="text-sm text-slate-500 mb-6">Definí requisitos mínimos de cursada para cada pool.</p>

        {electiveRules.length > 0 && (
          <div className="grid gap-3 mb-6">
            {electiveRules.map((rule) => {
              const pool = electivePools.find((p) => p.id === rule.pool_id) ?? rule.pool
              const toYearLabel = rule.applies_to_year ? `hasta ${rule.applies_to_year}°` : 'sin tope'
              return (
                <div key={rule.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 gap-3">
                  <div className="text-sm text-slate-700 min-w-0">
                    <span className="font-semibold">{pool?.name ?? rule.pool_id}</span>
                    <span className="text-slate-500 ml-2">
                      · desde {rule.applies_from_year}° {toYearLabel} · mín. {rule.minimum_value} {REQ_TYPE_LABELS[rule.requirement_type].toLowerCase()}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteRule(rule.id)}
                    disabled={deleteRuleLoading[rule.id]}
                    className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 px-2 py-1 rounded-lg border border-rose-200 hover:border-rose-300 text-xs font-semibold transition-colors disabled:opacity-60 shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                    {deleteRuleLoading[rule.id] ? '...' : 'Eliminar'}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        <div className="rounded-xl border border-slate-200 p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-700">Nueva regla</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pool</label>
              <select
                value={newRulePoolId}
                onChange={(e) => setNewRulePoolId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value="">Seleccioná un pool</option>
                {electivePools.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipo</label>
              <select
                value={newRuleType}
                onChange={(e) => setNewRuleType(e.target.value as ElectiveRequirementType)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                {Object.entries(REQ_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Desde año</label>
              <select
                value={newRuleFromYear}
                onChange={(e) => setNewRuleFromYear(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>{y}° año</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Hasta año (opc.)</label>
              <select
                value={newRuleToYear}
                onChange={(e) => setNewRuleToYear(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value="">Sin tope</option>
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>{y}° año</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Valor mínimo</label>
            <input
              type="number"
              min={1}
              value={newRuleMinValue}
              onChange={(e) => setNewRuleMinValue(Number(e.target.value))}
              className="mt-1 w-32 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          {newRuleError && <p className="text-xs text-red-600">{newRuleError}</p>}
          <button
            type="button"
            onClick={handleCreateRule}
            disabled={newRuleLoading}
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-60 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {newRuleLoading ? 'Creando...' : 'Crear regla'}
          </button>
        </div>
      </section>
    </ClientPageShell>
  )
}
