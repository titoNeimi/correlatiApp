'use client'

import Link from "next/link";
import { Badge, Card } from "@/components/admin/baseComponents";
import DataTable from "@/components/admin/dataTable";
import { User } from "@/types/user";
import { UserActions } from "@/components/admin/users/userActions";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function UsersPage() {
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<null | string>(null);
  const [usersData, setUsersData] = useState<User[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createFeedback, setCreateFeedback] = useState<string | null>(null);
  const [newUser, setNewUser] = useState<{ email: string; password: string; role: User["role"] }>({
    email: "",
    password: "",
    role: "user",
  });
  const apiURL = process.env.NEXT_PUBLIC_APIURL

  const dateFormatter = useMemo(() => new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }), [])

  const fetchUsers = useCallback(async () =>  {
    if (!apiURL) {
      setError("No existe NEXT_PUBLIC_APIURL en el .env");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiURL}/users`, { credentials: 'include' });
      if(!response.ok){
        setError("No se pudo obtener la lista de usuarios");
        setLoading(false);
        return;
      }
      const data = (await response.json()) as User[];
      setUsersData(data);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setError(error instanceof Error ? error.message : "Error desconocido");
      setLoading(false);
    }
  }, [apiURL])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleOpenCreate = () => {
    setNewUser({ email: "", password: "", role: "user" });
    setCreateError(null);
    setShowCreateModal(true);
  };

  const handleCreateUser = async () => {
    if (!apiURL) {
      setCreateError("No existe NEXT_PUBLIC_APIURL en el .env");
      return;
    }
    if (!newUser.email || !newUser.password) {
      setCreateError("Email y contraseña son obligatorios");
      return;
    }

    setCreateError(null);
    setCreateLoading(true);
    try {
      const response = await fetch(`${apiURL}/users`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          role: newUser.role,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const message = body?.error || "No se pudo crear el usuario";
        setCreateError(message);
        return;
      }

      await fetchUsers();
      setShowCreateModal(false);
      setCreateFeedback("Usuario creado correctamente");
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Error desconocido al crear el usuario");
    } finally {
      setCreateLoading(false);
    }
  };

  const columns = useMemo(() => [
    { key: 'email', label: 'Email', width: '30%' },
    { key: 'programs', label: 'Carreras', width: '35%' },
    { key: 'date', label: 'Fecha de alta', width: '15%' },
    { key: 'role', label: 'Rol', width: '10%' },
    { key: 'actions', label: 'Acciones', width: '10%' },
  ], []);

  const tableData = useMemo(() => {
    const getRoleBadge = (role: User['role']) => {
      const map = {
        admin: { variant: 'warning' as const, label: 'Admin' },
        staff: { variant: 'info' as const, label: 'Staff' },
        user: { variant: 'default' as const, label: 'Usuario' },
      }
      const config = map[role] || map.user
      return <Badge variant={config.variant}>{config.label}</Badge>
    }

    return usersData
      .filter(user => roleFilter === 'all' || user.role === roleFilter)
      .map(user => ({
        email: user.email,
        programs: user.degreePrograms?.length
          ? user.degreePrograms.map(program => program.name).join(', ')
          : '—',
        date: user.created_at
          ? dateFormatter.format(new Date(user.created_at))
          : '—',
        role: getRoleBadge(user.role),
        actions: (
          <div className="flex items-center justify-end gap-2">
            <UserActions
              user={user}
              variant="menu"
              onRoleChange={(role) =>
                setUsersData((prev) =>
                  prev.map((u) => (u.id === user.id ? { ...u, role } : u))
                )
              }
              onProgramsChange={(programs) =>
                setUsersData((prev) =>
                  prev.map((u) =>
                    u.id === user.id
                      ? {
                          ...u,
                          degreePrograms: programs.map((p) => {
                            const existing = u.degreePrograms?.find((dp) => dp.id === p.id);
                            return existing ? { ...existing, name: p.name } : { id: p.id, name: p.name };
                          }),
                        }
                      : u
                  )
                )
              }
            />
            <Link
              href={`/admin/users/${user.id}`}
              aria-label="Ver información del usuario"
              title="Ver información"
              className="h-9 w-9 inline-flex items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </Link>
          </div>
        ),
      }));
  }, [usersData, roleFilter, dateFormatter]);

  if(loading){
    return (
      <div className="space-y-4">
        <div className="h-10 w-40 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 animate-pulse space-y-2">
          <div className="h-4 w-3/4 bg-gray-100 dark:bg-gray-700 rounded" />
          <div className="h-4 w-1/2 bg-gray-100 dark:bg-gray-700 rounded" />
          <div className="h-32 w-full bg-gray-100 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  if(error){
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30 p-4 text-sm text-red-800 dark:text-red-200">
          Error: {error}
        </div>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Usuarios</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestiona los usuarios registrados en la plataforma</p>
          </div>
          <div className="flex items-center gap-3">
            {createFeedback && (
              <span className="text-xs text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 px-3 py-1 rounded-full">
                {createFeedback}
              </span>
            )}
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              + Agregar usuario
            </button>
          </div>
        </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtrar por rol:</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                roleFilter === 'all'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Todos ({usersData.length})
            </button>
            <button
              onClick={() => setRoleFilter('admin')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                roleFilter === 'admin'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Admin ({usersData.filter(u => u.role === 'admin').length})
            </button>
            <button
              onClick={() => setRoleFilter('staff')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                roleFilter === 'staff'
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Staff ({usersData.filter(u => u.role === 'staff').length})
            </button>
            <button
              onClick={() => setRoleFilter('user')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                roleFilter === 'user'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Usuarios ({usersData.filter(u => u.role === 'user').length})
            </button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <DataTable columns={columns} data={tableData} />
      </Card>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !createLoading && setShowCreateModal(false)}
          />
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Nuevo usuario</p>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Completa los datos</h3>
              </div>
              <button
                onClick={() => !createLoading && setShowCreateModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                aria-label="Cerrar"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="usuario@correo.com"
                  disabled={createLoading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Contraseña temporal</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mínimo 6 caracteres"
                  disabled={createLoading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Rol</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["admin", "staff", "user"] as User["role"][]).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setNewUser((prev) => ({ ...prev, role }))}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        newUser.role === role
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                      disabled={createLoading}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {createError && (
              <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-sm text-red-700 dark:text-red-200">
                {createError}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => !createLoading && setShowCreateModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={createLoading}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateUser}
                disabled={createLoading}
                className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors ${
                  createLoading
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {createLoading ? "Creando..." : "Crear usuario"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
