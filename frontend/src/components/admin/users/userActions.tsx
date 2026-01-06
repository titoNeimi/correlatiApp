'use client'

import { JSX, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/admin/baseComponents";
import { User } from "@/types/user";

type AdminAction = "role" | "password" | "sessions" | "programs" | "export" | null;
type UserActionVariant = "panel" | "compact" | "menu";
type UserActionUser = Pick<User, "id" | "email" | "role" | "degreePrograms">;

const actionLabels: Record<Exclude<AdminAction, null>, string> = {
  role: "Cambiar rol",
  password: "Resetear contraseña",
  sessions: "Revocar sesiones",
  programs: "Asignar carreras",
  export: "Exportar datos",
};

const actionIcons: Record<Exclude<AdminAction, null>, JSX.Element> = {
  role: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  password: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-1.343 3-3V6a3 3 0 10-6 0v2c0 1.657 1.343 3 3 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11h14v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7z" />
    </svg>
  ),
  sessions: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  programs: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  export: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16l4 4 4-4m-4-12v16" />
    </svg>
  ),
};

type UserActionsProps = {
  user: UserActionUser;
  variant?: UserActionVariant;
  className?: string;
  onRoleChange?: (role: User["role"]) => void;
  onProgramsChange?: (programs: { id: string; name: string }[]) => void;
};

