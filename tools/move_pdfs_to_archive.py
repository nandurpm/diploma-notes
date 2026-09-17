"""Copy, verify and publish PDFs before removing tracked consumer copies."""
import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path


def git(root, *args):
    return subprocess.check_output(['git', '-C', str(root), *args]).decode().strip()


def migrate(source, archive, branch):
    source_commit = git(source, 'rev-parse', 'HEAD')
    paths = [p for p in git(source, 'ls-files', '-z').split('\0') if p.lower().endswith('.pdf')]
    if not paths:
        raise ValueError('No tracked PDFs to migrate; refusing empty migration')
    records = []
    git(archive, 'checkout', '-b', branch)
    pending = []
    batch_size = 0
    def publish():
        nonlocal pending, batch_size
        if not pending:
            return
        git(archive, 'add', '--', *pending)
        git(archive, 'commit', '-m', 'Preserve original diploma-notes PDFs with verified Git hashes')
        git(archive, 'push', 'origin', f'HEAD:refs/heads/{branch}')
        pending, batch_size = [], 0
    for relative in paths:
        original = source / relative
        if not original.is_file() or original.is_symlink():
            raise ValueError(f'Unsafe source: {relative}')
        expected = git(source, 'rev-parse', f'HEAD:{relative}')
        if git(source, 'hash-object', str(original)) != expected:
            raise ValueError(f'Modified source: {relative}')
        with original.open('rb') as stream:
            if stream.read(5) != b'%PDF-':
                raise ValueError(f'Invalid PDF: {relative}')
            stream.seek(0)
            sha256 = hashlib.file_digest(stream, 'sha256').hexdigest()
        destination_path = f'legacy/diploma-notes/{source_commit}/{relative}'
        destination = archive / destination_path
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(original, destination)
        if git(archive, 'hash-object', str(destination)) != expected:
            raise ValueError(f'Copy differs: {relative}')
        n = original.stat().st_size
        records.append({'sourcePath': relative, 'archivePath': destination_path, 'gitBlob': expected, 'sha256': sha256, 'bytes': n})
        if pending and batch_size + n > 350_000_000:
            publish()
        pending.append(destination_path); batch_size += n
    publish()
    report = {'sourceCommit': source_commit, 'documents': records}
    manifest = archive / 'manifests/legacy-diploma-notes.json'
    manifest.parent.mkdir(parents=True, exist_ok=True)
    manifest.write_text(json.dumps(report, indent=2) + '\n')
    git(archive, 'add', '--', 'manifests/legacy-diploma-notes.json')
    git(archive, 'commit', '-m', 'Record checksums and original public paths for PDF migration')
    git(archive, 'push', 'origin', f'HEAD:refs/heads/{branch}')
    archive_commit = git(archive, 'rev-parse', 'HEAD')
    remote_commit = git(archive, 'ls-remote', 'origin', f'refs/heads/{branch}').split()[0]
    if archive_commit != remote_commit:
        raise ValueError('Remote archive commit does not match verified local commit')
    git(archive, 'fetch', 'origin', branch)
    for r in records:
        if git(archive, 'rev-parse', f"FETCH_HEAD:{r['archivePath']}") != r['gitBlob']:
            raise ValueError(f"Remote archive hash mismatch: {r['sourcePath']}")
    report.update(archiveRepository='nandurpm/poly-pmna-pdf-files', archiveCommit=archive_commit)
    mapping = source / 'docs/pdf-storage-map.json'
    mapping.parent.mkdir(parents=True, exist_ok=True)
    mapping.write_text(json.dumps(report, indent=2) + '\n')
    # Removal is restricted to the exact source paths verified above.
    git(source, 'rm', '--', *paths)
    git(source, 'add', '--', 'docs/pdf-storage-map.json')
    print(f'Archived {len(records)} PDFs ({sum(r["bytes"] for r in records)} bytes) at {archive_commit}')


if __name__ == '__main__':
    migrate(Path(sys.argv[1]).resolve(), Path(sys.argv[2]).resolve(), sys.argv[3])
