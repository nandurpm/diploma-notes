"""Regression tests for the deployment secret and header boundary."""
from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CHECKER = ROOT / "tools" / "verify_security_headers.py"
spec = importlib.util.spec_from_file_location("verify_security_headers", CHECKER)
headers = importlib.util.module_from_spec(spec)
spec.loader.exec_module(headers)


class DeploymentSecurityTests(unittest.TestCase):
    def test_configured_cloudflare_headers_are_complete(self):
        source = headers.read_headers_file(ROOT / "_headers")
        self.assertEqual(headers.header_errors(source), [])

    def test_missing_live_headers_are_rejected(self):
        failures = headers.header_errors({
            "Strict-Transport-Security": "max-age=500",
            "Content-Security-Policy": "default-src 'self'"
        })
        self.assertTrue(any("HSTS" in item for item in failures))
        self.assertTrue(any("CSP" in item for item in failures))
        self.assertTrue(any("nosniff" in item for item in failures))

    def test_worker_does_not_expose_secrets_to_install_or_test_steps(self):
        source = (ROOT / ".github/workflows/deploy-ask-poly-ai.yml").read_text(encoding="utf-8")
        scope = source.split("\n    steps:", 1)[0]
        self.assertNotIn("secrets.", scope)
        self.assertLess(source.index("Install Node dependencies"), source.index("Require deployment and verified-storage secrets"))
        self.assertNotIn("secrets.CLOUDFLARE_AI_API_TOKEN || secrets.CLOUDFLARE_API_TOKEN", source)
        self.assertIn('secrets["CLOUDFLARE_AI_API_TOKEN"] = None', source)
        self.assertIn('CLOUDFLARE_AI_API_TOKEN_VALUE" = "$CLOUDFLARE_API_TOKEN_VALUE', source)

    def test_other_deploy_workflows_scope_credentials(self):
        for name in ("deploy-static-site.yml", "deploy-production-diagnostic-push.yml"):
            source = (ROOT / ".github/workflows" / name).read_text(encoding="utf-8")
            self.assertNotIn("secrets.", source.split("\n    steps:", 1)[0], msg=name)
        static = (ROOT / ".github/workflows/deploy-static-site.yml").read_text(encoding="utf-8")
        self.assertIn("--headers-file _site/_headers", static)
        self.assertIn("ENFORCE_PRODUCTION_SECURITY_HEADERS", static)


if __name__ == "__main__":
    unittest.main()
