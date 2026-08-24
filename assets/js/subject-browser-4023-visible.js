/* Purpose: Subject browser 4023 visible - Descriptive comment added for clarity */
(() => {
  "use strict";
  const href = "../lessons/lessons-4023.html";
  const cardHtml = `<article class="subject-card" data-subject-code="4023"><div class="subject-top"><span>2021</span><strong>4023</strong></div><h3>Automobile Engineering</h3><p>Mechanical Engineering / Semester 4 / Program Core</p><div class="action-row"><a class="action syllabus" href="https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus&scheme=REV2021" target="_blank" rel="noopener noreferrer">Open Syllabus</a><a class="action lessons" href="${href}">View Lessons</a><a class="action download" href="${href}?autoPrintNotes=1" target="_blank" rel="noopener noreferrer">Download Notes</a><a class="action qp" href="https://www.sitttrkerala.ac.in/index.php?r=site%2Fdiploma-modelqp-courses-show&course=4023" target="_blank" rel="noopener noreferrer">Sample QP</a></div></article>`;
  function insert4023() {
    if (!/mechanical-engineering\.html$/i.test(location.pathname)) return;
    const grids = [...document.querySelectorAll(".subject-grid")];
    grids.forEach((grid) => {
      if (grid.querySelector('[data-subject-code="4023"]')) return;
      const wrapper = document.createElement("template");
      wrapper.innerHTML = cardHtml.trim();
      grid.prepend(wrapper.content.firstElementChild);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", insert4023, { once: true }); else insert4023();
  setTimeout(insert4023, 700);
  setTimeout(insert4023, 1800);
})();
