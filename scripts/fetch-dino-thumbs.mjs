// Downloads each cached dinosaur image once and derives self-hosted WebP
// variants, so markers/popups/heroes stop depending on Wikimedia's runtime
// thumbnailer (which rejects arbitrary sizes and rate-limits).
//   node scripts/fetch-dino-thumbs.mjs
// Outputs public/dino/<slug>-<width>w.webp for widths 128 / 480 / 960.
// Idempotent: existing outputs are skipped; delete a file to refresh it.

import { readFile, writeFile, mkdir, stat } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, 'public/dino')
const WIDTHS = [128, 480, 960]
const UA = 'WorldWildlifeAtlas/1.0 (local asset pipeline)'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const exists = (p) => stat(p).then(() => true).catch(() => false)

const cache = JSON.parse(await readFile(resolve(root, 'scripts/.dino-image-cache.json'), 'utf8'))
await mkdir(outDir, { recursive: true })

// Scientific name per slug lives in the data module's entries.
const dataSrc = await readFile(resolve(root, 'src/data/dinosaurs.ts'), 'utf8')
const sciByName = new Map()
for (const m of dataSrc.matchAll(/slug:\s*'([^']+)'\r?\n\s+commonName:[^\n]*\r?\n\s+scientificName:\s*'([^']+)'/g)) {
  sciByName.set(m[1], m[2])
}

/** Original file URL from the taxon's Wikipedia page (bypasses the restricted
 * thumbnailer; run #1 of fetch-dino-images proved this works for all taxa). */
async function wikiOriginalUrl(name) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) return null
  const data = await res.json()
  return data.originalimage?.source?.startsWith('https://') ? data.originalimage.source : null
}

/** Fetch first URL that answers OK; honors rate limits patiently
 *  (upload.wikimedia.org throttles bulk clients hard — weserv proxy comes
 *  first to sidestep it; Retry-After backoff remains as fallback). */
async function fetchAny(candidates) {
  for (const url of candidates) {
    if (!url) continue
    for (let attempt = 0; attempt < 6; attempt++) {
      try {
        const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' })
        if (res.ok) return Buffer.from(await res.arrayBuffer())
        const wait = Number(res.headers.get('retry-after')) || [5, 15, 40][Math.min(attempt, 2)]
        console.log(`  HTTP ${res.status} (try ${attempt + 1}) ${url.slice(-50)} — waiting ${wait}s`)
        if (res.status !== 429 && res.status < 500 && !(res.status === 400)) break
        await sleep(wait * 1000)
      } catch (e) {
        console.log(`  network error: ${e.message}`)
        await sleep(10000)
      }
    }
    await sleep(1000)
  }
  return null
}

/** Weserv-served, pre-sized copy of a remote image (public image CDN). */
function weservCandidate(remoteUrl, width) {
  if (!remoteUrl) return null
  const bare = remoteUrl.replace(/^https?:\/\//, '')
  return `https://images.weserv.nl/?url=${encodeURIComponent(bare)}&w=${width}&fit=inside&output=webp&q=85`
}

let ok = 0
let skipped = 0
const failed = []

for (const [slug, hit] of Object.entries(cache)) {
  const targets = WIDTHS.map((w) => resolve(outDir, `${slug}-${w}w.webp`))
  if (await Promise.all(targets.map(exists)).then((v) => v.every(Boolean))) {
    skipped++
    continue
  }

  let buf = null
  const name = sciByName.get(slug)
  const candidates = [weservCandidate(hit.url, 1440), hit.url]
  buf = await fetchAny(candidates)
  if (!buf && name) {
    console.log(`  falling back to Wikipedia original for ${slug}`)
    const orig = await wikiOriginalUrl(name)
    buf = await fetchAny([weservCandidate(orig, 1440), orig])
  }

  if (!buf) {
    failed.push(slug)
    continue
  }

  try {
    for (let i = 0; i < WIDTHS.length; i++) {
      await sharp(buf)
        .resize(WIDTHS[i], null, { width: WIDTHS[i], withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(targets[i])
    }
    ok++
    console.log(`OK  ${slug}`)
  } catch (e) {
    failed.push(`${slug} (sharp: ${e.message})`)
  }
  await sleep(700)
}

if (failed.length) {
  console.log('\nFAILED:')
  for (const f of failed) console.log('  ' + f)
}
console.log(`\nconverted: ${ok}, already present: ${skipped}, failed: ${failed.length}`)
process.exit(failed.length ? 1 : 0)
