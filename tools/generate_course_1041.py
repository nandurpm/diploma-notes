from __future__ import annotations

import base64
import hashlib
import lzma
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAYLOAD_DIR = ROOT / "tools" / ".course-1041-payload"
TARGET = ROOT / "revision-2026-content" / "lessons" / "lessons-1041.html"
EXPECTED_PAYLOAD_CHARS = 93884
EXPECTED_HTML_BYTES = 577326
EXPECTED_SHA256 = "098ecfddf6ff398a1463c1a6752711202a1124a23800f32d20076fe8c25cf699"


def numeric_order(path: Path) -> tuple[int, ...]:
    return tuple(int(item) for item in re.findall(r"\d+", path.stem))


def main() -> None:
    parts = sorted(PAYLOAD_DIR.glob("part-*.txt"), key=numeric_order)
    if not parts:
        raise RuntimeError("Course 1041 payload files are missing")

    payload = "".join(path.read_text(encoding="utf-8").strip() for path in parts)
    if len(payload) != EXPECTED_PAYLOAD_CHARS:
        raise RuntimeError(f"Unexpected payload length: {len(payload)}")

    html = lzma.decompress(base64.b64decode(payload))
    digest = hashlib.sha256(html).hexdigest()
    if len(html) != EXPECTED_HTML_BYTES:
        raise RuntimeError(f"Unexpected handbook size: {len(html)} bytes")
    if digest != EXPECTED_SHA256:
        raise RuntimeError(f"Handbook checksum mismatch: {digest}")

    text = html.decode("utf-8")
    checks = {
        "main": "<main" in text,
        "course": "Course 1041" in text,
        "modules": text.count('class="module-panel') == 4,
        "animations": text.count('class="animation-card') == 12,
        "examples": text.count('class="worked') == 22,
        "experiments": text.count('class="experiment') == 16,
        "atlas": text.count('class="component-card') == 16,
        "questions": text.count('class="qa') >= 455,
        "autoprint": "autoPrintNotes" in text,
    }
    failed = [name for name, passed in checks.items() if not passed]
    if failed:
        raise RuntimeError(f"Handbook validation failed: {', '.join(failed)}")

    TARGET.parent.mkdir(parents=True, exist_ok=True)
    TARGET.write_bytes(html)
    print(f"Created {TARGET.relative_to(ROOT)}")
    print(f"Bytes: {len(html)}")
    print(f"SHA256: {digest}")
    print(f"Payload parts: {len(parts)}")


if __name__ == "__main__":
    main()
