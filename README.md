# POLY PMNA

<p align="center">
  <img src="docs/images/logo.png" width="280" alt="POLY PMNA logo">
</p>

<p align="center"><strong>Kerala Polytechnic digital learning platform</strong></p>

<p align="center">
  <a href="https://polypmna.dpdns.org/">Live site</a> ·
  <a href="docs/README.md">Documentation</a> ·
  <a href="CONTRIBUTING.md">Contributing</a> ·
  <a href="SECURITY.md">Security</a>
</p>

POLY PMNA is a static-first educational platform for Kerala Polytechnic students. The repository contains the public website, curriculum-specific learning content, browser assets, Cloudflare Worker services, Supabase integration, Android app source, tests, and deployment automation.

## What is in this repository

| Area | Location |
|---|---|
| Public website routes | Root HTML files plus revision/content folders |
| Shared frontend assets | [`assets/`](assets/) |
| Revision 2021 content | [`revision-2021/`](revision-2021/) and [`lessons/`](lessons/) |
| Revision 2026 content | [`revision-2026/`](revision-2026/) and [`revision-2026-content/`](revision-2026-content/) |
| Ask POLY and server routes | [`workers/`](workers/) and [`functions/`](functions/) |
| Database/auth integration | [`supabase/`](supabase/) |
| Android app | [`android-app/`](android-app/) |
| Build/maintenance tooling | [`tools/`](tools/) and [`scripts/`](scripts/) |
| Automated tests | [`tests/`](tests/) and [`workers/ask-poly-ai/test/`](workers/ask-poly-ai/test/) |
| Developer documentation | [`docs/`](docs/) |
| Generated QA evidence | [`reports/`](reports/) |
| CI/CD | [`.github/workflows/`](.github/workflows/) |

See the [repository map](docs/REPOSITORY-MAP.md) for the full layout and ownership rules.

## Why are HTML files kept at the repository root?

This project predates a framework-style source/build split and its root HTML filenames are part of the public URL contract. Routes such as `/about.html`, `/revision-2026.html`, `/ask-poly.html`, and `/daily-quiz.html` are linked by browsers, search engines, the PWA/service worker, and the Android app.

They are therefore intentionally kept at stable source paths. Moving them purely to make the GitHub file list shorter would create unnecessary compatibility risk. Developer-only material is kept out of the root instead: documentation goes in `docs/`, generated evidence in `reports/`, and maintenance code in `tools/` or `scripts/`.

The deployable artifact is assembled by [`tools/build_public_site.py`](tools/build_public_site.py), which excludes internal developer directories and validates required public files before deployment.

## Main capabilities

- Revision 2026 and Revision 2021 subject/lesson portals
- Historical 2015 materials
- Ask POLY AI study assistant
- Daily quiz and mock-examination flows
- Engineering/student tools
- PWA/offline support
- Responsive and accessible browser UI
- Native Android wrapper

## Development

The root project is a static HTML/CSS/JavaScript site rather than a framework application. Backend services have their own package/configuration files under their respective directories.

For a simple local frontend preview:

```bash
python3 -m http.server 8000
```

For broad validation before a pull request:

```bash
python tools/check_repository_layout.py
python tools/site_quality_gate.py
python tools/full_site_static_audit.py
python tools/build_public_site.py --target _site_test
```

Run the tests covering whatever you changed: [`tests/frontend/`](tests/frontend/) for browser behavior, [`worker` tests](workers/ask-poly-ai/test/) for the Ask POLY backend, and the Python suites under [`tests/`](tests/) for tooling. See the [coding guidelines](docs/development/coding-guidelines.md), [contribution guide](CONTRIBUTING.md), and [release checklist](docs/RELEASE-CHECKLIST.md).

## Architecture and deployment

The public site is built as a static artifact. Cloudflare Workers and Pages Functions provide server-side behavior such as Ask POLY and protected API routes. Supabase is used for database/authentication features. GitHub Actions validates, builds, and deploys the project.

Do not place server credentials in browser JavaScript or committed configuration. Follow [SECURITY.md](SECURITY.md) and [secure deployment documentation](docs/SECURE-DEPLOYMENT.md).

## PDF archive

Published lesson PDFs and their canonical manifests live in [`nandurpm/poly-pmna-pdf-files`](https://github.com/nandurpm/poly-pmna-pdf-files). This repository keeps the website integration and synchronized catalogue references rather than a second authoritative binary archive.

See [PDF automation](docs/lesson-pdf-automation.md) and [`docs/pdf-archive/`](docs/pdf-archive/) for maintenance details.

## Documentation

Use [`docs/README.md`](docs/README.md) as the documentation index. Historical audit snapshots are grouped under [`docs/audits/`](docs/audits/); incident investigations are grouped under [`docs/diagnostics/`](docs/diagnostics/). Historical reports should not be read as current production-health declarations.

## Contributing

Changes should be made on a branch, kept focused, and verified against the affected public routes. New one-off root files are discouraged; use the [repository map](docs/REPOSITORY-MAP.md) to choose the owning directory.

Bug reports and improvement requests can be filed through GitHub Issues. Security issues should follow the private reporting guidance in [SECURITY.md](SECURITY.md).

## License

This repository is distributed under the terms in [LICENSE](LICENSE). Copyright remains with the project owner except where third-party materials state otherwise.
