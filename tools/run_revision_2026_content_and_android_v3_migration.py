#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "tools" / "apply_revision_2026_content_and_android_v3.py"

spec = importlib.util.spec_from_file_location("rev2026_android_v3_migration", SCRIPT)
if spec is None or spec.loader is None:
    raise RuntimeError(f"Could not load {SCRIPT}")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

original_replace = module.replace


def migration_replace(path: str, old: str, new: str, *, required: bool = True) -> None:
    # The broad APK filename replacement also updates apkUrl. The later explicit
    # apkUrl replacement is therefore intentionally optional during this one-time run.
    if old == '"apkUrl": "/downloads/POLY_PMNA_v2.01.apk"':
        required = False
    original_replace(path, old, new, required=required)


module.replace = migration_replace
module.main()
