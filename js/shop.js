/* Listing engine used by shop.html and collection.html: filters, sorting, URL state, load more. */
(() => {
  'use strict';
  const SR = window.SR, CAT = window.SR_CATALOG;
  const { facets, sorts, collections, pageSize } = CAT;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { esc } = SR;

  const params = new URLSearchParams(location.search);
  const colSlug = document.body.dataset.page === 'collection' ? params.get('c') : null;
  const collection = collections.find(c => c.slug === colSlug) || null;

  const mount = $('#listing');
  if (document.body.dataset.page === 'collection' && !collection) {
    $('#collectionHero').innerHTML = `<div class="empty-state"><h1>Collection not found</h1><p>We couldn't find that collection.</p><a class="btn btn--solid" href="collections.html">View all collections</a></div>`;
    mount.remove();
    return;
  }

  /* ----- page chrome: breadcrumb + header / hero ----- */
  const crumbs = (items) => `<nav class="crumbs" aria-label="Breadcrumb"><ol>${items.map(([l, h], i) => `<li>${h ? `<a href="${h}">${l}</a>` : `<span aria-current="page">${l}</span>`}</li>`).join('')}</ol></nav>`;
  const base = collection ? SR.products.filter(p => p.collections.includes(collection.slug)) : SR.products;
  if (collection) {
    document.title = `${collection.title} — Saira tramboo`;
    $('#collectionHero').innerHTML = `
      <div class="chero">
        <div class="chero__copy">
          ${crumbs([['Home', 'index.html'], ['Collections', 'collections.html'], [collection.title]])}
          <p class="eyebrow hero-anim" style="--d:0ms">${esc(collection.eyebrow)}</p>
          <h1 class="hero-anim" style="--d:80ms">${esc(collection.title)}</h1>
          <p class="chero__desc hero-anim" style="--d:160ms">${esc(collection.desc)}</p>
          <p class="chero__count hero-anim" style="--d:240ms">${base.length} pieces</p>
        </div>
        <div class="chero__media hero-anim" style="--d:120ms"><img src="${collection.image}" width="900" height="1000" alt="${esc(collection.title)} collection"></div>
      </div>`;
  } else {
    $('#shopHead').innerHTML = `${crumbs([['Home', 'index.html'], ['Gallery']])}<h1>The Gallery</h1><p>Every piece from the atelier. Browse by occasion, fabric, colour and more.</p>`;
  }

  /* ----- state ----- */
  const MULTI = ['cat', 'col', 'color', 'fabric', 'occasion', 'work'];
  const SINGLE = [];
  const activeFacets = Object.keys(facets).filter(k => !(collection && k === 'col'));
  const empty = () => ({ q: '', sort: 'featured', pages: 1, ...Object.fromEntries(MULTI.map(k => [k, []])) });
  let state = empty();

  function readURL() {
    const s = empty();
    const p = new URLSearchParams(location.search);
    s.q = p.get('q') || '';
    if (sorts.some(x => x[0] === p.get('sort'))) s.sort = p.get('sort');
    s.pages = Math.max(1, Math.min(20, +p.get('page') || 1));
    MULTI.forEach(k => { const v = p.get(k); if (v) s[k] = v.split(',').filter(x => facets[k].options.some(o => (Array.isArray(o) ? o[0] : o) === x)); });
    SINGLE.forEach(k => { const v = p.get(k); if (v && facets[k].options.some(o => o[0] === v)) s[k] = v; });
    return s;
  }
  function writeURL() {
    const p = new URLSearchParams();
    if (collection) p.set('c', collection.slug);
    if (state.q) p.set('q', state.q);
    MULTI.forEach(k => state[k].length && p.set(k, state[k].join(',')));
    SINGLE.forEach(k => state[k] && p.set(k, state[k]));
    if (state.sort !== 'featured') p.set('sort', state.sort);
    if (state.pages > 1) p.set('page', state.pages);
    const qs = p.toString();
    try { history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '')); } catch { /* file:// in some browsers */ }
  }

  /* ----- filtering ----- */
  const optVal = o => (Array.isArray(o) ? o[0] : o);
  const optLabel = o => (Array.isArray(o) ? o[1] : o);
  function matches(p, s, skip) {
    for (const k of activeFacets) {
      if (k === skip) continue;
      const f = facets[k];
      if (SINGLE.includes(k)) { if (s[k] && !f.test(p, s[k], f)) return false; }
      else if (s[k].length && !s[k].some(v => f.test(p, v, f))) return false;
    }
    if (s.q) { const h = SR.searchHay(p); if (!s.q.toLowerCase().split(/\s+/).every(w => h.includes(w))) return false; }
    return true;
  }
  const results = () => {
    const cmp = sorts.find(x => x[0] === state.sort)[2];
    return base.filter(p => matches(p, state)).sort((a, b) => cmp(a, b) || a.id - b.id);
  };

  /* ----- markup ----- */
  const catNav = ['All', 'Sarees', 'Suits', 'Anarkali', 'Kurtis', 'Lehengas', 'Sharara Sets', 'Co-ord Sets', 'Dupattas', 'Dresses', 'Bottom Wear'];
  mount.innerHTML = `
    <div class="catnav" id="catNav" role="group" aria-label="Browse by category">${catNav.map(c => `<button class="chip" data-cat="${c === 'All' ? '' : c}">${c}</button>`).join('')}</div>
    <div class="toolbar">
      <button class="btn btn--line toolbar__filters" id="filterOpen" aria-controls="filterPanel"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10" stroke="currentColor" stroke-width="1.4" fill="none"/><circle cx="16" cy="7" r="2" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="8" cy="17" r="2" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>Filters<span class="toolbar__n" id="filterN" hidden></span></button>
      <p class="toolbar__count" id="count" role="status" aria-live="polite"></p>
      <label class="toolbar__sort"><span>Sort by</span><select id="sort">${sorts.map(s => `<option value="${s[0]}">${s[1]}</option>`).join('')}</select></label>
    </div>
    <div class="fchips" id="chips" aria-label="Active filters"></div>
    <div class="shoplayout">
      <aside class="filters-panel" id="filterPanel" aria-label="Filters">
        <div class="filters-panel__head"><h2>Filters</h2><button class="icon-btn" data-close aria-label="Close filters"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="1.4"/></svg></button></div>
        <div class="filters-panel__body" id="facets"></div>
        <div class="filters-panel__foot"><button class="btn btn--line" id="clearPanel">Clear all</button><button class="btn btn--solid" id="applyPanel" data-close>Show results</button></div>
      </aside>
      <div class="results">
        <div class="grid grid--shop" id="grid" aria-live="polite"></div>
        <div class="more" id="more"></div>
      </div>
    </div>`;

  const OPEN = new Set(['cat', 'color']);
  function facetHTML(k) {
    const f = facets[k];
    let inner;
    if (k === 'color') {
      inner = `<ul class="swatches">${f.options.map(c => `<li><label class="sw" title="${c}"><input type="checkbox" data-k="color" data-v="${c}"><span class="sw__dot" style="background:${f.swatch[c]}"></span><span class="sw__l">${c}</span><span class="fopt__n" data-n="color:${c}"></span></label></li>`).join('')}</ul>`;
    } else {
      inner = `<ul class="flist">${f.options.map(o => `<li><label class="fopt"><input type="checkbox" data-k="${k}" data-v="${optVal(o)}"><span class="fopt__box${f.single ? ' fopt__box--r' : ''}"></span><span class="fopt__l">${optLabel(o)}</span><span class="fopt__n" data-n="${k}:${optVal(o)}"></span></label></li>`).join('')}</ul>`;
    }
    return `<details class="fgroup" data-g="${k}"${OPEN.has(k) ? ' open' : ''}><summary>${f.label}<span class="fgroup__n" data-gn="${k}"></span></summary>${inner}</details>`;
  }
  $('#facets').innerHTML = activeFacets.map(facetHTML).join('');

  /* ----- sync UI with state ----- */
  const labelFor = (k, v) => { const o = facets[k].options.find(x => optVal(x) === v); return o ? optLabel(o) : v; };
  function filterCount() {
    return MULTI.reduce((n, k) => n + state[k].length, 0) + (state.q ? 1 : 0);
  }
  function syncFacets() {
    $$('#facets input[type=checkbox]').forEach(i => {
      const k = i.dataset.k, v = i.dataset.v;
      i.checked = SINGLE.includes(k) ? state[k] === v : state[k].includes(v);
    });
    activeFacets.forEach(k => {
      const f = facets[k];
      const pool = base.filter(p => matches(p, state, k));
      f.options.forEach(o => {
        const v = optVal(o);
        const n = pool.filter(p => f.test(p, v, f)).length;
        const input = $(`#facets input[data-k="${k}"][data-v="${v}"]`);
        const out = $(`[data-n="${k}:${v}"]`);
        if (out) out.textContent = n;
        const dis = n === 0 && !input.checked;
        input.disabled = dis;
        input.closest('label').classList.toggle('is-zero', dis);
      });
      const sel = SINGLE.includes(k) ? (state[k] ? 1 : 0) : state[k].length;
      const g = $(`[data-gn="${k}"]`); g.textContent = sel ? sel : ''; g.hidden = !sel;
    });
    $('#sort').value = state.sort;
    const cat = state.cat.length === 1 && !state.q ? state.cat[0] : '';
    $$('#catNav .chip').forEach(c => { const on = c.dataset.cat === cat && state.cat.length <= 1; c.classList.toggle('is-active', on); c.setAttribute('aria-pressed', on); });
  }
  function renderChips() {
    const chips = [];
    if (state.q) chips.push(['q', '', `Search: “${state.q}”`]);
    MULTI.forEach(k => state[k].forEach(v => chips.push([k, v, labelFor(k, v)])));
    SINGLE.forEach(k => state[k] && chips.push([k, state[k], labelFor(k, state[k])]));
    $('#chips').innerHTML = chips.length ? chips.map(([k, v, l]) => `<button class="fchip" data-rk="${k}" data-rv="${esc(v)}" aria-label="Remove filter: ${esc(l)}">${esc(l)}<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" fill="none"/></svg></button>`).join('') + '<button class="fchip fchip--clear" data-clear>Clear all</button>' : '';
    const n = filterCount(), b = $('#filterN');
    b.textContent = n; b.hidden = !n;
  }

  /* ----- grid ----- */
  let skeletonTimer;
  const skeleton = n => Array.from({ length: n }, () => '<div class="card card--skel" aria-hidden="true"><div class="card__media"></div><div class="skel-l"></div><div class="skel-l skel-l--s"></div></div>').join('');
  function render() {
    const list = results();
    const shown = list.slice(0, state.pages * pageSize);
    const grid = $('#grid'), more = $('#more');
    $('#count').textContent = list.length === base.length && !filterCount() ? `${list.length} pieces` : `${list.length} of ${base.length} pieces`;
    if (!list.length) {
      grid.innerHTML = '';
      more.innerHTML = `<div class="empty-state"><h2>No pieces match these filters</h2><p>Try removing a filter.</p><button class="btn btn--solid" data-clear>Clear all filters</button><p class="empty-state__alt">Or explore <a href="collections.html">our collections</a>.</p></div>`;
    } else {
      grid.innerHTML = shown.map(SR.cardHTML).join('');
      more.innerHTML = shown.length < list.length
        ? `<p>Showing ${shown.length} of ${list.length}</p><div class="more__bar"><i style="width:${shown.length / list.length * 100}%"></i></div><button class="btn btn--line" id="loadMore">Load more</button>`
        : `<p>You have seen all ${list.length} pieces</p>`;
    }
    syncFacets(); renderChips(); writeURL();
    $('#applyPanel').textContent = `Show ${list.length} result${list.length === 1 ? '' : 's'}`;
  }
  function update(opts) { state.pages = opts && opts.keepPages ? state.pages : 1; render(); }

  /* ----- events ----- */
  mount.addEventListener('change', e => {
    const i = e.target.closest('input[data-k]'); if (!i) return;
    const k = i.dataset.k, v = i.dataset.v;
    if (SINGLE.includes(k)) state[k] = i.checked ? v : '';
    else state[k] = i.checked ? [...state[k], v] : state[k].filter(x => x !== v);
    update();
  });
  $('#sort').addEventListener('change', e => { state.sort = e.target.value; update(); });
  mount.addEventListener('click', e => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.rk) {
      const k = t.dataset.rk, v = t.dataset.rv;
      if (k === 'q') state.q = ''; else if (SINGLE.includes(k)) state[k] = ''; else state[k] = state[k].filter(x => x !== v);
      update();
    } else if (t.hasAttribute('data-clear') || t.id === 'clearPanel') {
      state = { ...empty(), sort: state.sort }; update();
    } else if (t.dataset.cat !== undefined && t.closest('#catNav')) {
      state.cat = t.dataset.cat ? [t.dataset.cat] : []; update();
    } else if (t.id === 'loadMore') {
      const more = $('#more'); const grid = $('#grid');
      t.disabled = true;
      grid.insertAdjacentHTML('beforeend', skeleton(4));
      clearTimeout(skeletonTimer);
      skeletonTimer = setTimeout(() => { state.pages++; render(); }, 450);
    } else if (t.id === 'filterOpen') {
      SR.openLayer('filters');
    }
  });
  SR.onSearch = v => { state.q = v; update(); $('#grid').scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  window.addEventListener('popstate', () => { state = readURL(); render(); });

  /* ----- init: skeleton first, then the real grid ----- */
  state = readURL();
  syncFacets(); renderChips();
  $('#grid').innerHTML = skeleton(8);
  $('#count').textContent = 'Loading…';
  setTimeout(render, 380);
})();
