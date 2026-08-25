"""HTMLParser-based helpers for POLY PMNA structured-data script blocks."""
from __future__ import annotations

from dataclasses import dataclass
from html.parser import HTMLParser


@dataclass(frozen=True)
class StructuredDataBlock:
    """A complete structured-data script block and its source offsets."""

    start: int
    end: int
    payload: str


class _StructuredDataParser(HTMLParser):
    def __init__(self, source: str) -> None:
        super().__init__(convert_charrefs=False)
        self.source = source
        self.line_offsets = [0]
        self.line_offsets.extend(index + 1 for index, char in enumerate(source) if char == "\n")
        self.blocks: list[StructuredDataBlock] = []
        self.active: tuple[int, int] | None = None

    def source_offset(self, position: tuple[int, int]) -> int:
        line, column = position
        return self.line_offsets[line - 1] + column

    @staticmethod
    def is_target(attrs: list[tuple[str, str | None]]) -> bool:
        normalized = {name.lower(): value or "" for name, value in attrs}
        return (
            normalized.get("type", "").strip().lower() == "application/ld+json"
            and "data-poly-structured-data" in normalized
        )

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() != "script" or self.active is not None or not self.is_target(attrs):
            return
        start = self.source_offset(self.getpos())
        raw_start_tag = self.get_starttag_text() or ""
        self.active = (start, start + len(raw_start_tag))

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() != "script" or self.active is None:
            return
        start, payload_start = self.active
        end_start = self.source_offset(self.getpos())
        self.blocks.append(StructuredDataBlock(start, end_start + len("</script>"), self.source[payload_start:end_start]))
        self.active = None


def find_structured_data_blocks(source: str) -> list[StructuredDataBlock]:
    """Return complete POLY JSON-LD script blocks in source order."""

    parser = _StructuredDataParser(source)
    parser.feed(source)
    parser.close()
    return parser.blocks


def remove_structured_data_blocks(source: str) -> str:
    """Remove complete POLY JSON-LD blocks and their following whitespace."""

    result = source
    for block in reversed(find_structured_data_blocks(source)):
        end = block.end
        while end < len(result) and result[end].isspace():
            end += 1
        result = result[:block.start] + result[end:]
    return result
