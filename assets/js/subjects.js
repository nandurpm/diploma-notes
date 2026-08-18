    { label: "First Year", url: "https://drive.google.com/open?id=1qHCYDCt2yg2VToC5RbU78ZGD_TN3EtUZ" },
    { label: "Electronics Engineering", url: "https://drive.google.com/drive/folders/1F-RZg7Msl1fNQ43EftNpFj2Iy7K3liPw?usp=sharing" },
    { label: "Electronics & Communication Engineering", url: "https://drive.google.com/open?id=1MOT4kkGx3l6aqdobqkoKHqD1d2Ki6gHx" },
    { label: "Computer Engineering", url: "https://drive.google.com/open?id=1PT81T6_VLZaC-NTUe0Z5jsXBOVBhyp_l" },
    { label: "Mechanical Engineering", url: "https://drive.google.com/open?id=1ke48IQLpf9D55_tXI-9Dxuqg0uJVvfeu" },
    { label: "Electrical Engineering", url: "https://drive.google.com/open?id=1XBm0x7wCvPWpIBn0tw9fDriqXvVeMQFE" },
    { label: "Civil Engineering", url: "https://drive.google.com/open?id=1gMZvh6x-lNtYhFvUIfFgOz-kZt81q5Dv" }
  ],
  alternativeQuestionPapers: [],
  alternativeOtherMaterials: [
    { label: "Workshop Materials", url: "https://drive.google.com/drive/folders/18K8CJwFQU-iHH6z8Wc0hiPEba39sKRNl" }
  ]
};


function modelQuestionPaperLink(subjectCode, revision, department, subjectName) {
  const rev = String(revision || "2021").includes("2015") ? "2015" : (String(revision || "").includes("2026") ? "2026" : "2021");
  const deptSlug = String(department || "architecture")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const nameSlug = String(subjectName || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const code = String(subjectCode || "").trim();
  const fileSlug = nameSlug ? `${code}-${nameSlug}.pdf` : `${code}.pdf`;
  return `https://raw.githubusercontent.com/nandurpm/poly-pmna-pdf-files/main/sitttr/revision-${rev}/model-question-papers/${deptSlug}/semester-unspecified/${fileSlug}`;
}
globalThis.modelQuestionPaperLink = modelQuestionPaperLink;

// Compute root prefix from actual path depth; works from any page.
function lessonLink(subject) {
  const depth = window.location.pathname.replace(/\/[^/]*$/, "").split("/").filter(Boolean).length;
  const prefix = depth > 0 ? "../".repeat(depth) : "";
  if (subject.lessonFile) return prefix + subject.lessonFile;
  return `${prefix}lessons/lessons-${encodeURIComponent(subject.code)}.html`;
}

function notesLink(subject) {
  const lesson = lessonLink(subject);
  return `${lesson}?autoPrintNotes=1`;
}

// Explicit exports for shared scripts and resilient component initialization.
globalThis.SUBJECTS = SUBJECTS;
globalThis.MATERIALS_2015 = MATERIALS_2015;
