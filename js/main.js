/* BlueStone Landscape homepage interactions. Vanilla JS, no dependencies. */
(function () {
  'use strict';
  var root = document.querySelector('.bs');
  if (!root) return;

  function track(event, data) {
    window.dataLayer = window.dataLayer || [];
    var payload = { event: event };
    for (var k in data || {}) payload[k] = data[k];
    window.dataLayer.push(payload);
  }

  /* Footer year */
  root.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* Click tracking via data-event attributes */
  root.addEventListener('click', function (e) {
    var el = e.target.closest('[data-event]');
    if (el) track(el.getAttribute('data-event'), { link_url: el.getAttribute('href') || '' });
  });

  /* Header state fallback (CSS scroll-driven animation handles it where supported) */
  var hdr = root.querySelector('.hdr');
  if (hdr) {
    var onScroll = function () { hdr.classList.toggle('is-scrolled', window.scrollY > 80); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* Mobile menu */
  var menu = document.getElementById('mobile-menu');
  var openBtn = root.querySelector('[data-menu-open]');
  var mbar = root.querySelector('.mbar');
  function openMenu() {
    menu.hidden = false;
    openBtn.setAttribute('aria-expanded', 'true');
    if (mbar) mbar.hidden = true;
    document.documentElement.style.overflow = 'hidden';
    var c = document.getElementById('mm-close');
    if (c) c.focus();
  }
  function closeMenu(returnFocus) {
    if (menu.hidden) return;
    menu.hidden = true;
    openBtn.setAttribute('aria-expanded', 'false');
    if (mbar) mbar.hidden = false;
    document.documentElement.style.overflow = '';
    if (returnFocus) openBtn.focus();
  }
  if (menu && openBtn) {
    openBtn.addEventListener('click', openMenu);
    menu.addEventListener('click', function (e) {
      if (e.target === menu) return closeMenu(true);
      if (e.target.closest('[data-menu-close]') || e.target.closest('.mm-nav a')) closeMenu(false);
    });
    menu.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') return closeMenu(true);
      if (e.key !== 'Tab') return;
      var f = menu.querySelectorAll('a[href], button, summary');
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 1180) closeMenu(false); });
  }

  /* Quote CTAs: move focus to the form card after the anchor scroll */
  root.querySelectorAll('a[href="#quote"]').forEach(function (a) {
    a.addEventListener('click', function () {
      var card = document.getElementById('quote');
      setTimeout(function () {
        var first = document.getElementById('q-name');
        (first && !first.closest('[hidden]') ? first : card).focus({ preventScroll: true });
      }, 450);
    });
  });

  /* Quote form */
  var form = document.getElementById('quote-form');
  if (form) {
    var ok = root.querySelector('.qok');
    var btn = form.querySelector('.qbtn');
    var started = false;
    form.addEventListener('focusin', function () {
      if (!started) { started = true; track('quote_form_start', { form_location: 'hero' }); }
    });
    function setError(name, msg) {
      var input = document.getElementById('q-' + name);
      var err = document.getElementById('e-' + name);
      if (!input || !err) return;
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (msg) { err.textContent = msg; err.hidden = false; err.setAttribute('role', 'alert'); }
      else { err.hidden = true; err.removeAttribute('role'); }
    }
    ['name', 'phone', 'email'].forEach(function (n) {
      var input = document.getElementById('q-' + n);
      if (input) input.addEventListener('input', function () { setError(n, ''); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (btn.disabled) return;
      if (form.website && form.website.value) return; /* honeypot */
      var name = document.getElementById('q-name').value.trim();
      var digits = form.phone.value.replace(/[^0-9]/g, '');
      var email = form.email.value.trim();
      var errors = {};
      if (!name) errors.name = 'Please enter your name.';
      if (!digits) errors.phone = 'Please enter a phone number.';
      else if (digits.length < 8 || digits.length > 12) errors.phone = 'Please check the phone number, for example 0400 000 000.';
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "That email address doesn't look right.";
      ['name', 'phone', 'email'].forEach(function (n) { setError(n, errors[n] || ''); });
      var firstBad = ['name', 'phone', 'email'].filter(function (n) { return errors[n]; })[0];
      if (firstBad) { document.getElementById('q-' + firstBad).focus(); return; }

      /* Loading state. Replace this timeout with the real form plugin submission. */
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
      btn.querySelector('.spin').hidden = false;
      btn.querySelector('[data-label]').textContent = 'Sending…';
      setTimeout(function () {
        ok.querySelector('[data-first-name]').textContent = name.split(' ')[0] || 'there';
        form.hidden = true;
        ok.hidden = false;
        btn.disabled = false;
        btn.removeAttribute('aria-busy');
        btn.querySelector('.spin').hidden = true;
        btn.querySelector('[data-label]').textContent = 'Send My Quote Request';
        track('quote_form_submit', { service: form.service.value || 'not_specified', form_location: 'hero' });
        ok.setAttribute('tabindex', '-1');
        ok.focus();
      }, 1300);
    });
    var reset = ok && ok.querySelector('[data-reset]');
    if (reset) reset.addEventListener('click', function () {
      form.reset(); started = false; ok.hidden = true; form.hidden = false;
      document.getElementById('q-name').focus();
    });
  }

  /* Before / after slider */
  var range = document.getElementById('ba-range');
  if (range) {
    var ba = range.closest('.ba');
    var before = ba.querySelector('.ba-before');
    var handle = ba.querySelector('.ba-handle');
    var update = function () {
      var v = Number(range.value);
      before.style.clipPath = 'inset(0 ' + (100 - v) + '% 0 0)';
      handle.style.left = v + '%';
      range.setAttribute('aria-valuetext', v + '% before, ' + (100 - v) + '% after');
    };
    range.addEventListener('input', update);
    update();
  }

  /* Gallery filter */
  var filterBtns = root.querySelectorAll('[data-filter]');
  var tiles = root.querySelectorAll('.gal .gi');
  filterBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.getAttribute('data-filter');
      filterBtns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      tiles.forEach(function (t, i) {
        var show = f === 'All' || t.getAttribute('data-cat') === f;
        t.hidden = !show;
        t.className = 'gi' + (f === 'All' ? ' g' + i : '');
      });
    });
  });
})();
