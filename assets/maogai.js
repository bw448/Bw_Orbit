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
      window.OrbitQuiz.mount(mount, { id: 'maogai', items: items, perPage: 12 });
    }
  }

  /* real exam bank */
  if (S.real && S.real.length && window.OrbitQuiz) {
    var realMount = byId('mgRealQuiz');
    if (realMount) {
      window.OrbitQuiz.mount(realMount, { id: 'maogai-real', items: S.real, perPage: 10 });
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
    var shown = 40;
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
    if (search) search.addEventListener('input', function () { state.q = this.value.trim(); shown = 40; renderPoints(); });
    if (chSel) chSel.addEventListener('change', function () { state.chapter = this.value; shown = 40; renderPoints(); });
    if (more) more.addEventListener('click', function () { shown += 40; renderPoints(); });
    var star = byId('mgPointStar');
    if (star) star.addEventListener('click', function () {
      state.star = !state.star;
      star.classList.toggle('on', state.star);
      star.setAttribute('aria-pressed', String(state.star));
      shown = 40;
      renderPoints();
    });
    renderPoints();
  }

  /* confusion pairs */
  var confBox = byId('mgConfusions');
  if (confBox) {
    var conf = S.confusions || [];
    var confTotal = byId('mgConfTotal');
    if (confTotal) confTotal.textContent = conf.length;
    confBox.innerHTML = conf.map(function (c) {
      return '<article class="mg-conf"><div class="mg-conf-head">' +
        '<span class="a">' + esc(c.a) + '</span><span class="vs">VS</span><span class="b">' + esc(c.b) + '</span></div>' +
        '<p>' + esc(c.diff) + '</p></article>';
    }).join('');
  }
})();
