(() => {
  "use strict";

  const isDefaultState = (search, revision, department, semester) => (
    !String(search?.value || "").trim()
    && (revision?.value || "all") === "all"
    && (department?.value || "all") === "all"
    && (semester?.value || "all") === "all"
  );

  const uniqueCommonSubjects = () => {
    if (!Array.isArray(globalThis.SUBJECTS)) return [];
    const seen = new Set();
    return globalThis.SUBJECTS
      .filter((subject) => String(subject.revision) === "2021" && subject.department === "First Year / Common")
      .filter((subject) => {
        const key = [subject.revision, subject.department, subject.semester, subject.code].join(":");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => String(a.code).localeCompare(String(b.code), undefined, { numeric: true, sensitivity: "base" }));
  };

  const applyCommonDefault = () => {
    const grid = document.getElementById("subjectGrid");
    if (!grid || grid.dataset.mode !== "homepage-search") return;

    const search = document.getElementById("subjectSearch");
    const revision = document.getElementById("revisionFilter");
    const department = document.getElementById("departmentFilter");
    const semester = document.getElementById("semesterFilter");
    if (!isDefaultState(search, revision, department, semester)) return;

    const commonSubjects = uniqueCommonSubjects();
    if (!commonSubjects.length || typeof globalThis.subjectCard !== "function") return;

    grid.innerHTML = commonSubjects.map((subject) => globalThis.subjectCard(subject)).join("");
    if (typeof globalThis.setupAssetButtons === "function") globalThis.setupAssetButtons(grid);

    const status = document.getElementById("subjectResultStatus");
    if (status) status.textContent = "Common subjects available in every department.";
  };

  document.addEventListener("DOMContentLoaded", () => {
    const controls = [
      document.getElementById("subjectSearch"),
      document.getElementById("revisionFilter"),
      document.getElementById("departmentFilter"),
      document.getElementById("semesterFilter")
    ];

    controls.forEach((control) => {
      control?.addEventListener("input", applyCommonDefault);
      control?.addEventListener("change", applyCommonDefault);
    });

    applyCommonDefault();
  });
})();
