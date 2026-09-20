import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('blog', Path(__file__).resolve().parents[1] / 'tools/render_blog_index.py')
blog = importlib.util.module_from_spec(spec)
spec.loader.exec_module(blog)

class PublicationTests(unittest.TestCase):
    def test_drafts_and_future_posts_are_not_prerendered(self):
        base = dict(title='Test', summary='Summary', url='/blog/test.html', date='2020-01-01')
        records = [base, dict(base, status='published'), dict(base, status='draft'),
                   dict(base, status='pending_review'), dict(base, status='rejected'),
                   dict(base, status='published', date='2999-01-01')]
        original = blog.INDEX
        try:
            with tempfile.TemporaryDirectory() as temp:
                blog.INDEX = Path(temp) / 'index.json'
                blog.INDEX.write_text(json.dumps(records))
                self.assertEqual(len(blog.load_posts()), 2)
        finally:
            blog.INDEX = original

    def test_render_updates_formatted_markup_and_removes_unpublished_cards(self):
        source = blog.PAGE.read_text()
        rendered = blog.render(source, [])
        self.assertNotIn('class="blog-card-title-link"', rendered)
        self.assertEqual(blog.check_prerender(rendered, []), [])
        self.assertEqual(blog.check_prerender(blog.render(source, blog.load_posts()), blog.load_posts()), [])

if __name__ == '__main__':
    unittest.main()
