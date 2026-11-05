/* Orbit competitions — render events, prep tracks, skills and resources. */
(function () {
  'use strict';
  var EV = window.ORBIT_COMPETITIONS || [];
  var SK = window.ORBIT_SKILLS || [];
  var RS = window.ORBIT_RESOURCES || [];
  var PR = window.ORBIT_PREP || [];

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function diffClass(d) { return d === '低' ? 'd-low' : (d === '高' ? 'd-high' : ''); }

  function eventHTML(e) {
    return '<article class="comp-card" data-tags="' + esc((e.tags || []).join(' ')) + '">' +
      '<div class="comp-card-head"><span class="comp-short">' + esc(e.short) + '</span><span class="comp-diff ' + diffClass(e.difficulty) + '">难度 ' + esc(e.difficulty) + '</span></div>' +
      '<h3>' + esc(e.name) + '</h3>' +
      '<p class="comp-org">主办：' + esc(e.organizer) + '<br>承办：' + esc(e.host) + '</p>' +
      '<div class="comp-meta"><b>报名</b><span>' + esc(e.signup) + '</span><b>组别</b><span>' + esc((e.groups || []).join(' / ')) + '</span></div>' +
      '<div class="comp-groups">' + (e.tags || []).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>' +
      '<p class="comp-note">' + esc(e.note) + '</p>' +
      '<div class="comp-card-foot"><span class="fit">适合：' + esc(e.fit) + '</span><a class="comp-official" href="' + esc(e.url) + '" target="_blank" rel="noopener">' + esc(e.urlLabel) + ' ↗</a></div></article>';
  }

  function renderEvents(filter) {
    var grid = document.getElementById('eventGrid');
    if (!grid) return;
    var list = EV.filter(function (e) { return !filter || filter === 'all' || (e.tags || []).indexOf(filter) >= 0; });
    grid.innerHTML = list.length ? list.map(eventHTML).join('') : '<p class="comp-footnote">这个分类暂时没有赛事。</p>';
  }

  var filters = document.getElementById('compFilters');
  if (filters) {
    filters.addEventListener('click', function (e) {
      var b = e.target.closest('[data-filter]');
      if (!b) return;
      filters.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); });
      renderEvents(b.getAttribute('data-filter'));
    });
  }
  renderEvents('all');

  var prep = document.getElementById('prepGrid');
  if (prep) {
    prep.innerHTML = PR.map(function (p) {
      return '<div class="prep-card"><div class="eyebrow">ROUTE / ' + esc(p.key.toUpperCase()) + '</div><h3>' + esc(p.title) + '</h3><p class="fit">' + esc(p.fit) + '</p><ol>' +
        p.steps.map(function (s, i) { return '<li><b>' + String(i + 1).padStart(2, '0') + '</b><span>' + esc(s) + '</span></li>'; }).join('') +
        '</ol><p class="first">先从：' + esc(p.first) + '</p></div>';
    }).join('');
  }

  var skills = document.getElementById('skillGrid');
  if (skills) {
    skills.innerHTML = SK.map(function (s) {
      return '<div class="skill-card"><div class="level">' + esc(s.level) + '</div><h3>' + esc(s.title) + '</h3>' +
        '<p>' + esc(s.learn) + '</p><p class="use">' + esc(s.use) + '</p><a href="' + esc(s.href) + '">' + esc(s.hrefLabel) + ' ↗</a></div>';
    }).join('');
  }

  var resources = document.getElementById('compResources');
  if (resources) {
    resources.innerHTML = RS.map(function (r) {
      return '<a class="comp-res-card" href="' + esc(r[3]) + '" target="_blank" rel="noopener"><span class="cat">' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b><small>' + esc(r[2]) + '</small><span class="go">打开 ↗</span></a>';
    }).join('');
  }
})();
