/** Derives a sized Wikimedia thumbnail URL from an original-file URL. */
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
