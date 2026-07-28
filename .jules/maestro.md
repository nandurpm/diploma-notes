## 2026-07-28 - Repository Integrity and Multi-Specialist Task Coordination

**Learning:** When managing changes in repositories that employ strict, automated layout and structural validation gates (such as `tools/audit_site.py` or `tools/validate_site_structure.py`), introducing even low-risk alterations across different domain scopes (e.g. UX, performance, and accessibility) without a single-specialist ownership model increases the risk of regression or validation failure. Delegating task ownership to a single specialist agent (like Bolt or Palette) ensuring they have full accountability for satisfying all local quality gates keeps commits highly focused, reviewable, and low-risk.

**Action:** Always assign tasks to a single, targeted specialist agent whenever a task sits within a specific domain, and ensure that specialist has complete responsibility for executing and verifying local QA workflows before requesting a merge.
