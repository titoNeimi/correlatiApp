'use client'

import { useState } from 'react'
import {
  AuthCard,
  AuthField,
  AuthHeader,
  AuthLayout,
  AuthSubmitButton,
} from '@/components/auth/auth'

type ForgotPasswordResponse = {
  message?: string
  error?: string
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError('')
    setMessage('')

    const normalizedEmail = email.trim()
    if (!normalizedEmail) {
      setEmailError('Campo requerido')
      return
    }
    setEmailError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      })

      const data = (await response.json().catch(() => ({}))) as ForgotPasswordResponse
      if (!response.ok) {
        setSubmitError(data.error || 'No se pudo enviar el correo de recuperación')
        return
      }

      setMessage(
        data.message || 'Si el correo existe, te enviamos instrucciones para recuperar la contraseña.',
      )
    } catch {
      setSubmitError('No se pudo enviar el correo de recuperación')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <AuthCard>
        <AuthHeader title="Recuperar contraseña" subtitle="Te enviaremos un enlace para restablecerla" />

        <form noValidate onSubmit={handleSubmit} className="space-y-4">
          <AuthField
            label="Correo electrónico"
            type="email"
            id="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (emailError) setEmailError('')
              if (submitError) setSubmitError('')
              if (message) setMessage('')
            }}
            errorMessage={emailError}
          />

          <AuthSubmitButton isLoading={isLoading}>Enviar enlace</AuthSubmitButton>

          {message && (
            <div className="mb-2 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700">
              {message}
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
