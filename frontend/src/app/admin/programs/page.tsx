'use client'
import Link from "next/link";
import { Card } from "@/components/admin/baseComponents";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DegreeProgram } from "@/types/degreeProgram";
import { apiFetchJson, getApiErrorMessage } from "@/lib/api";

type ProgramData = {
  count: number
  data: DegreeProgram[]
}

export default function ProgramsPage() {
  const [error, setError] = useState<null | string>(null)
  const [programs, setPrograms] = useState<DegreeProgram[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }), [])

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetchJson<ProgramData>('/degreeProgram');
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

      {/* Grid de cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs.map((program, idx) => (
          <Card key={idx} className="p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                {program.name.charAt(0)}
              </div>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{program.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{program.university.name}</p>
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Materias</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{program.subjects ? program.subjects.length : 0}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">Actualizado</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {program.updated_at ? dateFormatter.format(new Date(program.updated_at)) : '—'}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
