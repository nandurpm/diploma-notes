import hashlib
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
SPEC = importlib.util.spec_from_file_location('restore', Path(__file__).parents[1] / 'tools/restore_archived_pdfs.py')
m = importlib.util.module_from_spec(SPEC); SPEC.loader.exec_module(m)
class RestoreTest(unittest.TestCase):
    def test_exact_bytes_and_reject_corruption(self):
        content = b'%PDF-1.4\noriginal lesson bytes\n%%EOF'
        record = dict(sourcePath='notes/old.pdf', archivePath='legacy/notes/old.pdf', bytes=len(content), sha256=hashlib.sha256(content).hexdigest(), gitBlob=hashlib.sha1(b'blob '+str(len(content)).encode()+b'\0'+content).hexdigest())
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); (root/'docs').mkdir(); target=root/'build'; target.mkdir()
            (root/'docs/pdf-storage-map.json').write_text(json.dumps(dict(archiveRepository='nandurpm/poly-pmna-pdf-files', archiveCommit='a'*40, documents=[record])))
            self.assertEqual(m.restore(root,target,lambda p:True,lambda u:content),1)
            self.assertEqual((target/'notes/old.pdf').read_bytes(),content)
            with self.assertRaises(ValueError): m.restore(root,target,lambda p:True,lambda u:content+b'changed')
            self.assertEqual(m.restore(root,target,lambda p:False,lambda u:content),0)
    def test_path_traversal_rejected(self):
        for p in ['../a.pdf','/a.pdf','x/../../a.pdf','a\\b.pdf']:
            with self.assertRaises(ValueError): m.safe_path(p)
if __name__ == '__main__': unittest.main()
