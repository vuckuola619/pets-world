type IllustrationDinosaur = {
  commonName: string
  family: string
  diet: string
  region: string
  interval: string
}

export type DinosaurIllustration = {
  url: string
  alt: string
  credit: string
  kind: 'illustration'
}

const REGION_PALETTES: Record<string, { sky: string; ground: string; accent: string; body: string }> = {
  Africa: { sky: '#f4c66f', ground: '#7f5539', accent: '#d97706', body: '#8b5e34' },
  Antarctic: { sky: '#b8d7e8', ground: '#d8eef4', accent: '#3b82a6', body: '#52758f' },
  Asia: { sky: '#d8b56d', ground: '#72624f', accent: '#b45309', body: '#7c6f45' },
  Europe: { sky: '#b7c99b', ground: '#66764e', accent: '#4d7c0f', body: '#5f7f51' },
  'North America': { sky: '#d9b48f', ground: '#7b5e47', accent: '#b45309', body: '#7f5d3b' },
  Oceania: { sky: '#d4a373', ground: '#806443', accent: '#0f766e', body: '#8b6f47' },
  'South America': { sky: '#d8a35d', ground: '#765827', accent: '#a16207', body: '#7c4f2c' },
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function archetype(record: IllustrationDinosaur): 'theropod' | 'sauropod' | 'ceratopsian' | 'armored' | 'ornithopod' {
  const family = record.family.toLowerCase()
  const name = record.commonName.toLowerCase()

  if (family.includes('ceratops') || name.includes('triceratops') || name.includes('protoceratops')) return 'ceratopsian'
  if (
    family.includes('sauropod') ||
    family.includes('dicraeosaur') ||
    name.includes('argentinosaurus') ||
    name.includes('nigersaurus') ||
    name.includes('amargasaurus')
  ) return 'sauropod'
  if (
    family.includes('ankylosaur') ||
    family.includes('stegosaur') ||
    name.includes('stegosaurus') ||
    name.includes('kunbarrasaurus') ||
    name.includes('antarctopelta')
  ) return 'armored'
  if (
    family.includes('iguanodont') ||
    family.includes('hadrosaur') ||
    name.includes('iguanodon') ||
    name.includes('ouranosaurus') ||
    name.includes('muttaburrasaurus') ||
    name.includes('psittacosaurus')
  ) return 'ornithopod'
  return 'theropod'
}

function animalShape(kind: ReturnType<typeof archetype>, body: string, accent: string): string {
  if (kind === 'sauropod') {
    return `
      <ellipse cx="305" cy="258" rx="125" ry="54" fill="${body}"/>
      <path d="M376 230 C438 174 476 145 511 156 C535 164 535 191 510 198 C485 205 456 205 421 246 Z" fill="${body}"/>
      <ellipse cx="512" cy="158" rx="27" ry="20" fill="${body}"/>
      <path d="M189 254 C132 246 95 224 61 187 C111 197 155 206 218 230 Z" fill="${body}"/>
      <rect x="235" y="288" width="26" height="88" rx="12" fill="${body}"/>
      <rect x="329" y="287" width="27" height="90" rx="12" fill="${body}"/>
      <circle cx="520" cy="153" r="4" fill="#1f2937"/>
      <path d="M258 219 C306 200 353 202 397 222" stroke="${accent}" stroke-width="12" stroke-linecap="round" fill="none" opacity=".55"/>
    `
  }

  if (kind === 'ceratopsian') {
    return `
      <ellipse cx="294" cy="270" rx="121" ry="56" fill="${body}"/>
      <path d="M386 237 L481 190 L463 285 Z" fill="${body}"/>
      <path d="M463 201 C512 210 533 248 503 280 C479 306 443 292 434 259 C428 234 439 213 463 201 Z" fill="${accent}" opacity=".78"/>
      <path d="M492 237 L550 211 L504 253 Z" fill="#f8fafc"/>
      <path d="M484 261 L535 268 L490 275 Z" fill="#f8fafc"/>
      <path d="M182 265 C132 258 98 241 72 215 C118 219 158 226 207 243 Z" fill="${body}"/>
      <rect x="227" y="308" width="26" height="68" rx="12" fill="${body}"/>
      <rect x="331" y="309" width="26" height="67" rx="12" fill="${body}"/>
      <circle cx="479" cy="235" r="4" fill="#1f2937"/>
    `
  }

  if (kind === 'armored') {
    return `
      <ellipse cx="305" cy="280" rx="132" ry="50" fill="${body}"/>
      <path d="M178 267 C125 259 91 238 60 206 C107 213 157 222 210 246 Z" fill="${body}"/>
      <ellipse cx="455" cy="261" rx="47" ry="32" fill="${body}"/>
      <circle cx="469" cy="251" r="4" fill="#1f2937"/>
      <rect x="238" y="311" width="27" height="65" rx="12" fill="${body}"/>
      <rect x="343" y="312" width="27" height="64" rx="12" fill="${body}"/>
      <path d="M188 237 L213 197 L236 239 M246 225 L270 184 L292 229 M304 219 L329 179 L351 225 M361 226 L386 190 L407 235" stroke="${accent}" stroke-width="13" stroke-linecap="round" fill="none"/>
    `
  }

  if (kind === 'ornithopod') {
    return `
      <ellipse cx="313" cy="264" rx="105" ry="50" fill="${body}"/>
      <path d="M385 234 C430 214 475 222 498 251 C467 263 426 263 388 250 Z" fill="${body}"/>
      <circle cx="472" cy="238" r="4" fill="#1f2937"/>
      <path d="M225 258 C163 253 117 232 80 197 C132 204 184 214 240 234 Z" fill="${body}"/>
      <path d="M282 303 L243 378 L284 378 L312 311 Z" fill="${body}"/>
      <path d="M350 303 L394 376 L435 376 L377 299 Z" fill="${body}"/>
      <path d="M274 225 C311 207 354 210 394 230" stroke="${accent}" stroke-width="10" stroke-linecap="round" fill="none" opacity=".55"/>
    `
  }

  return `
    <ellipse cx="311" cy="250" rx="104" ry="49" fill="${body}"/>
    <path d="M386 216 C430 181 496 190 523 226 C489 246 431 250 389 238 Z" fill="${body}"/>
    <path d="M225 253 C164 263 117 258 73 229 C122 214 177 218 242 230 Z" fill="${body}"/>
    <path d="M284 286 L247 377 L289 377 L323 292 Z" fill="${body}"/>
    <path d="M349 285 L407 374 L448 374 L380 284 Z" fill="${body}"/>
    <path d="M436 230 L468 217 L441 247 Z" fill="#f8fafc"/>
    <circle cx="494" cy="214" r="4" fill="#1f2937"/>
    <path d="M276 214 C315 193 356 196 397 217" stroke="${accent}" stroke-width="10" stroke-linecap="round" fill="none" opacity=".58"/>
  `
}

export function createDinosaurIllustration(record: IllustrationDinosaur): DinosaurIllustration {
  const palette = REGION_PALETTES[record.region] ?? REGION_PALETTES['North America']
  const kind = archetype(record)
  const label = escapeXml(record.commonName)
  const subtitle = escapeXml(`${record.region} - ${record.interval}`)
  const shape = animalShape(kind, palette.body, palette.accent)

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420" role="img" aria-label="${label} paleoart illustration">
    <defs>
      <linearGradient id="sky" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="${palette.sky}"/>
        <stop offset="1" stop-color="#f8ead2"/>
      </linearGradient>
      <radialGradient id="sun" cx="75%" cy="18%" r="25%">
        <stop offset="0" stop-color="#fff7c2"/>
        <stop offset="1" stop-color="${palette.sky}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="640" height="420" fill="url(#sky)"/>
    <rect width="640" height="420" fill="url(#sun)"/>
    <path d="M0 314 C98 283 155 294 235 306 C334 320 425 292 640 307 L640 420 L0 420 Z" fill="${palette.ground}"/>
    <path d="M0 333 C160 305 309 340 640 321" fill="none" stroke="#fff4dc" stroke-width="5" opacity=".22"/>
    ${shape}
    <ellipse cx="312" cy="381" rx="177" ry="13" fill="#292524" opacity=".18"/>
    <rect x="28" y="28" width="584" height="58" rx="18" fill="#20150d" opacity=".38"/>
    <text x="48" y="59" font-family="Arial, sans-serif" font-size="25" font-weight="700" fill="#fff8ec">${label}</text>
    <text x="48" y="78" font-family="Arial, sans-serif" font-size="13" fill="#fff0d4">${subtitle}</text>
  </svg>`

  return {
    url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    alt: `${record.commonName} paleoart illustration based on PBDB fossil occurrence metadata`,
    credit: 'Generated paleoart thumbnail from PBDB occurrence metadata',
    kind: 'illustration',
  }
}
