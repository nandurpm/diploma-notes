#!/usr/bin/env python3
"""Run the failing sub-assertions one by one to find which returns null."""
import subprocess

cases = [
    ("is 12 * 8 = 96 correct", r"/is correct/"),
    ("50% of 80 = 40", r"/is correct/"),
    ("the correct answer is: 2 + 78 = 80", r"/is correct/"),
]
for text, rx in cases:
    src = f"""
import {{ __testables as T }} from "/home/ubuntu/diploma-notes/workers/ask-poly-ai/src/ask-handler.js";
const r = T.tryArithmeticEquality({json.dumps(text)});
console.log(r ? r : "NULL");
"""
    with open("/tmp/one.mjs", "w") as f:
        f.write(src)
    out = subprocess.run(["node", "/tmp/one.mjs"], capture_output=True, text=True)
    print(repr(text), "->", out.stdout.strip())
