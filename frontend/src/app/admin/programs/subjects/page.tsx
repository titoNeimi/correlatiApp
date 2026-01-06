'use client';

import { Badge, Card } from '@/components/admin/baseComponents';
import DataTable from '@/components/admin/dataTable';
import { DegreeProgram, DegreeProgramSubject } from '@/types/degreeProgram';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type SubjectsResponse = DegreeProgramSubject[];

export default function ProgramSubjectsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const apiURL = process.env.NEXT_PUBLIC_APIURL;

  const [programs, setPrograms] = useState<DegreeProgram[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [subjects, setSubjects] = useState<DegreeProgramSubject[]>([]);
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<null | string>(null);

  const fetchPrograms = useCallback(async () => {
    if (!apiURL) {
      setError('No existe NEXT_PUBLIC_APIURL en el .env');
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const res = await fetch(`${apiURL}/degreeProgram`);
      if (!res.ok) {
        setError('No se pudo obtener la lista de carreras');
        setLoading(false);
        return;
      }
      const data = (await res.json()) as { data: DegreeProgram[]; count: number };
      setPrograms(data.data);
      const current = searchParams.get('programId') || data.data[0]?.id || '';
      setSelectedProgram(current);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setLoading(false);
    }
  }, [apiURL, searchParams]);

  const fetchSubjects = useCallback(async (programId: string) => {
    if (!apiURL || !programId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiURL}/subjects/${programId}`);
      if (!res.ok) {
        setError('No se pudo obtener las materias de la carrera seleccionada');
        setLoading(false);
        return;
      }
      const data = (await res.json()) as SubjectsResponse;
      setSubjects(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setLoading(false);
    }
  }, [apiURL]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  useEffect(() => {
    if (!selectedProgram) return;
    const params = new URLSearchParams(searchParams);
    params.set('programId', selectedProgram);
    router.replace(`${pathname}?${params.toString()}`);
    fetchSubjects(selectedProgram);
  }, [selectedProgram, fetchSubjects, router, pathname, searchParams]);

  const columns = useMemo(() => [
    { key: 'name', label: 'Nombre', width: '30%' },
    { key: 'year', label: 'Año', width: '10%' },
    { key: 'requirements', label: 'Correlativas', width: '40%' },
    { key: 'status', label: 'Estado', width: '20%' },
  ], []);

  const getStatusBadge = (status?: string) => {
    const statusMap = {
      pending: { variant: 'warning' as const, label: 'Pendiente' },
      approved: { variant: 'success' as const, label: 'Aprobada' },
      in_progress: { variant: 'info' as const, label: 'En curso' },
    };
    const config = status ? statusMap[status as keyof typeof statusMap] : undefined;
    return <Badge variant={config?.variant || 'default'}>{config?.label || 'Sin estado'}</Badge>;
  };

  const tableData = useMemo(() => {
    const toRequirementLabel = (req: unknown) => {
      if (typeof req === 'string') return req;
      if (req && typeof req === 'object' && 'name' in (req as Record<string, unknown>)) {
        return String((req as { name?: unknown }).name ?? '');
      }
      return '';
    };

    return subjects
      .filter(subject => yearFilter === 'all' || subject.subjectYear.toString() === yearFilter)
      .map(subject => {
        const requirementLabels = (subject.requirements || [])
          .map(toRequirementLabel)
          .filter(Boolean);

        return {
          name: subject.name,
          year: `${subject.subjectYear}°`,
          requirements: requirementLabels.length ? (
            <div className="flex flex-wrap gap-1">
              {requirementLabels.map((req, idx) => (
                <Badge key={idx} variant="default" size="sm">{req}</Badge>
              ))}
            </div>
          ) : (
            <span className="text-sm text-gray-500 dark:text-gray-400">Sin correlativas</span>
          ),
          status: getStatusBadge(subject.status),
        };
      });
  }, [subjects, yearFilter]);

  const years = useMemo(() => {
    const uniqueYears = Array.from(new Set(subjects.map(s => s.subjectYear.toString())));
    return ['all', ...uniqueYears.sort((a, b) => Number(a) - Number(b))];
  }, [subjects]);

  const yearLabel = (year: string) => year === 'all' ? 'Todos' : `${year}° Año`;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 animate-pulse space-y-2">
          <div className="h-4 w-3/4 bg-gray-100 dark:bg-gray-700 rounded" />
          <div className="h-4 w-1/2 bg-gray-100 dark:bg-gray-700 rounded" />
          <div className="h-32 w-full bg-gray-100 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30 p-4 text-sm text-red-800 dark:text-red-200">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Materias</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestiona las materias de la carrera seleccionada
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900">
          + Agregar materia
        </button>
      </div>

      <Card className="p-4 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Carrera</span>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full md:w-72 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {programs.map(program => (
                <option key={program.id} value={program.id}>{program.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            {years.map(year => (
              <button
                key={year}
                onClick={() => setYearFilter(year)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  yearFilter === year
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {yearLabel(year)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <DataTable columns={columns} data={tableData} />
        {subjects.length === 0 && (
          <div className="p-6 text-sm text-gray-500 dark:text-gray-400">No hay materias para esta carrera.</div>
        )}
      </Card>
    </div>
  );
}
