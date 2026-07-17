#!/usr/bin/env python3
"""Make Course 1041 content-only on mobile/APK while preserving desktop browser tools."""
from pathlib import Path
import re

PATH = Path("revision-2026-content/lessons/lessons-1041.html")
text = PATH.read_text(encoding="utf-8")

required = [
    '<meta name="revision" content="REV2026">',
    '<meta name="course-code" content="1041">',
    '<header class="lesson-header">',
    'id="chapterNav"',
]
missing = [item for item in required if item not in text]
if missing:
    raise SystemExit(f"Course identity/structure guard failed: {missing}")

# Remove the previous app-detection-only approach and its floating chapter control.
text = re.sub(
    r'\n<script id="1041-native-app-header-fix-v1">.*?</script>\n',
    '\n',
    text,
    count=1,
    flags=re.S,
)
text = re.sub(
    r'\n/\* Course 1041 Android-app integration:.*?@media print\{\.native-handbook-menu\{display:none!important\}\}\n',
    '\n',
    text,
    count=1,
    flags=re.S,
)
text = re.sub(
    r'\n<button class="native-handbook-menu[^>]*>.*?</button>',
    '',
    text,
    count=1,
    flags=re.S,
)
text = re.sub(
    r'\n<script id="1041-native-handbook-controls">.*?</script>\n',
    '\n',
    text,
    count=1,
    flags=re.S,
)

content_only_css = r'''
/* Course 1041 mobile/APK content-only layout.
   The Android application already provides the main header and sidebar. */
.native-handbook-menu{display:none!important}
@media(max-width:840px){
 :root{--header-h:0px}
 html{scroll-padding-top:12px}
 .lesson-header,.chapter-nav,.native-handbook-menu,.nav-arrows{display:none!important;visibility:hidden!important}
 .lesson-shell{display:block!important;grid-template-columns:1fr!important;padding:12px 10px 28px!important}
 .content{width:100%!important;max-width:none!important;margin:0!important;padding:0!important}
 .cover{min-height:auto!important;margin-top:0!important}
 .cover-inner{padding-top:28px!important}
}
html.polytechnic-native-app{--header-h:0px;scroll-padding-top:12px}
html.polytechnic-native-app .lesson-header,
html.polytechnic-native-app .chapter-nav,
html.polytechnic-native-app .native-handbook-menu,
html.polytechnic-native-app .nav-arrows{display:none!important;visibility:hidden!important;height:0!important;min-height:0!important;max-height:0!important;padding:0!important;margin:0!important;border:0!important;overflow:hidden!important}
html.polytechnic-native-app .lesson-shell{display:block!important;grid-template-columns:1fr!important;padding:12px 10px 28px!important}
html.polytechnic-native-app .content{width:100%!important;max-width:none!important;margin:0!important;padding:0!important}
html.polytechnic-native-app .cover{min-height:auto!important;margin-top:0!important}
'''

anchor = '@media(prefers-reduced-motion:reduce)'
if anchor not in text:
    raise SystemExit("Responsive CSS anchor not found")
text = text.replace(anchor, content_only_css + '\n' + anchor, 1)

checks = [
    'Course 1041 mobile/APK content-only layout',
    '.lesson-header,.chapter-nav,.native-handbook-menu,.nav-arrows{display:none!important',
    'html.polytechnic-native-app .chapter-nav',
]
missing_after = [item for item in checks if item not in text]
for forbidden in ['1041-native-app-header-fix-v1', 'id="nativeHandbookMenu"', '1041-native-handbook-controls']:
    if forbidden in text:
        raise SystemExit(f"Old lesson chrome marker still present: {forbidden}")
if missing_after:
    raise SystemExit(f"Content-only repair validation failed: {missing_after}")

PATH.write_text(text, encoding="utf-8")
print("Course 1041 mobile/APK content-only layout installed.")
