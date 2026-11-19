/* Booking pop-up, shared by every page. Any Calendly link opens over the page;
   Ctrl/Cmd-click still opens a new tab. Nothing from Calendly loads until then. */
(function () {
  'use strict';
  var body = document.body, box = null, frame = null, last = null;

  function build() {
    box = document.createElement('div');
    box.className = 'cal'; box.hidden = true;
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Book a time');
    box.innerHTML = '<div class="cal-panel"><div class="cal-bar"><span>Book a time</span><span class="cal-acts">' +
      '<a id="cal-new" href="#" target="_blank" rel="noopener">Open in a new tab ↗</a>' +
      '<button type="button" id="cal-close" aria-label="Close">✕</button></span></div>' +
      '<div class="cal-body"><p class="cal-wait">Loading the calendar…</p>' +
      '<iframe id="cal-frame" title="Book a time with James"></iframe></div></div>';
    body.appendChild(box);
    frame = box.querySelector('#cal-frame');
    box.querySelector('#cal-close').addEventListener('click', close);
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
  }
  function close() {
    if (!box || box.hidden) return;
    box.hidden = true; frame.removeAttribute('src'); body.classList.remove('cal-open');
    if (last) last.focus();
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="https://calendly.com/"]');
    if (!a || a.id === 'cal-new' || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    if (!box) build();
    var url = a.getAttribute('href');
    last = a;
    box.querySelector('#cal-new').href = url;
    frame.src = url + (url.indexOf('?') < 0 ? '?' : '&') + 'embed_type=PopupWidget&hide_gdpr_banner=1&embed_domain=' +
      encodeURIComponent(location.hostname || 'jamesfoodesign.com');
    box.hidden = false; body.classList.add('cal-open');
    box.querySelector('#cal-close').focus();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
})();
