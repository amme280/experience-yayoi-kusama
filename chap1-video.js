(function(){
  document.addEventListener('DOMContentLoaded', () => {
    const fade = document.querySelector('.page-fade');
    const iframe = document.getElementById('yt-iframe');
    const unmuteBtn = document.querySelector('.unmute');
    if(!fade || !iframe) return;

    // Ensure the IFrame API can communicate reliably (requires a real http(s) origin).
    try {
      if(typeof window.location?.origin === 'string' && window.location.origin !== 'null'){
        const url = new URL(iframe.src);
        if(!url.searchParams.get('origin')){
          url.searchParams.set('origin', window.location.origin);
          iframe.src = url.toString();
        }
      } else {
        // If you open the file directly (file://), the API may not work.
        // Use a local server (e.g. VS Code Live Server) for reliable playback control.
        console.warn('YouTube API: file:// origin detected; use a local server for reliable end redirect.');
      }
    } catch (_) {}

    let isRedirecting = false;
    function goToNextPage(){
      if(isRedirecting) return;
      isRedirecting = true;
      fade.classList.add('is-ending');
      fade.classList.add('is-active');
      setTimeout(() => {
        window.location.href = 'interraction_jeu1.html';
      }, 2500);
    }

    let ytPlayer = null;
    let userRequestedSound = false;

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

    function tryEnableSound(){
      if(!ytPlayer) return;
      try { ytPlayer.unMute(); ytPlayer.setVolume(100); } catch (_) {}
      try {
        if(typeof ytPlayer.isMuted === 'function' && ytPlayer.isMuted() === false){
          if(unmuteBtn) unmuteBtn.classList.add('is-hidden');
        }
      } catch (_) {}
    }

    if(unmuteBtn){
      const onUserGesture = () => {
        userRequestedSound = true;
        tryEnableSound();
        // If the browser allows it, hide right away.
        unmuteBtn.classList.add('is-hidden');
      };
      unmuteBtn.addEventListener('click', onUserGesture);
      // Mobile: treat touch as a gesture too
      unmuteBtn.addEventListener('touchstart', onUserGesture, {passive:true});
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

    // Load YouTube IFrame API (used only to attempt unmute after playback starts).
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);

    window.onYouTubeIframeAPIReady = function(){
      const player = new YT.Player('yt-iframe', {
        events: {
          onReady: function(e){
            ytPlayer = e.target;
            // Ensure it plays (muted) without clicking.
            try { e.target.mute(); } catch (_) {}
            try { e.target.playVideo(); } catch (_) {}

            // Start watching the timeline as soon as the API is ready.
            startEndWatcher();

            // If it doesn't start, keep retrying briefly.
            let attempts = 0;
            const timer = setInterval(() => {
              attempts += 1;
              const state = (() => { try { return e.target.getPlayerState(); } catch { return null; } })();
              if(state === YT.PlayerState.PLAYING){
                clearInterval(timer);
                reveal();
                // Keep autoplay reliable: stay muted until user gesture.
                if(userRequestedSound) tryEnableSound();
                return;
              }
              if(attempts >= 10){
                clearInterval(timer);
                reveal();
              } else {
                try { e.target.playVideo(); } catch (_) {}
              }
            }, 250);
          },
          onStateChange: function(ev){
            if(ev.data === YT.PlayerState.PLAYING){
              reveal();
              ytPlayer = ev.target;
              if(userRequestedSound) tryEnableSound();
              startEndWatcher();
            }

            // Fallback: if YouTube reports ENDED, still go next
            if(ev.data === YT.PlayerState.ENDED){
              goToNextPage();
            }
          }
        }
      });
    };
  });
})();
