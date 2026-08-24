import json
import re
import os
from deep_translator import GoogleTranslator
from concurrent.futures import ThreadPoolExecutor

translator = GoogleTranslator(source='en', target='id')

def t(text):
    if not text:
        return text
    try:
        return translator.translate(text)
    except Exception as e:
        print(f"Error translating: {text[:20]}... {e}")
        return text

def translate_animals():
    print("Translating animals.json...")
    path = "src/data/animals.json"
    with open(path, "r", encoding="utf-8") as f:
        animals = json.load(f)

    def process_animal(animal):
        if "description" in animal and "description_id" not in animal:
            animal["description_id"] = t(animal["description"])
        if "funFacts" in animal and "funFacts_id" not in animal:
            animal["funFacts_id"] = [t(f) for f in animal["funFacts"]]
        if "habitat" in animal and "habitat_id" not in animal:
            animal["habitat_id"] = [t(h) for h in animal["habitat"]]
        return animal

    with ThreadPoolExecutor(max_workers=10) as executor:
        animals = list(executor.map(process_animal, animals))

    with open(path, "w", encoding="utf-8") as f:
        json.dump(animals, f, indent=2, ensure_ascii=False)
    print("Done translating animals.")

def translate_dinosaurs():
    print("Translating dinosaurs.ts...")
    path = "src/data/dinosaurs.ts"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Extract rawDinosaurs array using regex (it's between 'const rawDinosaurs = [' and ']\n')
    match = re.search(r'const rawDinosaurs = (\[.*?\]);', content, re.DOTALL)
    if not match:
        print("Could not find rawDinosaurs array")
        return
    
    # It's a JS object array, not strictly JSON (keys lack quotes). We can parse it by making it JSON-like or just use regex on the text.
    # Since there are only 15 dinosaurs, let's just use regex to insert the _id fields after the English fields.
    
    def replacer(m):
        block = m.group(0)
        
        # Translate evidenceNote
        ev_match = re.search(r"evidenceNote:\n?\s*['\"](.*?)['\"],", block, re.DOTALL)
        if ev_match and "evidenceNote_id:" not in block:
            val = ev_match.group(1).replace("\\'", "'")
            val_id = t(val).replace("'", "\\'")
            block = block.replace(ev_match.group(0), f"{ev_match.group(0)}\n    evidenceNote_id: '{val_id}',")
            
        # Translate diet
        diet_match = re.search(r"diet:\s*['\"](.*?)['\"],", block)
        if diet_match and "diet_id:" not in block:
            val_id = t(diet_match.group(1)).replace("'", "\\'")
            block = block.replace(diet_match.group(0), f"{diet_match.group(0)}\n    diet_id: '{val_id}',")
            
        # Translate lifeHabit
        life_match = re.search(r"lifeHabit:\s*['\"](.*?)['\"],", block)
        if life_match and "lifeHabit_id:" not in block:
            val_id = t(life_match.group(1)).replace("'", "\\'")
            block = block.replace(life_match.group(0), f"{life_match.group(0)}\n    lifeHabit_id: '{val_id}',")
            
        return block

    new_content = re.sub(r'\{[^{}]*evidenceNote:.*?\}', replacer, content, flags=re.DOTALL)
    
    # Also update the DinosaurRecord schema to include these optional fields
    if "evidenceNote_id: z.string().optional()" not in new_content:
        new_content = new_content.replace(
            "evidenceNote: z.string().min(1),",
            "evidenceNote: z.string().min(1),\n  evidenceNote_id: z.string().optional(),\n  diet_id: z.string().optional(),\n  lifeHabit_id: z.string().optional(),"
        )

    with open(path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Done translating dinosaurs.")

if __name__ == "__main__":
    translate_dinosaurs()
    translate_animals()
