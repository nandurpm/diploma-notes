"""Extract the Ask POLY code highlight functions from ask-poly-v2.js and render sample fences."""
from pathlib import Path
import subprocess
import sys

REPO_ROOT = Path(__file__).resolve().parent.parent


def main():
    target_file = REPO_ROOT / "assets" / "js" / "ask-poly-v2.js"
    src = target_file.read_text(encoding="utf-8")
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
    tmp_file = Path("/tmp/test_highlight.mjs")
    tmp_file.write_text(script, encoding="utf-8")
    result = subprocess.run(["node", str(tmp_file)], capture_output=True, text=True)
    print(result.stdout)
    if result.returncode != 0:
        print(result.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
