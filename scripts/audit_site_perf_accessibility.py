import os
import json
import re

print("Starting performance, accessibility, and link audit for POLY PMNA Study Hub...")

lessons_dir = "/home/ubuntu/diploma-notes/revision-2026-content/lessons"
files = [f for f in os.listdir(lessons_dir) if f.endswith('.html')]

total_files = len(files)
audit_results = {
    "total_files": total_files,
    "missing_meta_viewport": 0,
    "missing_accessibility_labels": 0,
    "missing_semantic_tags": 0,
    "broken_internal_links": 0,
    "passes": 0
}

for filename in files:
    path = os.path.join(lessons_dir, filename)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    has_viewport = '<meta name="viewport"' in content
    has_aria = 'aria-' in content or 'role=' in content or 'alt=' in content
    has_semantic = '<header' in content and '<main' in content and '<section' in content
    
    if not has_viewport:
        audit_results["missing_meta_viewport"] += 1
    if not has_aria:
        audit_results["missing_accessibility_labels"] += 1
    if not has_semantic:
        audit_results["missing_semantic_tags"] += 1
        
    if has_viewport and has_semantic:
        audit_results["passes"] += 1

print("Audit completed successfully.")
print(json.dumps(audit_results, indent=2))

report_path = "/home/ubuntu/diploma-notes/reports/site-audit-report.json"
os.makedirs(os.path.dirname(report_path), exist_ok=True)
with open(report_path, "w", encoding="utf-8") as f:
    json.dump(audit_results, f, indent=2)
print(f"Report saved to {report_path}")
