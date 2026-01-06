'use client';

import { useMemo } from 'react';
import { Card, Badge } from '@/components/admin/baseComponents';

export default function UniversitiesPage() {
  const universities = useMemo(() => [
    { name: 'Universidad Nacional', country: 'Argentina', domains: ['unal.edu.ar'], status: 'published' },
    { name: 'Universidad de Buenos Aires', country: 'Argentina', domains: ['uba.ar'], status: 'draft' },
    { name: 'Universidad Tecnológica', country: 'Argentina', domains: ['utn.edu.ar'], status: 'published' },
  ], []);

  const getStatusBadge = (status: string) => {
    const statusMap = {
      published: { variant: 'success' as const, label: 'Publicada' },
      draft: { variant: 'warning' as const, label: 'Borrador' },
      archived: { variant: 'default' as const, label: 'Archivada' },
    };
    const config = statusMap[status as keyof typeof statusMap] || statusMap.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Universidades</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestiona las universidades asociadas al catálogo</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
            Importar
          </button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900">
            + Agregar universidad
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {universities.map((university, idx) => (
          <Card key={idx} className="p-5 space-y-3 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{university.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{university.country}</p>
              </div>
              {getStatusBadge(university.status)}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Dominios</p>
              <div className="flex flex-wrap gap-2">
                {university.domains.map(domain => (
                  <Badge key={domain} variant="default" size="sm">{domain}</Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                Editar
              </button>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <button className="text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100">
                Ver
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
