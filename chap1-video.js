(function(){
  document.addEventListener('DOMContentLoaded', () => {
    const fade = document.querySelector('.page-fade');
    const iframe = document.getElementById('yt-iframe');
    const stage = document.querySelector('.video-stage');
    const soundGate = document.querySelector('.sound-gate');
    const soundGateBtn = document.querySelector('.sound-gate-btn');
    if(!fade || !iframe) return;

    function requestFullscreen(){
      const el = stage || iframe;
      if(!el) return;
      try {
        if(document.fullscreenElement) return;
        const fn = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
        if(typeof fn === 'function') fn.call(el);
      } catch (_) {}
    }

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

    // Reveal quickly even  if the API doesn't load.
    setTimeout(reveal, 250);

    // Ensure the IFrame API can communicate reliably (requires a real http(s) origin).
    try {
      if(typeof window.location?.origin === 'string' && window.location.origin !== 'null'){
        const url = new URL(iframe.src);
        if(!url.searchParams.get('origin')){
          url.searchParams.set('origin', window.location.origin);
          iframe.src = url.toString();
        }
      }
    } catch (_) {}

    // Load YouTube IFrame API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);

    let ytPlayer = null;

    // End-of-video watcher (avoid endscreen)
    let endWatchTimer = null;
    function startEndWatcher(){
      if(endWatchTimer || !ytPlayer) return;
      endWatchTimer = setInterval(() => {
        if(isRedirecting){ clearInterval(endWatchTimer); endWatchTimer = null; return; }
        try {
          const duration = ytPlayer.getDuration();
          const current = ytPlayer.getCurrentTime();
          if(duration && duration > 0 && current >= (duration - 0.8)){
            clearInterval(endWatchTimer);
            endWatchTimer = null;
            goToNextPage();
          }
        } catch (_) {}
      }, 200);
    }

    let pendingStart = false;
    function startPlaybackWithSound(){
      if(!ytPlayer) return;
      hideSoundGate();
      try { ytPlayer.unMute(); ytPlayer.setVolume(100); } catch (_) {}
      try { ytPlayer.playVideo(); } catch (_) {}
    }

    window.onYouTubeIframeAPIReady = function(){
      ytPlayer = new YT.Player('yt-iframe', {
        events: {
          onReady: function(e){
            ytPlayer = e.target;
            // Ensure it doesn't start by itself.
            try { ytPlayer.mute(); } catch (_) {}
            try { ytPlayer.pauseVideo(); } catch (_) {}

            if(pendingStart){
              pendingStart = false;
              startPlaybackWithSound();
            }
          },
          onStateChange: function(ev){
            if(ev.data === YT.PlayerState.PLAYING){
              reveal();
              startEndWatcher();
            }
            if(ev.data === YT.PlayerState.ENDED){
              goToNextPage();
            }
          }
        }
      });
    };

    if(soundGateBtn){
      soundGateBtn.addEventListener('click', () => {
        reveal();
        // Fullscreen is only allowed on a user gesture.
        requestFullscreen();
        if(!ytPlayer){
          pendingStart = true;
          return;
        }
        startPlaybackWithSound();
      });
    }
  });
})();
