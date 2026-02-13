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
      display:inline-flex;
      width:80px;
      height:80px;
      padding:0;
      align-items:center;
      justify-content:center;
      border-radius:74px;
      border:1px solid #FEB70A;
      background:#FFFFFF;
      color:#FEB70A;
      cursor:pointer;
      box-shadow:0 14px 30px rgba(0,0,0,0.12);
      transition:box-shadow 200ms ease-in, background 200ms ease-in, color 200ms ease-in;
    }
    .chap3-audio-btn img{width:44px;height:44px;display:block;}
    .chap3-audio-btn:hover img,
    .chap3-audio-btn:focus-visible img{
      filter: brightness(2.5) saturate(0);
    }
    .chap3-audio-btn:hover,
    .chap3-audio-btn:focus-visible{
      background:#FEB70A;
      color:#FFFFFF;
      box-shadow:0 20px 40px rgba(0,0,0,0.16);
    }
    @media (max-width:520px){
      .chap3-audio-btn{left:16px;bottom:16px;width:64px;height:64px}
      .chap3-audio-btn img{width:36px;height:36px}
    }
  `;
  document.head.appendChild(style);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'chap3-audio-btn';
  button.setAttribute('aria-label', 'Activer/Désactiver le son');
  
  // Create the img element for the audio icon
  const img = document.createElement('img');
  img.src = 'images/audio.svg';
  img.alt = '';
  img.setAttribute('aria-hidden', 'true');
  button.appendChild(img);
  document.body.appendChild(button);

  function updateAudioIcon(isPlaying) {
    const img = button.querySelector('img');
    if (isPlaying) {
      img.src = 'images/audio.svg';
      button.setAttribute('aria-label', 'Désactiver le son');
    } else {
      img.src = 'images/no-audio.svg';
      button.setAttribute('aria-label', 'Activer le son');
    }
  }

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
      updateAudioIcon(true);
    } catch (_) {
      updateAudioIcon(false);
    }
  }

  function stopAudio() {
    audio.pause();
    fadeTo(0, 600, () => {
      localStorage.setItem(STORAGE_PLAY, '0');
    });
    updateAudioIcon(false);
  }

  button.addEventListener('click', () => {
    if (audio.paused) {
      startAudio();
    } else {
      stopAudio();
    }
  });

  if (localStorage.getItem(STORAGE_PLAY) === '1') {
    startAudio();
  } else if (localStorage.getItem(STORAGE_PLAY) === '0') {
    // L'utilisateur a explicitement désactivé le son, on le laisse désactivé
    updateAudioIcon(false);
  } else {
    // Première visite, on essaie le autoplay
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
        updateAudioIcon(false);
        window.location.href = target;
      });
    });
  }
})();
