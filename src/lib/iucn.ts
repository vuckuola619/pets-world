/** IUCN conservation status color configuration */
/** `bg` fills are rendered behind white bold labels across the app, so every
 *  value must keep a WCAG AA ratio >= 4.5:1 against pure white. */
export const IUCN_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  EX: { label: 'Extinct', color: '#1a1a1a', bg: '#000000' },
  EW: { label: 'Extinct in Wild', color: '#4a1919', bg: '#7B2020' },
  CR: { label: 'Critically Endangered', color: '#7B1818', bg: '#CC2B2B' },
  EN: { label: 'Endangered', color: '#7B4A00', bg: '#AF6000' },
  VU: { label: 'Vulnerable', color: '#7B6B00', bg: '#897400' },
  NT: { label: 'Near Threatened', color: '#3A6600', bg: '#4C8200' },
  LC: { label: 'Least Concern', color: '#1A5200', bg: '#2C8600' },
  DD: { label: 'Data Deficient', color: '#444', bg: '#5F5F5F' },
  NE: { label: 'Not Evaluated', color: '#444', bg: '#737373' },
}

/** Maps full conservation status name to IUCN abbreviation code */
export const STATUS_CODE: Record<string, string> = {
  'Critically Endangered': 'CR',
  'Endangered': 'EN',
  'Vulnerable': 'VU',
  'Near Threatened': 'NT',
  'Least Concern': 'LC',
  'Data Deficient': 'DD',
  'Extinct': 'EX',
} as const;

/** Gray used when a status code has no entry in IUCN_CONFIG (canvas paint
 *  properties and inline styles can't read CSS vars). Central so every
 *  surface degrades identically. */
export const IUCN_FALLBACK = '#888';

/** Single source of truth for status name → code, including the fallback.
 *  Unmapped statuses become DD (Data Deficient) — an honest "we don't know"
 *  instead of silently claiming Least Concern. */
export function statusCodeFor(status: string): string {
  return STATUS_CODE[status] ?? 'DD'
}
