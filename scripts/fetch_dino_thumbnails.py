import json
import re
import urllib.request
import time

def fetch_wiki_thumbnail(title):
    url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{title.replace(' ', '_')}"
    req = urllib.request.Request(url, headers={'User-Agent': 'WorldWildlifeAtlas/1.1'})
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            if 'thumbnail' in data and 'source' in data['thumbnail']:
                return data['thumbnail']['source']
    except Exception as e:
        print(f"Failed to fetch {title}: {e}")
    return None

def update_dinosaurs():
    path = "src/data/dinosaurs.ts"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Find all common names
    dinosaurs = re.findall(r"commonName:\s*['\"](.*?)['\"]", content)
    
    # Generate replacements
    for dino in dinosaurs:
        if "imageUrl: " in content and dino in content:
            # We don't have a structured JSON, we need to inject imageUrl into the object
            pass
        
        print(f"Fetching image for {dino}...")
        img_url = fetch_wiki_thumbnail(dino)
        if not img_url:
            # Try scientific name if different
            sci_name_match = re.search(r"commonName:\s*['\"]" + re.escape(dino) + r"['\"].*?scientificName:\s*['\"](.*?)['\"]", content, re.DOTALL)
            if sci_name_match:
                img_url = fetch_wiki_thumbnail(sci_name_match.group(1))

        if img_url:
            print(f"Found image for {dino}: {img_url}")
            # Insert imageUrl into the object block of this dinosaur
            # Find the block for this dinosaur
            pattern = r"(commonName:\s*['\"]" + re.escape(dino) + r"['\"].*?)(?=},|\];)"
            
            def replacer(match):
                block = match.group(1)
                if "imageUrl:" not in block:
                    block = block + f",\n    imageUrl: '{img_url}'"
                else:
                    block = re.sub(r"imageUrl:\s*['\"].*?['\"]", f"imageUrl: '{img_url}'", block)
                return block
            
            content = re.sub(pattern, replacer, content, count=1, flags=re.DOTALL)
        
        time.sleep(0.5)

    # Update DinosaurRecord schema to include optional imageUrl
    if "imageUrl: z.string().url().optional()" not in content:
        content = content.replace("evidenceNote: z.string().min(1),", "evidenceNote: z.string().min(1),\n  imageUrl: z.string().url().optional(),")

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated dinosaurs.ts with image URLs")

if __name__ == "__main__":
    update_dinosaurs()
