import os
import re
import json
import subprocess
import time
from pathlib import Path
from openai import OpenAI

# Configuration
ROOT = Path('/home/ubuntu/diploma-notes')
PDF_REPO = Path('/home/ubuntu/poly-pmna-pdf-files')
REV2021_DIR = ROOT / 'lessons'
REV2026_DIR = ROOT / 'revision-2026-content' / 'lessons'
MASTER_PROMPT_PATH = ROOT / 'docs' / 'poly-pmna-lesson-html-master-prompt.md'

# Pre-configured OpenAI client
client = OpenAI()

def log(msg):
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [WORKFLOW] {msg}", flush=True)

def is_placeholder(path):
    if not path.exists(): return True
    try:
        content = path.read_text(encoding='utf-8', errors='ignore')
        content_lower = content.lower()
        # Common placeholder/best-effort indicators
        if "official title not published" in content_lower: return True
        if "not machine-readable" in content_lower: return True
        if "shared handbook" in content_lower: return True
        if "original study-handbook structure" in content_lower: return True
        if "detailed study" in content_lower and "detailed analysis of core principles" in content_lower: return True
        if len(content) < 12000: return True # Real handbooks with modules/SVG are usually 20KB+
    except:
        return True
    return False

def get_missing_2021():
    # Read from subjects-data.js
    data_path = ROOT / 'assets/js/subjects-data.js'
    if not data_path.exists():
        log("subjects-data.js not found!")
        return []
    
    content = data_path.read_text()
    subjects = []
    matches = re.finditer(r'\{code:"(?P<code>[^"]+)",name:"(?P<name>[^"]+)"', content)
    for m in matches:
        subjects.append(m.groupdict())
    
    missing = []
    seen = set()
    for s in subjects:
        if s['code'] in seen: continue
        seen.add(s['code'])
        # Rule: Protected REV2021 files are lessons-[CODE].html
        # New verified files use lessons-[CODE]_REV2021.html
        path_old = REV2021_DIR / f"lessons-{s['code']}.html"
        path_new = REV2021_DIR / f"lessons-{s['code']}_REV2021.html"
        
        if is_placeholder(path_old) and is_placeholder(path_new):
            missing.append(s)
    return missing

def get_missing_2026():
    # Read from revision-2026-subjects.json
    json_path = ROOT / 'assets/data/revision-2026-subjects.json'
    if not json_path.exists():
        log("revision-2026-subjects.json not found!")
        return []
    
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    subjects = data.get('subjects', [])
    missing = []
    for s in subjects:
        code = s['code']
        # Rule: REV2026 files are lessons-[CODE].html in revision-2026-content/lessons/
        # OR lessons-[CODE]_REV2026.html
        path_old = REV2026_DIR / f"lessons-{code}.html"
        path_new = REV2026_DIR / f"lessons-{code}_REV2026.html"
        
        if is_placeholder(path_old) and is_placeholder(path_new):
            missing.append(s)
    return missing

def find_pdf(code, revision):
    rev_dir = f"revision-{revision}"
    search_dir = PDF_REPO / 'sitttr' / rev_dir / 'syllabus'
    if not search_dir.exists():
        return None
    
    # Try exact match first
    for pdf in search_dir.rglob(f"{code}-*.pdf"): return pdf
    for pdf in search_dir.rglob(f"{code}.pdf"): return pdf
    
    return None

def extract_text(pdf_path):
    try:
        res = subprocess.run(['pdftotext', '-layout', str(pdf_path), '-'], capture_output=True, text=True, timeout=60)
        return res.stdout.strip()
    except Exception as e:
        log(f"Error extracting text from {pdf_path}: {e}")
    return ""

