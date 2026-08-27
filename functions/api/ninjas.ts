// Cloudflare Pages Function: same-origin proxy for the API-Ninjas animals
// endpoint. The real key lives in the API_NINJAS_KEY environment variable
// (set it in Cloudflare Pages → Settings → Environment variables; it must
// NOT be prefixed with NEXT_PUBLIC_). Responses are cached in memory for
// 6h to conserve the upstream quota.
//
// If the variable is unset, the function returns 503 and the client treats
// that as "no extended data" (the app is fully functional without it).

interface PagesEnv {
  API_NINJAS_KEY?: string
}

const UPSTREAM = 'https://api.api-ninjas.com/v1/animals'
const TTL_MS = 6 * 60 * 60 * 1000
const memoryCache = new Map<string, { at: number; body: string }>()

export async function onRequestGet(context: {
  request: Request
  env: PagesEnv
}) {
  const { request, env } = context
  const key = env.API_NINJAS_KEY
  if (!key) {
    return new Response(JSON.stringify({ error: 'API_NINJAS_KEY not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const url = new URL(request.url)
  const name = (url.searchParams.get('name') ?? '').trim()
  if (!name || name.length > 80 || !/^[a-zA-Z0-9 \-']+$/.test(name)) {
    return new Response(JSON.stringify({ error: 'invalid name' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const cacheKey = name.toLowerCase()
  const hit = memoryCache.get(cacheKey)
  if (hit && Date.now() - hit.at < TTL_MS) {
    return new Response(hit.body, {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
    })
  }

  const upstream = await fetch(`${UPSTREAM}?name=${encodeURIComponent(name)}`, {
    headers: { 'X-Api-Key': key },
  })
  if (!upstream.ok) {
    return new Response(JSON.stringify({ error: `upstream ${upstream.status}` }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const data = (await upstream.json()) as Array<Record<string, unknown>>
  const best =
    data.find((d) => String(d.name ?? '').toLowerCase() === cacheKey) ?? data[0] ?? null

  const body = JSON.stringify(best)
  memoryCache.set(cacheKey, { at: Date.now(), body })

  return new Response(body, {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
  })
}
