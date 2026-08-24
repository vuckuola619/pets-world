import re

with open('src/app/animal/[slug]/AnimalProfileView.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Remove the broken generateMetadata block
code = re.sub(r'//\s+export async function generateMetadata[^}]*?}[^}]*?}[^}]*?}', '', code, flags=re.DOTALL)
code = re.sub(r'//\s+export async function generateStaticParams[^}]*?}', '', code, flags=re.DOTALL)

with open('src/app/animal/[slug]/AnimalProfileView.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
