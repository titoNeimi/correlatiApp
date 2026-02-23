'use client'
import Link from "next/link";
import { Card } from "@/components/admin/baseComponents";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DegreeProgram } from "@/types/degreeProgram";
import { apiFetch, apiFetchJson, getApiErrorMessage } from "@/lib/api";
type University = { id: string; name: string }

type SeedRequirement = {
  subjectCode: string
  type: 'approved' | 'regularized'
}

type SeedSubject = {
  code: string
  name: string
  subjectYear: number
  term: 'annual' | 'semester' | 'quarterly' | 'bimonthly'
  is_elective: boolean
  requirements: SeedRequirement[]
}

type JsonToDegreeProgram = {
  degreeProgram: {
    name: string
    UniversityID: string
  }
  subjects: SeedSubject[]
}

function ImportJsonModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [universities, setUniversities] = useState<University[]>([])
  const [loadingUniversities, setLoadingUniversities] = useState(true)
  const [selectedUniversity, setSelectedUniversity] = useState<string>('')
  const [fileError, setFileError] = useState<string | null>(null)
  const [droppedFile, setDroppedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    apiFetchJson<{ data: University[] }>('/universities', { credentials: 'include' })
      .then((res) => setUniversities(res.data))
      .catch(() => setUniversities([]))
      .finally(() => setLoadingUniversities(false))
  }, [])

  const handleFile = (file: File) => {
    setFileError(null)
    setDroppedFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleSubmit = () => {
    setFileError(null)
    const file = droppedFile ?? fileInputRef.current?.files?.[0]
    if (!selectedUniversity) {
      setFileError('Seleccioná una universidad.')
      return
    }
    if (!file) {
      setFileError('Seleccioná un archivo JSON.')
      return
    }
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string
        const parsed: JsonToDegreeProgram = JSON.parse(text)
        parsed.degreeProgram.UniversityID = selectedUniversity
        setSubmitting(true)
        const response = await apiFetch('/degreeProgram/seed', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed),
        })
        if (!response.ok) {
          const msg = await response.text().catch(() => '')
          setFileError(msg || `Error al importar (${response.status})`)
          return
        }
        onSuccess()
        onClose()
      } catch (err) {
        if (err instanceof SyntaxError) {
          setFileError('El archivo no es un JSON válido.')
        } else {
          setFileError(getApiErrorMessage(err, 'Error al importar la carrera'))
        }
      } finally {
        setSubmitting(false)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl w-full max-w-md mx-4 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Importar carrera desde JSON</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Universidad</label>
          {loadingUniversities ? (
            <div className="h-9 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ) : (
            <div className="relative">
              <select
                value={selectedUniversity}
                onChange={(e) => setSelectedUniversity(e.target.value)}
                className="w-full appearance-none px-3 py-2 pr-9 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="">Seleccioná una universidad</option>
                {universities.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 dark:text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Archivo JSON</label>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 cursor-pointer transition-colors duration-150 ${
              isDragging
                ? 'border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30'
                : droppedFile
                ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleInputChange}
            />
            {droppedFile ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-500 dark:text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{droppedFile.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Clic para cambiar el archivo</p>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300 dark:text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-blue-600 dark:text-blue-400">Seleccioná</span> o arrastrá un archivo
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Solo archivos .json</p>
              </>
            )}
          </div>
        </div>

        {fileError && (
          <p className="text-sm text-red-600 dark:text-red-400">{fileError}</p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            {submitting ? 'Importando...' : 'Importar'}
          </button>
        </div>
      </div>
    </div>
  )
}

type ProgramData = {
  count: number
  page?: number
  limit?: number
  data: DegreeProgram[]
}

export default function ProgramsPage() {
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [error, setError] = useState<null | string>(null)
  const [programs, setPrograms] = useState<DegreeProgram[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [search, setSearch] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [publicFilter, setPublicFilter] = useState<'all' | 'public' | 'private'>('all')
  const [page, setPage] = useState<number>(1)
  const [perPage, setPerPage] = useState<number>(12)
  const [totalCount, setTotalCount] = useState<number>(0)
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }), [])

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: perPage.toString() });
      const data = await apiFetchJson<ProgramData>(`/degreeProgram?${params.toString()}`, { credentials: 'include' });
      setPrograms(data.data);
      setTotalCount(typeof data.count === 'number' ? data.count : data.data.length);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setError(getApiErrorMessage(error, "Error desconocido"));
      setLoading(false);
    }
  }, [page, perPage]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, publicFilter, perPage])

  const handleApprove = useCallback(async (programId: string) => {
    try {
      const response = await apiFetch(`/degreeProgram/${programId}/approve`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error(`Error aprobando carrera (${response.status})`)
      }
      await fetchPrograms()
    } catch (error) {
      console.log(error)
      setError(getApiErrorMessage(error, 'No se pudo aprobar la carrera'))
    }
  }, [fetchPrograms])

  const handleUnapprove = useCallback(async (programId: string) => {
    try {
      const response = await apiFetch(`/degreeProgram/${programId}/unapprove`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error(`Error desaprobando carrera (${response.status})`)
      }
      await fetchPrograms()
    } catch (error) {
      console.log(error)
      setError(getApiErrorMessage(error, 'No se pudo desaprobar la carrera'))
    }
  }, [fetchPrograms])

  const handlePublish = useCallback(async (programId: string) => {
    try {
      const response = await apiFetch(`/degreeProgram/${programId}/publish`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error(`Error publicando carrera (${response.status})`)
      }
      await fetchPrograms()
    } catch (error) {
      console.log(error)
      setError(getApiErrorMessage(error, 'No se pudo publicar la carrera'))
    }
  }, [fetchPrograms])

  const handleUnpublish = useCallback(async (programId: string) => {
    try {
      const response = await apiFetch(`/degreeProgram/${programId}/unpublish`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error(`Error despublicando carrera (${response.status})`)
      }
      await fetchPrograms()
    } catch (error) {
      console.log(error)
      setError(getApiErrorMessage(error, 'No se pudo despublicar la carrera'))
    }
  }, [fetchPrograms])

  const handleDelete = useCallback(async (programId: string) => {
    if (!window.confirm('¿Seguro que querés eliminar esta carrera? Esta acción no se puede deshacer.')) {
      return
    }
    try {
      const response = await apiFetch(`/degreeProgram/${programId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error(`Error eliminando carrera (${response.status})`)
      }
      await fetchPrograms()
    } catch (error) {
      console.log(error)
      setError(getApiErrorMessage(error, 'No se pudo eliminar la carrera'))
    }
  }, [fetchPrograms])

  const filteredPrograms = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    return programs.filter((program) => {
      if (statusFilter !== 'all' && program.approvalStatus !== statusFilter) {
        return false
      }
      if (publicFilter === 'public' && !program.publicRequested) {
        return false
      }
      if (publicFilter === 'private' && program.publicRequested) {
        return false
      }
      if (!normalized) return true
      const haystack = `${program.name} ${program.university?.name ?? ''}`.toLowerCase()
      return haystack.includes(normalized)
    })
  }, [programs, search, statusFilter, publicFilter])

  const totalPages = Math.max(1, Math.ceil(totalCount / perPage))
  const pageSafe = Math.min(page, totalPages)

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  if(loading){
    return (
      <div className="space-y-4">
        <div className="h-10 w-40 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 animate-pulse space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl" />
                <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-lg" />
              </div>
              <div className="h-4 w-32 bg-gray-100 dark:bg-gray-700 rounded" />
              <div className="h-3 w-24 bg-gray-100 dark:bg-gray-700 rounded" />
              <div className="flex justify-between pt-2">
                <div className="h-4 w-16 bg-gray-100 dark:bg-gray-700 rounded" />
                <div className="h-4 w-20 bg-gray-100 dark:bg-gray-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if(error){
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30 p-4 text-sm text-red-800 dark:text-red-200">
          Error: {error}
        </div>
        <button
          onClick={fetchPrograms}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {importModalOpen && <ImportJsonModal onClose={() => setImportModalOpen(false)} onSuccess={fetchPrograms} />}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Carreras</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestiona las carreras disponibles en la plataforma</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/programs/subjects"
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              Materias
            </Link>
            <button
              onClick={() => setImportModalOpen(true)}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              Importar JSON
            </button>
            <Link href={"/carreras/crear"} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900">
              + Agregar carrera
            </Link>
          </div>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-2 rounded-lg text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">Carreras</span>
          <Link
            href="/admin/programs/subjects"
            className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
          >
            Materias
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por carrera o universidad"
            className="w-full sm:w-72 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="approved">Aprobadas</option>
            <option value="rejected">Rechazadas</option>
          </select>
          <select
            value={publicFilter}
            onChange={(event) => setPublicFilter(event.target.value as typeof publicFilter)}
            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
          >
            <option value="all">Todas</option>
            <option value="public">Publicas</option>
            <option value="private">Privadas</option>
          </select>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
          <span>{filteredPrograms.length} resultados</span>
          <select
            value={perPage}
            onChange={(event) => setPerPage(Number(event.target.value))}
            className="px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
          >
            <option value={8}>8 por pagina</option>
            <option value={12}>12 por pagina</option>
            <option value={24}>24 por pagina</option>
          </select>
        </div>
      </div>

      {/* Grid de cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPrograms.map((program, idx) => (
          <Card key={idx} className="p-4 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                {program.name.charAt(0)}
              </div>
              <div className="flex gap-2">
                {program.approvalStatus === 'approved' && (
                  <button
                    onClick={() => handleUnapprove(program.id)}
                    className="px-2 py-1 text-[11px] font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors duration-200"
                  >
                    Desaprobar
                  </button>
                )}
                {program.approvalStatus === 'pending' && (
                  <button
                    onClick={() => handleApprove(program.id)}
                    className="px-2 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors duration-200"
                  >
                    Aprobar
                  </button>
                )}
                {program.approvalStatus === 'approved' && !program.publicRequested && (
                  <button
                    onClick={() => handlePublish(program.id)}
                    className="px-2 py-1 text-[11px] font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200"
                  >
                    Publicar
                  </button>
                )}
                {program.approvalStatus === 'approved' && program.publicRequested && (
                  <button
                    onClick={() => handleUnpublish(program.id)}
                    className="px-2 py-1 text-[11px] font-semibold bg-slate-600 hover:bg-slate-700 text-white rounded-md transition-colors duration-200"
                  >
                    Despublicar
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{program.name}</h3>
              {program.approvalStatus === 'pending' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">
                  Pendiente
                </span>
              )}
              {program.approvalStatus === 'approved' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                  Aprobada
                </span>
              )}
              {program.publicRequested ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
                  Publica
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                  Privada
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{program.university.name}</p>
            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
              <span>{program.subjects ? program.subjects.length : 0} materias</span>
              <span>{program.updated_at ? dateFormatter.format(new Date(program.updated_at)) : '—'}</span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <Link
                href={`/carreras/${program.id}/editar`}
                className="px-2 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 rounded-md transition-colors duration-200"
              >
                Editar materias
              </Link>
              <button
                onClick={() => handleDelete(program.id)}
                className="px-2 py-1 text-[11px] font-semibold text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-md transition-colors duration-200"
              >
                Eliminar
              </button>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Pagina {pageSafe} de {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={pageSafe === 1}
            className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={pageSafe >= totalPages}
            className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
