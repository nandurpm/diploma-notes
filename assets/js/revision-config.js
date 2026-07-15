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
    programmeCount: 43,
    protectExistingHandbooks: true,
    notice: "Revision 2021 subjects, handbooks, notes and model-question-paper links remain available for legacy batches."
  }),
  "2026": Object.freeze({
    id: "2026",
    tag: "REV2026",
    label: "Revision 2026",
    status: "published",
    syllabusAvailable: true,
    subjectDataPublished: true,
    modelQuestionPapersAvailable: false,
    programmeCount: 38,
    officialSyllabusUrl: "https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus&scheme=REV2026",
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
    notice: "The official Revision 2026 programme list and semester-wise subject records are published for 38 programmes. Dedicated Revision 2026 handbooks, downloadable notes and official model question papers are added separately when available."
  })
});

globalThis.CURRICULUM_REVISIONS = CURRICULUM_REVISIONS;
