#!/usr/bin/env python3
"""Serve a public build with its production _headers for browser regression tests."""
import argparse
from fnmatch import fnmatch
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit


def header_rules(root):
    rules = []
    for line in (root / '_headers').read_text().splitlines():
        if not line.strip() or line.lstrip().startswith('#'):
            continue
        if not line[0].isspace():
            rules.append((line.strip(), {}))
        else:
            name, value = line.strip().split(':', 1)
            rules[-1][1][name] = value.strip()
    return rules


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        headers = {}
        for pattern, values in self.server.header_rules:
            if fnmatch(urlsplit(self.path).path, pattern):
                headers.update(values)
        for name, value in headers.items():
            self.send_header(name, value)
        super().end_headers()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', type=Path, default=Path('_site'))
    parser.add_argument('--port', type=int, default=8000)
    args = parser.parse_args()
    server = ThreadingHTTPServer(('0.0.0.0', args.port), partial(Handler, directory=str(args.root)))
    server.header_rules = header_rules(args.root)
    server.serve_forever()
