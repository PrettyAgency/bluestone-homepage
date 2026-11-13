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
    /* Shrink on scroll, brand-stripe progress bar, hide on scroll down / reveal on scroll up */
    var lastY = window.scrollY;
    var hdrTick = false;
    var onScroll = function () {
      hdrTick = false;
      var y = window.scrollY;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      hdr.classList.toggle('is-scrolled', y > 80);
      hdr.style.setProperty('--p', Math.min(1, y / Math.max(1, max)).toFixed(4));
      var menuOpen = document.getElementById('mobile-menu') && !document.getElementById('mobile-menu').hidden;
      var busy = hdr.contains(document.activeElement) || hdr.matches(':hover') || menuOpen;
      if (y > 640 && y > lastY + 6 && !busy) hdr.classList.add('is-hidden');
      else if (y < lastY - 6 || y <= 640) hdr.classList.remove('is-hidden');
      if (Math.abs(y - lastY) > 6) lastY = y;
      root.style.setProperty('--hdr-h', hdr.classList.contains('is-hidden') ? '0px' : hdr.offsetHeight + 'px');
    };
    window.addEventListener('scroll', function () { if (!hdrTick) { hdrTick = true; requestAnimationFrame(onScroll); } }, { passive: true });
    hdr.addEventListener('focusin', function () { hdr.classList.remove('is-hidden'); });
    onScroll();

    /* Sliding nav indicator: glides to the hovered link, rests on the current page */
    var nav = hdr.querySelector('.nav');
    var ink = nav && nav.querySelector('.nav-ink');
    if (ink) {
      var links = Array.prototype.slice.call(nav.querySelectorAll(':scope > a, :scope > .dd > a'));
      var current = nav.querySelector('a[aria-current]') || links[0];
      var moveInk = function (a) {
        if (!a) return;
        var nr = nav.getBoundingClientRect(), r = a.getBoundingClientRect();
        ink.style.width = (r.width - 24) + 'px';
        ink.style.transform = 'translateX(' + (r.left - nr.left + 12) + 'px)';
      };
      links.forEach(function (a) {
        a.addEventListener('mouseenter', function () { moveInk(a); });
        a.addEventListener('focus', function () { moveInk(a); });
      });
      nav.addEventListener('mouseleave', function () { moveInk(current); });
      nav.addEventListener('focusout', function (e) { if (!nav.contains(e.relatedTarget)) moveInk(current); });
      window.addEventListener('resize', function () { moveInk(current); });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moveInk(current); });
      moveInk(current);
      nav.classList.add('has-ink');
    }
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
  var gal = document.getElementById('work-gal');
  var workMore = root.querySelector('[data-work-more]');
  var workPortfolio = root.querySelector('[data-work-portfolio]');
  var galFilter = 'All';
  var galLoaded = false;
  function renderGallery() {
    tiles.forEach(function (t, i) {
      var show = (galFilter === 'All' || t.getAttribute('data-cat') === galFilter) &&
        (galLoaded || !t.hasAttribute('data-more'));
      t.hidden = !show;
      t.className = 'gi' + (galFilter === 'All' ? ' g' + i : '');
    });
  }
  filterBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      galFilter = b.getAttribute('data-filter');
      filterBtns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      if (gal) gal.classList.remove('is-more');
      renderGallery();
    });
  });
  /* Load more projects, then swap the button for the portfolio link */
  if (workMore && gal) {
    workMore.addEventListener('click', function () {
      galLoaded = true;
      gal.classList.add('is-more');
      renderGallery();
      workMore.hidden = true;
      if (workPortfolio) {
        workPortfolio.hidden = false;
        workPortfolio.classList.add('is-in');
      }
      var firstNew = gal.querySelector('.gi[data-more]:not([hidden])');
      if (firstNew) firstNew.focus({ preventScroll: true });
      track('portfolio_load_more', { filter: galFilter });
    });
  }

  /* Service-area map: routes from Bendigo, pings synced to the radar sweep */
  var map = root.querySelector('.map');
  if (map) {
    var SWEEP = 6;
    var routes = map.querySelector('.routes');
    var mapPins = Array.prototype.slice.call(map.querySelectorAll('.pin'));
    var NS = 'http://www.w3.org/2000/svg';
    var maxDist = 0;
    var pinData = mapPins.map(function (p) {
      var x = parseFloat(p.style.left), y = parseFloat(p.style.top);
      var dx = x - 50, dy = y - 50;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var angle = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360; /* clockwise from north */
      maxDist = Math.max(maxDist, dist);
      return { p: p, x: x, y: y, dist: dist, angle: angle };
    });
    map.style.setProperty('--sweep', SWEEP + 's');
    pinData.forEach(function (d) {
      var delay = (0.35 + (d.dist / maxDist) * 0.9).toFixed(2) + 's';
      d.p.style.setProperty('--d', delay);
      d.p.style.setProperty('--ping', ((d.angle / 360) * SWEEP).toFixed(2) + 's');
      if (routes) {
        var ln = document.createElementNS(NS, 'line');
        ln.setAttribute('x1', 50); ln.setAttribute('y1', 50);
        ln.setAttribute('x2', d.x); ln.setAttribute('y2', d.y);
        ln.setAttribute('pathLength', 1);
        ln.style.setProperty('--d', (parseFloat(delay) - 0.3).toFixed(2) + 's');
        routes.appendChild(ln);
        d.line = ln;
      }
      d.p.addEventListener('mouseenter', function () { d.p.classList.add('is-hot'); if (d.line) d.line.classList.add('is-hot'); });
      d.p.addEventListener('mouseleave', function () { d.p.classList.remove('is-hot'); if (d.line) d.line.classList.remove('is-hot'); });
    });
    map.classList.add('js-map');
    var goLive = function () { map.classList.add('is-live'); };
    if ('IntersectionObserver' in window) {
      var mio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { goLive(); mio.disconnect(); } });
      }, { threshold: 0.3 });
      mio.observe(map);
    } else { goLive(); }
  }

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Hero slideshow: crossfade + drift, rail progress drives the timing */
  var slides = Array.prototype.slice.call(root.querySelectorAll('.hero-slides .hs'));
  var rail = root.querySelector('.hero-rail');
  if (slides.length > 1 && rail) {
    var bars = Array.prototype.slice.call(rail.querySelectorAll('.hr-bar'));
    var numEl = rail.querySelector('[data-hr-n]');
    var capEl = rail.querySelector('[data-hr-cap]');
    var playBtn = rail.querySelector('.hr-play');
    var cur = 0;
    var loadSlide = function (img) { if (img && img.getAttribute('data-src')) { img.src = img.getAttribute('data-src'); img.removeAttribute('data-src'); } };
    var loadAll = function () { slides.forEach(loadSlide); };
    if (document.readyState === 'complete') setTimeout(loadAll, 300); else window.addEventListener('load', function () { setTimeout(loadAll, 300); });
    var show = function (n) {
      n = (n + slides.length) % slides.length;
      loadSlide(slides[n]);
      slides.forEach(function (s, i) { s.classList.toggle('is-on', i === n); });
      bars.forEach(function (b, i) {
        b.classList.remove('is-on');
        b.classList.toggle('is-done', i < n);
        if (i === n) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
      });
      void bars[n].offsetWidth; /* restart the fill animation */
      bars[n].classList.add('is-on');
      if (numEl) numEl.textContent = (n < 9 ? '0' : '') + (n + 1);
      if (capEl) {
        capEl.classList.add('is-swap');
        setTimeout(function () { capEl.innerHTML = slides[n].getAttribute('data-cap'); capEl.classList.remove('is-swap'); }, 300);
      }
      cur = n;
    };
    bars.forEach(function (b, i) {
      b.querySelector('i').addEventListener('animationend', function () { if (i === cur) show(cur + 1); });
      b.addEventListener('click', function () { show(i); track('hero_slide_click', { slide: i + 1 }); });
    });
    var setPaused = function (p) {
      rail.classList.toggle('is-paused', p);
      playBtn.setAttribute('aria-label', p ? 'Play slideshow' : 'Pause slideshow');
    };
    playBtn.addEventListener('click', function () { setPaused(!rail.classList.contains('is-paused')); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) rail.classList.add('is-hidden-tab'); else rail.classList.remove('is-hidden-tab');
    });
    if (reduceMotion) setPaused(true);
  }

  /* Final CTA: swash draws in, pointer leaves ripples on the pool */
  var fcta = root.querySelector('.fcta');
  if (fcta) {
    fcta.classList.add('js-fcta');
    if ('IntersectionObserver' in window) {
      var fio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { fcta.classList.add('is-live'); fio.disconnect(); } });
      }, { threshold: 0.35 });
      fio.observe(fcta);
    } else { fcta.classList.add('is-live'); }
    var ripples = fcta.querySelector('.fcta-ripples');
    var fine = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    if (ripples && !reduceMotion) {
      var lastRipple = 0;
      var drop = function (e, big) {
        var r = fcta.getBoundingClientRect();
        var i = document.createElement('i');
        if (big) i.className = 'big';
        i.style.left = (e.clientX - r.left) + 'px';
        i.style.top = (e.clientY - r.top) + 'px';
        i.addEventListener('animationend', function () { i.remove(); });
        ripples.appendChild(i);
      };
      if (fine) fcta.addEventListener('pointermove', function (e) {
        var now = Date.now();
        if (now - lastRipple < 180 || e.target.closest('a,button')) return;
        lastRipple = now;
        drop(e, false);
      });
      fcta.addEventListener('pointerdown', function (e) { if (!e.target.closest('a,button')) drop(e, true); });
    }
  }

  /* Back to top: progress ring + launch */
  var toTop = root.querySelector('.totop');
  if (toTop) {
    toTop.hidden = false;
    var ticking = false;
    var updateTop = function () {
      ticking = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var y = window.scrollY;
      toTop.classList.toggle('is-on', y > 600);
      toTop.style.setProperty('--off', (100 - Math.min(100, (y / Math.max(1, max)) * 100)).toFixed(1));
      if (y < 20) toTop.classList.remove('is-flying');
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(updateTop); } }, { passive: true });
    updateTop();
    toTop.addEventListener('click', function () {
      toTop.classList.add('is-flying');
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      var brand = root.querySelector('.brand');
      setTimeout(function () { if (brand) brand.focus({ preventScroll: true }); }, reduceMotion ? 0 : 700);
      track('back_to_top', {});
    });
  }

  /* Services: load more */
  var svcMore = root.querySelector('[data-svc-more]');
  var svcExtra = document.getElementById('svc-extra');
  if (svcMore && svcExtra) {
    var moreK = svcMore.querySelector('[data-more-k]');
    var moreL = svcMore.querySelector('[data-more-l]');
    var kText = moreK.textContent, lText = moreL.innerHTML;
    svcMore.addEventListener('click', function () {
      var open = svcMore.getAttribute('aria-expanded') !== 'true';
      svcMore.setAttribute('aria-expanded', open ? 'true' : 'false');
      svcExtra.hidden = !open;
      if (open) {
        svcExtra.classList.remove('is-in'); void svcExtra.offsetWidth; svcExtra.classList.add('is-in');
        moreK.textContent = 'All 12 services showing';
        moreL.textContent = 'Show fewer services';
        var first = svcExtra.querySelector('.svc');
        if (first) first.focus({ preventScroll: true });
        svcExtra.scrollIntoView({ behavior: 'smooth', block: 'start' });
        track('services_load_more', {});
      } else {
        moreK.textContent = kText;
        moreL.innerHTML = lText;
        svcMore.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

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
