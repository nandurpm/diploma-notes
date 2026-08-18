/* Purpose: Revision config - Descriptive comment added for clarity */
// Central curriculum revision registry for POLY PMNA.
const CURRICULUM_REVISIONS = Object.freeze({
  "2021": Object.freeze({
    id: "2021",
    tag: "REV2021",
    label: "Revision 2021",
    status: "published",
    syllabusAvailable: true,
    subjectDataPublished: true,
    modelQuestionPapersAvailable: true,
    officialModelQuestionPapersUrl: "https://github.com/nandurpm/poly-pmna-pdf-files/tree/main/sitttr/revision-2021/model-question-papers",
    programmeCount: 43,
    protectExistingHandbooks: true,
    notice: "Revision 2021 subjects include direct syllabus and model-question-paper PDF downloads from the POLY PMNA archive."
  }),
  "2026": Object.freeze({
    id: "2026",
    tag: "REV2026",
    label: "Revision 2026",
    status: "published",
    syllabusAvailable: true,
    subjectDataPublished: true,
    modelQuestionPapersAvailable: true,
    programmeCount: 42,
    officialSyllabusUrl: "https://github.com/nandurpm/poly-pmna-pdf-files/tree/main/sitttr/revision-2026/syllabus",
    newlyListedProgrammes: Object.freeze([
      "Computer Science and Technology",
      "Interior Design"
    ]),
    programmesNotListedComparedWith2021: Object.freeze([
      "Civil (Public Health and Environment) Engineering",
      "Cloud Computing and Big Data",
      "Communication & Computer Networking",
      "Computer Hardware Engineering",
      "Hotel Management and Catering Technology",
      "Manufacturing Technology",
      "Renewable Energy"
    ]),
    notice: "The Revision 2026 programme list and semester-wise subjects are published with direct PDF archive links where files are available."
  })
});

globalThis.CURRICULUM_REVISIONS = CURRICULUM_REVISIONS;
