/* ============================================================
   CASE STUDY IMPACT — shared animation layer
   Stat cards rise in, values "decrypt" in mono glyphs,
   accent bar draws, cards tilt subtly toward the cursor.
   Safe without GSAP / with reduced motion (static fallback).
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined';
  var hasST = typeof window.ScrollTrigger !== 'undefined';
  if (!hasGsap || !hasST || reduceMotion) return; // cards are fully styled statically

  gsap.registerPlugin(ScrollTrigger);

  var GLYPHS = '#%&<>*+01';

  gsap.utils.toArray('.cs-stat').forEach(function (card, i) {
    /* rise + fade in, staggered within each row */
    gsap.from(card, {
      y: 28,
      opacity: 0,
      duration: 0.75,
      ease: 'power3.out',
      delay: (i % 3) * 0.09,
      scrollTrigger: { trigger: card, start: 'top 86%', once: true }
    });

    /* accent bar draws from top */
    gsap.from(card, {
      '--bar-scale': 0,
      duration: 0.9,
      ease: 'power2.out',
      delay: (i % 3) * 0.09 + 0.15,
      scrollTrigger: { trigger: card, start: 'top 86%', once: true }
    });

    /* value decrypts: glyphs churn, resolve left → right */
    var val = card.querySelector('.cs-stat-value');
    if (val) {
      var finalText = val.textContent;
      ScrollTrigger.create({
        trigger: card,
        start: 'top 86%',
        once: true,
        onEnter: function () {
          var obj = { p: 0 };
          gsap.to(obj, {
            p: 1,
            duration: 0.85 + Math.min(finalText.length * 0.02, 0.5),
            ease: 'power2.out',
            delay: (i % 3) * 0.09,
            onUpdate: function () {
              var solved = Math.floor(obj.p * finalText.length);
              var out = finalText.slice(0, solved);
              for (var j = solved; j < finalText.length; j++) {
                var ch = finalText[j];
                out += (ch === ' ') ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
              }
              val.textContent = out;
            },
            onComplete: function () { val.textContent = finalText; }
          });
        }
      });
    }

    /* gentle cursor tilt on pointer devices */
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      var rx = gsap.quickTo(card, 'rotationX', { duration: 0.45, ease: 'power2.out' });
      var ry = gsap.quickTo(card, 'rotationY', { duration: 0.45, ease: 'power2.out' });
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 6);
        rx(-((e.clientY - r.top) / r.height - 0.5) * 5);
      });
      card.addEventListener('mouseleave', function () { rx(0); ry(0); });
    }
  });

  /* perspective for the tilt */
  gsap.utils.toArray('.cs-stats').forEach(function (grid) {
    grid.style.perspective = '900px';
  });

  /* ============================================================
     JOURNEY MAPS (Watch Tower) — the journey plays itself:
     stages 1→6 light in slow sequence, the emotion line draws
     across, dots pop, tags spring in. Hover highlights a column;
     ↻ replays the run.
     ============================================================ */
  (function journeyMaps() {
    var grids = document.querySelectorAll('.jm-grid, .jm-grid2');
    if (!grids.length) return;

    grids.forEach(function (grid) {
      var isAfter = grid.classList.contains('jm-grid2');
      var accent = isAfter ? '#1e7d32' : '#b42318';

      /* ---- assign each cell to its stage column (1–6) ---- */
      var cells = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
      var headers = {};
      var col = 0;
      [].forEach.call(grid.children, function (el) {
        var cl = el.classList;
        if (cl.contains('corner') || cl.contains('corner2') ||
            cl.contains('lane-label') || cl.contains('lane-label2') ||
            cl.contains('emotion-label') || cl.contains('emotion-label2')) { col = 0; return; }
        if (cl.contains('emotion-svg-wrap') || cl.contains('emotion-svg-wrap2')) return;
        col += 1;
        if (col >= 1 && col <= 6) {
          cells[col].push(el);
          if (cl.contains('stage-header') || cl.contains('stage-header2')) headers[col] = el;
        }
      });

      /* ---- emotion curve pieces ---- */
      var svg = grid.querySelector('svg');
      var path = svg && svg.querySelector('path');
      var dots = svg ? [].slice.call(svg.querySelectorAll('circle')) : [];
      var labels = svg ? [].slice.call(svg.querySelectorAll('text')).slice(2) : []; // skip axis labels
      var len = path ? path.getTotalLength() : 0;

      var STEP = 0.55; // slow, deliberate 1→6

      function build() {
        var tl = gsap.timeline({ paused: true });
        if (path) {
          tl.set(path, { strokeDasharray: len, strokeDashoffset: len }, 0)
            .to(path, { strokeDashoffset: 0, duration: STEP * 6, ease: 'none' }, 0.15);
        }
        for (var c = 1; c <= 6; c++) {
          var t = (c - 1) * STEP;
          tl.from(cells[c], { y: 16, opacity: 0, duration: 0.5, ease: 'power2.out', stagger: 0.05 }, t);
          var tags = [];
          cells[c].forEach(function (cell) {
            tags = tags.concat([].slice.call(cell.querySelectorAll('.pain-tag, .resolved-tag, .action-tag, .system-tag, .system-tag2')));
          });
          if (tags.length) tl.from(tags, { scale: 0.55, opacity: 0, duration: 0.35, ease: 'back.out(2)', stagger: 0.045 }, t + 0.2);
          var num = headers[c] && headers[c].querySelector('.stage-num, .stage-num2');
          if (num) tl.to(num, { color: accent, fontWeight: 700, duration: 0.25 }, t);
          if (dots[c - 1]) tl.from(dots[c - 1], { scale: 0, transformOrigin: '50% 50%', duration: 0.45, ease: 'back.out(3)' }, t + 0.12);
          if (labels[c - 1]) tl.from(labels[c - 1], { opacity: 0, duration: 0.35 }, t + 0.22);
        }
        /* closing beat: final emotion pulses — red "Blocked" vs green "Deploy" */
        if (dots[5]) {
          tl.to(dots[5], { scale: 1.5, transformOrigin: '50% 50%', duration: 0.32, repeat: 3, yoyo: true, ease: 'sine.inOut' }, STEP * 6 + 0.1);
        }
        return tl;
      }

      var tl = build();
      ScrollTrigger.create({
        trigger: grid,
        start: 'top 72%',
        once: true,
        onEnter: function () { tl.play(0); }
      });

      /* ---- replay affordance ---- */
      var wrap = grid.closest('.jm-wrap, .jm-wrap2');
      var title = wrap && wrap.querySelector('.jm-title, .jm-title2');
      if (title) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'jm-replay';
        btn.textContent = '↻ replay';
        btn.addEventListener('click', function () { tl.play(0); });
        title.appendChild(btn);
      }

      /* ---- column hover: highlight the full stage across lanes ---- */
      Object.keys(cells).forEach(function (key) {
        var c = parseInt(key, 10);
        cells[c].forEach(function (cell) {
          cell.addEventListener('mouseenter', function () {
            cells[c].forEach(function (x) { x.classList.add('jm-hl'); });
            if (dots[c - 1]) gsap.to(dots[c - 1], { scale: 1.7, transformOrigin: '50% 50%', duration: 0.28, ease: 'power2.out' });
          });
          cell.addEventListener('mouseleave', function () {
            cells[c].forEach(function (x) { x.classList.remove('jm-hl'); });
            if (dots[c - 1]) gsap.to(dots[c - 1], { scale: 1, duration: 0.28, ease: 'power2.out' });
          });
        });
      });
    });
  })();

  /* defer measurements until the viewport is real (hidden-tab guard) */
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
