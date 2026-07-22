/* Purpose: New year theme - Descriptive comment added for clarity */
(() => {
  "use strict";

  if (window.__POLY_NEW_YEAR_THEME__) return;
  window.__POLY_NEW_YEAR_THEME__ = true;

  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const root = document.documentElement;
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
  const compactScreen = window.matchMedia?.("(max-width: 760px)")?.matches === true;
  const initialThemeMeta = document.querySelector('meta[name="theme-color"]');
  const hadThemeColorMeta = Boolean(initialThemeMeta);
  const originalThemeColor = initialThemeMeta?.getAttribute("content") || "";

  let effectsEnabled = !reducedMotion;
  try {
    effectsEnabled = effectsEnabled && sessionStorage.getItem("poly-new-year-effects") !== "paused";
  } catch (error) {
    // Storage can be unavailable in strict privacy modes. The theme still works.
  }

  let banner = null;
  let countdown = null;
  let countdownLabel = null;
  let countdownValue = null;
  let title = null;
  let message = null;
  let control = null;
  let canvas = null;
  let context = null;
  let circuitOverlay = null;
  let animationFrame = 0;
  let animationRunning = false;
  let lastFrame = 0;
  let resizeTimer = 0;
  let updateTimer = 0;
  let currentPhase = "";
  let introPlayed = false;
  let stars = [];
  let sparks = [];
  let confetti = [];

  function getIstParts(timestamp = Date.now()) {
    const local = new Date(timestamp + IST_OFFSET_MS);
    return {
      year: local.getUTCFullYear(),
      month: local.getUTCMonth() + 1,
      day: local.getUTCDate(),
      hour: local.getUTCHours(),
      minute: local.getUTCMinutes(),
      second: local.getUTCSeconds(),
    };
  }

  function isSeasonActive(parts) {
    return (parts.month === 12 && parts.day >= 28) || (parts.month === 1 && parts.day <= 3);
  }

  function resolveSeason(timestamp = Date.now()) {
    const parts = getIstParts(timestamp);
    const targetYear = parts.month === 12 ? parts.year + 1 : parts.year;
    const newYearAt = Date.UTC(targetYear, 0, 1, 0, 0, 0) - IST_OFFSET_MS;
    let phase = "welcome";

    if (parts.month === 12 && parts.day < 31) phase = "approaching";
    if (parts.month === 12 && parts.day === 31) phase = "countdown";
    if (parts.month === 1 && parts.day === 1) phase = "celebration";

    return { parts, targetYear, newYearAt, phase, active: isSeasonActive(parts) };
  }

  function ensureThemeColor() {
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.append(meta);
    }
    meta.content = "#06152f";
  }

  function buildBanner() {
    if (document.getElementById("poly-new-year-banner")) return;

    banner = document.createElement("aside");
    banner.id = "poly-new-year-banner";
    banner.setAttribute("aria-label", "POLY PMNA New Year theme");
    banner.innerHTML = `
      <span class="poly-new-year-banner__circuit" aria-hidden="true"></span>
      <div class="poly-new-year-banner__inner">
        <span class="poly-new-year-banner__mark" aria-hidden="true">✦</span>
        <div class="poly-new-year-banner__copy">
          <strong class="poly-new-year-banner__title"></strong>
          <span class="poly-new-year-banner__message"></span>
        </div>
        <div class="poly-new-year-banner__countdown" aria-live="polite">
          <span class="poly-new-year-banner__countdown-label"></span>
          <strong class="poly-new-year-banner__countdown-value"></strong>
        </div>
        <button class="poly-new-year-banner__control" type="button" aria-pressed="false">Pause effects</button>
      </div>`;

    document.body.insertBefore(banner, document.body.firstChild);
    title = banner.querySelector(".poly-new-year-banner__title");
    message = banner.querySelector(".poly-new-year-banner__message");
    countdown = banner.querySelector(".poly-new-year-banner__countdown");
    countdownLabel = banner.querySelector(".poly-new-year-banner__countdown-label");
    countdownValue = banner.querySelector(".poly-new-year-banner__countdown-value");
    control = banner.querySelector(".poly-new-year-banner__control");

    control.addEventListener("click", toggleEffects);
    updateControl();
  }

  function buildEffects() {
    if (document.getElementById("poly-new-year-effects")) return;

    circuitOverlay = document.createElement("div");
    circuitOverlay.id = "poly-new-year-circuit-overlay";
    circuitOverlay.setAttribute("aria-hidden", "true");

    canvas = document.createElement("canvas");
    canvas.id = "poly-new-year-effects";
    canvas.setAttribute("aria-hidden", "true");

    document.body.append(circuitOverlay, canvas);
    context = canvas.getContext("2d", { alpha: true });
    resizeCanvas();
    seedStars();
  }

  function resizeCanvas() {
    if (!canvas || !context) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.max(1, Math.floor(window.innerWidth * ratio));
    canvas.height = Math.max(1, Math.floor(window.innerHeight * ratio));
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    seedStars();
  }

  function seedStars() {
    const count = compactScreen ? 18 : 42;
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      radius: .45 + Math.random() * 1.25,
      speed: 3 + Math.random() * 9,
      alpha: .16 + Math.random() * .45,
      pulse: Math.random() * Math.PI * 2,
    }));
  }

  function formatCountdown(milliseconds) {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = value => String(value).padStart(2, "0");

    if (days > 0) return `${days}d ${pad(hours)}h ${pad(minutes)}m`;
    return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  }

  function updateBanner() {
    const season = resolveSeason();
    if (!season.active) {
      teardown();
      return;
    }

    root.dataset.polyNewYear = String(season.targetYear);

    if (season.phase !== currentPhase) {
      currentPhase = season.phase;
      introPlayed = false;
    }

    if (season.phase === "approaching") {
      title.textContent = `New Year ${season.targetYear} is approaching`;
      message.textContent = "Midnight Circuit mode is live — learn, build and enter the new year brighter.";
      countdown.hidden = false;
      countdownLabel.textContent = "New Year in";
      countdownValue.textContent = formatCountdown(season.newYearAt - Date.now());
      playIntroFireworks();
      return;
    }

    if (season.phase === "countdown") {
      const remaining = season.newYearAt - Date.now();
      title.textContent = `Countdown to ${season.targetYear}`;
      message.textContent = "The final circuit is closing. A new year of learning begins at midnight IST.";
      countdown.hidden = false;
      countdownLabel.textContent = "Midnight in";
      countdownValue.textContent = formatCountdown(remaining);
      playIntroFireworks();
      if (remaining <= 0) celebrateOnce(season.targetYear, true);
      return;
    }

    if (season.phase === "celebration") {
      title.textContent = `Happy New Year ${season.targetYear}!`;
      message.textContent = "May this year bring sharper skills, safer engineering and bigger achievements.";
      countdown.hidden = true;
      celebrateOnce(season.targetYear, false);
      return;
    }

    title.textContent = `Welcome ${season.targetYear}`;
    message.textContent = "Start the year with one useful lesson, one solved problem and one completed goal.";
    countdown.hidden = true;
    playIntroFireworks();
  }

  function toggleEffects() {
    if (reducedMotion) return;
    effectsEnabled = !effectsEnabled;
    root.classList.toggle("poly-new-year-effects-paused", !effectsEnabled);
    try {
      sessionStorage.setItem("poly-new-year-effects", effectsEnabled ? "playing" : "paused");
    } catch (error) {
      // Ignore storage restrictions.
    }

    if (!effectsEnabled) {
      stopAnimation();
      sparks = [];
      confetti = [];
      context?.clearRect(0, 0, window.innerWidth, window.innerHeight);
    } else {
      startAnimation();
      playIntroFireworks(true);
    }
    updateControl();
  }

  function updateControl() {
    if (!control) return;
    if (reducedMotion) {
      control.textContent = "Reduced motion";
      control.disabled = true;
      control.setAttribute("aria-pressed", "true");
      control.setAttribute("aria-label", "New Year animations disabled by reduced-motion preference");
      control.title = control.getAttribute("aria-label");
      return;
    }

    control.disabled = false;
    control.textContent = effectsEnabled ? "Pause effects" : "Play effects";
    control.setAttribute("aria-pressed", String(!effectsEnabled));
    control.setAttribute("aria-label", effectsEnabled ? "Pause New Year visual effects" : "Play New Year visual effects");
    control.title = control.getAttribute("aria-label");
  }

  function burst(x, y, amount = 34) {
    if (!effectsEnabled || reducedMotion) return;
    const colours = ["#42ddff", "#f7c948", "#ffe9a8", "#8ab8ff", "#ffffff"];
    for (let index = 0; index < amount; index += 1) {
      const angle = (Math.PI * 2 * index) / amount + Math.random() * .12;
      const speed = 42 + Math.random() * 95;
      sparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 18 + Math.random() * 24,
        life: .7 + Math.random() * .85,
        maxLife: 1.55,
        size: 1 + Math.random() * 2.1,
        colour: colours[Math.floor(Math.random() * colours.length)],
      });
    }
    startAnimation();
  }

  function playIntroFireworks(force = false) {
    if (introPlayed && !force) return;
    if (!effectsEnabled || reducedMotion || document.hidden) return;
    introPlayed = true;
    const points = compactScreen
      ? [[.18, .20], [.78, .16]]
      : [[.12, .18], [.82, .16], [.56, .28]];
    points.forEach(([x, y], index) => {
      window.setTimeout(() => burst(window.innerWidth * x, window.innerHeight * y, compactScreen ? 22 : 34), 350 + index * 1050);
    });
  }

  function createConfetti() {
    if (!effectsEnabled || reducedMotion) return;
    const colours = ["#42ddff", "#f7c948", "#ffe9a8", "#ffffff", "#4f8cff"];
    const count = compactScreen ? 70 : 150;
    confetti = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random() * window.innerHeight * .32,
      vx: -24 + Math.random() * 48,
      vy: 70 + Math.random() * 120,
      rotation: Math.random() * Math.PI,
      spin: -4 + Math.random() * 8,
      width: 4 + Math.random() * 6,
      height: 7 + Math.random() * 10,
      life: 5 + Math.random() * 2,
      colour: colours[Math.floor(Math.random() * colours.length)],
    }));
    startAnimation();
  }

  function celebrateOnce(year, force) {
    if (!effectsEnabled || reducedMotion) return;
    const key = `poly-new-year-celebrated-${year}`;
    let alreadyCelebrated = false;
    try {
      alreadyCelebrated = sessionStorage.getItem(key) === "yes";
    } catch (error) {
      alreadyCelebrated = false;
    }
    if (alreadyCelebrated && !force) return;

    try {
      sessionStorage.setItem(key, "yes");
    } catch (error) {
      // Ignore storage restrictions.
    }

    createConfetti();
    burst(window.innerWidth * .20, window.innerHeight * .22, compactScreen ? 28 : 46);
    window.setTimeout(() => burst(window.innerWidth * .80, window.innerHeight * .18, compactScreen ? 28 : 46), 900);
    window.setTimeout(() => burst(window.innerWidth * .50, window.innerHeight * .30, compactScreen ? 24 : 42), 1800);
  }

  function drawFrame(timestamp) {
    if (!context || !canvas || !animationRunning) return;

    const elapsed = Math.min(.05, Math.max(.001, (timestamp - lastFrame) / 1000 || .016));
    lastFrame = timestamp;
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);

    stars.forEach(star => {
      star.y += star.speed * elapsed;
      star.pulse += elapsed * 1.7;
      if (star.y > window.innerHeight + 4) {
        star.y = -4;
        star.x = Math.random() * window.innerWidth;
      }
      const alpha = star.alpha * (.7 + Math.sin(star.pulse) * .3);
      context.beginPath();
      context.fillStyle = `rgba(184, 226, 255, ${Math.max(.04, alpha)})`;
      context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      context.fill();
    });

    sparks = sparks.filter(particle => {
      particle.life -= elapsed;
      if (particle.life <= 0) return false;
      particle.vy += particle.gravity * elapsed;
      particle.x += particle.vx * elapsed;
      particle.y += particle.vy * elapsed;
      particle.vx *= .986;
      particle.vy *= .986;
      const alpha = Math.min(1, particle.life / particle.maxLife);
      context.globalAlpha = alpha;
      context.fillStyle = particle.colour;
      context.fillRect(particle.x, particle.y, particle.size, particle.size);
      context.globalAlpha = 1;
      return true;
    });

    confetti = confetti.filter(piece => {
      piece.life -= elapsed;
      if (piece.life <= 0 || piece.y > window.innerHeight + 40) return false;
      piece.vy += 18 * elapsed;
      piece.x += piece.vx * elapsed;
      piece.y += piece.vy * elapsed;
      piece.rotation += piece.spin * elapsed;
      context.save();
      context.translate(piece.x, piece.y);
      context.rotate(piece.rotation);
      context.fillStyle = piece.colour;
      context.fillRect(-piece.width / 2, -piece.height / 2, piece.width, piece.height);
      context.restore();
      return true;
    });

    animationFrame = requestAnimationFrame(drawFrame);
  }

  function startAnimation() {
    if (animationRunning || reducedMotion || !effectsEnabled || document.hidden) return;
    animationRunning = true;
    lastFrame = performance.now();
    animationFrame = requestAnimationFrame(drawFrame);
  }

  function stopAnimation() {
    animationRunning = false;
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  }

  function teardown() {
    stopAnimation();
    window.clearInterval(updateTimer);
    updateTimer = 0;
    banner?.remove();
    canvas?.remove();
    circuitOverlay?.remove();
    root.classList.remove("poly-new-year-theme", "poly-new-year-effects-paused");
    delete root.dataset.polyNewYear;

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      if (hadThemeColorMeta) themeMeta.content = originalThemeColor;
      else themeMeta.remove();
    }

    window.__POLY_NEW_YEAR_THEME__ = false;
  }

  function initialise() {
    const season = resolveSeason();
    if (!season.active || !document.body) return;

    root.classList.add("poly-new-year-theme");
    root.classList.toggle("poly-new-year-effects-paused", !effectsEnabled);
    ensureThemeColor();
    buildBanner();
    buildEffects();
    updateBanner();
    startAnimation();

    updateTimer = window.setInterval(updateBanner, 1000);
    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resizeCanvas, 160);
    }, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stopAnimation();
        sparks = [];
        confetti = [];
        context?.clearRect(0, 0, window.innerWidth, window.innerHeight);
      } else if (effectsEnabled) {
        startAnimation();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialise, { once: true });
  } else {
    initialise();
  }
})();
