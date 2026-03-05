import { apiFetch } from '@/lib/api'

export async function POST(req: Request) {
  const body = await req.json()

  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const clientIp = forwarded ? forwarded.split(',')[0].trim() : realIp

  const backendRes = await apiFetch('/suggestions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(clientIp ? { 'X-Forwarded-For': clientIp } : {}),
    },
    body: JSON.stringify(body),
  })
  const text = await backendRes.text()
  const contentType = backendRes.headers.get('content-type') || 'application/json'
  return new Response(text, { status: backendRes.status, headers: { 'content-type': contentType } })
}
