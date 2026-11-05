/* Orbit remote sensing — selection-first reading companion.
   No global assistant panel: select text, then translate or ask. */
(function () {
  'use strict';

  var KEY = 'orbit-ai-config';
  var MODEL = 'deepseek-chat';
  var G = Array.isArray(window.RS_GLOSSARY) ? window.RS_GLOSSARY : [];
  var CH = Array.isArray(window.RS_CHAPTERS) ? window.RS_CHAPTERS : [];
  var SYSTEM = '你是 Orbit 的遥感阅读伙伴，服务地理信息科学本科生。只回答与遥感、地理信息或当前学习内容有关的问题。' +
    '中文回答；术语第一次出现时给出英文。讲解按“一句话定义 → 机制/公式 → 一个具体例子 → 易混点或考试怎么考”组织。' +
    '如果选中内容是句子，先给自然英文翻译，再解释其中 1—3 个关键术语。不要编造教材页码；不确定就直说。';

  var state = {
    mode: 'term', title: '', selection: '', currentTerm: null,
    thread: [], busy: false, pending: null, token: 0,
    gCh: 'all', gQ: '', last: null
  };
  var el = {};
  var selTimer = null;

  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function short(s, n) {
    s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
    return s.length > (n || 80) ? s.slice(0, n || 80) + '…' : s;
  }
  function cfg() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return { key: '', model: MODEL };
      var c = JSON.parse(raw);
      return { key: c.key || '', model: c.model || MODEL };
    } catch (e) { return { key: '', model: MODEL }; }
  }
  function saveCfg(key) {
    try { localStorage.setItem(KEY, JSON.stringify({ provider: 'deepseek', model: MODEL, key: key })); } catch (e) {}
  }
  function hasKey() { return !!cfg().key; }
  function chapterLabel(ch) {
    for (var i = 0; i < CH.length; i++) {
      if (String(CH[i].id) === String(ch)) return CH[i].num + ' · ' + CH[i].title;
    }
    return 'CH ' + String(ch);
  }
  function contextText() {
    var c = window.ORBIT_CONTEXT;
    if (!c) return '';
    try { return '\n\n当前学习上下文（JSON）：\n' + JSON.stringify(c).slice(0, 3200); } catch (e) { return ''; }
  }

  /* ---------- markdown (small, safe subset) ---------- */
  function inline(s) {
    s = esc(s);
    s = s.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    return s;
  }
  function md(src) {
    var text = String(src == null ? '' : src).replace(/\r/g, '').trim();
    if (!text) return '';
    return text.split(/\n{2,}/).map(function (p) {
      p = p.trim();
      if (!p) return '';
      var code = p.match(/^```[^\n]*\n([\s\S]*?)\n?```$/);
      if (code) return '<pre><code>' + esc(code[1]) + '</code></pre>';
      if (/^#{1,4}\s/.test(p)) return '<h4>' + inline(p.replace(/^#{1,4}\s+/, '')) + '</h4>';
      var lines = p.split('\n');
      var bullets = lines.filter(function (l) { return l.trim(); });
      if (bullets.length && bullets.every(function (l) { return /^\s*[-*]\s+/.test(l); })) {
        return '<ul>' + bullets.map(function (l) { return '<li>' + inline(l.replace(/^\s*[-*]\s+/, '')) + '</li>'; }).join('') + '</ul>';
      }
      return '<p>' + lines.map(inline).join('<br>') + '</p>';
    }).join('');
  }

  /* ---------- DOM ---------- */
  function build() {
    var sel = document.createElement('div');
    sel.className = 'rs-sel';
    sel.hidden = true;
    sel.setAttribute('role', 'toolbar');
    sel.setAttribute('aria-label', '选中文字操作');
    sel.innerHTML =
      '<button type="button" data-act="translate" aria-label="翻译并解释英文"><b>译</b><span>英文 / 释义</span></button>' +
      '<button type="button" data-act="ask" aria-label="就选中内容深入提问"><b>问</b><span>深入讲解</span></button>' +
      '<button type="button" class="rs-sel-x" data-act="x" aria-label="关闭">×</button>';

    var card = document.createElement('div');
    card.className = 'rs-card';
    card.hidden = true;
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-label', '阅读理解笔记');
    card.innerHTML =
      '<div class="rs-head"><div><div class="rs-kicker" data-kicker>READING NOTE</div><div class="rs-title" data-title></div></div>' +
      '<button type="button" class="rs-close" data-act="close">关闭</button></div>' +
      '<div class="rs-scroll" data-body></div>' +
      '<div class="rs-compose"><textarea data-input rows="1" placeholder="继续追问…"></textarea><button type="button" data-act="send">发送</button></div>' +
      '<div class="rs-foot"><span>DeepSeek · Key 只存本机</span><button type="button" data-act="settings">设置 Key</button></div>';

    document.body.appendChild(sel);
    document.body.appendChild(card);
    el = {
      sel: sel, card: card,
      kicker: $('[data-kicker]', card), title: $('[data-title]', card),
      body: $('[data-body]', card), input: $('[data-input]', card), send: $('[data-act="send"]', card)
    };
    el.body.setAttribute('aria-live', 'polite');
  }

  function openCard(kicker, title, placeholder) {
    state.token++;
    state.busy = false;
    state.thread = [];
    state.currentTerm = null;
    el.card.hidden = false;
    el.kicker.textContent = kicker || 'READING NOTE';
    el.title.textContent = title || '';
    el.body.innerHTML = '';
    el.input.value = '';
    el.input.placeholder = placeholder || '继续追问…';
    el.input.disabled = false;
    el.send.disabled = false;
    var s = window.getSelection ? window.getSelection() : null;
    if (s) s.removeAllRanges();
    hideSel();
  }
  function closeCard() {
    state.token++;
    state.busy = false;
    state.pending = null;
    el.card.hidden = true;
    el.body.innerHTML = '';
    el.send.disabled = false;
  }
  function scrollBottom() { el.body.scrollTop = el.body.scrollHeight; }
  function addMsg(role, html, isText) {
    var d = document.createElement('div');
    d.className = 'rs-msg ' + role;
    if (isText) d.textContent = html;
    else d.innerHTML = html;
    el.body.appendChild(d);
    scrollBottom();
    return d;
  }
  function showQuote(text) {
    var q = document.createElement('div');
    q.className = 'rs-quote';
    q.textContent = text.length > 700 ? text.slice(0, 700) + '…' : text;
    el.body.appendChild(q);
    scrollBottom();
  }
  function showKeyPanel(note) {
    var old = $('[data-keypanel]', el.body);
    if (old) old.parentNode.removeChild(old);
    var c = cfg();
    var wrap = document.createElement('div');
    wrap.className = 'rs-keypanel';
    wrap.setAttribute('data-keypanel', '1');
    wrap.innerHTML =
      '<div class="rs-kicker">DEEPSEEK KEY</div>' +
      '<p>翻译和深入对话需要一个 DeepSeek API Key。Key 只保存在本机浏览器，不会上传到本系统以外的服务器。</p>' +
      '<input type="password" data-key autocomplete="off" placeholder="sk-..." value="' + esc(c.key) + '">' +
      '<div class="row"><button type="button" class="primary" data-act="saveKey">保存</button>' +
      '<button type="button" data-act="cancelKey">稍后</button></div>' +
      '<div class="st" data-key-st>' + esc(note || '') + '</div>' +
      '<p style="margin:10px 0 0">没有 Key 也可以先用页面上的术语表；术语表不需要联网。</p>';
    el.body.insertBefore(wrap, el.body.firstChild);
    el.body.scrollTop = 0;
    var input = $('[data-key]', wrap);
    if (input) setTimeout(function () { input.focus(); }, 40);
  }
  function saveKeyFromPanel() {
    var input = $('[data-key]', el.body);
    var st = $('[data-key-st]', el.body);
    var key = input ? input.value.trim() : '';
    if (!key) { if (st) { st.textContent = 'Key 不能为空。'; st.className = 'st bad'; } return; }
    saveCfg(key);
    if (st) { st.textContent = '已保存。正在继续…'; st.className = 'st ok'; }
    var pending = state.pending;
    state.pending = null;
    setTimeout(function () {
      var panel = $('[data-keypanel]', el.body);
      if (panel) panel.parentNode.removeChild(panel);
      if (pending) pending();
    }, 220);
  }

  /* ---------- selection ---------- */
  function readable(node) {
    var e = node && node.nodeType === 3 ? node.parentElement : node;
    if (!e || !e.closest) return false;
    if (e.closest('input,textarea,select,button,[contenteditable="true"],.rs-card,.rs-sel,.study-overlay,.ai-panel,.CodeMirror,.gn-links,.nav')) return false;
    return !!e.closest('main, #view, .view, .lesson-body');
  }
  function hideSel() { if (el.sel) el.sel.hidden = true; }
  function insideUI(target) { return !!(target && target.closest && target.closest('.rs-sel,.rs-card')); }
  function showSel(rect) {
    if (!rect) return;
    el.sel.hidden = false;
    var mobile = window.innerWidth <= 640;
    el.sel.classList.toggle('mobile', mobile);
    if (mobile) { el.sel.style.top = ''; el.sel.style.left = '50%'; return; }
    var top = rect.top - 46;
    if (top < 54) top = rect.bottom + 10;
    var left = rect.left + rect.width / 2;
    left = Math.max(96, Math.min(window.innerWidth - 96, left));
    el.sel.style.top = top + 'px';
    el.sel.style.left = left + 'px';
  }
  function checkSelection() {
    var s = window.getSelection ? window.getSelection() : null;
    if (!s || !s.rangeCount || s.isCollapsed) return;
    var text = s.toString().replace(/ /g, ' ').trim();
    if (text.length < 2 || text.length > 800) { hideSel(); return; }
    var range = s.getRangeAt(0);
    if (!readable(s.anchorNode) || !readable(s.focusNode)) { hideSel(); return; }
    var rects = range.getClientRects();
    var rect = rects.length ? rects[0] : range.getBoundingClientRect();
    if (!rect || (!rect.width && !rect.height)) { hideSel(); return; }
    state.selection = text;
    showSel(rect);
  }

  /* ---------- glossary lookup ---------- */
  function norm(s) {
    return String(s == null ? '' : s).toLowerCase()
      .replace(/[“”"'’‘（）()\[\]【】,，。；;：:、\-_/]/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }
  function enCore(en) { return norm(String(en).replace(/\([^)]*\)/g, '')); }
  function enAliases(en) {
    var out = [];
    String(en).replace(/\(([^)]*)\)/g, function (_, inner) {
      inner.split(/[,;]/).forEach(function (x) { if (x.trim()) out.push(norm(x)); });
      return '';
    });
    return out;
  }
  /* ---------- term card ---------- */
  function termHTML(g) {
    return '<div class="rs-term"><div class="zh">' + esc(g.zh) + '</div><div class="en">' + esc(g.en) + '</div>' +
      '<div class="def">' + esc(g.def) + '</div><div class="zhdef">' + esc(g.zhDef) + '</div>' +
      '<div class="meta"><span>' + esc(chapterLabel(g.ch)) + '</span><span>GLOSSARY · 中英对照</span></div></div>' +
      '<div class="rs-term-actions"><button type="button" class="primary" data-act="deepen">AI 讲深一点</button>' +
      '<button type="button" data-act="askTerm">问一个问题</button></div>';
  }
  function showTerm(g, withQuote, quoteText) {
    openCard('译 / TERM', g.zh, '问这个术语：机制、区别、例子…');
    state.currentTerm = g;
    if (withQuote) showQuote(quoteText || g.zh);
    el.body.insertAdjacentHTML('beforeend', termHTML(g));
    scrollBottom();
  }
  function exactTerm(text) {
    var t = norm(text);
    var best = null;
    G.forEach(function (g) {
      var zh = norm(g.zh), en = enCore(g.en);
      if (t === zh || t === en || enAliases(g.en).indexOf(t) >= 0) { best = g; return; }
      if (!best && zh.length >= 2 && t.indexOf(zh) === 0 && t.length <= zh.length + 10) best = g;
    });
    return best;
  }
  function translate(text) {
    text = String(text || state.selection || '').trim();
    if (!text) return;
    var hit = exactTerm(text);
    if (hit) { showTerm(hit, true, text); return; }
    openCard('译 / EXPLAIN', '选中内容', '继续问这句话的意思、术语或背景…');
    showQuote(text);
    var prompt = '请把下面这段内容做成一条遥感阅读注解。若它是术语：给中文名、英文名、英文释义（1—2 句）、中文解释、易混概念；' +
      '若它是句子：先给自然英文翻译，再解释其中 1—3 个关键术语。用简短小标题，不要客套。\n\n选中内容：\n' + text.slice(0, 2400);
    if (!hasKey()) {
      state.pending = function () { callAI(prompt, { pushUser: true }); };
      addMsg('sys', '术语表里没有这条。填入 Key 后，可以翻译整句并解释关键术语。');
      showKeyPanel('填 Key 后自动继续翻译。');
      return;
    }
    callAI(prompt, { pushUser: true });
  }

  /* ---------- conversation ---------- */
  function discuss(text, opts) {
    opts = opts || {};
    text = String(text || '').trim();
    openCard(opts.kicker || '问 / EXPLAIN', opts.title || short(text, 44), '继续追问这个知识点…');
    if (text) showQuote(text);
    var prompt = opts.prompt || '请把这段内容当作一个遥感知识点，按“一句话定义 → 机制/公式 → 一个例子 → 易混点”讲清楚。不要只翻译。';
    var full = prompt + (text ? '\n\n内容：\n' + text.slice(0, 5000) : '');
    if (!hasKey()) {
      state.pending = function () { callAI(full, { pushUser: true }); };
      showKeyPanel('写下一个问题前，先填 Key；也可以先看术语表。');
      return;
    }
    callAI(full, { pushUser: true });
  }
  function callAI(prompt, opts) {
    opts = opts || {};
    if (!hasKey()) {
      state.pending = function () { callAI(prompt, opts); };
      showKeyPanel('填 Key 后自动继续。');
      return;
    }
    if (state.busy) return;
    var myToken = state.token;
    state.busy = true;
    state.last = { prompt: prompt, opts: opts };
    if (opts.pushUser) state.thread.push({ role: 'user', content: prompt });
    var wait = addMsg('assistant', '<span class="wait"><i></i>正在组织讲解…</span>');
    el.send.disabled = true;
    var c = cfg();
    var messages = [{ role: 'system', content: SYSTEM + contextText() }].concat(state.thread.slice(-10));
    fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + c.key },
      body: JSON.stringify({ model: c.model || MODEL, messages: messages, temperature: 0.35, max_tokens: 1500, stream: false })
    }).then(function (res) {
      if (!res.ok) {
        return res.text().then(function (body) {
          var extra = '';
          try { var j = JSON.parse(body); extra = (j.error && j.error.message) || ''; } catch (e) {}
          var err = new Error('HTTP_' + res.status + ' ' + (extra || body.slice(0, 160)));
          err.status = res.status;
          throw err;
        });
      }
      return res.json();
    }).then(function (j) {
      var answer = ((j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '').trim();
      if (myToken !== state.token) return;
      wait.innerHTML = md(answer || '（没有返回内容）');
      state.thread.push({ role: 'assistant', content: answer || '' });
      state.thread = state.thread.slice(-12);
      state.busy = false;
      el.send.disabled = false;
      scrollBottom();
    }).catch(function (err) {
      if (myToken !== state.token) return;
      wait.className = 'rs-msg err';
      wait.textContent = friendly(err);
      state.busy = false;
      el.send.disabled = false;
      scrollBottom();
    });
  }
  function friendly(err) {
    if (err.status === 401) return 'Key 无效或已过期（401）。点下方“设置 Key”检查。';
    if (err.status === 402) return 'DeepSeek 账户余额不足（402）。';
    if (err.status === 429) return '请求太频繁（429），等几秒再试。';
    if (err.status === 400) return '请求参数有误（400）：' + err.message;
    if (err.status) return '请求失败：' + err.message;
    return '连不上 api.deepseek.com。检查网络或代理；也可以先用不需要 Key 的术语表。';
  }
  function send() {
    if (state.busy) return;
    var text = el.input.value.trim();
    if (!text) return;
    if (!hasKey()) {
      state.pending = function () { el.input.value = text; el.input.focus(); };
      showKeyPanel('填 Key 后，再点一次发送。');
      return;
    }
    el.input.value = '';
    addMsg('user', text, true);
    state.thread.push({ role: 'user', content: text });
    callAI(text, { pushUser: false });
  }
  function deepen() {
    var g = state.currentTerm;
    if (!g) return;
    addMsg('sys', '围绕「' + g.zh + '」继续展开。');
    var prompt = '请把遥感术语「' + g.zh + '」（' + g.en + '）讲深一点：它解决什么问题、背后的机制或公式、一个具体的遥感例子、' +
      '最容易和哪个概念混淆，以及考试里可能怎么问。不要重复我已经看过的定义。';
    callAI(prompt, { pushUser: true });
  }

  /* ---------- page entry points ---------- */
  function discussPoint(btn) {
    var li = btn && btn.closest ? btn.closest('li') : null;
    var span = li ? $('span', li) : null;
    var text = span ? span.textContent.trim() : '';
    if (!text) return;
    discuss(text, { kicker: 'KNOWLEDGE POINT', title: '知识点 · 深聊' });
  }
  function discussHomework(n) {
    var hw = document.querySelector('#view .hw') || document.querySelector('.hw');
    var text = hw ? hw.innerText || hw.textContent : '';
    if (!text) {
      var c = window.ORBIT_CONTEXT || {};
      text = c.text || c.title || '';
    }
    discuss(text, {
      kicker: 'HOMEWORK / 串讲',
      title: '第 ' + n + ' 章作业 · 考点串讲',
      prompt: '请按考点串讲这份遥感作业：先列知识框架，再点出高频题和易错点，最后给 3 条复习建议。不要逐题翻译。'
    });
  }
  function discussQuestion() {
    var c = window.ORBIT_CONTEXT || {};
    var text = '题目：' + (c.question || '') + '\n选项：' + (c.options || []).join(' / ') + '\n答案：' + (c.answer || '');
    discuss(text, {
      kicker: 'QUESTION / 深聊',
      title: '这道题背后的知识点',
      prompt: '请围绕这道题讲背后的遥感知识点：正确答案为什么成立、其他选项错在哪、相关概念怎么区分、下次遇到同类题怎么判断。不要只报答案。'
    });
  }
  function ask(prompt) {
    openCard('ASK / 提问', short(prompt, 46), '继续追问…');
    if (!hasKey()) {
      state.pending = function () { callAI(prompt, { pushUser: true }); };
      showKeyPanel('填 Key 后自动继续。');
      return;
    }
    callAI(prompt, { pushUser: true });
  }
  function settings() {
    if (el.card.hidden) openCard('SETTINGS / 设置', 'DeepSeek Key', '继续追问…');
    showKeyPanel('');
  }

  /* ---------- glossary section ---------- */
  function renderGlossary() {
    var list = document.getElementById('glossaryList');
    if (!list) return;
    var chips = document.getElementById('glossaryChips');
    var search = document.getElementById('glossarySearch');
    var count = document.getElementById('glossaryCount');
    if (chips) {
      var html = '<button type="button" data-gch="all" class="on">全部</button>';
      CH.forEach(function (c) {
        html += '<button type="button" data-gch="' + c.id + '">' + c.num + '</button>';
      });
      chips.innerHTML = html;
      chips.addEventListener('click', function (e) {
        var b = e.target.closest('[data-gch]');
        if (!b) return;
        state.gCh = b.getAttribute('data-gch');
        filterGlossary(state.gCh);
      });
    }
    if (search) {
      var timer = null;
      search.addEventListener('input', function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
          state.gQ = search.value.trim();
          if (state.gQ) state.gCh = 'all';
          renderGList();
        }, 100);
      });
    }
    var random = document.getElementById('glossaryRandom');
    if (random) random.addEventListener('click', function () {
      if (!G.length) return;
      var g = G[Math.floor(Math.random() * G.length)];
      openTerm(g);
    });
    list.addEventListener('click', function (e) {
      var b = e.target.closest('[data-gi]');
      if (!b) return;
      var g = G[Number(b.getAttribute('data-gi'))];
      if (g) openTerm(g);
    });
    renderGList();
    if (count) count.textContent = G.length + ' 条 · 中英对照';
  }
  function renderGList() {
    var list = document.getElementById('glossaryList');
    if (!list) return;
    var q = state.gQ.toLowerCase();
    var items = [];
    G.forEach(function (g, i) {
      if (state.gCh !== 'all' && String(g.ch) !== String(state.gCh)) return;
      if (q && (g.zh + ' ' + g.en + ' ' + g.def + ' ' + g.zhDef).toLowerCase().indexOf(q) < 0) return;
      items.push({ g: g, i: i });
    });
    if (!items.length) {
      list.innerHTML = '<div class="rs-gempty">没有匹配的术语。换一个中文或英文关键词试试。</div>';
    } else {
      list.innerHTML = items.map(function (x) {
        return '<button type="button" class="rs-gterm" data-gi="' + x.i + '">' +
          '<span class="zh">' + esc(x.g.zh) + '</span>' +
          '<span class="en">' + esc(x.g.en) + '</span>' +
          '<span class="def">' + esc(x.g.def) + '</span>' +
          '<span class="ch">' + esc(String(x.g.ch).padStart(2, '0')) + '</span></button>';
      }).join('');
    }
    var count = document.getElementById('glossaryCount');
    if (count) count.textContent = items.length + ' / ' + G.length + ' 条';
    var chips = document.getElementById('glossaryChips');
    if (chips) {
      chips.querySelectorAll('[data-gch]').forEach(function (b) {
        b.classList.toggle('on', b.getAttribute('data-gch') === String(state.gCh));
      });
    }
  }
  function filterGlossary(ch) {
    state.gCh = ch == null ? 'all' : String(ch);
    renderGList();
  }
  function glossaryFor(ch) {
    if (!document.getElementById('glossary')) return;
    if (location.hash !== '#glossary') location.hash = '#glossary';
    setTimeout(function () {
      filterGlossary(ch);
      var s = document.getElementById('glossary');
      if (s) s.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  }
  function openTerm(g) {
    if (!g) return;
    showTerm(g, false);
  }

  /* ---------- bind ---------- */
  function bind() {
    el.sel.addEventListener('mousedown', function (e) { e.preventDefault(); });
    el.sel.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (!b) return;
      var act = b.getAttribute('data-act');
      var text = state.selection;
      if (act === 'x') { hideSel(); return; }
      if (act === 'translate') { hideSel(); translate(text); }
      if (act === 'ask') { hideSel(); discuss(text, { kicker: 'SELECTION / 问', title: '选中的内容' }); }
    });
    el.card.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (!b || !el.card.contains(b)) return;
      var act = b.getAttribute('data-act');
      if (act === 'close') closeCard();
      if (act === 'send') send();
      if (act === 'settings') settings();
      if (act === 'saveKey') saveKeyFromPanel();
      if (act === 'cancelKey') {
        state.pending = null;
        var p = $('[data-keypanel]', el.body);
        if (p) p.parentNode.removeChild(p);
      }
      if (act === 'deepen') deepen();
      if (act === 'askTerm') el.input.focus();
    });
    el.input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });
    document.addEventListener('mouseup', function (e) {
      if (insideUI(e.target)) return;
      setTimeout(checkSelection, 20);
    });
    document.addEventListener('touchend', function (e) {
      if (insideUI(e.target)) return;
      setTimeout(checkSelection, 180);
    }, { passive: true });
    document.addEventListener('selectionchange', function () {
      clearTimeout(selTimer);
      selTimer = setTimeout(function () {
        var s = window.getSelection ? window.getSelection() : null;
        if (s && !s.isCollapsed) checkSelection();
      }, 300);
    });
    document.addEventListener('mousedown', function (e) {
      if (!insideUI(e.target)) hideSel();
    });
    window.addEventListener('scroll', hideSel, { passive: true });
    window.addEventListener('resize', hideSel);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { hideSel(); if (!el.card.hidden) closeCard(); }
    });
  }

  function init() {
    build();
    bind();
    renderGlossary();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.RSAI = {
    ask: ask,
    discuss: discuss,
    discussPoint: discussPoint,
    discussHomework: discussHomework,
    discussQuestion: discussQuestion,
    settings: settings,
    glossaryFor: glossaryFor,
    filterGlossary: filterGlossary,
    openTerm: openTerm,
    translate: translate
  };
})();
