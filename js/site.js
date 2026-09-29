/* Отель «ЮрЛа»: поведение страниц. Без библиотек. */
(function () {
  'use strict';
  var d = document, w = window;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var reduced = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- шапка: белеет при прокрутке, прячется вниз, возвращается вверх ---------- */
  var header = $('.header');
  var up = $('.up');
  var lastY = w.scrollY, ticking = false;
  function onScroll() {
    var y = w.scrollY;
    if (header) {
      var solidFrom = header.hasAttribute('data-solid') ? -1 : 10;
      header.classList.toggle('is-solid', y > solidFrom);
      var hide = y > 300 && y > lastY + 2;
      var show = y < lastY - 2 || y <= 300;
      if (hide) header.classList.add('is-hidden');
      else if (show) header.classList.remove('is-hidden');
      d.body.classList.toggle('has-header', !header.classList.contains('is-hidden'));
    }
    if (up) up.classList.toggle('is-on', y > 300);
    lastY = y;
    ticking = false;
  }
  w.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; w.requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();
  if (up) up.addEventListener('click', function () { w.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); });

  /* ---------- меню телефона ---------- */
  var menu = $('#menu'), backdrop = $('.menu-backdrop'), menuBtn = $('.menu-btn');
  function setMenu(open) {
    if (!menu) return;
    menu.classList.toggle('is-open', open);
    if (backdrop) backdrop.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    d.documentElement.style.overflow = open ? 'hidden' : '';
    if (open) { var f = $('.menu__close', menu); if (f) f.focus(); }
    else if (menuBtn) menuBtn.focus({ preventScroll: true });
  }
  if (menuBtn) menuBtn.addEventListener('click', function () { setMenu(true); });
  $$('.menu__close').forEach(function (b) { b.addEventListener('click', function () { setMenu(false); }); });
  if (backdrop) backdrop.addEventListener('click', function () { setMenu(false); });
  if (menu) $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu && menu.classList.contains('is-open')) setMenu(false); });

  /* ---------- подменю: активный раздел ---------- */
  var subLinks = $$('.subnav a[href^="#"]');
  if (subLinks.length && 'IntersectionObserver' in w) {
    var map = {};
    subLinks.forEach(function (a) { var s = $(a.getAttribute('href')); if (s) map[s.id] = a; });
    var visible = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting ? e.intersectionRect.height : 0; });
      var best = null, bestH = 0;
      Object.keys(visible).forEach(function (id) { if (visible[id] > bestH) { bestH = visible[id]; best = id; } });
      subLinks.forEach(function (a) { a.classList.remove('is-active'); a.removeAttribute('aria-current'); });
      if (best && map[best]) {
        map[best].classList.add('is-active');
        map[best].setAttribute('aria-current', 'true');
        var bar = map[best].parentNode;
        var l = map[best].offsetLeft - 20;
        if (bar.scrollWidth > bar.clientWidth) bar.scrollTo({ left: l, behavior: reduced ? 'auto' : 'smooth' });
      }
    }, { rootMargin: '-140px 0px -45% 0px', threshold: [0, .25, .5, 1] });
    Object.keys(map).forEach(function (id) { io.observe(d.getElementById(id)); });
  }

  /* ---------- «Показать ещё 3 номера» ---------- */
  $$('[data-more]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var hidden = $$(btn.getAttribute('data-more'));
      hidden.forEach(function (el) { el.hidden = false; });
      btn.parentNode.removeChild(btn);
      if (hidden[0]) { var h = $('a, button', hidden[0]); if (h) h.focus({ preventScroll: true }); }
    });
  });

  /* ---------- большая галерея с миниатюрами ---------- */
  $$('.stage').forEach(function (st) {
    var imgs = $$('.stage__img', st), thumbs = $$('.stage__thumb', st), i = 0;
    function go(n) {
      i = (n + imgs.length) % imgs.length;
      imgs.forEach(function (im, k) {
        im.classList.toggle('is-on', k === i);
        if (k === i && im.getAttribute('data-src')) { im.src = im.getAttribute('data-src'); im.removeAttribute('data-src'); if (im.getAttribute('data-srcset')) { im.srcset = im.getAttribute('data-srcset'); im.removeAttribute('data-srcset'); } }
      });
      thumbs.forEach(function (t, k) { t.classList.toggle('is-on', k === i); t.setAttribute('aria-current', k === i ? 'true' : 'false'); });
      var live = $('.stage__live', st); if (live) live.textContent = (i + 1) + ' из ' + imgs.length + ': ' + (imgs[i].alt || '');
      if (thumbs[i]) { var bar = thumbs[i].parentNode; bar.scrollTo({ left: thumbs[i].offsetLeft - 10, behavior: reduced ? 'auto' : 'smooth' }); }
    }
    thumbs.forEach(function (t, k) { t.addEventListener('click', function () { go(k); }); });
    var p = $('.stage__arrow--prev', st), n = $('.stage__arrow--next', st);
    if (p) p.addEventListener('click', function () { go(i - 1); });
    if (n) n.addEventListener('click', function () { go(i + 1); });
    var x0 = null;
    st.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    st.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1)); x0 = null; });
  });

  /* ---------- карусели и ленты: стрелки и «тире» ---------- */
  function wireScroller(root, trackSel, itemSel) {
    var track = $(trackSel, root); if (!track) return;
    var prev = $('[data-prev]', root), next = $('[data-next]', root), dashes = $('.dashes', root);
    function items() { return $$(itemSel, track).filter(function (el) { return !el.hidden; }); }
    // «тире» донора: не больше 12, каждое — доля ленты
    function pages() { var fit = Math.max(2, Math.floor((root.clientWidth + 16) / 40)); return Math.min(12, fit, Math.max(1, Math.ceil((track.scrollWidth - 4) / track.clientWidth))); }
    function build() {
      if (!dashes) return;
      var n = pages(); dashes.innerHTML = '';
      if (n < 2) return;
      for (var k = 0; k < n; k++) {
        var b = d.createElement('button'); b.type = 'button';
        b.setAttribute('aria-label', 'Часть ' + (k + 1) + ' из ' + n);
        (function (k) { b.addEventListener('click', function () { var max = track.scrollWidth - track.clientWidth; track.scrollTo({ left: Math.round(max * k / (n - 1)), behavior: reduced ? 'auto' : 'smooth' }); }); })(k);
        dashes.appendChild(b);
      }
      sync();
    }
    function sync() {
      var max = track.scrollWidth - track.clientWidth - 2;
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max;
      if (dashes) {
        var bs = $$('button', dashes), n = bs.length; if (!n) return;
        var k = max > 0 ? Math.round(track.scrollLeft / max * (n - 1)) : 0;
        bs.forEach(function (b, j) { b.classList.toggle('is-on', j === k); });
      }
    }
    function step(dir) {
      var it = items(); var wdt = it.length ? it[0].getBoundingClientRect().width + 16 : track.clientWidth;
      var by = Math.max(wdt, Math.floor(track.clientWidth / wdt) * wdt);
      track.scrollBy({ left: dir * by, behavior: reduced ? 'auto' : 'smooth' });
    }
    if (prev) prev.addEventListener('click', function () { step(-1); });
    if (next) next.addEventListener('click', function () { step(1); });
    track.addEventListener('scroll', function () { w.requestAnimationFrame(sync); }, { passive: true });
    w.addEventListener('resize', build);
    root._rebuild = function () { track.scrollLeft = 0; build(); };
    build();
  }
  $$('.carousel').forEach(function (c) { wireScroller(c, '.carousel__track', '.card'); });
  $$('.strip').forEach(function (s) { wireScroller(s, '.strip__track', '.strip__item'); });

  /* ---------- вкладки галереи (серый → чёрный, смена сразу) ---------- */
  $$('[data-tabs]').forEach(function (tabs) {
    var strip = $(tabs.getAttribute('data-tabs'));
    var btns = $$('button', tabs);
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
        var cat = b.getAttribute('data-cat');
        $$('.strip__item', strip).forEach(function (it) {
          it.hidden = !(cat === 'all' || (' ' + it.getAttribute('data-cat') + ' ').indexOf(' ' + cat + ' ') >= 0);
        });
        if (strip._rebuild) strip._rebuild();
      });
    });
  });

  /* ---------- «Вопрос-ответ»: категории и аккордеон (плюс 0 → 45°) ---------- */
  $$('.faq').forEach(function (faq) {
    var cats = $$('.faq__cats button', faq);
    cats.forEach(function (b) {
      b.addEventListener('click', function () {
        cats.forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
        $$('.faq__panel', faq).forEach(function (p) { p.hidden = p.id !== b.getAttribute('aria-controls'); });
      });
    });
  });
  $$('.acc__q').forEach(function (q) {
    q.addEventListener('click', function () {
      var open = q.getAttribute('aria-expanded') === 'true';
      q.setAttribute('aria-expanded', open ? 'false' : 'true');
      var a = d.getElementById(q.getAttribute('aria-controls')); if (a) a.hidden = open;
    });
  });
  // ссылка на категорию «Как добраться»
  $$('[data-faq-cat]').forEach(function (a) {
    a.addEventListener('click', function () {
      var b = $('.faq__cats button[aria-controls="' + a.getAttribute('data-faq-cat') + '"]');
      if (b) b.click();
    });
  });

  /* ---------- бронь ---------- */
  var dlg = $('#booking');
  var form = dlg ? $('form', dlg) : null;
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(dt) { return dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate()); }
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var tomorrow = new Date(today.getTime() + 864e5);
  $$('input[type="date"]').forEach(function (inp) { inp.min = iso(today); });
  // выезд не раньше заезда + 1 день
  function pairDates(inEl, outEl) {
    if (!inEl || !outEl) return;
    inEl.addEventListener('change', function () {
      if (!inEl.value) return;
      var a = new Date(inEl.value + 'T00:00:00');
      var min = new Date(a.getTime() + 864e5);
      outEl.min = iso(min);
      if (!outEl.value || new Date(outEl.value + 'T00:00:00') <= a) outEl.value = iso(min);
    });
  }
  $$('.book').forEach(function (bar) {
    var a = $('[name="date_start"]', bar), b = $('[name="date_end"]', bar);
    if (a && !a.value) a.value = iso(today);
    if (b && !b.value) { b.value = iso(tomorrow); b.min = iso(tomorrow); }
    pairDates(a, b);
  });
  if (form) pairDates($('[name="date_start"]', form), $('[name="date_end"]', form));

  function openBooking(data) {
    if (!dlg || !form) return;
    dlg.classList.remove('is-done');
    form.classList.remove('is-sending');
    var st = $('.form__status', form); if (st) { st.textContent = ''; st.className = 'form__status'; }
    data = data || {};
    ['n', 'date_start', 'date_end', 'vz', 'det'].forEach(function (k) {
      var el = form.elements[k]; if (el && data[k] != null && data[k] !== '') el.value = data[k];
    });
    if (form.elements.date_start && !form.elements.date_start.value) form.elements.date_start.value = iso(today);
    if (form.elements.date_end && !form.elements.date_end.value) form.elements.date_end.value = iso(tomorrow);
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    var first = form.elements.fio; if (first) setTimeout(function () { first.focus(); }, 30);
  }
  $$('.book').forEach(function (bar) {
    bar.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = bar.elements;
      var guests = f.guests ? f.guests.value.split('-') : [];
      openBooking({ n: f.n && f.n.value, date_start: f.date_start && f.date_start.value, date_end: f.date_end && f.date_end.value, vz: guests[0], det: guests[1] });
    });
  });
  $$('[data-book]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.preventDefault();
      openBooking({ n: b.getAttribute('data-book') });
    });
  });
  if (dlg) {
    $$('[data-close]', dlg).forEach(function (b) { b.addEventListener('click', function () { dlg.close ? dlg.close() : dlg.removeAttribute('open'); }); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg && dlg.close) dlg.close(); });
  }

  // маска телефона: +7 (___) ___-__-__; курсор держится за цифрами, а не за позицией
  var PREFIX = '+7 (';
  function fmtPhone(d) { // d — до 10 цифр без кода страны
    var r = PREFIX + d.slice(0, 3);
    if (d.length >= 3) r += ')';
    if (d.length > 3) r += ' ' + d.slice(3, 6);
    if (d.length > 6) r += '-' + d.slice(6, 8);
    if (d.length > 8) r += '-' + d.slice(8, 10);
    return r;
  }
  function national(raw, withPrefix) { // цифры номера без +7 / 8
    var x = raw.replace(/\D/g, '');
    if (withPrefix) x = x.slice(1);
    else if (x.length > 10 && /^[78]/.test(x)) x = x.slice(1);
    return x.slice(0, 10);
  }
  function caretAfter(f, n) { // позиция после n-й цифры номера
    if (n <= 0) return PREFIX.length;
    for (var i = PREFIX.length, k = 0; i < f.length; i++) if (/\d/.test(f.charAt(i)) && ++k === n) return i + 1;
    return f.length;
  }
  if (form && form.elements.phone) {
    var ph = form.elements.phone;
    ph.addEventListener('focus', function () {
      if (!ph.value) { ph.value = PREFIX; setTimeout(function () { ph.setSelectionRange(PREFIX.length, PREFIX.length); }, 0); }
    });
    ph.addEventListener('keydown', function (e) {
      var s = ph.selectionStart, en = ph.selectionEnd;
      if (s !== en) return;
      if (e.key === 'Backspace') { // перешагнуть «) », «-», « (» и стереть цифру перед ними
        var p = s;
        while (p > PREFIX.length && /\D/.test(ph.value.charAt(p - 1))) p--;
        if (p <= PREFIX.length) { e.preventDefault(); if (!national(ph.value, true)) ph.value = PREFIX; ph.setSelectionRange(PREFIX.length, PREFIX.length); return; }
        if (p !== s) ph.setSelectionRange(p, p);
      } else if (e.key === 'Delete') {
        var q = s;
        while (q < ph.value.length && /\D/.test(ph.value.charAt(q))) q++;
        if (q !== s) ph.setSelectionRange(q, q);
      }
    });
    ph.addEventListener('paste', function (e) {
      var t = (e.clipboardData || w.clipboardData).getData('text') || '';
      var d = t.replace(/\D/g, '');
      if (d.length >= 10) { // целый номер — заменяет поле
        e.preventDefault();
        ph._d = national(t, false); ph.value = fmtPhone(ph._d);
        ph.setSelectionRange(ph.value.length, ph.value.length);
        ph.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    ph.addEventListener('input', function () {
      var raw = ph.value, pos = ph.selectionStart == null ? raw.length : ph.selectionStart;
      var withPrefix = /^\+7/.test(raw);
      var before = raw.slice(0, pos).replace(/\D/g, '').length - (withPrefix ? 1 : 0);
      if (!withPrefix && raw.replace(/\D/g, '').length > 10 && /^[78]/.test(raw.replace(/\D/g, ''))) before--;
      var d = national(raw, withPrefix);
      // первая набранная 7 или 8 — код страны, а не цифра номера («8 900…», «7 900…»)
      if (!ph._d && !ph._cc && d.length === 1 && /[78]/.test(d)) { d = ''; before = 0; ph._cc = true; }
      if (!d) { ph._d = ''; if (!raw || raw === '+' ) ph._cc = false; ph.value = /\d/.test(raw.replace(/^\+7/, '')) || withPrefix ? PREFIX : ''; ph.setSelectionRange(ph.value.length, ph.value.length); return; }
      var f = fmtPhone(d);
      ph.value = f; ph._d = d;
      var c = caretAfter(f, Math.max(0, Math.min(before, d.length)));
      ph.setSelectionRange(c, c);
    });
    ph.addEventListener('blur', function () { if (!national(ph.value, /^\+7/.test(ph.value))) { ph.value = ''; ph._d = ''; ph._cc = false; } });
  }

  function setErr(name, msg) {
    var el = form.elements[name]; if (!el) return;
    var box = el.closest('.field, .check'); if (!box) return;
    box.classList.toggle('is-bad', !!msg);
    var e = $('.field__err', box); if (e) e.textContent = msg || '';
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }
  function validate() {
    var f = form.elements, ok = true, first = null;
    function bad(n, m) { setErr(n, m); if (m) { ok = false; if (!first) first = f[n]; } }
    bad('fio', f.fio.value.trim().length < 2 ? 'Напишите, как к вам обращаться' : '');
    var nd = national(f.phone.value, /^\+7/.test(f.phone.value));
    bad('phone', !nd ? 'Укажите телефон: по нему с вами свяжется администратор' : nd.length !== 10 ? 'Проверьте номер: после +7 нужно 10 цифр' : '');
    var mail = f.mail.value.trim();
    bad('mail', mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail) ? 'Проверьте адрес почты: в нём нет «@» или точки' : '');
    bad('date_start', !f.date_start.value ? 'Выберите дату заезда' : '');
    var badOut = '';
    if (!f.date_end.value) badOut = 'Выберите дату выезда';
    else if (f.date_start.value && f.date_end.value <= f.date_start.value) badOut = 'Выезд — позже заезда';
    bad('date_end', badOut);
    bad('agree', !f.agree.checked ? 'Без согласия мы не сможем принять заявку' : '');
    if (first) first.focus();
    return ok;
  }
  if (form) {
    ['fio', 'phone', 'mail', 'date_start', 'date_end', 'agree'].forEach(function (n) {
      var el = form.elements[n]; if (el) el.addEventListener('change', function () { setErr(n, ''); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) return;
      var st = $('.form__status', form);
      st.textContent = 'Отправляем…'; st.className = 'form__status';
      form.classList.add('is-sending');
      var f = form.elements;
      function old(v) { return v ? v.replace(/-/g, '.') : ''; } // старая форма: ГГГГ.ММ.ДД
      var body = new URLSearchParams();
      body.set('date_start', old(f.date_start.value));
      body.set('date_end', old(f.date_end.value));
      body.set('vz', f.vz.value);
      body.set('det', f.det.value);
      body.set('mail', f.mail.value.trim());
      body.set('phone', f.phone.value);
      body.set('fio', f.fio.value.trim());
      var url = (form.getAttribute('data-endpoint') || '/remote.php?f=1') + '&n=' + encodeURIComponent(f.n.value || '0');
      fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest' }, body: body.toString() })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
        .then(function (t) {
          form.classList.remove('is-sending');
          if (t.indexOf('success') > -1) { st.textContent = ''; dlg.classList.add('is-done'); var h = $('.done h2', dlg); if (h) { h.setAttribute('tabindex', '-1'); h.focus(); } }
          else { var msg = t.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); st.textContent = msg || 'Заявка не ушла.'; st.className = 'form__status is-error'; }
        })
        .catch(function () {
          form.classList.remove('is-sending');
          st.innerHTML = 'Не получилось отправить заявку. Позвоните нам: <a href="tel:+74855289063">+7 (4855) 28-90-63</a> — забронируем по телефону.';
          st.className = 'form__status is-error';
        });
    });
  }
})();
