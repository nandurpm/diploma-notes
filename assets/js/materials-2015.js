/* Purpose: Materials 2015 - Descriptive comment added for clarity */
(() => {
  "use strict";

  const MODEL_QP_BASE = "https://sitttrkerala.ac.in/index.php?r=site%2Fdiploma-modelqp-courses&prog=";
  const SYLLABUS_INDEX = "https://sitttrkerala.ac.in/index.php?r=site%2Fdiploma-syllabus&scheme=REV2015";
  const MODEL_QP_INDEX = "https://sitttrkerala.ac.in/index.php?r=site%2Fdiploma-modelqp&scheme=REV2015";
  const SUBJECT_DATA_URL = "/assets/data/revision-2015-subjects.json?v=20260720-rev2015-subjects1";

  const MATERIALS_2015 = {
    firstYear: [
      { label: "Text Books", url: "https://drive.google.com/folderview?id=1VEew2WIrFxMTDlnW0dBN4Xqgf1RbL-3K" },
      { label: "Basics", url: "https://drive.google.com/folderview?id=1Dr4oLoVyrYIIlMDkNdJ-UJwTTNL9c3_l" },
      { label: "Chemistry", url: "https://drive.google.com/folderview?id=1DQHjhtlOrATnUC4-JDC5Yhf-56tiW7aW" },
      { label: "Physics", url: "https://drive.google.com/folderview?id=1DR2FFJANWHFtDYQxo9hDhv8bZtNOTLY4" },
      { label: "Mathematics", url: "https://drive.google.com/folderview?id=1DVBNFb8aC5eQMXvY2XDOdNEt3h1cO2rB" },
      { label: "Engineering Graphics", url: "https://drive.google.com/folderview?id=1TXGnpAtXZ6q6d_mKiKUaECVPvYZVTlHA" },
      { label: "English", url: "https://drive.google.com/folderview?id=1Dp0etmpdHf3ZmiNXJII13I_o5RQvQWdH" }
    ],

    departments: [
      { label: "Computer Engineering", url: "https://drive.google.com/folderview?id=1y2R20N2GZsKnUEf5z0hHHyHHjrkCflRO" },
      { label: "Automobile Engineering", url: "https://drive.google.com/open?id=1xxhQxogYOZbK_P2N7Vq1fHpqNtT0Qlvt" },
      { label: "Electronics Engineering", url: "https://drive.google.com/drive/folders/1F-RZg7Msl1fNQ43EftNpFj2Iy7K3liPw?usp=sharing" },
      { label: "Electronics & Communication Engineering", url: "https://drive.google.com/open?id=1MOT4kkGx3l6aqdobqkoKHqD1d2Ki6gHx" },
      { label: "Mechanical Engineering", url: "https://drive.google.com/open?id=1ke48IQLpf9D55_tXI-9Dxuqg0uJVvfeu" },
      { label: "Electrical Engineering", url: "https://drive.google.com/open?id=1XBm0x7wCvPWpIBn0tw9fDriqXvVeMQFE" },
      { label: "Civil Engineering", url: "https://drive.google.com/open?id=1gMZvh6x-lNtYhFvUIfFgOz-kZt81q5Dv" }
    ],

    studyMaterials: [
      { label: "Workshop Material", url: "https://drive.google.com/drive/u/0/mobile/folders/1-2gRIIqomlp6-OLYjTeJKaoVAZBzV8Lb" },
      { label: "Lab Manual — CE / EE / EL / ME", url: "https://drive.google.com/folderview?id=18Jp0qjhH-Oe_vKrMCbkeMPcwjEWwSqYH" },
      { label: "Workshop Materials Archive", url: "https://drive.google.com/drive/folders/18K8CJwFQU-iHH6z8Wc0hiPEba39sKRNl" }
    ],

    questionPapers: [
      { label: "Official REV2015 Model Question Paper Index", url: MODEL_QP_INDEX },
      { label: "Official REV2015 Syllabus Index", url: SYLLABUS_INDEX }
    ],

    alternativeNotes: [
      { label: "First Year", url: "https://drive.google.com/open?id=1qHCYDCt2yg2VToC5RbU78ZGD_TN3EtUZ" },
      { label: "Electronics Engineering", url: "https://drive.google.com/drive/folders/1F-RZg7Msl1fNQ43EftNpFj2Iy7K3liPw?usp=sharing" },
      { label: "Electronics & Communication Engineering", url: "https://drive.google.com/open?id=1MOT4kkGx3l6aqdobqkoKHqD1d2Ki6gHx" },
      { label: "Computer Engineering", url: "https://drive.google.com/open?id=1PT81T6_VLZaC-NTUe0Z5jsXBOVBhyp_l" },
      { label: "Mechanical Engineering", url: "https://drive.google.com/open?id=1ke48IQLpf9D55_tXI-9Dxuqg0uJVvfeu" },
      { label: "Electrical Engineering", url: "https://drive.google.com/open?id=1XBm0x7wCvPWpIBn0tw9fDriqXvVeMQFE" },
      { label: "Civil Engineering", url: "https://drive.google.com/open?id=1gMZvh6x-lNtYhFvUIfFgOz-kZt81q5Dv" }
    ],

    alternativeQuestionPapers: [
      { label: "First Year", url: "https://drive.google.com/open?id=1vHbZ0D-QOHVMEIbcj5FLSHbD_UOWB0LQ" },
      { label: "Electronics Engineering", url: "https://drive.google.com/folderview?id=1eGnaNHw1zUiuTD0NWQWIGYGZSSFj4q5K" },
      { label: "Electronics and Communication", url: "https://drive.google.com/open?id=1lTvKNz_fSD6k6iRFWydBYbm0rUdYjld1" },
      { label: "Computer Engineering", url: "https://drive.google.com/open?id=1ph0GpEP-fmszjVYshwCMDHmK9TcNf8nj" },
      { label: "Civil Engineering", url: "https://drive.google.com/drive/folders/1GHM5P0MwL2O6OjqJtsDB02_0NM9tW2CR" },
      { label: "Automobile Engineering", url: "https://drive.google.com/open?id=1x2FgAElD2KelFsKQQBoBCTEeeAmuc-_k" },
      { label: "Mechanical Engineering", url: "https://drive.google.com/open?id=13R5B2b6HvgKTUh5JczLDPa8Srb1Gjq2K" },
      { label: "Instrumentation Engineering", url: "https://drive.google.com/open?id=1UydN-OkfJK8OnofYPgK3i1fcG2NOYzQC" },
      { label: "Computer Hardware Engineering", url: "https://drive.google.com/open?id=12KwaP_QaN1Z86mEWC2ekfiDMBVDQ_DbC" },
      { label: "Electrical Engineering", url: "https://drive.google.com/open?id=1qohQ9WZN3ZNbkuVGnsSIGiB28ROpKqLJ" }
    ],

    alternativeOtherMaterials: [
      { label: "Workshop Materials", url: "https://drive.google.com/drive/folders/18K8CJwFQU-iHH6z8Wc0hiPEba39sKRNl" },
      { label: "Lab Manual — CE / EE / EL / ME", url: "https://drive.google.com/folderview?id=18Jp0qjhH-Oe_vKrMCbkeMPcwjEWwSqYH" }
    ]
  };

  globalThis.MATERIALS_2015 = MATERIALS_2015;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function safeExternalUrl(value) {
    try {
      const url = new URL(String(value || ""), location.href);
      return url.protocol === "https:" ? url.href : "";
    } catch (_) {
      return "";
    }
  }

  function safeSitttrUrl(value) {
    const href = safeExternalUrl(value);
    if (!href) return "";
    try {
      const host = new URL(href).hostname.replace(/^www\./, "");
      return host === "sitttrkerala.ac.in" ? href : "";
    } catch (_) {
      return "";
    }
  }

  function renderGroup(container) {
    const groupName = container.dataset.linkGroup || "";
    const items = Array.isArray(MATERIALS_2015[groupName]) ? MATERIALS_2015[groupName] : [];
    const valid = items
      .map(item => ({ label: String(item?.label || "").trim(), url: safeExternalUrl(item?.url) }))
      .filter(item => item.label && item.url);

    if (!valid.length) {
      container.innerHTML = '<p class="material-link-empty">No verified links are currently listed in this section.</p>';
      return;
    }

    container.innerHTML = valid.map(item => (
      `<a class="material-resource-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">` +
        `<span>${escapeHtml(item.label)}</span><span aria-hidden="true">↗</span>` +
      `</a>`
    )).join("");

    const card = container.closest(".info-card");
    const heading = card?.querySelector("h3");
    if (heading && !heading.querySelector(".material-count")) {
      const count = document.createElement("small");
      count.className = "material-count";
      count.textContent = `${valid.length} link${valid.length === 1 ? "" : "s"}`;
      heading.append(" ", count);
    }
  }

  function renderArchiveGroups() {
    document.querySelectorAll("[data-link-group]").forEach(renderGroup);
  }

  const directory = {
    data: null,
    department: "",
    semester: "all",
    query: ""
  };

  function getDirectoryElements() {
    return {
      department: document.getElementById("rev2015Department"),
      semester: document.getElementById("rev2015Semester"),
      search: document.getElementById("rev2015Search"),
      clear: document.getElementById("rev2015ClearFilters"),
      status: document.getElementById("rev2015DirectoryStatus"),
      results: document.getElementById("rev2015SubjectResults")
    };
  }

  function setDirectoryStatus(message, state = "") {
    const { status } = getDirectoryElements();
    if (!status) return;
    status.textContent = message;
    status.dataset.state = state;
  }

  function programmeByCode(code) {
    return directory.data?.programmes?.find(item => item.code === code) || null;
  }

  function updateDirectoryUrl() {
    const url = new URL(location.href);
    if (directory.department) url.searchParams.set("department", directory.department);
    else url.searchParams.delete("department");
    if (directory.semester !== "all") url.searchParams.set("semester", directory.semester);
    else url.searchParams.delete("semester");
    if (directory.query) url.searchParams.set("search", directory.query);
    else url.searchParams.delete("search");
    history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function readDirectoryUrl() {
    const params = new URLSearchParams(location.search);
    const department = String(params.get("department") || "").toUpperCase();
    const semester = String(params.get("semester") || "all");
    const query = String(params.get("search") || "").trim();
    const validDepartment = directory.data.programmes.some(item => item.code === department);
    directory.department = validDepartment ? department : "";
    directory.semester = /^[1-6]$/.test(semester) ? semester : "all";
    directory.query = query;
  }

  function populateDirectoryControls() {
    const { department, semester, search } = getDirectoryElements();
    if (!department || !semester || !search) return;

    department.innerHTML = '<option value="">All 21 departments</option>' + directory.data.programmes.map(item => (
      `<option value="${escapeHtml(item.code)}">${escapeHtml(item.name)} (${escapeHtml(item.code)})</option>`
    )).join("");
    department.value = directory.department;
    semester.value = directory.semester;
    search.value = directory.query;
  }

  function renderDepartmentOverview() {
    const { results } = getDirectoryElements();
    if (!results) return;
    const query = directory.query.toLocaleLowerCase();
    const programmes = directory.data.programmes.filter(item => {
      if (!query) return true;
      return `${item.code} ${item.name}`.toLocaleLowerCase().includes(query);
    });

    if (!programmes.length) {
      results.innerHTML = '<div class="rev2015-empty"><strong>No department matches this search.</strong><span>Clear the search or enter a department name/code.</span></div>';
      setDirectoryStatus("No departments found.", "empty");
      return;
    }

    results.innerHTML = `<div class="rev2015-department-grid">${programmes.map(item => (
      `<button class="rev2015-department-card" type="button" data-programme-code="${escapeHtml(item.code)}">` +
        `<span class="rev2015-department-code">${escapeHtml(item.code)}</span>` +
        `<strong>${escapeHtml(item.name)}</strong>` +
        `<span>${Number(item.subjectCount)} subject entries · ${Number(item.modelPaperCount)} model papers</span>` +
        `<span class="rev2015-department-open">Open subjects <b aria-hidden="true">→</b></span>` +
      `</button>`
    )).join("")}</div>`;
    setDirectoryStatus(`${programmes.length} department${programmes.length === 1 ? "" : "s"} shown. Select one to view subjects.`);
  }

  function subjectCard(subject, programme) {
    const syllabusUrl = safeSitttrUrl(subject.syllabusUrl);
    const modelUrl = subject.modelAvailable ? safeSitttrUrl(subject.modelQuestionPaperUrl) : "";
    const syllabusAction = syllabusUrl
      ? `<a class="rev2015-action rev2015-action-syllabus" href="${escapeHtml(syllabusUrl)}" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer"><span aria-hidden="true">↓</span> Syllabus</a>`
      : '<span class="rev2015-action rev2015-action-disabled" aria-disabled="true">Syllabus unavailable</span>';
    const modelAction = modelUrl
      ? `<a class="rev2015-action rev2015-action-model" href="${escapeHtml(modelUrl)}" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer"><span aria-hidden="true">↓</span> Model Question Paper</a>`
      : '<span class="rev2015-action rev2015-action-disabled" aria-disabled="true" title="SITTTR does not list a model question paper for this subject.">Model QP not listed</span>';

    return (
      `<article class="rev2015-subject-card" data-subject-code="${escapeHtml(subject.code)}">` +
        `<div class="rev2015-subject-top"><span>Semester ${Number(subject.semester)}</span><strong>${escapeHtml(subject.code)}</strong></div>` +
        `<h4>${escapeHtml(subject.name)}</h4>` +
        `<p>${escapeHtml(programme.name)} · REV2015</p>` +
        `<div class="rev2015-subject-actions">${syllabusAction}${modelAction}</div>` +
      `</article>`
    );
  }

  function renderSubjects() {
    const { results } = getDirectoryElements();
    if (!results) return;
    const programme = programmeByCode(directory.department);
    if (!programme) {
      renderDepartmentOverview();
      return;
    }

    const query = directory.query.toLocaleLowerCase();
    const subjects = directory.data.subjects.filter(item => {
      if (item.programmeCode !== programme.code) return false;
      if (directory.semester !== "all" && String(item.semester) !== directory.semester) return false;
      if (!query) return true;
      return `${item.code} ${item.name}`.toLocaleLowerCase().includes(query);
    });

    const departmentSyllabusUrl = `${SYLLABUS_INDEX.replace("&scheme=REV2015", "")}-courses&prog=${encodeURIComponent(programme.code)}`;
    const departmentModelUrl = MODEL_QP_BASE + encodeURIComponent(programme.code);
    const intro = (
      `<div class="rev2015-selected-department">` +
        `<div><span>${escapeHtml(programme.code)}</span><h3>${escapeHtml(programme.name)}</h3><p>${Number(programme.subjectCount)} subject entries across Semester 1–6. ${Number(programme.modelPaperCount)} are listed in the official model-paper index.</p></div>` +
        `<div class="rev2015-department-links">` +
          `<a href="${escapeHtml(departmentSyllabusUrl)}" target="_blank" rel="noopener noreferrer">Department syllabus index ↗</a>` +
          `<a href="${escapeHtml(departmentModelUrl)}" target="_blank" rel="noopener noreferrer">Department model-paper index ↗</a>` +
        `</div>` +
      `</div>`
    );

    if (!subjects.length) {
      results.innerHTML = intro + '<div class="rev2015-empty"><strong>No subjects match the selected filters.</strong><span>Change the semester or clear the search text.</span></div>';
      setDirectoryStatus(`No matching subjects in ${programme.name}.`, "empty");
      return;
    }

    const grouped = new Map();
    subjects.forEach(subject => {
      const key = Number(subject.semester);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(subject);
    });

    const sections = [...grouped.entries()].sort((a, b) => a[0] - b[0]).map(([semester, semesterSubjects]) => (
      `<section class="rev2015-semester-group" aria-labelledby="rev2015-${escapeHtml(programme.code)}-sem-${semester}">` +
        `<div class="rev2015-semester-heading"><h3 id="rev2015-${escapeHtml(programme.code)}-sem-${semester}">Semester ${semester}</h3><span>${semesterSubjects.length} subject${semesterSubjects.length === 1 ? "" : "s"}</span></div>` +
        `<div class="rev2015-subject-grid">${semesterSubjects.map(item => subjectCard(item, programme)).join("")}</div>` +
      `</section>`
    )).join("");

    results.innerHTML = intro + sections;
    setDirectoryStatus(`${subjects.length} subject${subjects.length === 1 ? "" : "s"} shown for ${programme.name}.`);
  }

  function renderDirectory() {
    if (!directory.data) return;
    if (directory.department) renderSubjects();
    else renderDepartmentOverview();
    updateDirectoryUrl();
  }

  function bindDirectoryEvents() {
    const { department, semester, search, clear, results } = getDirectoryElements();
    if (!department || !semester || !search || !results) return;

    department.addEventListener("change", () => {
      directory.department = department.value;
      renderDirectory();
    });
    semester.addEventListener("change", () => {
      directory.semester = semester.value;
      renderDirectory();
    });
    search.addEventListener("input", () => {
      directory.query = search.value.trim();
      renderDirectory();
    });
    clear?.addEventListener("click", () => {
      directory.department = "";
      directory.semester = "all";
      directory.query = "";
      populateDirectoryControls();
      renderDirectory();
      department.focus();
    });
    results.addEventListener("click", event => {
      const button = event.target.closest("[data-programme-code]");
      if (!button) return;
      directory.department = button.dataset.programmeCode || "";
      department.value = directory.department;
      renderDirectory();
      document.getElementById("rev2015DirectoryControls")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function initDirectory() {
    const { results } = getDirectoryElements();
    if (!results) return;
    setDirectoryStatus("Loading the verified REV2015 subject registry…", "loading");
    try {
      const response = await fetch(SUBJECT_DATA_URL, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data.programmes) || !Array.isArray(data.subjects) || data.programmes.length !== 21) {
        throw new Error("The subject registry is incomplete.");
      }
      directory.data = data;
      readDirectoryUrl();
      populateDirectoryControls();
      bindDirectoryEvents();
      renderDirectory();
      document.documentElement.classList.add("rev2015-directory-ready");
    } catch (error) {
      console.error("REV2015 subject registry failed to load:", error);
      setDirectoryStatus("The subject registry could not be loaded.", "error");
      results.innerHTML = (
        '<div class="rev2015-empty rev2015-load-error"><strong>Subject list temporarily unavailable.</strong>' +
        '<span>Use the official SITTTR indexes below while this page reloads.</span>' +
        `<div class="rev2015-error-links"><a href="${escapeHtml(SYLLABUS_INDEX)}" target="_blank" rel="noopener noreferrer">Official REV2015 syllabus index ↗</a>` +
        `<a href="${escapeHtml(MODEL_QP_INDEX)}" target="_blank" rel="noopener noreferrer">Official REV2015 model-paper index ↗</a></div></div>`
      );
    }
  }

  function init() {
    renderArchiveGroups();
    initDirectory();
    document.documentElement.classList.add("materials-2015-ready");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
