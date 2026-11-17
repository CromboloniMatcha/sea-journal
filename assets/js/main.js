// Move-in animation: reveal elements when they scroll into view
(function () {
  var items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('show'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  items.forEach(function (el) { io.observe(el); });
})();

// Discover Indonesia: hero video plays on click; the shade, title and button disappear
(function () {
  var hero = document.querySelector('.id-hero');
  if (!hero) return;
  var btn = hero.querySelector('.id-play');
  var box = hero.querySelector('.id-player');
  btn.addEventListener('click', function () {
    var id = hero.getAttribute('data-video');
    box.innerHTML = '<iframe src="https://www.youtube.com/embed/' + id + '?autoplay=1&rel=0" title="Discover Indonesia video" allow="autoplay; accelerometer; encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>';
    hero.classList.add('is-playing');
  });
})();

// Mobile header: add a menu button to the navbar (shown by CSS on phones only)
(function () {
  var nav = document.querySelector('.site-nav');
  var list = nav && nav.querySelector('.cat-line');
  if (!list) return;
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'nav-toggle';
  btn.setAttribute('aria-label', 'Toggle menu');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<i class="bi bi-list"></i>';
  list.parentNode.insertBefore(btn, list);
  btn.addEventListener('click', function () {
    var open = nav.classList.toggle('menu-open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.innerHTML = open ? '<i class="bi bi-x-lg"></i>' : '<i class="bi bi-list"></i>';
  });
})();

// Zoom viewer: click a picture marked data-zoom to open it full screen.
// Mouse wheel / pinch / + - buttons to zoom, drag to move, double-click to zoom in, Esc to close.
(function () {
  var triggers = document.querySelectorAll('[data-zoom]');
  if (!triggers.length) return;
  var ov, stage, img, pct, lastFocus;
  var MAX = 8;
  var st = { s: 1, x: 0, y: 0, w: 0, h: 0, min: 1 };
  var pointers = {}, drag = null, pinch = null;

  function build() {
    ov = document.createElement('div');
    ov.className = 'zoom-overlay';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.setAttribute('aria-label', 'Zoomed picture');
    ov.innerHTML =
      '<div class="zoom-bar">' +
      '<button type="button" data-act="out" aria-label="Zoom out"><i class="bi bi-dash-lg"></i></button>' +
      '<span class="zoom-pct" aria-live="polite">100%</span>' +
      '<button type="button" data-act="in" aria-label="Zoom in"><i class="bi bi-plus-lg"></i></button>' +
      '<button type="button" data-act="reset" aria-label="Fit to screen"><i class="bi bi-arrows-angle-contract"></i></button>' +
      '<button type="button" data-act="close" aria-label="Close"><i class="bi bi-x-lg"></i></button>' +
      '</div>' +
      '<div class="zoom-stage"><img class="zoom-img" alt="" draggable="false"></div>' +
      '<p class="zoom-help">Scroll or pinch to zoom · drag to move · double-click to zoom in · Esc to close</p>';
    document.body.appendChild(ov);
    stage = ov.querySelector('.zoom-stage');
    img = ov.querySelector('.zoom-img');
    pct = ov.querySelector('.zoom-pct');

    ov.querySelector('.zoom-bar').addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      var act = b.getAttribute('data-act');
      if (act === 'close') close();
      else if (act === 'in') zoomAt(1.5, 0, 0);
      else if (act === 'out') zoomAt(1 / 1.5, 0, 0);
      else if (act === 'reset') fit();
    });
    stage.addEventListener('wheel', function (e) {
      e.preventDefault();
      var c = rel(e.clientX, e.clientY);
      zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018)), c.x, c.y);
    }, { passive: false });
    stage.addEventListener('dblclick', function (e) {
      var c = rel(e.clientX, e.clientY);
      if (st.s > 1.05) fit(); else zoomAt(2.5, c.x, c.y);
    });
    stage.addEventListener('pointerdown', function (e) {
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      try { stage.setPointerCapture(e.pointerId); } catch (err) {}
      var ids = Object.keys(pointers);
      if (ids.length === 1) {
        drag = { x: e.clientX, y: e.clientY, tx: st.x, ty: st.y, moved: false, onBg: e.target === stage };
        stage.classList.add('dragging');
      } else if (ids.length === 2) {
        var a = pointers[ids[0]], b = pointers[ids[1]];
        pinch = { d: dist(a, b), s: st.s, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
        drag = null;
      }
    });
    stage.addEventListener('pointermove', function (e) {
      if (!pointers[e.pointerId]) return;
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pointers);
      if (ids.length >= 2 && pinch) {
        var a = pointers[ids[0]], b = pointers[ids[1]];
        var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        var target = clampS(pinch.s * dist(a, b) / pinch.d);
        var c = rel(mx, my);
        st.x += mx - pinch.mx; st.y += my - pinch.my;
        zoomAt(target / st.s, c.x, c.y);
        pinch.mx = mx; pinch.my = my;
      } else if (drag) {
        var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true;
        st.x = drag.tx + dx; st.y = drag.ty + dy;
        apply();
      }
    });
    function up(e) {
      delete pointers[e.pointerId];
      var ids = Object.keys(pointers);
      if (ids.length < 2) pinch = null;
      if (ids.length === 0) {
        stage.classList.remove('dragging');
        if (drag && !drag.moved && drag.onBg) close();   // click on the dark background closes
        drag = null;
      } else if (ids.length === 1) {
        var p = pointers[ids[0]];
        drag = { x: p.x, y: p.y, tx: st.x, ty: st.y, moved: true, onBg: false };
      }
    }
    stage.addEventListener('pointerup', up);
    stage.addEventListener('pointercancel', up);
    window.addEventListener('resize', function () { if (ov.classList.contains('open')) fit(); });
    document.addEventListener('keydown', function (e) {
      if (!ov.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === '+' || e.key === '=') zoomAt(1.4, 0, 0);
      else if (e.key === '-' || e.key === '_') zoomAt(1 / 1.4, 0, 0);
      else if (e.key === '0') fit();
      else if (e.key === 'ArrowLeft') { st.x += 80; apply(); }
      else if (e.key === 'ArrowRight') { st.x -= 80; apply(); }
      else if (e.key === 'ArrowUp') { st.y += 80; apply(); }
      else if (e.key === 'ArrowDown') { st.y -= 80; apply(); }
    });
  }

  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function rel(cx, cy) {          // pointer position relative to the centre of the stage
    var r = stage.getBoundingClientRect();
    return { x: cx - (r.left + r.width / 2), y: cy - (r.top + r.height / 2) };
  }
  function clampS(s) { return Math.max(st.min, Math.min(MAX, s)); }
  function clampPan() {
    var SW = stage.clientWidth, SH = stage.clientHeight;
    var mx = Math.max(0, (st.w * st.s - SW) / 2), my = Math.max(0, (st.h * st.s - SH) / 2);
    st.x = Math.max(-mx, Math.min(mx, st.x));
    st.y = Math.max(-my, Math.min(my, st.y));
  }
  function apply() {
    clampPan();
    img.style.transform = 'translate(' + st.x + 'px,' + st.y + 'px) scale(' + st.s + ')';
    pct.textContent = Math.round(st.s * 100) + '%';
  }
  function zoomAt(factor, cx, cy) {
    var s2 = clampS(st.s * factor);
    var px = (cx - st.x) / st.s, py = (cy - st.y) / st.s;
    st.x = cx - px * s2; st.y = cy - py * s2; st.s = s2;
    apply();
  }
  function fit() {                // start view: whole picture, or full width (top first) for very tall pictures
    var SW = stage.clientWidth, SH = stage.clientHeight;
    var nw = img.naturalWidth || 1, nh = img.naturalHeight || 1;
    var base = (nh / nw > 1.6) ? (SW * 0.96) / nw : Math.min(SW / nw, SH / nh) * 0.96;
    st.w = nw * base; st.h = nh * base;
    img.style.width = st.w + 'px'; img.style.height = st.h + 'px';
    img.style.marginLeft = (-st.w / 2) + 'px'; img.style.marginTop = (-st.h / 2) + 'px';
    st.min = Math.min(1, SW / st.w * 0.96, SH / st.h * 0.96);
    st.s = 1; st.x = 0; st.y = Math.max(0, (st.h - SH) / 2);
    apply();
  }
  function open(src, alt, from) {
    if (!ov) build();
    lastFocus = from;
    pointers = {}; drag = null; pinch = null;
    img.onload = function () { fit(); };
    img.alt = alt || '';
    img.style.width = img.style.height = '';
    img.src = src;
    ov.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (img.complete && img.naturalWidth) fit();
    ov.querySelector('[data-act="close"]').focus();
  }
  function close() {
    ov.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  Array.prototype.forEach.call(triggers, function (t) {
    function go() {
      var pic = t.tagName === 'IMG' ? t : t.querySelector('img');
      if (!pic || pic.style.display === 'none' || !pic.getAttribute('src')) return;   // picture file missing: nothing to zoom
      open(pic.currentSrc || pic.src, pic.alt, t);
    }
    t.addEventListener('click', go);
    t.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    });
  });
})();
