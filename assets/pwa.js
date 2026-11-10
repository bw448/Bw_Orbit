if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').then(function (reg) { reg.update(); }).catch(function () {});
  });
}


/* Mobile site menu: the desktop gn-links are hidden under 900px, so expose a
   clearly labelled button instead of leaving only the brand. */
(function () {
  function buildMobileNav() {
    var header = document.querySelector('.global-nav, header.nav');
    if (!header) return;
    var links = header.querySelector('.gn-links');
    if (!links || header.querySelector('.mobile-nav')) return;
    var details = document.createElement('details');
    details.className = 'mobile-nav';
    var summary = document.createElement('summary');
    summary.textContent = '菜单';
    var panel = document.createElement('div');
    panel.className = 'mobile-nav-panel';
    Array.prototype.forEach.call(links.querySelectorAll('a'), function (a) {
      var b = document.createElement('a');
      b.href = a.getAttribute('href');
      b.textContent = a.textContent;
      if (a.classList.contains('active')) b.className = 'active';
      panel.appendChild(b);
    });
    details.appendChild(summary);
    details.appendChild(panel);
    var inner = header.querySelector('.gn-inner') || header;
    var right = inner.querySelector('.gn-right, .nav-right');
    inner.insertBefore(details, right || null);
    details.addEventListener('click', function (e) {
      if (e.target.closest('a')) details.removeAttribute('open');
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.mobile-nav')) details.removeAttribute('open');
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildMobileNav);
  else buildMobileNav();
})();
