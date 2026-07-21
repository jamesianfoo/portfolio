/* ============================================================
   JAMES FOO — homepage experience script
   Lenis smooth scroll · preloader · hero particle field
   GSAP: stacking work cards · horizontal philosophy rail · outro
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined';
  var hasST = typeof window.ScrollTrigger !== 'undefined';

  if (hasGsap && hasST) gsap.registerPlugin(ScrollTrigger);

  /* ============================================================
     Smooth scroll (Lenis) — skipped for reduced motion
     ============================================================ */
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

  // Anchor links scroll smoothly through Lenis
  document.querySelectorAll('a[data-scroll]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.indexOf('#') !== 0) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -20 });
      else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  /* ============================================================
     HERO PARTICLE FIELD — "complexity meets humans"
     Scattered points self-organise into a network around the cursor.
     ============================================================ */
  (function field() {
    var canvas = document.getElementById('hero-field');
    if (!canvas || reduceMotion) return;

    var ctx = canvas.getContext('2d');
    var hero = document.getElementById('hero');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;
    var particles = [];
    var mouse = { x: -9999, y: -9999 };
    var running = true;
    var INK = '22,20,15';
    var AMBER = '232,147,12';

    function resize() {
      W = hero.offsetWidth;
      H = hero.offsetHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function seed() {
      var count = Math.max(55, Math.min(130, Math.round((W * H) / 16000)));
      particles = [];
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: 1 + Math.random() * 1.6,
          amber: Math.random() < 0.12
        });
      }
    }

    hero.addEventListener('mousemove', function (e) {
      var rect = hero.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }, { passive: true });

    hero.addEventListener('mouseleave', function () {
      mouse.x = -9999; mouse.y = -9999;
    });

    var CONNECT = 110;
    var REACH = 170;

    function step() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);

      var i, j, p, q, dx, dy, d;

      for (i = 0; i < particles.length; i++) {
        p = particles[i];

        // gentle attraction toward the cursor
        dx = mouse.x - p.x; dy = mouse.y - p.y;
        d = Math.sqrt(dx * dx + dy * dy);
        if (d < REACH && d > 0.001) {
          var pull = (1 - d / REACH) * 0.028;
          p.vx += (dx / d) * pull;
          p.vy += (dy / d) * pull;
        }

        p.vx *= 0.985; p.vy *= 0.985;                    // damping
        if (Math.abs(p.vx) < 0.08) p.vx += (Math.random() - 0.5) * 0.02;
        if (Math.abs(p.vy) < 0.08) p.vy += (Math.random() - 0.5) * 0.02;

        p.x += p.vx; p.y += p.vy;
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      }

      // connective tissue — lines strengthen near the cursor
      for (i = 0; i < particles.length; i++) {
        p = particles[i];
        for (j = i + 1; j < particles.length; j++) {
          q = particles[j];
          dx = p.x - q.x; dy = p.y - q.y;
          if (Math.abs(dx) > CONNECT || Math.abs(dy) > CONNECT) continue;
          d = Math.sqrt(dx * dx + dy * dy);
          if (d < CONNECT) {
            var mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
            var mdx = mouse.x - mx, mdy = mouse.y - my;
            var md = Math.sqrt(mdx * mdx + mdy * mdy);
            var nearBoost = md < REACH ? (1 - md / REACH) * 0.35 : 0;
            var alpha = (1 - d / CONNECT) * (0.1 + nearBoost);
            ctx.strokeStyle = 'rgba(' + (nearBoost > 0.12 ? AMBER : INK) + ',' + alpha.toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }

      // dots
      for (i = 0; i < particles.length; i++) {
        p = particles[i];
        ctx.fillStyle = p.amber ? 'rgba(' + AMBER + ',0.8)' : 'rgba(' + INK + ',0.45)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(step);
    }

    function setRunning(on) {
      if (on && !running) { running = true; requestAnimationFrame(step); }
      else if (!on) running = false;
    }

    // Pause when the hero is off-screen or the tab is hidden
    new IntersectionObserver(function (entries) {
      setRunning(entries[0].isIntersecting && !document.hidden);
    }, { threshold: 0.02 }).observe(hero);

    document.addEventListener('visibilitychange', function () {
      setRunning(!document.hidden);
    });

    window.addEventListener('resize', resize, { passive: true });
    resize();
    requestAnimationFrame(step);
  })();

  /* ============================================================
     PRELOADER → HERO ENTRANCE
     ============================================================ */
  (function intro() {
    var loader = document.getElementById('loader');
    var count = document.getElementById('loader-count');
    var seen = false;
    try { seen = sessionStorage.getItem('jf-visited') === '1'; } catch (e) {}

    function heroIn(delay) {
      if (!hasGsap) {
        document.querySelectorAll('.hm-line-inner, [data-hero-fade]').forEach(function (el) {
          el.style.transform = 'none'; el.style.opacity = '1';
        });
        return;
      }
      var tl = gsap.timeline({ delay: delay || 0 });
      tl.to('.hm-hero .hm-line-inner', {
        y: 0, duration: 1.15, ease: 'power4.out', stagger: 0.09
      })
      .to('.hm-underline path', {
        strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut'
      }, '-=0.55')
      .to('[data-hero-fade]', {
        opacity: 1, y: 0, duration: 0.85, ease: 'power3.out', stagger: 0.08
      }, '-=0.75');
    }

    if (!loader) { heroIn(0.1); return; }

    if (reduceMotion || !hasGsap) {
      loader.remove();
      document.body.classList.remove('is-loading');
      heroIn(0);
      return;
    }

    document.body.classList.add('is-loading');

    if (seen) {
      // Return visit within the session: quick dissolve
      gsap.to(loader, {
        opacity: 0, duration: 0.45, ease: 'power2.out', delay: 0.15,
        onComplete: function () { loader.remove(); document.body.classList.remove('is-loading'); }
      });
      heroIn(0.25);
      return;
    }

    try { sessionStorage.setItem('jf-visited', '1'); } catch (e) {}

    var counter = { v: 0 };
    var tl = gsap.timeline({
      onComplete: function () {
        loader.remove();
        document.body.classList.remove('is-loading');
      }
    });

    /* ---- "Welcome", written by hand ----
       Each letter path draws in sequence; an amber pen nib rides
       the tip of the stroke via getPointAtLength. */
    var strokes = gsap.utils.toArray('#loader .lw-stroke');
    var swash = document.querySelector('#loader .lw-swash');
    var pen = document.querySelector('#loader .lw-pen');

    function prepPath(p) {
      var len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
      p.style.visibility = 'visible';
      return len;
    }

    function drawTween(p, len, dur, ease) {
      var state = { t: 0 };
      return gsap.to(state, {
        t: 1, duration: dur, ease: ease || 'power1.inOut',
        onStart: function () {
          if (pen) {
            var pt = p.getPointAtLength(0);
            gsap.set(pen, { attr: { cx: pt.x, cy: pt.y }, opacity: 1 });
          }
        },
        onUpdate: function () {
          p.style.strokeDashoffset = len * (1 - state.t);
          if (pen) {
            var pt = p.getPointAtLength(len * state.t);
            pen.setAttribute('cx', pt.x);
            pen.setAttribute('cy', pt.y);
          }
        }
      });
    }

    tl.add(function () {}, 0.25); // beat of dark before the pen touches down

    strokes.forEach(function (p, i) {
      var len = prepPath(p);
      // single continuous word → one long, deliberate write (~3s);
      // multiple letter paths → quick strokes in sequence
      var dur = strokes.length === 1
        ? Math.max(2.4, Math.min(3.2, len / 550))
        : Math.max(0.24, Math.min(0.6, len / 320));
      tl.add(drawTween(p, len, dur, strokes.length === 1 ? 'power1.inOut' : undefined), i === 0 ? 0.3 : '-=0.03');
    });

    if (swash) {
      var swLen = prepPath(swash);
      tl.add(drawTween(swash, swLen, 0.5, 'power2.out'), '+=0.1');
    }

    if (pen) {
      tl.to(pen, { scale: 2.2, opacity: 0, transformOrigin: '50% 50%', duration: 0.35, ease: 'power2.out' });
    }

    tl.to('.loader-tag', { opacity: 1, duration: 0.5, ease: 'power2.out' }, '-=0.6')
    .to(counter, {
      v: 100, duration: 2.2, ease: 'power2.inOut',
      onUpdate: function () {
        if (count) count.textContent = String(Math.round(counter.v)).padStart(2, '0');
      }
    }, 0.3)
    .to('.loader-word', {
      yPercent: -130, opacity: 0, duration: 0.7, ease: 'power3.in'
    }, '+=0.25')
    .to('.loader-tag, .loader-count', { opacity: 0, duration: 0.3 }, '<')
    .to(loader, {
      yPercent: -100, duration: 0.85, ease: 'power4.inOut'
    }, '-=0.25')
    .add(function () { heroIn(0); }, '-=0.75');
  })();

  if (!hasGsap || !hasST) return; // graceful floor: reveals handled by script.js

  /* ============================================================
     MARQUEES — infinite drift, velocity-reactive
     ============================================================ */
  function marquee(trackId, baseSpeed, opts) {
    var track = document.getElementById(trackId);
    if (!track || reduceMotion) return;
    var seg = track.querySelector('.hm-marquee-seg');
    if (!seg) return;

    var x = 0, boost = 0, segW = 0;

    function measure() { segW = seg.offsetWidth; }
    measure();
    window.addEventListener('resize', measure, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

    gsap.ticker.add(function (t, dt) {
      if (!segW) { measure(); return; }
      var v = (baseSpeed + boost) * (dt / 16.7);
      x -= v;
      if (x <= -segW) x += segW;
      if (x > 0) x -= segW;
      track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
      boost *= 0.94;
    });

    ScrollTrigger.create({
      trigger: opts && opts.trigger ? opts.trigger : track,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: function (self) {
        boost = Math.min(18, Math.abs(self.getVelocity()) / 90);
      }
    });
  }

  marquee('marquee-track', 0.9, { trigger: '.hm-marquee' });
  marquee('outro-marquee', 0.7, { trigger: '.hm-outro-marquee' });

  /* ============================================================
     WORK — stacking cards (CSS sticky + GSAP depth)
     ============================================================ */
  (function workStack() {
    // Slots are plain in-flow elements — safe ScrollTrigger triggers.
    // (The sticky cards themselves measure unreliably during refresh.)
    var slots = gsap.utils.toArray('.hm-card-slot');

    slots.forEach(function (slot, i) {
      var card = slot.querySelector('.hm-card');
      card.style.setProperty('--stack-offset', (i * 12) + 'px');
      var nextSlot = slots[i + 1];
      if (!nextSlot) return;
      // fromTo: explicit endpoints so repeated refreshes never ratchet values
      gsap.fromTo(card.querySelector('.hm-card-inner'),
        { scale: 1, filter: 'brightness(1)' },
        {
          scale: 0.94,
          filter: 'brightness(0.55)',
          transformOrigin: 'center top',
          ease: 'none',
          immediateRender: false,
          scrollTrigger: {
            trigger: nextSlot,
            start: 'top bottom',
            end: 'top top+=120',
            scrub: true
          }
        });
    });

    // subtle parallax on each card's visual
    slots.forEach(function (slot) {
      var img = slot.querySelector('.hm-card-visual img, .hm-card-visual .hm-motif');
      if (!img) return;
      gsap.fromTo(img, { yPercent: 6 }, {
        yPercent: -6,
        ease: 'none',
        scrollTrigger: { trigger: slot, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  })();

  /* ============================================================
     PHILOSOPHY — pinned horizontal rail
     ============================================================ */
  (function rail() {
    if (reduceMotion) return;
    var section = document.querySelector('.hm-philosophy');
    var pinWrap = document.querySelector('.hm-philosophy-pin');
    var track = document.getElementById('philosophy-track');
    if (!section || !track) return;

    function distance() {
      return Math.max(0, track.scrollWidth - window.innerWidth);
    }

    gsap.to(track, {
      x: function () { return -distance(); },
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: function () { return '+=' + (distance() + window.innerHeight * 0.25); },
        pin: pinWrap,
        pinSpacing: true,
        scrub: 1,
        invalidateOnRefresh: true,
        anticipatePin: 1
      }
    });

    // panels ease in as they enter from the right
    gsap.utils.toArray('.hm-ph-panel:not(.hm-ph-panel--intro)').forEach(function (panel) {
      gsap.from(panel, {
        opacity: 0.35,
        scale: 0.96,
        scrollTrigger: {
          trigger: panel,
          containerAnimation: gsap.getTweensOf(track)[0],
          start: 'left 90%',
          end: 'left 55%',
          scrub: true
        }
      });
    });
  })();

  /* ============================================================
     ABOUT — counters
     ============================================================ */
  gsap.utils.toArray('[data-count]').forEach(function (el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion) { el.textContent = target + suffix; return; }
    var obj = { v: 0 };
    el.textContent = '0' + suffix; // HTML ships final values; zero only when we'll animate
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: function () {
        gsap.to(obj, {
          v: target, duration: 1.6, ease: 'power3.out',
          onUpdate: function () { el.textContent = Math.round(obj.v) + suffix; }
        });
      }
    });
  });

  /* ============================================================
     PLAYFUL METRIC ICONS — WatchTower card
     Happy hard-hat engineer (satisfaction) + launching rocket (adoption)
     ============================================================ */
  (function playfulIcons() {
    var joy = document.querySelector('.hm-icon--joy');
    var rocket = document.querySelector('.hm-icon--rocket');
    var globe = document.querySelector('.hm-icon--globe');
    var clock = document.querySelector('.hm-icon--clock');
    var zero = document.querySelector('.hm-icon--zero');
    var gauge = document.querySelector('.hm-icon--gauge');
    var target = document.querySelector('.hm-icon--target');
    var cal = document.querySelector('.hm-icon--cal');
    if (!joy && !rocket && !globe && !clock && !zero && !gauge && !target && !cal) return;

    if (reduceMotion) return; // icons stay visible & static

    // --- Happy engineer: gentle bob + twinkling sparkles ---
    if (joy) {
      gsap.to(joy.querySelector('.joy-face'), {
        y: -1.6, duration: 1.2, ease: 'sine.inOut', repeat: -1, yoyo: true
      });
      // each sparkle scales from its own centre (GSAP default bbox origin)
      gsap.fromTo(joy.querySelectorAll('.joy-sparkle'),
        { scale: 0.35, opacity: 0.25 },
        { scale: 1, opacity: 1, duration: 0.9, ease: 'sine.inOut',
          transformOrigin: '50% 50%', stagger: { each: 0.35, from: 'end' },
          repeat: -1, yoyo: true });
    }

    // --- Rocket: flame flicker (grows from its top) + gentle hover-in-air ---
    if (rocket) {
      gsap.to(rocket.querySelector('.rocket-flame'), {
        scaleY: 1.45, scaleX: 0.82, opacity: 0.8, svgOrigin: '24 32',
        duration: 0.14, ease: 'sine.inOut', repeat: -1, yoyo: true
      });
      gsap.to(rocket.querySelector('.rocket-body'), {
        y: -1.4, duration: 1.25, ease: 'sine.inOut', repeat: -1, yoyo: true
      });
    }

    // --- Spinning globe: meridian sweeps around the globe centre ---
    if (globe) {
      gsap.to(globe.querySelector('.globe-mer'), {
        scaleX: -1, svgOrigin: '21 21', duration: 2.6, ease: 'none', repeat: -1
      });
      gsap.to(globe.querySelector('.globe-drop'), {
        y: 1.8, duration: 1.1, ease: 'sine.inOut', repeat: -1, yoyo: true
      });
    }

    // --- Alarm clock: hands run BACKWARDS (time reclaimed); hover = fast rewind ---
    if (clock) {
      gsap.to(clock.querySelector('.clock-min'), {
        rotation: -360, svgOrigin: '24 26', duration: 3.6, ease: 'none', repeat: -1
      });
      gsap.to(clock.querySelector('.clock-hr'), {
        rotation: -360, svgOrigin: '24 26', duration: 43.2, ease: 'none', repeat: -1
      });
    }

    // --- Banned magnifier: sways as it searches, data dots blink away ---
    if (zero) {
      gsap.to(zero.querySelector('.zero-mag'), {
        rotation: 9, svgOrigin: '24 24', duration: 1.5, ease: 'sine.inOut', repeat: -1, yoyo: true
      });
      gsap.fromTo(zero.querySelectorAll('.zero-dot'),
        { opacity: 1, scale: 1 },
        { opacity: 0, scale: 0.4, transformOrigin: '50% 50%', duration: 0.7,
          ease: 'sine.in', stagger: 0.4,
          repeat: -1, repeatDelay: 1.1, yoyo: true });
    }

    // --- Speed gauge: needle cruises the dial; hover slams it to max ---
    if (gauge) {
      gsap.fromTo(gauge.querySelector('.gauge-needle'),
        { rotation: -10, svgOrigin: '24 33' },
        { rotation: 55, svgOrigin: '24 33', duration: 2.2, ease: 'sine.inOut', repeat: -1, yoyo: true });
    }

    // --- Bullseye: rings breathe; the stuck arrow gives a tiny quiver ---
    if (target) {
      gsap.fromTo(target.querySelectorAll('.tgt-rings circle'),
        { scale: 1 },
        { scale: 1.07, svgOrigin: '22 26', duration: 1.3, ease: 'sine.inOut',
          stagger: 0.18, repeat: -1, yoyo: true });
      gsap.to(target.querySelector('.tgt-arrow'), {
        rotation: 2.5, svgOrigin: '24 24', duration: 0.9, ease: 'sine.inOut', repeat: -1, yoyo: true
      });
    }

    // --- Calendar: pages peel off and flutter away (days, shed) ---
    if (cal) {
      gsap.timeline({ repeat: -1, repeatDelay: 1.4 })
        .fromTo(cal.querySelector('.cal-page'),
          { x: 0, y: 0, rotation: 0, opacity: 1 },
          { x: 13, y: -14, rotation: 24, opacity: 0, svgOrigin: '24 24',
            duration: 1.1, ease: 'power2.in' })
        .set(cal.querySelector('.cal-page'), { x: 0, y: 0, rotation: 0, opacity: 0 })
        .to(cal.querySelector('.cal-page'), { opacity: 1, duration: 0.4, ease: 'power1.out' });
    }

    // --- Entrance pop when scrolled into view (resilient: default state is visible) ---
    [joy, rocket, globe, clock, zero, gauge, target, cal].forEach(function (ic) {
      if (!ic) return;
      ScrollTrigger.create({
        trigger: ic, start: 'top 92%', once: true,
        onEnter: function () {
          gsap.fromTo(ic, { scale: 0.2, rotate: -35 },
            { scale: 1, rotate: 0, transformOrigin: '50% 60%', duration: 1, ease: 'back.out(2.2)' });
        }
      });
    });

    // --- Card hover: rocket launches, globe arrow snaps down ---
    var card = (rocket && rocket.closest('.hm-card')) || (globe && globe.closest('.hm-card'));
    if (card) {
      var body = rocket && rocket.querySelector('.rocket-body');
      var flame = rocket && rocket.querySelector('.rocket-flame');
      var drop = globe && globe.querySelector('.globe-drop');
      var launching = false;
      card.addEventListener('mouseenter', function () {
        if (launching) return;
        launching = true;
        var tl = gsap.timeline({ onComplete: function () { launching = false; } });
        if (rocket) {
          tl.to(flame, { scaleY: 2.1, scaleX: 0.7, opacity: 1, duration: 0.18, ease: 'power2.out' }, 0)
            .to(body, { y: -8, duration: 0.28, ease: 'power2.out' }, 0)
            .to(body, { y: -1.4, duration: 0.9, ease: 'elastic.out(1, 0.4)' })
            .to(flame, { scaleY: 1.45, scaleX: 0.82, duration: 0.5, ease: 'power2.out' }, '<');
        }
        if (drop) {
          tl.to(drop, { y: 4, duration: 0.22, ease: 'power2.out' }, 0)
            .to(drop, { y: 1.8, duration: 0.7, ease: 'elastic.out(1, 0.45)' }, 0.22);
        }
      });
    }

    // --- Card 2 hover: clock rewinds (ring-shake), ban slash slices in ---
    var card2 = (clock && clock.closest('.hm-card')) || (zero && zero.closest('.hm-card'));
    if (card2) {
      var slash = zero && zero.querySelector('.zero-slash');
      if (slash) {
        var len = Math.ceil(slash.getTotalLength());
        slash.style.strokeDasharray = len;
      }
      var busy2 = false;
      card2.addEventListener('mouseenter', function () {
        if (busy2) return;
        busy2 = true;
        var tl = gsap.timeline({ onComplete: function () { busy2 = false; } });
        if (clock) {
          tl.to(clock.querySelector('.clock-min'), {
            rotation: '-=720', svgOrigin: '24 26', duration: 1.05, ease: 'power3.out'
          }, 0)
          .to(clock.querySelector('.clock-hr'), {
            rotation: '-=180', svgOrigin: '24 26', duration: 1.05, ease: 'power3.out'
          }, 0)
          .to(clock.querySelector('.clock-body'), {
            keyframes: [{ rotation: -6 }, { rotation: 6 }, { rotation: -4 }, { rotation: 0 }],
            svgOrigin: '24 24', duration: 0.55, ease: 'sine.inOut'
          }, 0);
        }
        if (slash) {
          tl.fromTo(slash, { strokeDashoffset: len }, {
            strokeDashoffset: 0, duration: 0.38, ease: 'power2.inOut'
          }, 0.1);
        }
      });
    }

    // --- Card 3 hover: needle slams to max, arrow re-strikes, page bursts off ---
    var card3 = (gauge && gauge.closest('.hm-card')) || (target && target.closest('.hm-card')) || (cal && cal.closest('.hm-card'));
    if (card3) {
      var busy3 = false;
      card3.addEventListener('mouseenter', function () {
        if (busy3) return;
        busy3 = true;
        var tl = gsap.timeline({ onComplete: function () { busy3 = false; } });
        if (gauge) {
          var needle = gauge.querySelector('.gauge-needle');
          gsap.killTweensOf(needle);
          tl.to(needle, { rotation: 100, svgOrigin: '24 33', duration: 0.32, ease: 'power3.out' }, 0)
            .to(needle, { rotation: 88, svgOrigin: '24 33', duration: 0.7, ease: 'elastic.out(1, 0.35)' }, 0.32)
            .add(function () {
              gsap.fromTo(needle, { rotation: 88, svgOrigin: '24 33' },
                { rotation: 55, svgOrigin: '24 33', duration: 2.2, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 0.4 });
            });
        }
        if (target) {
          var arrow = target.querySelector('.tgt-arrow');
          tl.fromTo(arrow, { x: 9, y: -9, opacity: 0 },
            { x: 0, y: 0, opacity: 1, duration: 0.3, ease: 'power3.in' }, 0)
            .to(arrow, {
              keyframes: [{ rotation: -4 }, { rotation: 3 }, { rotation: 0 }],
              svgOrigin: '24 24', duration: 0.5, ease: 'sine.out'
            }, 0.3)
            .fromTo(target.querySelectorAll('.tgt-rings circle'),
              { scale: 1 }, { scale: 1.14, svgOrigin: '22 26', duration: 0.25,
                ease: 'power2.out', yoyo: true, repeat: 1, stagger: 0.07 }, 0.3);
        }
        if (cal) {
          tl.to(cal.querySelector('.cal-body'), {
            keyframes: [{ scaleY: 0.94, y: 1.5 }, { scaleY: 1, y: 0 }],
            svgOrigin: '24 24', duration: 0.5, ease: 'sine.out'
          }, 0.15);
        }
      });
    }
  })();

  /* ============================================================
     OUTRO — line reveals
     ============================================================ */
  gsap.to('[data-outro-line]', {
    y: 0,
    duration: 1.1,
    ease: 'power4.out',
    stagger: 0.1,
    scrollTrigger: {
      trigger: '.hm-outro',
      start: 'top 65%',
      once: true
    }
  });

  /* ============================================================
     CLIENT LOGO WALL — two counter-rolling rows.
     Scroll velocity accelerates the roll; hovering a row eases it
     almost to a stop so logos can be read (and hovered for colour).
     ============================================================ */
  (function logoWall() {
    var rows = gsap.utils.toArray('.hm-logos-row');
    if (!rows.length || reduceMotion) return;

    var boost = { v: 1 }; // shared velocity multiplier, decays to 1

    var lanes = rows.map(function (row) {
      var track = row.querySelector('.hm-logos-track');
      var dir = parseFloat(row.getAttribute('data-dir')) || 1;
      // normalise to a constant ~55px/s cruise regardless of track length
      var halfWidth = track.scrollWidth / 2 || 1000;
      var dur = Math.max(24, halfWidth / 55);
      var tween = gsap.fromTo(track,
        { xPercent: dir === 1 ? 0 : -50 },
        { xPercent: dir === 1 ? -50 : 0, duration: dur, ease: 'none', repeat: -1 });
      var lane = { tween: tween, hovered: false, track: track, hw: halfWidth };
      row.addEventListener('mouseenter', function () { lane.hovered = true; });
      row.addEventListener('mouseleave', function () { lane.hovered = false; });
      return lane;
    });

    ScrollTrigger.create({
      trigger: '.hm-logos',
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: function (self) {
        var v = 1 + Math.min(2.6, Math.abs(self.getVelocity()) / 900);
        if (v > boost.v) boost.v = v;
      }
    });

    var frame = 0;
    gsap.ticker.add(function () {
      boost.v += (1 - boost.v) * 0.05; // decay toward cruise speed
      frame++;
      lanes.forEach(function (lane) {
        var target = lane.hovered ? 0.1 : boost.v;
        var ts = lane.tween.timeScale();
        lane.tween.timeScale(ts + (target - ts) * 0.08);
        // periodically re-normalise cruise speed to the track's true width
        // (image loads and resizes change it after init)
        if (frame % 120 === 0) {
          var hw = lane.track.scrollWidth / 2 || 1000;
          if (Math.abs(hw - lane.hw) / lane.hw > 0.04) {
            lane.hw = hw;
            lane.tween.duration(Math.max(24, hw / 55));
          }
        }
      });
    });
  })();

  /* ============================================================
     Keep ScrollTrigger measurements honest — the mono webfont and
     lazy images land after first paint and shift section positions.
     ============================================================ */
  // Never measure against a zero-height viewport (hidden/prerendered tab) —
  // it poisons every trigger position. Defer until the window is real.
  var refreshPending = false;
  function safeRefresh() {
    if (window.innerHeight > 0) {
      refreshPending = false;
      ScrollTrigger.refresh();
    } else {
      refreshPending = true;
    }
  }

  window.addEventListener('resize', function () {
    if (refreshPending) safeRefresh();
  });

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && refreshPending) safeRefresh();
  });

  safeRefresh();

  window.addEventListener('load', safeRefresh);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(safeRefresh);
  }

  document.querySelectorAll('img[loading="lazy"]').forEach(function (img) {
    if (img.complete) return;
    img.addEventListener('load', safeRefresh, { once: true });
  });
})();
