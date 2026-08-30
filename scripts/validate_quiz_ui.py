from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
checks = []

def require(path, pattern, label):
    text = (ROOT / path).read_text(encoding="utf-8")
    ok = re.search(pattern, text, re.S) is not None
    checks.append((ok, label))

require("ask-poly.html", r'id="stopBtn"[^>]*hidden[^>]*>Stop generating', "Ask POLY stop control has an explicit accessible label")
require("ask-poly.html", r'id="queueBtn"[^>]*aria-label=', "Ask POLY queue control has an accessible label")
require("ask-poly.html", r'id="chatInput"[^>]*aria-describedby="chatStatus"', "Ask POLY input describes its live status")
require("assets/js/ask-poly-v2.js", r'stopRequested\s*=\s*true', "Ask POLY records an intentional stop separately from a timeout")
require("assets/js/ask-poly-v2.js", r'await sendMessage\(nextText, true\)', "Ask POLY drains queued messages serially")
require("assets/js/ask-poly-v2.js", r'MAX_QUEUE\s*=\s*8', "Ask POLY limits pending queue growth")
require("assets/js/ask-poly-v2.js", r'event\.key === "Enter" && !event\.shiftKey && !event\.isComposing', "Ask POLY sends with Enter while preserving Shift+Enter and IME composition")
require("assets/js/ask-poly-diagrams.js", r'return null;\s*}\s*if \(/communication system', "Ask POLY rejects ambiguous flowcharts instead of rendering a generic example")
require("assets/js/ask-poly-diagrams.js", r'diode_operation.*Diode operating-state flowchart', "Ask POLY selects a diode-specific flowchart")
require("assets/js/ask-poly-layout.js", r'document\.addEventListener\("click"', "Ask POLY sidebar closes on outside taps")
require("daily-quiz.html", r'id="quizProgressWrap"[^>]*role="progressbar"[^>]*aria-valuenow="0"', "Daily Quiz progress bar has ARIA semantics")
require("assets/js/quiz-engine.js", r'<fieldset class="options" aria-labelledby=', "Daily Quiz radio options are grouped with question context")
require("assets/js/quiz-engine.js", r'aria-valuetext.*questions answered', "Daily Quiz progress exposes an answer-count announcement")
require("daily-quiz.html", r'id="dailySubjectCards"[^>]*aria-live="polite"', "Daily Quiz subject filtering is announced")
require("assets/js/quiz-engine.js", r'authChoiceLocked\s*=\s*true', "Daily Quiz explicit Guest/Login choice wins over late restore")
require("assets/js/quiz-engine.js", r'if \(requestVersion !== quizRequestVersion \|\| subject !== code\) return', "Daily Quiz ignores stale subject loads")
require("assets/js/quiz-engine.js", r'submissionInFlight', "Daily Quiz prevents duplicate submissions")
require("assets/js/quiz-engine.js", r'Questions for this subject are being prepared', "Daily Quiz exposes a descriptive under-development state")
require("assets/js/quiz-engine.js", r'function scoreFeedback\(score\)', "Daily Quiz provides score-range feedback")
require("workers/ask-poly-ai/src/ask-handler.js", r'OPENROUTER_FALLBACK_MODELS', "OpenRouter has internal fallback models defined")
require("workers/ask-poly-ai/wrangler.toml", r'AI_PROVIDER_ORDER = "nvidia,openrouter"', "Provider order is NVIDIA then OpenRouter")
require("workers/ask-poly-ai/src/index.js", r'The AI assistant is temporarily unavailable', "User-friendly unavailable message is defined")

failed = [label for ok, label in checks if not ok]
for ok, label in checks:
    print(f"{'PASS' if ok else 'FAIL'}: {label}")
if failed:
    raise SystemExit(f"{len(failed)} validation checks failed")
print(f"All {len(checks)} static UI checks passed.")
