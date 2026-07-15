// Central curriculum revision registry for POLY PMNA.
// Do not mark a revision as published until subject codes and official PDFs are verified.
const CURRICULUM_REVISIONS = Object.freeze({
  "2021": Object.freeze({
    id: "2021",
    label: "Revision 2021",
    status: "published",
    syllabusAvailable: true,
    modelQuestionPapersAvailable: true
  }),
  "2026": Object.freeze({
    id: "2026",
    label: "Revision 2026",
    status: "awaiting-verified-subject-data",
    syllabusAvailable: false,
    modelQuestionPapersAvailable: false,
    notice: "Revision 2026 has been announced, but subject-level data is not published here until official codes and PDFs are verified."
  })
});

globalThis.CURRICULUM_REVISIONS = CURRICULUM_REVISIONS;
