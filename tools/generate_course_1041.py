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
EXPECTED_PAYLOAD_SHA256 = "29239f1b5c993807f16ba62c2d0e7718b15d449570e257d90c206fe6c34d2064"
EXPECTED_HTML_BYTES = 577326
EXPECTED_SHA256 = "098ecfddf6ff398a1463c1a6752711202a1124a23800f32d20076fe8c25cf699"
BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
ROLLING_BASE = 257
ROLLING_TARGETS = (
    (1_000_000_007, 809061346),
    (1_000_000_009, 454722327),
    (998_244_353, 909238470),
)


def numeric_order(path: Path) -> tuple[int, ...]:
    return tuple(int(item) for item in re.findall(r"\d+", path.stem))


def rolling_prefix(text: str, modulus: int) -> list[int]:
    values = [0] * (len(text) + 1)
    for index, character in enumerate(text, start=1):
        values[index] = (values[index - 1] * ROLLING_BASE + ord(character)) % modulus
    return values


def rolling_powers(length: int, modulus: int) -> list[int]:
    powers = [1] * (length + 1)
    for index in range(1, length + 1):
        powers[index] = powers[index - 1] * ROLLING_BASE % modulus
    return powers


def recover_missing_character(payload: str) -> str:
    if len(payload) != EXPECTED_PAYLOAD_CHARS - 1:
        raise RuntimeError(f"Unexpected payload length: {len(payload)}")

    length = len(payload)
    prepared = []
    for modulus, target in ROLLING_TARGETS:
        prefix = rolling_prefix(payload, modulus)
        powers = rolling_powers(length + 1, modulus)
        prepared.append((modulus, target, prefix, powers))

    for position in range(length + 1):
        suffix_length = length - position
        candidate_constants = []
        for modulus, target, prefix, powers in prepared:
            suffix_hash = (prefix[length] - prefix[position] * powers[suffix_length]) % modulus
            before = prefix[position] * powers[suffix_length + 1] % modulus
            candidate_constants.append((modulus, target, before, suffix_hash, powers[suffix_length]))

        for character in BASE64_ALPHABET:
            value = ord(character)
            if all(
                (before + value * character_power + suffix_hash) % modulus == target
                for modulus, target, before, suffix_hash, character_power in candidate_constants
            ):
                repaired = payload[:position] + character + payload[position:]
                if hashlib.sha256(repaired.encode("ascii")).hexdigest() != EXPECTED_PAYLOAD_SHA256:
                    continue
                print(f"Recovered missing Base64 character at offset {position}: {character!r}")
                return repaired

    raise RuntimeError("Unable to recover the missing Course 1041 payload character")


def decode_payload(payload: str) -> bytes:
    if len(payload) == EXPECTED_PAYLOAD_CHARS - 1:
        payload = recover_missing_character(payload)
    elif len(payload) != EXPECTED_PAYLOAD_CHARS:
        raise RuntimeError(f"Unexpected payload length: {len(payload)}")

    payload_digest = hashlib.sha256(payload.encode("ascii")).hexdigest()
    if payload_digest != EXPECTED_PAYLOAD_SHA256:
        raise RuntimeError(f"Course 1041 payload checksum mismatch: {payload_digest}")

    compressed = base64.b64decode(payload, validate=True)
    return lzma.decompress(compressed)


def main() -> None:
    parts = sorted(PAYLOAD_DIR.glob("part-*.txt"), key=numeric_order)
    if not parts:
        raise RuntimeError("Course 1041 payload files are missing")

    payload = "".join(path.read_text(encoding="utf-8").strip() for path in parts)
    html = decode_payload(payload)
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
