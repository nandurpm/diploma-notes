# Purpose: Apply revision 2026 department themes - Descriptive comment added for clarity
#!/usr/bin/env python3
from __future__ import annotations

import re
from pathlib import Path

PAGE = Path("revision-2026.html")
THEME_HREF = "/assets/css/revision-2026-department-themes.css?v=20260716-rev2026-department-themes1"
THEME_LINK = f'<link rel="stylesheet" href="{THEME_HREF}">'


def main() -> None:
    source = PAGE.read_text(encoding="utf-8")
    source = re.sub(
        r'<link rel="stylesheet" href="/assets/css/revision-2026-department-themes\.css\?v=[^"]+">',
        "",
        source,
    )
    anchor = re.search(
        r'<link rel="stylesheet" href="/assets/css/revision-2026-directory\.css\?v=[^"]+">',
        source,
    )
    if not anchor:
        raise SystemExit("Revision 2026 directory stylesheet link was not found")
    source = source[: anchor.end()] + THEME_LINK + source[anchor.end() :]
    PAGE.write_text(source, encoding="utf-8")


if __name__ == "__main__":
    main()
