# Shared PDF archive interface

This directory is the consumer-side mirror of the shared POLY PMNA PDF interface.

The synchronization workflow refreshes `manifests/notes-2021.json` and `manifests/notes-2026.json` under `docs/pdf-archive/manifests/` whenever `poly-pmna-pdf-files` publishes a relevant change. The source commit, changed paths, and published counts are recorded in `docs/pdf-archive-sync.json`.

PDF binaries are not duplicated here. The lesson site continues to use the canonical raw URLs from `nandurpm/poly-pmna-pdf-files`, whose source layout is:

```text
notes/<revision>/<subject-code>/v1/<subject-code>.pdf
manifests/<manifest-name>.json
```

Keep generated manifest snapshots synchronized through `.github/workflows/sync-pdf-archive-reference.yml`; do not edit them manually or create a second PDF archive in this repository.
