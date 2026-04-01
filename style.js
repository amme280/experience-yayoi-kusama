// style.js - adds gentle floating animation to decorative circles and scroll behavior
// style.js - stronger floating, more/larger circles, and a safe text zone
// style.js - non-overlapping vertical hover and tightened safe zone
// style.js - layout based on the provided maquette (1920x1080)
(function(){
  document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.circles');
    const heroContent = document.querySelector('.hero-content');
    const PROGRESS_KEY = 'kusama_progress';

    function getDefaultProgress(){
      return {
        unlockedThrough: 1,
        completed: {
          '1': false,
          '2': false,
          '3': false,
          '4': false
        }
      };
    }

    function normalizeProgress(value){
      const base = getDefaultProgress();
      const src = value && typeof value === 'object' ? value : {};
      const rawUnlock = Number(src.unlockedThrough);
      const unlockedThrough = Number.isFinite(rawUnlock)
        ? Math.max(1, Math.min(4, Math.floor(rawUnlock)))
        : 1;

      const completedSrc = src.completed && typeof src.completed === 'object' ? src.completed : {};

      return {
        unlockedThrough,
        completed: {
          '1': Boolean(completedSrc['1']),
          '2': Boolean(completedSrc['2']),
          '3': Boolean(completedSrc['3']),
          '4': Boolean(completedSrc['4'])
        }
      };
    }

    function readProgress(){
      try {
        const raw = window.localStorage.getItem(PROGRESS_KEY);
        if(!raw){
          const initial = getDefaultProgress();
          window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(initial));
          return initial;
        }
        return normalizeProgress(JSON.parse(raw));
      } catch (_) {
        return getDefaultProgress();
      }
    }

    function writeProgress(progress){
      const normalized = normalizeProgress(progress);
      try {
        window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(normalized));
      } catch (_) {}
      return normalized;
    }

    function completeChapter(chapterNumber){
      const chapter = Number(chapterNumber);
      if(!Number.isFinite(chapter)) return readProgress();

      const current = readProgress();
      const next = {
        unlockedThrough: current.unlockedThrough,
        completed: { ...current.completed }
      };

      if(chapter >= 1 && chapter <= 4){
        next.completed[String(chapter)] = true;
      }

      if(chapter >= 1 && chapter <= 3){
        next.unlockedThrough = Math.max(next.unlockedThrough, chapter + 1);
      }

      if(chapter >= 4){
        next.unlockedThrough = 4;
      }

      return writeProgress(next);
    }

    function resetProgress(){
      return writeProgress(getDefaultProgress());
    }

    // Outils de test accessibles dans la console navigateur.
    window.kusamaProgress = {
      get: readProgress,
      reset: resetProgress,
      completeChapter,
      unlockAll: () => writeProgress({
        unlockedThrough: 4,
        completed: { '1': true, '2': true, '3': true, '4': true }
      })
    };

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
    const chapterLinks = [
      { element: document.getElementById('chap1-link'), chapter: 1 },
      { element: document.getElementById('chap2-link'), chapter: 2 },
      { element: document.getElementById('chap3-link'), chapter: 3 },
      { element: document.getElementById('chap4-link'), chapter: 4 }
    ].filter((item) => item.element);

    function applyChapterLockState(){
      const progress = readProgress();
      chapterLinks.forEach(({ element, chapter }) => {
        const isLocked = chapter > progress.unlockedThrough;
        element.classList.toggle('is-locked', isLocked);
        element.setAttribute('aria-disabled', isLocked ? 'true' : 'false');
        if(isLocked){
          element.setAttribute('tabindex', '-1');
        } else {
          element.removeAttribute('tabindex');
        }
      });
    }

    function bindChapterNav(element, chapter){
      if(!element) return;
      element.addEventListener('click', (e) => {
        const progress = readProgress();
        if(chapter > progress.unlockedThrough){
          e.preventDefault();
          return;
        }

        if(!pageFade) return;
        e.preventDefault();
        pageFade.classList.add('is-active');
        const target = element.getAttribute('href') || 'index.html';
        setTimeout(() => {
          window.location.href = target;
        }, 300);
      });
    }

    applyChapterLockState();
    chapterLinks.forEach(({ element, chapter }) => bindChapterNav(element, chapter));

  });
})();