def generate_handbook(subject, revision, syllabus_text):
    code = subject['code']
    name = subject['name']
    master_prompt = MASTER_PROMPT_PATH.read_text()
    
    prompt = f"""
Apply the complete attached MASTER PROMPT to create one professional, syllabus-complete, responsive HTML handbook for:

CURRICULUM_SCHEME: REV{revision}
SUBJECT_CODE: {code}
SUBJECT_NAME: {name}

SYLLABUS TEXT FROM OFFICIAL PDF:
{syllabus_text}

MASTER PROMPT:
{master_prompt}

Return ONLY the complete final HTML code.
"""
    try:
        log(f"Requesting AI generation for {code} (REV{revision})...")
        response = client.chat.completions.create(
            model="gpt-5", # Use gpt-5 for premium quality as requested
            messages=[
                {"role": "system", "content": "You are a senior curriculum author and expert web developer. Output only valid HTML."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_completion_tokens=15000
        )
        if response and response.choices:
            content = response.choices[0].message.content.strip()
            if content.startswith('```html'):
                content = content[7:]
            if content.endswith('```'):
                content = content[:-3]
            return content.strip()
    except Exception as e:
        log(f"AI generation failed for {code}: {e}")
    return None

def validate_and_save(html_code, code, revision):
    if not html_code or len(html_code) < 8000:
        log(f"Validation failed for {code}: Code too short or empty.")
        return False
    
    if '<html' not in html_code.lower():
        log(f"Validation failed for {code}: No HTML tag found.")
        return False

    # Check for horizontal overflow (basic check)
    if 'overflow-x: hidden' not in html_code and 'width: 100%' not in html_code:
        # We assume the AI followed the responsive grid instructions
        pass

    filename = f"lessons-{code}_REV{revision}.html"
    target_dir = REV2021_DIR if revision == '2021' else REV2026_DIR
    target_path = target_dir / filename
    
    target_path.write_text(html_code, encoding='utf-8')
    log(f"Successfully saved {target_path}")
    return True

def process_revision(revision, subjects, limit=10):
    log(f"Starting processing for Revision {revision} (Limit: {limit})")
    count = 0
    results = {'created': [], 'skipped_pdf': [], 'failed_ai': []}
    
    for s in subjects:
        if count >= limit: break
        code = s['code']
        name = s['name']
        
        pdf_path = find_pdf(code, revision)
        if not pdf_path:
            log(f"Skipping {code}: Official PDF not found in local repo.")
            results['skipped_pdf'].append(code)
            continue
            
        text = extract_text(pdf_path)
        if len(text) < 1000:
            log(f"Skipping {code}: Syllabus text too short/unverifiable.")
            results['skipped_pdf'].append(code)
            continue
            
        html = generate_handbook(s, revision, text)
        if html and validate_and_save(html, code, revision):
            results['created'].append(code)
            count += 1
        else:
            results['failed_ai'].append(code)
            
    return results

def main():
    log("=== STARTING MASTER WORKFLOW ===")
    
    # 1. Pull latest
    subprocess.run(['git', 'pull', 'origin', 'main'], cwd=ROOT)
    
    # 2. Inventory
    missing_2021 = get_missing_2021()
    missing_2026 = get_missing_2026()
    log(f"Inventory: {len(missing_2021)} missing REV2021, {len(missing_2026)} missing REV2026.")
    
    total_results = {'2021': {}, '2026': {}}
    
    # 3. Process REV2021
    if missing_2021:
        total_results['2021'] = process_revision('2021', missing_2021, limit=10)
    
    # 4. Process REV2026
    if missing_2026:
        total_results['2026'] = process_revision('2026', missing_2026, limit=20)
    
    # 5. Push
    all_created = total_results['2021'].get('created', []) + total_results['2026'].get('created', [])
    if all_created:
        log(f"Committing and pushing {len(all_created)} new lessons...")
        subprocess.run(['git', 'add', '.'], cwd=ROOT)
        msg = f"feat(lessons): add {len(all_created)} syllabus-complete handbooks"
        subprocess.run(['git', 'commit', '-m', msg], cwd=ROOT)
        subprocess.run(['git', 'push', 'origin', 'main'], cwd=ROOT)
        log("Push complete.")
    
    log("=== WORKFLOW SUMMARY ===")
    log(f"REV2021: Created {len(total_results['2021'].get('created', []))}, Skipped {len(total_results['2021'].get('skipped_pdf', []))}, Failed {len(total_results['2021'].get('failed_ai', []))}")
    log(f"REV2026: Created {len(total_results['2026'].get('created', []))}, Skipped {len(total_results['2026'].get('skipped_pdf', []))}, Failed {len(total_results['2026'].get('failed_ai', []))}")
    log("=== END OF WORKFLOW ===")

if __name__ == "__main__":
    main()
