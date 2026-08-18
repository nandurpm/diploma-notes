import os
import urllib.request
import json

print("Running weekly GitHub PDF link & file integrity check...")

# Check a sample of raw GitHub PDF links used by the site
test_urls = [
    "https://raw.githubusercontent.com/nandurpm/poly-pmna-pdf-files/main/sitttr/revision-2021/model-question-papers/architecture/semester-unspecified/1001-communication-skills-in-english.pdf",
    "https://raw.githubusercontent.com/nandurpm/poly-pmna-pdf-files/main/sitttr/revision-2021/model-question-papers/civil-engineering/semester-unspecified/1001-communication-skills-in-english.pdf"
]

results = []
for url in test_urls:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            status = response.status
            results.append({"url": url, "status": status, "ok": status == 200})
    except Exception as e:
        results.append({"url": url, "error": str(e), "ok": False})

print(json.dumps(results, indent=2))
print("Weekly link integrity check completed.")
