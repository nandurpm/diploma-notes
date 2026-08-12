"""Extract the Ask POLY code highlight functions from ask-poly-v2.js and render sample fences."""
import subprocess
import sys

src = open("/home/ubuntu/diploma-notes/assets/js/ask-poly-v2.js", encoding="utf-8").read()
start_kw = src.find("const LANGUAGE_KEYWORDS = {")
end_kw = src.find("function highlightCode(")
start = src.find("function highlightCode(")
end = src.find("function renderInlineMarkdown(")
if start == -1 or start_kw == -1 or end == -1:
    sys.exit("highlight functions not found in ask-poly-v2.js")
block = (src[start_kw:end_kw] + src[start:end]).replace("escapeHtml", "String")

script = (
    'function escapeHtml(v){return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;");}\n'
    + block
    + "\n"
    + 'console.log(renderCodeBlock(["python","import math","def calc(x):","    return x * 2 # double","if calc(5) == 10:","    print(\u2018ok\u2019, 42)"]));\n'
    + 'console.log(renderCodeBlock(["javascript","const n = 7; // seven","if (n === 7) {","  console.log(\u201chello\u201d);","}"]));\n'
    + 'console.log(renderCodeBlock(["import math","x = 5 * 3"]));\n'
    + 'console.log(renderCodeBlock(["",""]));\n'
)
open("/tmp/test_highlight.mjs", "w", encoding="utf-8").write(script)
result = subprocess.run(["node", "/tmp/test_highlight.mjs"], capture_output=True, text=True)
print(result.stdout)
if result.returncode != 0:
    print(result.stderr)
    sys.exit(1)
