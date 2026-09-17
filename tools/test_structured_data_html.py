#!/usr/bin/env python3
from __future__ import annotations

import json
import unittest

from dedupe_structured_data import dedupe
from structured_data_html import find_structured_data_blocks, remove_structured_data_blocks


BLOCK = '<script type="application/ld+json" data-poly-structured-data>{"@context":"https://schema.org","name":"A > B"}</script>'


class StructuredDataHtmlTests(unittest.TestCase):
    def test_parser_handles_attributes_and_script_text_without_html_regex(self) -> None:
        source = f'<script>const marker = "</script>";</script>\n{BLOCK}'
        blocks = find_structured_data_blocks(source)
        self.assertEqual(len(blocks), 1)
        self.assertEqual(json.loads(blocks[0].payload)["name"], "A > B")

    def test_remove_only_target_blocks(self) -> None:
        source = f'<head>\n{BLOCK}\n</head>'
        self.assertEqual(remove_structured_data_blocks(source), "<head>\n</head>")

    def test_dedupe_preserves_first_identical_block(self) -> None:
        source = f'<body>\n{BLOCK}\n<div>content</div>\n{BLOCK}\n</body>'
        updated, removed = dedupe(source)
        self.assertEqual(removed, 1)
        self.assertEqual(updated.count('data-poly-structured-data'), 1)
        self.assertIn("<div>content</div>", updated)


if __name__ == "__main__":
    unittest.main()
