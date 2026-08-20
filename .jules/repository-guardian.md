# Repository Guardian Journal

## 2026-08-20 - Unreferenced Debug Helper Scripts in Tools
**Finding:** Found `tools/debug_eq4.py`, an unreferenced temporary debug script containing hardcoded machine paths (`/home/ubuntu/...`) left over from local node testing.
**Learning:** Transient debug and diagnostic scripts can accumulate in utility folders over time if not scrubbed after issue resolution.
**Prevention:** Periodically scan `tools/` and root directories for unreferenced scripts with zero citations across workflows, code, or documentation.
