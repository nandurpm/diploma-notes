# Documentation

Developer documentation for POLY PMNA lives here. Public website routes remain outside this directory; `docs/` is excluded from the deployed site except for the explicitly synchronized PDF catalogue manifests used by the build.

## Start here

| Need | Guide |
|---|---|
| Understand the repository | [Repository map](REPOSITORY-MAP.md) |
| Make a safe code change | [Development guides](development/README.md) |
| Contribute | [Contribution guide](../CONTRIBUTING.md) |
| Release safely | [Release checklist](RELEASE-CHECKLIST.md) |
| Understand backend/security boundaries | [Architecture](architecture/) and [secure deployment](SECURE-DEPLOYMENT.md) |
| Publish lesson PDFs | [PDF automation](lesson-pdf-automation.md) |
| Review a historical audit | [Audit archive](audits/README.md) |
| Investigate a past incident | [Diagnostics](diagnostics/README.md) |
| Review superseded notes | [Archive](archive/) |

## Organization

| Area | Purpose |
|---|---|
| [`architecture/`](architecture/) | Current architecture and system-boundary documentation |
| [`development/`](development/) | Coding and repository-maintenance standards |
| [`audits/`](audits/) | Historical audit snapshots; not current health declarations |
| [`diagnostics/`](diagnostics/) | Incident investigations and troubleshooting evidence |
| [`archive/`](archive/) | Superseded design notes and historical reference material |
| [`pdf-archive/`](pdf-archive/) | Synchronized PDF catalogue manifests and archive documentation |
| [`images/`](images/) | Documentation-only images |

Feature-specific standards that are still current remain at the top of `docs/` when they are referenced broadly by workflows or contributors, including lesson standards, release instructions, authentication/security notes, and PDF automation.

## Current health vs. historical evidence

Audit and diagnostic files are intentionally retained for traceability, but their observations may describe an older deployment. For current health, rely on the active CI workflows and current verification tools such as:

```bash
python tools/check_repository_layout.py
python tools/site_quality_gate.py
python tools/full_site_static_audit.py
python tools/build_public_site.py --target _site_test
```

The repository map explains which files are public compatibility paths and which files are safe to reorganize.
