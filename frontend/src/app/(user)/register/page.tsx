'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowRight, CheckCircle2, KeyRound, Mail, UserPlus } from 'lucide-react'

interface FormData {
  email: string
  password: string
  password2: string
}

interface FormErrors {
  email?: string
  password?: string
  password2?: string
}

export default function RegisterPage() {
  const router = useRouter()

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    password2: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    setErrors((prev) => ({ ...prev, [name]: undefined }))
    if (submitError) setSubmitError('')
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError('')

    const newErrors: FormErrors = {}
    const email = formData.email.trim()
    const password = formData.password.trim()
    const password2 = formData.password2.trim()

    if (!email) newErrors.email = 'Campo requerido'
    if (!password) newErrors.password = 'Campo requerido'
    if (!password2) newErrors.password2 = 'Campo requerido'

    if (password?.length < 8) newErrors.password = 'La contrasena debe tener al menos 8 caracteres'

    if (!newErrors.password2 && password && password2 && password !== password2) {
      newErrors.password2 = 'Las contrasenas no coinciden'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setIsLoading(true)

    try {
      const resp = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await resp.json()

      if (!resp.ok) {
        setSubmitError(data.error || 'Error en el registro')
        return
      }

      router.push('/login')
    } catch (err) {
      console.error('Error en registro:', err)
      setSubmitError('No se pudo completar el registro. Intentalo nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[480px_1.1fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl sm:p-10 lg:order-1">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Crea tu cuenta</h1>
            <p className="mt-2 text-sm text-slate-600">Te tomara menos de un minuto empezar.</p>
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
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.password)}
                  className={`w-full rounded-xl border bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition-colors ${
                    errors.password
                      ? 'border-red-300 focus:border-red-400'
                      : 'border-slate-200 focus:border-slate-400'
                  }`}
                  placeholder="Minimo 8 caracteres"
                />
              </div>
              {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="password2" className="text-sm font-semibold text-slate-700">
                Repetir contrasena
              </label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password2"
                  name="password2"
                  type="password"
                  autoComplete="new-password"
                  value={formData.password2}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.password2)}
                  className={`w-full rounded-xl border bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition-colors ${
                    errors.password2
                      ? 'border-red-300 focus:border-red-400'
                      : 'border-slate-200 focus:border-slate-400'
                  }`}
                  placeholder="Repite la contrasena"
                />
              </div>
              {errors.password2 && <p className="text-xs text-red-600">{errors.password2}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creando cuenta...
                </>
              ) : (
                <>
                  Registrarme
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {submitError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            )}
          </form>

          <p className="mt-7 text-center text-sm text-slate-600">
            Ya tienes cuenta?{' '}
            <Link href="/login" className="font-semibold text-slate-900 hover:text-slate-700">
              Inicia sesion aqui
            </Link>
          </p>
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-xl sm:p-10 lg:order-2">
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-100/80 blur-xl" />
          <div className="pointer-events-none absolute -bottom-10 left-0 h-36 w-36 rounded-full bg-sky-100/80 blur-xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold tracking-wide text-white">
              <UserPlus className="h-4 w-4" />
              Nuevo usuario
            </div>

            <h2 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">Empieza a planificar mejor tu carrera</h2>
            <p className="mt-3 max-w-xl text-slate-600">
              Crea tu cuenta para guardar carreras favoritas, ver correlativas y seguir tu avance materia por materia.
            </p>

            <div className="mt-8 grid gap-3">
              {[
                'Explora carreras y universidades en un solo lugar',
                'Define tu plan academico con una vista clara',
                'Mantiene tu progreso sincronizado',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="rounded-xl bg-emerald-100 p-1.5 text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <p className="text-sm text-slate-700">{item}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Al registrarte aceptas continuar con las politicas de uso de la plataforma.
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
