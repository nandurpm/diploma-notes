# POLY PMNA Technical QA & Audit Report

> Historical audit snapshot from July 26, 2026. It is retained for traceability; current behavior should be verified with present CI and production checks.

**Date:** July 26, 2026  
**Repository:** [nandurpm/diploma-notes](https://github.com/nandurpm/diploma-notes)  
**Auditor:** Manus AI

This document presents findings from a technical audit, functional QA pass, and Revision 2026 syllabus verification performed at that time.

## 1. Executive Summary

The audit reported that POLY PMNA was functional and that the Revision 2026 catalogue matched the official syllabus data available during the review. It identified minor visual, legacy-file, and dependency concerns and recorded the resolutions below.

## 2. Official REV2026 Syllabus Verification

### 2.1 Programme Coverage

- **Total official programmes:** 38
- **Programmes in POLY PMNA:** 38
- **Missing programmes:** 0
- **Result at audit time:** 100% coverage

### 2.2 Data Accuracy

- A minor whitespace discrepancy was found for “Instrumentation Engineering” in the source SITTTR markup.
- Programme codes were reported as mapped to their department pages and SITTTR syllabus pages.
- Sample subject-code checks matched the catalogue used at audit time.

## 3. Functional QA & Live Testing

### 3.1 Homepage & Navigation

The audit reported that the homepage, primary navigation, footer links, and subject browser were functional.

### 3.2 Department Pages (Revision 2026)

Department pages were reported to render their subject cards correctly, with missing lesson/note assets represented as unavailable rather than broken links.

### 3.3 Ask POLY AI Assistant

Ask POLY was reported operational during the audit and returned the expected answer to a sample subject-code query.

### 3.4 Mock Exams & Daily Quiz

The mock-exam portal was reported to handle guest access, question-bank loading, and dashboard rendering.

## 4. Repository Structure & Dependency Audit

### 4.1 JavaScript Dependencies

The audit found JavaScript files not directly referenced by root `<script>` tags; many were dynamically loaded or retained for legacy compatibility.

### 4.2 Orphan HTML Files

The audit identified these standalone/legacy routes:

1. `first-year-materials.html`
2. `new-year-theme-preview.html`
3. `tools-v2-original.html`
4. `tools-v2.html`

They were intentionally retained at the time for backward compatibility or standalone use.

### 4.3 Accessibility

The audit reported `alt` coverage on root-page images and safe `target="_blank"` handling for checked external links.

## 5. Issue Table

| Issue ID | Category | Description | Severity | Resolution at audit time |
|---|---|---|---|---|
| ISS-001 | Visual | Duplicate homepage helper heading | High | Fixed by removing the duplicate pseudo-element |
| ISS-002 | Data | Instrumentation Engineering whitespace mismatch | Low | Confirmed as source-markup normalization |
| ISS-003 | Code quality | Apparently orphaned JavaScript files | Info | Verified as dynamic/legacy in the reviewed sample |
| ISS-004 | File management | Standalone root HTML routes | Info | Retained for compatibility |

## 6. Historical Note

This report is evidence of a past state, not a current health declaration. Use current automated checks and production smoke tests for present status.
