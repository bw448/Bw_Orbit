/* Orbit ArcGIS module — renders exam map, bank, terms, algorithms, workflows. */
(function () {
  'use strict';
  var A = window.ARCGIS;
  if (!A) return;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function byId(id) { return document.getElementById(id); }
  function list(arr, cls, tag) {
    return (arr || []).map(function (x) {
      return '<' + (tag || 'p') + (cls ? ' class="' + cls + '"' : '') + '>' + esc(x) + '</' + (tag || 'p') + '>';
    }).join('');
  }

  /* exam map */
  var exam = byId('examGrid');
  if (exam) {
    exam.innerHTML = (A.exam || []).map(function (x) {
      return '<div class="exam-item"><div class="k">' + esc(x[0]) + '</div><div class="v">' + esc(x[1]) + '</div></div>';
    }).join('');
  }

  /* score bar */
  var score = byId('scoreBar');
  if (score) {
    var total = (A.score || []).reduce(function (s, x) { return s + (x.total || 0); }, 0) || 100;
    score.innerHTML = '<div class="score-track">' + (A.score || []).map(function (x, i) {
      var pct = (x.total || 0) / total * 100;
      return '<span class="score-seg s' + i + '" style="width:' + pct + '%" title="' + esc(x.name + ' ' + x.total + ' 分') + '">' +
        '<i>' + esc(x.name) + '</i><b>' + (x.approx ? '≈' : '') + esc(x.total) + '</b></span>';
    }).join('') + '</div>' +
      '<p class="score-note">简答、实验、论述三项为按总分 100 推算的示意值（简答区间 20—25 分），具体以卷面为准。</p>';
  }

  /* quiz */
  if (byId('agQuiz') && window.OrbitQuiz) {
    window.OrbitQuiz.mount(byId('agQuiz'), { id: 'arcgis', items: A.bank, perPage: 12 });
  }

  /* terms */
  var terms = byId('termGrid');
  if (terms) {
    var allTerms = A.terms || [];
    function renderTerms(list) {
      terms.innerHTML = list.map(function (t) {
        return '<article class="term-card">' +
          '<div class="term-head"><span class="term-en">' + esc(t.en) + '</span><span class="term-zh">' + esc(t.zh) + '</span></div>' +
          '<p class="term-def">' + esc(t.def) + '</p>' +
          '<div class="term-key"><b>记忆骨架</b>' + esc(t.key) + '</div>' +
          '</article>';
      }).join('');
    }
    renderTerms(allTerms);
    var hideBtn = byId('termHide');
    if (hideBtn) hideBtn.addEventListener('click', function () {
      terms.classList.toggle('hide-def');
      hideBtn.textContent = terms.classList.contains('hide-def') ? '显示释义' : '遮住释义';
      hideBtn.classList.toggle('on', terms.classList.contains('hide-def'));
    });
    var shuffleBtn = byId('termShuffle');
    var showingAll = true;
    if (shuffleBtn) shuffleBtn.addEventListener('click', function () {
      if (showingAll) {
        var copy = allTerms.slice();
        for (var i = copy.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var tmp = copy[i]; copy[i] = copy[j]; copy[j] = tmp;
        }
        renderTerms(copy.slice(0, 5));
        shuffleBtn.textContent = '看全部 ' + allTerms.length + ' 条';
        showingAll = false;
      } else {
        renderTerms(allTerms);
        shuffleBtn.textContent = '随机抽 5 条';
        showingAll = true;
      }
    });
    terms.addEventListener('click', function (e) {
      var card = e.target.closest('.term-card');
      if (card) card.classList.toggle('revealed');
    });
  }
  var vocab = byId('vocabTable');
  if (vocab) {
    vocab.innerHTML = (A.vocab || []).map(function (v) {
      return '<tr><td>' + esc(v[0]) + '</td><td>' + esc(v[1]) + '</td></tr>';
    }).join('');
  }

  /* algorithms */
  var algos = byId('algoList');
  if (algos) {
    algos.innerHTML = (A.algorithms || []).map(function (a, i) {
      return '<details class="algo-card"' + (i === 0 ? ' open' : '') + '>' +
        '<summary><span class="algo-num">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<span class="algo-title">' + esc(a.title) + '<span class="algo-en">' + esc(a.en) + '</span></span>' +
        '<span class="algo-badge">文字原理 + 注释代码</span></summary>' +
        '<div class="algo-body">' +
        '<div class="algo-block"><div class="algo-k">原理</div><p>' + esc(a.principle) + '</p></div>' +
        '<div class="algo-block"><div class="algo-k">步骤</div><ol>' + (a.steps || []).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol></div>' +
        '<div class="algo-block"><div class="algo-k">C 语言注释代码</div><pre class="algo-code">' + esc(a.code) + '</pre></div>' +
        '<div class="algo-exam"><b>答题提醒</b>' + esc(a.exam) + '</div>' +
        '</div></details>';
    }).join('');
  }

  /* workflows */
  var wfs = byId('workflowGrid');
  if (wfs) {
    wfs.innerHTML = (A.workflows || []).map(function (w, i) {
      return '<details class="wf-card"' + (i === 0 ? ' open' : '') + '>' +
        '<summary><span class="wf-num">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<span class="wf-title">' + esc(w.title) + '</span><span class="wf-go">展开流程</span></summary>' +
        '<div class="wf-body">' +
        '<p class="wf-goal">' + esc(w.goal) + '</p>' +
        '<ol class="wf-steps">' + (w.steps || []).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' +
        '<div class="wf-meta"><span><b>核心工具</b>' + esc(w.tools) + '</span></div>' +
        '<ul class="wf-notes">' + (w.notes || []).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>' +
        '<div class="wf-exam"><b>考场写法</b>' + esc(w.exam) + '</div>' +
        '</div></details>';
    }).join('');
    Array.prototype.forEach.call(wfs.querySelectorAll('.wf-card'), function (d) {
      var go = d.querySelector('.wf-go');
      if (!go) return;
      var upd = function () { go.textContent = d.open ? '收起流程' : '展开流程'; };
      d.addEventListener('toggle', upd);
      upd();
    });
  }

  /* short answers + analysis, with mastery marks */
  var qaState = {};
  try { qaState = JSON.parse(localStorage.getItem('orbit.arcgis.qa') || '{}') || {}; } catch (e) { qaState = {}; }
  var allQa = (A.short || []).concat(A.analysis || []);

  function qaButtons(id) {
    var st = qaState[id];
    return '<div class="qa-mastery">' +
      '<button type="button" class="qa-mark' + (st === 1 ? ' on ok' : '') + '" data-qa="' + esc(id) + '" data-ok="1">会</button>' +
      '<button type="button" class="qa-mark' + (st === 0 ? ' on bad' : '') + '" data-qa="' + esc(id) + '" data-ok="0">不会</button>' +
      '</div>';
  }
  function saveQa() {
    try { localStorage.setItem('orbit.arcgis.qa', JSON.stringify(qaState)); } catch (e) {}
    var done = allQa.filter(function (q) { return qaState[q.id] === 1; }).length;
    var prog = byId('qaProgress');
    if (prog) prog.textContent = '已掌握 ' + done + ' / ' + allQa.length;
  }

  var short = byId('shortList');
  if (short) {
    short.innerHTML = (A.short || []).map(function (q, i) {
      return '<details class="qa-card">' +
        '<summary><span class="qa-num">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<span class="qa-q">' + esc(q.q) + '</span><span class="qa-ch">' + esc(q.chapter || '') + '</span>' + qaButtons(q.id) + '</summary>' +
        '<div class="qa-body">' + (q.answer || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') +
        '<div class="qa-tip"><b>记忆提示</b>' + esc(q.tip || '') + '</div></div></details>';
    }).join('');
  }

  var analysis = byId('analysisList');
  if (analysis) {
    analysis.innerHTML = (A.analysis || []).map(function (q, i) {
      return '<details class="qa-card analysis">' +
        '<summary><span class="qa-num">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<span class="qa-q">' + esc(q.q) + '</span><span class="qa-ch">分析题</span>' + qaButtons(q.id) + '</summary>' +
        '<div class="qa-body">' + (q.answer || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') +
        '<div class="qa-tip"><b>答题骨架</b>' + esc(q.tip || '') + '</div></div></details>';
    }).join('');
  }
  saveQa();

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.qa-mark');
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      var id = btn.dataset.qa;
      var val = Number(btn.dataset.ok);
      qaState[id] = qaState[id] === val ? undefined : val;
      if (qaState[id] === undefined) delete qaState[id];
      var card = btn.closest('.qa-card');
      if (card) {
        card.querySelectorAll('.qa-mark').forEach(function (b) { b.classList.remove('on', 'ok', 'bad'); });
        if (qaState[id] !== undefined) {
          btn.classList.add('on');
          btn.classList.add(val === 1 ? 'ok' : 'bad');
        }
      }
      saveQa();
      return;
    }
    var filterBtn = e.target.closest('#qaWrongOnly');
    if (filterBtn) {
      var only = filterBtn.getAttribute('aria-pressed') !== 'true';
      filterBtn.setAttribute('aria-pressed', String(only));
      filterBtn.classList.toggle('on', only);
      document.querySelectorAll('.qa-card').forEach(function (card) {
        var qid = card.querySelector('.qa-mark') ? card.querySelector('.qa-mark').dataset.qa : '';
        card.hidden = only && qaState[qid] === 1;
      });
    }
  });

  /* essay */
  var essay = byId('essayBox');
  if (essay) {
    essay.innerHTML =
      '<div class="essay-block"><div class="essay-k">万能得分金句（五条）</div><ul class="essay-sentences">' +
      (A.essay.sentences || []).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="essay-block"><div class="essay-k">通用逻辑框架</div><ol class="essay-frame">' +
      (A.essay.framework || []).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol></div>' +
      '<div class="essay-types">' + (A.essay.types || []).map(function (t) {
        return '<article class="essay-type"><div class="essay-type-head"><b>' + esc(t.name) + '</b><span>' + esc(t.examples) + '</span></div>' +
          '<ol>' + (t.frame || []).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol></article>';
      }).join('') + '</div>';
  }

  /* plan */
  var plan = byId('agPlan');
  if (plan) {
    plan.innerHTML = (A.plan || []).map(function (p) {
      return '<div class="plan-step"><b>' + esc(p[0]) + '</b><h3>' + esc(p[1]) + '</h3><p>' + esc(p[2]) + '</p></div>';
    }).join('');
  }

  /* resources */
  var res = byId('agResources');
  if (res) {
    res.innerHTML = (A.resources || []).map(function (r) {
      var isPdf = /\.pdf$/i.test(r[2] || '');
      return '<a class="resource-card" href="' + esc(r[2]) + '" target="_blank" rel="noopener"' + (isPdf ? ' download' : '') + '>' +
        '<span class="tag">' + esc(r[3]) + '</span><b>' + esc(r[0]) + '</b><small>' + esc(r[1]) + '</small>' +
        '<span class="go">' + (isPdf ? '打开 / 下载' : '打开资料') + ' <span>↗</span></span></a>';
    }).join('');
  }
})();


/* course subnav: close "more" after choosing a link / clicking outside */
(function () {
  var more = document.querySelectorAll('.course-subnav .submore');
  more.forEach(function (d) {
    d.addEventListener('click', function (e) {
      if (e.target.closest('a')) d.removeAttribute('open');
    });
  });
  document.addEventListener('click', function (e) {
    if (e.target.closest('.submore')) return;
    more.forEach(function (d) { d.removeAttribute('open'); });
  });
})();
