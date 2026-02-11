(() => {
  const AUDIO_SRC = 'music/musique_chap3.mp3';
  const STORAGE_TIME = 'chap3-audio-time';
  const STORAGE_PLAY = 'chap3-audio-playing';

  const audio = new Audio(AUDIO_SRC);
  audio.loop = true;
  audio.preload = 'auto';
  const targetVolume = 0.6;
  audio.volume = 0;

  const savedTime = parseFloat(localStorage.getItem(STORAGE_TIME));
  if (!Number.isNaN(savedTime)) {
    audio.currentTime = savedTime;
  }

  const style = document.createElement('style');
  style.textContent = `
    .chap3-audio-btn{
      position:fixed;
      left:28px;
      bottom:28px;
      z-index:9999;
      display:none;
      align-items:center;
      justify-content:center;
      padding:12px 18px;
      border-radius:999px;
      border:1px solid #D32D13;
      background:#FFFFFF;
      color:#D32D13;
      font-family:'Oswald', sans-serif;
      font-size:16px;
      letter-spacing:1px;
      cursor:pointer;
      box-shadow:0 10px 20px rgba(0,0,0,0.12);
    }
    .chap3-audio-btn.is-visible{display:inline-flex;}
    .chap3-audio-btn:hover,
    .chap3-audio-btn:focus-visible{
      background:#D32D13;
      color:#FFFFFF;
    }
    @media (max-width:520px){
      .chap3-audio-btn{left:16px;bottom:16px;font-size:14px}
    }
  `;
  document.head.appendChild(style);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'chap3-audio-btn';
  button.textContent = 'Activer le son';
  document.body.appendChild(button);

  function saveState() {
    localStorage.setItem(STORAGE_TIME, String(audio.currentTime || 0));
    localStorage.setItem(STORAGE_PLAY, audio.paused ? '0' : '1');
  }

  window.addEventListener('pagehide', saveState);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) saveState();
  });

  function fadeTo(volume, duration, done) {
    const start = audio.volume;
    const delta = volume - start;
    const startTime = performance.now();

    function step(now) {
      const t = Math.min(1, (now - startTime) / duration);
      audio.volume = start + delta * t;
      if (t < 1) {
        requestAnimationFrame(step);
      } else if (typeof done === 'function') {
        done();
      }
    }

    requestAnimationFrame(step);
  }

  async function startAudio() {
    try {
      await audio.play();
      fadeTo(targetVolume, 1200);
      localStorage.setItem(STORAGE_PLAY, '1');
      button.classList.remove('is-visible');
    } catch (_) {
      button.classList.add('is-visible');
    }
  }

  button.addEventListener('click', () => {
    startAudio();
  });

  if (localStorage.getItem(STORAGE_PLAY) === '1') {
    startAudio();
  } else {
    // Try autoplay once; if blocked, show button.
    startAudio();
  }

  const returnHome = document.querySelector('.return-home');
  if (returnHome) {
    returnHome.addEventListener('click', (event) => {
      event.preventDefault();
      const target = returnHome.getAttribute('href') || 'index.html';
      fadeTo(0, 1200, () => {
        saveState();
        localStorage.setItem(STORAGE_PLAY, '0');
        audio.pause();
        window.location.href = target;
      });
    });
  }
})();
