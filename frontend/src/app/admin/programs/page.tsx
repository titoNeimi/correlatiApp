'use client'
import Link from "next/link";
import { Card } from "@/components/admin/baseComponents";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DegreeProgram } from "@/types/degreeProgram";
import { apiFetch, apiFetchJson, getApiErrorMessage } from "@/lib/api";

type ProgramData = {
  count: number
  data: DegreeProgram[]
}

export default function ProgramsPage() {
  const [error, setError] = useState<null | string>(null)
  const [programs, setPrograms] = useState<DegreeProgram[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [search, setSearch] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [publicFilter, setPublicFilter] = useState<'all' | 'public' | 'private'>('all')
  const [page, setPage] = useState<number>(1)
  const [perPage, setPerPage] = useState<number>(12)
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }), [])

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetchJson<ProgramData>('/degreeProgram', { credentials: 'include' });
      setPrograms(data.data);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setError(getApiErrorMessage(error, "Error desconocido"));
      setLoading(false);
    }
  }, []);

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

  const totalPages = Math.max(1, Math.ceil(filteredPrograms.length / perPage))
  const pageSafe = Math.min(page, totalPages)
  const pagedPrograms = useMemo(() => {
    const start = (pageSafe - 1) * perPage
    return filteredPrograms.slice(start, start + perPage)
  }, [filteredPrograms, pageSafe, perPage])

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
        {pagedPrograms.map((program, idx) => (
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
            <div className="mt-3 flex justify-end">
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
