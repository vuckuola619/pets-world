import json
import re

print("Starting validation...")

# 1. Validate animals.json
with open('src/data/animals.json', 'r', encoding='utf-8') as f:
    animals = json.load(f)

errors = 0
for a in animals:
    if not isinstance(a.get('lat'), (int, float)) or not isinstance(a.get('lng'), (int, float)):
        print(f"Error: Invalid coordinates for {a.get('animal')}")
        errors += 1
    if not a.get('description_id'):
        print(f"Error: Missing ID description for {a.get('animal')}")
        errors += 1
    if not a.get('imageUrl') or not a['imageUrl'].startswith('http'):
        print(f"Error: Invalid or missing imageUrl for {a.get('animal')}")
        errors += 1

# 2. Validate dinosaurs.ts
with open('src/data/dinosaurs.ts', 'r', encoding='utf-8') as f:
    dino_code = f.read()

# Just extract elements with regex
names = re.findall(r"commonName:\s*'([^']+)'", dino_code)
image_urls = re.findall(r"imageUrl:\s*'([^']+)'", dino_code)

if len(names) != len(image_urls):
    print(f"Error: Mismatch in dinosaur records. Found {len(names)} names and {len(image_urls)} image URLs.")
    errors += 1

print(f"Validation complete. Found {errors} errors.")
