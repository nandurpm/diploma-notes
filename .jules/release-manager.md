# Release Manager Journal

This journal documents project-specific release practices, deployment constraints, important versioning conventions, and lessons from failed releases or validation checks.

## 2026-07-29 - Synchronizing Structural Validation with Content Additions

**Learning:** Adding new curriculum course lesson files (e.g., adding Revision 2026 HTML lessons) dynamically expands the database of resources. However, strict automated quality gates like `tools/validate_site_structure.py` perform exact-match checks against the known number of lesson files (e.g., expecting exactly 29 Revision 2026 lessons). If new lessons are added without updating these validation assertions, CI/CD pipelines fail, blocking deployments and creating false-alarm alerts.

**Action:** Whenever new course lessons or assets are added or updated in a release, ensure that any exact-match file counts inside `tools/validate_site_structure.py` are updated synchronously to keep structural validation tests passing and deployment-ready.
