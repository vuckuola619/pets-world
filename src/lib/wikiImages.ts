/**
 * Self-hosted WebP variant for dinosaur taxa, generated once at build time
 * by scripts/fetch-dino-thumbs.mjs (public/dino/<slug>-<w>w.webp). Using
 * local files avoids Wikimedia's runtime thumbnailer entirely.
 */
export function localDinoThumb(slug: string, width: 128 | 480 | 960): string {
  return `/dino/${slug}-${width}w.webp`
}

/**
 * Derives a sized Wikimedia thumbnail URL from an original-file URL.
 * Wikimedia only serves a fixed set of thumb widths — arbitrary sizes
 * return HTTP 400 ("Use thumbnail sizes listed on ..."). 120px is verified
 * allowed and crisp enough for map markers (38px @ up to 3x DPR).
 */
export function wikiThumbUrl(url: string, px: number): string {
  if (!url.startsWith('https://upload.wikimedia.org/wikipedia/commons/')) return url
  const marker = '/wikipedia/commons/'
  const rest = url.slice(url.indexOf(marker) + marker.length)
  const query = rest.includes('?') ? '?' + rest.slice(rest.indexOf('?') + 1) : ''
  const path = query ? rest.slice(0, rest.indexOf('?')) : rest
  if (path.startsWith('thumb/')) {
    // thumb/<hash>/<file>/<NNNpx>-<file> -> swap the size segment
    const parts = path.split('/')
    if (parts.length < 4) return url
    parts[3] = parts[3].replace(/^\d+px-/, `${px}px-`)
    return `https://upload.wikimedia.org/wikipedia/${parts.join('/')}${query}`
  }
  // <hash dirs>/<File.jpg> -> thumb/<hash dirs>/<File.jpg>/<px>-<File.jpg>
  const sep = path.lastIndexOf('/')
  const file = path.slice(sep + 1)
  if (!file) return url
  return `https://upload.wikimedia.org/wikipedia/commons/thumb/${path}/${px}px-${file}${query}`
}
