(() => {
  "use strict";

  function setupQuizRuntime() {
    const Q = window.PolyQuiz;
    const warning = document.getElementById("serviceWarning");
    if (!Q || !warning || warning.dataset.runtimeReady === "true") return;

    warning.dataset.runtimeReady = "true";
    warning.innerHTML = `
      <span class="service-warning-text">The secure quiz service is temporarily unavailable.</span>
      <button class="btn soft service-retry-button" type="button">Retry Service</button>
    `;

    const textNode = warning.querySelector(".service-warning-text");
    const retryButton = warning.querySelector(".service-retry-button");

    const originalShow = Q.showServiceWarning;
    Q.showServiceWarning = (text) => {
      if (textNode) textNode.textContent = text || "The secure quiz service is temporarily unavailable.";
      warning.classList.remove("hidden");
      if (typeof originalShow === "function") originalShow(text);
    };

    const originalHide = Q.hideServiceWarning;
    Q.hideServiceWarning = () => {
      warning.classList.add("hidden");
      if (typeof originalHide === "function") originalHide();
    };

    retryButton?.addEventListener("click", () => Q.retryService?.());
    window.addEventListener("online", () => {
      if (Q.state?.mode === "authenticated" && !warning.classList.contains("hidden")) {
        Q.retryService?.();
      }
    });
  }

  function setupMenu() {
    const toggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector(".navlinks");
    if (!toggle || !nav || toggle.dataset.mainInitialized === "true") return;

    toggle.dataset.mainInitialized = "true";
    const setOpen = (open) => {
      nav.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
    };

    toggle.addEventListener("click", () => setOpen(!nav.classList.contains("open")));
    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("open")) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  function setupSiteNotice() {
    if (document.querySelector(".site-notice")) return;
    const brand = document.querySelector(".topbar .brand");
    if (!brand) return;

    const englishNotice = [
      "📚 Revision 2021 and 2015 study materials",
      "📝 subject-wise lessons, official syllabus links, downloadable notes and model question papers",
      "🔎 search by department, semester, subject name or subject code",
      "📱 designed for mobile phones, tablets and desktop computers",
      "💬 use the Help page to report missing materials, broken links, incorrect subject details or content corrections",
      "✨ new resources are added regularly and existing pages are continuously checked and improved"
    ].join("  •  ");

    const malayalamNotice = [
      "📚 കേരള പോളിടെക്നിക് വിദ്യാർത്ഥികൾക്കായി റിവിഷൻ 2021, 2015 പഠനസാമഗ്രികൾ ഒരിടത്ത്",
      "📝 വിഷയവാരി പാഠങ്ങൾ, ഔദ്യോഗിക സിലബസ് ലിങ്കുകൾ, ഡൗൺലോഡ് നോട്ടുകൾ, മോഡൽ ചോദ്യപേപ്പറുകൾ",
      "🔎 വിഭാഗം, സെമസ്റ്റർ, വിഷയത്തിന്റെ പേര് അല്ലെങ്കിൽ വിഷയ കോഡ് ഉപയോഗിച്ച് തിരയാം",
      "📱 മൊബൈൽ ഫോൺ, ടാബ്ലറ്റ്, കമ്പ്യൂട്ടർ എന്നിവയിൽ ഉപയോഗിക്കാൻ അനുയോജ്യം",
      "💬 ലഭ്യമല്ലാത്ത പഠനസാമഗ്രികൾ, തെറ്റായ ലിങ്കുകൾ, വിഷയവിവരത്തിലെ പിശകുകൾ, ഉള്ളടക്ക തിരുത്തലുകൾ എന്നിവ Help പേജിൽ അറിയിക്കാം",
      "✨ പുതിയ പഠനസഹായങ്ങൾ ക്രമമായി ചേർക്കുകയും നിലവിലുള്ള പേജുകൾ തുടർച്ചയായി പരിശോധിച്ച് മെച്ചപ്പെടുത്തുകയും ചെയ്യുന്നു"
    ].join("  •  ");

    const notice = document.createElement("a");
    notice.className = "site-notice";
    notice.href = "/about.html";
    notice.setAttribute("aria-label", "Website updates and available study resources");
    notice.innerHTML = `
      <strong class="site-notice-label">Update</strong>
      <span class="site-notice-viewport">
        <span class="site-notice-track"></span>
      </span>
    `;

    const track = notice.querySelector(".site-notice-track");
    track.textContent = `${englishNotice}  ◆  ${malayalamNotice}  ◆  `;
    track.style.animationDuration = "58s";

    brand.insertAdjacentElement("afterend", notice);
  }

  function setupHomepageVideoPoster() {
    document.querySelectorAll(".home-video[poster]").forEach((video) => {
      video.addEventListener("ended", () => {
        video.pause();
        video.currentTime = 0;
        video.load();
      });
    });
  }

  function renderMaterialLinks() {
    document.querySelectorAll("[data-link-group]").forEach((container) => {
      const group = globalThis.MATERIALS_2015?.[container.dataset.linkGroup] || [];
      container.replaceChildren();
      group.forEach((item) => {
        const link = document.createElement("a");
        link.href = item.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = item.label;
        container.append(link);
      });
    });
  }

  function setupLessonBackLinks() {
    const path = window.location.pathname;
    if (!path.includes("/lessons/")) return;

    const params = new URLSearchParams(window.location.search);
    let revision = params.get("revision");
    const existing = [...document.querySelectorAll("a")].find((link) => /back to/i.test(link.textContent));
    if (revision !== "2015" && revision !== "2021") {
      revision = existing && /2015|materials-2015/i.test(`${existing.textContent} ${existing.getAttribute("href") || ""}`)
        ? "2015"
        : "2021";
    }

    const href = revision === "2015" ? "/materials-2015.html" : "/revision-2021.html";
    const text = revision === "2015" ? "Back to 2015 Materials" : "Back to Revision 2021";
    const link = existing || document.createElement("a");
    link.href = href;
    link.textContent = text;
    link.classList.add("curriculum-back");
    if (!existing) document.body.prepend(link);
  }

  function setupTables() {
    document.querySelectorAll("table").forEach((table) => {
      table.querySelectorAll("thead th").forEach((header) => {
        if (!header.hasAttribute("scope")) header.scope = "col";
      });
      if (table.parentElement?.matches(".table-wrapper, .table-wrap, .tbl")) return;
      const wrapper = document.createElement("div");
      wrapper.className = "table-wrapper";
      table.before(wrapper);
      wrapper.append(table);
    });
  }

  setupQuizRuntime();

  document.addEventListener("DOMContentLoaded", () => {
    setupQuizRuntime();
    setupSiteNotice();
    document.querySelectorAll("[data-year]").forEach((item) => {
      item.textContent = new Date().getFullYear();
    });
    setupMenu();
    setupHomepageVideoPoster();
    renderMaterialLinks();
    setupLessonBackLinks();
    setupTables();
  });
})();
