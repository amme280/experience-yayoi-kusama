(function(){
  document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('start-modal');
    const enterBtn = document.getElementById('enter-btn');
    const returnHome = document.getElementById('return-home');
    const skipBtn = document.querySelector('.info-modal__btn--skip');
    const videoEl = document.getElementById('video-360');
    const backgroundMusic = new Audio('music/musique_360.wav');

    backgroundMusic.loop = true;
    backgroundMusic.preload = 'auto';
    backgroundMusic.volume = 0.6;

    if(!modal || !enterBtn || !returnHome || !videoEl) return;

    let didStart = false;
    let didShowReturn = false;
    let player = null;
    let watcherBound = false;
    let arrowTimer = null;

    function showReturnArrow(){
      if(didShowReturn) return;
      didShowReturn = true;
      returnHome.classList.add('is-visible');
    }

    function hideModal(){
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
    }

    function bindArrowAfterFiveSeconds(){
      if(watcherBound) return;
      watcherBound = true;

      const checkAndShow = () => {
        if(videoEl.currentTime >= 5){
          showReturnArrow();
        }
      };

      if(player && typeof player.on === 'function'){
        player.on('timeupdate', checkAndShow);
      }

      videoEl.addEventListener('timeupdate', checkAndShow);
    }

    function initPannellum(){
      if(player || typeof window.videojs !== 'function') return;

      player = window.videojs('video-360', {
        autoplay: false,
        controls: false,
        loop: true,
        plugins: {
          pannellum: {}
        }
      });
    }

    function startExperience(){
      if(didStart) return;
      didStart = true;
      hideModal();

      try {
        const musicPromise = backgroundMusic.play();
        if(musicPromise && typeof musicPromise.catch === 'function'){
          musicPromise.catch(() => {});
        }
      } catch (_) {}

      initPannellum();
      bindArrowAfterFiveSeconds();

      if(!arrowTimer){
        arrowTimer = setTimeout(showReturnArrow, 5000);
      }

      try {
        if(player){
          player.muted(false);
          player.volume(1);
          const playPromise = player.play();
          if(playPromise && typeof playPromise.catch === 'function'){
            playPromise.catch(() => {});
          }
        } else {
          videoEl.muted = false;
          videoEl.volume = 1;
          const playPromise = videoEl.play();
          if(playPromise && typeof playPromise.catch === 'function'){
            playPromise.catch(() => {});
          }
        }
      } catch (_) {}
    }

    enterBtn.addEventListener('click', startExperience);

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
