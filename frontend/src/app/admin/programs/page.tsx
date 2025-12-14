import { Card } from "@/components/admin/baseComponents";
import { useMemo } from "react";

export default function ProgramsPage() {
  type programsData = {
    name:string,
    university:string,
    subjects:number,
    updated:string
  }
  const programsData = useMemo(() => [
    { name: 'Ingeniería en Sistemas', university: 'Universidad Nacional', subjects: 45, updated: '12/10/2025' },
    { name: 'Licenciatura en Matemática', university: 'Universidad de Buenos Aires', subjects: 38, updated: '10/10/2025' },
    { name: 'Ingeniería Industrial', university: 'Universidad Tecnológica', subjects: 42, updated: '08/10/2025' },
    { name: 'Ingeniería Química', university: 'Universidad Nacional', subjects: 40, updated: '05/10/2025' },
    { name: 'Licenciatura en Física', university: 'Universidad de Buenos Aires', subjects: 36, updated: '02/10/2025' },
    { name: 'Ingeniería Electrónica', university: 'Universidad Tecnológica', subjects: 44, updated: '28/09/2025' },
  ], []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Carreras</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestiona las carreras disponibles en la plataforma</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900">
          + Agregar carrera
        </button>
      </div>

      {/* Grid de cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programsData.map((program, idx) => (
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
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{program.university}</p>
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Materias</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{program.subjects}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">Actualizado</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{program.updated}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}