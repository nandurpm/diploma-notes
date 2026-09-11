import importlib.util
import json
import sys
import tempfile
import types
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('public_build', ROOT / 'tools/build_public_site.py')
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)

class PublicPdfCataloguesTest(unittest.TestCase):
    def test_only_runtime_catalogues_are_public(self):
        for path in build.PUBLIC_PDF_CATALOGUES:
            self.assertTrue(build.should_copy(path))
            data = json.loads((ROOT / path).read_text())
            self.assertIsInstance(data['subjects'], list)
        self.assertFalse(build.should_copy('docs/internal.json'))
        self.assertFalse(build.should_copy('docs/pdf-archive/manifests/archive-index.json'))

    def test_build_copies_catalogues_and_fails_when_one_is_missing(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            for name in build.REQUIRED:
                path = root / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text('{}' if name.endswith('.json') else '<html><head></head></html>')
            restore = types.SimpleNamespace(restore=lambda *args: 0)
            with patch.object(build, 'ROOT', root), patch.object(build, 'tracked_files', return_value=list(build.REQUIRED)), patch.dict(sys.modules, restore_archived_pdfs=restore):
                target = root / '_site'
                build.build(target, optimize=False)
                for name in build.PUBLIC_PDF_CATALOGUES:
                    self.assertTrue((target / name).is_file())
                (root / 'docs/pdf-archive/manifests/notes-2026.json').unlink()
                with self.assertRaises(FileNotFoundError):
                    build.build(target, optimize=False)

if __name__ == '__main__':
    unittest.main()
