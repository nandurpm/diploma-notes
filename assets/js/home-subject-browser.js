(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("subjectGrid");
    if (!grid || grid.dataset.mode !== "homepage-search") return;
    if (typeof SUBJECTS === "undefined" || !Array.isArray(SUBJECTS)) {
      grid.innerHTML = '<p class="empty">Subject data could not be loaded.</p>';
      return;
    }

    const commonDepartment = "First Year / Common";
    const commonValue = "__common__";

    // Replace controls with clean copies so earlier shared listeners cannot
    // overwrite the homepage-specific filtering behavior.
    const replaceControl = (id) => {
      const original = document.getElementById(id);
      if (!original) return null;
      const replacement = original.cloneNode(true);
      original.replaceWith(replacement);
      return replacement;
    };

    const search = replaceControl("subjectSearch");
    const departmentFilter = replaceControl("departmentFilter");
    const semesterFilter = replaceControl("semesterFilter");

    const seen = new Set();
    const subjects = SUBJECTS
      .filter((subject) => String(subject.revision) === "2021")
      .filter((subject) => {
        const key = [subject.revision, subject.department, subject.semester, subject.code].join(":");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    const departments = [...new Set(
      subjects
        .map((subject) => subject.department)
        .filter((department) => department && department !== commonDepartment)
    )].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

    if (departmentFilter) {
      departmentFilter.replaceChildren();
      const commonOption = document.createElement("option");
      commonOption.value = commonValue;
      commonOption.textContent = "Common Subjects";
      departmentFilter.append(commonOption);

      departments.forEach((department) => {
        const option = document.createElement("option");
        option.value = department;
        option.textContent = department;
        departmentFilter.append(option);
      });

      const requestedDepartment = new URLSearchParams(window.location.search).get("department");
      departmentFilter.value = departments.includes(requestedDepartment) ? requestedDepartment : commonValue;
    }

    if (semesterFilter) {
      const semesters = [...new Set(subjects.map((subject) => subject.semester).filter(Boolean))]
        .sort((a, b) => Number(a.match(/\d+/)?.[0] || 999) - Number(b.match(/\d+/)?.[0] || 999));
      semesterFilter.replaceChildren();
      const allOption = document.createElement("option");
      allOption.value = "all";
      allOption.textContent = "All semesters";
      semesterFilter.append(allOption);
      semesters.forEach((semester) => {
        const option = document.createElement("option");
        option.value = semester;
        option.textContent = semester;
        semesterFilter.append(option);
      });
    }

    let status = document.getElementById("subjectResultStatus");
    if (!status) {
      status = document.createElement("p");
      status.id = "subjectResultStatus";
      status.className = "subject-browser-status";
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      grid.before(status);
    }

    const render = () => {
      const query = String(search?.value || "").trim().toLocaleLowerCase();
      const selectedDepartment = departmentFilter?.value || commonValue;
      const selectedSemester = semesterFilter?.value || "all";

      let visible = subjects.filter((subject) => {
        if (selectedSemester !== "all" && subject.semester !== selectedSemester) return false;

        if (selectedDepartment === commonValue) {
          // Default view: common subjects. During a text search, search the full
          // Revision 2021 catalogue so department-specific codes are discoverable.
          if (!query && subject.department !== commonDepartment) return false;
        } else if (subject.department !== commonDepartment && subject.department !== selectedDepartment) {
          return false;
        }

        if (!query) return true;
        const searchable = [
          subject.code,
          subject.name,
          subject.department,
          subject.semester,
          subject.type
        ].join(" ").toLocaleLowerCase();
        return searchable.includes(query);
      });

      visible = visible.sort((a, b) => {
        const semesterA = Number(String(a.semester).match(/\d+/)?.[0] || 999);
        const semesterB = Number(String(b.semester).match(/\d+/)?.[0] || 999);
        if (semesterA !== semesterB) return semesterA - semesterB;

        const commonA = a.department === commonDepartment ? 0 : 1;
        const commonB = b.department === commonDepartment ? 0 : 1;
        if (commonA !== commonB) return commonA - commonB;

        return String(a.code).localeCompare(String(b.code), undefined, {
          numeric: true,
          sensitivity: "base"
        });
      });

      if (!visible.length) {
        grid.innerHTML = '<p class="empty">No subjects match the selected department, semester or search.</p>';
        status.textContent = "No matching Revision 2021 subjects found.";
        return;
      }

      if (typeof renderSemesterGroups === "function") {
        grid.innerHTML = renderSemesterGroups(visible);
      } else if (typeof subjectCard === "function") {
        grid.innerHTML = visible.map((subject) => subjectCard(subject)).join("");
      } else {
        grid.innerHTML = '<p class="empty">Subject cards could not be rendered.</p>';
        return;
      }

      if (typeof setupAssetButtons === "function") setupAssetButtons(grid);

      const scope = selectedDepartment === commonValue
        ? (query ? "Revision 2021 search results" : "common subjects")
        : `${selectedDepartment} and common subjects`;
      status.textContent = `${visible.length} ${visible.length === 1 ? "subject" : "subjects"} shown from ${scope}.`;
    };

    search?.addEventListener("input", render);
    departmentFilter?.addEventListener("change", render);
    semesterFilter?.addEventListener("change", render);
    render();
  });
})();