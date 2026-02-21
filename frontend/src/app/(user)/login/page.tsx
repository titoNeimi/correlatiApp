'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { Suspense, useState } from 'react'
import { ArrowRight, KeyRound, Mail, ShieldCheck, Sparkles } from 'lucide-react'

import { useUser } from '@/context/UserContext'

interface FormData {
  email: string
  password: string
}

interface FormErrors {
  email?: string
  password?: string
}

function LoginPageContent() {
  const [formData, setFormData] = useState<FormData>({ email: '', password: '' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [authError, setAuthError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const { refresh } = useUser()

  const getRedirectPath = (value: string | null) => {
    if (!value) return '/'
    if (!value.startsWith('/')) return '/'
    if (value.startsWith('//')) return '/'
    return value
  }

  const safeNextPath = getRedirectPath(searchParams.get('next'))
  const registerHref = safeNextPath !== '/' ? `/register?next=${encodeURIComponent(safeNextPath)}` : '/register'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
    if (authError) setAuthError('')
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAuthError('')

    const newErrors: FormErrors = {}
    const email = formData.email.trim()
    const password = formData.password.trim()

    if (!email) newErrors.email = 'Campo requerido'
    if (!password) newErrors.password = 'Campo requerido'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setIsLoading(true)

    try {
      const result = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!result.ok) {
        setAuthError('Usuario o contrasena incorrectos')
        return
      }

      try {
        await refresh()
      } catch {
        window.location.reload()
        return
      }

      router.push(safeNextPath)
    } catch (error) {
      console.error('Error al iniciar sesion:', error)
      setAuthError('Usuario o contrasena incorrectos')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_480px]">
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-xl sm:p-10">
          <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-sky-100/80 blur-xl" />
          <div className="pointer-events-none absolute -bottom-12 right-0 h-32 w-32 rounded-full bg-amber-100/80 blur-xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold tracking-wide text-white">
              <Sparkles className="h-4 w-4" />
              Acceso
            </div>

            <h1 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">Bienvenido de nuevo</h1>
            <p className="mt-3 max-w-xl text-slate-600">
              Inicia sesion para seguir tu plan de carrera, revisar correlativas y continuar donde te quedaste.
            </p>

            <div className="mt-8 space-y-3">
              <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="rounded-xl bg-sky-100 p-2 text-sky-700">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Tu progreso guardado</p>
                  <p className="text-sm text-slate-600">Retoma tu avance en materias desde cualquier dispositivo.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="rounded-xl bg-amber-100 p-2 text-amber-700">
                  <ArrowRight className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Acceso rapido</p>
                  <p className="text-sm text-slate-600">Entra a tus carreras, favoritas y plan en segundos.</p>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              No tienes cuenta todavia?{' '}
              <Link href={registerHref} className="font-semibold text-slate-900 hover:text-slate-700">
                Registrate gratis
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl sm:p-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Iniciar sesion</h2>
            <p className="mt-2 text-sm text-slate-600">Ingresa tus credenciales para continuar.</p>
          </div>

          <form noValidate onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-slate-700">
                Correo electronico
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.email)}
                  className={`w-full rounded-xl border bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition-colors ${
                    errors.email
                      ? 'border-red-300 focus:border-red-400'
                      : 'border-slate-200 focus:border-slate-400'
                  }`}
                  placeholder="correo@ejemplo.com"
                />
              </div>
              {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-semibold text-slate-700">
                Contrasena
              </label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.password)}
                  className={`w-full rounded-xl border bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition-colors ${
                    errors.password
                      ? 'border-red-300 focus:border-red-400'
                      : 'border-slate-200 focus:border-slate-400'
                  }`}
                  placeholder="Ingresa tu contrasena"
                />
              </div>
              {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
            </div>

            <div className="text-right">
              <Link href="/forgot-password" className="text-sm font-semibold text-slate-700 hover:text-slate-900">
                Olvidaste tu contrasena?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Validando acceso...
                </>
              ) : (
                'Entrar'
              )}
            </button>

            {authError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {authError}
              </div>
            )}
          </form>

          <p className="mt-7 text-center text-sm text-slate-600">
            No tienes cuenta?{' '}
            <Link href={registerHref} className="font-semibold text-slate-900 hover:text-slate-700">
              Registrate aqui
            </Link>
          </p>
        </section>
      </div>
    </div>
  )
}

const LoginFallback = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50 px-4 py-10 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl text-sm text-slate-600">
      Cargando login...
    </div>
  </div>
)

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginPageContent />
    </Suspense>
  )
}
