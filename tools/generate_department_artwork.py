# Purpose: Generate department artwork - Descriptive comment added for clarity
#!/usr/bin/env python3
from __future__ import annotations

import html
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets/media/departments"

PALETTES = [
    ("#dbeafe", "#1d4ed8", "#f59e0b"),
    ("#dcfce7", "#047857", "#14b8a6"),
    ("#ffedd5", "#ea580c", "#64748b"),
    ("#ede9fe", "#4338ca", "#7c3aed"),
    ("#cffafe", "#0e7490", "#2563eb"),
    ("#ffe4e6", "#be123c", "#e11d48"),
    ("#fef3c7", "#c2410c", "#0f766e"),
    ("#e2e8f0", "#334155", "#0f766e"),
]


def departments() -> list[tuple[str, str]]:
    text = (ROOT / "revision-2021.html").read_text(encoding="utf-8")
    found = re.findall(
        r'<a class="choice-card" href="revision-2021/([^"]+)"><span>.*?</span><h2>(.*?)</h2>',
        text,
        re.S,
    )
    return [(href.removesuffix(".html"), re.sub(r"<.*?>", "", html.unescape(title))) for href, title in found]


def acronym(title: str) -> str:
    words = re.findall(r"[A-Za-z0-9]+", title.replace("&", "and"))
    letters = "".join(word[0] for word in words if word.lower() not in {"and", "of", "the"})
    return (letters or "DN")[:5].upper()


def kind(title: str) -> str:
    value = title.lower()
    if "electrical and electronics" in value:
        return "tower"
    if "electronics" in value or "circuit" in value or "instrumentation" in value or "micro" in value:
        return "chip"
    if "civil" in value:
        return "bridge"
    if "architecture" in value:
        return "plan"
    if "computer" in value or "cloud" in value or "information" in value or "cyber" in value or "communication" in value:
        return "screen"
    if "artificial" in value or "robot" in value or "automation" in value:
        return "nodes"
    if "mechanical" in value or "automobile" in value or "manufacturing" in value or "mechatronics" in value or "tool" in value:
        return "gear"
    if "biomedical" in value:
        return "pulse"
    if "chemical" in value or "polymer" in value or "food" in value:
        return "flask"
    if "renewable" in value:
        return "solar"
    if "textile" in value:
        return "weave"
    if "printing" in value:
        return "print"
    if "wood" in value or "paper" in value:
        return "tree"
    if "fire" in value:
        return "shield"
    if "hotel" in value or "commercial" in value:
        return "service"
    return "screen"


