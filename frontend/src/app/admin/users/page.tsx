'use client'

import Link from "next/link";
import { Badge, Card } from "@/components/admin/baseComponents";
import DataTable from "@/components/admin/dataTable";
import { User } from "@/types/user";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export default function UsersPage() {
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<null | string>(null);
  const [usersData, setUsersData] = useState<User[]>([])
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Suspender/Restaurar usuario (placeholder)"
              title="Suspender/Restaurar usuario"
              className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6h2v12h-2zM12 12h2v6h-2z" />
              </svg>
            </button>
            <Link
              href={`/admin/users/${user.id}`}
              aria-label="Ver información del usuario"
              title="Ver información"
              className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors inline-flex"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </Link>
            <div className="relative">
              <button
                type="button"
                aria-label="Más acciones (placeholder)"
                data-menu-toggle
                onClick={(e) => {
                  const menuWidth = 176; // w-44
                  const rect = e.currentTarget.getBoundingClientRect();
                  if (openMenu === user.id) {
                    setOpenMenu(null);
                    setMenuPosition(null);
                  } else {
                    setOpenMenu(user.id);
                    setMenuPosition({
                      top: rect.bottom + 8,
                      left: rect.right - menuWidth
                    });
                  }
                }}
                className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6h.01M12 12h.01M12 18h.01" />
                </svg>
              </button>
            </div>
          </div>
        ),
      }));
  }, [usersData, roleFilter, dateFormatter, openMenu]);

  const renderMenu = () => {
    if (!openMenu || !menuPosition) return null;
    return (
      <div
        ref={menuRef}
        className="fixed z-50 w-44 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg"
        style={{ top: menuPosition.top, left: menuPosition.left }}
      >
        <div className="py-1 text-sm text-gray-700 dark:text-gray-200">
          <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">Cambiar rol</button>
          <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">Resetear contraseña</button>
          <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">Revocar sesiones</button>
          <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">Asignar carreras</button>
          <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">Exportar datos</button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (!openMenu) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target?.closest('[data-menu-toggle]')) return;
      if (menuRef.current && menuRef.current.contains(target)) return;
      setOpenMenu(null);
      setMenuPosition(null);
    };
    const handleScroll = () => {
      setOpenMenu(null);
      setMenuPosition(null);
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [openMenu]);

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
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900">
          + Agregar usuario
        </button>
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
      {renderMenu()}
    </div>
  );
}
