# Automatic lesson-PDF publication

The workflow `.github/workflows/publish-lesson-pdfs.yml` keeps the main website repository PDF-free while publishing generated PDFs as immutable release assets in `nandurpm/poly-pmna-pdf-files`.

## Trigger behavior

A push to `main` triggers the workflow only when a lesson HTML page changes under either of these paths:

```text
lessons/lessons-*.html
revision-2026-content/lessons/lessons-*.html
```

The workflow also runs when its generator or workflow definition changes. It detects only lesson pages changed by the push and renders those pages. A manual run can set the `all` input to regenerate the complete archive.

Deleted lesson pages are ignored by the renderer. Existing published PDF assets are not silently deleted; this protects old release links and requires an explicit retirement decision.

## Required secret

The main repository needs an Actions secret named `PDF_ARCHIVE_REPO_TOKEN`. The token must be a GitHub fine-grained personal access token with access to the `nandurpm/poly-pmna-pdf-files` repository and **Contents: Read and write** permission. The workflow uses that token only for creating releases, uploading release assets, cloning the PDF repository, and pushing manifest updates.

Add the secret in the main repository’s GitHub settings under **Settings → Secrets and variables → Actions**, or with the GitHub CLI from an authenticated environment:

```bash
gh secret set PDF_ARCHIVE_REPO_TOKEN \
  --repo nandurpm/diploma-notes \
  < token.txt
```

The token value should never be committed to either repository or written into workflow YAML. The default `GITHUB_TOKEN` is intentionally not used for cross-repository writes.

## Publication model

Each workflow run creates a unique immutable release tag such as:

```text
notes-2021-run-31770000000-attempt-1
notes-2026-run-31770000000-attempt-1
```

Only revisions with changed lesson pages receive a release in that run. The generated manifest entries point directly to their new release assets. Existing subjects remain mapped to their previous release assets, so a partial update does not invalidate unrelated links.

The workflow creates a draft release, uploads every generated PDF, verifies the asset count, publishes the release, and only then merges the new entries into the PDF repository manifests. If validation or upload fails, the manifest is not changed and the website’s existing print-to-PDF fallback remains available.

## Manual full regeneration

From the Actions tab, select **Publish changed lesson PDFs**, choose **Run workflow**, and set `all` to `true`. This renders all Revision 2021 and Revision 2026 lesson pages and publishes only the revisions that contain output.

## Local validation

The generator can be tested without publishing:

```bash
printf '%s\n' lessons/lessons-1001.html > /tmp/changed-lesson-files.txt
python3 tools/generate_all_lesson_pdfs.py \
  --source-root . \
  --output-root /tmp/poly-pmna-generated-pdfs \
  --base-url http://127.0.0.1:9876 \
  --workers 1 \
  --source-commit local-test \
  --files-from /tmp/changed-lesson-files.txt \
  --release-suffix local-test
```

The output must report zero failures and every generated file must be identified as `application/pdf`. The generator is designed to use Chromium in GitHub Actions and the existing `?autoPrintNotes=1` lesson rendering path.

## Fallback behavior

The live site reads the per-subject manifests. A subject uses direct PDF delivery only when its exact manifest entry is marked `published`. Missing, unavailable, or unpublished entries continue to use the lesson HTML print flow. This means a failed automation run does not remove the existing way for students to save notes as PDF.
