/* Collections index grid, and the "More collections" strip on a collection page. */
(() => {
  'use strict';
  const { collections } = window.SR_CATALOG;
  const count = c => window.SR_PRODUCTS.filter(p => p.collections.includes(c.slug)).length;
  const card = (c, big) => `<a class="ccard${big ? ' ccard--big' : ''} reveal" href="collection.html?c=${c.slug}">
    <img src="${c.image}" width="900" height="1000" loading="lazy" alt="${c.title} collection">
    <span class="ccard__label"><small>${count(c)} pieces</small><strong>${c.title}</strong><em>Explore →</em></span></a>`;
  const grid = document.getElementById('cgrid');
  if (grid) grid.innerHTML = collections.map(c => card(c)).join('');
  const mc = document.getElementById('mcGrid');
  if (mc) {
    const cur = new URLSearchParams(location.search).get('c');
    mc.innerHTML = collections.filter(c => c.slug !== cur).slice(0, 4).map(c => card(c)).join('');
  }
  if (window.SR) window.SR.reveal();
})();
