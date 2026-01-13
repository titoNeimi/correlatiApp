"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, apiFetchJson } from "@/lib/api";
import { NativeSelect } from "@/components/ui/native-select";

type Props = {
  user: { id: string } | null;
  isLoading: boolean;
  fetchUserSubjects: (programId: string) => Promise<void> | void;
  initialProgramId?: string;
};

export default function UserSubjectsGate({ user, isLoading, fetchUserSubjects, initialProgramId }: Props) {
  const [status, setStatus] = useState<"idle" | "no-program" | "pick-program" | "ready">("idle");
  const [ids, setIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [programs, setPrograms] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      setIds([]);
      setStatus("no-program");
      return;
    }

    const loadPrograms = async () => {
      try {
        const response = await apiFetch("/me/programs", { credentials: "include" });
        if (!response.ok) {
          setIds([]);
          setStatus("no-program");
          return;
        }
        const data = (await response.json()) as { enrolledProgramIds?: string[] };
        const degreeProgramIds = data.enrolledProgramIds ?? [];

        if (degreeProgramIds.length === 0) {
          setIds([]);
          setStatus("no-program");
          return;
        }

        let programOptions = degreeProgramIds.map((id) => ({ id, name: `Programa ${id}` }));
        try {
          const programsResponse = await apiFetchJson<{ data?: { id: string; name: string }[] }>("/degreeProgram");
          const allPrograms = Array.isArray(programsResponse.data) ? programsResponse.data : [];
          programOptions = allPrograms.filter((program) => degreeProgramIds.includes(program.id));
          if (programOptions.length === 0) {
            programOptions = degreeProgramIds.map((id) => ({ id, name: `Programa ${id}` }));
          }
        } catch {
          programOptions = degreeProgramIds.map((id) => ({ id, name: `Programa ${id}` }));
        }

        setPrograms(programOptions);
        setIds(degreeProgramIds);
        setSelectedId((prev) => {
          if (initialProgramId && degreeProgramIds.includes(initialProgramId)) return initialProgramId;
          if (prev && degreeProgramIds.includes(prev)) return prev;
          return degreeProgramIds[0];
        });
        setStatus("ready");
      } catch {
        setIds([]);
        setStatus("no-program");
      }
    };

    loadPrograms();
  }, [user, isLoading, initialProgramId]);

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
    <div className="mx-auto mt-10 max-w-5xl rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Seleccioná una carrera</h2>
          <p className="mt-1 text-sm text-slate-600">
            Podés cambiar de carrera en cualquier momento sin perder el avance.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <NativeSelect
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none"
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
          >
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name}
              </option>
            ))}
          </NativeSelect>
          <button
            onClick={() => handleLoadSubjects()}
            disabled={!selectedId || loadingSubjects}
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
          >
            {loadingSubjects ? "Cargando…" : "Cargar materias"}
          </button>
          <Link href="/mis-carreras" className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Ver mis carreras
          </Link>
        </div>
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
  if (status === "pick-program" || status === "ready") return <PickProgramCard />;

  return null;
}
