import os
import json
import re

# Read subjects-data.js
with open('/home/ubuntu/diploma-notes/assets/js/subjects-data.js', 'r') as f:
    content = f.read()

# Extract the SUBJECTS object
# It's a JS object, but we can try to parse it as JSON if we clean it up
# or use regex to find all codes and names
subjects = []
# Match {code:"...",name:"..."}
matches = re.finditer(r'\{code:"(?P<code>[^"]+)",name:"(?P<name>[^"]+)"', content)
for m in matches:
    subjects.append(m.groupdict())

print(f"Total subjects found in subjects-data.js: {len(subjects)}")

existing = os.listdir('/home/ubuntu/diploma-notes/lessons')
missing = []
seen_codes = set()
for s in subjects:
    code = s['code']
    if code in seen_codes:
        continue
    seen_codes.add(code)
    filename = f"lessons-{code}.html"
    if filename not in existing:
        missing.append(s)

print(f"Missing Revision 2021 lessons: {len(missing)}")
print(f"First 10 missing: {missing[:10]}")
