import sys
import tempfile
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
from externalize_public_scripts import externalize_scripts

class CSPExternalizationTests(unittest.TestCase):
    def test_externalizes_code_preserving_order_and_data(self):
        source = '<body><script>window.a=1;</script><script src="/b.js"></script><script type="application/ld+json">{"x":1}</script><button onclick="go(this); return false;">Go</button></body>'
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            result = externalize_scripts(source, root)
            self.assertNotIn('onclick=', result)
            self.assertNotIn('<script>window.a', result)
            self.assertIn('application/ld+json', result)
            scripts = [p.read_text() for p in root.rglob('*.js')]
            self.assertIn('window.a=1;', scripts)
            self.assertTrue(any('go(this); return false;' in s and 'event.preventDefault()' in s for s in scripts))
            self.assertLess(result.index('/assets/js/csp-inline/'), result.index('/b.js'))
    def test_preserves_module_and_removes_ignored_inline_defer(self):
        with tempfile.TemporaryDirectory() as directory:
            result = externalize_scripts('<script defer>run()</script><script type="module">import x from "/x.js";</script>',Path(directory))
            self.assertNotIn('defer', result)
            self.assertIn('type="module"', result)
    def test_deduplicates_shared_code(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)
            externalize_scripts('<script>run()</script><script>run()</script>',root)
            self.assertEqual(len(list(root.rglob('*.js'))),1)

    def test_unicode_line_separators_do_not_shift_script_offsets(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)
            result=externalize_scripts('<p>text\u2028more\x0btext</p>\n<script>run()</script>',root)
            self.assertEqual([p.read_text() for p in root.rglob('*.js')], ['run()'])
            self.assertTrue(result.startswith('<p>text\u2028more\x0btext</p>'))
