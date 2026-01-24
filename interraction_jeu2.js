(function(){
  document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('artboard');
    const downloadBtn = document.getElementById('download');
    const resetBtn = document.getElementById('reset');
    const nextLink = document.getElementById('next');
    const fade = document.querySelector('.page-fade');

    if(!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if(!ctx) return;

    const rootStyles = getComputedStyle(document.documentElement);
    const COLOR_MAP = {
      red: rootStyles.getPropertyValue('--color-red').trim() || '#D32D13',
      blue: rootStyles.getPropertyValue('--color-blue').trim() || '#358BC0',
      yellow: rootStyles.getPropertyValue('--color-yellow').trim() || '#FEB70A',
      green: rootStyles.getPropertyValue('--color-green').trim() || '#00BB27',
      black: rootStyles.getPropertyValue('--color-black').trim() || '#1E1E1E'
    };

    const BACKGROUND = rootStyles.getPropertyValue('--color-white').trim() || '#FFFFFF';

    let selected = 'red';
    const swatches = Array.from(document.querySelectorAll('.swatch[data-color]'));
    function setSelected(color){
      selected = COLOR_MAP[color] ? color : 'red';
      swatches.forEach((btn) => {
        const isActive = (btn.getAttribute('data-color') === selected);
        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
    }
    swatches.forEach((btn) => {
      btn.addEventListener('click', () => {
        const c = btn.getAttribute('data-color') || 'red';
        setSelected(c);
      });
    });
    setSelected('red');

    // Canvas sizing (HiDPI)
    function resizeCanvas(){
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const cssW = Math.max(1, Math.floor(canvas.clientWidth));
      const cssH = Math.max(1, Math.floor(canvas.clientHeight));
      const pxW = Math.floor(cssW * dpr);
      const pxH = Math.floor(cssH * dpr);

      if(canvas.width !== pxW || canvas.height !== pxH){
        canvas.width = pxW;
        canvas.height = pxH;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      redraw();
    }

    // Stamps
    /** @type {{x:number,y:number,r:number,color:string}[]} */
    const circles = [];
    /** @type {{x:number,y:number,start:number,base:number,color:string,active:boolean,r:number}|null} */
    let active = null;

    function clearToWhite(){
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = BACKGROUND;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    function drawCircle(c){
      ctx.beginPath();
      ctx.fillStyle = c.color;
      ctx.arc(c.x, c.y, Math.max(0, c.r), 0, Math.PI * 2);
      ctx.fill();
    }

    function redraw(){
      clearToWhite();
      circles.forEach(drawCircle);
      if(active && active.active){
        drawCircle(active);
      }
    }

    function resetArtwork(){
      if(rafId){ cancelAnimationFrame(rafId); rafId = 0; }
      active = null;
      circles.length = 0;
      redraw();
    }

    // Growth loop (only while pressing)
    let rafId = 0;
    function tick(now){
      rafId = 0;
      if(!active || !active.active) return;

      const elapsed = Math.max(0, now - active.start);
      const growthPerMs = 0.06; // ~60px/sec
      const maxR = 520;
      active.r = Math.min(maxR, active.base + elapsed * growthPerMs);
      redraw();
      rafId = requestAnimationFrame(tick);
    }

    function startTick(){
      if(rafId) return;
      rafId = requestAnimationFrame(tick);
    }

    function getCanvasPoint(evt){
      const rect = canvas.getBoundingClientRect();
      return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
      };
    }

    canvas.addEventListener('pointerdown', (evt) => {
      // Prevent right click / unintended gestures
      if(evt.button !== 0) return;
      evt.preventDefault();
      canvas.setPointerCapture?.(evt.pointerId);

      const p = getCanvasPoint(evt);
      const color = COLOR_MAP[selected] || COLOR_MAP.red;
      active = {
        x: p.x,
        y: p.y,
        start: performance.now(),
        base: 8,
        r: 8,
        color,
        active: true
      };
      redraw();
      startTick();
    });

    function endPress(){
      if(!active || !active.active) return;
      // Commit the circle
      circles.push({ x: active.x, y: active.y, r: active.r, color: active.color });
      active.active = false;
      active = null;
      if(rafId){ cancelAnimationFrame(rafId); rafId = 0; }
      redraw();
    }

    canvas.addEventListener('pointerup', (evt) => {
      evt.preventDefault();
      endPress();
    });
    canvas.addEventListener('pointercancel', endPress);
    canvas.addEventListener('pointerleave', (evt) => {
      // If the pointer is captured, leaving shouldn't end it.
      if(active && active.active && canvas.hasPointerCapture?.(evt.pointerId)) return;
      endPress();
    });

    // Download
    if(downloadBtn){
      downloadBtn.addEventListener('click', () => {
        // Make sure we're not in the middle of a press.
        endPress();
        try {
          const url = canvas.toDataURL('image/png');
          const a = document.createElement('a');
          a.href = url;
          a.download = 'kusama-oeuvre.png';
          document.body.appendChild(a);
          a.click();
          a.remove();
        } catch (_) {
          // noop
        }
      });
    }

    // Reset
    if(resetBtn){
      resetBtn.addEventListener('click', () => {
        endPress();
        resetArtwork();
      });
    }

    // Next page with fade
    if(nextLink && fade){
      nextLink.addEventListener('click', (e) => {
        e.preventDefault();
        fade.classList.add('is-active');
        const href = nextLink.getAttribute('href') || 'index.html';
        setTimeout(() => {
          window.location.href = href;
        }, 300);
      });
    }

    // Initial paint
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  });
})();
