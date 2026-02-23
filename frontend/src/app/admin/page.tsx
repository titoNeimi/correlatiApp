'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/admin/baseComponents';
import { apiFetch, getApiErrorMessage } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type ProgramApi = {
  id: string;
  name: string;
  approvalStatus: string;
  publicRequested: boolean;
  subjects?: { id: string }[];
  university?: { name: string };
  updated_at?: string;
};

type UserApi = {
  id: string;
  email: string;
  role: string;
  created_at?: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(date: Date) {
  return date.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
}

function pct(n: number, total: number) {
  return total > 0 ? Math.round((n / total) * 100) : 0;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg ${className}`} />
  );
}

const ACCENT = {
  blue:   { bg: 'bg-blue-50 dark:bg-blue-900/20',   text: 'text-blue-600 dark:text-blue-400',   ring: 'ring-blue-100 dark:ring-blue-900/40' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400', ring: 'ring-purple-100 dark:ring-purple-900/40' },
  green:  { bg: 'bg-green-50 dark:bg-green-900/20',  text: 'text-green-600 dark:text-green-400',  ring: 'ring-green-100 dark:ring-green-900/40' },
  amber:  { bg: 'bg-amber-50 dark:bg-amber-900/20',  text: 'text-amber-600 dark:text-amber-400',  ring: 'ring-amber-100 dark:ring-amber-900/40' },
} as const;

interface KpiCardProps {
  title: string;
  value: number | string;
  sub?: string;
  loading: boolean;
  accent: keyof typeof ACCENT;
  icon: React.ReactNode;
}

function KpiCard({ title, value, sub, loading, accent, icon }: KpiCardProps) {
  const c = ACCENT[accent];
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
            {title}
          </p>
          {loading ? (
            <Skeleton className="h-8 w-20 mb-1" />
          ) : (
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 tabular-nums leading-none">
              {value}
            </p>
          )}
          {sub && !loading && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 truncate">{sub}</p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${c.bg} ${c.text} ring-1 ${c.ring}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

interface DonutSegment { value: number; color: string; label: string }

function DonutChart({ segments, centerValue, centerLabel }: {
  segments: DonutSegment[];
  centerValue: number | string;
  centerLabel: string;
}) {
  const R = 46;
  const stroke = 14;
  const C = 2 * Math.PI * R;
  const total = segments.reduce((s, seg) => s + seg.value, 0);

  let cumulativeLen = 0;
  const arcs = segments.map(seg => {
    const length = total > 0 ? (seg.value / total) * C : 0;
    const offset = C * 0.25 - cumulativeLen;
    cumulativeLen += length;
    return { ...seg, length, offset };
  });

  return (
    <div className="relative w-full h-full">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-0">
        {/* Track */}
        <circle cx="60" cy="60" r={R} fill="none" stroke="#e5e7eb" strokeWidth={stroke}
          className="dark:[stroke:#374151]" />
        {total > 0 && arcs.map((arc, i) =>
          arc.length > 0 && (
            <circle
              key={i}
              cx="60" cy="60" r={R}
              fill="none"
              stroke={arc.color}
              strokeWidth={stroke}
              strokeDasharray={`${arc.length} ${C - arc.length}`}
              strokeDashoffset={arc.offset}
              style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
          )
        )}
      </svg>
      {/* Center text overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-xl font-bold text-gray-900 dark:text-gray-100 tabular-nums leading-none">
          {centerValue}
        </span>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{centerLabel}</span>
      </div>
    </div>
  );
}

function buildMonthlyRegistrations(users: UserApi[], numMonths = 6): { month: string; value: number }[] {
  const now = new Date();
  return Array.from({ length: numMonths }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (numMonths - 1 - i), 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const label = d.toLocaleDateString('es-AR', { month: 'short' });
    const normalized = label.replace('.', '');
    const month = normalized.charAt(0).toUpperCase() + normalized.slice(1, 3);
    const value = users.filter(u => {
      if (!u.created_at) return false;
      const ud = new Date(u.created_at);
      return ud.getFullYear() === y && ud.getMonth() === m;
    }).length;
    return { month, value };
  });
}

function MiniBarChart({ data }: { data: { month: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1.5 h-14">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <span className="text-[9px] text-gray-500 dark:text-gray-400 tabular-nums">{d.value}</span>
          <div
            className="w-full rounded-t-sm bg-blue-500 dark:bg-blue-400 transition-all duration-500"
            style={{ height: `${Math.max(4, (d.value / max) * 36)}px` }}
          />
          <span className="text-[9px] text-gray-400 dark:text-gray-500">{d.month}</span>
        </div>
      ))}
    </div>
  );
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  approved: { label: 'Aprobada',  className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  pending:  { label: 'Pendiente', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  rejected: { label: 'Rechazada', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function QuickActionLink({ href, label, icon, iconBg, iconText, badge }: {
  href: string;
  label: string;
  icon: React.ReactNode;
  iconBg: string;
  iconText: string;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg} ${iconText}`}>
          {icon}
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {badge != null && badge > 0 && (
          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
            {badge}
          </span>
        )}
        <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [users, setUsers] = useState<UserApi[]>([]);
  const [programs, setPrograms] = useState<ProgramApi[]>([]);
  const [programCount, setProgramCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: '1', limit: '100' });
      const [usersResp, programsResp] = await Promise.all([
        apiFetch('/users', { credentials: 'include' }),
        apiFetch(`/degreeProgram?${params}`, { credentials: 'include' }),
      ]);
      const usersJson: UserApi[] = usersResp.ok ? await usersResp.json() : [];
      const programsJson: { count: number; data: ProgramApi[] } = await programsResp.json();
      setUsers(usersJson);
      setPrograms(programsJson.data ?? []);
      setProgramCount(programsJson.count ?? 0);
      setLastRefresh(new Date());
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error cargando datos'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Derived stats
  const approvedCount  = programs.filter(p => p.approvalStatus === 'approved').length;
  const pendingCount   = programs.filter(p => p.approvalStatus === 'pending').length;
  const rejectedCount  = programs.filter(p => p.approvalStatus === 'rejected').length;
  const publicCount    = programs.filter(p => p.publicRequested).length;
  const subjectCount   = programs.reduce((acc, p) => acc + (p.subjects?.length ?? 0), 0);
  const adminCount     = users.filter(u => u.role === 'admin').length;
  const staffCount     = users.filter(u => u.role === 'staff').length;
  const studentCount   = users.filter(u => u.role === 'user').length;
  const totalLoaded    = programs.length;

  const recentPrograms = useMemo(() =>
    [...programs]
      .sort((a, b) => {
        if (!a.updated_at) return 1;
        if (!b.updated_at) return -1;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      })
      .slice(0, 6),
    [programs]
  );

  const programSegments: DonutSegment[] = [
    { value: approvedCount, color: '#10b981', label: 'Aprobadas' },
    { value: pendingCount,  color: '#f59e0b', label: 'Pendientes' },
    { value: rejectedCount, color: '#ef4444', label: 'Rechazadas' },
  ];

  const rolesSegments: DonutSegment[] = [
    { value: studentCount, color: '#3b82f6', label: 'Alumnos' },
    { value: staffCount,   color: '#8b5cf6', label: 'Staff' },
    { value: adminCount,   color: '#06b6d4', label: 'Admin' },
  ];

  const monthlyData = useMemo(() => buildMonthlyRegistrations(users), [users]);
  const monthlyDelta = monthlyData[monthlyData.length - 1].value - monthlyData[0].value;

  return (
    <div className="space-y-5 pb-6">

      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-800 dark:text-red-300">
          <span>{error}</span>
          <button onClick={fetchData} className="ml-4 font-semibold underline hover:no-underline">
            Reintentar
          </button>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 capitalize">
            {formatDate(lastRefresh)}
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualizar
        </button>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Usuarios"
          value={users.length}
          sub={loading ? undefined : `${adminCount} admin · ${staffCount} staff`}
          loading={loading}
          accent="blue"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <KpiCard
          title="Carreras"
          value={programCount}
          sub={loading ? undefined : `${publicCount} públicas`}
          loading={loading}
          accent="purple"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
        <KpiCard
          title="Materias"
          value={subjectCount}
          sub={loading ? undefined : 'en página actual'}
          loading={loading}
          accent="green"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
        />
        <KpiCard
          title="Pendientes"
          value={pendingCount}
          sub={loading ? undefined : pendingCount > 0 ? 'requieren revisión' : 'sin pendientes'}
          loading={loading}
          accent="amber"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* ── Middle row: approval breakdown + roles donut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Approval breakdown */}
        <Card className="lg:col-span-2 p-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Estado de aprobación
          </h2>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-3 w-full" />
              <div className="grid grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10" />)}
              </div>
              <Skeleton className="h-px w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            </div>
          ) : totalLoaded === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">No hay carreras cargadas.</p>
              <Link href="/carreras/crear" className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
                Agregar la primera →
              </Link>
            </div>
          ) : (
            <>
              {/* Stacked bar */}
              <div className="h-3 w-full rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex mb-5">
                {approvedCount > 0 && (
                  <div
                    className="h-full bg-emerald-500 transition-all duration-700"
                    style={{ width: `${pct(approvedCount, totalLoaded)}%` }}
                  />
                )}
                {pendingCount > 0 && (
                  <div
                    className="h-full bg-amber-400 transition-all duration-700"
                    style={{ width: `${pct(pendingCount, totalLoaded)}%` }}
                  />
                )}
                {rejectedCount > 0 && (
                  <div
                    className="h-full bg-red-400 transition-all duration-700"
                    style={{ width: `${pct(rejectedCount, totalLoaded)}%` }}
                  />
                )}
              </div>

              {/* Legend grid */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Aprobadas',  count: approvedCount,  dot: 'bg-emerald-500' },
                  { label: 'Pendientes', count: pendingCount,   dot: 'bg-amber-400' },
                  { label: 'Rechazadas', count: rejectedCount,  dot: 'bg-red-400' },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-2">
                    <div className={`w-2.5 h-2.5 rounded-sm mt-1 flex-shrink-0 ${item.dot}`} />
                    <div>
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100 tabular-nums leading-tight">
                        {item.count}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom stats */}
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/60 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Tasa de aprobación</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                    {pct(approvedCount, totalLoaded)}
                    <span className="text-sm font-normal text-gray-400 ml-0.5">%</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Carreras públicas</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                    {publicCount}
                    <span className="text-sm font-normal text-gray-400 ml-1">de {totalLoaded}</span>
                  </p>
                </div>
              </div>
            </>
          )}
        </Card>

        {/* Roles donut */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Roles de usuarios
          </h2>
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="w-32 h-32 rounded-full" />
              <div className="w-full space-y-2.5">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
              </div>
            </div>
          ) : users.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">Sin datos.</p>
          ) : (
            <div className="flex flex-col items-center gap-5">
              <div className="w-32 h-32">
                <DonutChart
                  segments={rolesSegments}
                  centerValue={users.length}
                  centerLabel="usuarios"
                />
              </div>
              <div className="w-full space-y-2.5">
                {rolesSegments.map(seg => (
                  <div key={seg.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: seg.color }} />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{seg.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                        {seg.value}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 w-7 text-right tabular-nums">
                        {pct(seg.value, users.length)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ── Bottom row: recent programs + quick actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent programs */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Últimas carreras</h2>
            <Link
              href="/admin/programs"
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Ver todas →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
                    <div>
                      <Skeleton className="h-3.5 w-40 mb-1.5" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : recentPrograms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">No hay carreras.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
              {recentPrograms.map(program => (
                <div key={program.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {program.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {program.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {program.university?.name ?? '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={program.approvalStatus} />
                    {program.updated_at && (
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 hidden sm:block w-6 text-right tabular-nums">
                        {formatRelative(program.updated_at)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Right column: quick actions + trend */}
        <div className="flex flex-col gap-4">

          {/* Quick actions */}
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Acciones rápidas
            </h2>
            <div className="space-y-0.5">
              <QuickActionLink
                href="/admin/programs"
                label="Aprobar pendientes"
                badge={pendingCount}
                iconBg="bg-amber-50 dark:bg-amber-900/20"
                iconText="text-amber-600 dark:text-amber-400"
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <QuickActionLink
                href="/admin/users"
                label="Gestionar usuarios"
                iconBg="bg-blue-50 dark:bg-blue-900/20"
                iconText="text-blue-600 dark:text-blue-400"
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                }
              />
              <QuickActionLink
                href="/admin/universities"
                label="Universidades"
                iconBg="bg-purple-50 dark:bg-purple-900/20"
                iconText="text-purple-600 dark:text-purple-400"
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6l-9 5 9 5 9-5-9-5zm-7 9l7 4 7-4" />
                  </svg>
                }
              />
              <QuickActionLink
                href="/admin/observability"
                label="Observabilidad"
                iconBg="bg-green-50 dark:bg-green-900/20"
                iconText="text-green-600 dark:text-green-400"
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
              />
            </div>
            <Link
              href="/carreras/crear"
              className="mt-3 flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva carrera
            </Link>
          </Card>

          {/* Monthly registrations */}
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Registros mensuales
            </h2>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ) : (
              <>
                <MiniBarChart data={monthlyData} />
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-gray-400 dark:text-gray-500">Últimos 6 meses</p>
                  {monthlyDelta !== 0 && (
                    <p className={`text-xs font-semibold ${monthlyDelta > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                      {monthlyDelta > 0 ? '+' : ''}{monthlyDelta} vs {monthlyData[0].month}
                    </p>
                  )}
                </div>
              </>
            )}
          </Card>

        </div>
      </div>

    </div>
  );
}
