import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('build', ROOT / 'tools/build_public_site.py')
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)

class RevisionLabelTests(unittest.TestCase):
    def test_existing_generated_lessons_have_correct_revision_in_build(self):
        repaired = 0
        for path in (ROOT / 'revision-2026-content/lessons').glob('*.html'):
            raw = path.read_text()
            result = build.normalize_generated_revision_label(str(path.relative_to(ROOT)), raw)
            if result != raw:
                repaired += 1
                self.assertNotIn('Kerala Polytechnic REV_', result)
                self.assertIn('Revision 2026', result)
                self.assertEqual(build.normalize_generated_revision_label(str(path.relative_to(ROOT)), result), result)
        self.assertGreater(repaired, 0)

    def test_nonlesson_content_unchanged(self):
        raw = '<title>Example | Kerala Polytechnic REV_Example Study Hub</title>'
        self.assertEqual(build.normalize_generated_revision_label('blog/example.html', raw), raw)

if __name__ == '__main__':
    unittest.main()
