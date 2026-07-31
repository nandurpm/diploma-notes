/* Purpose: About voice auto - Descriptive comment added for clarity */
(() => {
  const target = document.querySelector('[data-about-voice], #site-guide, #about');
  const manualButton = document.querySelector('[data-about-voice-button]');
  if (!target && !manualButton) return;

  const audioSrc = (target && target.getAttribute('data-about-voice-src')) || (manualButton && manualButton.getAttribute('data-about-voice-src')) || '/assets/audio/about-voice.mp3';
  const delay = Number((target && target.getAttribute('data-about-voice-delay')) || 5000);
  const key = 'polyAboutVoicePlayed';
  let timer = null;
  let audio = null;
  let played = sessionStorage.getItem(key) === '1';
  let visible = true;

  function player() {
    if (!audio) {
      audio = new Audio(audioSrc);
      audio.preload = 'auto';
    }
    return audio;
  }

  function enoughVisible() {
    if (!target) return true;
    const r = target.getBoundingClientRect();
    const h = window.innerHeight || document.documentElement.clientHeight;
    return r.bottom > h * 0.15 && r.top < h * 0.85;
  }

  function clearVoiceTimer() {
    clearTimeout(timer);
    timer = null;
  }

  async function prepareAudio() {
    const a = player();
    try {
      a.volume = 0;
      await a.play();
      a.pause();
      a.currentTime = 0;
      a.volume = 1;
    } catch (e) {
      a.volume = 1;
    }
  }

  async function playAudio(markAsPlayed) {
    const a = player();
    try {
      a.pause();
      a.currentTime = 0;
      a.volume = 1;
      await a.play();
      if (markAsPlayed) {
        played = true;
        sessionStorage.setItem(key, '1');
      }
    } catch (e) {
      console.warn('About voice not played:', e);
    }
  }

  async function playAboutVoice() {
    if (played || !visible || document.hidden || !enoughVisible()) return;
    await playAudio(true);
    clearVoiceTimer();
  }

  function startVoiceTimer() {
    if (played) return;
    clearVoiceTimer();
    if (!enoughVisible()) return;
    prepareAudio();
    timer = setTimeout(playAboutVoice, delay);
  }

  if (target) {
    const observer = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (!visible) clearVoiceTimer();
    }, { threshold: 0.45 });

    observer.observe(target);
    target.addEventListener('click', startVoiceTimer);
  }

  if (manualButton) {
    manualButton.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      clearVoiceTimer();
      manualButton.disabled = true;
      manualButton.classList.add('is-playing');
      manualButton.textContent = '🔊 പ്ലേ ചെയ്യുന്നു...';
      await playAudio(false);
      manualButton.disabled = false;
      manualButton.classList.remove('is-playing');
      manualButton.textContent = '🔊 മലയാളം കേൾക്കാം';
    });
  }

  document.addEventListener('visibilitychange', () => { if (document.hidden) clearVoiceTimer(); });
})();
