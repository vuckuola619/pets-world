import re
import os

with open('src/data/dinosaurs.ts', 'r', encoding='utf-8') as f:
    code = f.read()

# Fix last element closing brace
code = code.replace("imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Antarctopelta_recovered_remains.jpg/330px-Antarctopelta_recovered_remains.jpg'\n] satisfies", "imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Antarctopelta_recovered_remains.jpg/330px-Antarctopelta_recovered_remains.jpg'\n  }\n] satisfies")

with open('src/data/dinosaurs.ts', 'w', encoding='utf-8') as f:
    f.write(code)

with open('src/components/MapView.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# We need to fix the MapView.tsx corruption from replace_file_content
# It seems lines 317-320 were replaced with a massive block
# Wait, let's just use git checkout src/components/MapView.tsx since it failed earlier because it wasn't tracked? 
# The repo IS tracked. Maybe `git checkout -- src/components/MapView.tsx` works.
os.system("git checkout -- src/components/MapView.tsx")

with open('src/components/MapView.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

if "import DinoMarker" not in code:
    code = code.replace('import Link from "next/link";\nimport { CONTINENT_COLORS } from "../lib/regions";', 'import Link from "next/link";\nimport { CONTINENT_COLORS } from "../lib/regions";\nimport DinoMarker from "./DinoMarker";')

code = code.replace("{c.emoji}", "{isPrehistoric ? <DinoMarker isHovered={sidebarHoveredId === c.id} /> : c.emoji}")

with open('src/components/MapView.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done")
