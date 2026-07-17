#!/usr/bin/env python3
"""One-time repair for duplicate Course 1041 header inside the Android app."""
from pathlib import Path

PATH = Path("revision-2026-content/lessons/lessons-1041.html")
MARKER = "1041-native-app-header-fix-v1"

text = PATH.read_text(encoding="utf-8")

required = [
    '<meta name="revision" content="REV2026">',
    '<meta name="course-code" content="1041">',
    '<header class="lesson-header">',
    'id="menuButton"',
    'id="chapterNav"',
]
missing = [item for item in required if item not in text]
if missing:
    raise SystemExit(f"Course identity/structure guard failed: {missing}")

if MARKER in text:
    print("Course 1041 native-header repair is already installed.")
    raise SystemExit(0)

head_script = f'''\n<script id="{MARKER}">\n(() => {{\n  try {{\n    const ua = navigator.userAgent || "";\n    const appUa = /(?:PolytechnicStudyHubAndroid|PolyPmnaAndroid)\\/[0-9.]+/i.test(ua);\n    const androidWebView = /Android/i.test(ua) && (/\\bwv\\b/i.test(ua) || /Version\\/\\d+(?:\\.\\d+)?\\s+Chrome\\//i.test(ua));\n    const standaloneAndroid = /Android/i.test(ua) && window.matchMedia?.("(display-mode: standalone)")?.matches;\n    if (appUa || androidWebView || standaloneAndroid) document.documentElement.classList.add("polytechnic-native-app");\n  }} catch (_) {{}}\n}})();\n</script>'''
text = text.replace('</title>', '</title>' + head_script, 1)

native_css = '''\n/* Course 1041 Android-app integration: the APK already owns the main header. */\n.native-handbook-menu{display:none}\nhtml.polytechnic-native-app{--header-h:0px;scroll-padding-top:16px}\nhtml.polytechnic-native-app .lesson-header{display:none!important;visibility:hidden!important;height:0!important;min-height:0!important;max-height:0!important;padding:0!important;margin:0!important;border:0!important;overflow:hidden!important}\nhtml.polytechnic-native-app .lesson-shell{padding-top:14px!important}\nhtml.polytechnic-native-app .chapter-nav{top:12px;max-height:calc(100vh - 24px)}\nhtml.polytechnic-native-app .cover{min-height:auto}\nhtml.polytechnic-native-app .native-handbook-menu{position:fixed;z-index:875;left:14px;bottom:max(14px,env(safe-area-inset-bottom));display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:10px 15px;border:1px solid rgba(255,255,255,.4);border-radius:999px;background:linear-gradient(135deg,#07192e,#0b4e73);color:#fff;font-weight:900;box-shadow:0 14px 34px rgba(7,25,46,.32)}\nhtml.polytechnic-native-app .native-handbook-menu[aria-expanded="true"]{background:var(--cyan);color:#001421}\nhtml.polytechnic-native-app .nav-arrows{bottom:max(14px,env(safe-area-inset-bottom))}\n@media(max-width:840px){\n html.polytechnic-native-app .lesson-shell{padding:12px 10px 28px!important}\n html.polytechnic-native-app .chapter-nav{top:0;bottom:0;max-height:none;padding-bottom:90px}\n html.polytechnic-native-app .cover-inner{padding-top:30px}\n}\n@media print{.native-handbook-menu{display:none!important}}\n'''
anchor = '@media(prefers-reduced-motion:reduce)'
if anchor not in text:
    raise SystemExit("Responsive CSS anchor not found")
text = text.replace(anchor, native_css + anchor, 1)

button = '''\n<button class="native-handbook-menu no-print" id="nativeHandbookMenu" type="button" aria-label="Open handbook chapters" aria-controls="chapterNav" aria-expanded="false"><span aria-hidden="true">☰</span><span>Chapters</span></button>'''
text = text.replace('</header>', '</header>' + button, 1)

control_script = '''\n<script id="1041-native-handbook-controls">\n(() => {\n  const start = () => {\n    const floatingButton = document.getElementById("nativeHandbookMenu");\n    const originalButton = document.getElementById("menuButton");\n    const chapterNav = document.getElementById("chapterNav");\n    if (!floatingButton || !originalButton || !chapterNav) return;\n    const sync = () => floatingButton.setAttribute("aria-expanded", String(chapterNav.classList.contains("open")));\n    floatingButton.addEventListener("click", () => { originalButton.click(); requestAnimationFrame(sync); });\n    chapterNav.addEventListener("click", event => { if (event.target.closest("a")) requestAnimationFrame(sync); });\n    new MutationObserver(sync).observe(chapterNav, { attributes: true, attributeFilter: ["class"] });\n    document.addEventListener("keydown", event => { if (event.key === "Escape") requestAnimationFrame(sync); });\n    sync();\n  };\n  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });\n  else start();\n})();\n</script>\n'''
text = text.replace('</body>', control_script + '</body>', 1)

checks = [
    MARKER,
    'html.polytechnic-native-app .lesson-header{display:none!important',
    'id="nativeHandbookMenu"',
    'id="1041-native-handbook-controls"',
    'originalButton.click()',
]
missing_after = [item for item in checks if item not in text]
if missing_after:
    raise SystemExit(f"Repair validation failed: {missing_after}")

PATH.write_text(text, encoding="utf-8")
print("Course 1041 native-app header repair installed and validated.")
