/* Orbit — open source project showcase.
   Renders a curated snapshot, then refreshes stars and new repos from the GitHub API.
   No build step, no dependencies. Falls back to the embedded snapshot offline. */
(function () {
  'use strict';

  var DATA = window.ORBIT_OPENSOURCE || { projects: [], categories: [] };
  var USER = DATA.user || 'bw448';
  var PROFILE = DATA.profile || ('https://github.com/' + USER);
  var CATS = (DATA.categories || []).slice();
  var CAT_MAP = {};
  CATS.forEach(function (c) { CAT_MAP[c.id] = c; });
  var OTHER = { id: 'other', name: '其他项目', desc: '新加入、还没归类的仓库' };
  CAT_MAP.other = CAT_MAP.other || OTHER;

  var LANG_COLORS = {
    Python: '#3572a5', HTML: '#e34c26', CSS: '#563d7c', JavaScript: '#f1e05a',
    TypeScript: '#3178c6', Shell: '#89e051', MoonBit: '#b18cff', Rust: '#dea584',
    Go: '#00add8', C: '#555555', 'C++': '#f34b7d', Java: '#b07219', 'Jupyter Notebook': '#da5b0b'
  };

  var state = { cat: 'all', q: '' };
  var projects = (DATA.projects || []).map(function (p, i) {
    var copy = {};
    Object.keys(p).forEach(function (k) { copy[k] = p[k]; });
    copy.tags = (p.tags || []).slice();
    copy.topics = (p.topics || []).slice();
    copy._curated = true;
    copy._i = i;
    copy.order = (typeof p.order === 'number') ? p.order : (100 + i);
    copy.updated = p.updated || '';
    return copy;
  });
  var syncState = 'syncing';
  var live = false;
  var CACHE_KEY = 'orbit-os-repos-v1';

  function $(sel) { return document.querySelector(sel); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function fmtStars(n) {
    n = Number(n) || 0;
    if (n >= 10000) return (n / 1000).toFixed(0) + 'k';
    if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k';
    return String(n);
  }
  function fmtDate(iso) { return iso ? String(iso).slice(0, 10) : ''; }
  function catOf(p) { return CAT_MAP[p.category] || CAT_MAP.other; }
  function langColor(lang) { return LANG_COLORS[lang] || '#9bb6d4'; }
  function starSvg() {
    return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.6l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.4 4.2 13.4l.7-4.3-3.1-3 4.3-.6L8 1.6z" fill="currentColor"/></svg>';
  }
  function safeUrl(url) {
    if (!url) return '';
    return /^https?:\/\//i.test(url) ? url : ('https://' + url);
  }

  /* ---------- data merge ---------- */
  function inferCat(r) {
    var text = ((r.topics || []).join(' ') + ' ' + (r.description || '') + ' ' + r.name).toLowerCase();
    if (/claude|skill|agent/.test(text)) return 'skills';
    if (/education|study|quiz|exam|gis|remote-sensing|learning|campus|course/.test(text)) return 'study';
    if (/library|audio|wav|toolkit|sdk|parser|moonbit/.test(text)) return 'library';
    if (/desktop|reader|assistant|local-first|windows|app/.test(text)) return 'app';
    return 'other';
  }

  function applyRepos(repos) {
    var byName = {};
    projects.forEach(function (p) { byName[p.repo.toLowerCase()] = p; });
    var seen = {};
    var added = 0;
    repos.forEach(function (r) {
      if (!r || !r.name || r.fork || r.archived) return;
      var key = r.name.toLowerCase();
      seen[key] = true;
      var p = byName[key];
      var ghLicense = r.license && r.license.spdx_id && r.license.spdx_id !== 'NOASSERTION' ? r.license.spdx_id : '';
      if (p) {
        p.stars = typeof r.stargazers_count === 'number' ? r.stargazers_count : p.stars;
        p.language = r.language || p.language;
        if (r.topics && r.topics.length) p.topics = r.topics.slice();
        p.site = r.homepage || p.site;
        p.updated = r.pushed_at || p.updated;
        p.ghDesc = r.description || p.ghDesc || '';
        if (!p.license && ghLicense) p.license = ghLicense;
        p._live = true;
        return;
      }
      var desc = (r.description || '').trim();
      var short = desc.split(/[。.!?]/)[0].slice(0, 80);
      var item = {
        repo: r.name,
        category: inferCat(r),
        title: r.name,
        subtitle: short || 'GitHub 新项目',
        description: desc || '这个仓库还没有填写简介。',
        highlights: [],
        tags: (r.topics || []).slice(0, 5),
        topics: (r.topics || []).slice(),
        language: r.language || '',
        license: ghLicense,
        site: r.homepage || '',
        stars: r.stargazers_count || 0,
        featured: false,
        order: 900 + added,
        updated: r.pushed_at || '',
        _live: true,
        _new: true,
        _i: 900 + added
      };
      added += 1;
      projects.push(item);
      byName[key] = item;
    });
    // If live data is complete, drop curated entries whose repo no longer exists.
    if (live && Object.keys(seen).length) {
      projects = projects.filter(function (p) {
        if (!p._curated) return true;
        return !!seen[p.repo.toLowerCase()];
      });
    }
  }

  function sortProjects(list) {
    return list.slice().sort(function (a, b) {
      if (!!b.featured !== !!a.featured) return b.featured ? 1 : -1;
      var oa = typeof a.order === 'number' ? a.order : 500;
      var ob = typeof b.order === 'number' ? b.order : 500;
      if (oa !== ob) return oa - ob;
      return (Number(b.stars) || 0) - (Number(a.stars) || 0);
    });
  }

  function catCounts() {
    var counts = { all: projects.length };
    projects.forEach(function (p) {
      var id = CAT_MAP[p.category] ? p.category : 'other';
      counts[id] = (counts[id] || 0) + 1;
    });
    return counts;
  }

  function visibleProjects() {
    var q = state.q.trim().toLowerCase();
    return sortProjects(projects).filter(function (p) {
      if (state.cat !== 'all') {
        var id = CAT_MAP[p.category] ? p.category : 'other';
        if (id !== state.cat) return false;
      }
      if (!q) return true;
      var hay = [p.title, p.subtitle, p.description, p.repo, p.language]
        .concat(p.tags || [], p.topics || [], p.highlights || []).join(' ').toLowerCase();
      return hay.indexOf(q) !== -1;
    });
  }

  /* ---------- render ---------- */
  function renderStats() {
    var stars = projects.reduce(function (sum, p) { return sum + (Number(p.stars) || 0); }, 0);
    var cats = {};
    projects.forEach(function (p) { cats[CAT_MAP[p.category] ? p.category : 'other'] = 1; });
    var elProjects = $('#osStatProjects'), elStars = $('#osStatStars'), elCats = $('#osStatCats');
    if (elProjects) elProjects.textContent = String(projects.length);
    if (elStars) elStars.textContent = fmtStars(stars);
    if (elCats) elCats.textContent = String(Object.keys(cats).length);
    var count = $('#osProjectCount');
    if (count) count.textContent = String(projects.length).padStart(2, '0');
  }

  function renderFilters() {
    var host = $('#osFilters');
    if (!host) return;
    var counts = catCounts();
    var order = ['all'].concat(CATS.map(function (c) { return c.id; }));
    if (counts.other) order.push('other');
    var seen = {};
    var html = order.map(function (id) {
      if (seen[id]) return '';
      seen[id] = true;
      var c = id === 'all' ? { name: '全部' } : CAT_MAP[id];
      if (!c) return '';
      var n = counts[id] || 0;
      if (id !== 'all' && !n) return '';
      var on = state.cat === id;
      var dot = id === 'all' ? '' : '<i class="os-filter-dot" style="--cat:' + (id === 'skills' ? '#0071e3' : id === 'study' ? '#1d7a4a' : id === 'app' ? '#8a5a1f' : id === 'library' ? '#5b5bd6' : '#86868b') + '"></i>';
      return '<button type="button" class="os-filter' + (on ? ' on' : '') + '" data-cat="' + id + '" aria-pressed="' + on + '">' + dot + esc(c.name) + ' <small>' + n + '</small></button>';
    }).join('');
    host.innerHTML = html;
  }

  function cardHTML(p, i) {
    var cat = catOf(p);
    var tags = (p.tags && p.tags.length ? p.tags : (p.topics || [])).slice(0, 5);
    var tagHTML = tags.map(function (t) { return '<span class="os-tag">' + esc(t) + '</span>'; }).join('');
    var highHTML = (p.highlights || []).length
      ? '<ul class="os-highs">' + p.highlights.slice(0, 3).map(function (h) { return '<li>' + esc(h) + '</li>'; }).join('') + '</ul>'
      : '';
    var repoUrl = 'https://github.com/' + USER + '/' + encodeURIComponent(p.repo);
    var site = safeUrl(p.site);
    var meta = [
      '<span class="os-stars">' + starSvg() + ' ' + fmtStars(p.stars) + '</span>'
    ];
    if (p.language) meta.push('<span><i class="os-lang-dot" style="--lang:' + langColor(p.language) + '"></i>' + esc(p.language) + '</span>');
    if (p.updated) meta.push('<span>更新 ' + esc(fmtDate(p.updated)) + '</span>');
    var actions = '<a href="' + repoUrl + '" target="_blank" rel="noopener">源代码 <b aria-hidden="true">↗</b></a>';
    if (site) actions += '<a href="' + esc(site) + '" target="_blank" rel="noopener">在线体验 <b aria-hidden="true">↗</b></a>';
    actions += '<a class="os-star" href="' + repoUrl + '" target="_blank" rel="noopener">Star</a>';
    return '<article class="os-card" style="--i:' + i + ';--cat:' + (p.category === 'study' ? '#1d7a4a' : p.category === 'app' ? '#8a5a1f' : p.category === 'library' ? '#5b5bd6' : p.category === 'other' ? '#86868b' : '#0071e3') + '">' +
      '<div class="os-card-top"><span class="os-cat"><i></i>' + esc(cat.name) + '</span>' + (p._new ? '<span class="os-new">新收录</span>' : '') + '</div>' +
      '<h3><a href="' + repoUrl + '" target="_blank" rel="noopener">' + esc(p.title) + '</a></h3>' +
      '<p class="os-sub">' + esc(p.subtitle) + '</p>' +
      '<p class="os-desc">' + esc(p.description) + '</p>' +
      highHTML +
      (tagHTML ? '<div class="os-tags">' + tagHTML + '</div>' : '') +
      '<div class="os-card-foot"><div class="os-meta">' + meta.join('') + '</div><div class="os-card-actions">' + actions + '</div></div>' +
      '</article>';
  }

  function renderGrid() {
    var host = $('#osGrid');
    if (!host) return;
    var list = visibleProjects();
    host.innerHTML = list.map(cardHTML).join('');
    var empty = $('#osEmpty');
    if (empty) empty.hidden = list.length > 0;
  }

  function renderTerm() {
    var host = $('#osTermRows');
    if (!host) return;
    var list = sortProjects(projects).slice(0, 7);
    var rows = '<div class="os-term-line"><span class="os-term-cmd">$ gh repo list ' + esc(USER) + ' --limit ' + list.length + '</span></div>';
    rows += list.map(function (p) {
      return '<div class="os-term-line"><b>' + esc(p.repo) + '</b><span>' + esc(p.subtitle) + '</span><em>★ ' + fmtStars(p.stars) + '</em></div>';
    }).join('');
    rows += '<div class="os-term-line os-term-cursor"><span class="os-term-cmd">$</span><i class="os-cursor"></i></div>';
    host.innerHTML = rows;
  }

  function renderAll() {
    renderStats();
    renderFilters();
    renderGrid();
    renderTerm();
  }

  function setSync(stateName, main, sub) {
    syncState = stateName;
    var dot = $('#osSyncDot');
    if (dot) {
      dot.className = 'os-sync-dot' + (stateName === 'syncing' ? ' syncing' : stateName === 'offline' || stateName === 'fallback' ? ' off' : '');
      var txt = dot.lastChild;
      if (txt && txt.nodeType === 3) txt.textContent = stateName === 'syncing' ? ' 正在同步 GitHub' : stateName === 'live' ? ' GitHub 已同步' : ' 内置快照';
    }
    var bar = $('#osSync');
    if (bar) {
      var cls = stateName === 'syncing' ? 'syncing' : stateName === 'cache' ? 'cache' : stateName === 'offline' || stateName === 'fallback' ? 'offline' : '';
      bar.innerHTML = '<span class="os-sync-state ' + cls + '"><i></i><b>' + esc(main) + '</b></span><span>' + esc(sub || '') + ' <a href="' + PROFILE + '" target="_blank" rel="noopener">去 GitHub 看最新</a></span>';
    }
  }

  /* ---------- GitHub sync ---------- */
  function readCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (!obj || !obj.t || !Array.isArray(obj.repos)) return null;
      if (Date.now() - obj.t > 10 * 60 * 1000) return null;
      return obj.repos;
    } catch (e) { return null; }
  }
  function writeCache(repos) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), repos: repos })); } catch (e) {}
  }

  function sync() {
    var cached = readCache();
    if (cached && cached.length) {
      applyRepos(cached);
      live = true;
      renderAll();
      setSync('cache', '显示 10 分钟内的 GitHub 缓存', '下次打开会重新拉取；');
    } else {
      setSync('syncing', '正在同步 GitHub…', 'Star 数与新仓库会自动更新；');
    }
    if (cached && cached.length) return;

    var ctrl = null;
    var timer = null;
    try { ctrl = new AbortController(); timer = setTimeout(function () { ctrl.abort(); }, 8000); } catch (e) {}
    fetch('https://api.github.com/users/' + encodeURIComponent(USER) + '/repos?per_page=100&sort=updated', {
      headers: { Accept: 'application/vnd.github+json' },
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      if (!res.ok) throw new Error('GitHub API ' + res.status);
      return res.json();
    }).then(function (repos) {
      if (!Array.isArray(repos)) throw new Error('Unexpected GitHub response');
      var real = repos.filter(function (r) { return r && !r.fork && !r.archived; });
      if (!real.length) throw new Error('GitHub returned no public repos');
      live = true;
      applyRepos(real);
      writeCache(real);
      renderAll();
      setSync('live', 'GitHub 实时数据 · 刚刚同步', 'Star 数与新仓库会自动更新；');
    }).catch(function () {
      if (!live) {
        setSync('fallback', 'GitHub 暂时不可用，显示内置快照', '网络恢复后重新打开即可自动更新；');
      } else {
        setSync('cache', '显示缓存数据', '网络恢复后重新打开即可更新；');
      }
    }).then(function () {
      if (timer) clearTimeout(timer);
    });
  }

  /* ---------- interactions ---------- */
  function bind() {
    var filters = $('#osFilters');
    if (filters) filters.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-cat]');
      if (!btn) return;
      state.cat = btn.getAttribute('data-cat');
      renderFilters();
      renderGrid();
    });
    var search = $('#osSearch');
    if (search) search.addEventListener('input', function () {
      state.q = search.value || '';
      renderGrid();
    });
    var reset = $('#osReset');
    if (reset) reset.addEventListener('click', function () {
      state.cat = 'all'; state.q = '';
      if (search) search.value = '';
      renderFilters(); renderGrid();
    });
    document.querySelectorAll('[data-goto-cat]').forEach(function (a) {
      a.addEventListener('click', function () {
        state.cat = a.getAttribute('data-goto-cat');
        renderFilters();
        renderGrid();
      });
    });
    var copy = $('#osCopyBtn');
    var cmd = $('#osInstallCmd');
    if (copy && cmd) copy.addEventListener('click', function () {
      var text = cmd.textContent.trim();
      function done() {
        copy.textContent = '已复制';
        copy.classList.add('done');
        setTimeout(function () { copy.textContent = '复制'; copy.classList.remove('done'); }, 1600);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(fallback);
      } else fallback();
      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', '');
        ta.style.position = 'fixed'; ta.style.left = '-9999px';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); done(); } catch (e) {}
        document.body.removeChild(ta);
      }
    });
  }

  renderAll();
  bind();
  sync();
})();
