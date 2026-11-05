/* Orbit quiz engine — driven by window.OrbitQuiz.mount(root, {id, items, perPage}) */
(function () {
  'use strict';

  var LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function norm(s) {
    return String(s == null ? '' : s)
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (c) {
        return String.fromCharCode(c.charCodeAt(0) - 0xFEE0);
      })
      .toLowerCase()
      .replace(/[\s　]+/g, '')
      .replace(/[，,。.、；;：:！!？?（）()【】\[\]"“”'‘’]/g, '');
  }

  function matches(input, accepted) {
    var list = Array.isArray(accepted) ? accepted : [accepted];
    var v = norm(input);
    if (!v) return false;
    for (var i = 0; i < list.length; i++) {
      var a = norm(list[i]);
      if (v === a) return true;
      // allow a shorter answer when the official answer lists alternatives with "或"
      var parts = String(list[i]).split(/[／/|或]/);
      for (var j = 0; j < parts.length; j++) {
        if (norm(parts[j]) === v) return true;
      }
    }
    return false;
  }

  function sameSet(a, b) {
    if (a.length !== b.length) return false;
    var x = a.slice().sort().join(',');
    var y = b.slice().sort().join(',');
    return x === y;
  }

  function typeName(t) {
    return { single: '单选', multi: '多选', judge: '判断', fill: '填空' }[t] || t;
  }

  function load(key) {
    try {
      return JSON.parse(localStorage.getItem('orbit.quiz.' + key) || '{}') || {};
    } catch (e) { return {}; }
  }

  function save(key, state) {
    try { localStorage.setItem('orbit.quiz.' + key, JSON.stringify(state)); } catch (e) {}
  }

  function mount(root, cfg) {
    if (!root || !cfg || !cfg.items || !cfg.items.length) return;
    var items = cfg.items.map(function (it, i) {
      it._n = i + 1;
      if (it.type === 'single' && typeof it.answer === 'number') it.answer = [it.answer];
      if (it.type === 'multi' && Array.isArray(it.answer)) it.answer = it.answer.map(Number);
      if (it.type === 'judge') it.answer = !!it.answer;
      return it;
    });
    var key = cfg.id || 'quiz';
    var state = load(key);
    var perPage = cfg.perPage || 12;

    var filter = { type: 'all', chapter: '', source: '', q: '', wrong: false };
    var shown = perPage;

    var types = [];
    items.forEach(function (it) {
      if (types.indexOf(it.type) < 0) types.push(it.type);
    });
    var typeOrder = ['single', 'multi', 'judge', 'fill'];
    types.sort(function (a, b) { return typeOrder.indexOf(a) - typeOrder.indexOf(b); });

    var chapters = [];
    var sources = [];
    items.forEach(function (it) {
      if (it.chapter && chapters.indexOf(it.chapter) < 0) chapters.push(it.chapter);
      if (it.source && sources.indexOf(it.source) < 0) sources.push(it.source);
    });

    root.innerHTML =
      '<div class="quiz-bar">' +
        '<div class="quiz-tabs" role="tablist" aria-label="题型">' +
          '<button type="button" class="on" data-type="all">全部 <b>' + items.length + '</b></button>' +
          types.map(function (t) {
            var n = items.filter(function (x) { return x.type === t; }).length;
            return '<button type="button" data-type="' + t + '">' + typeName(t) + ' <b>' + n + '</b></button>';
          }).join('') +
        '</div>' +
        '<div class="quiz-tools">' +
          '<label class="quiz-search"><span class="sr-only">搜索题目</span>' +
            '<input type="search" placeholder="搜索题干或关键词" autocomplete="off"></label>' +
          (sources.length > 1 ? '<label class="quiz-select"><span class="sr-only">来源</span><select class="quiz-source">' +
            '<option value="">全部来源</option>' +
            sources.map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + '</option>'; }).join('') +
            '</select></label>' : '') +
          (chapters.length > 1 ? '<label class="quiz-select"><span class="sr-only">章节</span><select class="quiz-chapter">' +
            '<option value="">全部章节</option>' +
            chapters.map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + '</option>'; }).join('') +
            '</select></label>' : '') +
          '<button type="button" class="quiz-chip" data-act="wrong" aria-pressed="false">只看错题</button>' +
          '<button type="button" class="quiz-chip" data-act="shuffle">打乱顺序</button>' +
          '<button type="button" class="quiz-chip" data-act="reset">重置进度</button>' +
        '</div>' +
      '</div>' +
      '<div class="quiz-progress" aria-live="polite">' +
        '<div class="quiz-track"><i></i></div>' +
        '<span class="quiz-count">0 / 0</span>' +
      '</div>' +
      '<div class="quiz-list"></div>' +
      '<div class="quiz-more"><button type="button" class="quiz-load">加载更多</button></div>' +
      '<p class="quiz-empty" hidden>没有符合条件的题目。</p>';

    var listEl = root.querySelector('.quiz-list');
    var moreEl = root.querySelector('.quiz-more');
    var emptyEl = root.querySelector('.quiz-empty');
    var progressEl = root.querySelector('.quiz-progress');
    var countEl = root.querySelector('.quiz-count');

    function filtered() {
      var out = items.filter(function (it) {
        if (filter.type !== 'all' && it.type !== filter.type) return false;
        if (filter.source && it.source !== filter.source) return false;
        if (filter.chapter && it.chapter !== filter.chapter) return false;
        if (filter.q) {
          var hay = (it.q + ' ' + (it.options || []).join(' ') + ' ' + (it.explain || '')).toLowerCase();
          if (hay.indexOf(filter.q.toLowerCase()) < 0) return false;
        }
        if (filter.wrong && !(state[it.id] && state[it.id].ok === false)) return false;
        return true;
      });
      return out;
    }

    function overall() {
      var answered = 0, ok = 0;
      items.forEach(function (it) {
        var s = state[it.id];
        if (s && s.ok !== undefined) {
          answered++;
          if (s.ok) ok++;
        }
      });
      return { answered: answered, ok: ok, total: items.length };
    }

    function updateProgress() {
      var o = overall();
      var pct = o.total ? Math.round(o.answered / o.total * 100) : 0;
      progressEl.querySelector('i').style.width = pct + '%';
      countEl.textContent = o.answered + ' / ' + o.total + ' 已答 · 正确 ' + o.ok;
    }

    function card(it) {
      var s = state[it.id] || {};
      var cls = 'qcard';
      if (s.ok === true) cls += ' ok';
      if (s.ok === false) cls += ' bad';
      if (s.revealed) cls += ' revealed';
      var body = '';
      if (it.type === 'fill') body = fillBody(it, s);
      else if (it.type === 'judge') body = judgeBody(it, s);
      else body = choiceBody(it, s);
      return '<article class="' + cls + '" data-id="' + esc(it.id) + '">' +
        '<div class="qcard-head"><span class="qnum">' + String(it._n).padStart(2, '0') + '</span>' +
        '<span class="qtype">' + typeName(it.type) + '</span>' +
        (it.chapter ? '<span class="qchapter">' + esc(it.chapter) + '</span>' : '') +
        '<span class="qmark" aria-hidden="true"></span></div>' +
        (it.type === 'fill' ? '' : '<p class="qtext">' + formatQ(it.q) + '</p>') + body +
        '<div class="qfeedback" role="status"></div>' +
        (it.explain ? '<details class="qexplain"><summary>看解析</summary><p>' + esc(it.explain) + '</p></details>' : '') +
      '</article>';
    }

    function formatQ(q) {
      // keep blanks visible and preserve code line breaks
      return esc(q).replace(/\n/g, '<br>');
    }

    function choiceBody(it, s) {
      var multi = it.type === 'multi';
      var picked = s.a == null ? [] : (Array.isArray(s.a) ? s.a : [s.a]).map(Number);
      var locked = s.ok !== undefined;
      var opts = (it.options || []).map(function (o, i) {
        var c = 'qopt';
        if (picked.indexOf(i) >= 0) c += ' sel';
        if (locked) {
          if ((it.answer || []).indexOf(i) >= 0) c += ' ok';
          else if (picked.indexOf(i) >= 0) c += ' bad';
          c += ' locked';
        }
        return '<button type="button" class="' + c + '" data-i="' + i + '"' + (locked ? ' disabled' : '') + '>' +
          '<span class="ql">' + LETTERS[i] + '</span><span class="qt">' + esc(o) + '</span></button>';
      }).join('');
      return '<div class="qopts' + (multi ? ' multi' : '') + '">' + opts + '</div>' +
        (multi && !locked ? '<div class="qactions"><button type="button" class="qsubmit"' + (picked.length ? '' : ' disabled') + '>提交答案</button></div>' : '') +
        (!locked ? '<div class="qactions"><button type="button" class="qreveal">显示答案</button></div>' : '');
    }

    function judgeBody(it, s) {
      var locked = s.ok !== undefined;
      var picked = s.a;
      var mk = function (val, label) {
        var c = 'qopt js';
        if (picked === val) c += ' sel';
        if (locked) {
          if (it.answer === val) c += ' ok';
          else if (picked === val) c += ' bad';
        }
        return '<button type="button" class="' + c + '" data-j="' + val + '"' + (locked ? ' disabled' : '') + '>' + label + '</button>';
      };
      return '<div class="qopts judge">' + mk(true, '对') + mk(false, '错') + '</div>' +
        (!locked ? '<div class="qactions"><button type="button" class="qreveal">显示答案</button></div>' : '');
    }

    function fillBody(it, s) {
      var answers = it.answers || [];
      var n = Math.max(answers.length, 1);
      var locked = s.ok !== undefined;
      var html = '<p class="qtext qfill-q">' + formatQ(it.q) + '</p><div class="qfill">';
      for (var i = 0; i < n; i++) {
        var label = n === 1 ? '答案' : '第 ' + (i + 1) + ' 空';
        html += '<label class="qblank"><span>' + label + '</span>' +
          '<input type="text" data-b="' + i + '" aria-label="' + label + '"' +
          ' value="' + esc((s.v && s.v[i]) || '') + '"' + (locked ? ' disabled' : '') + '></label>';
      }
      html += '</div>' +
        (!locked ? '<div class="qactions"><button type="button" class="qsubmit fill">检查答案</button>' +
          '<button type="button" class="qreveal">显示答案</button></div>' : '');
      return html;
    }

    function showFeedback(cardEl, it, ok, s) {
      var fb = cardEl.querySelector('.qfeedback');
      var answerText;
      if (it.type === 'fill') {
        answerText = (it.answers || []).join(' / ');
      } else if (it.type === 'judge') {
        answerText = it.answer ? '对' : '错';
      } else {
        answerText = (it.answer || []).map(function (i) { return LETTERS[i]; }).join('');
      }
      var revealed = s && s.revealed;
      fb.className = 'qfeedback ' + (ok ? 'ok' : (revealed ? 'revealed' : 'bad'));
      fb.innerHTML = '<b>' + (ok ? '正确' : (revealed ? '参考答案' : '再想想')) + '</b><span>' +
        (revealed ? '' : '参考答案：') + esc(answerText) + '</span>';
    }

    function mark(it, ok, extra) {
      var prev = state[it.id] || {};
      state[it.id] = Object.assign({}, prev, extra || {}, { ok: ok });
      save(key, state);
    }

    function render() {
      var list = filtered();
      var slice = list.slice(0, shown);
      listEl.innerHTML = slice.map(card).join('');
      Array.prototype.forEach.call(listEl.querySelectorAll('.qcard'), function (el) {
        var st = state[el.dataset.id];
        var item = items.find(function (x) { return x.id === el.dataset.id; });
        if (st && st.ok !== undefined && item) showFeedback(el, item, st.ok, st);
      });
      moreEl.hidden = slice.length >= list.length;
      emptyEl.hidden = list.length !== 0;
      updateProgress();
    }

    // delegate clicks
    listEl.addEventListener('click', function (e) {
      var cardEl = e.target.closest('.qcard');
      if (!cardEl) return;
      var it = items.find(function (x) { return x.id === cardEl.dataset.id; });
      if (!it) return;
      var s = state[it.id] || {};
      if (s.ok !== undefined) return;

      var opt = e.target.closest('.qopt');
      if (opt) {
        if (it.type === 'judge') {
          var val = opt.dataset.j === 'true';
          mark(it, val === it.answer, { a: val });
          render();
          return;
        }
        var i = Number(opt.dataset.i);
        if (it.type === 'multi') {
          var picked = (s.a || []).slice();
          var at = picked.indexOf(i);
          if (at >= 0) picked.splice(at, 1); else picked.push(i);
          state[it.id] = Object.assign({}, s, { a: picked });
          save(key, state);
          render();
          return;
        }
        mark(it, i === it.answer[0], { a: i });
        render();
        return;
      }

      if (e.target.closest('.qsubmit')) {
        if (it.type === 'multi') {
          var chosen = (s.a || []).slice().sort();
          if (!chosen.length) return;
          mark(it, sameSet(chosen, (it.answer || []).slice().sort()), { a: chosen });
          render();
        } else if (it.type === 'fill') {
          var inputs = Array.prototype.slice.call(cardEl.querySelectorAll('.qfill input'));
          var vals = inputs.map(function (x) { return x.value; });
          var ok = vals.length >= (it.answers || []).length &&
            vals.every(function (v, idx) { return matches(v, (it.answers || [])[idx]); });
          mark(it, ok, { v: vals });
          render();
        }
        return;
      }

      if (e.target.closest('.qreveal')) {
        mark(it, false, { revealed: true, a: it.type === 'judge' ? (it.answer ? false : true) : (s.a || []) });
        render();
      }
    });

    // multi selection enables submit
    listEl.addEventListener('change', function () {});

    root.addEventListener('click', function (e) {
      var t = e.target.closest('[data-type]');
      if (t) {
        filter.type = t.dataset.type;
        shown = perPage;
        Array.prototype.forEach.call(root.querySelectorAll('[data-type]'), function (b) {
          b.classList.toggle('on', b === t);
        });
        render();
        return;
      }
      var act = e.target.closest('[data-act]');
      if (act) {
        var a = act.dataset.act;
        if (a === 'wrong') {
          filter.wrong = !filter.wrong;
          act.setAttribute('aria-pressed', String(filter.wrong));
          act.classList.toggle('on', filter.wrong);
        } else if (a === 'shuffle') {
          for (var i = items.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = items[i]; items[i] = items[j]; items[j] = tmp;
          }
          items.forEach(function (x, idx) { x._n = idx + 1; });
        } else if (a === 'reset') {
          if (!confirm('清除这个题库的答题记录？')) return;
          state = {};
          save(key, state);
        }
        shown = perPage;
        render();
        return;
      }
      if (e.target.closest('.quiz-load')) {
        shown += perPage;
        render();
      }
    });

    root.addEventListener('input', function (e) {
      if (e.target.matches('.quiz-search input')) {
        filter.q = e.target.value.trim();
        shown = perPage;
        render();
      }
    });
    root.addEventListener('change', function (e) {
      if (e.target.matches('.quiz-source')) {
        filter.source = e.target.value;
        filter.chapter = '';
        var ch = root.querySelector('.quiz-chapter');
        if (ch) ch.value = '';
        shown = perPage;
        render();
      } else if (e.target.matches('.quiz-chapter')) {
        filter.chapter = e.target.value;
        shown = perPage;
        render();
      }
    });
    // Enter in fill inputs
    root.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.matches('.qfill input')) {
        e.preventDefault();
        var cardEl = e.target.closest('.qcard');
        var btn = cardEl && cardEl.querySelector('.qsubmit');
        if (btn) btn.click();
      }
    });

    render();
  }

  window.OrbitQuiz = { mount: mount };
})();