def icon_paths(icon: str, primary: str, secondary: str) -> str:
    icons = {
        "tower": f'<path d="M86 302 190 62l104 240M138 180h104M116 236h148" fill="none" stroke="{primary}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/><path d="M382 52h92l-48 90h78L374 302l42-120h-70z" fill="{secondary}" stroke="#0f172a" stroke-width="9" stroke-linejoin="round"/>',
        "chip": f'<rect x="156" y="78" width="328" height="204" rx="28" fill="{primary}"/><rect x="246" y="124" width="148" height="112" rx="14" fill="#ecfeff"/><path d="M156 130h-54M156 230h-54M484 130h54M484 230h54M320 78V36M320 282v42" stroke="{secondary}" stroke-width="12" stroke-linecap="round"/>',
        "bridge": f'<path d="M72 264h496M112 264c62-112 354-112 416 0" fill="none" stroke="{primary}" stroke-width="18" stroke-linecap="round"/><path d="M160 264V150M240 264V118M320 264V136M400 264V118M480 264V150" stroke="{secondary}" stroke-width="12" stroke-linecap="round"/>',
        "plan": f'<path d="M100 278 320 86l220 192z" fill="#ffffff" stroke="{primary}" stroke-width="14" stroke-linejoin="round"/><path d="M178 278V168h96v110M342 278V146h118v132M430 76l72 72M502 76l-72 72" fill="none" stroke="{secondary}" stroke-width="11" stroke-linecap="round"/>',
        "screen": f'<rect x="116" y="72" width="408" height="220" rx="22" fill="#0f172a"/><rect x="148" y="102" width="344" height="150" rx="10" fill="{primary}"/><path d="m236 174-42 32 42 32M404 174l42 32-42 32M346 150l-52 112" fill="none" stroke="#ecfeff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/><path d="M260 292h120l20 36H240z" fill="{secondary}"/>',
        "nodes": f'<path d="M196 116 316 178 444 104M196 116l18 134 102-72 118 78 10-152M214 250l220 6" stroke="{primary}" stroke-width="10" fill="none"/><g fill="{secondary}" stroke="#ffffff" stroke-width="8"><circle cx="196" cy="116" r="30"/><circle cx="316" cy="178" r="34"/><circle cx="444" cy="104" r="30"/><circle cx="214" cy="250" r="30"/><circle cx="434" cy="256" r="30"/></g>',
        "gear": f'<circle cx="250" cy="180" r="82" fill="{primary}"/><circle cx="250" cy="180" r="34" fill="#fff7ed"/><circle cx="394" cy="198" r="62" fill="{secondary}"/><circle cx="394" cy="198" r="24" fill="#fff7ed"/><path d="M250 70v38M250 252v38M140 180h38M322 180h38M172 102l28 28M300 230l28 28M172 258l28-28M300 130l28-28" stroke="#9a3412" stroke-width="18" stroke-linecap="round"/>',
        "pulse": f'<rect x="156" y="76" width="328" height="208" rx="30" fill="#ffffff" stroke="{primary}" stroke-width="14"/><path d="M194 190h70l26-54 44 104 32-50h82" fill="none" stroke="{secondary}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>',
        "flask": f'<path d="M236 70h168M282 70v80L190 290h260l-92-140V70" fill="#fed7aa" stroke="{primary}" stroke-width="14" stroke-linejoin="round"/><path d="M232 246h176" stroke="{secondary}" stroke-width="20" stroke-linecap="round"/><circle cx="320" cy="266" r="16" fill="{primary}"/>',
        "solar": f'<circle cx="488" cy="94" r="46" fill="{secondary}"/><path d="M130 286h190l-34-92H164z" fill="{primary}" stroke="#0f172a" stroke-width="10" stroke-linejoin="round"/><path d="M420 286V154M420 154l-72-40M420 154l74-38M420 154v-82" stroke="{primary}" stroke-width="12" stroke-linecap="round"/>',
        "weave": f'<path d="M130 96h380M130 156h380M130 216h380M130 276h380M176 70v236M260 70v236M344 70v236M428 70v236" stroke="{primary}" stroke-width="14" stroke-linecap="round"/><path d="M176 96c64 60 124 60 168 0s106-60 166 0M130 216c62-60 118-60 174 0s112 60 206 0" fill="none" stroke="{secondary}" stroke-width="12" stroke-linecap="round"/>',
        "print": f'<rect x="174" y="62" width="292" height="98" rx="10" fill="#ffffff" stroke="{primary}" stroke-width="12"/><rect x="132" y="154" width="376" height="130" rx="20" fill="{primary}"/><rect x="190" y="230" width="260" height="76" rx="8" fill="#ffffff" stroke="{secondary}" stroke-width="10"/><circle cx="462" cy="190" r="16" fill="{secondary}"/>',
        "tree": f'<path d="M320 296V174" stroke="{primary}" stroke-width="22" stroke-linecap="round"/><path d="M320 80c-84 28-118 92-92 146 34-10 58-28 92-66 34 38 58 56 92 66 26-54-8-118-92-146z" fill="{secondary}" stroke="{primary}" stroke-width="12" stroke-linejoin="round"/><path d="M206 304h228" stroke="{primary}" stroke-width="14" stroke-linecap="round"/>',
        "shield": f'<path d="M320 60 474 116c-8 102-54 166-154 218-100-52-146-116-154-218z" fill="#ffffff" stroke="{primary}" stroke-width="14" stroke-linejoin="round"/><path d="M320 122c42 46-20 58 22 112-54-26-68-60-22-112z" fill="{secondary}"/>',
        "service": f'<rect x="164" y="96" width="312" height="184" rx="28" fill="#ffffff" stroke="{primary}" stroke-width="14"/><path d="M206 154h228M206 204h228M206 254h150" stroke="{secondary}" stroke-width="14" stroke-linecap="round"/><path d="M250 78h140" stroke="{primary}" stroke-width="18" stroke-linecap="round"/>',
    }
    return icons[icon]


def svg(slug: str, title: str, index: int) -> str:
    bg, primary, secondary = PALETTES[index % len(PALETTES)]
    label = acronym(title)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" role="img" aria-label="{html.escape(title)} department artwork">
  <rect width="640" height="360" fill="{bg}"/>
  <rect x="34" y="34" width="572" height="292" rx="38" fill="#ffffff" opacity=".34"/>
  {icon_paths(kind(title), primary, secondary)}
  <rect x="40" y="268" width="176" height="58" rx="22" fill="{primary}" opacity=".92"/>
  <text x="128" y="307" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="800" fill="#ffffff">{html.escape(label)}</text>
</svg>
'''


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    expected = set()
    for index, (slug, title) in enumerate(departments()):
        expected.add(f"{slug}.svg")
        (OUT / f"{slug}.svg").write_text(svg(slug, title, index), encoding="utf-8")
    for path in OUT.glob("*.svg"):
        if path.name not in expected:
            path.unlink()
    print(f"Generated {len(expected)} department SVG files in {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
