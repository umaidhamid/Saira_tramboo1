/* Core portfolio behaviour shared by every page: piece cards, detail view, search, overlays. Orders happen on Instagram. */
(() => {
  'use strict';
  document.documentElement.classList.add('js');

  const { collections, featured, insta } = window.SR_CATALOG;
  const products = window.SR_PRODUCTS;
  const byId = id => products.find(p => p.id === id);

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-show'), 2400);
  }

  /* ---------- product card ---------- */
  function cardHTML(p) {
    return `
    <article class="card" data-id="${p.id}">
      <div class="card__media">
        <button class="card__hit" data-qv="${p.id}" aria-label="View: ${esc(p.name)}" tabindex="-1"></button>
        <img src="${p.image}" width="600" height="800" loading="lazy" alt="${esc(p.name)} in ${esc(p.colorName.toLowerCase())}">
        <img src="${p.image2}" width="600" height="800" loading="lazy" alt="" aria-hidden="true">
        <div class="tags">${p.isNew ? '<span class="tag">New</span>' : ''}</div>
      </div>
      <div class="card__info">
        <span class="card__cat">${esc(p.category)} · ${esc(p.fabric)}</span>
        <h3 class="card__name"><button data-qv="${p.id}">${esc(p.name)}</button></h3>
        <button class="card__qv" data-qv="${p.id}">View piece</button>
      </div>
    </article>`;
  }

  /* ---------- overlays ---------- */
  let lastFocus = null, openName = null;
  const layers = {
    qv: { el: $('#qv') },
    menu: { el: $('#mobileNav') },
    search: { el: $('#search') },
    filters: { el: $('#filterPanel'), scrim: true },
  };
  function openLayer(name) {
    const L = layers[name];
    if (name === 'filters') L.el = $('#filterPanel');
    if (!L || !L.el) return;
    if (openName) closeLayer(true);
    lastFocus = document.activeElement;
    openName = name;
    if (name === 'search') L.el.hidden = false;
    void L.el.offsetWidth;
    L.el.classList.add('is-open');
    L.el.setAttribute('aria-hidden', 'false');
    if (L.scrim) $('#drawerScrim').classList.add('is-open');
    document.body.classList.add('is-locked');
    $('#menuOpen').setAttribute('aria-expanded', name === 'menu');
    const focusTarget = name === 'search' ? $('#searchInput') : $('button, [href], input', L.el);
    setTimeout(() => focusTarget && focusTarget.focus({ preventScroll: true }), 60);
  }
  function closeLayer(keepFocus) {
    if (!openName) return;
    const L = layers[openName];
    L.el.classList.remove('is-open');
    L.el.setAttribute('aria-hidden', 'true');
    if (openName === 'search') setTimeout(() => { if (!L.el.classList.contains('is-open')) L.el.hidden = true; }, 350);
    $('#drawerScrim').classList.remove('is-open');
    document.body.classList.remove('is-locked');
    $('#menuOpen').setAttribute('aria-expanded', 'false');
    openName = null;
    if (!keepFocus && lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  /* ---------- quick view ---------- */
  function openQuickView(id) {
    const p = byId(id);
    const box = $('#qvBox');
    box.innerHTML = `
      <button class="icon-btn qv__close" data-close-modal aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="1.4"/></svg></button>
      <div class="qv__gallery">
        <img id="qvMain" src="${p.image}" width="600" height="800" alt="${esc(p.name)}">
        <div class="qv__thumbs">
          <button class="is-active" data-thumb="${p.image}" aria-label="Show front view"><img src="${p.image}" width="56" height="75" alt=""></button>
          <button data-thumb="${p.image2}" aria-label="Show detail view"><img src="${p.image2}" width="56" height="75" alt=""></button>
        </div>
      </div>
      <div class="qv__info">
        <span class="card__cat">${esc(p.category)} · ${esc(p.colorName)}</span>
        <h2 id="qvName">${esc(p.name)}</h2>
        <p class="qv__desc">${esc(p.desc)}</p>
        <dl class="qv__specs"><div><dt>Fabric</dt><dd>${esc(p.fabric)}</dd></div><div><dt>Work</dt><dd>${esc(p.work.join(', '))}</dd></div><div><dt>Occasion</dt><dd>${esc(p.occasion.join(', '))}</dd></div></dl>
        <a class="btn btn--solid" href="${insta.url}" target="_blank" rel="noopener">Enquire on Instagram</a>
        <div class="qv__list"><span>Message us the piece name <strong>${esc(p.name)}</strong> to enquire or order.</span></div>
      </div>`;

    box.onclick = e => {
      const t = e.target.closest('button'); if (!t) return;
      if (t.dataset.thumb) {
        $('#qvMain').src = t.dataset.thumb;
        $$('.qv__thumbs button', box).forEach(b => b.classList.toggle('is-active', b === t));
      }
    };
    openLayer('qv');
  }

  /* ---------- search ---------- */
  const searchHay = p => `${p.name} ${p.categories.join(' ')} ${p.colorName} ${p.color} ${p.fabric} ${p.work.join(' ')} ${p.occasion.join(' ')} ${p.desc}`.toLowerCase();
  function runSearch(q) {
    q = q.trim().toLowerCase();
    const out = $('#searchResults'), hint = $('#searchHint');
    if (!q) {
      hint.textContent = 'Popular searches';
      out.innerHTML = `<div class="search__tags" style="grid-column:1/-1">${['Kurta', 'Saree', 'Embroidered', 'Red', 'Green', 'Festive', 'Lehenga', 'Silk'].map(t => `<button class="chip" data-term="${t}">${t}</button>`).join('')}</div>`;
      return;
    }
    const words = q.split(/\s+/);
    const res = products.filter(p => { const h = searchHay(p); return words.every(w => h.includes(w)); });
    hint.textContent = res.length ? `${res.length} result${res.length > 1 ? 's' : ''} for “${q}”` : `No results for “${q}”`;
    out.innerHTML = res.length ? res.slice(0, 8).map(p => `
      <button class="sr" data-qv="${p.id}"><img src="${p.image}" width="64" height="85" alt="${esc(p.name)}">
        <div><strong>${esc(p.name)}</strong><span>${esc(p.category)} · ${esc(p.colorName)}</span></div></button>`).join('')
      + (res.length > 8 ? `<a class="btn btn--line" style="grid-column:1/-1;justify-self:center" href="shop.html?q=${encodeURIComponent(q)}">View all ${res.length} results</a>` : '')
      : '<p class="empty" style="grid-column:1/-1">Try “kurta”, “saree”, “embroidered” or a colour.</p>';
  }
  function submitSearch(v) {
    v = v.trim();
    if (!v) return;
    if (window.SR.onSearch) { closeLayer(true); window.SR.onSearch(v); } else location.href = 'shop.html?q=' + encodeURIComponent(v);
  }

  /* ---------- events ---------- */
  document.addEventListener('click', e => {
    const q = sel => e.target.closest(sel);
    let el;
    if ((el = q('[data-qv]'))) { if (openName === 'search') closeLayer(true); openQuickView(+el.dataset.qv); return; }
    if ((el = q('[data-term]'))) { $('#searchInput').value = el.dataset.term; runSearch(el.dataset.term); return; }
    if (q('[data-close], [data-close-modal], [data-close-menu]')) { closeLayer(); return; }
    if (q('.mobile-nav a')) closeLayer(true);
  });

  $('#menuOpen').addEventListener('click', () => openLayer('menu'));
  $('#menuClose').addEventListener('click', () => closeLayer());
  $('#searchOpen').addEventListener('click', () => { openLayer('search'); runSearch($('#searchInput').value); });
  $('#searchClose').addEventListener('click', () => closeLayer());
  $('#searchInput').addEventListener('input', e => runSearch(e.target.value));
  $('#searchInput').addEventListener('keydown', e => { if (e.key === 'Enter') submitSearch(e.target.value); });
  $('#drawerScrim').addEventListener('click', () => closeLayer());

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeLayer(); return; }
    if (e.key !== 'Tab' || !openName) return;
    const f = $$('button:not([disabled]), [href], input, select', layers[openName].el).filter(x => x.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  const header = $('#header');
  const onScroll = () => header.classList.toggle('is-small', window.scrollY > 60);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- home page sections ---------- */
  const sig = $('#signatureGrid');
  if (sig) sig.innerHTML = featured.map(id => cardHTML(byId(id))).join('');
  const fresh = $('#newGrid');
  if (fresh) fresh.innerHTML = [...products].sort((a, b) => a.added - b.added).slice(0, 4).map(cardHTML).join('');

  /* scroll reveal */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }), { threshold: .12 }) : null;
  const reveal = () => $$('.reveal:not(.is-in)').forEach((el, i) => {
    el.style.setProperty('--rd', (i % 4) * 90 + 'ms');
    io ? io.observe(el) : el.classList.add('is-in');
  });
  reveal();

  window.SR = { products, byId, esc, cardHTML, searchHay, openLayer, closeLayer, toast, reveal, collections, onSearch: null };
  runSearch('');
})();
