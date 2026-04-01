(function(){
  document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('start-modal');
    const enterBtn = document.getElementById('enter-btn');
    const returnHome = document.getElementById('return-home');
    const skipBtn = document.querySelector('.info-modal__btn--skip');
    const immersiveRoot = document.querySelector('.immersive');
    const previewEl = document.getElementById('video-preview');
    const videoEl = document.getElementById('video-360');
    const backgroundMusic = new Audio('music/musique_360.wav');

    backgroundMusic.loop = true;
    backgroundMusic.preload = 'auto';
    backgroundMusic.volume = 0.6;

    if(!modal || !enterBtn || !returnHome || !videoEl || !previewEl || !immersiveRoot) return;

    let didStart = false;
    let didShowReturn = false;
    let player = null;
    let watcherBound = false;
    let didRevealExperience = false;

    function debugLog(message, extra){
      if(typeof extra === 'undefined'){
        console.log('[immersion-360]', message);
      } else {
        console.log('[immersion-360]', message, extra);
      }
    }

    function debugWarn(message, extra){
      if(typeof extra === 'undefined'){
        console.warn('[immersion-360]', message);
      } else {
        console.warn('[immersion-360]', message, extra);
      }
    }

    function revealExperience(){
      if(didRevealExperience) return;
      didRevealExperience = true;
      immersiveRoot.classList.add('is-active');
      previewEl.classList.add('is-hidden');
      debugLog('Apercu masque, immersion visible.');
    }

    function showReturnArrow(){
      if(didShowReturn) return;
      didShowReturn = true;
      returnHome.classList.add('is-visible');
    }

    function hideModal(){
      try { enterBtn.blur(); } catch(_) {}
      modal.classList.remove('is-open');
    }

    function bindArrow(){
      if(watcherBound) return;
      watcherBound = true;
      const check = () => {
        const t = player ? (Number(player.currentTime()) || 0) : (Number(videoEl.currentTime) || 0);
        if(t >= 5) showReturnArrow();
      };
      if(player) player.on('timeupdate', check);
      videoEl.addEventListener('timeupdate', check);
    }

    // --- Initialisation du player au chargement de la page ---
    // La vidéo précharge pendant que le modal est affiché.
    // Au clic Entrer, player.play() est appelé directement → Pannellum a des frames réelles.
    function initPlayer(){
      if(typeof window.videojs !== 'function') return;
      try {
        player = window.videojs('video-360', {
          autoplay: false,
          controls: false,
          loop: true,
          plugins: { pannellum: {} }
        });
        player.on('playing', () => { revealExperience(); });
        player.on('timeupdate', () => {
          if((Number(player.currentTime()) || 0) > 0.1) revealExperience();
        });
        player.on('error', () => {
          console.warn('[immersion-360] Player error.');
        });
        console.log('[immersion-360] Player initialise au chargement.');
      } catch(err) {
        console.warn('[immersion-360] Echec init player.', err);
        player = null;
      }
    }

    initPlayer();

    function startBackgroundMusic(){
      try {
        const p = backgroundMusic.play();
        if(p && p.catch) p.catch(() => {});
      } catch(_) {}
    }

    function startExperience(){
      if(didStart) return;
      didStart = true;
      hideModal();
      startBackgroundMusic();
      bindArrow();
      setTimeout(showReturnArrow, 5000);

      if(player){
        console.log('[immersion-360] Lancement player.');
        player.muted(false);
        player.volume(1);
        const p = player.play();
        if(p && p.catch) p.catch(() => {
          console.warn('[immersion-360] play() bloque.');
        });
      } else {
        console.log('[immersion-360] Lecture video native.');
        try {
          videoEl.muted = false;
          videoEl.volume = 1;
          videoEl.addEventListener('playing', revealExperience, { once: true });
          const p = videoEl.play();
          if(p && p.catch) p.catch(() => {});
        } catch(_) {}
      }
    }

    enterBtn.addEventListener('click', () => {
      startExperience();
    });

    function completeChapter1(){
      const KEY = 'kusama_progress';
      const fallback = {
        unlockedThrough: 1,
        completed: { '1': false, '2': false, '3': false, '4': false }
      };
      try {
        const parsed = JSON.parse(window.localStorage.getItem(KEY) || 'null') || fallback;
        const progress = {
          unlockedThrough: Math.max(2, Number(parsed.unlockedThrough) || 1),
          completed: {
            '1': true,
            '2': Boolean(parsed?.completed?.['2']),
            '3': Boolean(parsed?.completed?.['3']),
            '4': Boolean(parsed?.completed?.['4'])
          }
        };
        window.localStorage.setItem(KEY, JSON.stringify(progress));
      } catch (_) {}
    }

    function stopBackgroundMusic(){
      try {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
      } catch (_) {}
    }

    if(returnHome){
      returnHome.addEventListener('click', () => {
        completeChapter1();
        stopBackgroundMusic();
      });
    }

    if(skipBtn){
      skipBtn.addEventListener('click', () => {
        completeChapter1();
        stopBackgroundMusic();
      });
    }

    window.addEventListener('pagehide', stopBackgroundMusic);
  });
})();
