import os
import re

def verify_links(directory):
    files = [f for f in os.listdir(directory) if f.endswith('.html')]
    total_broken = 0
    total_files = len(files)
    
    for filename in files:
        path = os.path.join(directory, filename)
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Find all internal anchors: href="#anchor"
        links = re.findall(r'href="#([^"]+)"', content)
        # Find all IDs: id="anchor"
        ids = set(re.findall(r'id="([^"]+)"', content))
        
        broken = [l for l in links if l not in ids]
        if broken:
            print(f"File: {filename} - Broken links: {broken}")
            total_broken += len(broken)
            
    print(f"\nVerification complete for {total_files} files.")
    print(f"Total broken internal links found: {total_broken}")

print("Verifying Revision 2026 lessons...")
verify_links("/home/ubuntu/diploma-notes/revision-2026-content/lessons")

print("\nVerifying Revision 2021 lessons...")
verify_links("/home/ubuntu/diploma-notes/lessons")
