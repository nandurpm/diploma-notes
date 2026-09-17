import os
import re

print("Inventorying repository PDF coverage...")

subjects_js_path = "/home/ubuntu/diploma-notes/assets/js/subjects.js"
with open(subjects_js_path, "r", encoding="utf-8") as f:
    content = f.read()

# Extract code and department using regex
codes = re.findall(r'code:\s*"([^"]+)"', content)
print(f"Total subject codes found in subjects.js: {len(codes)}")

pdf_repo = "/home/ubuntu/poly-pmna-pdf-files/sitttr"
rev21_qp_dir = os.path.join(pdf_repo, "revision-2021", "model-question-papers")

found = 0
missing = 0

# Walk through all department folders in revision-2021 model question papers
existing_pdfs = set()
if os.path.exists(rev21_qp_dir):
    for root, dirs, files in os.walk(rev21_qp_dir):
        for file in files:
            if file.endswith('.pdf'):
                code_match = file.split('-')[0]
                existing_pdfs.add(code_match)

print(f"Total unique PDF course codes present in poly-pmna-pdf-files REV2021 QPs: {len(existing_pdfs)}")
print("Inventory check completed successfully.")
