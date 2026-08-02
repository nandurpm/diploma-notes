# Release Manager Journal

This journal documents project-specific release practices, deployment constraints, important versioning conventions, and lessons from failed releases or validation checks.

## 2026-07-29 - Synchronizing Structural Validation with Content Additions

**Learning:** Adding new curriculum course lesson files (e.g., adding Revision 2026 HTML lessons) dynamically expands the database of resources. However, strict automated quality gates like `tools/validate_site_structure.py` perform exact-match checks against the known number of lesson files (e.g., expecting exactly 29 Revision 2026 lessons). If new lessons are added without updating these validation assertions, CI/CD pipelines fail, blocking deployments and creating false-alarm alerts.

**Action:** Whenever new course lessons or assets are added or updated in a release, ensure that any exact-match file counts inside `tools/validate_site_structure.py` are updated synchronously to keep structural validation tests passing and deployment-ready.

## 2026-08-01 - Preventing Clean Checkout Failures for Git-Ignored Release Assets

**Learning:** Git-ignored static assets (such as PDF downloadable notes under `revision-2026-content/notes/` which are hosted externally on GitHub Releases) will not exist on disk on clean checkouts. If sitemap generators and quality gates strictly enforce physical file existence, they will fail on clean local checkouts or CI runners. Dynamically preserving existing sitemap entries for these specific files and bypassing local file existence/reference audits prevents CI/CD pipeline breakage.

**Action:** For any git-ignored release assets that are hosted externally, configure sitemap generators to dynamically preserve their entries from the existing sitemap and instruct validation gates to bypass local disk existence audits for them.
## 2026-08-01 - Corrupted Build Metadata Correction and Release Standardization

**Learning:** Valid metadata configuration and structured release steps are essential for automated environments. Duplicate keys and invalid formatting inside `build-info.json` break JSON parsers, causing automation scripts to fail. Furthermore, the absence of a centralized, developer-facing release and deployment checklist can lead to missing validation checks or inconsistent manual rollbacks.

**Action:** Maintain single valid JSON schemas in metadata files like `build-info.json` and compile formal documentation in `RELEASE-CHECKLIST.md` to guarantee robust and repeatable release pipelines.

## 2026-08-02 - Enhancing Quality Gate Robustness for Clean Web Checkouts

**Learning:** Pre-deployment validation scripts like `validate_site_structure.py` that depend on non-website project directories (such as the Android application source `MainActivity.java`) can throw fatal exceptions in clean, web-only checkout environments where those directories are excluded. This prevents running local or automated quality assurance checks on the web frontend.

**Action:** Always check for the physical existence of optional or platform-specific source directories before initiating structural validations. If they are missing, handle the scenario gracefully by skipping the dependent tests with a clear skipped status while allowing other critical checks to complete successfully.
