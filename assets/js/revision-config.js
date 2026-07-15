// Central curriculum revision registry for POLY PMNA.
// Do not mark subject-level data as published until exact codes and official PDFs are verified.
const CURRICULUM_REVISIONS = Object.freeze({
  "2021": Object.freeze({
    id: "2021",
    tag: "REV2021",
    label: "Revision 2021",
    status: "published",
    syllabusAvailable: true,
    modelQuestionPapersAvailable: true,
    programmeCount: 43,
    protectExistingHandbooks: true
  }),
  "2026": Object.freeze({
    id: "2026",
    tag: "REV2026",
    label: "Revision 2026",
    status: "programme-list-verified-subjects-pending",
    syllabusAvailable: true,
    subjectDataPublished: false,
    modelQuestionPapersAvailable: false,
    programmeCount: 38,
    officialSyllabusUrl: "https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus&scheme=REV2026",
    newlyListedProgrammes: Object.freeze([
      "Computer Science and Technology",
      "Interior Design"
    ]),
    uncertainOrMissingComparedWith2021: Object.freeze([
      "Hotel Management and Catering Technology",
      "Cloud Computing and Big Data",
      "Communication & Computer Networking",
      "Computer Hardware Engineering",
      "Renewable Energy",
      "Selected civil specialisations not present in the current REV2026 list"
    ]),
    notice: "The official REV2026 page currently lists 38 programmes. Subject-level publication remains blocked until each code and official PDF is individually verified. Missing REV2021 programmes are retained as uncertain and are not deleted."
  })
});

globalThis.CURRICULUM_REVISIONS = CURRICULUM_REVISIONS;
