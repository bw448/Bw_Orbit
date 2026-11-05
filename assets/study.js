/* ORBIT study tools — shared by remote sensing & Python pages. */
(function () {
  var PAGE_KEY = window.STUDY_KEY || 'study';
  var TOOLS_KEY = PAGE_KEY + '.tools';
  var QS = window.STUDY_QUESTIONS || [];
  var DAY = 86400000;
  var TABS = [
    ['today', '今日'], ['review', '复习'], ['random', '随机'], ['search', '搜索'],
    ['history', '历史'], ['plan', '计划'], ['data', '数据']
  ];
  var state = { tab: 'today', quiz: null, search: '', selected: null, done: false, correct: null, reveal: false, el: {} };

  function now() { return Date.now(); }
  function dayStr(ts) {
    var d = new Date(ts || now());
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function yesterdayStr() { return dayStr(now() - DAY); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function read(key, fallback) {
    try { var r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
    catch (e) { return fallback; }
  }
  function write(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }
  function loadTools() {
    var base = { review: {}, history: [], days: {}, goal: 20, streak: 0, lastDay: '', startDate: dayStr(), planDone: {} };
    return Object.assign(base, read(TOOLS_KEY, {}));
  }
  function saveTools(t) { write(TOOLS_KEY, t); }
  function loadPage() { return read(PAGE_KEY, { answers: {}, wrong: [], bookmarks: [] }); }
  function savePage(p) { write(PAGE_KEY, p); }
  function byId(id) { return QS.find(function (q) { return q.id === id; }); }
  function typeName(t) { return { single: '单选', multiple: '多选', short: '简答', fill: '填空' }[t] || t; }

  function dueQuestions() {
    var t = loadTools(), p = loadPage(), out = [], seen = {};
    Object.keys(t.review || {}).forEach(function (id) {
      var r = t.review[id];
      if (r && r.due <= now()) {
        var q = byId(id);
        if (q && !seen[id]) { seen[id] = 1; out.push(q); }
      }
    });
    (p.wrong || []).forEach(function (id) {
      if (!seen[id] && !(t.review || {})[id]) {
        var q = byId(id);
        if (q) { seen[id] = 1; out.push(q); }
      }
    });
    return out;
  }

  function onAnswer(q, ok) {
    var t = loadTools(), id = q.id, ts = now(), r = t.review[id];
    if (ok) {
      if (r) {
        r.reps = (r.reps || 0) + 1;
        if (r.reps >= 5) delete t.review[id];
        else {
          var seq = [1, 3, 7, 14, 30];
          r.interval = seq[Math.min(r.reps, 4)];
          r.due = ts + r.interval * DAY;
        }
      }
    } else {
      t.review[id] = { due: ts + DAY, interval: 1, reps: 0 };
    }
    t.history.push({ id: id, ok: !!ok, at: ts });
    if (t.history.length > 5000) t.history = t.history.slice(-5000);
    var d = dayStr(ts);
    t.days[d] = (t.days[d] || 0) + 1;
    if (t.lastDay !== d) {
      t.streak = t.lastDay === yesterdayStr() ? (t.streak || 0) + 1 : 1;
      t.lastDay = d;
    }
    saveTools(t);
    updateFab();
  }

  function syncPageWrong(q, ok) {
    var p = loadPage(), wrong = p.wrong || [];
    if (ok) {
      var t = loadTools();
      if (!t.review[q.id]) wrong = wrong.filter(function (x) { return x !== q.id; });
    } else if (!wrong.includes(q.id)) wrong.push(q.id);
    p.wrong = wrong;
    savePage(p);
  }

  function updateFab() {
    if (!state.el.fab) return;
    var due = dueQuestions().length;
    state.el.fab.textContent = '学习';
    state.el.fab.title = due ? '有 ' + due + ' 道到期复习' : '学习工具';
    state.el.fab.style.boxShadow = due ? '0 0 0 4px rgba(0,113,227,.14),0 10px 28px rgba(0,0,0,.12)' : '';
  }

  function build() {
    var fab = document.createElement('button');
    fab.type = 'button'; fab.className = 'study-fab'; fab.textContent = '学习';
    fab.setAttribute('aria-label', '打开学习工具');
    var overlay = document.createElement('div');
    overlay.className = 'study-overlay'; overlay.hidden = true;
    overlay.innerHTML = '<div class="study-panel"><div class="study-head"><div class="study-title">学习工具</div><button class="study-close" type="button">关闭</button></div><div class="study-tabs"></div><div class="study-body"></div></div>';
    document.body.appendChild(fab); document.body.appendChild(overlay);
    state.el = { fab: fab, overlay: overlay, tabs: overlay.querySelector('.study-tabs'), body: overlay.querySelector('.study-body'), close: overlay.querySelector('.study-close') };
    state.el.tabs.innerHTML = TABS.map(function (t) { return '<button type="button" data-tab="' + t[0] + '">' + t[1] + '</button>'; }).join('');
    fab.addEventListener('click', function () { open('today'); });
    state.el.close.addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    state.el.tabs.addEventListener('click', function (e) { var b = e.target.closest('[data-tab]'); if (b) render(b.dataset.tab); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  function open(tab) { state.el.overlay.hidden = false; render(tab || 'today'); }
  function close() { state.el.overlay.hidden = true; state.quiz = null; }
  function setTab(tab) {
    state.tab = tab;
    state.el.tabs.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === tab); });
  }

  function render(tab) {
    if (tab) setTab(tab);
    if (state.quiz) { renderQuiz(); return; }
    var body = state.el.body;
    if (state.tab === 'today') body.innerHTML = todayHTML();
    else if (state.tab === 'review') body.innerHTML = reviewHTML();
    else if (state.tab === 'random') body.innerHTML = randomHTML();
    else if (state.tab === 'search') body.innerHTML = searchHTML();
    else if (state.tab === 'history') body.innerHTML = historyHTML();
    else if (state.tab === 'plan') body.innerHTML = planHTML();
    else body.innerHTML = dataHTML();
    bindBody();
  }

  function todayHTML() {
    var t = loadTools(), d = dayStr(), count = t.days[d] || 0, due = dueQuestions().length;
    var pct = Math.min(100, Math.round(count / (t.goal || 20) * 100));
    return '<div class="study-sec-title">今天</div><div class="study-sub">' + (due ? '有 ' + due + ' 道题到期，先复习再刷新题。' : '没有到期复习，可以刷一组新题。') + '</div>' +
      '<div class="study-stats"><div class="study-stat"><div class="k">Today</div><div class="v">' + count + '<small>/ ' + t.goal + '</small></div></div>' +
      '<div class="study-stat"><div class="k">Due</div><div class="v">' + due + '<small>题</small></div></div>' +
      '<div class="study-stat"><div class="k">Streak</div><div class="v">' + (t.streak || 0) + '<small>天</small></div></div>' +
      '<div class="study-stat"><div class="k">History</div><div class="v">' + t.history.length + '<small>次</small></div></div></div>' +
      '<div class="study-progress"><i style="width:' + pct + '%"></i></div>' +
      '<div class="study-actions"><button class="study-btn primary" data-act="review" ' + (due ? '' : 'disabled') + '>开始复习（' + due + '）</button>' +
      '<button class="study-btn" data-act="random10">随机 10 题</button><button class="study-btn" data-act="plan">看 10 天计划</button></div>' +
      '<div class="study-mobile-hint">手机上可直接用；进度保存在本机。</div>';
  }
  function reviewHTML() {
    var qs = dueQuestions();
    return '<div class="study-sec-title">到期复习</div><div class="study-sub">答错的题 1 天后回来；答对后间隔拉长到 3、7、14、30 天，连对 5 次毕业。</div>' +
      (qs.length ? '<div class="study-actions"><button class="study-btn primary" data-act="startReview">开始复习（' + qs.length + '）</button></div>' : '<div class="study-empty">现在没有到期题。去刷几道，答错的会自动排进复习。</div>') + listHTML(qs);
  }
  function randomHTML() {
    var types = [['all', '全部'], ['single', '单选'], ['multiple', '多选'], ['short', '简答']];
    return '<div class="study-sec-title">随机练习</div><div class="study-sub">选数量和题型，马上开一组。</div>' +
      '<div class="study-chips" data-group="count">' + [10, 20, 30, 50].map(function (n) { return '<button type="button" data-count="' + n + '"' + (n === 10 ? ' class="on"' : '') + '>' + n + ' 题</button>'; }).join('') + '</div>' +
      '<div class="study-chips" data-group="type">' + types.map(function (t) { return '<button type="button" data-type="' + t[0] + '"' + (t[0] === 'all' ? ' class="on"' : '') + '>' + t[1] + '</button>'; }).join('') + '</div>' +
      '<div class="study-actions"><button class="study-btn primary" data-act="startRandom">开始随机</button></div>';
  }
  function searchHTML() {
    return '<div class="study-sec-title">搜索</div><div class="study-sub">搜题干、选项、解析。点结果直接做题。</div>' +
      '<input class="study-input" id="studySearch" placeholder="输入关键词…" value="' + esc(state.search) + '">' +
      '<div id="studySearchResults">' + searchResultsHTML() + '</div>';
  }
  function searchResultsHTML() {
    var kw = state.search.trim().toLowerCase();
    if (!kw) return '<div class="study-empty">输入关键词开始搜索。</div>';
    var res = QS.filter(function (q) {
      return (q.q + ' ' + (q.options || []).join(' ') + ' ' + (q.e || '')).toLowerCase().indexOf(kw) >= 0;
    }).slice(0, 40);
    if (!res.length) return '<div class="study-empty">没有匹配的题。</div>';
    return '<div class="study-list">' + res.map(function (q) {
      return '<div class="study-row" data-qid="' + q.id + '"><span class="n">' + typeName(q.type) + '</span><span class="q">' + esc(q.q).slice(0, 110) + '</span><span class="m">' + (q.tag || '') + '</span></div>';
    }).join('') + '</div>';
  }
  function historyHTML() {
    var t = loadTools();
    if (!t.history.length) return '<div class="study-sec-title">答题历史</div><div class="study-empty">还没有记录。刷几道题就会出现在这里。</div>';
    var groups = {};
    t.history.slice().reverse().forEach(function (h) { (groups[dayStr(h.at)] = groups[dayStr(h.at)] || []).push(h); });
    var keys = Object.keys(groups).slice(0, 14);
    return '<div class="study-sec-title">答题历史</div><div class="study-sub">按天分组；点一条重做。</div>' + keys.map(function (d) {
      return '<div style="margin-top:18px"><div class="mono" style="font-family:var(--mono);font-size:10px;color:var(--muted)">' + d + ' · ' + groups[d].length + ' 次</div><div class="study-list">' + groups[d].map(function (h) {
        var q = byId(h.id); if (!q) return '';
        return '<div class="study-row" data-qid="' + q.id + '"><span class="n">' + (h.ok ? '✓' : '✗') + '</span><span class="q">' + esc(q.q).slice(0, 100) + '</span><span class="m">' + typeName(q.type) + '</span></div>';
      }).join('') + '</div></div>';
    }).join('');
  }
  function planHTML() {
    var t = loadTools(), targets = [10, 15, 20, 20, 25, 25, 30, 30, 40, 50];
    return '<div class="study-sec-title">10 天计划</div><div class="study-sub">每天一组，量不大；做完一组就点“标记完成”。</div>' +
      '<div class="study-chips" data-group="goal">' + [10, 20, 30, 50].map(function (n) { return '<button type="button" data-goal="' + n + '"' + (n === t.goal ? ' class="on"' : '') + '>每日 ' + n + ' 题</button>'; }).join('') + '</div>' +
      '<div class="study-plan">' + targets.map(function (n, i) {
        var day = i + 1, done = t.planDone[day];
        return '<div class="study-plan-row ' + (done ? 'done' : '') + '"><span class="d">DAY ' + day + '</span><span><b>' + n + ' 题</b><small>' + (done ? '已完成' : '建议 ' + Math.ceil(n / 3) + ' 分钟') + '</small></span><button type="button" data-plan="' + day + '">' + (done ? '已完成' : '开始') + '</button></div>';
      }).join('') + '</div>';
  }
  function dataHTML() {
    var p = loadPage(), t = loadTools();
    return '<div class="study-sec-title">数据</div><div class="study-sub">所有记录都在本机浏览器。换设备前可导出 JSON。</div>' +
      '<div class="study-stats"><div class="study-stat"><div class="k">Answered</div><div class="v">' + Object.keys(p.answers || {}).length + '</div></div>' +
      '<div class="study-stat"><div class="k">Wrong</div><div class="v">' + (p.wrong || []).length + '</div></div>' +
      '<div class="study-stat"><div class="k">Saved</div><div class="v">' + (p.bookmarks || []).length + '</div></div>' +
      '<div class="study-stat"><div class="k">History</div><div class="v">' + t.history.length + '</div></div></div>' +
      '<div class="study-actions"><button class="study-btn primary" data-act="export">导出进度</button>' +
      '<button class="study-btn" data-act="import">导入进度</button><input type="file" id="studyImport" accept="application/json" hidden></div>' +
      '<div class="study-empty">导入会覆盖当前页面的答题记录、错题、收藏和复习计划。</div>';
  }
  function listHTML(qs) {
    if (!qs.length) return '';
    return '<div class="study-list">' + qs.map(function (q) {
      return '<div class="study-row" data-qid="' + q.id + '"><span class="n">' + typeName(q.type) + '</span><span class="q">' + esc(q.q).slice(0, 110) + '</span><span class="m">' + (q.tag || '') + '</span></div>';
    }).join('') + '</div>';
  }

  function bindBody() {
    var body = state.el.body;
    body.querySelectorAll('[data-qid]').forEach(function (row) {
      row.addEventListener('click', function () { var q = byId(row.dataset.qid); if (q) startQuiz([q], '单题'); });
    });
    body.querySelectorAll('[data-act]').forEach(function (b) {
      b.addEventListener('click', function () {
        var act = b.dataset.act;
        if (act === 'review') { var qs = dueQuestions(); if (qs.length) startQuiz(qs, '到期复习'); }
        if (act === 'startReview') { var qs2 = dueQuestions(); if (qs2.length) startQuiz(qs2, '到期复习'); }
        if (act === 'random10') startRandom(10);
        if (act === 'plan') render('plan');
        if (act === 'startRandom') startRandomFromUI();
        if (act === 'export') exportData();
        if (act === 'import') { var f = document.getElementById('studyImport'); if (f) f.click(); }
      });
    });
    body.querySelectorAll('[data-count]').forEach(function (b) {
      b.addEventListener('click', function () { b.parentNode.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); });
    });
    body.querySelectorAll('[data-type]').forEach(function (b) {
      b.addEventListener('click', function () { b.parentNode.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); });
    });
    body.querySelectorAll('[data-goal]').forEach(function (b) {
      b.addEventListener('click', function () { var t = loadTools(); t.goal = Number(b.dataset.goal); saveTools(t); render('plan'); });
    });
    body.querySelectorAll('[data-plan]').forEach(function (b) {
      b.addEventListener('click', function () {
        var day = Number(b.dataset.plan), target = [10, 15, 20, 20, 25, 25, 30, 30, 40, 50][day - 1];
        var t = loadTools(); t.planDone[day] = true; saveTools(t); startRandom(target);
      });
    });
    var search = document.getElementById('studySearch');
    if (search) {
      search.addEventListener('input', function () {
        state.search = search.value;
        document.getElementById('studySearchResults').innerHTML = searchResultsHTML();
        bindBody(); search.focus(); search.setSelectionRange(search.value.length, search.value.length);
      });
    }
    var imp = document.getElementById('studyImport');
    if (imp) imp.addEventListener('change', importData);
  }

  function currentChip(group) {
    var b = state.el.body.querySelector('[data-group="' + group + '"] button.on');
    return b ? b.dataset : {};
  }
  function startRandomFromUI() {
    var c = currentChip('count'), ty = currentChip('type');
    startRandom(Number(c.count || 10), ty.type || 'all');
  }
  function startRandom(n, type) {
    var pool = QS.filter(function (q) { return !type || type === 'all' || q.type === type; });
    var arr = pool.slice();
    for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
    startQuiz(arr.slice(0, n), '随机练习');
  }

  function startQuiz(qs, title) {
    state.quiz = { queue: qs, idx: 0, title: title || '练习', selected: null, done: false, correct: null, revealed: false };
    renderQuiz();
  }
  function renderQuiz() {
    var s = state.quiz; if (!s) { render('today'); return; }
    if (s.idx >= s.queue.length) { finishQuiz(); return; }
    var q = s.queue[s.idx], body = state.el.body, pct = Math.round(s.idx / s.queue.length * 100);
    var h = '<div class="study-sub">' + s.title + ' · ' + (s.idx + 1) + ' / ' + s.queue.length + '</div><div class="study-progress"><i style="width:' + pct + '%"></i></div><div class="study-quiz">' +
      '<div class="mono" style="font-family:var(--mono);font-size:10px;color:var(--muted);margin-top:16px">' + typeName(q.type) + ' · ' + esc(q.tag || '') + '</div>' +
      '<div class="study-qtext ' + (/\n/.test(q.q) ? 'code' : '') + '">' + esc(q.q) + '</div>';
    if (q.type === 'single' || q.type === 'multiple') {
      h += '<div class="study-opts">' + q.options.map(function (o, i) {
        var cls = 'study-opt';
        var on = q.type === 'multiple' ? (Array.isArray(s.selected) && s.selected.includes(i)) : s.selected === i;
        if (on) cls += ' sel';
        if (s.done && i === q.a) cls += ' ok';
        if (s.done && on && i !== q.a) cls += ' bad';
        return '<button type="button" class="' + cls + '" data-opt="' + i + '" ' + (s.done ? 'disabled' : '') + '><span class="k">' + String.fromCharCode(65 + i) + '</span><span>' + esc(o) + '</span></button>';
      }).join('') + '</div>';
    } else if (q.type === 'fill') {
      h += '<input class="study-input" id="studyFill" placeholder="输入答案" ' + (s.done ? 'disabled' : '') + ' value="' + esc(s.selected || '') + '">';
    } else {
      h += '<textarea class="study-textarea" id="studyShort" placeholder="先自己写一遍…" ' + (s.done ? 'disabled' : '') + '>' + esc(s.selected || '') + '</textarea>';
    }
    if (s.done) h += feedbackHTML(q);
    h += '<div class="study-quiz-actions"><button class="study-btn" data-act="back">返回</button><div>' +
      (s.done ? '<button class="study-btn primary" data-act="next">' + (s.idx === s.queue.length - 1 ? '完成' : '下一题') + '</button>' :
        (q.type === 'single' || q.type === 'multiple' ? '<button class="study-btn primary" data-act="submit" ' + (s.selected == null || (Array.isArray(s.selected) && !s.selected.length) ? 'disabled' : '') + '>提交</button>' :
          '<button class="study-btn primary" data-act="submit">提交</button>')) +
      '</div></div></div>';
    body.innerHTML = h;
    body.querySelectorAll('[data-opt]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (s.done) return;
        var i = Number(b.dataset.opt), q = s.queue[s.idx];
        if (q.type === 'multiple') {
          var arr = Array.isArray(s.selected) ? s.selected.slice() : [];
          if (arr.includes(i)) arr = arr.filter(function (x) { return x !== i; }); else arr.push(i);
          s.selected = arr;
        } else s.selected = i;
        renderQuiz();
      });
    });
    body.querySelectorAll('[data-act]').forEach(function (b) {
      b.addEventListener('click', function () {
        var act = b.dataset.act;
        if (act === 'back') { state.quiz = null; render(state.tab); }
        if (act === 'next') { s.idx++; s.selected = null; s.done = false; s.correct = null; s.revealed = false; renderQuiz(); }
        if (act === 'submit') submitQuiz();
        if (act === 'selfOk' || act === 'selfNo') {
          var qq = s.queue[s.idx];
          s.correct = act === 'selfOk'; s.revealed = true;
          onAnswer(qq, s.correct); syncPageWrong(qq, s.correct); renderQuiz();
        }
      });
    });
  }
  function submitQuiz() {
    var s = state.quiz, q = s.queue[s.idx]; if (!q || s.done) return;
    var val = s.selected;
    if (q.type === 'fill') { var f = document.getElementById('studyFill'); val = f ? f.value : ''; }
    if (q.type === 'short') {
      var box = document.getElementById('studyShort'); val = box ? box.value : '';
      s.selected = val; s.done = true; s.correct = null;
      renderQuiz();
      return;
    }
    var ok = false;
    if (q.type === 'single') ok = val === q.a;
    if (q.type === 'multiple') ok = Array.isArray(val) && [...q.a].sort().join(',') === [...val].sort().join(',');
    if (q.type === 'fill') ok = (q.a || []).some(function (a) { return String(a).trim().toLowerCase() === String(val).trim().toLowerCase(); });
    s.done = true; s.correct = ok;
    onAnswer(q, ok); syncPageWrong(q, ok);
    renderQuiz();
  }
  function feedbackHTML(q) {
    var s = state.quiz, ans = '';
    if (q.type === 'single') ans = q.options[q.a];
    else if (q.type === 'multiple') ans = q.a.map(function (i) { return q.options[i]; }).join('；');
    else if (q.type === 'fill') ans = (q.a || []).join(' / ');
    if (q.type === 'short') {
      if (s.revealed) return '<div class="study-feedback"><b>参考答案</b><br>' + esc(q.a) + '<br><span class="' + (s.correct ? 'ok' : 'bad') + '">已记录：' + (s.correct ? '答对' : '没答全') + '</span></div>';
      return '<div class="study-feedback"><b>参考答案</b><br>' + esc(q.a) + '<div class="study-actions"><button class="study-btn" data-act="selfOk">我答对了</button><button class="study-btn" data-act="selfNo">没答全</button></div></div>';
    }
    return '<div class="study-feedback">' + (s.correct ? '<span class="ok">正确</span>' : '<span class="bad">再想想</span> · 正确答案：<b>' + esc(ans) + '</b>') + '<br>' + esc(q.e || '') + '</div>';
  }
  function finishQuiz() {
    var s = state.quiz;
    state.el.body.innerHTML = '<div class="study-sec-title">这一组完成</div><div class="study-sub">' + s.title + ' · ' + s.queue.length + ' 题。记录已保存。</div><div class="study-actions"><button class="study-btn primary" data-act="doneToday">回今日</button><button class="study-btn" data-act="doneReview">看复习</button></div>';
    state.el.body.querySelectorAll('[data-act]').forEach(function (b) {
      b.addEventListener('click', function () { state.quiz = null; render(b.dataset.act === 'doneReview' ? 'review' : 'today'); });
    });
  }

  function exportData() {
    var data = { page: loadPage(), tools: loadTools() };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'orbit-progress.json'; a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }
  function importData(e) {
    var f = e.target.files && e.target.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var d = JSON.parse(r.result);
        if (d.page) savePage(d.page);
        if (d.tools) saveTools(d.tools);
        render('data'); updateFab();
      } catch (err) {}
    };
    r.readAsText(f);
  }

  document.addEventListener('DOMContentLoaded', function () { build(); updateFab(); });
  window.StudyTools = { open: open, close: close, onAnswer: onAnswer, refresh: updateFab };
})();
