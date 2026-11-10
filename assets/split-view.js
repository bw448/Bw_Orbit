/* Orbit — lightweight "secondary view" for long course pages.
   Usage: set window.ORBIT_SPLIT = {more:[ids], title, heading, back, backLabel}
   then include this script. Overview hides the "more" sections and shows an
   entry-card section; ?view=more (or an old #section deep link) shows only them. */
(function () {
  'use strict';
  var cfg = window.ORBIT_SPLIT;
  if (!cfg || !cfg.more) return;
  var main = document.querySelector('main');
  if (!main) return;
  var params = new URLSearchParams(location.search);
  var hash = decodeURIComponent((location.hash || '').replace(/^#/, ''));
  var wantMore = params.get('view') === 'more' || (hash && cfg.more.indexOf(hash) >= 0);
  var sections = Array.prototype.filter.call(main.children, function (el) {
    return el.tagName === 'SECTION';
  });
  var hero = document.querySelector('.course-hero, .hero');
  var marquee = document.querySelector('.marquee');
  var guide = document.querySelector('.course-guide');
  var cards = document.getElementById('moreEntries');

  function hide(el) { if (el) el.hidden = true; }
  function show(el) { if (el) el.hidden = false; }

  window.addEventListener('hashchange', function () {
    if (!wantMore) return;
    var h = decodeURIComponent((location.hash || '').replace(/^#/, ''));
    if (h && cfg.more.indexOf(h) < 0) location.href = location.pathname + '#' + h;
  });

  if (wantMore) {
    sections.forEach(function (sec) {
      if (sec.id && cfg.more.indexOf(sec.id) < 0) hide(sec);
    });
    hide(hero); hide(marquee); hide(guide); hide(cards);
    var bar = document.createElement('div');
    bar.className = 'split-bar';
    bar.innerHTML = '<span><b>' + (cfg.title || '') + ' · 二级目录</b>' +
      (cfg.heading ? '：' + cfg.heading : '') + '</span><a href="' + (cfg.back || '') +
      '">← 返回' + (cfg.backLabel || '总览') + '</a>';
    main.insertBefore(bar, main.firstChild);
    var spacer = document.createElement('div');
    spacer.className = 'split-spacer';
    main.insertBefore(spacer, bar.nextSibling);
    if (hash) {
      setTimeout(function () {
        var el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }
  } else {
    sections.forEach(function (sec) {
      if (sec.id && cfg.more.indexOf(sec.id) >= 0) hide(sec);
    });
    show(cards);
    // Old #choice style links should open the secondary view instead of doing nothing.
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      if (cfg.more.indexOf(id) >= 0) {
        a.setAttribute('href', '?view=more#' + id);
      }
    });
  }
})();
