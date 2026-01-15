import React from 'react';
import { BookOpen, Filter, GraduationCap, Search, Users } from 'lucide-react';
import Link from 'next/link';
import { apiFetchJson } from '@/lib/api';
import { PageShell } from '@/components/layout/page-shell';

type DegreeProgramDTO = {
  id: string;
  name: string;
  university?: University;
  subjects?: { id: string }[];
};

type fetchDegree = {
  count:number,
  data: DegreeProgramDTO[]
}

const fetchDegreePrograms = async (): Promise<fetchDegree | null> =>  {
  try {

    const data = await apiFetchJson<fetchDegree>('/degreeProgram')
    return data
  } catch (error) {
    console.log(error)
    return null
  }
}

async function CareersPage () {

  const cardTones = [
    'from-blue-50 via-white to-indigo-50',
    'from-amber-50 via-white to-orange-50',
    'from-emerald-50 via-white to-green-50',
    'from-sky-50 via-white to-cyan-50',
    'from-purple-50 via-white to-fuchsia-50',
    'from-rose-50 via-white to-pink-50',
    'from-slate-50 via-white to-gray-50',
    'from-lime-50 via-white to-emerald-50'
  ]

  const getCardTone = (value: string) => {
    const hash = Array.from(value).reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return cardTones[hash % cardTones.length]
  }

  const filterRegions = ['CABA', 'Buenos Aires', 'Cordoba', 'Santa Fe']
  const filterAreas = ['Ingenieria', 'Negocios', 'Salud', 'Ciencias', 'Arte']
  const filterModalities = ['Presencial', 'Hibrida', 'Virtual']
  const filterDurations = ['2-3 años', '4 años', '5+ años']

  const data = await fetchDegreePrograms()
  const programs = Array.isArray(data?.data) ? data?.data : null
  const programCount = typeof data?.count === 'number' ? data.count : programs?.length

  if(data == null){
    return(
      <div>
        Error
      </div>
    )
  }

  if(programs == null || programCount === undefined){
    return (
      <PageShell mainClassName="max-w-3xl py-12">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900">No pudimos cargar las carreras</h2>
          <p className="text-slate-600 mt-3">
            La API no devolvio la estructura esperada. Intenta nuevamente en unos minutos.
          </p>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <section className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-100 shadow-xl p-6 sm:p-8 mb-10">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-3 py-1 rounded-full text-xs font-semibold tracking-wide">
              <GraduationCap className="w-4 h-4" />
              Catalogo de carreras
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-4">
              Explora carreras con una vista clara y moderna
            </h2>
            <p className="text-slate-600 mt-3 max-w-2xl">
              Ordena por area, universidad o modalidad. Los filtros estan listos para conectarse con la data real.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium">
                <GraduationCap className="w-4 h-4" />
                {programCount} carreras activas
              </div>
              <div className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium">
                <Users className="w-4 h-4" />
                {new Set(programs.map((program) => program.university?.id).filter(Boolean)).size} universidades
              </div>
              <div className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium">
                <BookOpen className="w-4 h-4" />
                {programs.reduce((total, program) => total + (program.subjects ? program.subjects.length : 0), 0)} materias
              </div>
              <Link
                href="/carreras/crear"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                Crear carrera
              </Link>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-2xl p-6">
            <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-slate-200">
              <Filter className="w-4 h-4" />
              Busqueda rapida
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
                <Search className="w-4 h-4 text-white/70" />
                <input
                  type="text"
                  placeholder="Buscar carrera o universidad"
                  className="bg-transparent text-sm text-white placeholder:text-white/60 outline-none flex-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white/10 rounded-xl px-4 py-3">
                  <p className="text-white/70 text-xs">Area</p>
                  <p className="font-semibold">Pendiente</p>
                </div>
                <div className="bg-white/10 rounded-xl px-4 py-3">
                  <p className="text-white/70 text-xs">Modalidad</p>
                  <p className="font-semibold">Pendiente</p>
                </div>
                <div className="bg-white/10 rounded-xl px-4 py-3">
                  <p className="text-white/70 text-xs">Duracion</p>
                  <p className="font-semibold">Pendiente</p>
                </div>
                <div className="bg-white/10 rounded-xl px-4 py-3">
                  <p className="text-white/70 text-xs">Ranking</p>
                  <p className="font-semibold">Pendiente</p>
                </div>
              </div>
              <button className="w-full bg-white text-slate-900 font-semibold py-3 rounded-xl hover:bg-slate-100 transition-colors">
                Aplicar filtros
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6 h-fit">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Filtros visibles</h3>
          <div className="space-y-5 text-sm">
            <div>
              <p className="text-slate-500 mb-2">Region</p>
              <div className="flex flex-wrap gap-2">
                {filterRegions.map((region) => (
                  <span key={region} className="px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                    {region}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-slate-500 mb-2">Area academica</p>
              <div className="flex flex-wrap gap-2">
                {filterAreas.map((area) => (
                  <span key={area} className="px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                    {area}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-slate-500 mb-2">Modalidad</p>
              <div className="space-y-2">
                {filterModalities.map((mode) => (
                  <label key={mode} className="flex items-center gap-2 text-slate-700">
                    <input type="checkbox" className="rounded border-slate-300" />
                    {mode}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="text-slate-500 mb-2">Duracion</p>
              <div className="space-y-2">
                {filterDurations.map((duration) => (
                  <label key={duration} className="flex items-center gap-2 text-slate-700">
                    <input type="checkbox" className="rounded border-slate-300" />
                    {duration}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Carreras destacadas</h3>
              <p className="text-slate-600">Explora planes con informacion resumida y accesos rapidos.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600">
                Ordenar por: Popularidad
              </div>
              <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold">
                Vista compacta
              </button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {programs.map((program) => (
              <article
                key={program.id}
                className={`rounded-2xl border border-slate-100 bg-gradient-to-br ${getCardTone(program.id)} p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-white/70 p-2 rounded-lg">
                    <GraduationCap className="w-6 h-6 text-slate-700" />
                  </div>
                  <div className="bg-white/80 px-3 py-1 rounded-full text-xs font-semibold text-slate-700">
                    {program.subjects ? program.subjects.length : 0} materias
                  </div>
                </div>

                <h4 className="text-xl font-bold text-slate-900 mb-2">{program.name}</h4>
                <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                  {program.university?.name || 'Universidad'}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {['Plan actualizado', 'Alta demanda', 'Sincronizado'].map((tag) => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-white/80 text-slate-700 text-xs font-semibold">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Duracion: Pendiente</span>
                  <Link
                    href={`/carreras/${program.id}`}
                    prefetch={false}
                    className="text-sm font-semibold text-slate-900 hover:text-slate-700 transition-colors"
                  >
                    Ver detalles →
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="bg-slate-900 text-white rounded-3xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">¿No encontraste tu carrera?</h3>
            <p className="text-slate-200 mb-6 max-w-2xl mx-auto">
              Estamos constantemente agregando nuevas carreras y universidades.
              Contáctanos para sugerir la tuya.
            </p>
            <Link
              href={"/sugerencias?formulario=carrera"}
              prefetch={false}
              className="bg-white text-slate-900 px-8 py-3 rounded-xl font-semibold hover:bg-slate-100 transition-colors duration-200"
            >
              Sugerir Carrera
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
};

export default CareersPage;
