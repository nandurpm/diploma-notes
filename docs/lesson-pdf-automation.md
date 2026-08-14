# Automatic lesson-PDF publication

The workflow `.github/workflows/publish-lesson-pdfs.yml` keeps the main website repository PDF-free while publishing generated PDFs into the visible canonical tree of `nandurpm/poly-pmna-pdf-files`.

## Canonical archive layout

Every published PDF is stored at one of these paths:

```text
notes/2021/<subject-code>/v1/<subject-code>.pdf
notes/2026/<subject-code>/v1/<subject-code>.pdf
```

The website manifests in `poly-pmna-pdf-files/manifests/` point to the corresponding Raw GitHub URLs. The visible repository files, rather than GitHub Release assets, are the single source of truth for direct PDF delivery.

## Trigger behavior

A push to `main` triggers the workflow only when a lesson HTML page changes under either of these paths:

```text
lessons/lessons-*.html
revision-2026-content/lessons/lessons-*.html
```

The workflow also runs when its generator, manifest merger, or workflow definition changes. It detects lesson pages changed by the push and renders only those pages. A manual run can set the `all` input to `true` to regenerate the complete archive.

Deleted lesson pages are currently ignored by the renderer. Existing canonical PDFs are not silently deleted; this protects already-published study material and requires an explicit retirement decision.

## Required secret

The main repository needs an Actions secret named `PDF_ARCHIVE_REPO_TOKEN`. The token must be a GitHub fine-grained personal access token with access to `nandurpm/poly-pmna-pdf-files` and **Contents: Read and write** permission. The workflow uses that token to clone the PDF repository, copy generated files into the canonical paths, and push the updated manifests and PDFs.

Add the secret in the main repository’s GitHub settings under **Settings → Secrets and variables → Actions**, or with the GitHub CLI from an authenticated environment:

```bash
gh secret set PDF_ARCHIVE_REPO_TOKEN \
  --repo nandurpm/diploma-notes \
  < token.txt
```

The token value must never be committed to either repository or written into workflow YAML. The default `GITHUB_TOKEN` is intentionally not used for cross-repository writes.

## Publication model

For each changed lesson, Chromium renders the existing lesson HTML print view. The workflow validates that the output is a readable PDF, copies it to `notes/<revision>/<code>/v1/<code>.pdf`, updates the corresponding manifest entry, verifies the canonical path and Raw URL, and commits the result to `poly-pmna-pdf-files`.

A partial update replaces only the changed subject entries. Unchanged subjects remain in the manifest and continue to point at their existing canonical paths. The PDF archive repository therefore contains one stable visible path per subject and version. If validation or publication fails, the website’s existing print-to-PDF fallback remains available.

## Manual full regeneration

From the Actions tab, select **Publish changed lesson PDFs**, choose **Run workflow**, and set `all` to `true`. This renders all Revision 2021 and Revision 2026 lesson pages and publishes the resulting files under their canonical paths.

## Local validation

Start a local HTTP server from the main repository root, then test one lesson without publishing:

```bash
python3 -m http.server 9876
printf '%s\n' lessons/lessons-1001.html > /tmp/changed-lesson-files.txt
python3 tools/generate_all_lesson_pdfs.py \
  --source-root . \
  --output-root /tmp/poly-pmna-generated-pdfs \
  --base-url http://127.0.0.1:9876 \
  --pdf-base-url https://raw.githubusercontent.com/nandurpm/poly-pmna-pdf-files/main \
  --pdf-version v1 \
  --workers 1 \
  --source-commit local-test \
  --files-from /tmp/changed-lesson-files.txt
```

The output must report zero failures, every generated file must be identified as `application/pdf`, and the manifest URL must follow the form:

```text
https://raw.githubusercontent.com/nandurpm/poly-pmna-pdf-files/main/notes/2021/1001/v1/1001.pdf
```

## Fallback behavior

The live site reads the per-subject manifests from Raw GitHub. A subject uses direct PDF delivery only when its exact manifest entry is marked `published` and its `pdfUrl` is an allowed absolute URL. Missing, unavailable, or unpublished entries continue to use the lesson HTML print flow. This means a failed automation run does not remove the existing way for students to save notes as PDF.
