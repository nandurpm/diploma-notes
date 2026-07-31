# Documentation

Internal documentation, audit reports, and developer notes for the POLY PMNA project.

## Contents

This directory contains key architecture documentation, project standards, and master prompt templates used to build and maintain the POLY PMNA digital learning platform.

| File | Description |
|------|-------------|
| [`README.md`](README.md) | Index and overview of all developer and architecture documentation in this folder. |
| [`1004-model-structure-note.md`](1004-model-structure-note.md) | Structural details and question/marks breakdown of the Course Code 1004 Mock Examination (Engineering Mechanics). |
| [`AUDIT-FINDINGS.md`](AUDIT-FINDINGS.md) | Comprehensive audit of the repository structure, dependencies, and architectural patterns. |
| [`AUDIT-REPORT.md`](AUDIT-REPORT.md) | Detailed audit report of front-end site components, department pages, and lesson pages. |
| [`lesson-page-standard.md`](lesson-page-standard.md) | Mandatory presentation standards and guidelines for all lesson HTML files in Revision 2021 and Revision 2026. |
| [`new-lesson-push-notifications.md`](new-lesson-push-notifications.md) | Configuration and operation guide for automatic new-lesson push notifications in the Android app using Firebase Cloud Messaging (FCM). |
| [`poly-pmna-lesson-html-master-prompt.md`](poly-pmna-lesson-html-master-prompt.md) | Master prompt template for generating scheme-aware, high-quality, standalone HTML student handbooks from official SITTTR syllabus PDFs. |
| [`RELEASE-CHECKLIST.md`](RELEASE-CHECKLIST.md) | Official release checklist and deployment guide detailing pre-release quality gates, local builds, deployment procedures, live verifications, and rollback steps. |
| [`revision-aware-handbook-rules.md`](revision-aware-handbook-rules.md) | Explicit formatting and content rules for building handbooks that respect curriculum differences between Revision 2021 and Revision 2026. |
| [`syllabus-structure-5032.md`](syllabus-structure-5032.md) | Example layout and structured model representing curriculum modules and outcomes for course code 5032. |
| [`syllabus-structure-master-prompt.md`](syllabus-structure-master-prompt.md) | Legacy master prompt utilized for generating SITTTR Revision 2021 lesson syllabus structure data files. |
| [`website-audit-and-remediation-prompt.md`](website-audit-and-remediation-prompt.md) | Remediation guidelines and automated validation prompt to check metadata, canonical correctness, and local asset references. |

## Purpose

This directory serves as the home for:

- Architecture documentation and decision records
- Audit reports generated during code reviews
- Developer onboarding notes
- Feature specifications and design documents

## Relationship to Project

These documents are maintained alongside the codebase for reference. They are not deployed to the live site and are intended for developers and contributors.
