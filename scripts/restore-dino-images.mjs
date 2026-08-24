// One-off: rebuild ALL dino imageUrl data from the authoritative cache
// (scripts/.dino-image-cache.json) — restores lines lost to earlier
// replace-only rewrites. Offline and idempotent.
// Run from pets-world/: node scripts/restore-dino-images.mjs

import { readFile, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dataPath = resolve(root, 'src/data/dinosaurs.ts')
const cache = JSON.parse(await readFile(resolve(root, 'scripts/.dino-image-cache.json'), 'utf8'))

const lines = (await readFile(dataPath, 'utf8')).split('\n')

// Collect per-entry facts: slug, scientificName line, existing imageUrl lines.
const entries = []
for (let i = 0; i < lines.length; i++) {
  const slugM = lines[i].match(/^\s+slug:\s+'([^']+)',?\r?$/)
  if (!slugM) continue
  const entry = { slug: slugM[1], sciLine: -1, imgLines: new Set(), indent: '    ' }
  for (let j = i + 1; j < lines.length; j++) {
    if (/^\s{2}\},?\s*$/.test(lines[j])) break
    if (entry.sciLine < 0) {
      const sciM = lines[j].match(/^(\s+)scientificName:/)
      if (sciM) { entry.sciLine = j; entry.indent = sciM[1] }
    }
    if (/^\s+imageUrl:/.test(lines[j])) entry.imgLines.add(j)
  }
  if (entry.sciLine >= 0) entries.push(entry)
}

const dropLines = new Set()
for (const e of entries) for (const l of e.imgLines) dropLines.add(l)
const insertAfter = new Map() // sciLine -> url
for (const e of entries) {
  const url = cache[e.slug]?.url
  if (url) insertAfter.set(e.sciLine, url)
}

const result = []
for (let k = 0; k < lines.length; k++) {
  if (dropLines.has(k)) continue
  result.push(lines[k])
  if (insertAfter.has(k)) {
    const e = entries.find((x) => x.sciLine === k)
    result.push(`${e.indent}imageUrl: '${insertAfter.get(k)}',`)
  }
}

// Rebuild the REAL_DINO_IMAGES block wholesale from the cache.
const mapStart = result.findIndex((l) => l.includes('const REAL_DINO_IMAGES'))
if (mapStart < 0) throw new Error('REAL_DINO_IMAGES block not found')
let mapEnd = mapStart
while (mapEnd < result.length && !result[mapEnd].startsWith('};')) mapEnd++
const mapLines = Object.entries(cache).map(([slug, hit]) => `  "${slug}": "${hit.url}",`)
result.splice(mapStart + 1, mapEnd - mapStart - 1, ...mapLines)

await writeFile(dataPath, result.join('\n'))
console.log(`entries: ${entries.length}, with image: ${insertAfter.size}, map entries: ${mapLines.length}`)
