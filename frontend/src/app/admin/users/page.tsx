'use client'

import { Badge, Card } from "@/components/admin/baseComponents";
import DataTable from "@/components/admin/dataTable";
import { useMemo, useState } from "react";

export default function UsersPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  type User = {
    email:string,
    programs:string,
    date:string,
    status: 'active' | 'suspended'
  }
  const usersData:User[] = useMemo(() => [
    { email: 'juan.perez@example.com', programs: 'Ingeniería en Sistemas', date: '15/03/2024', status: 'active' },
    { email: 'maria.garcia@example.com', programs: 'Licenciatura en Matemática', date: '22/02/2024', status: 'active' },
    { email: 'carlos.rodriguez@example.com', programs: 'Ingeniería Industrial', date: '10/01/2024', status: 'suspended' },
    { email: 'ana.martinez@example.com', programs: 'Ingeniería en Sistemas, Lic. en Informática', date: '05/04/2024', status: 'active' },
    { email: 'luis.gonzalez@example.com', programs: 'Ingeniería Química', date: '18/03/2024', status: 'active' },
    { email: 'sofia.lopez@example.com', programs: 'Licenciatura en Física', date: '28/02/2024', status: 'active' },
    { email: 'diego.fernandez@example.com', programs: 'Ingeniería en Sistemas', date: '12/01/2024', status: 'suspended' },
    { email: 'valentina.ruiz@example.com', programs: 'Ingeniería Electrónica', date: '08/04/2024', status: 'active' },
    { email: 'santiago.torres@example.com', programs: 'Licenciatura en Matemática', date: '25/03/2024', status: 'active' },
    { email: 'lucia.diaz@example.com', programs: 'Ingeniería Industrial', date: '14/02/2024', status: 'active' },
  ], []);

  const columns = useMemo(() => [
    { key: 'email', label: 'Email', width: '30%' },
    { key: 'programs', label: 'Carreras', width: '35%' },
    { key: 'date', label: 'Fecha de alta', width: '15%' },
    { key: 'status', label: 'Estado', width: '20%' },
  ], []);

  const tableData = useMemo(() => {
    return usersData
      .filter(user => statusFilter === 'all' || user.status === statusFilter)
      .map(user => ({
        email: user.email,
        programs: user.programs,
        date: user.date,
        status: (
          <Badge variant={user.status === 'active' ? 'success' : 'error'}>
            {user.status === 'active' ? 'Activo' : 'Suspendido'}
          </Badge>
        ),
      }));
  }, [usersData, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Usuarios</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestiona los usuarios registrados en la plataforma</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900">
          + Agregar usuario
        </button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtrar por estado:</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                statusFilter === 'all'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Todos ({usersData.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                statusFilter === 'active'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Activos ({usersData.filter(u => u.status === 'active').length})
            </button>
            <button
              onClick={() => setStatusFilter('suspended')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                statusFilter === 'suspended'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Suspendidos ({usersData.filter(u => u.status === 'suspended').length})
            </button>
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