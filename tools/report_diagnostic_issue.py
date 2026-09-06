#!/usr/bin/env python3
"""Keep one open failure issue per diagnostic; successes belong in job summaries."""
import argparse
import json
import os
from pathlib import Path
import subprocess


def report_issue(status, title, report, repo):
    if status != 'failed':
        return
    # Fetch all open issues, then match the exact title (not fuzzy search).
    result = subprocess.run(
        ['gh', 'api', '--paginate', f'repos/{repo}/issues?state=open&per_page=100',
         '--jq', '.[] | {number, title, pull_request}'],
        check=True, capture_output=True, text=True,
    )
    matches = [item for line in result.stdout.splitlines() if line.strip()
               for item in [json.loads(line)]
               if item['title'] == title and not item.get('pull_request')]
    if matches:
        args = ['edit', str(min(item['number'] for item in matches))]
    else:
        args = ['create', '--title', title]
    subprocess.run(['gh', 'issue', *args, '--repo', repo, '--body-file', str(report)], check=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--status', required=True, choices=['passed', 'failed', 'cancelled', 'skipped'])
    parser.add_argument('--title', required=True)
    parser.add_argument('--report', required=True, type=Path)
    args = parser.parse_args()
    report_issue(args.status, args.title, args.report, os.environ['GITHUB_REPOSITORY'])


if __name__ == '__main__':
    main()
