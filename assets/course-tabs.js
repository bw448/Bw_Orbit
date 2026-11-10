/* Orbit — big, obvious course tabs.
   Each tab shows one group of sections; the hero only appears on the first tab.
   URL: ?tab=choice (old #choice deep links are mapped to the matching tab). */
(function () {
  'use strict';
  var cfg = window.ORBIT_TABS;
  if (!cfg || !cfg.tabs || !cfg.tabs.length) return;
  var main = document.querySelector('main');
  if (!main) return;
  var params = new URLSearchParams(location.search);
  var hash = decodeURIComponent((location.hash || '').replace(/^#/, ''));
  var tabs = cfg.tabs;

  function tabForSection(id) {
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].sections && tabs[i].sections.indexOf(id) >= 0) return tabs[i];
    }
    return null;
  }

  var active = null;
  var wanted = params.get('tab');
  for (var i = 0; i < tabs.length; i++) {
    if (tabs[i].id === wanted) { active = tabs[i]; break; }
  }
  if (!active) active = tabForSection(hash);
  if (!active) active = tabs[0];

  var nav = document.createElement('nav');
  nav.className = 'course-tabs';
  nav.setAttribute('aria-label', '课程栏目');
  nav.innerHTML = tabs.map(function (t) {
    var cls = t.id === active.id ? ' class="active"' : '';
    var count = t.count ? '<b>' + t.count + '</b>' : '';
    return '<a href="?tab=' + encodeURIComponent(t.id) + '"' + cls + ' data-tab="' + t.id + '">' + t.label + count + '</a>';
  }).join('');
  main.insertBefore(nav, main.firstChild);
  var spacer = document.createElement('div');
  spacer.className = 'course-tabs-spacer';
  main.insertBefore(spacer, nav.nextSibling);
  function syncTabsHeight() {
    var h = nav.offsetHeight || 52;
    spacer.style.height = h + 'px';
    document.documentElement.style.setProperty('--tabs-h', h + 'px');
  }
  syncTabsHeight();
  window.addEventListener('resize', syncTabsHeight);

  // The old subnav / guide / entry cards are no longer the primary navigation.
  ['.course-subnav', '.course-guide', '#moreEntries'].forEach(function (sel) {
    var el = document.querySelector(sel);
    if (el) el.hidden = true;
  });

  var sections = Array.prototype.filter.call(main.children, function (el) {
    return el.tagName === 'SECTION';
  });
  sections.forEach(function (sec) {
    if (!sec.id) return;
    sec.hidden = active.sections.indexOf(sec.id) < 0;
  });

  var hero = document.querySelector('.course-hero, .hero');
  if (hero) hero.hidden = !active.hero;
  var marquee = document.querySelector('.marquee');
  if (marquee) marquee.hidden = !active.hero;

  if (hash) {
    setTimeout(function () {
      var el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }
})();
