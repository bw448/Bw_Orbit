/* Orbit · 遥感教材附录 3/4：背诵卡、英中互译自测、错题本、全部词汇 */
(function () {
  'use strict';

  var D = window.RS_APPENDIX || {};
  var root = document.getElementById('rsApp');
  if (!root) return;

  var KEY = 'orbit.rs.appendix.v1';
  var entries = [];
  (D.app3 || []).forEach(function (x, i) {
    entries.push({
      id: x.id || 'a3-' + String(i + 1).padStart(3, '0'),
      src: 'a3', abbr: x.abbr || '', en: x.en || '', zh: x.zh || '', page: x.page || ''
    });
  });
  (D.app4 || []).forEach(function (x, i) {
    entries.push({
      id: x.id || 'a4-' + String(i + 1).padStart(4, '0'),
      src: 'a4', abbr: '', en: x.en || '', zh: x.zh || '', page: x.page || ''
    });
  });
  if (!entries.length) {
    root.innerHTML = '<p class="rs-app-empty">附录数据正在整理。</p>';
    return;
  }

  var state = load();
  state.known = state.known || {};
  state.wrong = state.wrong || {};

  var ui = {
    mode: 'card',
    src: 'all',
    q: '',
    letter: '',
    hideKnown: false,
    cardIndex: 0,
    revealed: false,
    quiz: [],
    qi: 0,
    score: 0,
    locked: false,
    picked: -1,
    browseShown: 60
  };

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function srcName(s) { return s === 'a3' ? '附录 3 · 缩写 A—H' : '附录 4 · 词汇 A—Z'; }
  function byId(id) { return document.getElementById(id); }
  function termLabel(e) {
    if (e.src !== 'a3') return e.en;
    if (e.abbr && e.en) return e.abbr + ' · ' + e.en;
    return e.abbr || e.en;
  }
  function promptHtml(e) {
    if (e.src !== 'a3') return esc(e.en);
    var main = e.abbr || e.en;
    var small = e.abbr && e.en ? e.en : '';
    return '<span class="abbr">' + esc(main) + '</span>' + (small ? '<small>' + esc(small) + '</small>' : '');
  }
  function canEn2Zh(e) { return !!((e.abbr || e.en) && e.zh); }
  function canZh2En(e) { return !!(e.zh && (e.src === 'a3' ? (e.abbr || e.en) : e.en)); }

  function filtered() {
    var q = ui.q.trim().toLowerCase();
    return entries.filter(function (e) {
      if (ui.src !== 'all' && e.src !== ui.src) return false;
      if (q) {
        var hay = (e.abbr + ' ' + e.en + ' ' + e.zh).toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      if (ui.letter) {
        var first = (e.src === 'a3' ? (e.abbr || e.en) : e.en).trim().charAt(0).toUpperCase();
        if (first !== ui.letter) return false;
      }
      return true;
    });
  }
  function cardList() {
    var list = filtered();
    if (ui.hideKnown) list = list.filter(function (e) { return !state.known[e.id]; });
    return list;
  }
  function knownCount(list) {
    var n = 0;
    list.forEach(function (e) { if (state.known[e.id]) n++; });
    return n;
  }
  function wrongList() {
    return entries.filter(function (e) {
      return state.wrong[e.id] && !state.known[e.id] && (ui.src === 'all' || e.src === ui.src);
    }).sort(function (a, b) {
      return (state.wrong[b.id].c || 0) - (state.wrong[a.id].c || 0);
    });
  }

  function renderBar() {
    var list = filtered();
    var count = byId('rsAppCount');
    if (count) {
      count.textContent = ui.mode === 'wrong'
        ? wrongList().length + ' 条错题 · 已认识 ' + knownCount(list)
        : list.length + ' 条 · 已认识 ' + knownCount(list);
    }
    Array.prototype.forEach.call(root.querySelectorAll('[data-mode]'), function (b) {
      b.classList.toggle('on', b.dataset.mode === ui.mode);
      b.setAttribute('aria-selected', b.dataset.mode === ui.mode ? 'true' : 'false');
    });
    Array.prototype.forEach.call(root.querySelectorAll('[data-src]'), function (b) {
      b.classList.toggle('on', b.dataset.src === ui.src);
      b.setAttribute('aria-pressed', b.dataset.src === ui.src ? 'true' : 'false');
    });
  }

  function shell() {
    root.innerHTML =
      '<div class="rs-app-bar">' +
        '<div class="rs-app-modes" role="tablist" aria-label="附录学习方式">' +
          '<button type="button" data-mode="card" class="on" role="tab">背诵卡</button>' +
          '<button type="button" data-mode="en2zh" role="tab">英 → 中</button>' +
          '<button type="button" data-mode="zh2en" role="tab">中 → 英</button>' +
          '<button type="button" data-mode="wrong" role="tab">错题本</button>' +
          '<button type="button" data-mode="browse" role="tab">全部词汇</button>' +
        '</div>' +
        '<div class="rs-app-src" aria-label="附录筛选">' +
          '<button type="button" data-src="all" class="on" aria-pressed="true">全部</button>' +
          '<button type="button" data-src="a3" aria-pressed="false">附录 3 · 缩写</button>' +
          '<button type="button" data-src="a4" aria-pressed="false">附录 4 · 词汇</button>' +
        '</div>' +
        '<span class="rs-app-count" id="rsAppCount"></span>' +
      '</div>' +
      '<div class="rs-app-stage" id="rsAppStage"></div>';
  }

  function renderStage() {
    var stage = byId('rsAppStage');
    if (!stage) return;
    if (ui.mode === 'card') return renderCard(stage);
    if (ui.mode === 'en2zh' || ui.mode === 'zh2en') return renderQuiz(stage);
    if (ui.mode === 'wrong') return renderWrong(stage);
    return renderBrowse(stage);
  }

  /* ---------- 背诵卡 ---------- */
  function renderCard(stage) {
    var list = cardList();
    if (!list.length) {
      stage.innerHTML = '<div class="rs-app-card"><p class="rs-app-empty">没有符合条件的词条。换一个附录或清空筛选。</p></div>';
      return;
    }
    if (ui.cardIndex >= list.length) ui.cardIndex = 0;
    if (ui.cardIndex < 0) ui.cardIndex = list.length - 1;
    var e = list[ui.cardIndex];
    var known = !!state.known[e.id];
    var prompt = promptHtml(e);
    stage.innerHTML =
      '<div class="rs-app-card">' +
        '<div class="rs-app-kicker">' + esc(srcName(e.src)) + (e.page ? ' · PDF P' + esc(e.page) : '') + '</div>' +
        '<div class="rs-app-prompt">' + prompt + '</div>' +
        (ui.revealed
          ? '<div class="rs-app-answer"><div class="zh">' + esc(e.zh) + '</div>' +
            (e.src === 'a3' && e.abbr && e.en ? '<div class="en">' + esc(e.en) + '</div>' : '') +
            '<div class="page">' + esc(srcName(e.src)) + (e.page ? ' · PDF P' + esc(e.page) : '') + '</div></div>'
          : '<p class="rs-app-hint">先在心里译一遍，再显示中文。</p>') +
        '<div class="rs-app-actions">' +
          (ui.revealed
            ? '<button type="button" class="rs-app-btn bad" data-act="unknown">不认识</button>' +
              '<button type="button" class="rs-app-btn ok" data-act="known">认识</button>'
            : '<button type="button" class="rs-app-btn primary" data-act="reveal">显示中文</button>') +
        '</div>' +
        '<div class="rs-app-progress"><div class="rs-app-track"><i style="width:' +
          Math.round(knownCount(list) / list.length * 100) + '%"></i></div><span>' +
          (ui.cardIndex + 1) + ' / ' + list.length + ' · 已认识 ' + knownCount(list) + '</span></div>' +
        '<div class="rs-app-foot">' +
          '<button type="button" data-act="prev">上一条</button>' +
          '<button type="button" data-act="next">下一条</button>' +
          '<button type="button" data-act="random">随机一条</button>' +
          '<button type="button" data-act="toggle-known">' + (ui.hideKnown ? '显示已认识' : '只看未认识') + '</button>' +
        '</div>' +
      '</div>';
  }

  function nextCard(delta) {
    var list = cardList();
    if (!list.length) return;
    ui.cardIndex = (ui.cardIndex + delta + list.length) % list.length;
    ui.revealed = false;
    renderStage();
  }

  /* ---------- 自测 ---------- */
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function startQuiz(pool) {
    var source = (pool && pool.length ? pool.slice() : filtered().slice()).filter(function (e) {
      return ui.mode === 'en2zh' ? canEn2Zh(e) : canZh2En(e);
    });
    if (!source.length) { ui.quiz = []; ui.qi = 0; ui.score = 0; ui.locked = false; return; }
    shuffle(source);
    source = source.slice(0, Math.min(10, source.length));
    ui.quiz = source.map(function (e) {
      var same = entries.filter(function (x) {
        if (x.src !== e.src || x.id === e.id) return false;
        return ui.mode === 'en2zh' ? canEn2Zh(x) : canZh2En(x);
      });
      shuffle(same);
      var opts = [];
      var field = ui.mode === 'en2zh' ? 'zh' : (e.src === 'a3' ? (e.abbr ? 'abbr' : 'en') : 'en');
      var seen = {};
      seen[String(e[field])] = 1;
      opts.push({ text: e[field], ok: true });
      for (var i = 0; i < same.length && opts.length < 4; i++) {
        var val = same[i][field];
        if (!val || seen[String(val)]) continue;
        seen[String(val)] = 1;
        opts.push({ text: val, ok: false });
      }
      shuffle(opts);
      return { entry: e, opts: opts };
    });
    ui.qi = 0; ui.score = 0; ui.locked = false; ui.picked = -1;
  }

  function renderQuiz(stage) {
    if (!ui.quiz.length) startQuiz();
    if (!ui.quiz.length) {
      stage.innerHTML = '<div class="rs-app-card"><p class="rs-app-empty">没有符合条件的词条。</p></div>';
      return;
    }
    if (ui.qi >= ui.quiz.length) {
      stage.innerHTML =
        '<div class="rs-app-card">' +
          '<div class="rs-app-kicker">ROUND DONE</div>' +
          '<div class="rs-app-prompt">这一组，答对 ' + ui.score + ' / ' + ui.quiz.length + '。</div>' +
          '<p class="rs-app-hint">' + (ui.score >= ui.quiz.length * 0.8 ? '很稳。可以换一组，或去错题本看漏掉的。' : '错题已自动收进错题本，先重练这一组。') + '</p>' +
          '<div class="rs-app-actions"><button type="button" class="rs-app-btn primary" data-act="quiz-restart">再来一组</button>' +
            '<button type="button" class="rs-app-btn" data-act="open-wrong">去错题本</button></div>' +
        '</div>';
      return;
    }
    var q = ui.quiz[ui.qi];
    var e = q.entry;
    var prompt = ui.mode === 'en2zh'
      ? promptHtml(e)
      : '<span class="zh">' + esc(e.zh) + '</span>';
    var opts = q.opts.map(function (o, i) {
      var cls = 'rs-app-opt';
      if (ui.locked && i === ui.picked) cls += o.ok ? ' ok' : ' bad';
      if (ui.locked && o.ok) cls += ' ok';
      return '<button type="button" class="' + cls + '" data-opt="' + i + '"' + (ui.locked ? ' disabled' : '') + '>' + esc(o.text) + '</button>';
    }).join('');
    stage.innerHTML =
      '<div class="rs-app-card">' +
        '<div class="rs-app-kicker">' + (ui.mode === 'en2zh' ? 'EN → 中文' : '中文 → EN') + ' · ' + (ui.qi + 1) + ' / ' + ui.quiz.length + ' · ' + esc(srcName(e.src)) + '</div>' +
        '<div class="rs-app-prompt">' + prompt + '</div>' +
        '<div class="rs-app-options">' + opts + '</div>' +
        (ui.locked
          ? '<div class="rs-app-feedback ' + (q.opts[ui.picked] && q.opts[ui.picked].ok ? 'ok' : 'bad') + '">' +
              (q.opts[ui.picked] && q.opts[ui.picked].ok ? '<b>正确。</b>' : '<b>再看一眼。</b>') +
              ' 参考答案：' + esc(ui.mode === 'en2zh' ? e.zh : (e.src === 'a3' ? (e.abbr || e.en) : e.en)) + '</div>' +
            '<div class="rs-app-actions"><button type="button" class="rs-app-btn primary" data-act="quiz-next">' +
              (ui.qi + 1 >= ui.quiz.length ? '看结果' : '下一题') + '</button></div>'
          : '') +
        '<div class="rs-app-progress"><div class="rs-app-track"><i style="width:' +
          Math.round(ui.qi / ui.quiz.length * 100) + '%"></i></div><span>答对 ' + ui.score + ' · 第 ' + (ui.qi + 1) + ' / ' + ui.quiz.length + ' 题</span></div>' +
      '</div>';
  }

  /* ---------- 错题本 ---------- */
  function renderWrong(stage) {
    var list = wrongList();
    var known = knownCount(filtered());
    stage.innerHTML =
      '<div class="rs-app-wrong-head"><div><div class="rs-app-kicker">WRONG BOOK</div><h3>附录错题本</h3>' +
        '<p>英中互译答错、背诵卡点“不认识”的词条会自动收进来；认识后自动移出。</p></div>' +
        '<div class="rs-app-wrong-stats"><div><b>' + list.length + '</b><span>待复习</span></div>' +
        '<div><b>' + known + '</b><span>已认识</span></div>' +
        '<div><b>' + entries.length + '</b><span>总词条</span></div></div></div>' +
      (list.length
        ? '<div class="rs-app-actions" style="justify-content:flex-start;margin-top:0">' +
            '<button type="button" class="rs-app-btn primary" data-act="retry-wrong">重练全部错题（' + list.length + '）</button></div>' +
          '<div class="rs-app-wrong-list">' + list.map(function (e) {
            var w = state.wrong[e.id];
            return '<div class="rs-app-wrong-item"><div>' +
              '<div class="en">' + esc(termLabel(e)) + '</div>' +
              '<div class="zh">' + esc(e.zh) + '</div>' +
              '<div class="tag">' + esc(srcName(e.src)) + (e.page ? ' · PDF P' + esc(e.page) : '') + ' · 错 ' + (w.c || 1) + ' 次</div>' +
              '</div><div style="display:flex;gap:6px"><button type="button" data-act="retry-one" data-id="' + esc(e.id) + '">重练</button>' +
              '<button type="button" data-act="remove-wrong" data-id="' + esc(e.id) + '">移除</button></div></div>';
          }).join('') + '</div>'
        : '<div class="rs-app-card" style="margin-top:14px"><p class="rs-app-empty">还没有错题。去“英 → 中”或“中 → 英”做一组，答错的会自动进来。</p>' +
          '<div class="rs-app-actions"><button type="button" class="rs-app-btn primary" data-act="go-en2zh">做一组英 → 中</button></div></div>');
  }

  /* ---------- 全部词汇 ---------- */
  function renderBrowse(stage) {
    var letters = '';
    for (var i = 0; i < 26; i++) {
      var L = String.fromCharCode(65 + i);
      letters += '<option value="' + L + '"' + (ui.letter === L ? ' selected' : '') + '>' + L + '</option>';
    }
    stage.innerHTML =
      '<div class="rs-app-filterrow">' +
        '<div class="rs-app-search"><input id="rsAppSearch" type="search" placeholder="搜索 English / 中文 / 缩写，如 MSS、大气窗口" autocomplete="off" value="' + esc(ui.q) + '"></div>' +
        '<select id="rsAppLetter" class="rs-app-letter" aria-label="按首字母筛选"><option value="">全部字母</option>' + letters + '</select>' +
      '</div>' +
      '<div class="rs-app-browse" id="rsAppBrowse"></div>' +
      '<div class="rs-app-more"><button type="button" class="rs-app-btn" data-act="browse-more" id="rsAppMore">加载更多</button></div>' +
      '<p class="rs-app-note"><b>来源：</b>《遥感导论》附录 3（遥感常用英文缩写、全称及中文译名）与附录 4（遥感词汇选编，英汉对照）。按教材页序整理，OCR 可能有少量识别误差，以书上原文为准。</p>';
    renderBrowseList();
  }
  function renderBrowseList() {
    var box = byId('rsAppBrowse');
    if (!box) return;
    var list = filtered();
    var slice = list.slice(0, ui.browseShown);
    box.innerHTML = slice.length ? slice.map(function (e) {
      return '<div class="rs-app-row"><b>' + esc(termLabel(e)) +
        '<span class="pg">' + esc(srcName(e.src)) + (e.page ? ' · PDF P' + esc(e.page) : '') + '</span></b>' +
        '<span>' + esc(e.zh) + '</span></div>';
    }).join('') : '<p class="rs-app-empty">没有匹配的词条。</p>';
    var more = byId('rsAppMore');
    if (more) more.hidden = slice.length >= list.length;
  }

  /* ---------- events ---------- */
  root.addEventListener('click', function (e) {
    var mode = e.target.closest('[data-mode]');
    if (mode) {
      ui.mode = mode.dataset.mode;
      ui.q = '';
      ui.letter = '';
      ui.cardIndex = 0; ui.revealed = false; ui.locked = false; ui.picked = -1;
      if (ui.mode === 'en2zh' || ui.mode === 'zh2en') startQuiz();
      renderBar(); renderStage();
      return;
    }
    var src = e.target.closest('[data-src]');
    if (src) {
      ui.src = src.dataset.src;
      ui.q = '';
      ui.letter = '';
      ui.cardIndex = 0; ui.revealed = false; ui.browseShown = 60;
      if (ui.mode === 'en2zh' || ui.mode === 'zh2en') startQuiz();
      renderBar(); renderStage();
      return;
    }
    var act = e.target.closest('[data-act]');
    if (!act) return;
    var a = act.dataset.act;
    if (a === 'reveal') { ui.revealed = true; renderStage(); }
    else if (a === 'known' || a === 'unknown') {
      var list = cardList();
      var e2 = list[ui.cardIndex];
      if (!e2) return;
      if (a === 'known') {
        state.known[e2.id] = 1;
        delete state.wrong[e2.id];
      } else {
        state.known[e2.id] = 0;
        state.wrong[e2.id] = { c: ((state.wrong[e2.id] || {}).c || 0) + 1 };
      }
      save();
      nextCard(1);
      renderBar();
    }
    else if (a === 'next') nextCard(1);
    else if (a === 'prev') nextCard(-1);
    else if (a === 'random') {
      var l = cardList();
      if (l.length) { ui.cardIndex = Math.floor(Math.random() * l.length); ui.revealed = false; renderStage(); }
    }
    else if (a === 'toggle-known') { ui.hideKnown = !ui.hideKnown; ui.cardIndex = 0; ui.revealed = false; renderStage(); renderBar(); }
    else if (a === 'quiz-next') { ui.qi++; ui.locked = false; ui.picked = -1; renderStage(); }
    else if (a === 'quiz-restart') { startQuiz(); renderStage(); }
    else if (a === 'open-wrong') { ui.mode = 'wrong'; renderBar(); renderStage(); }
    else if (a === 'go-en2zh') { ui.mode = 'en2zh'; startQuiz(); renderBar(); renderStage(); }
    else if (a === 'retry-wrong') {
      var wl = wrongList();
      if (!wl.length) return;
      ui.mode = 'en2zh';
      startQuiz(wl);
      renderBar(); renderStage();
    }
    else if (a === 'retry-one') {
      var one = entries.filter(function (x) { return x.id === act.dataset.id; });
      if (!one.length) return;
      ui.mode = 'en2zh';
      startQuiz(one);
      renderBar(); renderStage();
    }
    else if (a === 'remove-wrong') { delete state.wrong[act.dataset.id]; save(); renderStage(); renderBar(); }
    else if (a === 'browse-more') { ui.browseShown += 60; renderBrowseList(); }
    else if (a === 'opt') { /* handled below */ }
  });

  root.addEventListener('click', function (e) {
    var opt = e.target.closest('[data-opt]');
    if (!opt || ui.locked || (ui.mode !== 'en2zh' && ui.mode !== 'zh2en')) return;
    var q = ui.quiz[ui.qi];
    if (!q) return;
    var i = Number(opt.dataset.opt);
    ui.picked = i; ui.locked = true;
    if (q.opts[i] && q.opts[i].ok) {
      ui.score++;
    } else {
      var id = q.entry.id;
      state.wrong[id] = { c: ((state.wrong[id] || {}).c || 0) + 1 };
      save();
    }
    renderStage(); renderBar();
  });

  root.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'rsAppSearch') {
      ui.q = e.target.value;
      ui.browseShown = 60;
      renderBrowseList();
      renderBar();
    }
  });
  root.addEventListener('change', function (e) {
    if (e.target && e.target.id === 'rsAppLetter') {
      ui.letter = e.target.value;
      ui.browseShown = 60;
      renderBrowseList();
      renderBar();
    }
  });

  shell();
  renderBar();
  renderStage();
})();
