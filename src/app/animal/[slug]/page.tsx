import React from 'react'
import { Metadata } from 'next'
import AnimalProfileView from './AnimalProfileView'
import { getAtlasProfileBySlug, getAtlasProfileStaticParams } from '@/data/atlasProfiles'

interface Props {
  params: Promise<{ slug: string }>
}

const BASE_URL = 'https://pets-world.pages.dev'

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
  const ogImage = animal.images[0]?.url
  return {
    title: `${animal.commonName}`,
    description: desc,
    alternates: {
      canonical: `/animal/${animal.slug}`,
    },
    openGraph: {
      title: `${animal.commonName} — World Wildlife Atlas`,
      description: desc,
      type: 'article',
      ...(ogImage ? { images: [{ url: ogImage, alt: animal.images[0]?.alt ?? animal.commonName }] } : {}),
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: animal.commonName,
      description: desc,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  }
}

/** Schema.org structured data so search engines can surface species facts */
function SpeciesJsonLd({ animal }: { animal: NonNullable<ReturnType<typeof getAtlasProfileBySlug>> }): React.JSX.Element {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${animal.commonName} (${animal.scientificName})`,
    description: animal.description,
    about: {
      '@type': 'Thing',
      name: animal.commonName,
      alternateName: animal.scientificName,
    },
    ...(animal.images[0] ? { image: [animal.images[0].url] } : {}),
    dateModified: animal.updatedAt,
    isPartOf: { '@type': 'WebSite', name: 'World Wildlife Atlas', url: BASE_URL },
    mainEntityOfPage: `${BASE_URL}/animal/${animal.slug}`,
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}

/** Server-rendered animal detail page with premium Natura design */
export default async function AnimalDetailPage({ params }: Props): Promise<React.JSX.Element> {
  const { slug } = await params
  const animal = getAtlasProfileBySlug(slug)
  if (!animal) return <div>Not found</div>;
  return (
    <>
      <SpeciesJsonLd animal={animal} />
      <AnimalProfileView animal={animal} />
    </>
  )
}
