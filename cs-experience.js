/* ============================================================
   CASE STUDY EXPERIENCE — shared layer for the enterprise pages
   (watchtower · ai-access · risk-control)

   Lenis smooth scroll · hero word choreography · accent reading
   progress · cursor-following ambient glow · image tilt.
   Everything degrades to static content without GSAP / with
   reduced motion.
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGsap = typeof window.gsap !== 'undefined';
  var hasST = typeof window.ScrollTrigger !== 'undefined';

  if (hasGsap && hasST) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  /* pages with their own experience script (Sous Pantry) already run Lenis */
  var hasOwnSmooth = !!document.querySelector('.sp-hero');
  var lenis = null;
  if (!reduceMotion && !hasOwnSmooth && typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1.0 });
    if (hasGsap && hasST) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(time) { lenis.raf(time); requestAnimationFrame(raf); })(0);
    }
  }

  if (!hasGsap || !hasST || reduceMotion) return; // static is fine

  /* ---------- Reading progress (accent) ---------- */
  (function progress() {
    var bar = document.createElement('div');
    bar.className = 'csx-progress';
    document.body.appendChild(bar);
    gsap.fromTo(bar, { scaleX: 0 }, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: { start: 0, end: 'max', scrub: 0.3 }
    });
  })();

  /* ---------- Cursor-following ambient glow ---------- */
  (function glow() {
    if (!finePointer) return;
    var el = document.createElement('div');
    el.className = 'csx-glow';
    document.body.appendChild(el);
    var gx = gsap.quickTo(el, '--gx', { duration: 0.7, ease: 'power2.out' });
    var gy = gsap.quickTo(el, '--gy', { duration: 0.7, ease: 'power2.out' });
    // seed off-screen until first movement
    gsap.set(el, { '--gx': -600, '--gy': -600 });
    window.addEventListener('mousemove', function (e) {
      gx(e.clientX);
      gy(e.clientY);
    }, { passive: true });
  })();

  /* ---------- Hero choreography ---------- */
  (function hero() {
    var title = document.querySelector('.cs-hero-title');
    if (title && !title.querySelector('.csx-w')) {
      var words = title.textContent.trim().split(/\s+/);
      title.setAttribute('aria-label', title.textContent.trim());
      title.innerHTML = words.map(function (w) {
        return '<span class="csx-w" aria-hidden="true"><span class="csx-wi">' + w + '</span></span>';
      }).join(' ');
    }

    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    if (title) {
      tl.fromTo('.csx-wi', { yPercent: 115 }, { yPercent: 0, duration: 0.9, stagger: 0.035 }, 0.1);
    }
    tl.from('.cs-back', { opacity: 0, x: -14, duration: 0.6 }, 0.1)
      .from('.cs-meta .cs-tag', { opacity: 0, y: 10, scale: 0.9, duration: 0.45, stagger: 0.07, ease: 'back.out(2)' }, 0.25)
      .from('.cs-hero-subtitle', { opacity: 0, y: 18, duration: 0.8 }, 0.55)
      .from('.cs-info-item', { opacity: 0, y: 16, duration: 0.6, stagger: 0.08 }, 0.7);
  })();

  /* ---------- Image tilt toward the cursor ---------- */
  (function tilt() {
    if (!finePointer) return;
    gsap.utils.toArray('.cs-image').forEach(function (wrap) {
      var img = wrap.querySelector('img');
      if (!img) return;
      wrap.style.perspective = '900px';
      var rx = gsap.quickTo(img, 'rotationX', { duration: 0.5, ease: 'power2.out' });
      var ry = gsap.quickTo(img, 'rotationY', { duration: 0.5, ease: 'power2.out' });
      var sc = gsap.quickTo(img, 'scale', { duration: 0.5, ease: 'power2.out' });
      wrap.addEventListener('mousemove', function (e) {
        var r = wrap.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 5);
        rx(-((e.clientY - r.top) / r.height - 0.5) * 4);
        sc(1.015);
      });
      wrap.addEventListener('mouseleave', function () { rx(0); ry(0); sc(1); });
    });
  })();

  /* ---------- Quote accent bars draw in ---------- */
  gsap.utils.toArray('.cs-quote').forEach(function (q) {
    gsap.from(q, {
      '--quote-bar': 0,
      duration: 0.9,
      ease: 'power2.out',
      scrollTrigger: { trigger: q, start: 'top 82%', once: true }
    });
  });

  /* ---------- Honest measurements (hidden-tab guard) ---------- */
  var refreshPending = false;
  function safeRefresh() {
    if (window.innerHeight > 0) { refreshPending = false; ScrollTrigger.refresh(); }
    else refreshPending = true;
  }
  window.addEventListener('resize', function () { if (refreshPending) safeRefresh(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden && refreshPending) safeRefresh(); });
  window.addEventListener('load', safeRefresh);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(safeRefresh);
})();
