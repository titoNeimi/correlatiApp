'use client';

import { useUser } from '@/context/UserContext'
import { useCallback, useMemo, useState } from 'react'
import UserSubjectsGate from '@/components/userSubjectGate'
import { SubjectStatus, SubjectsFromProgram, SubjectDTO } from '@/types/subjects'
import { computeAvailability } from '@/lib/subject_status';

type Subject = {
  id: string
  name: string
  subjectYear: number
  status: SubjectStatus
}

const statusConfig: Record<SubjectStatus,{ label: string; classes: string; borderColor: string }> = {
  not_available: {
    label: 'No disponible',
    classes: 'bg-gradient-to-br from-gray-200 to-gray-300 border-gray-400 text-gray-600',
    borderColor: 'border-l-gray-400'
  },
  available: {
    label: 'Disponible',
    classes: 'bg-gradient-to-br from-slate-100 to-slate-200 border-slate-300 text-slate-700',
    borderColor: 'border-l-slate-400'
  },
  in_progress: {
    label: 'Cursando',
    classes: 'bg-gradient-to-br from-amber-100 to-orange-200 border-amber-400 text-amber-800',
    borderColor: 'border-l-amber-500'
  },
  passed: {
    label: 'Aprobada',
    classes: 'bg-gradient-to-br from-emerald-100 to-green-200 border-emerald-400 text-emerald-800',
    borderColor: 'border-l-emerald-500'
  },
  passed_with_distinction: {
    label: 'Aprobada con Distinción',
    classes: 'bg-gradient-to-br from-yellow-100 to-yellow-200 border-yellow-400 text-yellow-800',
    borderColor: 'border-l-yellow-500'
  },
  final_pending: {
    label: 'Final Pendiente',
    classes: 'bg-gradient-to-br from-indigo-100 to-blue-200 border-indigo-400 text-indigo-800',
    borderColor: 'border-l-indigo-500'
  }
}

const statusOrder: SubjectStatus[] = ['not_available','available', 'in_progress', 'final_pending', 'passed', 'passed_with_distinction']

export default function SubjectsPage() {
  const { user, isLoading: isLoadingUser } = useUser()

  const [selectedProgramId, setSelectedProgramId] = useState<string>('')
  const [subjectsData, setSubjectsData] = useState<SubjectsFromProgram | null>(null)
  const [subjects, setSubjects] = useState<SubjectDTO[]>([])
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUserSubjects = useCallback(async (programId: string) => {
    if (!programId) return
    try {
      setLoadingSubjects(true)
      setError(null)
      setSelectedProgramId(programId)

      const res = await fetch(`http://localhost:8080/me/subjects/${programId}`, { 
        method: 'GET', credentials: 'include' 
      })

      if (!res.ok) throw new Error('No se pudieron cargar las materias')

      const data: SubjectsFromProgram = await res.json()

      const subjectWithStatus = computeAvailability(data.Subjects ?? [])
      data.Subjects = subjectWithStatus

      setSubjectsData(data)
      setSubjects(data.Subjects)
      
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado')
    } finally {
      setLoadingSubjects(false)
    }
  }, [])

  const subjectsByYear = useMemo(() => {
    return subjects.reduce<Record<number, Subject[]>>((acc, s) => {
      (acc[s.subjectYear] ||= []).push(s)
      return acc
    }, {})
  }, [subjects])

  const years = useMemo(
    () => Object.keys(subjectsByYear).map(Number).sort((a, b) => a - b),
    [subjectsByYear]
  )

  const handleRightClick = (e: React.MouseEvent, subjectId: string) => {
    e.preventDefault()
    if( subjects.find(s => s.id === subjectId)?.status === 'not_available' ) return
    setSubjects(prev => {
      const updated = prev.map(s => {
      if (s.id !== subjectId) return s
      const i = statusOrder.indexOf(s.status)
      const next = statusOrder[(i + 1) % statusOrder.length]
      return { ...s, status: next }
      })
      return computeAvailability(updated)
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <UserSubjectsGate
        user={user ? { id: user.id, degreeProgramIds: user.degreeProgramIds } : null}
        isLoading={isLoadingUser}
        fetchUserSubjects={fetchUserSubjects}
      />

      {loadingSubjects && (
        <p className="mt-4 text-sm text-gray-600">Cargando materias…</p>
      )}
      {error && (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      )}

      {subjectsData && (
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-6 sm:p-8">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">
                {subjectsData.Name}
              </h1>
              <p className="text-lg sm:text-xl opacity-90">
                {subjectsData.University}
              </p>
              <p className="text-sm mt-4 opacity-75">
                Click derecho en cualquier materia para cambiar su estado
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Estados de las Materias</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {Object.entries(statusConfig).map(([status, config]) => (
                <div key={status} className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded border-2 ${config.classes}`} />
                  <span className="text-sm text-gray-700">{config.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {years.map(year => (
              <div key={year} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white p-4 text-center">
                  <h2 className="text-xl font-bold">{year}° Año</h2>
                  <p className="text-sm opacity-75">
                    {subjectsByYear[year].length} materias
                  </p>
                </div>

                <div className="p-4 space-y-3">
                  {subjectsByYear[year].map(s => (
                    <div
                      key={s.id}
                      onContextMenu={(e) => handleRightClick(e, s.id)}
                      className={`
                        p-4 rounded-lg border-2 border-l-4 cursor-pointer
                        transform transition-all duration-300 hover:scale-105 hover:shadow-lg
                        ${statusConfig[s.status].classes}
                        ${statusConfig[s.status].borderColor}
                        select-none
                      `}
                    >
                      <h4 className="font-semibold text-sm leading-tight mb-2">{s.name}</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-xs opacity-75">{statusConfig[s.status].label}</span>
                        <div className="w-2 h-2 rounded-full bg-current opacity-50"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-8 my-8 text-white">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
              {Object.entries(statusConfig).map(([status, config]) => {
                const count = subjects.filter(s => s.status === status).length
                return (
                  <div key={status}>
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-sm opacity-75">{config.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
