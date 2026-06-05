function subjectCard(subject) {
  const lessonsUrl = `lessons.html?subject=${encodeURIComponent(subject.code)}#lessons`;
  return `
    <article class="subject-card reveal" data-department="${subject.department}" data-semester="${subject.semester}" data-search="${[subject.code, subject.name, subject.department, subject.semester, subject.type].join(' ').toLowerCase()}">
      <div class="subject-top"><span>${subject.code}</span><small>${subject.semester}</small></div>
      <h3>${subject.name}</h3>
      <p>${subject.department} / ${subject.type}</p>
      <div class="action-row">
        <a class="action syllabus" href="${syllabusLink(subject.code)}" target="_blank" rel="noopener">Open Syllabus</a>
        <a class="action lessons" href="${lessonsUrl}">View Lessons</a>
        <a class="action qp" href="${modelQuestionPaperLink(subject.code)}" target="_blank" rel="noopener">Sample Question Paper</a>
      </div>
    </article>`;
}

function populateFilters(subjects) {
  const departments = [...new Set(subjects.map((subject) => subject.department))].sort();
  const semesters = [...new Set(subjects.map((subject) => subject.semester))].sort();
  const departmentFilter = document.querySelector('#departmentFilter');
  const semesterFilter = document.querySelector('#semesterFilter');
  if (departmentFilter && departmentFilter.options.length === 1) departments.forEach((department) => departmentFilter.insertAdjacentHTML('beforeend', `<option value="${department}">${department}</option>`));
  if (semesterFilter && semesterFilter.options.length === 1) semesters.forEach((semester) => semesterFilter.insertAdjacentHTML('beforeend', `<option value="${semester}">${semester}</option>`));
}

function renderSubjects() {
  const grid = document.querySelector('#subjectGrid');
  if (!grid) return;
  const params = new URLSearchParams(window.location.search);
  populateFilters(SUBJECTS);
  const search = document.querySelector('#subjectSearch');
  const departmentFilter = document.querySelector('#departmentFilter');
  const semesterFilter = document.querySelector('#semesterFilter');
  if (params.get('department') && departmentFilter) departmentFilter.value = params.get('department');
  if (params.get('subject') && search) search.value = params.get('subject');

  const apply = () => {
    const query = (search?.value || '').trim().toLowerCase();
    const department = departmentFilter?.value || 'all';
    const semester = semesterFilter?.value || 'all';
    const visible = SUBJECTS.filter((subject) => {
      const text = [subject.code, subject.name, subject.department, subject.semester, subject.type].join(' ').toLowerCase();
      return (!query || text.includes(query)) && (department === 'all' || subject.department === department) && (semester === 'all' || subject.semester === semester);
    });
    grid.innerHTML = visible.length ? visible.map(subjectCard).join('') : '<p class="empty">No subjects match this filter.</p>';
  };
  search?.addEventListener('input', apply);
  departmentFilter?.addEventListener('change', apply);
  semesterFilter?.addEventListener('change', apply);
  apply();
}

function setupNav() {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.navlinks');
  toggle?.addEventListener('click', () => nav?.classList.toggle('open'));
}

document.addEventListener('DOMContentLoaded', () => {
  setupNav();
  renderSubjects();
});
