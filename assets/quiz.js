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

  function iso(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function today() { return iso(new Date()); }
  function daysFromNow(n) {
    var d = new Date();
    d.setDate(d.getDate() + n);
    return iso(d);
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

    var filter = { type: 'all', chapter: '', source: '', q: '', wrong: false, marked: false, due: false, random: false };
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
          '<button type="button" class="quiz-chip" data-act="random20" aria-pressed="false">随机 20 题</button>' +
          '<button type="button" class="quiz-chip" data-act="due" aria-pressed="false">今日复习</button>' +
          '<button type="button" class="quiz-chip" data-act="marked" aria-pressed="false">收藏</button>' +
          '<button type="button" class="quiz-chip quiz-wrong-toggle" data-act="wrong" aria-pressed="false">错题本 <b class="qw-n">0</b></button>' +
          '<button type="button" class="quiz-chip" data-act="shuffle">打乱顺序</button>' +
          '<button type="button" class="quiz-chip" data-act="export">导出</button>' +
          '<button type="button" class="quiz-chip" data-act="import">导入</button>' +
          '<input type="file" class="quiz-import" accept=".json" hidden>' +
          '<button type="button" class="quiz-chip" data-act="reset">重置进度</button>' +
        '</div>' +
      '</div>' +
      '<div class="quiz-progress" aria-live="polite">' +
        '<div class="quiz-track"><i></i></div>' +
        '<span class="quiz-count">0 / 0</span>' +
      '</div>' +
      '<div class="quiz-wrongbook" id="' + key + '-wrongbook" hidden></div>' +
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
        if (filter.marked && !(state[it.id] && state[it.id].bm)) return false;
        if (filter.due) {
          var st = state[it.id];
          if (!st || !st.due || st.due > today()) return false;
        }
        return true;
      });
      return out;
    }

    function overall() {
      var answered = 0, ok = 0;
      items.forEach(function (it) {
        var s = state[it.id];
        if (s && s.ok !== undefined && !s.redo) {
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
      var due = 0;
      items.forEach(function (it) {
        var st = state[it.id];
        if (st && st.due && st.due <= today()) due++;
      });
      countEl.textContent = o.answered + ' / ' + o.total + ' 已答 · 正确 ' + o.ok + (due ? ' · 今日待复习 ' + due : '');
    }

    function wrongItems() {
      return items.filter(function (it) {
        var st = state[it.id];
        return st && st.ok === false;
      });
    }

    function dueItems() {
      return items.filter(function (it) {
        var st = state[it.id];
        return st && st.due && st.due <= today();
      });
    }

    function markRedo(list) {
      list.forEach(function (it) {
        var st = state[it.id];
        if (!st) return;
        st.redo = true;
        delete st.a; delete st.v; delete st.revealed;
      });
      save(key, state);
    }

    function updateWrongbook() {
      var wrong = wrongItems();
      var toggle = root.querySelector('.quiz-wrong-toggle');
      var badge = root.querySelector('.qw-n');
      if (badge) badge.textContent = wrong.length;
      if (toggle) toggle.classList.toggle('has-wrong', wrong.length > 0);
      var panel = root.querySelector('.quiz-wrongbook');
      if (!panel) return;
      panel.hidden = !filter.wrong;
      if (!filter.wrong) return;

      var due = wrong.filter(function (it) {
        var st = state[it.id];
        return st && st.due && st.due <= today();
      }).length;
      var mastered = items.filter(function (it) {
        var st = state[it.id];
        return st && st.step >= 5;
      }).length;
      var byChapter = {};
      wrong.forEach(function (it) {
        var c = it.chapter || '未分章';
        byChapter[c] = (byChapter[c] || 0) + 1;
      });
      var chapters = Object.keys(byChapter).sort(function (a, b) {
        return byChapter[b] - byChapter[a];
      }).slice(0, 6);
      var top = chapters.length ? byChapter[chapters[0]] || 1 : 1;
      panel.innerHTML =
        '<div class="qw-head"><div>' +
          '<div class="qw-kicker">WRONG BOOK / 错题本</div>' +
          '<h3>错题都在这儿。</h3>' +
          '<p>答错的题自动收进来；重做后会按 1 / 3 / 7 / 14 / 30 天安排复习。先看章节分布，再重练。</p>' +
        '</div><div class="qw-stats">' +
          '<div><b>' + wrong.length + '</b><span>错题</span></div>' +
          '<div><b>' + due + '</b><span>今日到期</span></div>' +
          '<div><b>' + mastered + '</b><span>连对 5 次</span></div>' +
        '</div></div>' +
        (chapters.length ? '<div class="qw-bars">' + chapters.map(function (c) {
          return '<button type="button" class="qw-bar" data-qw-chapter="' + esc(c) + '">' +
            '<span class="qw-bar-label">' + esc(c) + '</span>' +
            '<span class="qw-bar-track"><i style="width:' + Math.round(byChapter[c] / top * 100) + '%"></i></span>' +
            '<b>' + byChapter[c] + '</b></button>';
        }).join('') + '</div>' : '<p class="qw-empty">还没有错题。先做几道，答错后会自动收进这里。</p>') +
        '<div class="qw-actions">' +
          '<button type="button" class="qw-primary" data-qw="retry">重练全部错题</button>' +
          (due ? '<button type="button" class="qw-secondary" data-qw="due">只练今日到期（' + due + '）</button>' : '') +
          '<button type="button" class="qw-secondary" data-qw="export">导出错题</button>' +
          '<button type="button" class="qw-secondary" data-qw="clear">清空错题记录</button>' +
        '</div>';
    }

    function card(it) {
      var s = state[it.id] || {};
      var cls = 'qcard';
      if (s.ok === true && !s.redo) cls += ' ok';
      if (s.ok === false && !s.redo) cls += ' bad';
      if (s.revealed && !s.redo) cls += ' revealed';
      if (s.bm) cls += ' marked';
      var body = '';
      if (it.type === 'fill') body = fillBody(it, s);
      else if (it.type === 'judge') body = judgeBody(it, s);
      else body = choiceBody(it, s);
      return '<article class="' + cls + '" data-id="' + esc(it.id) + '">' +
        '<div class="qcard-head"><span class="qnum">' + String(it._n).padStart(2, '0') + '</span>' +
        '<span class="qtype">' + typeName(it.type) + '</span>' +
        (it.chapter ? '<span class="qchapter">' + esc(it.chapter) + '</span>' : '') +
        '<button type="button" class="qbm' + (s.bm ? ' on' : '') + '" data-bm="' + esc(it.id) + '" aria-pressed="' + (!!s.bm) + '" aria-label="收藏">' + (s.bm ? '★' : '☆') + '</button>' +
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
      var locked = s.ok !== undefined && !s.redo;
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
        (!locked ? '<div class="qactions"><button type="button" class="qreveal">显示答案</button></div>' :
          '<div class="qactions"><button type="button" class="qredo">重做</button></div>');
    }

    function judgeBody(it, s) {
      var locked = s.ok !== undefined && !s.redo;
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
        (!locked ? '<div class="qactions"><button type="button" class="qreveal">显示答案</button></div>' :
          '<div class="qactions"><button type="button" class="qredo">重做</button></div>');
    }

    function fillBody(it, s) {
      var answers = it.answers || [];
      var n = Math.max(answers.length, 1);
      var locked = s.ok !== undefined && !s.redo;
      var html = '<p class="qtext qfill-q">' + formatQ(it.q) + '</p><div class="qfill">';
      for (var i = 0; i < n; i++) {
        var label = n === 1 ? '答案' : '第 ' + (i + 1) + ' 空';
        html += '<label class="qblank"><span>' + label + '</span>' +
          '<input type="text" data-b="' + i + '" aria-label="' + label + '"' +
          ' value="' + esc((s.v && s.v[i]) || '') + '"' + (locked ? ' disabled' : '') + '></label>';
      }
      html += '</div>' +
        (!locked ? '<div class="qactions"><button type="button" class="qsubmit fill">检查答案</button>' +
          '<button type="button" class="qreveal">显示答案</button></div>' :
          '<div class="qactions"><button type="button" class="qredo">重做</button></div>');
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
      var next = Object.assign({}, prev, extra || {}, { ok: ok });
      delete next.redo;
      if (!(extra && extra.revealed)) {
        if (ok) {
          var step = (prev.step || 0) + 1;
          var days = [1, 3, 7, 14, 30][Math.min(step - 1, 4)] || 30;
          next.step = step;
          next.due = daysFromNow(days);
        } else {
          next.step = 0;
          next.due = daysFromNow(1);
        }
      }
      state[it.id] = next;
      save(key, state);
    }

    function render() {
      var list = filtered();
      var limit = filter.random ? 20 : shown;
      var slice = list.slice(0, limit);
      listEl.innerHTML = slice.map(card).join('');
      Array.prototype.forEach.call(listEl.querySelectorAll('.qcard'), function (el) {
        var st = state[el.dataset.id];
        var item = items.find(function (x) { return x.id === el.dataset.id; });
        if (st && st.ok !== undefined && !st.redo && item) showFeedback(el, item, st.ok, st);
      });
      moreEl.hidden = filter.random || slice.length >= list.length;
      emptyEl.hidden = list.length !== 0;
      updateProgress();
      updateWrongbook();
    }

    // delegate clicks
    listEl.addEventListener('click', function (e) {
      var cardEl = e.target.closest('.qcard');
      if (!cardEl) return;
      var it = items.find(function (x) { return x.id === cardEl.dataset.id; });
      if (!it) return;
      var s = state[it.id] || {};

      var bm = e.target.closest('.qbm');
      if (bm) {
        state[it.id] = Object.assign({}, s, { bm: !s.bm });
        save(key, state);
        render();
        return;
      }

      var redo = e.target.closest('.qredo');
      if (redo) {
        var st = state[it.id] || {};
        delete st.ok; delete st.a; delete st.v; delete st.revealed; delete st.redo;
        state[it.id] = st;
        save(key, state);
        render();
        return;
      }

      if (s.ok !== undefined && !s.redo) return;

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
        filter.random = false;
        var rnd = root.querySelector('[data-act="random20"]');
        if (rnd) { rnd.classList.remove('on'); rnd.setAttribute('aria-pressed', 'false'); }
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
          if (filter.wrong) {
            filter.due = false;
            filter.marked = false;
            filter.random = false;
            var dueBtn = root.querySelector('[data-act="due"]');
            var markBtn = root.querySelector('[data-act="marked"]');
            var rndBtn = root.querySelector('[data-act="random20"]');
            if (dueBtn) { dueBtn.classList.remove('on'); dueBtn.setAttribute('aria-pressed', 'false'); }
            if (markBtn) { markBtn.classList.remove('on'); markBtn.setAttribute('aria-pressed', 'false'); }
            if (rndBtn) { rndBtn.classList.remove('on'); rndBtn.setAttribute('aria-pressed', 'false'); }
          }
        } else if (a === 'marked') {
          filter.marked = !filter.marked;
          act.setAttribute('aria-pressed', String(filter.marked));
          act.classList.toggle('on', filter.marked);
          if (filter.marked) {
            filter.wrong = false;
            var wb = root.querySelector('[data-act="wrong"]');
            if (wb) { wb.classList.remove('on'); wb.setAttribute('aria-pressed', 'false'); }
          }
        } else if (a === 'due') {
          filter.due = !filter.due;
          act.setAttribute('aria-pressed', String(filter.due));
          act.classList.toggle('on', filter.due);
          if (filter.due) {
            filter.wrong = false;
            var wbDue = root.querySelector('[data-act="wrong"]');
            if (wbDue) { wbDue.classList.remove('on'); wbDue.setAttribute('aria-pressed', 'false'); }
            markRedo(dueItems());
          }
        } else if (a === 'random20') {
          filter.random = !filter.random;
          act.setAttribute('aria-pressed', String(filter.random));
          act.classList.toggle('on', filter.random);
          if (filter.random) {
            filter.type = 'all'; filter.source = ''; filter.chapter = ''; filter.q = '';
            filter.wrong = false; filter.marked = false; filter.due = false;
            Array.prototype.forEach.call(root.querySelectorAll('[data-type]'), function (b) {
              b.classList.toggle('on', b.dataset.type === 'all');
            });
            var srcSel = root.querySelector('.quiz-source'); if (srcSel) srcSel.value = '';
            var chSel = root.querySelector('.quiz-chapter'); if (chSel) chSel.value = '';
            var srch = root.querySelector('.quiz-search input'); if (srch) srch.value = '';
            for (var k = items.length - 1; k > 0; k--) {
              var j = Math.floor(Math.random() * (k + 1));
              var tmp = items[k]; items[k] = items[j]; items[j] = tmp;
            }
            items.forEach(function (x, idx) { x._n = idx + 1; });
          }
        } else if (a === 'export') {
          var blob = new Blob([JSON.stringify({ key: key, state: state }, null, 2)], { type: 'application/json' });
          var url = URL.createObjectURL(blob);
          var link = document.createElement('a');
          link.href = url;
          link.download = 'orbit-quiz-' + key + '.json';
          document.body.appendChild(link);
          link.click();
          link.remove();
          setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        } else if (a === 'import') {
          var fileInput = root.querySelector('.quiz-import');
          if (fileInput) fileInput.click();
          return;
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
      var qw = e.target.closest('[data-qw]');
      if (qw) {
        var qa = qw.dataset.qw;
        if (qa === 'retry') {
          filter.type = 'all'; filter.chapter = ''; filter.source = ''; filter.q = '';
          filter.wrong = true; filter.due = false; filter.marked = false;
          shown = perPage;
          Array.prototype.forEach.call(root.querySelectorAll('[data-type]'), function (b) {
            b.classList.toggle('on', b.dataset.type === 'all');
          });
          var src = root.querySelector('.quiz-source'); if (src) src.value = '';
          var ch = root.querySelector('.quiz-chapter'); if (ch) ch.value = '';
          var srch = root.querySelector('.quiz-search input'); if (srch) srch.value = '';
          var dueB = root.querySelector('[data-act="due"]'); if (dueB) { dueB.classList.remove('on'); dueB.setAttribute('aria-pressed', 'false'); }
          var markB = root.querySelector('[data-act="marked"]'); if (markB) { markB.classList.remove('on'); markB.setAttribute('aria-pressed', 'false'); }
          var wbB = root.querySelector('[data-act="wrong"]'); if (wbB) { wbB.classList.add('on'); wbB.setAttribute('aria-pressed', 'true'); }
          markRedo(wrongItems());
          render();
          listEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (qa === 'due') {
          filter.wrong = false; filter.due = true; filter.marked = false;
          var wbD = root.querySelector('[data-act="wrong"]'); if (wbD) { wbD.classList.remove('on'); wbD.setAttribute('aria-pressed', 'false'); }
          var dueD = root.querySelector('[data-act="due"]'); if (dueD) { dueD.classList.add('on'); dueD.setAttribute('aria-pressed', 'true'); }
          markRedo(dueItems());
          render();
          listEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (qa === 'export') {
          var wl = wrongItems().map(function (it) {
            return { id: it.id, q: it.q, chapter: it.chapter || '', state: state[it.id] };
          });
          var blob2 = new Blob([JSON.stringify({ key: key, wrong: wl }, null, 2)], { type: 'application/json' });
          var url2 = URL.createObjectURL(blob2);
          var link2 = document.createElement('a');
          link2.href = url2;
          link2.download = 'orbit-wrong-' + key + '.json';
          document.body.appendChild(link2);
          link2.click();
          link2.remove();
          setTimeout(function () { URL.revokeObjectURL(url2); }, 1000);
        } else if (qa === 'clear') {
          if (!confirm('清空这个题库的错题记录？收藏和正常答题记录会保留。')) return;
          wrongItems().forEach(function (it) {
            var st2 = state[it.id];
            if (!st2) return;
            delete st2.ok; delete st2.a; delete st2.v; delete st2.revealed; delete st2.step; delete st2.due;
            if (!st2.bm) delete state[it.id];
          });
          save(key, state);
          filter.wrong = false;
          var wbC = root.querySelector('[data-act="wrong"]'); if (wbC) { wbC.classList.remove('on'); wbC.setAttribute('aria-pressed', 'false'); }
          render();
        }
        return;
      }
      var qwch = e.target.closest('[data-qw-chapter]');
      if (qwch) {
        filter.wrong = true; filter.due = false; filter.marked = false;
        filter.chapter = qwch.dataset.qwChapter;
        shown = perPage;
        var wbCh = root.querySelector('[data-act="wrong"]'); if (wbCh) { wbCh.classList.add('on'); wbCh.setAttribute('aria-pressed', 'true'); }
        render();
        listEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        filter.random = false;
        var rnd = root.querySelector('[data-act="random20"]');
        if (rnd) { rnd.classList.remove('on'); rnd.setAttribute('aria-pressed', 'false'); }
        shown = perPage;
        render();
      }
    });
    root.addEventListener('change', function (e) {
      if (e.target.matches('.quiz-import')) {
        var f = e.target.files && e.target.files[0];
        if (!f) return;
        var reader = new FileReader();
        reader.onload = function () {
          try {
            var data = JSON.parse(reader.result);
            if (data && data.state && typeof data.state === 'object') {
              Object.keys(data.state).forEach(function (k) { state[k] = data.state[k]; });
              save(key, state);
              render();
            }
          } catch (err) {}
          e.target.value = '';
        };
        reader.readAsText(f);
      } else if (e.target.matches('.quiz-source')) {
        filter.source = e.target.value;
        filter.chapter = '';
        filter.random = false;
        var ch = root.querySelector('.quiz-chapter');
        if (ch) ch.value = '';
        shown = perPage;
        render();
      } else if (e.target.matches('.quiz-chapter')) {
        filter.chapter = e.target.value;
        filter.random = false;
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
