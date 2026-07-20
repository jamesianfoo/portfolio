/* ============================================================
   SOUS PANTRY — case study experience script
   Lenis smooth scroll · hero intro · floating ingredients
   GSAP: hypothesis word-light · method steps · code reveal
   timeline draw · stat counters · phone tilt
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined';
  var hasST = typeof window.ScrollTrigger !== 'undefined';

  if (hasGsap && hasST) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  var lenis = null;
  if (!reduceMotion && typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1.0 });
    if (hasGsap && hasST) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(time) { lenis.raf(time); requestAnimationFrame(raf); })(0);
    }
  }

  /* ---------- Code-access gate (plain JS — must work everywhere) ---------- */
  (function codeGate() {
    var dialog = document.getElementById('code-gate');
    if (!dialog) return;
    var openers = document.querySelectorAll('[data-gate]');
    var supported = typeof dialog.showModal === 'function';

    openers.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (supported) dialog.showModal();
        else window.location.href = 'contact.html'; // ancient-browser fallback
      });
    });

    dialog.querySelectorAll('[data-gate-close]').forEach(function (btn) {
      btn.addEventListener('click', function () { dialog.close(); });
    });

    // click on the backdrop closes
    dialog.addEventListener('click', function (e) {
      var r = dialog.getBoundingClientRect();
      var inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) dialog.close();
    });
  })();

  /* Bail politely without GSAP: reveal gated elements and stop */
  if (!hasGsap || !hasST || reduceMotion) {
    document.querySelectorAll('.sp-line-inner, [data-hero-fade], .sp-code-line').forEach(function (el) {
      el.style.transform = 'none';
      el.style.opacity = '1';
    });
    document.querySelectorAll('.sp-hypothesis-text .w').forEach(function (w) { w.classList.add('lit'); });
    document.querySelectorAll('.sp-step').forEach(function (s) { s.classList.add('is-active'); });
    document.querySelectorAll('.sp-tl-item').forEach(function (t) { t.classList.add('is-active'); });
    var fill = document.querySelector('.sp-timeline-fill');
    if (fill) fill.style.transform = 'scaleY(1)';
    return;
  }

  /* ---------- Hero intro ---------- */
  var intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
  intro
    .to('.sp-line-inner', { y: 0, duration: 1.05, stagger: 0.12 }, 0.15)
    .to('[data-hero-fade]', { opacity: 1, y: 0, duration: 0.9, stagger: 0.1 }, 0.55);

  /* ---------- Floating ingredients — drift + mouse parallax ---------- */
  (function floats() {
    var items = gsap.utils.toArray('.sp-float');
    if (!items.length) return;

    items.forEach(function (el, i) {
      gsap.to(el, {
        y: (i % 2 ? -1 : 1) * (14 + (i % 3) * 6),
        rotation: (i % 2 ? -1 : 1) * (5 + (i % 3) * 3),
        duration: 3.2 + (i % 4) * 0.7,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true
      });
    });

    var hero = document.querySelector('.sp-hero');
    if (!hero || !window.matchMedia('(hover: hover)').matches) return;
    var setters = items.map(function (el, i) {
      return {
        x: gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power2.out' }),
        depth: 8 + (i % 4) * 7
      };
    });
    hero.addEventListener('mousemove', function (e) {
      var nx = (e.clientX / window.innerWidth) - 0.5;
      setters.forEach(function (s) { s.x(nx * s.depth * 2); });
    }, { passive: true });
  })();

  /* ---------- Hypothesis: words light up on scroll ---------- */
  (function hypothesis() {
    var texts = gsap.utils.toArray('.sp-hypothesis-text[data-split]');
    texts.forEach(function (el) {
      // wrap words (skip if already wrapped)
      if (!el.querySelector('.w')) {
        el.innerHTML = el.innerHTML.split(/(\s+)/).map(function (chunk) {
          if (/^\s+$/.test(chunk) || chunk === '') return chunk;
          if (chunk.indexOf('<') !== -1) return chunk; // don't wrap tags
          return '<span class="w">' + chunk + '</span>';
        }).join('');
      }
      var words = el.querySelectorAll('.w');
      ScrollTrigger.create({
        trigger: el,
        start: 'top 78%',
        end: 'bottom 45%',
        scrub: 0.4,
        onUpdate: function (self) {
          var lit = Math.round(self.progress * words.length);
          words.forEach(function (w, i) { w.classList.toggle('lit', i < lit); });
        }
      });
    });
  })();

  /* ---------- Method steps: number lights as each enters ---------- */
  gsap.utils.toArray('.sp-step').forEach(function (step) {
    ScrollTrigger.create({
      trigger: step,
      start: 'top 72%',
      onEnter: function () { step.classList.add('is-active'); },
      once: true
    });
  });

  /* ---------- Code panel: lines type in ---------- */
  (function codeReveal() {
    var lines = gsap.utils.toArray('.sp-code-line');
    if (!lines.length) return;
    gsap.to(lines, {
      opacity: 1,
      x: 0,
      duration: 0.45,
      ease: 'power2.out',
      stagger: 0.055,
      scrollTrigger: { trigger: '.sp-code', start: 'top 80%', once: true }
    });
  })();

  /* ---------- Feature icons: gentle idles ---------- */
  (function featureIcons() {
    // camera aperture blink
    var cam = document.querySelector('.spi-cam-lens');
    if (cam) {
      gsap.to(cam, { scale: 0.72, transformOrigin: '50% 50%', duration: 0.16, ease: 'power2.inOut', repeat: -1, yoyo: true, repeatDelay: 2.6 });
    }
    // sparkle pulse
    gsap.utils.toArray('.spi-spark').forEach(function (s, i) {
      gsap.fromTo(s, { scale: 0.5, opacity: 0.3, transformOrigin: '50% 50%' },
        { scale: 1, opacity: 1, duration: 0.9, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: i * 0.35 });
    });
    // list check draws
    var tick = document.querySelector('.spi-tick');
    if (tick) {
      var len = tick.getTotalLength ? tick.getTotalLength() : 20;
      tick.style.strokeDasharray = len;
      gsap.fromTo(tick, { strokeDashoffset: len }, {
        strokeDashoffset: 0, duration: 0.7, ease: 'power2.out', repeat: -1, repeatDelay: 2.4, yoyo: true, yoyoEase: 'power2.in'
      });
    }
    // sync arrows rotate
    var sync = document.querySelector('.spi-sync');
    if (sync) {
      gsap.to(sync, { rotation: 360, svgOrigin: '24 24', duration: 6, ease: 'none', repeat: -1 });
    }
  })();

  /* ---------- Timeline: rail draws, items activate ---------- */
  (function timeline() {
    var fill = document.querySelector('.sp-timeline-fill');
    var wrap = document.querySelector('.sp-timeline');
    if (fill && wrap) {
      gsap.fromTo(fill, { scaleY: 0 }, {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: { trigger: wrap, start: 'top 70%', end: 'bottom 55%', scrub: 0.5 }
      });
    }
    gsap.utils.toArray('.sp-tl-item').forEach(function (item) {
      ScrollTrigger.create({
        trigger: item,
        start: 'top 68%',
        onEnter: function () { item.classList.add('is-active'); },
        once: true
      });
    });
  })();

  /* ---------- Stats: count up / count down ---------- */
  gsap.utils.toArray('[data-sp-count]').forEach(function (el) {
    var from = parseFloat(el.getAttribute('data-sp-from') || '0');
    var to = parseFloat(el.getAttribute('data-sp-count'));
    var suffix = el.getAttribute('data-sp-suffix') || '';
    var obj = { v: from };
    el.textContent = Math.round(from) + suffix;
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: function () {
        gsap.to(obj, {
          v: to, duration: 1.6, ease: 'power3.out',
          onUpdate: function () { el.textContent = Math.round(obj.v) + suffix; }
        });
      }
    });
  });

  /* ---------- Phone tilt (pointer devices) ---------- */
  (function tilt() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    gsap.utils.toArray('.sp-phone').forEach(function (phone) {
      var rx = gsap.quickTo(phone, 'rotationX', { duration: 0.5, ease: 'power2.out' });
      var ry = gsap.quickTo(phone, 'rotationY', { duration: 0.5, ease: 'power2.out' });
      phone.addEventListener('mousemove', function (e) {
        var r = phone.getBoundingClientRect();
        var nx = (e.clientX - r.left) / r.width - 0.5;
        var ny = (e.clientY - r.top) / r.height - 0.5;
        ry(nx * 10);
        rx(-ny * 8);
      });
      phone.addEventListener('mouseleave', function () { rx(0); ry(0); });
    });
  })();

  /* ---------- Section parallax on green screens block ---------- */
  gsap.utils.toArray('.sp-screens-row .sp-phone').forEach(function (phone, i) {
    gsap.fromTo(phone, { yPercent: i % 2 ? 7 : 3 }, {
      yPercent: i % 2 ? -7 : -3,
      ease: 'none',
      scrollTrigger: { trigger: '.sp-screens', start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  /* ---------- Honest measurements after fonts/images settle ---------- */
  var refreshPending = false;
  function safeRefresh() {
    if (window.innerHeight > 0) { refreshPending = false; ScrollTrigger.refresh(); }
    else refreshPending = true;
  }
  window.addEventListener('resize', function () { if (refreshPending) safeRefresh(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden && refreshPending) safeRefresh(); });
  window.addEventListener('load', safeRefresh);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(safeRefresh);
  document.querySelectorAll('img[loading="lazy"]').forEach(function (img) {
    if (img.complete) return;
    img.addEventListener('load', safeRefresh, { once: true });
  });
})();
