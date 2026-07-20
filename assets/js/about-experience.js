(() => {
  "use strict";

  const root = document.querySelector(".about-experience");
  if (!root) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const languageButtons = [...root.querySelectorAll("[data-about-lang]")];
  const translatable = [...root.querySelectorAll("[data-en][data-ml]")];
  const storageKey = "poly-pmna-about-language";
  let currentLanguage = "en";

  const copy = {
    en: {
      previous: "Previous guide step",
      next: "Next guide step",
      pause: "Pause autoplay",
      play: "Start autoplay",
      playing: "Autoplay on",
      paused: "Autoplay paused",
      step: "Guide step",
      of: "of"
    },
    ml: {
      previous: "മുൻപത്തെ ഘട്ടം",
      next: "അടുത്ത ഘട്ടം",
      pause: "ഓട്ടോപ്ലേ നിർത്തുക",
      play: "ഓട്ടോപ്ലേ ആരംഭിക്കുക",
      playing: "ഓട്ടോപ്ലേ പ്രവർത്തിക്കുന്നു",
      paused: "ഓട്ടോപ്ലേ നിർത്തിയിരിക്കുന്നു",
      step: "ഗൈഡ് ഘട്ടം",
      of: "ൽ"
    }
  };

  function safeStoredLanguage() {
    try {
      return localStorage.getItem(storageKey);
    } catch (_) {
      return null;
    }
  }

  function persistLanguage(language) {
    try {
      localStorage.setItem(storageKey, language);
    } catch (_) {
      // The language control still works when browser storage is unavailable.
    }
  }

  function applyLanguage(language) {
    currentLanguage = language === "ml" ? "ml" : "en";
    root.dataset.language = currentLanguage;
    document.documentElement.lang = currentLanguage === "ml" ? "ml" : "en";

    translatable.forEach((node) => {
      const value = node.dataset[currentLanguage];
      if (typeof value === "string") node.textContent = value;
    });

    languageButtons.forEach((button) => {
      const active = button.dataset.aboutLang === currentLanguage;
      button.setAttribute("aria-pressed", String(active));
    });

    persistLanguage(currentLanguage);
    document.dispatchEvent(new CustomEvent("poly-about-language-change", {
      detail: { language: currentLanguage }
    }));
  }

  languageButtons.forEach((button) => {
    button.addEventListener("click", () => applyLanguage(button.dataset.aboutLang));
  });

  const storedLanguage = safeStoredLanguage();
  const browserLanguage = navigator.language && navigator.language.toLowerCase().startsWith("ml") ? "ml" : "en";
  applyLanguage(storedLanguage || browserLanguage);

  /* Autoplay how-to guide */
  const guide = root.querySelector("[data-about-guide]");
  if (guide) {
    const track = guide.querySelector("[data-guide-track]");
    const slides = [...guide.querySelectorAll("[data-guide-slide]")];
    const previousButton = guide.querySelector("[data-guide-previous]");
    const nextButton = guide.querySelector("[data-guide-next]");
    const toggleButton = guide.querySelector("[data-guide-toggle]");
    const toggleIcon = toggleButton && toggleButton.querySelector("[data-guide-toggle-icon]");
    const statusText = guide.querySelector("[data-guide-status]");
    const progress = guide.querySelector("[data-guide-progress]");
    const dots = guide.querySelector("[data-guide-dots]");
    const interval = 6500;
    let index = 0;
    let elapsed = 0;
    let lastFrame = performance.now();
    let playing = !reduceMotion.matches;
    let resumeAfterVisibility = playing;
    let pointerStart = null;

    function languageCopy() {
      return copy[currentLanguage] || copy.en;
    }

    function updateButtonLabels() {
      const labels = languageCopy();
      if (previousButton) previousButton.setAttribute("aria-label", labels.previous);
      if (nextButton) nextButton.setAttribute("aria-label", labels.next);
      if (toggleButton) {
        toggleButton.setAttribute("aria-label", playing ? labels.pause : labels.play);
        toggleButton.setAttribute("title", playing ? labels.pause : labels.play);
      }
      if (toggleIcon) toggleIcon.textContent = playing ? "Ⅱ" : "▶";
      if (statusText) {
        statusText.textContent = `${playing ? labels.playing : labels.paused} · ${labels.step} ${index + 1} ${labels.of} ${slides.length}`;
      }
    }

    function createDots() {
      if (!dots) return;
      dots.replaceChildren();
      slides.forEach((slide, slideIndex) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.guideDot = String(slideIndex);
        button.setAttribute("aria-label", `${copy.en.step} ${slideIndex + 1}`);
        button.addEventListener("click", () => {
          goTo(slideIndex, true);
        });
        dots.append(button);
      });
    }

    function updateDots() {
      if (!dots) return;
      [...dots.children].forEach((dot, dotIndex) => {
        dot.setAttribute("aria-current", String(dotIndex === index));
        const labels = languageCopy();
        dot.setAttribute("aria-label", `${labels.step} ${dotIndex + 1} ${labels.of} ${slides.length}`);
      });
    }

    function render() {
      if (track) track.style.transform = `translate3d(-${index * 100}%,0,0)`;
      slides.forEach((slide, slideIndex) => {
        slide.setAttribute("aria-hidden", String(slideIndex !== index));
        slide.tabIndex = slideIndex === index ? 0 : -1;
      });
      updateDots();
      updateButtonLabels();
    }

    function goTo(nextIndex, userInitiated = false) {
      index = (nextIndex + slides.length) % slides.length;
      elapsed = 0;
      render();
      if (userInitiated && playing) lastFrame = performance.now();
    }

    function setPlaying(value) {
      playing = Boolean(value) && !reduceMotion.matches;
      elapsed = 0;
      lastFrame = performance.now();
      updateButtonLabels();
    }

    function frame(now) {
      const delta = Math.min(250, now - lastFrame);
      lastFrame = now;
      if (playing && !document.hidden) {
        elapsed += delta;
        if (elapsed >= interval) goTo(index + 1);
      }
      if (progress) progress.style.width = `${Math.min(100, (elapsed / interval) * 100)}%`;
      requestAnimationFrame(frame);
    }

    createDots();
    render();
    requestAnimationFrame(frame);

    previousButton && previousButton.addEventListener("click", () => goTo(index - 1, true));
    nextButton && nextButton.addEventListener("click", () => goTo(index + 1, true));
    toggleButton && toggleButton.addEventListener("click", () => setPlaying(!playing));

    guide.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(index - 1, true);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(index + 1, true);
      } else if (event.key === " " && event.target === guide) {
        event.preventDefault();
        setPlaying(!playing);
      }
    });

    guide.addEventListener("pointerdown", (event) => {
      pointerStart = { x: event.clientX, y: event.clientY };
    });
    guide.addEventListener("pointerup", (event) => {
      if (!pointerStart) return;
      const dx = event.clientX - pointerStart.x;
      const dy = event.clientY - pointerStart.y;
      pointerStart = null;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.25) {
        goTo(index + (dx < 0 ? 1 : -1), true);
      }
    });
    guide.addEventListener("pointercancel", () => { pointerStart = null; });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        resumeAfterVisibility = playing;
        playing = false;
        updateButtonLabels();
      } else if (resumeAfterVisibility && !reduceMotion.matches) {
        playing = true;
        elapsed = 0;
        lastFrame = performance.now();
        updateButtonLabels();
      }
    });

    const reducedMotionChanged = (event) => {
      if (event.matches) setPlaying(false);
    };
    if (typeof reduceMotion.addEventListener === "function") {
      reduceMotion.addEventListener("change", reducedMotionChanged);
    } else if (typeof reduceMotion.addListener === "function") {
      reduceMotion.addListener(reducedMotionChanged);
    }

    document.addEventListener("poly-about-language-change", updateButtonLabels);
  }

  /* Reveal sections without hiding content when JavaScript fails. */
  const revealItems = [...root.querySelectorAll("[data-about-reveal]")];
  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    revealItems.forEach((item) => item.classList.add("about-reveal-ready"));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("about-reveal-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -6%" });
    revealItems.forEach((item) => observer.observe(item));
  }

  /* Verified scope-number animation. */
  const countItems = [...root.querySelectorAll("[data-about-count]")];
  function animateCount(node) {
    const target = Number(node.dataset.aboutCount);
    if (!Number.isFinite(target) || reduceMotion.matches) {
      node.textContent = String(target);
      return;
    }
    const start = performance.now();
    const duration = 900;
    function tick(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      node.textContent = String(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  if ("IntersectionObserver" in window) {
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.7 });
    countItems.forEach((item) => countObserver.observe(item));
  } else {
    countItems.forEach(animateCount);
  }
})();