export function UserActions({
  user,
  variant = "panel",
  className = "",
  onRoleChange,
  onProgramsChange,
}: UserActionsProps) {
  const apiURL = process.env.NEXT_PUBLIC_APIURL;
  const [actionModal, setActionModal] = useState<AdminAction>(null);
  const [selectedRole, setSelectedRole] = useState<User["role"]>("user");
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [generatedMessage, setGeneratedMessage] = useState<string>("");
  const [tempPassword, setTempPassword] = useState<string>("");
  const [exportFormat, setExportFormat] = useState<"json" | "csv">("json");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [programsLoading, setProgramsLoading] = useState(false);
  const [programOptions, setProgramOptions] = useState<{ id: string; label: string }[] | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setSelectedRole(user.role);
    setSelectedPrograms(user.degreePrograms?.map((p) => p.id) ?? []);
  }, [user]);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-user-actions-menu]")) {
        setMenuOpen(false);
      }
    };
    const onScroll = () => setMenuOpen(false);
    document.addEventListener("mousedown", onClick, true);
    document.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onClick, true);
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [menuOpen]);

  const programOptionsMemo = useMemo(() => {
    if (programOptions) return programOptions;
    if (user?.degreePrograms?.length) {
      return user.degreePrograms.map((p) => ({ id: p.id, label: p.name }));
    }
    return [];
  }, [programOptions, user]);

  const toggleProgram = (id: string) => {
    setSelectedPrograms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const openAction = (action: AdminAction) => {
    setGeneratedMessage("");
    setTempPassword("");
    setExportFormat("json");
    setActionError(null);
    setActionModal(action);

    if (action === "programs" && !programOptions && !programsLoading) {
      if (!apiURL) {
        setActionError("Falta configurar NEXT_PUBLIC_APIURL");
        return;
      }
      setProgramsLoading(true);
      fetch(`${apiURL}/degreeProgram`, { credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          const list: { id: string; label: string }[] =
            Array.isArray(data?.data) ?
              data.data.map((p: { id: string; name: string }) => ({ id: p.id, label: p.name })) :
              [];
          setProgramOptions(list);
        })
        .catch((err) => setActionError(err instanceof Error ? err.message : "Error cargando carreras"))
        .finally(() => setProgramsLoading(false));
    }
  };

  const confirmAction = async () => {
    if (!actionModal) return;

    if (actionModal === "sessions") {
      if (!apiURL) {
        setActionError("Falta configurar NEXT_PUBLIC_APIURL");
        return;
      }

      setActionError(null);
      setActionLoading(true);
      try {
        const response = await fetch(`${apiURL}/users/${user.id}/session/revoke`, {
          method: "POST",
          credentials: "include",
        });
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          const message = body?.error || "No se pudieron revocar las sesiones";
          setActionError(message);
          return;
        }
        const body = (await response.json().catch(() => null)) as { message?: string; deleted?: number } | null;
        const deleted = typeof body?.deleted === "number" ? body?.deleted : undefined;
        const message = body?.message || "Sesiones revocadas";
        const feedback = deleted !== undefined ? `${message} (${deleted})` : message;
        setGeneratedMessage(feedback);
        setActionModal(null);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Error desconocido al revocar sesiones");
      } finally {
        setActionLoading(false);
      }
      return;
    }

    if (actionModal === "role") {
      if (!apiURL) {
        setActionError("Falta configurar NEXT_PUBLIC_APIURL");
        return;
      }
      setActionError(null);
      setActionLoading(true);
      try {
        const response = await fetch(`${apiURL}/users/${user.id}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: selectedRole }),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          const message = body?.error || "No se pudo actualizar el rol";
          setActionError(message);
          return;
        }
        onRoleChange?.(selectedRole);
        setGeneratedMessage(`Rol actualizado a ${selectedRole}`);
        setActionModal(null);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Error desconocido al actualizar rol");
      } finally {
        setActionLoading(false);
      }
      return;
    }

    if (actionModal === "programs") {
      if (!apiURL) {
        setActionError("Falta configurar NEXT_PUBLIC_APIURL");
        return;
      }
      setActionError(null);
      setActionLoading(true);
      try {
        const response = await fetch(`${apiURL}/users/${user.id}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ degreePrograms: selectedPrograms }),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          const message = body?.error || "No se pudieron actualizar las carreras";
          setActionError(message);
          return;
        }
        const selected = programOptionsMemo.filter((p) => selectedPrograms.includes(p.id));
        onProgramsChange?.(selected.map((p) => ({ id: p.id, name: p.label })));
        setGeneratedMessage(`Carreras actualizadas (${selectedPrograms.length})`);
        setActionModal(null);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Error desconocido al actualizar carreras");
      } finally {
        setActionLoading(false);
      }
      return;
    }

    const map: Record<Exclude<AdminAction, null>, string> = {
      role: `Acción simulada: rol actualizado a ${selectedRole}`,
      password: "Acción simulada: contraseña reseteada",
      sessions: "Acción simulada: sesiones revocadas",
      programs: `Acción simulada: ${selectedPrograms.length} carreras asignadas`,
      export: `Acción simulada: export ${exportFormat.toUpperCase()}`,
    };
    setGeneratedMessage(map[actionModal]);
    setActionModal(null);
  };

  const renderModalBody = () => {
    switch (actionModal) {
      case "role":
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">Selecciona el nuevo rol del usuario.</p>
            <div className="space-y-2">
              {(["admin", "staff", "user"] as User["role"][]).map((role) => (
                <label
                  key={role}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedRole === role
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    className="accent-blue-600"
                    checked={selectedRole === role}
                    onChange={() => setSelectedRole(role)}
                  />
                  <span className="capitalize text-sm text-gray-800 dark:text-gray-100">{role}</span>
                </label>
              ))}
            </div>
          </div>
        );
      case "password":
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Genera una contraseña temporal o envía un correo de reseteo (solo visual).
            </p>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Contraseña temporal</label>
            <input
              value={tempPassword}
              onChange={(e) => setTempPassword(e.target.value)}
              placeholder="Ej: S3guro!2024"
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">No se envía nada, es una maqueta.</p>
          </div>
        );
      case "sessions":
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Revocará todas las sesiones activas de este usuario. Se cerrará su sesión en todos los dispositivos.
            </p>
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/50">
              Se llamará al endpoint POST /users/{user.id}/session/revoke.
            </div>
          </div>
        );
      case "programs":
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">Selecciona las carreras asignadas al usuario.</p>
            {programsLoading ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">Cargando carreras...</div>
            ) : programOptionsMemo.length ? (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {programOptionsMemo.map((program) => (
                  <label
                    key={program.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPrograms.includes(program.id)}
                      onChange={() => toggleProgram(program.id)}
                      className="accent-blue-600"
                    />
                    <span className="text-sm text-gray-800 dark:text-gray-100">{program.label}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No hay carreras disponibles para asignar.
              </div>
            )}
          </div>
        );
      case "export":
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Exporta los datos del usuario en el formato deseado (solo visual).
            </p>
            <div className="flex gap-3">
              {(["json", "csv"] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setExportFormat(fmt)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    exportFormat === fmt
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                      : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderActionButtons = (variantType: UserActionVariant) => {
    const actions: Exclude<AdminAction, null>[] = ["role", "password", "sessions", "programs", "export"];
    if (variantType === "panel") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {actions.map((action) => (
            <button
              key={action}
              onClick={() => openAction(action)}
              className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 flex items-center justify-center">
                  {actionIcons[action]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{actionLabels[action]}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {{
                      role: "Admin / Staff / Usuario",
                      password: "Envío de link o clave temporal",
                      sessions: "Cerrar todas las sesiones",
                      programs: "Agregar o quitar inscripciones",
                      export: "Descarga JSON/CSV",
                    }[action]}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      );
    }

    if (variantType === "compact") {
      return (
        <div className="flex flex-wrap items-center gap-2">
          {actions.map((action) => (
            <button
              key={action}
              onClick={() => openAction(action)}
              title={actionLabels[action]}
          className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
            >
              {actionIcons[action]}
            </button>
          ))}
        </div>
      );
    }

    // menu
    return (
      <div className="relative" data-user-actions-menu>
        <button
          ref={triggerRef}
          onClick={() => {
            const rect = triggerRef.current?.getBoundingClientRect();
            const menuWidth = 176; // w-44
            if (rect) {
              const left = Math.min(window.innerWidth - menuWidth - 8, rect.right - menuWidth);
              setMenuPosition({
                top: rect.bottom + 8 + window.scrollY,
                left,
              });
            }
            setMenuOpen((prev) => !prev);
          }}
          className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
          aria-label="Abrir acciones"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6h.01M12 12h.01M12 18h.01" />
          </svg>
        </button>
        {menuOpen && menuPosition && (
          <div
            className="fixed w-44 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg py-1 z-50"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            {actions.map((action) => (
              <button
                key={action}
                onClick={() => {
                  setMenuOpen(false);
                  openAction(action);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <span className="w-4 h-4 text-gray-500">{actionIcons[action]}</span>
                {actionLabels[action]}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {variant === "panel" ? (
        <Card className={`p-6 ${className}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Acciones admin</p>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Operaciones rápidas</h2>
            </div>
            {generatedMessage && (
              <span className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
                {generatedMessage}
              </span>
            )}
          </div>
          {renderActionButtons("panel")}
        </Card>
      ) : variant === "compact" ? (
        <div className={className}>{renderActionButtons("compact")}</div>
      ) : (
        <div className={className}>{renderActionButtons("menu")}</div>
      )}

      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setActionModal(null)}
          />
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Acción admin</p>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {actionModal ? actionLabels[actionModal] : ""}
                </h3>
              </div>
              <button
                onClick={() => setActionModal(null)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                aria-label="Cerrar"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4">
              {renderModalBody()}
            </div>

            {actionError && (
              <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-sm text-red-700 dark:text-red-200">
                {actionError}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setActionModal(null)}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmAction}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors ${
                  actionLoading
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {actionModal === "sessions"
                  ? actionLoading
                    ? "Revocando..."
                    : "Revocar sesiones"
                  : actionModal === "role"
                  ? actionLoading
                    ? "Actualizando..."
                    : "Actualizar rol"
                  : actionModal === "programs"
                  ? actionLoading
                    ? "Guardando..."
                    : "Actualizar carreras"
                  : "Confirmar (mock)"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
