/* Orbit Maoism module — choice banks, points and confusion pairs. */
(function () {
  'use strict';
  var B = window.MAOGAI_BANK;
  var S = window.MAOGAI_SPECIAL || { points: [], real: [], confusions: [] };
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function byId(id) { return document.getElementById(id); }

  /* systematic bank */
  if (B && B.items && window.OrbitQuiz) {
    var mount = byId('mgQuiz');
    if (mount) {
      var items = B.items.map(function (x) {
        var y = {};
        for (var k in x) if (Object.prototype.hasOwnProperty.call(x, k)) y[k] = x[k];
        y.chapter = (x.source ? x.source + ' · ' : '') + (x.chapter || '未分章');
        return y;
      });
      var total = byId('mgTotal');
      if (total) total.textContent = items.length;
      var primary = byId('mgPrimary');
      if (primary) primary.textContent = items.length;
      window.OrbitQuiz.mount(mount, { id: 'maogai', items: items, perPage: 8 });
    }
  }

  /* real exam bank */
  if (S.real && S.real.length && window.OrbitQuiz) {
    var realMount = byId('mgRealQuiz');
    if (realMount) {
      window.OrbitQuiz.mount(realMount, { id: 'maogai-real', items: S.real, perPage: 8 });
    }
  }

  /* high-frequency points */
  var points = S.points || [];
  var pointTotal = byId('mgPointTotal');
  if (pointTotal) pointTotal.textContent = points.length;
  var pointsBox = byId('mgPoints');
  if (pointsBox) {
    var chapters = [];
    points.forEach(function (p) {
      if (p.chapter && chapters.indexOf(p.chapter) < 0) chapters.push(p.chapter);
    });
    var chSel = byId('mgPointChapter');
    if (chSel) {
      chapters.forEach(function (c) {
        var o = document.createElement('option');
        o.value = c;
        o.textContent = c;
        chSel.appendChild(o);
      });
    }
    var state = { q: '', chapter: '', star: false };
    var shown = 12;
    var more = byId('mgPointMore');
    function renderPoints() {
      var list = points.filter(function (p) {
        if (state.star && !p.star) return false;
        if (state.chapter && p.chapter !== state.chapter) return false;
        if (state.q) {
          var hay = (p.keyword + ' ' + p.text + ' ' + p.chapter).toLowerCase();
          if (hay.indexOf(state.q.toLowerCase()) < 0) return false;
        }
        return true;
      });
      var slice = list.slice(0, shown);
      pointsBox.innerHTML = list.length ? slice.map(function (p) {
        return '<article class="mg-point' + (p.star ? ' star' : '') + '">' +
          '<span class="kw">' + esc(p.keyword || '考点') + '</span>' +
          '<div class="txt">' + esc(p.text) + '<small>' + esc(p.chapter) + (p.star ? ' · ★ 高频' : '') + '</small></div>' +
          '</article>';
      }).join('') : '<p class="mg-count">没有匹配的考点。</p>';
      if (more) more.hidden = slice.length >= list.length;
      var count = byId('mgPointCount');
      if (count) count.textContent = '显示 ' + slice.length + ' / ' + list.length + ' 条（共 ' + points.length + ' 条）';
    }
    var search = byId('mgPointSearch');
    if (search) search.addEventListener('input', function () { state.q = this.value.trim(); shown = 12; renderPoints(); });
    if (chSel) chSel.addEventListener('change', function () { state.chapter = this.value; shown = 12; renderPoints(); });
    if (more) more.addEventListener('click', function () { shown += 12; renderPoints(); });
    var star = byId('mgPointStar');
    if (star) star.addEventListener('click', function () {
      state.star = !state.star;
      star.classList.toggle('on', state.star);
      star.setAttribute('aria-pressed', String(state.star));
      shown = 12;
      renderPoints();
    });
    renderPoints();
  }

  /* essay bank */
  var E = window.MAOGAI_ESSAY || { items: [] };
  var essayBox = byId('mgEssay');
  if (essayBox) {
    var essays = E.items || [];
    var et = byId('mgEssayTotal');
    if (et) et.textContent = essays.length;
    var ech = byId('mgEssayChapter');
    var echapters = [];
    essays.forEach(function (x) { if (x.chapter && echapters.indexOf(x.chapter) < 0) echapters.push(x.chapter); });
    if (ech) echapters.forEach(function (c) { var o = document.createElement('option'); o.value = c; o.textContent = c; ech.appendChild(o); });
    var etype = byId('mgEssayType');
    var etag = byId('mgEssayTag');
    var estate = { q: '', chapter: '', type: '', tag: false };
    var eshown = 10;
    var emore = byId('mgEssayMore');
    function renderEssay() {
      var list = essays.filter(function (x) {
        if (estate.chapter && x.chapter !== estate.chapter) return false;
        if (estate.type && x.type !== estate.type) return false;
        if (estate.tag && !(x.tags || []).some(function (t) { return t.indexOf('课后题') >= 0; })) return false;
        if (estate.q) {
          var hay = (x.q + ' ' + (x.points || []).join(' ') + ' ' + (x.tip || '')).toLowerCase();
          if (hay.indexOf(estate.q.toLowerCase()) < 0) return false;
        }
        return true;
      });
      var slice = list.slice(0, eshown);
      essayBox.innerHTML = slice.map(function (x, i) {
        var tags = (x.tags || []).map(function (t) { return '<span class="mg-etag">' + esc(t) + '</span>'; }).join('');
        return '<details class="mg-essay">' +
          '<summary><span class="mg-enum">' + String(i + 1).padStart(2, '0') + '</span>' +
          '<span class="mg-eq">' + esc(x.q) + '</span>' +
          '<span class="mg-etype">' + esc(x.type) + '</span></summary>' +
          '<div class="mg-ebody">' + (tags ? '<div class="mg-etags">' + tags + '</div>' : '') +
          '<ol class="mg-points">' + (x.points || []).map(function (p) { return '<li>' + esc(p.replace(/^[①-⑩]/, '')) + '</li>'; }).join('') + '</ol>' +
          (x.tip ? '<div class="mg-etip"><b>提示</b>' + esc(x.tip) + '</div>' : '') +
          '<div class="mg-ech">' + esc(x.chapter) + '</div></div></details>';
      }).join('');
      if (emore) emore.hidden = slice.length >= list.length;
      var count = byId('mgEssayCount');
      if (count) count.textContent = '显示 ' + slice.length + ' / ' + list.length + ' 题（共 ' + essays.length + ' 题）';
    }
    var es = byId('mgEssaySearch');
    if (es) es.addEventListener('input', function () { estate.q = this.value.trim(); eshown = 10; renderEssay(); });
    if (ech) ech.addEventListener('change', function () { estate.chapter = this.value; eshown = 10; renderEssay(); });
    if (etype) etype.addEventListener('change', function () { estate.type = this.value; eshown = 10; renderEssay(); });
    if (etag) etag.addEventListener('click', function () {
      estate.tag = !estate.tag;
      etag.classList.toggle('on', estate.tag);
      etag.setAttribute('aria-pressed', String(estate.tag));
      eshown = 10;
      renderEssay();
    });
    if (emore) emore.addEventListener('click', function () { eshown += 10; renderEssay(); });
    renderEssay();
  }

  /* confusion pairs */
  var confBox = byId('mgConfusions');
  if (confBox) {
    var conf = S.confusions || [];
    var confTotal = byId('mgConfTotal');
    if (confTotal) confTotal.textContent = conf.length;
    var confShown = 8;
    var confMore = byId('mgConfMore');
    var confCount = byId('mgConfCount');
    function renderConf() {
      var slice = conf.slice(0, confShown);
      confBox.innerHTML = slice.map(function (c) {
        return '<article class="mg-conf"><div class="mg-conf-head">' +
          '<span class="a">' + esc(c.a) + '</span><span class="vs">VS</span><span class="b">' + esc(c.b) + '</span></div>' +
          '<p>' + esc(c.diff) + '</p></article>';
      }).join('');
      if (confMore) confMore.hidden = slice.length >= conf.length;
      if (confCount) confCount.textContent = '显示 ' + slice.length + ' / ' + conf.length + ' 组';
    }
    if (confMore) confMore.addEventListener('click', function () { confShown += 8; renderConf(); });
    renderConf();
  }
})();
