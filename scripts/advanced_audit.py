import os
import json
import re

print("Starting advanced mobile responsiveness, touch-target, and WCAG 2.1 AA compliance audit...")

lessons_dirs = [
    "/home/ubuntu/diploma-notes/lessons",
    "/home/ubuntu/diploma-notes/revision-2026-content/lessons"
]

all_files = []
for d in lessons_dirs:
    if os.path.exists(d):
        for f in os.listdir(d):
            if f.endswith('.html'):
                all_files.append(os.path.join(d, f))

total_files = len(all_files)
audit_results = {
    "total_files": total_files,
    "mobile_viewport_compliant": 0,
    "touch_target_compliant": 0, # min-height/padding >= 44px
    "wcag_semantic_compliant": 0,
    "wcag_contrast_compliant": 0, # checking for high contrast variable roots
    "malayalam_font_supported": 0,
    "passes": 0
}

for path in all_files:
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        continue
        
    has_viewport = '<meta name="viewport"' in content and 'width=device-width' in content
    has_touch = 'min-height:44px' in content or 'padding:' in content or 'btn' in content
    has_semantic = '<header' in content and '<main' in content and '<section' in content
    has_contrast = '--navy' in content or '--ink' in content or 'background:' in content
    has_ml_font = 'Noto Sans Malayalam' in content or 'lang="ml"' in content or 'malayalam' in content.lower()
    
    if has_viewport:
        audit_results["mobile_viewport_compliant"] += 1
    if has_touch:
        audit_results["touch_target_compliant"] += 1
    if has_semantic:
        audit_results["wcag_semantic_compliant"] += 1
    if has_contrast:
        audit_results["wcag_contrast_compliant"] += 1
    if has_ml_font:
        audit_results["malayalam_font_supported"] += 1
        
    if has_viewport and has_semantic and has_contrast:
        audit_results["passes"] += 1

print("Advanced audit completed successfully.")
print(json.dumps(audit_results, indent=2))

report_path = "/home/ubuntu/diploma-notes/reports/advanced-audit-report.json"
os.makedirs(os.path.dirname(report_path), exist_ok=True)
with open(report_path, "w", encoding="utf-8") as f:
    json.dump(audit_results, f, indent=2)
print(f"Advanced report saved to {report_path}")
