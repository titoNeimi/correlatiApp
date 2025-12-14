// app/(auth)/login/actions.ts
'use server'

import { redirect } from 'next/navigation'

type State = { error?: string }

export async function loginAction(_prevState: State, formData: FormData): Promise<State> {
  const email = String(formData.get('email') || '')
  const password = String(formData.get('password') || '')

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    return { error: 'Usuario o contraseña incorrectos' }
  }

  redirect('/')
}
