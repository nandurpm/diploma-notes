(() => {
  "use strict";

  const semesterName = (card) => {
    const details = card.querySelector("p")?.textContent || "";
    return details.match(/Semester\s+\d+/i)?.[0].replace(/semester/i, "Semester") || "Other subjects";
  };

  const semesterNumber = (name) => {
    const match = String(name).match(/(\d+)/);
    return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
  };

  const setupSemesterLayout = () => {
    const grid = document.querySelector('#subjectGrid[data-revision="2021"][data-department]');
    if (!grid || grid.dataset.semesterLayoutReady === "true") return;
    grid.dataset.semesterLayoutReady = "true";
    grid.classList.add("department-semester-layout");

    let organizing = false;
    let queued = false;

    const organize = () => {
      if (organizing) return;
      organizing = true;

      const cards = [...grid.querySelectorAll(":scope > .subject-card, :scope > .department-semester-section .subject-card")];
      if (!cards.length) {
        organizing = false;
        return;
      }

      const groups = new Map();
      cards.forEach((card) => {
        const semester = semesterName(card);
        if (!groups.has(semester)) groups.set(semester, []);
        groups.get(semester).push(card);
      });

      const fragment = document.createDocumentFragment();
      [...groups.entries()]
        .sort(([a], [b]) => semesterNumber(a) - semesterNumber(b))
        .forEach(([semester, semesterCards], index) => {
          const section = document.createElement("section");
          section.className = "department-semester-section";
          section.dataset.semesterGroup = semester;

          const headingId = `semester-heading-${index + 1}`;
          section.setAttribute("aria-labelledby", headingId);

          const heading = document.createElement("div");
          heading.className = "department-semester-heading";

          const title = document.createElement("h3");
          title.id = headingId;
          title.textContent = semester;

          const count = document.createElement("span");
          count.textContent = `${semesterCards.length} ${semesterCards.length === 1 ? "subject" : "subjects"}`;
          heading.append(title, count);

          const cardGrid = document.createElement("div");
          cardGrid.className = "department-semester-grid";
          semesterCards.forEach((card) => cardGrid.append(card));

          section.append(heading, cardGrid);
          fragment.append(section);
        });

      grid.replaceChildren(fragment);
      organizing = false;
    };

    const scheduleOrganize = () => {
      if (organizing || queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        organize();
      });
    };

    const observer = new MutationObserver(scheduleOrganize);
    observer.observe(grid, { childList: true });
    organize();
  };

  document.addEventListener("DOMContentLoaded", setupSemesterLayout);
})();
