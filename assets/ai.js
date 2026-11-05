/* Orbit AI assistant — one DeepSeek key, integrated into study flow */
(function () {
  var KEY = 'orbit-ai-config';
  var DEFAULT = { provider: 'deepseek', model: 'deepseek-chat', key: '' };
  var state = { messages: [], busy: false, el: {} };
  var CHAT_KEY = 'orbit-ai-chat';
  var lastSelection = '';
  function loadChat(){ try { var a = JSON.parse(localStorage.getItem(CHAT_KEY) || '[]'); return Array.isArray(a) ? a : []; } catch(e){ return []; } }
  function saveChat(){ try { localStorage.setItem(CHAT_KEY, JSON.stringify(state.messages.slice(-12))); } catch(e){} }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return Object.assign({}, DEFAULT);
      var c = JSON.parse(raw);
      return { provider: 'deepseek', model: c.model || DEFAULT.model, key: c.key || '' };
    } catch (e) { return Object.assign({}, DEFAULT); }
  }
  function save(cfg) { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) {} }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function md(s) {
    var text = esc(s || '');
    var codes = [];
    text = text.replace(/```([\s\S]*?)```/g, function (_, code) {
      codes.push(code.replace(/^\n+|\n+$/g, ''));
      return '@@CODE' + (codes.length - 1) + '@@';
    });
    text = text.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    text = text.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/^###\s+(.+)$/gm, '<h4>$1</h4>');
    text = text.replace(/^##\s+(.+)$/gm, '<h4>$1</h4>');
    text = text.replace(/^\s*[-*]\s+(.+)$/gm, '• $1');
    text = text.replace(/\n/g, '<br>');
    text = text.replace(/@@CODE(\d+)@@/g, function (_, i) {
      return '<pre><code>' + codes[Number(i)] + '</code></pre>';
    });
    return text;
  }

  function build() {
    var fab = document.createElement('button');
    fab.className = 'ai-fab';
    fab.type = 'button';
    fab.textContent = 'AI';
    fab.setAttribute('aria-label', '打开 AI 助教');

    var panel = document.createElement('div');
    panel.className = 'ai-panel';
    panel.hidden = true;
    panel.innerHTML =
      '<div class="ai-head"><div><b>AI 助教</b> <span class="st">DeepSeek</span></div>' +
      '<div><button type="button" data-act="settings">设置</button> <button type="button" data-act="close">关闭</button></div></div>' +
      '<div class="ai-chips"><button type="button" data-act="hint">提示</button><button type="button" data-act="explain">讲解</button><button type="button" data-act="variant">变式题</button><button type="button" data-act="select">选中解释</button><button type="button" data-act="wrong">错题分析</button><button type="button" data-act="plan">今日计划</button></div>' +
      '<div class="ai-msgs"></div>' +
      '<div class="ai-input"><textarea placeholder="问概念、问题目，或让 AI 解释当前题…"></textarea><button type="button" data-act="send">发送</button></div>';

    var settings = document.createElement('div');
    settings.className = 'ai-settings';
    settings.hidden = true;
    settings.innerHTML =
      '<div class="ai-card"><h2>AI 设置</h2>' +
      '<p>全站共用一个 Key，默认 DeepSeek。只填 Key 即可，模型保持 deepseek-chat。</p>' +
      '<label>DeepSeek API Key</label><input type="password" id="aiKey" placeholder="sk-..." autocomplete="off">' +
      '<label>模型（可选）</label><input type="text" id="aiModel" value="deepseek-chat">' +
      '<div class="row"><button type="button" class="primary" data-act="save">保存</button>' +
      '<button type="button" data-act="test">测试连接</button>' +
      '<button type="button" data-act="clear">清除 Key</button>' +
      '<button type="button" data-act="closeSettings">关闭</button></div>' +
      '<div class="ai-status" id="aiStatus"></div>' +
      '<div class="note">Key 只存在本机 localStorage，不会上传到本系统之外的服务器；AI 请求直接发往 api.deepseek.com。若用 file:// 打开，建议运行 start.bat 用本地服务器访问。</div></div>';

    document.body.appendChild(fab);
    document.body.appendChild(panel);
    document.body.appendChild(settings);
    state.el = { fab: fab, panel: panel, settings: settings, msgs: $('.ai-msgs', panel), input: $('textarea', panel), send: $('[data-act="send"]', panel), status: $('#aiStatus', settings) };
    state.messages = loadChat();
    state.messages.slice(-6).forEach(function(m){ add(m.role, m.content, m.role === 'assistant'); });
  }

  function add(role, text, html) {
    var d = document.createElement('div');
    d.className = 'ai-msg ' + role;
    if (html) d.innerHTML = md(text);
    else d.textContent = text;
    state.el.msgs.appendChild(d);
    state.el.msgs.scrollTop = state.el.msgs.scrollHeight;
    return d;
  }
  function sys(text) { add('sys', text); }

  function open() {
    state.el.panel.hidden = false;
    state.el.settings.hidden = true;
    if (!state.el.msgs.childElementCount) {
      sys('全站共用一个 DeepSeek Key。点“设置”填入 Key 后即可提问。');
      sys('刷题时会自动带入当前题目；也可以直接用上方“提示 / 讲解 / 变式题 / 错题分析 / 今日计划”。');
    }
    var cfg = load();
    if (!cfg.key) openSettings();
    setTimeout(function () { state.el.input.focus(); }, 50);
  }
  function close() { state.el.panel.hidden = true; }

  function openSettings() {
    var cfg = load();
    $('#aiKey', state.el.settings).value = cfg.key || '';
    $('#aiModel', state.el.settings).value = cfg.model || DEFAULT.model;
    state.el.status.textContent = '';
    state.el.status.className = 'ai-status';
    state.el.settings.hidden = false;
    setTimeout(function () { $('#aiKey', state.el.settings).focus(); }, 50);
  }
  function closeSettings() { state.el.settings.hidden = true; }

  function api(messages, maxTokens) {
    var cfg = load();
    if (!cfg.key) return Promise.reject(new Error('NO_KEY'));
    return fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.key },
      body: JSON.stringify({
        model: cfg.model || DEFAULT.model,
        messages: messages,
        temperature: 0.4,
        max_tokens: maxTokens || 1200,
        stream: false
      })
    }).then(function (res) {
      if (!res.ok) {
        return res.text().then(function (body) {
          var extra = '';
          try { var j = JSON.parse(body); extra = (j.error && j.error.message) || ''; } catch (e) {}
          var err = new Error('HTTP_' + res.status + ' ' + (extra || body.slice(0, 180)));
          err.status = res.status;
          throw err;
        });
      }
      return res.json();
    }).then(function (j) {
      return ((j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '').trim();
    });
  }

  function friendly(err) {
    if (err.message === 'NO_KEY') return '还没有填 Key。点“设置”填入 DeepSeek Key。';
    if (err.status === 401) return 'Key 无效或已过期（401）。请到“设置”里检查。';
    if (err.status === 402) return 'DeepSeek 账户余额不足（402）。';
    if (err.status === 429) return '请求太频繁（429），等几秒再试。';
    if (err.status === 400) return '请求参数有误（400）：' + err.message;
    if (err.status) return '请求失败：' + err.message;
    return '连不上 api.deepseek.com。若用 file:// 打开，请运行 start.bat 用本地服务器访问；并检查网络/代理。';
  }

  function contextText() {
    var c = window.ORBIT_CONTEXT;
    if (!c) return '';
    try { return '\n\n当前学习上下文（JSON）：\n' + JSON.stringify(c).slice(0, 6000); } catch (e) { return ''; }
  }

  function send() {
    if (state.busy) return;
    var text = state.el.input.value.trim();
    if (!text) return;
    var cfg = load();
    if (!cfg.key) { openSettings(); return; }
    state.el.input.value = '';
    add('user', text);
    state.messages.push({ role: 'user', content: text }); saveChat();
    var wait = add('assistant', '思考中…');
    state.busy = true; state.el.send.disabled = true;
    var system = '你是 Orbit 地信复习系统的 AI 助教，服务对象是地理信息科学本科生。回答准确、简洁、按考点组织；遥感优先依据《遥感导论》（梅安新等），Python 依据课程题库。代码题先给结论再解释关键行；简答题给答题要点。不要编造教材页码。' + contextText();
    var messages = [{ role: 'system', content: system }].concat(state.messages.slice(-8));
    api(messages).then(function (answer) {
      wait.innerHTML = md(answer || '（没有返回内容）');
      state.messages.push({ role: 'assistant', content: answer || '' }); saveChat();
    }).catch(function (err) {
      wait.textContent = friendly(err);
      wait.className = 'ai-msg sys';
    }).finally(function () {
      state.busy = false; state.el.send.disabled = false;
      state.el.msgs.scrollTop = state.el.msgs.scrollHeight;
    });
  }

  function ask(prompt) { open(); state.el.input.value = prompt; send(); }

  function hint() {
    ask('请只给我一个提示，不要直接说出正确答案。提示要指向关键概念或排除一个错误选项，最多两句话。');
  }
  function explainQuestion() {
    ask('请解释当前这道题：先给正确答案，再逐项说明为什么对/错，最后给一个记忆点。');
  }
  function variant() {
    ask('请基于当前题目，生成一道同考点的变式题（选择题，4 个选项），先不要给答案；我作答后你再讲解。');
  }
  function gradeShort(text) {
    if (!text || !text.trim()) { open(); sys('先在简答题输入框里写下你的答案，再点“AI 批改”。'); return; }
    ask('请批改我的简答题。我的答案如下：\n' + text + '\n请按参考答案给出：得分（0—100）、两个优点、两个缺口、一句改进后的答题示范。');
  }
  function gradeShortFromBox() {
    var box = document.getElementById('shortBox');
    gradeShort(box ? box.value : '');
  }
  function selectText() {
    var t = String(window.getSelection ? window.getSelection() : '').trim() || lastSelection;
    if (!t) { open(); sys('先在页面上选中一段文字，再点“选中解释”。'); return; }
    ask('请解释这段内容（必要时结合当前题目上下文），先给一句结论，再分点讲清楚：\n' + t.slice(0, 1200));
  }
  function homeworkBrief() {
    ask('请按考点串讲这一章作业：先列知识框架，再点出高频题和易错点，最后给 3 条复习建议。不要逐题翻译。');
  }
  function analyzeWrong() {
    ask('请分析当前错题：按知识点归类，指出我最薄弱的 2—3 个点，并给一个 30 分钟内可执行的补漏顺序。');
  }
  function report() {
    ask('请根据当前进度生成一份简短学习报告：一句话总结、最稳的两块、最弱的两块、下一步先做什么。');
  }
  function plan() {
    ask('请根据当前进度给我今天 30 分钟的复习计划：先做什么、做多少题、怎么检查是否掌握。');
  }

  function bind() {
    document.addEventListener('selectionchange', function () {
      var sel = window.getSelection ? window.getSelection() : null;
      var t = sel ? String(sel).trim() : '';
      if (t && t.length <= 1600) lastSelection = t;
    });
    state.el.fab.addEventListener('click', function () { state.el.panel.hidden ? open() : close(); });
    state.el.panel.addEventListener('click', function (e) {
      var act = e.target.getAttribute('data-act');
      if (act === 'close') close();
      if (act === 'settings') openSettings();
      if (act === 'send') send();
      if (act === 'hint') hint();
      if (act === 'explain') explainQuestion();
      if (act === 'variant') variant();
      if (act === 'select') selectText();
      if (act === 'wrong') analyzeWrong();
      if (act === 'plan') plan();
    });
    state.el.input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });
    state.el.settings.addEventListener('click', function (e) {
      var act = e.target.getAttribute('data-act');
      if (act === 'closeSettings' || e.target === state.el.settings) closeSettings();
      if (act === 'save') {
        var cfg = load();
        cfg.key = $('#aiKey', state.el.settings).value.trim();
        cfg.model = $('#aiModel', state.el.settings).value.trim() || DEFAULT.model;
        save(cfg);
        state.el.status.textContent = cfg.key ? '已保存。全站共用这个 Key。' : '已保存，但 Key 为空。';
        state.el.status.className = 'ai-status ok';
      }
      if (act === 'clear') {
        var cfg = load(); cfg.key = ''; save(cfg);
        $('#aiKey', state.el.settings).value = '';
        state.el.status.textContent = '已清除本机 Key。';
        state.el.status.className = 'ai-status bad';
      }
      if (act === 'test') {
        var key = $('#aiKey', state.el.settings).value.trim();
        var model = $('#aiModel', state.el.settings).value.trim() || DEFAULT.model;
        if (!key) { state.el.status.textContent = '先填 Key。'; state.el.status.className = 'ai-status bad'; return; }
        state.el.status.textContent = '测试中…'; state.el.status.className = 'ai-status';
        fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
          body: JSON.stringify({ model: model, messages: [{ role: 'user', content: '只回复 OK' }], max_tokens: 8 })
        }).then(function (res) {
          if (!res.ok) throw { status: res.status };
          state.el.status.textContent = '连接成功，Key 可用。';
          state.el.status.className = 'ai-status ok';
        }).catch(function (err) {
          state.el.status.textContent = friendly(err);
          state.el.status.className = 'ai-status bad';
        });
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    build(); bind();
  });

  window.ORBIT_AI = {
    open: open, close: close, ask: ask, explain: explainQuestion,
    hint: hint, variant: variant, gradeShort: gradeShort, gradeShortFromBox: gradeShortFromBox,
    homeworkBrief: homeworkBrief, selectText: selectText, analyzeWrong: analyzeWrong,
    report: report, plan: plan, openSettings: openSettings
  };
})();
