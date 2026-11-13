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
  var mbar = root.querySelector('.dock');
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
    var used = false;
    var anim = null;
    var setV = function (v) { range.value = Math.round(v); update(); };
    var origUpdate = update;
    update = function () {
      origUpdate();
      var v = Number(range.value) / 100;
      ba.style.setProperty('--v', v.toFixed(3));
      ba.classList.toggle('show-after', v < 0.4);
    };
    var markUsed = function () { used = true; ba.classList.add('is-used'); if (anim) { cancelAnimationFrame(anim); anim = null; } };
    range.addEventListener('input', function () { markUsed(); update(); });
    /* tween helper */
    var tween = function (to, dur, done) {
      var from = Number(range.value), t0 = null;
      var stepT = function (ts) {
        if (!t0) t0 = ts;
        var k = Math.min(1, (ts - t0) / dur);
        var e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        setV(from + (to - from) * e);
        if (k < 1) anim = requestAnimationFrame(stepT); else { anim = null; if (done) done(); }
      };
      anim = requestAnimationFrame(stepT);
    };
    /* demo sweep when it first comes into view */
    var rmBA = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!rmBA && 'IntersectionObserver' in window) {
      var bio = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return;
        bio.disconnect();
        setTimeout(function () { if (used) return; tween(82, 900, function () { if (!used) tween(18, 1100, function () { if (!used) tween(50, 800); }); }); }, 400);
      }, { threshold: 0.6 });
      bio.observe(ba);
    }
    /* desktop: the divider follows the mouse */
    if (window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
      ba.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var r = ba.getBoundingClientRect();
        markUsed();
        setV(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)));
      });
    }
    /* Before / After jump buttons */
    root.querySelectorAll('[data-ba-go]').forEach(function (b) {
      b.addEventListener('click', function () {
        markUsed();
        root.querySelectorAll('[data-ba-go]').forEach(function (x) { x.classList.toggle('is-on', x === b); });
        if (rmBA) setV(Number(b.getAttribute('data-ba-go'))); else tween(Number(b.getAttribute('data-ba-go')), 900);
      });
    });
    update();
  }

  /* Outdoor living: thumbnail switcher */
  var deckThumbs = root.querySelectorAll('[data-deck-img]');
  if (deckThumbs.length) {
    var frameImgs = root.querySelectorAll('.deck-frame .dm');
    var deckCap = root.querySelector('.deck-media .cap');
    var capK = root.querySelector('[data-deck-k]');
    var capT = root.querySelector('[data-deck-t]');
    var front = 0;
    deckThumbs.forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.classList.contains('is-on')) return;
        deckThumbs.forEach(function (x) { var on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
        var cur = frameImgs[front], next = frameImgs[1 - front];
        next.src = b.getAttribute('data-deck-img');
        next.alt = b.getAttribute('data-deck-alt');
        next.removeAttribute('aria-hidden');
        cur.setAttribute('aria-hidden', 'true');
        cur.alt = '';
        void next.offsetWidth;
        next.classList.add('is-on');
        cur.classList.remove('is-on');
        front = 1 - front;
        deckCap.classList.add('is-swap');
        setTimeout(function () {
          capK.innerHTML = b.getAttribute('data-deck-k');
          capT.textContent = b.getAttribute('data-deck-t');
          deckCap.classList.remove('is-swap');
        }, 350);
        track('deck_photo', { photo: b.getAttribute('data-deck-img') });
      });
    });
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
    var n = 0;
    tiles.forEach(function (t, i) {
      var show = (galFilter === 'All' || t.getAttribute('data-cat') === galFilter) &&
        (galLoaded || !t.hasAttribute('data-more'));
      t.hidden = !show;
      t.className = 'gi' + (galFilter === 'All' ? ' g' + i : '');
      if (show) t.style.setProperty('--n', n++);
    });
  }
  filterBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      galFilter = b.getAttribute('data-filter');
      filterBtns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      if (gal) {
        gal.classList.remove('is-more', 'is-shuffle');
        renderGallery();
        void gal.offsetWidth;
        gal.classList.add('is-shuffle');
      } else renderGallery();
    });
  });
  renderGallery();

  /* Gallery motion: entrance wipe, 3D tilt + glare, "View" cursor bubble, image parallax */
  if (gal && !reduceMotionEarly()) {
    gal.classList.add('js-gal');
    if ('IntersectionObserver' in window) {
      var gio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            gal.classList.add('is-in');
            setTimeout(function () { gal.classList.add('wiped'); }, 2200);
            gio.disconnect();
          }
        });
      }, { threshold: 0.15 });
      gio.observe(gal);
    } else gal.classList.add('is-in', 'wiped');

    var finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    if (finePointer) {
      var bubble = document.createElement('div');
      bubble.className = 'gal-cursor';
      bubble.setAttribute('aria-hidden', 'true');
      bubble.innerHTML = 'View <svg width="14" height="10" viewBox="0 0 16 12"><path d="M0 6h14M9 1l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2.2"></path></svg>';
      root.appendChild(bubble);
      tiles.forEach(function (t) {
        t.addEventListener('pointermove', function (e) {
          var r = t.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
          t.style.setProperty('--ry', ((px - 0.5) * 8).toFixed(2) + 'deg');
          t.style.setProperty('--rx', ((0.5 - py) * 8).toFixed(2) + 'deg');
          t.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
          t.style.setProperty('--my', (py * 100).toFixed(1) + '%');
          bubble.style.setProperty('--cx', e.clientX + 'px');
          bubble.style.setProperty('--cy', e.clientY + 'px');
          bubble.classList.add('is-on');
        });
        t.addEventListener('pointerleave', function () {
          t.style.setProperty('--rx', '0deg');
          t.style.setProperty('--ry', '0deg');
          bubble.classList.remove('is-on');
        });
      });
    }

    var galTick = false;
    var parallax = function () {
      galTick = false;
      var vh = window.innerHeight;
      tiles.forEach(function (t) {
        if (t.hidden) return;
        var r = t.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var p = ((r.top + r.height / 2) - vh / 2) / vh; /* -1..1 around viewport centre */
        t.style.setProperty('--py', (p * -22).toFixed(1) + 'px');
      });
    };
    window.addEventListener('scroll', function () { if (!galTick) { galTick = true; requestAnimationFrame(parallax); } }, { passive: true });
    parallax();
  }
  function reduceMotionEarly() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
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
        if (now - lastRipple < 160) return;
        lastRipple = now;
        drop(e, false);
      });
      fcta.addEventListener('pointerdown', function (e) { drop(e, true); });
    }
  }

  /* Page-wide ripple trail (the pool section keeps its own water ripples) */
  if (!reduceMotion && window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
    var layer = document.createElement('div');
    layer.className = 'page-ripples';
    layer.setAttribute('aria-hidden', 'true');
    root.appendChild(layer);
    var lastPR = 0;
    var spawn = function (x, y, big) {
      var i = document.createElement('i');
      if (big) i.className = 'big';
      i.style.left = x + 'px';
      i.style.top = y + 'px';
      i.addEventListener('animationend', function () { i.remove(); });
      layer.appendChild(i);
    };
    var inPool = function (t) { return t && t.closest && t.closest('.fcta'); };
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || inPool(e.target)) return;
      var now = Date.now();
      if (now - lastPR < 160) return;
      lastPR = now;
      spawn(e.clientX, e.clientY, false);
    }, { passive: true });
    document.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || inPool(e.target)) return;
      spawn(e.clientX, e.clientY, true);
    });
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

  /* Trust bar: stripe sweep, hill draw, count-up, cursor spotlight */
  var trust = root.querySelector('[data-trust]');
  if (trust && !reduceMotion) {
    trust.classList.add('js-trust');
    var counters = trust.querySelectorAll('[data-count]');
    counters.forEach(function (el) { el.textContent = '0'; });
    var runCount = function () {
      counters.forEach(function (el) {
        var to = parseInt(el.getAttribute('data-count'), 10), t0 = null, dur = 1600;
        var step = function (ts) {
          if (!t0) t0 = ts;
          var k = Math.min(1, (ts - t0) / dur);
          el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
          if (k < 1) requestAnimationFrame(step);
        };
        setTimeout(function () { requestAnimationFrame(step); }, 400);
      });
    };
    var goTrust = function () { trust.classList.add('is-live'); runCount(); };
    if ('IntersectionObserver' in window) {
      var tio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { goTrust(); tio.disconnect(); } });
      }, { threshold: 0.4 });
      tio.observe(trust);
    } else goTrust();
    trust.addEventListener('pointermove', function (e) {
      var r = trust.getBoundingClientRect();
      trust.style.setProperty('--gx', (e.clientX - r.left) + 'px');
      trust.style.setProperty('--gy', (e.clientY - r.top) + 'px');
    });
    trust.addEventListener('pointerleave', function () { trust.style.setProperty('--gx', '-400px'); });
  }

  /* Service cards: 3D tilt (individual rotate, so it composes with scroll reveals), glare, magnetic arrow */
  if (!reduceMotion && window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
    root.querySelectorAll('.svc').forEach(function (card) {
      var arr = card.querySelector('.arr');
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        var mag = Math.min(1, Math.sqrt(px * px + py * py) * 2);
        card.style.setProperty('--tax', (-py).toFixed(3));
        card.style.setProperty('--tay', (px).toFixed(3));
        card.style.setProperty('--tang', (mag * 5).toFixed(2) + 'deg');
        card.style.setProperty('--mx', ((px + 0.5) * 100).toFixed(1) + '%');
        card.style.setProperty('--my', ((py + 0.5) * 100).toFixed(1) + '%');
        if (arr) {
          var ar = arr.getBoundingClientRect();
          var dx = e.clientX - (ar.left + ar.width / 2), dy = e.clientY - (ar.top + ar.height / 2);
          var d = Math.sqrt(dx * dx + dy * dy);
          var pull = d < 160 ? (1 - d / 160) : 0;
          card.style.setProperty('--axm', (dx * pull * 0.35).toFixed(1) + 'px');
          card.style.setProperty('--aym', (dy * pull * 0.35).toFixed(1) + 'px');
        }
      });
      card.addEventListener('pointerleave', function () {
        ['--tang', '--axm', '--aym'].forEach(function (p) { card.style.setProperty(p, p === '--tang' ? '0deg' : '0px'); });
      });
    });
  }

  /* About: survey comets orbiting the contour rings, mouse drift */
  var topo = root.querySelector('.about-topo svg');
  if (topo && !reduceMotion && topo.animate) {
    var NS2 = 'http://www.w3.org/2000/svg';
    topo.querySelectorAll('.at-g path').forEach(function (p, i) {
      if (i % 2) return; /* every other ring keeps it calm */
      var m = /scale\(([\d.]+)\)/.exec(p.getAttribute('transform') || '');
      var sc = m ? parseFloat(m[1]) : 1;
      var len = p.getTotalLength();
      var seg = len * 0.09;
      var c = document.createElementNS(NS2, 'path');
      c.setAttribute('d', p.getAttribute('d'));
      c.setAttribute('transform', p.getAttribute('transform'));
      c.setAttribute('class', 'at-comet');
      c.setAttribute('stroke-width', (2.2 / sc).toFixed(3));
      c.setAttribute('stroke-dasharray', seg + ' ' + (len - seg));
      p.parentNode.appendChild(c);
      var dir = i % 4 === 0 ? 1 : -1;
      c.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: dir * -len }], {
        duration: 9000 + i * 1300, iterations: Infinity, delay: -i * 700
      });
    });
    var about = root.querySelector('.about');
    var layers = topo.querySelectorAll('.at-layer');
    if (about && window.matchMedia('(pointer: fine)').matches) {
      about.addEventListener('pointermove', function (e) {
        var r = about.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        layers.forEach(function (l, k) {
          var f = k ? -18 : 26;
          l.style.setProperty('--tx', (px * f).toFixed(1) + 'px');
          l.style.setProperty('--ty', (py * f).toFixed(1) + 'px');
        });
      });
    }
  }

  /* Featured project: swap photos, timeline progress, parallax */
  var feat = root.querySelector('.feat');
  if (feat) {
    var swapBtn = feat.querySelector('.feat-inset');
    if (swapBtn) swapBtn.addEventListener('click', function () {
      var on = feat.classList.toggle('is-swapped');
      swapBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      track('featured_swap', { swapped: on });
    });
    var story = feat.querySelector('[data-story]');
    var steps = story ? story.querySelectorAll(':scope > div') : [];
    var media = feat.querySelector('.feat-media');
    var featTick = false;
    var featScroll = function () {
      featTick = false;
      var vh = window.innerHeight;
      if (story) {
        var sr = story.getBoundingClientRect();
        var prog = Math.max(0, Math.min(1, (vh * 0.75 - sr.top) / sr.height));
        story.style.setProperty('--sp', prog.toFixed(3));
        steps.forEach(function (s) { s.classList.toggle('is-on', s.getBoundingClientRect().top < vh * 0.75); });
      }
      if (media && !reduceMotion) {
        var mr = media.getBoundingClientRect();
        var p = ((mr.top + mr.height / 2) - vh / 2) / vh;
        media.style.setProperty('--fy', (p * 40).toFixed(1) + 'px');
      }
    };
    if (reduceMotion && story) { story.style.setProperty('--sp', 1); steps.forEach(function (s) { s.classList.add('is-on'); }); }
    else {
      window.addEventListener('scroll', function () { if (!featTick) { featTick = true; requestAnimationFrame(featScroll); } }, { passive: true });
      featScroll();
    }
  }

  /* Footer headline: words rise, last word rotates, cairn stacks */
  var ftrTop = root.querySelector('[data-ftr]');
  if (ftrTop && !reduceMotion) {
    ftrTop.classList.add('js-ftr');
    if ('IntersectionObserver' in window) {
      var ftio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { ftrTop.classList.add('is-live'); ftio.disconnect(); } });
      }, { threshold: 0.4 });
      ftio.observe(ftrTop);
    } else ftrTop.classList.add('is-live');
  }

  /* Reviews carousel: arrows, keys, drag, counter, progress */
  var revs = root.querySelector('[data-revs]');
  if (revs) {
    var track = revs.querySelector('.rev-track');
    var cards = Array.prototype.slice.call(track.querySelectorAll('.rev'));
    var prevB = root.querySelector('[data-rev-prev]');
    var nextB = root.querySelector('[data-rev-next]');
    var curEl = root.querySelector('[data-rev-cur]');
    var totEl = root.querySelector('[data-rev-total]');
    var prog = revs.querySelector('.rev-prog i');
    var pad2 = function (n) { return (n < 10 ? '0' : '') + n; };
    if (totEl) totEl.textContent = pad2(cards.length);
    var step = function () { return cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth; };
    var updRev = function () {
      var max = track.scrollWidth - track.clientWidth;
      var x = track.scrollLeft;
      var idx = Math.round(x / step());
      var visible = Math.max(1, Math.round(track.clientWidth / step()));
      if (curEl) curEl.textContent = pad2(Math.min(cards.length, idx + 1));
      prevB.disabled = x <= 2;
      nextB.disabled = x >= max - 2;
      var w = Math.min(100, (visible / cards.length) * 100);
      prog.style.setProperty('--rw', w + '%');
      prog.style.setProperty('--rx', (max > 0 ? (x / max) * ((100 - w) / w) * 100 : 0) + '%');
      cards.forEach(function (cd, k) { cd.classList.toggle('is-out', k < idx || k >= idx + visible); });
    };
    var go = function (dir) { track.scrollBy({ left: dir * step(), behavior: reduceMotion ? 'auto' : 'smooth' }); };
    prevB.addEventListener('click', function () { go(-1); });
    nextB.addEventListener('click', function () { go(1); track_('next'); });
    function track_(d) { track('reviews_nav', { direction: d }); }
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    });
    var revTick = false;
    track.addEventListener('scroll', function () { if (!revTick) { revTick = true; requestAnimationFrame(function () { revTick = false; updRev(); }); } }, { passive: true });
    window.addEventListener('resize', updRev);
    /* mouse drag to scroll */
    var dragX = null, startL = 0, moved = false;
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      dragX = e.clientX; startL = track.scrollLeft; moved = false;
    });
    window.addEventListener('pointermove', function (e) {
      if (dragX === null) return;
      var dx = e.clientX - dragX;
      if (Math.abs(dx) > 4) { moved = true; track.classList.add('is-drag'); }
      if (moved) track.scrollLeft = startL - dx;
    });
    window.addEventListener('pointerup', function () {
      if (dragX === null) return;
      dragX = null;
      if (moved) {
        track.classList.remove('is-drag');
        var n = Math.round(track.scrollLeft / step());
        track.scrollTo({ left: n * step(), behavior: 'smooth' });
      }
    });
    updRev();
  }

  /* Section dock: show after the hero, scroll-spy, sliding highlight, swipeable strip */
  var dock = root.querySelector('.dock');
  if (dock) {
    var strip = dock.querySelector('[data-dock-links]');
    var ink = dock.querySelector('.dock-ink');
    var dLinks = Array.prototype.slice.call(dock.querySelectorAll('[data-dock]'));
    var activeId = null;
    var setActive = function (id) {
      if (id === activeId) return;
      activeId = id;
      var a = null;
      dLinks.forEach(function (l) { var on = l.getAttribute('data-dock') === id; l.classList.toggle('is-active', on); if (on) { a = l; l.setAttribute('aria-current', 'true'); } else l.removeAttribute('aria-current'); });
      if (a) {
        ink.style.opacity = '1';
        ink.style.width = a.offsetWidth + 'px';
        ink.style.transform = 'translateX(' + a.offsetLeft + 'px)';
        var target = a.offsetLeft - (strip.clientWidth - a.offsetWidth) / 2;
        strip.scrollTo({ left: target, behavior: reduceMotion ? 'auto' : 'smooth' });
      } else ink.style.opacity = '0';
    };
    var dockSecs = dLinks.map(function (l) { return document.getElementById(l.getAttribute('data-dock')); }).filter(Boolean);
    var dockTick = false;
    var dockUpdate = function () {
      dockTick = false;
      var y = window.scrollY, vh = window.innerHeight;
      var menuOpen = menu && !menu.hidden;
      var nearEnd = y + vh > document.documentElement.scrollHeight - 40;
      dock.classList.toggle('is-on', y > vh * 0.6 && !menuOpen);
      var cur = null;
      dockSecs.forEach(function (s) { if (s.getBoundingClientRect().top < vh * 0.45) cur = s.id; });
      if (nearEnd) cur = null;
      setActive(cur);
    };
    window.addEventListener('scroll', function () { if (!dockTick) { dockTick = true; requestAnimationFrame(dockUpdate); } }, { passive: true });
    window.addEventListener('resize', function () { var id = activeId; activeId = null; setActive(id); });
    dLinks.concat([dock.querySelector('.dock-quote')]).forEach(function (l) {
      l.addEventListener('click', function (e) {
        var id = l.getAttribute('href').slice(1);
        var t = document.getElementById(id);
        if (!t) return;
        e.preventDefault();
        t.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        if (history.replaceState) history.replaceState(null, '', '#' + id);
        track('dock_nav', { section: id });
        setTimeout(function () {
          var f = id === 'quote' ? document.getElementById('q-first') : t;
          if (f) { if (!f.hasAttribute('tabindex') && f.tagName === 'SECTION') f.setAttribute('tabindex', '-1'); f.focus({ preventScroll: true }); }
        }, reduceMotion ? 0 : 650);
      });
    });
    dockUpdate();
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
