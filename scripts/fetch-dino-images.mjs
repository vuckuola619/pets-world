// Picks a paleo LIFE-RESTORATION image for each dinosaur, anchored to the
// taxon's own genus name so images of related genera are never used.
// Primary source: Commons file search "genus restoration"; secondary: the
// images present on the taxon's Wikipedia page. Misses remove the imageUrl
// line so the generated SVG illustration fallback applies (data contract:
// no fossil/skeleton/museum shots — see src/test/dinosaurs.test.ts).
// Run from pets-world/: node scripts/fetch-dino-images.mjs

import { readFile, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dataPath = resolve(root, 'src/data/dinosaurs.ts')

const UA = 'WorldWildlifeAtlas/1.0 (local dev asset script)'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const EXCLUDE = /(fossil|skeleton|skull|museum|mount|holotype|specimen|bone|journal|map|chart|diagram|comparison|scale|size|classification|clad|icon|flag|logo|range|distribution|timeline|strata|dig|excavat|teeth|tooth|vertebra|pelvis|footprint|trackway|anatomy|osteoderm|muscle|paper|fig\.|restoration_error|wireframe|silhouette)/i
const RESTORATION = /(restor|reconstr|life)/i

async function apiGet(host, params) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const url = `https://${host}/w/api.php?${new URLSearchParams(params)}`
    let res
    try {
      res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' })
    } catch {
      await sleep(2500)
      continue
    }
    if (res.status === 429 || res.status >= 500) {
      await sleep(3500)
      continue
    }
    if (!res.ok) return null
    return res.json()
  }
  return null
}

function genusOf(name) {
  return name.split(' ')[0].toLowerCase()
}

function relevant(fileTitle, genus) {
  const lower = fileTitle.toLowerCase()
  return lower.includes(genus)
}

async function commonsSearch(genus) {
  const data = await apiGet('commons.wikimedia.org', {
    action: 'query', format: 'json', list: 'search',
    srnamespace: '6', srlimit: '25', srsearch: `${genus} restoration`,
  })
  const hits = (data?.query?.search ?? []).map((s) => s.title).filter((t) => t.startsWith('File:'))
  const candidates = hits.filter((t) => /\.(jpe?g|png)$/i.test(t) && !EXCLUDE.test(t) && relevant(t, genus))
  const preferred = candidates.filter((t) => RESTORATION.test(t))
  return (preferred[0] ?? candidates[0]) ?? null
}

async function pageImages(title, genus) {
  const data = await apiGet('en.wikipedia.org', {
    action: 'query', format: 'json', prop: 'images', imlimit: '100',
    titles: title, redirects: '1',
  })
  const pages = data?.query?.pages ?? {}
  const page = Object.values(pages)[0]
  const files = (page?.images ?? []).map((i) => i.title).filter((t) => t.startsWith('File:'))
  const candidates = files.filter((t) => /\.(jpe?g|png)$/i.test(t) && !EXCLUDE.test(t) && relevant(t, genus) && RESTORATION.test(t))
  return candidates[0] ?? null
}

async function fileUrl(host, fileTitle) {
  const data = await apiGet(host, {
    action: 'query', format: 'json', prop: 'imageinfo', iiprop: 'url',
    titles: fileTitle,
  })
  const pages = data?.query?.pages ?? {}
  const page = Object.values(pages)[0]
  const url = page?.imageinfo?.[0]?.url
  return url && url.startsWith('https://') ? url : null
}

async function bestImage(scientificName) {
  const genus = genusOf(scientificName)
  let file = await commonsSearch(genus)
  let origin = 'commons'
  if (!file) {
    await sleep(400)
    file = await pageImages(scientificName, genus)
    origin = 'enwiki'
  }
  if (!file) return null
  await sleep(400)
  const url = await fileUrl(origin === 'commons' ? 'commons.wikimedia.org' : 'en.wikipedia.org', file)
  return url ? { url, file: file.replace('File:', ''), origin } : null
}

const source = await readFile(dataPath, 'utf8')
const lines = source.split('\n')

const entries = []
for (let i = 0; i < lines.length; i++) {
  const s = lines[i].match(/^(\s+)slug:\s+'([^']+)',?\r?$/)
  if (!s) continue
  let imgLine = -1
  for (let j = i + 1; j < Math.min(i + 45, lines.length); j++) {
    if (/^\s{2}\},?\s*$/.test(lines[j])) break
    if (/^\s+imageUrl:\s+'[^']*'/.test(lines[j])) { imgLine = j; break }
  }
  entries.push({ slugLine: i, indent: s[1], slug: s[2], imgLine, name: null })
}
for (const e of entries) {
  for (let j = e.slugLine + 1; j < e.slugLine + 10; j++) {
    const m = lines[j].match(/^\s+scientificName:\s+'([^']+)'/)
    if (m) { e.name = m[1]; break }
  }
}
const dataEntries = entries.filter((e) => e.name)
console.log(`found ${dataEntries.length} data entries`)

const cachePath = resolve(root, 'scripts/.dino-image-cache.json')
let cache = {}
try {
  cache = JSON.parse(await readFile(cachePath, 'utf8'))
} catch {
  cache = {}
}

const bySlug = new Map()
for (const e of dataEntries) {
  if (bySlug.has(e.slug)) continue
  let hit = await bestImage(e.name)
  if (!hit && cache[e.slug]) {
    hit = cache[e.slug]
    console.log(`CACHED  ${e.slug}  -> ${hit.file}`)
  } else if (hit) {
    cache[e.slug] = hit
  }
  if (hit) bySlug.set(e.slug, hit)
  if (!hit) console.log(`MISS  ${e.slug}`)
  else if (!cache[e.slug]) console.log(`OK(${hit.origin})  ${e.slug}  -> ${hit.file}`)
  await sleep(500)
}
await writeFile(cachePath, JSON.stringify(cache, null, 2))

const result = []
for (let i = 0; i < lines.length; i++) {
  const e = dataEntries.find((x) => x.imgLine === i)
  if (e) {
    const hit = bySlug.get(e.slug)
    if (hit) result.push(`${e.indent}imageUrl: '${hit.url}',`)
    // MISS: drop the line -> schema optional -> SVG fallback
    continue
  }
  result.push(lines[i])
}
await writeFile(dataPath, result.join('\n'))

// Rewrite the REAL_DINO_IMAGES slug map; drop entries without a hit.
const mapLines = (await readFile(dataPath, 'utf8')).split('\n').flatMap((line) => {
  const m = line.match(/^  "([a-z0-9-]+)": "https?:\/\/[^"]+",?\r?$/)
  if (!m) return [line]
  const hit = bySlug.get(m[1])
  return hit ? [`  "${m[1]}": "${hit.url}",`] : []
})
await writeFile(dataPath, mapLines.join('\n'))

const ok = bySlug.size
console.log(`\ncoverage: ${ok}/${new Set(dataEntries.map((e) => e.slug)).size} slugs with genus-anchored life-restoration images`)
