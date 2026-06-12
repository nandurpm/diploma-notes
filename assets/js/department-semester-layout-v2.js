(() => {
  "use strict";

  function getSemester(card) {
    const text = card.querySelector("p")?.textContent || "";
    const match = text.match(/Semester\s+\d+/i);
    return match ? match[0].replace(/semester/i, "Semester") : "Other subjects";
  }

  function getSemesterNumber(name) {
    const match = String(name).match(/(\d+)/);
    return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
  }

  function initialiseSemesterLayout() {
    const grid = document.querySelector('#subjectGrid[data-revision="2021"][data-department]');
    if (!grid || grid.dataset.semesterLayoutVersion === "2") return;

    grid.dataset.semesterLayoutVersion = "2";
    grid.classList.add("department-semester-layout");

    let observer = null;
    let scheduled = false;
    let rendering = false;

    function startObserving() {
      if (observer) observer.observe(grid, { childList: true });
    }

    function renderGroups() {
      if (rendering) return;
      rendering = true;
      if (observer) observer.disconnect();

      const cards = Array.from(grid.querySelectorAll(":scope > .subject-card, :scope > .department-semester-section .subject-card"));
      if (!cards.length) {
        rendering = false;
        startObserving();
        return;
      }

      const groups = new Map();
      cards.forEach((card) => {
        const semester = getSemester(card);
        if (!groups.has(semester)) groups.set(semester, []);
        groups.get(semester).push(card);
      });

      const fragment = document.createDocumentFragment();
      Array.from(groups.entries())
        .sort(([first], [second]) => getSemesterNumber(first) - getSemesterNumber(second))
        .forEach(([semester, semesterCards], index) => {
          const section = document.createElement("section");
          section.className = "department-semester-section";
          section.dataset.semesterGroup = semester;

          const heading = document.createElement("div");
          heading.className = "department-semester-heading";

          const title = document.createElement("h3");
          title.id = `semester-heading-${index + 1}`;
          title.textContent = semester;
          section.setAttribute("aria-labelledby", title.id);

          const count = document.createElement("span");
          count.textContent = `${semesterCards.length} ${semesterCards.length === 1 ? "subject" : "subjects"}`;
          heading.append(title, count);

          const cardsGrid = document.createElement("div");
          cardsGrid.className = "department-semester-grid";
          semesterCards.forEach((card) => cardsGrid.append(card));

          section.append(heading, cardsGrid);
          fragment.append(section);
        });

      grid.replaceChildren(fragment);
      rendering = false;
      startObserving();
    }

    function scheduleRender() {
      if (rendering || scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        renderGroups();
      });
    }

    observer = new MutationObserver(scheduleRender);
    renderGroups();
  }

  document.addEventListener("DOMContentLoaded", initialiseSemesterLayout);
})();
