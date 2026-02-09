'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import {
  AuthCard,
  AuthField,
  AuthHeader,
  AuthLayout,
  AuthSubmitButton,
} from '@/components/auth/auth'

type ResetPasswordResponse = {
  message?: string
  error?: string
}

type FormErrors = {
  newPassword?: string
  repeatPassword?: string
}

function ResetPasswordPageContent() {
  const [newPassword, setNewPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const searchParams = useSearchParams()
  const router = useRouter()
  const tokenFromQuery = searchParams.get('token')?.trim() || ''

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError('')
    setSuccessMessage('')

    const formErrors: FormErrors = {}
    const normalizedNewPassword = newPassword.trim()
    const normalizedRepeatPassword = repeatPassword.trim()

    if (!tokenFromQuery) {
      setSubmitError('El enlace de recuperación es inválido o está incompleto')
      return
    }
    if (!normalizedNewPassword) formErrors.newPassword = 'Campo requerido'
    if (normalizedNewPassword.length < 8) {
      formErrors.newPassword = 'La contraseña debe tener al menos 8 caracteres'
    }
    if (!normalizedRepeatPassword) formErrors.repeatPassword = 'Campo requerido'
    if (normalizedNewPassword !== normalizedRepeatPassword) {
      formErrors.repeatPassword = 'Las contraseñas no coinciden'
    }

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      return
    }
    setErrors({})
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenFromQuery, newPassword: normalizedNewPassword }),
      })

      const data = (await response.json().catch(() => ({}))) as ResetPasswordResponse
      if (!response.ok) {
        setSubmitError(data.error || 'No se pudo restablecer la contraseña')
        return
      }

      setSuccessMessage(data.message || 'Contraseña restablecida correctamente')
      setNewPassword('')
      setRepeatPassword('')
      setTimeout(() => router.push('/login'), 1400)
    } catch {
      setSubmitError('No se pudo restablecer la contraseña')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <AuthCard>
        <AuthHeader title="Nueva contraseña" subtitle="Definí tu nueva contraseña para continuar" />

        <form noValidate onSubmit={handleSubmit} className="space-y-4">
          {!tokenFromQuery && (
            <div className="mb-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
              Este enlace no contiene token. Pedí un nuevo correo de recuperación.
            </div>
          )}

          <AuthField
            label="Nueva contraseña"
            type="password"
            id="newPassword"
            name="newPassword"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value)
              setErrors((prev) => ({ ...prev, newPassword: undefined }))
              if (submitError) setSubmitError('')
            }}
            errorMessage={errors.newPassword}
          />

          <AuthField
            label="Repetir nueva contraseña"
            type="password"
            id="repeatPassword"
            name="repeatPassword"
            autoComplete="new-password"
            value={repeatPassword}
            onChange={(e) => {
              setRepeatPassword(e.target.value)
              setErrors((prev) => ({ ...prev, repeatPassword: undefined }))
              if (submitError) setSubmitError('')
            }}
            errorMessage={errors.repeatPassword}
          />

          <AuthSubmitButton isLoading={isLoading} disabled={!tokenFromQuery}>
            Restablecer contraseña
          </AuthSubmitButton>

          {successMessage && (
            <div className="mb-2 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          )}

          {submitError && (
            <div className="mb-2 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              {submitError}
            </div>
          )}
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <a
            href="/login"
            className="cursor-pointer border-none bg-transparent font-semibold text-indigo-600 hover:underline"
          >
            Volver al login
          </a>
        </div>
      </AuthCard>
    </AuthLayout>
  )
}

const ResetPasswordFallback = () => (
  <AuthLayout>
    <AuthCard>
      <AuthHeader title="Nueva contraseña" subtitle="Cargando..." />
      <div className="py-8 text-center text-sm text-slate-600">Preparando formulario...</div>
    </AuthCard>
  </AuthLayout>
)

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordPageContent />
    </Suspense>
  )
}
