import importlib.util
import tempfile
import unittest
from pathlib import Path

SPEC = importlib.util.spec_from_file_location('optimizer', Path(__file__).resolve().parents[1] / 'tools/optimize_public_build.py')
optimizer = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(optimizer)

class CspBuildTests(unittest.TestCase):
    def test_executable_scripts_are_external_and_data_is_preserved(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            page = root / 'index.html'
            page.write_text('<script>window.first=1;</script><script type="application/ld+json">{"name":"Lesson"}</script><script defer>window.second=window.first+1;</script><script src="/existing.js"></script>')
            self.assertEqual(optimizer.externalize_inline_scripts(root), 2)
            output = page.read_text()
            self.assertIn('application/ld+json', output)
            self.assertIn('{"name":"Lesson"}', output)
            self.assertNotIn('<script defer', output)
            self.assertIn('src="/existing.js"', output)
            self.assertEqual(len(list((root / 'assets/build').glob('*.js'))), 2)
            self.assertEqual(optimizer.externalize_inline_scripts(root), 0)

    def test_module_and_non_javascript_data(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            page = root / 'index.html'
            page.write_text('<script type="module">export const value=1;</script><script type="application/json">[1,2]</script>')
            self.assertEqual(optimizer.externalize_inline_scripts(root), 1)
            self.assertIn('type="module" src=', page.read_text())
            self.assertIn('application/json">[1,2]</script>', page.read_text())

if __name__ == '__main__':
    unittest.main()
