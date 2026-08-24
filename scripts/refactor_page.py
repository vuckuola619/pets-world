import os

os.makedirs('src/app/animal/[slug]', exist_ok=True)
with open('src/app/animal/[slug]/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Make the client view
view_code = "'use client';\n" + code
view_code = view_code.replace('export default async function AnimalDetailPage({ params }: Props): Promise<React.JSX.Element> {', 'import { useMapStore } from \"@/store/useMapStore\";\nexport default function AnimalProfileView({ animal }: { animal: any }): React.JSX.Element {')
view_code = view_code.replace('const { slug } = await params\n  const animal = getAtlasProfileBySlug(slug) as AnimalData | undefined\n', '')
view_code = view_code.replace('export async function generateStaticParams', '// ')
view_code = view_code.replace('export async function generateMetadata', '// ')
view_code = view_code.replace('if (!imageUrl && !isPrehistoric)', 'if (!imageUrl)') # Let dinosaurs fetch their images!
view_code = view_code.replace('animal.description', '(useMapStore().locale === \"id\" ? animal.description_id : animal.description)')
view_code = view_code.replace('animal.diet', '(useMapStore().locale === \"id\" ? animal.diet_id : animal.diet) || animal.diet')
view_code = view_code.replace('fact', '(useMapStore().locale === \"id\" ? animal.funFacts_id?.[i] : fact) || fact')

with open('src/app/animal/[slug]/AnimalProfileView.tsx', 'w', encoding='utf-8') as f:
    f.write(view_code)

# Make the page wrapper
page_code = code[:code.find('export default async function AnimalDetailPage')]
page_code += '''import AnimalProfileView from './AnimalProfileView';

export default async function AnimalDetailPage({ params }: Props): Promise<React.JSX.Element> {
  const { slug } = await params
  const animal = getAtlasProfileBySlug(slug) as AnimalData | undefined
  if (!animal) return <div>Not found</div>;
  return <AnimalProfileView animal={animal} />;
}
'''
with open('src/app/animal/[slug]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(page_code)
