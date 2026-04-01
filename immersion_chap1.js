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
    let pannellumInitialized = false;
    let watcherBound = false;
    let arrowTimer = null;
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

    function bindVideoDiagnostics(){
      const events = ['loadstart', 'loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough', 'waiting', 'stalled', 'error'];
      events.forEach((eventName) => {
        videoEl.addEventListener(eventName, () => {
          if(eventName === 'error'){
            debugWarn('Erreur video', videoEl.error ? videoEl.error.code : 'inconnue');
            return;
          }
          debugLog(`Video event: ${eventName}`);
        });
      });
    }

    bindVideoDiagnostics();

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
      try {
        enterBtn.blur();
      } catch (_) {}
      modal.classList.remove('is-open');
    }

    function bindArrowAfterFiveSeconds(){
      if(watcherBound) return;
      watcherBound = true;

      const checkAndShow = () => {
        const currentTime = (player && typeof player.currentTime === 'function')
          ? Number(player.currentTime()) || 0
          : Number(videoEl.currentTime) || 0;

        if(currentTime >= 5){
          showReturnArrow();
        }
      };

      if(player && typeof player.on === 'function'){
        player.on('timeupdate', checkAndShow);
      }

      videoEl.addEventListener('timeupdate', checkAndShow);
    }

    function waitForMetadata(timeoutMs){
      return new Promise((resolve) => {
        let done = false;
        let timer = 0;

        function finish(ok){
          if(done) return;
          done = true;
          window.clearTimeout(timer);
          videoEl.removeEventListener('canplay', onCanPlay);
          videoEl.removeEventListener('error', onError);
          resolve(ok);
        }

        if(videoEl.readyState >= 3){
          debugLog('Video deja prete (readyState >= 3).');
          finish(true);
          return;
        }

        function onCanPlay(){ 
          debugLog('Video prete a jouer (canplay).');
          finish(true); 
        }
        function onError(){ 
          debugWarn('Erreur chargement video.');
          finish(false); 
        }

        videoEl.addEventListener('canplay', onCanPlay);
        videoEl.addEventListener('error', onError);
        timer = window.setTimeout(() => {
          debugWarn('Timeout attente video.');
          finish(false);
        }, timeoutMs);

        try { videoEl.load(); } catch (_) {}
      });
    }

    function initPannellum(){
      if(pannellumInitialized) return Boolean(player);
      if(typeof window.videojs !== 'function'){
        debugWarn('Video.js indisponible, fallback natif.');
        return false;
      }

      try {
        player = window.videojs('video-360', {
          autoplay: false,
          controls: false,
          loop: true,
          plugins: {
            pannellum: {}
          }
        });

        player.on('loadeddata', () => {
          debugLog('Player event: loadeddata');
        });
        player.on('canplay', () => {
          debugLog('Player event: canplay');
        });
        player.on('play', () => {
          debugLog('Player event: play');
        });
        player.on('playing', () => {
          debugLog('Player event: playing');
          revealExperience();
        });
        player.on('timeupdate', () => {
          if((Number(player.currentTime()) || 0) > 0.05){
            revealExperience();
          }
        });
        player.on('error', () => {
          debugWarn('Player error', player.error ? player.error() : 'inconnue');
        });

        if(videoEl.readyState >= 2){
          debugLog('Synchronisation Pannellum sur loadeddata deja recu.');
          player.trigger('loadeddata');
        }

        if(videoEl.readyState >= 3){
          debugLog('Synchronisation Pannellum sur canplay deja recu.');
          player.trigger('canplay');
        }

        pannellumInitialized = true;
        debugLog('Pannellum initialise.');
        return true;
      } catch (err) {
        debugWarn('Echec initialisation Pannellum, fallback natif.', err);
        return false;
      }
    }

    function startBackgroundMusic(){
      try {
        const musicPromise = backgroundMusic.play();
        if(musicPromise && typeof musicPromise.catch === 'function'){
          musicPromise.catch((err) => {
            debugWarn('Lecture musique bloquee.', err);
          });
        }
      } catch (err) {
        debugWarn('Impossible de lancer la musique.', err);
      }
    }

    function playVideoNative(){
      try {
        videoEl.muted = false;
        videoEl.volume = 1;
        const playPromise = videoEl.play();
        if(playPromise && typeof playPromise.catch === 'function'){
          playPromise.catch((err) => {
            debugWarn('Lecture video native bloquee.', err);
          });
        }
      } catch (err) {
        debugWarn('Echec lecture video native.', err);
      }
    }

    videoEl.addEventListener('playing', revealExperience);
    videoEl.addEventListener('timeupdate', () => {
      if((Number(videoEl.currentTime) || 0) > 0.05){
        revealExperience();
      }
    });

    function playBestVideo(){
      if(player){
        try {
          debugLog('Tentative lecture Pannellum.');
          player.muted(false);
          player.volume(1);
          if(player.pnlmViewer && typeof player.pnlmViewer.setUpdate === 'function' && videoEl.readyState > 1){
            player.pnlmViewer.setUpdate(true);
          }
          const playPromise = player.play();
          if(playPromise && typeof playPromise.catch === 'function'){
            playPromise.catch((err) => {
              debugWarn('Lecture Pannellum bloquee, fallback natif.', err);
              playVideoNative();
            });
          }
          return;
        } catch (err) {
          debugWarn('Echec player Pannellum, fallback natif.', err);
        }
      }
      playVideoNative();
    }

    async function startExperience(){
      if(didStart) return;
      didStart = true;
      hideModal();

      debugLog('Demarrage immersion.');
      startBackgroundMusic();

      bindArrowAfterFiveSeconds();

      if(!arrowTimer){
        arrowTimer = setTimeout(showReturnArrow, 5000);
      }

      const metadataReady = await waitForMetadata(12000);
      if(!metadataReady){
        debugWarn('Metadonnees video indisponibles, tentative lecture native.');
        playVideoNative();
        return;
      }

      initPannellum();
      playBestVideo();
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
