import { cookies } from 'next/headers'

export async function GET() {
  const ck = await cookies()
  const session = ck.get('session_id')?.value

  const backendRes = await fetch('http://localhost:8080/auth/me', {
    method: 'GET',
    headers: session ? { cookie: `session_id=${session}` } : {},
  })

  const text = await backendRes.text()
  return new Response(text, { status: backendRes.status, headers: { 'content-type': backendRes.headers.get('content-type') || 'application/json' } })
}
