(function(){
  document.addEventListener('DOMContentLoaded', () => {
    const fade = document.querySelector('.page-fade');
    const video = document.getElementById('local-video');
    const soundGate = document.querySelector('.sound-gate');
    const soundGateBtn = document.querySelector('.sound-gate-btn');
    if(!fade || !video) return;

    let isRedirecting = false;
    function goToNextPage(){
      if(isRedirecting) return;
      isRedirecting = true;
      fade.classList.add('is-ending');
      fade.classList.add('is-active');
      setTimeout(() => {
        window.location.href = 'interraction_jeu1.html';
      }, 600);
    }

    function showSoundGate(){
      if(!soundGate) return;
      soundGate.classList.add('is-active');
      soundGate.setAttribute('aria-hidden', 'false');
    }

    function hideSoundGate(){
      if(!soundGate) return;
      soundGate.classList.remove('is-active');
      soundGate.setAttribute('aria-hidden', 'true');
    }

    let didReveal = false;
    function reveal(){
      if(didReveal) return;
      didReveal = true;
      requestAnimationFrame(() => {
        fade.classList.remove('is-active');
      });
    }

    // Reveal quickly even if the API doesn't load.
    setTimeout(reveal, 250);

    // End-of-video watcher (avoid last-frame delay before redirect)
    let endWatchTimer = null;
    function startEndWatcher(){
      if(endWatchTimer) return;
      endWatchTimer = setInterval(() => {
        if(isRedirecting){ clearInterval(endWatchTimer); endWatchTimer = null; return; }
        const duration = video.duration;
        const current = video.currentTime;
        if(Number.isFinite(duration) && duration > 0 && current >= (duration - 0.8)){
          clearInterval(endWatchTimer);
          endWatchTimer = null;
          goToNextPage();
        }
      }, 200);
    }

    video.addEventListener('play', () => {
      reveal();
      startEndWatcher();
    });

    video.addEventListener('ended', () => {
      goToNextPage();
    });

    // Autoplay with sound attempt.
    // If blocked, we pause and show a visible CTA button to enable sound.
    (async () => {
      try {
        video.muted = false;
        video.volume = 1;
        await video.play();

        // Some browsers may force mute even if play() resolves.
        setTimeout(() => {
          if(video.muted){
            try { video.pause(); } catch (_) {}
            reveal();
            showSoundGate();
          }
        }, 100);
      } catch (_) {
        try { video.pause(); } catch (_) {}
        reveal();
        showSoundGate();
      }
    })();

    if(soundGateBtn){
      soundGateBtn.addEventListener('click', async () => {
        hideSoundGate();
        try {
          video.muted = false;
          video.volume = 1;
          await video.play();
        } catch (_) {
          // If it still fails (rare), keep the gate visible.
          showSoundGate();
        }
      });
    }
  });
})();
