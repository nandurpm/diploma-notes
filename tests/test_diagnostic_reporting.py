"""Regression checks for noisy reports and unnecessary Cloudflare permissions."""
import importlib.util
import json
from pathlib import Path
import subprocess
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]


def load(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'tools' / f'{name}.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


reporter = load('report_diagnostic_issue')
deploy = load('deploy_production_diagnostic')


class ReportingTests(unittest.TestCase):
    def test_non_failures_never_create_issues(self):
        with patch.object(reporter.subprocess, 'run') as run:
            for status in ['passed', 'cancelled', 'skipped']:
                reporter.report_issue(status, 'diagnostic', Path('report.md'), 'owner/repo')
            run.assert_not_called()

    def report(self, issues):
        output = '\n'.join(json.dumps(item) for item in issues)
        with patch.object(reporter.subprocess, 'run', return_value=subprocess.CompletedProcess([], 0, output)) as run:
            reporter.report_issue('failed', 'diagnostic', Path('report.md'), 'owner/repo')
            return run.call_args_list

    def test_new_failure_creates_issue(self):
        calls = self.report([])
        self.assertIn('--paginate', calls[0].args[0])
        self.assertEqual(calls[1].args[0], ['gh', 'issue', 'create', '--title', 'diagnostic', '--repo', 'owner/repo', '--body-file', 'report.md'])

    def test_repeated_failure_updates_existing_issue(self):
        calls = self.report([{'title': 'diagnostic', 'number': 8}, {'title': 'diagnostic', 'number': 4}])
        self.assertEqual(calls[1].args[0][2:4], ['edit', '4'])

    def test_similar_titles_and_prs_do_not_match(self):
        calls = self.report([{'title': 'diagnostic old', 'number': 1}, {'title': 'diagnostic', 'number': 2, 'pull_request': {'url': 'pr'}}])
        self.assertEqual(calls[1].args[0][2], 'create')

    def test_api_failure_does_not_create_duplicate(self):
        with patch.object(reporter.subprocess, 'run', side_effect=subprocess.CalledProcessError(1, 'gh')) as run:
            with self.assertRaises(subprocess.CalledProcessError):
                reporter.report_issue('failed', 'diagnostic', Path('report.md'), 'owner/repo')
            self.assertEqual(run.call_count, 1)

    def test_project_resolution_needs_no_account_listing(self):
        with patch.dict(deploy.os.environ, {'CLOUDFLARE_PAGES_PROJECT': 'diploma-notes'}), patch.object(deploy.urllib.request, 'urlopen') as request:
            self.assertEqual(deploy.cloudflare_project(), 'diploma-notes')
            request.assert_not_called()

    def test_invalid_project_rejected(self):
        for name in ['', '../other', 'project name']:
            with patch.dict(deploy.os.environ, {'CLOUDFLARE_PAGES_PROJECT': name}):
                with self.assertRaises(ValueError):
                    deploy.cloudflare_project()


if __name__ == '__main__':
    unittest.main()
