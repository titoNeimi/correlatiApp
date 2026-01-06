'use client'

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Badge, Card } from "@/components/admin/baseComponents";
import { User } from "@/types/user";
import { UserActions } from "@/components/admin/users/userActions";

type ActivityEvent = {
  id: string;
  action: "creacion" | "actualizacion" | "eliminacion" | "ingreso";
  entity: string;
  description: string;
  timestamp: string;
};

export default function UserDetailPage() {
  const params = useParams();
  const userId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const apiURL = process.env.NEXT_PUBLIC_APIURL;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const dateFormatter = useMemo(() => new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }), []);

  const getRoleBadge = (role: User['role']) => {
    const map = {
      admin: { variant: 'warning' as const, label: 'Admin' },
      staff: { variant: 'info' as const, label: 'Staff' },
      user: { variant: 'default' as const, label: 'Usuario' },
    };
    const config = map[role] || map.user;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const activityMock = useMemo<ActivityEvent[]>(() => [
    {
      id: "evt-1",
      action: "creacion",
      entity: "Carrera",
      description: "Creó la carrera Ingeniería en Sistemas",
      timestamp: "2024-04-10T14:32:00Z",
    },
    {
      id: "evt-2",
      action: "actualizacion",
      entity: "Materia",
      description: "Actualizó los requisitos de Álgebra II",
      timestamp: "2024-04-12T09:15:00Z",
    },
    {
      id: "evt-3",
      action: "creacion",
      entity: "Materia",
      description: "Agregó la materia Programación Funcional",
      timestamp: "2024-04-15T11:45:00Z",
    },
    {
      id: "evt-4",
      action: "ingreso",
      entity: "Login",
      description: "Inicio de sesión exitoso",
      timestamp: "2024-04-16T08:05:00Z",
    },
    {
      id: "evt-5",
      action: "eliminacion",
      entity: "Carrera",
      description: "Eliminó la carrera Test QA",
      timestamp: "2024-04-18T16:20:00Z",
    },
  ], []);

  const fetchUser = useCallback(async () => {
    if (!apiURL) {
      setError("No existe NEXT_PUBLIC_APIURL en el .env");
      setLoading(false);
      return;
    }
    if (!userId) {
      setError("No se encontró el usuario solicitado");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiURL}/users/${userId}`, { credentials: 'include' });
      if (!response.ok) {
        setError("No se pudo obtener la información del usuario");
        setLoading(false);
        return;
      }
      const data = (await response.json()) as User;
      setUser(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setLoading(false);
    }
  }, [apiURL, userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-6 w-64 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-48 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 animate-pulse" />
          <div className="h-48 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 animate-pulse" />
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
        <div className="flex gap-3">
          <Link
            href="/admin/users"
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Volver
          </Link>
          <button
            onClick={fetchUser}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-950/30 p-4 text-sm text-yellow-800 dark:text-yellow-200">
          No se encontró información del usuario.
        </div>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          ← Volver al listado
        </Link>
      </div>
    );
  }

  const formatDate = (value?: string) => {
    if (!value) return "—";
    return dateFormatter.format(new Date(value));
  };

  const formatDateTime = (value: string) => {
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  };

  const actionToBadge = (action: ActivityEvent["action"]) => {
    const map = {
      creacion: { label: "Creación", variant: "success" as const },
      actualizacion: { label: "Actualización", variant: "info" as const },
      eliminacion: { label: "Eliminación", variant: "error" as const },
      ingreso: { label: "Ingreso", variant: "default" as const },
    };
    const conf = map[action] || map.creacion;
    return <Badge variant={conf.variant} size="sm">{conf.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link
            href="/admin/users"
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            ← Volver
          </Link>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Usuario</p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{user.email}</h1>
            <div className="flex items-center gap-3 mt-2">
              {getRoleBadge(user.role)}
              <span className="text-xs text-gray-500 dark:text-gray-400">ID: {user.id}</span>
            </div>
          </div>
        </div>
        <button
          onClick={fetchUser}
          className="self-start px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
        >
          Recargar datos
        </button>
      </div>

      <UserActions
        user={user}
        variant="panel"
        onRoleChange={(role) => setUser((prev) => (prev ? { ...prev, role } : prev))}
        onProgramsChange={(programs) =>
          setUser((prev) =>
            prev
              ? { ...prev, degreePrograms: programs.map((p) => ({ id: p.id, name: p.name })) }
              : prev
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Información general</h2>
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="flex flex-col">
              <dt className="text-sm text-gray-500 dark:text-gray-400">Email</dt>
              <dd className="text-base font-medium text-gray-900 dark:text-gray-100">{user.email}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-sm text-gray-500 dark:text-gray-400">Rol</dt>
              <dd className="text-base font-medium text-gray-900 dark:text-gray-100">{getRoleBadge(user.role)}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-sm text-gray-500 dark:text-gray-400">Fecha de alta</dt>
              <dd className="text-base font-medium text-gray-900 dark:text-gray-100">{formatDate(user.created_at)}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-sm text-gray-500 dark:text-gray-400">Última actualización</dt>
              <dd className="text-base font-medium text-gray-900 dark:text-gray-100">{formatDate(user.updated_at)}</dd>
            </div>
          </dl>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Carreras asignadas</h2>
          </div>
          {user.degreePrograms && user.degreePrograms.length > 0 ? (
            <div className="space-y-3">
              {user.degreePrograms.map((program) => (
                <div
                  key={program.id}
                  className="p-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40"
                >
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{program.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{program.university?.name ?? 'Sin universidad asignada'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No tiene carreras asignadas.</p>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Mock</p>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Actividad reciente</h2>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Fuente: pendiente backend</span>
        </div>
        <div className="space-y-4">
          {activityMock.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30"
            >
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{event.description}</p>
                  {actionToBadge(event.action)}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {event.entity} · {formatDateTime(event.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
