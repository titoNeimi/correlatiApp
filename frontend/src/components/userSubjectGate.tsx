"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

type Props = {
  user: { id: string; degreeProgramIds?: string[] } | null;
  isLoading: boolean;
  fetchUserSubjects: (programId: string) => Promise<void> | void;
};

export default function UserSubjectsGate({ user, isLoading, fetchUserSubjects }: Props) {
  const [status, setStatus] = useState<"idle" | "no-program" | "pick-program" | "ready">("idle");
  const [ids, setIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    const degreeProgramIds = user?.degreeProgramIds ?? [];

    if (!user || degreeProgramIds.length === 0) {
      setIds([]);
      setStatus("no-program");
      return;
    }

    if (degreeProgramIds.length === 1) {
    setIds(degreeProgramIds);
      setSelectedId(degreeProgramIds[0]);
      setStatus("ready");
      return;
    }

    setIds(degreeProgramIds);
    setStatus("pick-program");
  }, [user, isLoading]);

  const handleLoadSubjects = async (programId?: string) => {
    const id = programId ?? selectedId;
    if (!id) return;
    try {
      setLoadingSubjects(true);
      await fetchUserSubjects(id);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const NoProgramCard = () => (
    <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h2 className="text-xl font-semibold">No estás inscripto en ningún plan de estudios</h2>
          <p className="mt-2 text-sm text-gray-600">
            Para ver tus materias, primero inscribite a un plan de estudios.
            Si ya te inscribiste y no aparece, recargá la página o volvé a iniciar sesión.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/carreras" className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90">
              Ver planes disponibles
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  const PickProgramCard = () => (
    <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow">
      <h2 className="text-xl font-semibold">Elegí tu plan de estudios</h2>
      <p className="mt-2 text-sm text-gray-600">Encontramos varios planes asociados a tu cuenta. Seleccioná uno para cargar tus materias.</p>
      <div className="mt-4 grid gap-3">
        {ids.map((id) => (
          <label key={id} className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition ${selectedId === id ? "border-black" : "border-gray-200 hover:border-gray-300"}`}>
            <div>
              <div className="font-medium">Plan {id}</div>
              <div className="text-xs text-gray-500">ID: {id}</div>
            </div>
            <input type="radio" name="degreeProgram" className="h-4 w-4" checked={selectedId === id} onChange={() => setSelectedId(id)}/>
          </label>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-3">
        <button onClick={() => handleLoadSubjects()} disabled={!selectedId || loadingSubjects} className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {loadingSubjects ? "Cargando…" : "Continuar"}
        </button>
        <Link href="/degree-programs/browse" className="text-sm text-gray-600 underline">
          Administrar planes
        </Link>
      </div>
    </div>
  );

  if (isLoading || status === "idle") {
    return (
      <div className="flex items-center justify-center p-10 text-sm text-gray-500">
        Cargando…
      </div>
    );
  }

  if (status === "no-program") return <NoProgramCard />;
  if (status === "pick-program") return <PickProgramCard />;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4">
      <div className="text-sm text-gray-700">
        <span className="font-medium">Programa seleccionado:</span> {ids[0]}
      </div>
      <button onClick={() => handleLoadSubjects(ids[0] || selectedId)} className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90">
        Cargar materias
      </button>
    </div>
  );
}
