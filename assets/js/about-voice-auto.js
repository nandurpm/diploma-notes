(() => {
  const target = document.querySelector('[data-about-voice], #site-guide, #about');
  if (!target) return;
  const audioSrc = target.getAttribute('data-about-voice-src') || '/assets/audio/about-voice.mp3';
  const delay = Number(target.getAttribute('data-about-voice-delay') || 5000);
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

  async function playAboutVoice() {
    if (played || !visible || document.hidden || !enoughVisible()) return;
    try {
      const a = player();
      a.currentTime = 0;
      a.volume = 1;
      await a.play();
      played = true;
      sessionStorage.setItem(key, '1');
    } catch (e) {
      console.warn('About voice not played:', e);
    } finally {
      clearVoiceTimer();
    }
  }

  function startVoiceTimer() {
    if (played) return;
    clearVoiceTimer();
    if (!enoughVisible()) return;
    prepareAudio();
    timer = setTimeout(playAboutVoice, delay);
  }

  const observer = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (!visible) clearVoiceTimer();
  }, { threshold: 0.45 });

  observer.observe(target);
  target.addEventListener('click', startVoiceTimer);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearVoiceTimer(); });
})();
