"""Restore original public PDF URLs from an immutable archive commit at build time."""
import concurrent.futures
import hashlib
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path, PurePosixPath


def safe_path(value):
    p = PurePosixPath(value)
    if not value or p.is_absolute() or '..' in p.parts or '\\' in value or str(p) != value or p.suffix.lower() != '.pdf':
        raise ValueError(f'Unsafe PDF path: {value}')
    return p


def verified(data, record):
    blob = hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
    return (data.startswith(b'%PDF-') and len(data) == record['bytes']
            and hashlib.sha256(data).hexdigest() == record['sha256'] and blob == record['gitBlob'])


def restore(root, target, should_copy, fetch=None):
    manifest = root / 'docs/pdf-storage-map.json'
    if not manifest.exists():
        return 0
    data = json.loads(manifest.read_text())
    commit = data['archiveCommit']
    if data['archiveRepository'] != 'nandurpm/poly-pmna-pdf-files' or not re.fullmatch('[0-9a-f]{40}', commit):
        raise ValueError('Archive repository and immutable commit are required')
    records = data['documents']
    if len({r['sourcePath'] for r in records}) != len(records):
        raise ValueError('Duplicate public PDF paths')
    for r in records:
        safe_path(r['sourcePath']); safe_path(r['archivePath'])
    def transfer(record):
        relative = record['sourcePath']
        if not should_copy(relative):
            return 0
        url = 'https://raw.githubusercontent.com/nandurpm/poly-pmna-pdf-files/' + commit + '/' + urllib.parse.quote(record['archivePath'], safe='/')
        cached = root / relative
        if fetch is None and cached.is_file() and not cached.is_symlink():
            content = cached.read_bytes()
            if not verified(content, record):
                raise ValueError(f'Cached PDF differs from archived original: {relative}')
        elif fetch:
            content = fetch(url)
        else:
            with urllib.request.urlopen(url, timeout=120) as response:
                content = response.read()
        if not verified(content, record):
            raise ValueError(f'Archive verification failed: {relative}')
        destination = target / relative
        if not destination.resolve().is_relative_to(target.resolve()):
            raise ValueError('Public destination escapes build directory')
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(content)
        return 1
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        return sum(pool.map(transfer, records))
