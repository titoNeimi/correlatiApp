'use client';

import { useEffect, useMemo, useState } from 'react';
import StatCard from '@/components/admin/statCard';
import { Card } from '@/components/admin/baseComponents';

type ProgramApi = { id: string; name: string; subjects?: { id: string }[] };
type DegreeProgramsResponse = { count: number; data: ProgramApi[] };
type UserApi = { id: string; email: string; role?: string; created_at?: string };

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userCount, setUserCount] = useState<number>(0);
  const [programCount, setProgramCount] = useState<number>(0);
  const [subjectCount, setSubjectCount] = useState<number>(0);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_APIURL;
    if (!apiUrl) {
      setError('Falta NEXT_PUBLIC_APIURL');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [usersResp, programsResp] = await Promise.all([
          fetch(`${apiUrl}/users`, { credentials: 'include' }),
          fetch(`${apiUrl}/degreeProgram`, { credentials: 'include' }),
        ]);

        if (!usersResp.ok && usersResp.status !== 401) {
          throw new Error('No se pudieron cargar usuarios');
        }
        if (!programsResp.ok) {
          throw new Error('No se pudieron cargar carreras');
        }

        const usersJson = usersResp.ok ? ((await usersResp.json()) as UserApi[]) : [];
        const programsJson = (await programsResp.json()) as DegreeProgramsResponse;

        setUserCount(usersJson.length);
        setProgramCount(programsJson.count);

        const subjects = programsJson.data?.reduce((acc, program) => {
          return acc + (program.subjects?.length ?? 0);
        }, 0);
        setSubjectCount(subjects || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error cargando datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const kpiData = useMemo(() => [
    {
      title: 'Usuarios',
      value: loading ? '...' : userCount.toString(),
      change: '',
      trend: 'up' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      title: 'Carreras',
      value: loading ? '...' : programCount.toString(),
      change: '',
      trend: 'up' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      title: 'Materias (estimado)',
      value: loading ? '...' : subjectCount.toString(),
      change: '',
      trend: 'up' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      title: 'Pendientes de definir',
      value: 'Configurar',
      change: '',
      trend: 'up' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
  ], [loading, programCount, subjectCount, userCount]);

  const recentActivity = useMemo(() => [
    { text: 'Actividad de admin: datos cargados', time: 'Ahora' },
    { text: 'Pendiente: conectar eventos reales', time: '' },
  ], []);

  return (
    <div className="space-y-6">
      {/* Estado de error */}
      {error && (
        <Card className="p-4 border border-red-200 bg-red-50 text-red-700">
          {error}
        </Card>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
        {kpiData.map((kpi, idx) => (
          <StatCard key={idx} {...kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Actividad reciente</h2>
            <div className="space-y-4">
              {recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3 group">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0 group-hover:scale-125 transition-transform duration-200"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100">{activity.text}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Progress Overview */}
        <div>
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Progreso general</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Materias aprobadas</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">87/132</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all duration-500" style={{ width: '66%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Usuarios activos</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">892/1,248</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-full rounded-full transition-all duration-500" style={{ width: '71%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Carreras completadas</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">4/6</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-600 h-full rounded-full transition-all duration-500" style={{ width: '67%' }}></div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
