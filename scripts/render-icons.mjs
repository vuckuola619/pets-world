// Regenerates the PWA / Apple touch icons from the atlas mark.
// Usage: node scripts/render-icons.mjs   (run from pets-world/)
// Depends on sharp, which ships as an optional dependency of next.

import { mkdir, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = resolve(root, 'public')

const artwork = `
  <g fill="none" stroke="#8fdcb2" stroke-linecap="round">
    <circle cx="30" cy="30" r="16" stroke-width="2.6" />
    <ellipse cx="30" cy="30" rx="7" ry="16" stroke-width="2" opacity="0.8" />
    <path d="M14 30h32" stroke-width="2" opacity="0.8" />
  </g>
  <path d="M53.5 26.5c1 13-6.5 24-19.5 26 1-13.5 8.5-23.5 19.5-26z" fill="#f0b13e" />
  <path d="M36 50.5C42 43.5 48 34.5 52 28" fill="none" stroke="#123524" stroke-width="1.6" stroke-linecap="round" />
`

const defs = `
  <defs>
    <linearGradient id="tile" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1e4a35" />
      <stop offset="1" stop-color="#0d3d29" />
    </linearGradient>
  </defs>
`

// Standard icon: rounded tile, artwork at full scale (matches src/app/icon.svg).
const rounded = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  ${defs}
  <rect width="64" height="64" rx="14" fill="url(#tile)" />
  ${artwork}
</svg>`

// Maskable icon: full-bleed square, artwork shrunk into the 80% safe zone.
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  ${defs}
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

// Social share card: Natura gradient, globe wireframe, wordmark.
const ogImage = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="ogbg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#16352a" />
      <stop offset="0.55" stop-color="#0f2b23" />
      <stop offset="1" stop-color="#0c2338" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#ogbg)" />
  <g fill="none" stroke="#8fdcb2" stroke-linecap="round" opacity="0.9" transform="translate(740 90) scale(4)">
    <circle cx="60" cy="60" r="58" stroke-width="3" />
    <ellipse cx="60" cy="60" rx="25" ry="58" stroke-width="2.4" opacity="0.8" />
    <path d="M2 60h116" stroke-width="2.4" opacity="0.8" />
  </g>
  <path d="M985 400c18 82-41 152-130 168 7-88 59-149 130-168z" fill="#f0b13e" />
  <text x="92" y="298" font-family="Outfit, 'Segoe UI', Arial, sans-serif" font-size="84" font-weight="800" fill="#f2faf5">World Wildlife Atlas</text>
  <text x="94" y="360" font-family="Inter, 'Segoe UI', Arial, sans-serif" font-size="30" fill="#9fd6b8">186 species · Interactive globe · IUCN conservation status</text>
  <g transform="translate(92 92)">
    <rect width="76" height="76" rx="17" fill="#1e4a35" />
    <g fill="none" stroke="#8fdcb2" stroke-linecap="round" transform="translate(13 13) scale(0.78)">
      <circle cx="32" cy="32" r="27" stroke-width="4" />
      <ellipse cx="32" cy="32" rx="12" ry="27" stroke-width="3" opacity="0.8" />
      <path d="M5 32h54" stroke-width="3" opacity="0.8" />
    </g>
    <path d="M62 34c8 20-10 37-31 41 2-21 14-36 31-41z" fill="#f0b13e" />
  </g>
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
