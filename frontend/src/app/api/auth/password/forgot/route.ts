import { apiFetch } from '@/lib/api'

export async function POST(req: Request) {
  const body = await req.json()

  const backendRes = await apiFetch('/auth/password/forgot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const text = await backendRes.text()
  const contentType = backendRes.headers.get('content-type') || 'application/json'

  return new Response(text, { status: backendRes.status, headers: { 'content-type': contentType } })
}
