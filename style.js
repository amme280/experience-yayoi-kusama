// style.js - adds gentle floating animation to decorative circles and scroll behavior
// style.js - stronger floating, more/larger circles, and a safe text zone
// style.js - non-overlapping vertical hover and tightened safe zone
// style.js - layout based on the provided maquette (1920x1080)
(function(){
  document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.circles');
    const heroContent = document.querySelector('.hero-content');

    // precise layout array (percent positions for a 1920x1080 base)
    const layout = [
      {x:3, y:8, size:'c-large', color:'c-yellow'},
      {x:24, y:18, size:'c-large', color:'c-red'},
      {x:50, y:6, size:'c-small', color:'c-blue'},
      {x:62, y:12, size:'c-medium', color:'c-green'},
      {x:88, y:8, size:'c-xlarge', color:'c-red'},
      {x:10, y:54, size:'c-small', color:'c-blue'},
      {x:4, y:96, size:'c-large', color:'c-red'},
      {x:24, y:78, size:'c-large', color:'c-green'},
      {x:50, y:86, size:'c-small', color:'c-yellow'},
      {x:74, y:86, size:'c-medium', color:'c-blue'},
      {x:88, y:70, size:'c-xlarge', color:'c-yellow'},
      {x:82, y:36, size:'c-medium', color:'c-blue'},
      {x:74, y:28, size:'c-small', color:'c-green'}
    ];

    // clear existing and create exact elements 
    container.innerHTML = '';
    layout.forEach((it) => {
      const d = document.createElement('div');
      d.className = `circle ${it.size} ${it.color}`;
      d.style.left = `${it.x}%`;
      d.style.top = `${it.y}%`;
      container.appendChild(d);
    });

    // gentle vertical hover for each circle
    const circles = Array.from(document.querySelectorAll('.circle'));
    circles.forEach((c, i) => {
      const rect = c.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const rangeY = Math.max(8, Math.min(32, Math.round(size * 0.12)));
      const speed = 4 + (i % 3) * 0.8; // slight variation but gentle
      c.style.transition = `transform ${speed}s ease-in-out`;
      let dir = i % 2 === 0 ? 1 : -1;
      function animate(){
        const ty = (Math.random() * rangeY - rangeY/2) * dir;
        c.style.transform = `translate(-50%, calc(-50% + ${ty}px))`;
        dir *= -1;
        setTimeout(animate, speed * 1000 + 200);
      }
      setTimeout(animate, i * 100);
    });

    // ensure placement doesn't overlap hero-content: if any circle overlaps, nudge vertically
    function nudgeClearSafe(){
      const safe = (function(){
        if(!heroContent) return null;
        const r = heroContent.getBoundingClientRect();
        const padX = Math.max(24, r.width * 0.04);
        const padY = Math.max(20, r.height * 0.03);
        return {left: r.left - padX, top: r.top - padY, right: r.right + padX, bottom: r.bottom + padY};
      })();
      if(!safe) return;
      circles.forEach(c => {
        const r = c.getBoundingClientRect();
        const cx = r.left + r.width/2;
        const cy = r.top + r.height/2;
        if(cx >= safe.left && cx <= safe.right && cy >= safe.top && cy <= safe.bottom){
          // nudge up or down depending where it is
          const toTop = cy > (safe.top + safe.bottom)/2 ? safe.bottom + r.height : safe.top - r.height;
          // convert px to percent and set top
          const newY = Math.max(2, Math.min(98, (toTop / window.innerHeight) * 100));
          c.style.top = `${newY}%`;
        }
      });
    }

    // run on load and resize
    nudgeClearSafe();
    window.addEventListener('resize', () => { nudgeClearSafe(); });

    // scroll button
    const btn = document.querySelector('.scroll-down');
    const target = document.getElementById('chapitrage');
    if(btn && target){
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        target.scrollIntoView({behavior:'smooth', block: 'center'});
      });
    }

    // chapter navigation: fade to white before leaving the page
    const pageFade = document.querySelector('.page-fade');
    const chap1Link = document.getElementById('chap1-link');
    const chap2Link = document.getElementById('chap2-link');
    const chap3Link = document.getElementById('chap3-link');

    function bindFadeNav(link){
      if(!link || !pageFade) return;
      link.addEventListener('click', (e) => {
        e.preventDefault();
        pageFade.classList.add('is-active');
        setTimeout(() => {
          window.location.href = link.href;
        }, 300);
      });
    }

    bindFadeNav(chap1Link);
    bindFadeNav(chap2Link);
    bindFadeNav(chap3Link);

    // Language popup (visual only for now)
    const langModal = document.getElementById('lang-modal');
    if(langModal){
      const STORAGE_LANG_KEY = 'kusama_lang';
      const langToggleBtn = document.getElementById('lang-toggle');

      function safeGet(key){
        try {
          return window.localStorage.getItem(key);
        } catch (_) {
          try { return window.sessionStorage.getItem(key); } catch (_) { return null; }
        }
      }

      function safeSet(key, value){
        try {
          window.localStorage.setItem(key, value);
          return;
        } catch (_) {}
        try { window.sessionStorage.setItem(key, value); } catch (_) {}
      }

      function openLangModal(){
        langModal.classList.add('is-open');
        langModal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('is-modal-open');
      }

      function closeLangModal(){
        langModal.classList.remove('is-open');
        langModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('is-modal-open');
      }

      function setLanguage(lang){
        const normalized = (lang === 'en' || lang === 'fr') ? lang : 'fr';
        safeSet(STORAGE_LANG_KEY, normalized);

        if(langToggleBtn){
          langToggleBtn.setAttribute('data-lang', normalized);
          const txt = langToggleBtn.querySelector('.lang-toggle__text');
          if(txt) txt.textContent = normalized === 'en' ? 'En' : 'Fr';
        }
      }

      // Always show on the homepage for now (dev mode).
      openLangModal();

      // Initialize toggle state from storage.
      setLanguage(safeGet(STORAGE_LANG_KEY) || 'fr');

      const buttons = Array.from(langModal.querySelectorAll('[data-lang]'));
      buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
          const lang = btn.getAttribute('data-lang') || 'fr';
          setLanguage(lang);
          closeLangModal();
        });
      });

      if(langToggleBtn){
        langToggleBtn.addEventListener('click', () => {
          const current = safeGet(STORAGE_LANG_KEY) || 'fr';
          const next = current === 'en' ? 'fr' : 'en';
          setLanguage(next);
        });
      }
    }
  });
})();
