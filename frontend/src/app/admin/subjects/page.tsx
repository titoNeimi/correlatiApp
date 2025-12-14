'use client';

import { useState, useMemo } from 'react';
import DataTable from '@/components/admin/dataTable';
import { Card, Badge } from '@/components/admin/baseComponents';

export default function SubjectsPage() {
  const [yearFilter, setYearFilter] = useState<string>('all');

  const subjectsData = useMemo(() => [
    { name: 'Álgebra I', year: 1, program: 'Ingeniería en Sistemas', requirements: ['Ninguno'], status: 'pending' },
    { name: 'Análisis Matemático I', year: 1, program: 'Ingeniería en Sistemas', requirements: ['Ninguno'], status: 'approved' },
    { name: 'Física I', year: 1, program: 'Ingeniería en Sistemas', requirements: ['Ninguno'], status: 'approved' },
    { name: 'Álgebra II', year: 2, program: 'Ingeniería en Sistemas', requirements: ['Álgebra I'], status: 'pending' },
    { name: 'Análisis Matemático II', year: 2, program: 'Ingeniería en Sistemas', requirements: ['Análisis Matemático I'], status: 'approved' },
    { name: 'Probabilidad y Estadística', year: 2, program: 'Ingeniería en Sistemas', requirements: ['Álgebra I', 'Análisis Matemático I'], status: 'in_progress' },
    { name: 'Algoritmos y Estructuras de Datos', year: 2, program: 'Ingeniería en Sistemas', requirements: ['Ninguno'], status: 'approved' },
    { name: 'Base de Datos', year: 3, program: 'Ingeniería en Sistemas', requirements: ['Algoritmos y Estructuras de Datos'], status: 'pending' },
    { name: 'Sistemas Operativos', year: 3, program: 'Ingeniería en Sistemas', requirements: ['Algoritmos y Estructuras de Datos'], status: 'in_progress' },
    { name: 'Redes de Computadoras', year: 3, program: 'Ingeniería en Sistemas', requirements: ['Ninguno'], status: 'pending' },
  ], []);

  const columns = useMemo(() => [
    { key: 'name', label: 'Nombre', width: '25%' },
    { key: 'year', label: 'Año', width: '10%' },
    { key: 'program', label: 'Carrera', width: '25%' },
    { key: 'requirements', label: 'Requisitos', width: '25%' },
    { key: 'status', label: 'Estado', width: '15%' },
  ], []);

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { variant: 'warning' as const, label: 'Pendiente' },
      approved: { variant: 'success' as const, label: 'Aprobada' },
      in_progress: { variant: 'info' as const, label: 'En curso' },
    };
    const config = statusMap[status as keyof typeof statusMap];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const tableData = useMemo(() => {
    return subjectsData
      .filter(subject => yearFilter === 'all' || subject.year.toString() === yearFilter)
      .map(subject => ({
        name: subject.name,
        year: `${subject.year}°`,
        program: subject.program,
        requirements: (
          <div className="flex flex-wrap gap-1">
            {subject.requirements.map((req, idx) => (
              <Badge key={idx} variant="default" size="sm">{req}</Badge>
            ))}
          </div>
        ),
        status: getStatusBadge(subject.status),
      }));
  }, [subjectsData, yearFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Materias</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestiona las materias de cada carrera</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900">
          + Agregar materia
        </button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtrar por año:</span>
          <div className="flex flex-wrap gap-2">
            {['all', '1', '2', '3'].map(year => (
              <button
                key={year}
                onClick={() => setYearFilter(year)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  yearFilter === year
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {year === 'all' ? 'Todos' : `${year}° Año`}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <DataTable columns={columns} data={tableData} />
      </Card>
    </div>
  );
}