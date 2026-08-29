import type { Metadata } from 'next'
import AboutView from './AboutView'

export const metadata: Metadata = {
  title: 'About & Data Sources',
  description:
    'How the World Wildlife Atlas is built: IUCN conservation statuses, PBDB fossil occurrences, Wikipedia imagery, and the open sources behind every species profile.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return <AboutView />
}
