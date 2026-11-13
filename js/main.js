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
        var first = document.getElementById('q-first');
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
    var fields = ['first', 'last', 'phone', 'email'];
    fields.forEach(function (n) {
      var input = document.getElementById('q-' + n);
      if (input) input.addEventListener('input', function () { setError(n, ''); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (btn.disabled) return;
      if (form.website && form.website.value) return; /* honeypot */
      var name = document.getElementById('q-first').value.trim();
      var last = document.getElementById('q-last').value.trim();
      var digits = form.phone.value.replace(/[^0-9]/g, '');
      var email = form.email.value.trim();
      var errors = {};
      if (!name) errors.first = 'Please enter your first name.';
      if (!last) errors.last = 'Please enter your last name.';
      if (!digits) errors.phone = 'Please enter a phone number.';
      else if (digits.length < 8 || digits.length > 12) errors.phone = 'Please check the phone number, for example 0400 000 000.';
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "That email address doesn't look right.";
      fields.forEach(function (n) { setError(n, errors[n] || ''); });
      var firstBad = fields.filter(function (n) { return errors[n]; })[0];
      if (firstBad) { document.getElementById('q-' + firstBad).focus(); return; }

      /* Loading state. Replace this timeout with the real form plugin submission. */
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
      btn.querySelector('.spin').hidden = false;
      btn.querySelector('[data-label]').textContent = 'Sending…';
      setTimeout(function () {
        ok.querySelector('[data-first-name]').textContent = name || 'there';
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
      document.getElementById('q-first').focus();
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

  /* FAQ: topic pills, live search with highlighting, show-more, deep links */
  var faq = root.querySelector('[data-faq]');
  if (faq) {
    var LIMIT = 10;
    var items = Array.prototype.slice.call(faq.querySelectorAll('.faq-list details'));
    var pills = faq.querySelectorAll('[data-faq-cat]');
    var q = document.getElementById('faq-q');
    var box = faq.querySelector('.faq-search');
    var clearBtn = faq.querySelector('.faq-clear');
    var status = faq.querySelector('[data-faq-status]');
    var empty = faq.querySelector('[data-faq-empty]');
    var more = faq.querySelector('[data-faq-more]');
    var cat = 'all';
    var expanded = false;
    var searchTimer;
    items.forEach(function (d) {
      var t = d.querySelector('.fq-t');
      t.setAttribute('data-raw', t.textContent);
      d.setAttribute('data-text', d.textContent.toLowerCase());
    });
    function escHtml(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
    function highlight(el, terms) {
      var raw = el.getAttribute('data-raw');
      if (!terms.length) { el.textContent = raw; return; }
      var re = new RegExp('(' + terms.map(escRe).join('|') + ')', 'gi');
      el.innerHTML = raw.split(re).map(function (part, i) { return i % 2 ? '<mark>' + escHtml(part) + '</mark>' : escHtml(part); }).join('');
    }
    function render() {
      var raw = q.value.trim();
      var terms = raw.toLowerCase().split(/\s+/).filter(Boolean);
      var filtering = terms.length > 0 || cat !== 'all';
      var matches = 0;
      var shown = 0;
      items.forEach(function (d) {
        var ok = (cat === 'all' || d.getAttribute('data-cat') === cat) &&
          terms.every(function (t) { var tx = d.getAttribute('data-text'); return tx.indexOf(t) > -1 || (t.length > 3 && t.slice(-1) === 's' && tx.indexOf(t.slice(0, -1)) > -1); });
        if (ok) matches++;
        var visible = ok && (filtering || expanded || matches <= LIMIT);
        d.hidden = !visible;
        if (visible) shown++;
        highlight(d.querySelector('.fq-t'), terms);
      });
      faq.setAttribute('data-cat', cat);
      box.classList.toggle('has-q', !!raw);
      clearBtn.hidden = !raw;
      empty.hidden = matches > 0;
      more.parentNode.hidden = filtering || expanded || matches <= LIMIT;
      var topic = cat === 'all' ? '' : ' in ' + faq.querySelector('[data-faq-cat="' + cat + '"]').firstChild.textContent.trim();
      if (raw) status.innerHTML = '<b>' + matches + '</b> ' + (matches === 1 ? 'answer' : 'answers') + ' for &ldquo;' + escHtml(raw) + '&rdquo;' + topic;
      else if (cat !== 'all') status.innerHTML = '<b>' + matches + '</b> questions' + topic;
      else status.innerHTML = 'Showing <b>' + shown + '</b> of ' + items.length + ' questions';
    }
    pills.forEach(function (p) {
      p.addEventListener('click', function () {
        cat = p.getAttribute('data-faq-cat');
        pills.forEach(function (x) { x.setAttribute('aria-pressed', x === p ? 'true' : 'false'); });
        if (p.scrollIntoView && p.parentNode.scrollWidth > p.parentNode.clientWidth) p.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
        render();
        track('faq_filter', { topic: cat });
      });
    });
    q.addEventListener('input', function () {
      render();
      clearTimeout(searchTimer);
      if (q.value.trim().length > 2) searchTimer = setTimeout(function () { track('faq_search', { search_term: q.value.trim() }); }, 1200);
    });
    function clearSearch() { q.value = ''; render(); q.focus(); }
    clearBtn.addEventListener('click', clearSearch);
    faq.querySelector('[data-faq-reset]').addEventListener('click', function () {
      cat = 'all';
      pills.forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-faq-cat') === 'all' ? 'true' : 'false'); });
      clearSearch();
    });
    q.addEventListener('keydown', function (e) { if (e.key === 'Escape' && q.value) { e.preventDefault(); clearSearch(); } });
    more.addEventListener('click', function () {
      expanded = true;
      render();
      var next = items[LIMIT];
      if (next) next.querySelector('summary').focus();
    });
    items.forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (d.open) track('faq_open', { question: d.querySelector('.fq-t').getAttribute('data-raw') });
      });
    });
    /* Press "/" anywhere to jump to the FAQ search */
    document.addEventListener('keydown', function (e) {
      var tag = (e.target.tagName || '').toLowerCase();
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
      e.preventDefault();
      q.focus({ preventScroll: true });
      faq.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    /* Deep links: #faq-12 opens and highlights that question */
    function openFromHash() {
      var m = /^#faq-(\d+)$/.exec(location.hash);
      var d = m && document.getElementById('faq-' + m[1]);
      if (!d) return;
      expanded = true; cat = 'all'; q.value = '';
      pills.forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-faq-cat') === 'all' ? 'true' : 'false'); });
      render();
      d.open = true;
      d.classList.remove('is-target'); void d.offsetWidth; d.classList.add('is-target');
      d.scrollIntoView({ block: 'start' });
    }
    window.addEventListener('hashchange', openFromHash);
    openFromHash();
    /* Typewriter placeholder cycling through real questions */
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) {
      var samples = ['retaining wall permit', 'soggy yard after rain', 'turf for Bendigo', 'pool paving', 'deck permit', 'staging the work'];
      var base = q.getAttribute('placeholder');
      var si = 0, ci = 0, dir = 1, hold = 0;
      setInterval(function () {
        if (document.activeElement === q || q.value) { q.setAttribute('placeholder', base); return; }
        var word = samples[si];
        if (hold > 0) { hold--; return; }
        ci += dir;
        if (ci >= word.length) { dir = -1; hold = 22; }
        else if (ci <= 0) { dir = 1; ci = 0; si = (si + 1) % samples.length; hold = 4; }
        q.setAttribute('placeholder', ci > 0 ? 'Try “' + word.slice(0, ci) + '”' : base);
      }, 70);
    }
    render();
  }
})();
