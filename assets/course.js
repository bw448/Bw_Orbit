/* Orbit course module renderer — data from window.COURSE */
(function () {
  'use strict';
  var C = window.COURSE;
  if (!C) return;
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  var exam = document.getElementById('examGrid');
  if (exam) {
    exam.innerHTML = (C.exam || []).map(function (x) {
      return '<div class="exam-item"><div class="k">' + esc(x[0]) + '</div><div class="v">' + esc(x[1]) + '</div></div>';
    }).join('');
  }
  var sections = document.getElementById('courseSections');
  if (sections) {
    sections.innerHTML = (C.sections || []).map(function (s, i) {
      return '<details class="course-note"' + (i === 0 ? ' open' : '') + '>' +
        '<summary><span class="n">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<span class="t">' + esc(s.title) + '<span class="e">' + esc(s.en || '') + '</span></span>' +
        (s.marked ? '<span class="badge">勾画</span>' : '<span class="badge" style="opacity:.45">章节</span>') +
        '</summary><div class="course-note-body">' +
        (s.points || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div></details>';
    }).join('');
  }
  var plan = document.getElementById('coursePlan');
  if (plan) {
    plan.innerHTML = (C.plan || []).map(function (p) {
      return '<div class="plan-step"><b>' + esc(p[0]) + '</b><h3>' + esc(p[1]) + '</h3><p>' + esc(p[2]) + '</p></div>';
    }).join('');
  }
  var res = document.getElementById('courseResources');
  if (res) {
    res.innerHTML = (C.resources || []).map(function (r) {
      return '<a class="resource-card" href="' + esc(r[2]) + '" target="_blank" rel="noopener">' +
        '<span class="tag">' + esc(r[3]) + '</span><b>' + esc(r[0]) + '</b><small>' + esc(r[1]) + '</small>' +
        '<span class="go">打开资料 <span>↗</span></span></a>';
    }).join('');
  }
  var links = document.getElementById('courseLinks');
  if (links) {
    links.innerHTML = (C.links || []).map(function (l) {
      return '<a href="' + esc(l[1]) + '">' + esc(l[0]) + ' ↗</a>';
    }).join('');
  }
})();
