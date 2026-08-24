// Renders the app icon set from the real NASA Blue Marble photo
// (The Earth seen from Apollo 17, public domain) with the amber leaf brand
// accent. Usage: node scripts/render-icons.mjs   (run from pets-world/)
// Depends on sharp (optional dependency of next). The photo is cached at
// scripts/.earth-cache.jpg and refetched only when missing.

import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = resolve(root, 'public')
const cachePath = resolve(root, 'scripts/.earth-cache.jpg')
const EARTH_URL =
  'https://upload.wikimedia.org/wikipedia/commons/9/97/The_Earth_seen_from_Apollo_17.jpg'

let earthBuf
try {
  earthBuf = await readFile(cachePath)
} catch {
  const res = await fetch(EARTH_URL, { headers: { 'User-Agent': 'WorldWildlifeAtlas/1.0 (icon script)' } })
  if (!res.ok) throw new Error(`earth photo fetch failed: HTTP ${res.status}`)
  const full = Buffer.from(await res.arrayBuffer())
  earthBuf = await sharp(full).resize(320, 320, { fit: 'cover' }).jpeg({ quality: 82 }).toBuffer()
  await writeFile(cachePath, earthBuf)
}
const earthData = `data:image/jpeg;base64,${earthBuf.toString('base64')}`

// Shared mark: real Earth disc in a white ring, amber leaf accent.
// Pass a unique idSuffix when embedding more than once in one SVG.
const artwork = (idSuffix = '') => `
  <clipPath id="sphereClip${idSuffix}"><circle cx="32" cy="32" r="17"/></clipPath>
  <circle cx="32" cy="32" r="18" fill="#0b3049"/>
  <g clip-path="url(#sphereClip${idSuffix})">
    <image href="${earthData}" x="14" y="14" width="36" height="36" preserveAspectRatio="xMidYMid slice"/>
  </g>
  <circle cx="32" cy="32" r="17" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1.3"/>
  <ellipse cx="26" cy="24" rx="9" ry="4.5" fill="rgba(255,255,255,0.20)" transform="rotate(-24 26 24)"/>
  <path d="M53.5 26.5c1 13-6.5 24-19.5 26 1-13.5 8.5-23.5 19.5-26z" fill="#f0b13e"/>
  <path d="M36 50.5C42 43.5 48 34.5 52 28" fill="none" stroke="#123524" stroke-width="1.6" stroke-linecap="round"/>
`

const tileDefs = `
  <defs>
    <linearGradient id="tile" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1e4a35" />
      <stop offset="1" stop-color="#0d3d29" />
    </linearGradient>
  </defs>
`

// Standard icon: rounded forest tile with the Earth mark at full size.
const rounded = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  ${tileDefs}
  <rect width="64" height="64" rx="14" fill="url(#tile)" />
  ${artwork}
</svg>`

// Maskable icon: full-bleed tile, mark shrunk into the 80% safe zone.
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  ${tileDefs}
  <rect width="64" height="64" fill="url(#tile)" />
  <g transform="translate(32 32) scale(0.8) translate(-32 -32)">${artwork}</g>
</svg>`

const targets = [
  [rounded, 192, 'icon-192.png'],
  [rounded, 512, 'icon-512.png'],
  [maskable, 192, 'icon-maskable-192.png'],
  [maskable, 512, 'icon-maskable-512.png'],
  [maskable, 180, 'apple-touch-icon.png'],
]

// Social share card: Natura gradient, real Earth, wordmark.
const ogImage = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="ogbg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#16352a" />
      <stop offset="0.55" stop-color="#0f2b23" />
      <stop offset="1" stop-color="#0c2338" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#ogbg)" />
  <g transform="translate(740 75) scale(4.2)">${artwork('Big')}</g>
  <text x="92" y="298" font-family="Outfit, 'Segoe UI', Arial, sans-serif" font-size="84" font-weight="800" fill="#f2faf5">World Wildlife Atlas</text>
  <text x="94" y="360" font-family="Inter, 'Segoe UI', Arial, sans-serif" font-size="30" fill="#9fd6b8">186 species · Interactive globe · IUCN conservation status</text>
  <g transform="translate(92 92) scale(1.15)">${artwork('Small')}</g>
</svg>`

await mkdir(publicDir, { recursive: true })
await writeFile(resolve(root, 'src/app/icon.svg'), rounded + '\n')

for (const [svg, size, name] of targets) {
  const out = resolve(publicDir, name)
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(out)
  console.log(`wrote public/${name} (${size}x${size})`)
}

await sharp(Buffer.from(ogImage)).png().toFile(resolve(publicDir, 'og-image.png'))
console.log('wrote public/og-image.png (1200x630)')
