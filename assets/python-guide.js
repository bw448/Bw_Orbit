/* Orbit Python guide — knowledge map + bank coverage. */
(function () {
  'use strict';
  var G = window.PYGUIDE;
  var T = window.PYTOPICS || { counts: {}, total: 599 };
  if (!G) return;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function byId(id) { return document.getElementById(id); }
  function count(id) { return (T.counts && T.counts[id]) || 0; }

  /* exam */
  var exam = byId('pyExam');
  if (exam) {
    exam.innerHTML = (G.exam.items || []).map(function (x) {
      return '<div class="py-exam-row">' +
        '<div class="py-exam-name">' + esc(x.name) + '</div>' +
        '<div class="py-exam-n">' + x.n + ' 题' + (x.each ? ' × ' + x.each + ' 分' : '') + '</div>' +
        '<div class="py-exam-total">' + x.total + ' 分</div>' +
        '<div class="py-exam-note">' + esc(x.note) + '</div></div>';
    }).join('') +
      '<div class="py-exam-sum"><span>合计</span><b>' + G.exam.total + ' 分</b></div>';
  }
  var notes = byId('pyExamNotes');
  if (notes) {
    notes.innerHTML = (G.exam.notes || []).map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('');
  }

  /* knowledge map */
  var map = byId('pyMap');
  if (map) {
    map.innerHTML = (G.layers || []).map(function (layer) {
      var mods = (G.modules || []).filter(function (m) { return m.layer === layer.id; });
      return '<section class="py-layer" id="layer-' + esc(layer.id) + '">' +
        '<div class="py-layer-head"><div><div class="py-layer-k">' + esc(layer.en) + '</div>' +
        '<h3>' + esc(layer.name) + '</h3></div><p>' + esc(layer.desc) + '</p></div>' +
        '<div class="py-mod-grid">' + mods.map(moduleCard).join('') + '</div></section>';
    }).join('');
  }

  function moduleCard(m) {
    var n = count(m.id);
    var gap = n < 5;
    return '<details class="py-mod' + (gap ? ' gap' : '') + '" id="mod-' + esc(m.id) + '">' +
      '<summary><span class="py-mod-k">' + esc(m.en) + '</span>' +
      '<span class="py-mod-t">' + esc(m.title) + '</span>' +
      '<span class="py-mod-c">' + (gap ? '题库 ' + n + ' 题 · 需补课件' : '题库匹配 ' + n + ' 题') + '</span></summary>' +
      '<div class="py-mod-body">' +
      '<p class="py-why">' + esc(m.why) + '</p>' +
      '<div class="py-block"><div class="py-k">必须会</div><ul>' +
      (m.points || []).map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="py-block"><div class="py-k">最小代码</div><pre class="py-code">' + esc(m.code) + '</pre></div>' +
      '<div class="py-block"><div class="py-k">易错点</div><ul class="py-pitfalls">' +
      (m.pitfalls || []).map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul></div>' +
      (gap ? '<div class="py-gap"><b>题库覆盖不足</b>这一块要回到课件或原始 notebook，把代码亲手跑一遍；考试仍可能考基本用法。</div>' : '') +
      '<div class="py-bank">题库：<a href="python.html#paper-1">按套刷</a> · <a href="python.html#practice-all">综合刷</a>' +
      (n ? ' · 约 ' + n + ' 题涉及本主题' : '') + '</div>' +
      '</div></details>';
  }

  var openAll = byId('pyOpenAll');
  if (openAll) {
    openAll.addEventListener('click', function () {
      var ds = document.querySelectorAll('.py-mod');
      var anyClosed = Array.prototype.some.call(ds, function (d) { return !d.open; });
      Array.prototype.forEach.call(ds, function (d) { d.open = anyClosed; });
      openAll.textContent = anyClosed ? '收起全部' : '展开全部';
    });
  }

  /* coverage */
  var cov = byId('pyCoverage');
  if (cov) {
    var rows = (G.modules || []).map(function (m) {
      return { id: m.id, title: m.title, n: count(m.id) };
    }).sort(function (a, b) { return b.n - a.n; });
    var max = rows.reduce(function (s, x) { return Math.max(s, x.n); }, 1);
    cov.innerHTML = rows.map(function (r) {
      var pct = Math.round(r.n / max * 100);
      var gap = r.n < 5;
      return '<div class="py-cov-row' + (gap ? ' gap' : '') + '">' +
        '<span class="py-cov-t">' + esc(r.title) + '</span>' +
        '<span class="py-cov-bar"><i style="width:' + pct + '%"></i></span>' +
        '<b class="py-cov-n">' + r.n + '</b></div>';
    }).join('') +
      '<p class="py-cov-note">按题干、选项和解析关键词自动归类，一题只计一次；标黄的主题题库覆盖不足，需要看课件。题库总数 ' + (T.total || 599) + ' 题。' +
      '另有 ' + ((T.counts && T.counts.other) || 0) + ' 题未归入以上主题（综合代码输出、内置函数等）。</p>';
  }

  /* plan */
  var plan = byId('pyPlan');
  if (plan) {
    plan.innerHTML = (G.plan || []).map(function (p) {
      return '<div class="plan-step"><b>' + esc(p[0]) + '</b><h3>' + esc(p[1]) + '</h3><p>' + esc(p[2]) + '</p></div>';
    }).join('');
  }

  /* sources */
  var src = byId('pySources');
  if (src) {
    src.innerHTML = (G.sources || []).map(function (s) {
      return '<div class="py-source"><b>' + esc(s[0]) + '</b><span>' + esc(s[1]) + '</span></div>';
    }).join('');
  }
})();
