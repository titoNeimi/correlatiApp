import { cookies } from 'next/headers'
import { apiFetch } from '@/lib/api'

export async function POST(req: Request) {
  const body = await req.json()

  const backendRes = await apiFetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const text = await backendRes.text()
  const contentType = backendRes.headers.get('content-type') || 'application/json'

  const sc = backendRes.headers.get('set-cookie')
  if (sc) {
    const m = sc.match(/([^=;\s]+)=([^;\s]+)/)
    if (m) {
      const name = m[1]
      const value = m[2]
      const ck = await cookies()
      try {
        ck.set({ name, value, path: '/', sameSite: 'lax', httpOnly: true })
      } catch {
        ck.set({ name, value, path: '/', sameSite: 'lax' })
      }
    }
  }

  return new Response(text, { status: backendRes.status, headers: { 'content-type': contentType } })
}
