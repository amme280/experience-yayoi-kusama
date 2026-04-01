(function(){
  document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('start-modal');
    const enterBtn = document.getElementById('enter-btn');
    const returnHome = document.getElementById('return-home');
    const videoEl = document.getElementById('video-360');

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
  });
})();
