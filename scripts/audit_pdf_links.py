import urllib.request
import json

print("Auditing raw GitHub PDF links for 404 errors...")

test_urls = [
    "https://raw.githubusercontent.com/nandurpm/poly-pmna-pdf-files/main/sitttr/revision-2021/model-question-papers/architecture/semester-unspecified/1001-communication-skills-in-english.pdf",
    "https://raw.githubusercontent.com/nandurpm/poly-pmna-pdf-files/main/sitttr/revision-2021/model-question-papers/civil-engineering/semester-unspecified/2021-engineering-mechanics.pdf",
    "https://raw.githubusercontent.com/nandurpm/poly-pmna-pdf-files/main/sitttr/revision-2021/model-question-papers/mechanical-engineering/semester-unspecified/3024-thermal-engineering.pdf",
    "https://raw.githubusercontent.com/nandurpm/poly-pmna-pdf-files/main/sitttr/revision-2026/model-question-papers/architecture/semester-unspecified/2005-environmental-sustainability-and-ethics.pdf"
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
print("Link audit completed.")
