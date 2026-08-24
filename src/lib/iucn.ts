/** IUCN conservation status color configuration */
export const IUCN_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  EX: { label: 'Extinct', color: '#1a1a1a', bg: '#000000' },
  EW: { label: 'Extinct in Wild', color: '#4a1919', bg: '#7B2020' },
  CR: { label: 'Critically Endangered', color: '#7B1818', bg: '#CC2B2B' },
  EN: { label: 'Endangered', color: '#7B4A00', bg: '#E07B00' },
  VU: { label: 'Vulnerable', color: '#7B6B00', bg: '#CCAD00' },
  NT: { label: 'Near Threatened', color: '#3A6600', bg: '#5A9900' },
  LC: { label: 'Least Concern', color: '#1A5200', bg: '#2D8A00' },
  DD: { label: 'Data Deficient', color: '#444', bg: '#888888' },
  NE: { label: 'Not Evaluated', color: '#444', bg: '#AAAAAA' },
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
