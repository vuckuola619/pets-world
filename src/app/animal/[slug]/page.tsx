import React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { IUCN_CONFIG, STATUS_CODE } from '@/lib/iucn'
import AnimalDetailsClient from './AnimalDetailsClient'
import PopulationChart from '@/components/PopulationChart'
import AnimalProfileView from './AnimalProfileView'
import { getAtlasProfileBySlug, getAtlasProfileStaticParams } from '@/data/atlasProfiles'

interface Props {
  params: Promise<{ slug: string }>
}

/** Generates static params for all animal pages */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return getAtlasProfileStaticParams()
}

/** Generates metadata for SEO */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const animal = getAtlasProfileBySlug(slug)
  if (!animal) return { title: 'Animal Not Found' }
  const desc = animal.description?.slice(0, 160) || `Learn about the ${animal.commonName} (${animal.scientificName})`
  return {
    title: `${animal.commonName} — World Wildlife Atlas`,
    description: desc,
    openGraph: {
      title: `${animal.commonName} — World Wildlife Atlas`,
      description: desc,
      type: 'article',
    },
  }
}

/** Server-rendered animal detail page with premium Natura design */
export default async function AnimalDetailPage({ params }: Props): Promise<React.JSX.Element> {
  const { slug } = await params
  const animal = getAtlasProfileBySlug(slug)
  if (!animal) return <div>Not found</div>;
  return <AnimalProfileView animal={animal} />;
}
