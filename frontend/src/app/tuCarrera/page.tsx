'use client'

import { useState } from 'react'

interface Subject {
  id: string
  name: string
  subjectYear: number
  status: 'available' | 'in_progress' | 'passed_with_distinction' | 'final_pending' | 'passed'
}

interface DegreeProgram {
  id: string
  name: string
  university: string
  subjects: Subject[]
}

// Datos de ejemplo
const mockDegreeProgram: DegreeProgram = {
  id: '1',
  name: 'Ingeniería en Sistemas',
  university: 'Universidad Tecnológica Nacional',
  subjects: [
    // Primer año
    { id: '1', name: 'Análisis Matemático I', subjectYear: 1, status: 'passed' },
    { id: '2', name: 'Álgebra y Geometría Analítica', subjectYear: 1, status: 'passed' },
    { id: '3', name: 'Sistemas de Representación', subjectYear: 1, status: 'passed_with_distinction' },
    { id: '4', name: 'Inglés I', subjectYear: 1, status: 'passed' },
    { id: '5', name: 'Introducción a los Algoritmos', subjectYear: 1, status: 'passed' },
    { id: '6', name: 'Química', subjectYear: 1, status: 'final_pending' },
    
    // Segundo año
    { id: '7', name: 'Análisis Matemático II', subjectYear: 2, status: 'in_progress' },
    { id: '8', name: 'Física I', subjectYear: 2, status: 'in_progress' },
    { id: '9', name: 'Matemática Discreta', subjectYear: 2, status: 'passed' },
    { id: '10', name: 'Inglés II', subjectYear: 2, status: 'available' },
    { id: '11', name: 'Algoritmos y Estructura de Datos', subjectYear: 2, status: 'in_progress' },
    { id: '12', name: 'Arquitectura de Computadoras', subjectYear: 2, status: 'available' },
    
    // Tercer año
    { id: '13', name: 'Análisis Matemático III', subjectYear: 3, status: 'available' },
    { id: '14', name: 'Física II', subjectYear: 3, status: 'available' },
    { id: '15', name: 'Probabilidad y Estadística', subjectYear: 3, status: 'available' },
    { id: '16', name: 'Paradigmas de Programación', subjectYear: 3, status: 'available' },
    { id: '17', name: 'Sistemas Operativos', subjectYear: 3, status: 'available' },
    { id: '18', name: 'Base de Datos', subjectYear: 3, status: 'available' },
    
    // Cuarto año
    { id: '19', name: 'Comunicaciones', subjectYear: 4, status: 'available' },
    { id: '20', name: 'Redes de Datos', subjectYear: 4, status: 'available' },
    { id: '21', name: 'Ingeniería de Software', subjectYear: 4, status: 'available' },
    { id: '22', name: 'Sistemas de Gestión', subjectYear: 4, status: 'available' },
    { id: '23', name: 'Teoría de Control', subjectYear: 4, status: 'available' },
    { id: '24', name: 'Inteligencia Artificial', subjectYear: 4, status: 'available' },
    
    // Quinto año
    { id: '25', name: 'Proyecto Final', subjectYear: 5, status: 'available' },
    { id: '26', name: 'Gestión de Proyectos', subjectYear: 5, status: 'available' },
    { id: '27', name: 'Seguridad Informática', subjectYear: 5, status: 'available' },
    { id: '28', name: 'Economía y Organización', subjectYear: 5, status: 'available' },
  ]
}

const statusConfig = {
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

const statusOrder: Subject['status'][] = [
  'available',
  'in_progress', 
  'final_pending',
  'passed',
  'passed_with_distinction'
]

export default function SubjectsGrid() {
  const [subjects, setSubjects] = useState<Subject[]>(mockDegreeProgram.subjects)

  const handleRightClick = (e: React.MouseEvent, subjectId: string) => {
    e.preventDefault()
    
    setSubjects(prevSubjects => 
      prevSubjects.map(subject => {
        if (subject.id === subjectId) {
          const currentIndex = statusOrder.indexOf(subject.status)
          const nextIndex = (currentIndex + 1) % statusOrder.length
          return {
            ...subject,
            status: statusOrder[nextIndex]
          }
        }
        return subject
      })
    )
  }

  // Agrupar materias por año
  const subjectsByYear = subjects.reduce((acc, subject) => {
    if (!acc[subject.subjectYear]) {
      acc[subject.subjectYear] = []
    }
    acc[subject.subjectYear].push(subject)
    return acc
  }, {} as Record<number, Subject[]>)

  const years = Object.keys(subjectsByYear).map(Number).sort()


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-6 sm:p-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">
              {mockDegreeProgram.name}
            </h1>
            <p className="text-lg sm:text-xl opacity-90">
              {mockDegreeProgram.university}
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
                <div className={`w-4 h-4 rounded border-2 ${config.classes}`}></div>
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
                {subjectsByYear[year].map(subject => (
                  <div
                    key={subject.id}
                    onContextMenu={(e) => handleRightClick(e, subject.id)}
                    className={`
                      p-4 rounded-lg border-2 border-l-4 cursor-pointer
                      transform transition-all duration-300 hover:scale-105 hover:shadow-lg
                      ${statusConfig[subject.status].classes}
                      ${statusConfig[subject.status].borderColor}
                      select-none
                    `}
                  >
                    <h4 className="font-semibold text-sm leading-tight mb-2">
                      {subject.name}
                    </h4>
                    <div className="flex items-center justify-between">
                      <span className="text-xs opacity-75">
                        {statusConfig[subject.status].label}
                      </span>
                      <div className="w-2 h-2 rounded-full bg-current opacity-50"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer con estadísticas */}
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
    </div>
  )
}