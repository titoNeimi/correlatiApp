'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { Bug, Building2, GraduationCap, Lightbulb, MessageSquare, Send, Sparkles } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { ClientPageShell } from '@/components/layout/client-page-shell'

const suggestionTypes = [
  {
    id: 'career',
    title: 'Sugerir carrera',
    description: 'Sumamos nuevas propuestas al catalogo.',
    icon: GraduationCap,
    tone: 'from-sky-50 via-white to-cyan-50',
    badge: 'bg-sky-100 text-sky-700'
  },
  {
    id: 'university',
    title: 'Sugerir universidad',
    description: 'Agrega instituciones que faltan.',
    icon: Building2,
    tone: 'from-amber-50 via-white to-orange-50',
    badge: 'bg-amber-100 text-amber-700'
  },
  {
    id: 'feature',
    title: 'Pedir feature',
    description: 'Ideas para nuevas funciones.',
    icon: Lightbulb,
    tone: 'from-rose-50 via-white to-pink-50',
    badge: 'bg-rose-100 text-rose-700'
  },
  {
    id: 'bug',
    title: 'Reportar bug',
    description: 'Detecta errores o comportamientos raros.',
    icon: Bug,
    tone: 'from-slate-50 via-white to-gray-50',
    badge: 'bg-slate-200 text-slate-700'
  }
]

const quickTips = [
  'Inclui la universidad, ciudad y link si lo tenes.',
  'Detalla el plan o nombre oficial de la carrera.',
  'Para bugs, describe pasos para reproducir.',
  'Adjunta capturas o links si aplica.'
]


export default function SuggestionsPage() {
  const searchParams = useSearchParams()
  const [selectedType, setSelectedType] = useState<string | null>(null)

  const typeByParam = useMemo(() => {
    const value = searchParams.get('formulario')?.toLowerCase()
    if (!value) return null
    if (value.startsWith('carr')) return 'career'
    if (value.startsWith('univ')) return 'university'
    if (value.startsWith('feat')) return 'feature'
    if (value.startsWith('bug')) return 'bug'
    return null
  }, [searchParams])

  useEffect(() => {
    if (typeByParam) {
      setSelectedType(typeByParam)
    }
  }, [typeByParam])

  return (
    <ClientPageShell>
      <section className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-100 shadow-xl p-6 sm:p-8 mb-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-3 py-1 rounded-full text-xs font-semibold tracking-wide">
              <Sparkles className="w-4 h-4" />
              Sugerencias y reportes
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-4">
              Ayudanos a mejorar el catalogo
            </h1>
            <p className="text-slate-600 mt-3 max-w-2xl">
              Dejanos tu propuesta para nuevas carreras, universidades o mejoras.
              Esta pagina es solo estetica: los formularios se conectan mas adelante.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Categorias</h2>
              <div className="space-y-4">
                {suggestionTypes.map((type) => {
                  const isActive = selectedType === type.id
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSelectedType(type.id)}
                      className={`w-full text-left rounded-2xl border p-4 transition-all duration-300 ${
                        isActive
                          ? 'border-slate-900 shadow-lg -translate-y-1 bg-gradient-to-br'
                          : 'border-slate-100 bg-gradient-to-br hover:-translate-y-0.5 hover:shadow-md'
                      } ${type.tone}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-xl transition-transform duration-300 ${
                            isActive ? 'scale-110' : ''
                          } ${type.badge}`}
                        >
                          <type.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{type.title}</p>
                          <p className="text-xs text-slate-600">{type.description}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Tips rapidos</h3>
              <div className="space-y-3 text-sm text-slate-600">
                {quickTips.map((tip) => (
                  <div key={tip} className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-slate-900" />
                    <p>{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Formulario de sugerencias</h2>
                  <p className="text-slate-600">Completa los datos principales. Guardamos la info para despues.</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Nombre</label>
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Email (opcional)</label>
                  <input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">Tipo de sugerencia</label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {suggestionTypes.map((type) => {
                      const isActive = selectedType === type.id
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setSelectedType(type.id)}
                          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-all duration-300 ${
                            isActive
                              ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                              : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:shadow-sm'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <type.icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
                            {type.title}
                          </span>
                          <span className={`text-xs ${isActive ? 'text-white/80' : 'text-slate-500'}`}>
                            {isActive ? 'Seleccionado' : 'Seleccionar'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">Descripcion</label>
                  <textarea
                    placeholder="Contanos los detalles de tu sugerencia o bug"
                    rows={5}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <MessageSquare className="w-4 h-4" />
                  Adjuntos y estados se agregan mas adelante.
                </div>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Enviar sugerencia
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-700 text-white rounded-2xl p-6">
              <h3 className="text-lg font-semibold">Reportes de bug</h3>
              <p className="text-slate-200 mt-2 text-sm">
                Si tu reporte es tecnico, agregaremos un formulario con pasos y logs.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm">
                {['Paso a paso', 'Capturas', 'Prioridad'].map((item) => (
                  <div key={item} className="bg-white/10 rounded-xl px-4 py-3 text-center">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </ClientPageShell>
  )
}
