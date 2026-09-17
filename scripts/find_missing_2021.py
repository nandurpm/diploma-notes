import os
import re

with open('/home/ubuntu/diploma-notes/assets/js/subject-browser.js', 'r') as f:
    content = f.read()

# Extract LESSON_CODES set
match = re.search(r'const LESSON_CODES = new Set\(\[(.*?)\]\);', content)
if match:
    codes = [c.strip('"') for c in match.group(1).split(',')]
    print(f"Total Revision 2021 codes in registry: {len(codes)}")
    
    existing = os.listdir('/home/ubuntu/diploma-notes/lessons')
    missing = []
    for code in codes:
        filename = f"lessons-{code}.html"
        if filename not in existing:
            missing.append(code)
    
    print(f"Missing Revision 2021 lessons: {len(missing)}")
    print(f"First 10 missing: {missing[:10]}")
else:
    print("Could not find LESSON_CODES in subject-browser.js")
