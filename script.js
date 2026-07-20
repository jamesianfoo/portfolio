/* ============================================================
   JAMES FOO — shared site script (all pages)
   Nav state · mobile menu · clock · reveals · cursor · magnetic
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Header scroll state ---------- */
  var header = document.querySelector('.header');
  var lastY = window.scrollY;

  function onScroll() {
    var y = window.scrollY;
    if (header) {
      header.classList.toggle('is-scrolled', y > 24);
      // Hide on scroll down, show on scroll up (only past the fold)
      if (y > 520 && y > lastY + 6) header.classList.add('is-hidden');
      else if (y < lastY - 6 || y < 520) header.classList.remove('is-hidden');
    }
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var navToggle = document.querySelector('.nav-toggle');
  var mobileMenu = document.querySelector('.mobile-menu');
  var mobileMenuClose = document.querySelector('.mobile-menu-close');

  if (navToggle && mobileMenu) {
    var setMenuOpen = function (isOpen) {
      mobileMenu.classList.toggle('open', isOpen);
      navToggle.setAttribute('aria-expanded', isOpen);
      var spans = navToggle.querySelectorAll('span');
      if (isOpen) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(6px, -6px)';
        document.body.style.overflow = 'hidden';
      } else {
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
        document.body.style.overflow = '';
      }
    };

    navToggle.addEventListener('click', function () {
      setMenuOpen(!mobileMenu.classList.contains('open'));
    });

    if (mobileMenuClose) {
      mobileMenuClose.addEventListener('click', function () { setMenuOpen(false); });
    }

    // Close on Escape, and when a link is chosen
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) setMenuOpen(false);
    });

    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenuOpen(false); });
    });
  }

  /* ---------- Sydney clock ---------- */
  function tickClock() {
    var els = [document.getElementById('nav-clock'), document.getElementById('footer-clock')];
    if (!els[0] && !els[1]) return;
    try {
      var t = new Date().toLocaleTimeString('en-AU', {
        timeZone: 'Australia/Melbourne', hour: '2-digit', minute: '2-digit', hour12: false
      });
      els.forEach(function (el) { if (el) el.textContent = t; });
    } catch (e) { /* older browsers */ }
  }
  tickClock();
  setInterval(tickClock, 10000);

  /* ---------- Scroll reveals ---------- */
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible', 'is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' });

  // Legacy hooks (case studies / inner pages)
  document.querySelectorAll(
    '.project-card, .hero-title, .hero-subtitle, .cta-title, .cta-link, ' +
    '.cs-section, .cs-hero-title, .cs-hero-subtitle, .cs-stats, .about-section'
  ).forEach(function (el) {
    el.classList.add('fade-in');
    observer.observe(el);
  });

  // New hook
  document.querySelectorAll('[data-reveal]').forEach(function (el) {
    var delay = el.getAttribute('data-reveal-delay');
    if (delay) el.style.transitionDelay = delay + 'ms';
    observer.observe(el);
  });

  document.querySelectorAll('.project-card').forEach(function (card, i) {
    card.style.transitionDelay = (i % 2) * 0.08 + 's';
  });

  /* ---------- Back to top ---------- */
  document.querySelectorAll('.back-to-top').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  /* ---------- Custom cursor ---------- */
  if (finePointer && !reduceMotion) {
    var dot = document.createElement('div');
    dot.className = 'cursor-dot';
    var ring = document.createElement('div');
    ring.className = 'cursor-ring';
    ring.innerHTML = '<span class="cursor-label">View</span>';
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    var mx = -100, my = -100, rx = -100, ry = -100;

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + (mx - 3.5) + 'px,' + (my - 3.5) + 'px)';
    }, { passive: true });

    (function cursorLoop() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      var half = ring.offsetWidth / 2;
      ring.style.transform = 'translate(' + (rx - half) + 'px,' + (ry - half) + 'px)';
      requestAnimationFrame(cursorLoop);
    })();

    // Hover states via delegation
    document.addEventListener('mouseover', function (e) {
      var t = e.target;
      if (t.closest('[data-cursor="view"]')) {
        ring.classList.add('is-view');
        ring.classList.remove('is-hover');
      } else if (t.closest('a, button, [data-magnetic], input, textarea, select, label')) {
        ring.classList.add('is-hover');
        ring.classList.remove('is-view');
      } else {
        ring.classList.remove('is-hover', 'is-view');
      }
      document.body.classList.toggle('cursor-on-dark', !!t.closest('[data-theme="dark"], .cta, .footer:not(.footer--paper)'));
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
      dot.style.opacity = '0'; ring.style.opacity = '0';
    });
    document.addEventListener('mouseenter', function () {
      dot.style.opacity = '1'; ring.style.opacity = '1';
    });
  }

  /* ---------- Magnetic elements ---------- */
  if (finePointer && !reduceMotion) {
    var magnets = document.querySelectorAll('[data-magnetic], .nav-cta, .btn, .cta-link');
    magnets.forEach(function (el) {
      var strength = parseFloat(el.getAttribute('data-magnetic-strength')) || 0.28;
      var raf = null, tx = 0, ty = 0, cx = 0, cy = 0;

      function apply() {
        cx += (tx - cx) * 0.2;
        cy += (ty - cy) * 0.2;
        el.style.transform = 'translate(' + cx.toFixed(2) + 'px,' + cy.toFixed(2) + 'px)';
        if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) raf = requestAnimationFrame(apply);
        else raf = null;
      }

      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        tx = (e.clientX - r.left - r.width / 2) * strength;
        ty = (e.clientY - r.top - r.height / 2) * strength;
        if (!raf) raf = requestAnimationFrame(apply);
      });

      el.addEventListener('mouseleave', function () {
        tx = 0; ty = 0;
        if (!raf) raf = requestAnimationFrame(apply);
      });
    });
  }
})();
