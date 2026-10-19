/* Shared site chrome (announcement, header, menus, footer, overlays). Runs before app.js. */
(() => {
  'use strict';
  const page = document.body.dataset.page || '';
  const { collections: cols, insta } = window.SR_CATALOG;
  const ico = {
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>',
    insta: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="17" cy="7" r="1" fill="currentColor"/></svg>',
  };
  const colLinks = cols.map(c => `<a href="collection.html?c=${c.slug}">${c.title}</a>`).join('');
  const cur = k => (page === k ? ' aria-current="page"' : '');

  const top = `
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="announce" id="announce"><p>Each piece is made to order. Enquire and order on Instagram <a href="${insta.url}" target="_blank" rel="noopener">@${insta.handle}</a></p></div>
  <header class="header" id="header"><div class="header__inner">
    <button class="icon-btn header__burger" id="menuOpen" aria-label="Open menu" aria-expanded="false" aria-controls="mobileNav"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h18M3 12h18M3 17h18" fill="none" stroke="currentColor" stroke-width="1.4"/></svg></button>
    <a class="wordmark" href="index.html" aria-label="Saira tramboo — home"><span class="wordmark__name">Saira tramboo</span><span class="wordmark__tag">Women's Ethnic Wear</span></a>
    <nav class="nav" aria-label="Primary">
      <a href="index.html"${cur('home')}>Home</a>
      <a href="shop.html"${cur('shop')}>Gallery</a>
      <a href="collection.html?c=new-arrivals">New Arrivals</a>
      <div class="nav__item">
        <a href="collections.html"${page === 'collections' || page === 'collection' ? ' aria-current="page"' : ''}>Collections</a>
        <div class="mega"><div class="mega__inner"><p class="mega__title">Collections</p><div class="mega__links">${colLinks}</div><a class="mega__all" href="collections.html">View all collections →</a></div></div>
      </div>
      <a href="index.html#story">About</a>
    </nav>
    <div class="header__actions">
      <button class="icon-btn" id="searchOpen" aria-label="Search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M16 16l4.5 4.5" stroke="currentColor" stroke-width="1.4"/></svg></button>
      <a class="btn btn--solid header__cta" href="${insta.url}" target="_blank" rel="noopener">Order on Instagram</a>
    </div></div></header>
  <div class="mobile-nav" id="mobileNav" aria-hidden="true">
    <div class="mobile-nav__panel" role="dialog" aria-modal="true" aria-label="Menu">
      <div class="mobile-nav__top"><span class="wordmark__name">Saira tramboo</span><button class="icon-btn" id="menuClose" aria-label="Close menu">${ico.x}</button></div>
      <nav aria-label="Mobile">
        <a href="index.html">Home</a>
        <a href="shop.html">Gallery</a>
        <a href="collection.html?c=new-arrivals">New Arrivals</a>
        <a href="collections.html">Collections</a>
        <div class="mobile-nav__sub">${colLinks}</div>
        <a href="index.html#story">About</a>
      </nav>
      <div class="mobile-nav__foot"><a href="${insta.url}" target="_blank" rel="noopener">Order on Instagram</a></div>
    </div><div class="scrim" data-close-menu></div></div>`;

  const bottom = `
  <footer class="footer"><div class="footer__grid">
    <div class="footer__brand"><span class="wordmark__name">Saira tramboo</span><span class="wordmark__tag">Women's Ethnic Wear</span>
      <p>Elegant ethnic wear for celebrations, occasions and everyday moments.</p>
      <div class="social"><a href="${insta.profile}" target="_blank" rel="noopener" aria-label="Instagram">${ico.insta}</a>
</div></div>
    <nav class="footer__col" aria-label="Shop links"><h3>Browse</h3><a href="collection.html?c=new-arrivals">New Arrivals</a><a href="collections.html">Collections</a><a href="shop.html">Gallery</a></nav>
    <nav class="footer__col" aria-label="About links"><h3>About</h3><a href="index.html#story">Our Story</a><a href="index.html#follow">Instagram</a><a href="#contact">Order</a></nav>
    <div class="footer__col" id="contact"><h3>Order</h3><a href="${insta.url}" target="_blank" rel="noopener">DM @${insta.handle}</a><p class="footer__small">All orders and enquiries are taken on Instagram.</p></div>
  </div><div class="footer__bottom"><p>© 2026 Saira tramboo. All rights reserved.</p><p>Orders via Instagram</p></div></footer>

  <div class="search" id="search" role="dialog" aria-modal="true" aria-label="Search products" hidden>
    <div class="search__bar"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M16 16l4.5 4.5" stroke="currentColor" stroke-width="1.4"/></svg>
      <input id="searchInput" type="search" placeholder="Search kurta, embroidered, red…" aria-label="Search products" autocomplete="off">
      <button class="icon-btn" id="searchClose" aria-label="Close search">${ico.x}</button></div>
    <div class="search__body"><p class="search__hint" id="searchHint" role="status"></p><div class="search__results" id="searchResults"></div></div></div>

  <div class="scrim scrim--drawer" id="drawerScrim"></div>
  <div class="modal" id="qv" role="dialog" aria-modal="true" aria-labelledby="qvName" aria-hidden="true"><div class="modal__box" id="qvBox"></div><div class="scrim" data-close-modal></div></div>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>`;

  document.getElementById('chrome-top').outerHTML = top;
  document.getElementById('chrome-bottom').outerHTML = bottom;
})();
