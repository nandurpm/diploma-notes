#!/usr/bin/env python3
"""Verify that both production deployment paths apply the shared build-ID cache contract."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKFLOWS = (
    ROOT / ".github/workflows/deploy-github-pages.yml",
    ROOT / ".github/workflows/deploy-static-site.yml",
)
HELPER = ROOT / "tools/write_build_info.py"
INJECTOR = ROOT / "tools/inject_build_id.py"


def fail(message: str) -> None:
    raise SystemExit(f"Deployment cache contract failed: {message}")


def main() -> int:
    helper = HELPER.read_text(encoding="utf-8")
    injector = INJECTOR.read_text(encoding="utf-8")
    if "tools/inject_build_id.py" not in helper or "CI" not in helper:
        fail("write_build_info.py no longer invokes inject_build_id.py in CI")
    if "/assets/" not in injector or "v={build_id}" not in injector:
        fail("inject_build_id.py no longer versions local asset URLs")
    for workflow in WORKFLOWS:
        text = workflow.read_text(encoding="utf-8")
        write_step = text.find("python tools/write_build_info.py")
        build_step = text.find("python tools/build_public_site.py")
        if write_step < 0:
            fail(f"{workflow.relative_to(ROOT)} does not write build-info before deployment")
        if build_step >= 0 and write_step > build_step:
            fail(f"{workflow.relative_to(ROOT)} builds the artifact before cache injection")
    print("Deployment cache contract passed for GitHub Pages and Cloudflare Pages workflows.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
