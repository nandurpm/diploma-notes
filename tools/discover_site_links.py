#!/usr/bin/env python3
"""Discover source routes from homepage/sitemap and recursively follow HTML links.

This is a source inventory, NOT a claim that remote URLs returned HTTP 200.
External URLs and per-page findings are retained for a live follow-up crawl.
"""
import json
from collections import deque
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit, unquote
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://polypmna.dpdns.org'

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links, self.assets, self.meta, self.ids = [], [], {}, set()
        self.nav, self.footer = [], []
        self.in_nav = self.in_footer = False
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('id'): self.ids.add(a['id'])
        if tag == 'meta': self.meta[a.get('name', a.get('property', ''))] = a.get('content','')
        if tag == 'nav': self.in_nav = a.get('aria-label') == 'Primary navigation' or 'navlinks' in a.get('class','')
        if tag == 'footer': self.in_footer = True
        if tag == 'a' and a.get('href'):
            self.links.append(a['href'])
            if self.in_nav: self.nav.append(a['href'])
            if self.in_footer: self.footer.append(a['href'])
        for attr in ('src','poster'):
            if a.get(attr): self.assets.append(a[attr])
        if tag == 'link' and a.get('rel') in ('stylesheet','icon','preload','modulepreload') and a.get('href'):
            self.assets.append(a['href'])
    def handle_endtag(self, tag):
        if tag == 'nav': self.in_nav = False
        if tag == 'footer': self.in_footer = False

def local_path(url):
    path = unquote(urlsplit(url).path).lstrip('/') or 'index.html'
    target = ROOT / path
    if target.is_dir(): target /= 'index.html'
    return target if target.resolve().is_relative_to(ROOT.resolve()) else None

def discover():
    seeds = [ORIGIN + '/']
    sitemap = ET.parse(ROOT / 'sitemap.xml')
    seeds += [el.text for el in sitemap.iter() if el.tag.endswith('}loc') and el.text]
    queue, seen, pages, external, missing = deque(seeds), set(), [], set(), []
    while queue:
        url = queue.popleft().split('#',1)[0]
        if url in seen: continue
        seen.add(url)
        target = local_path(url)
        if target is None or not target.is_file():
            missing.append(url)
            continue
        if target.suffix != '.html': continue
        parsed = Page(); parsed.feed(target.read_text(encoding='utf-8'))
        unresolved, large = [], []
        for value in parsed.links + parsed.assets:
            absolute = urljoin(url, value)
            parts = urlsplit(absolute)
            if parts.scheme not in ('http','https'): continue
            if parts.netloc != urlsplit(ORIGIN).netloc:
                external.add(absolute.split('#',1)[0]); continue
            resource = local_path(absolute)
            if resource is None or not resource.exists(): unresolved.append(value)
            elif value in parsed.assets and resource.is_file() and resource.stat().st_size > 1_000_000:
                large.append({'url':value,'bytes':resource.stat().st_size})
            if value in parsed.links and resource is not None and (resource.suffix == '.html' or resource.is_dir()):
                queue.append(absolute)
        pages.append({'url':url,'file':str(target.relative_to(ROOT)),
                      'missingReferences':sorted(set(unresolved)),
                      'missingMetadata':[key for key in ('viewport','description') if not parsed.meta.get(key)],
                      'navigation':parsed.nav,'footer':parsed.footer,'largeAssets':large})
    return {'mode':'source-discovery; remote HTTP, browser layout and timing not verified',
            'seedCount':len(seeds),'pageCount':len(pages),'pages':pages,
            'missingRoutes':missing,'externalUrls':sorted(external)}

if __name__ == '__main__':
    report = discover()
    out = ROOT / 'reports/six-area-link-discovery.json'
    out.write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({k:report[k] for k in ('mode','seedCount','pageCount')}))
    print(f"External URLs: {len(report['externalUrls'])}; unresolved routes: {len(report['missingRoutes'])}")
