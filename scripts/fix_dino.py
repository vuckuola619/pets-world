import re

with open('src/data/dinosaurs.ts', 'r', encoding='utf-8') as f:
    code = f.read()

# Fix the escaped quotes
code = code.replace("\\'https:", "'https:")
code = code.replace(".jpg\\'", ".jpg'")
code = code.replace(".png\\'", ".png'")

# Fix missing closing braces
code = re.sub(r"',\n\s*\{", "',\n  },\n  {", code)

with open('src/data/dinosaurs.ts', 'w', encoding='utf-8') as f:
    f.write(code)
