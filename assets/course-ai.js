/* Orbit course AI — a small, quiet "ask AI" panel for course modules. */
(function () {
  'use strict';
  var KEY = 'orbit-ai-config';
  var subjectEl = document.querySelector('[data-ai-subject]');
  var subject = subjectEl ? subjectEl.getAttribute('data-ai-subject') : (document.title.split('·')[0] || '课程');
  var state = { messages: [], busy: false, context: '' };

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function md(s) {
    return esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }
  function loadConfig() {
    try {
      var c = JSON.parse(localStorage.getItem(KEY) || '{}');
      return { key: c.key || '', model: c.model || 'deepseek-chat' };
    } catch (e) { return { key: '', model: 'deepseek-chat' }; }
  }
  function saveConfig(c) {
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {}
  }

  var fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'cai-fab';
  fab.textContent = '问 AI';
  fab.setAttribute('aria-label', '打开 AI 问答');

  var panel = document.createElement('aside');
  panel.className = 'cai-panel';
  panel.hidden = true;
  panel.innerHTML =
    '<div class="cai-head"><div><b>问 AI</b><span>' + esc(subject) + '</span></div><button type="button" class="cai-close" aria-label="关闭">×</button></div>' +
    '<div class="cai-context" hidden></div>' +
    '<div class="cai-log" aria-live="polite"></div>' +
    '<form class="cai-form"><textarea rows="2" placeholder="输入不懂的知识点，例如：实事求是和群众路线怎么区分？"></textarea><button type="submit">发送</button></form>' +
    '<div class="cai-foot"><button type="button" class="cai-key">API Key</button><button type="button" class="cai-clear">清空</button><span>DeepSeek</span></div>' +
    '<div class="cai-keybox" hidden><input type="password" placeholder="sk-..." autocomplete="off"><button type="button">保存</button><p>只存本机 localStorage，请求直接发往 api.deepseek.com。</p></div>';

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  var log = panel.querySelector('.cai-log');
  var form = panel.querySelector('.cai-form');
  var input = panel.querySelector('textarea');
  var contextEl = panel.querySelector('.cai-context');
  var keybox = panel.querySelector('.cai-keybox');
  var keyInput = keybox.querySelector('input');

  function render() {
    if (!state.messages.length) {
      log.innerHTML = '<p class="cai-empty">不懂的概念、句子、选项，直接问。回答会尽量短，先给结论再分点。</p>';
      return;
    }
    log.innerHTML = state.messages.map(function (m) {
      return '<div class="cai-msg ' + m.role + '"><div class="cai-role">' + (m.role === 'user' ? '你' : 'AI') + '</div><div class="cai-text">' + md(m.content) + '</div></div>';
    }).join('');
    log.scrollTop = log.scrollHeight;
  }

  function setContext(text) {
    state.context = text || '';
    if (text) {
      contextEl.hidden = false;
      contextEl.innerHTML = '<b>当前内容</b>' + esc(text.slice(0, 160));
    } else {
      contextEl.hidden = true;
      contextEl.innerHTML = '';
    }
  }

  function open(text) {
    panel.hidden = false;
    fab.hidden = true;
    setContext(text || state.context);
    input.focus();
  }
  function close() {
    panel.hidden = true;
    fab.hidden = false;
  }

  fab.addEventListener('click', function () { open(''); });
  panel.querySelector('.cai-close').addEventListener('click', close);
  panel.querySelector('.cai-clear').addEventListener('click', function () {
    state.messages = [];
    render();
  });
  panel.querySelector('.cai-key').addEventListener('click', function () {
    keybox.hidden = !keybox.hidden;
    if (!keybox.hidden) keyInput.focus();
  });
  keybox.querySelector('button').addEventListener('click', function () {
    var c = loadConfig();
    c.key = keyInput.value.trim();
    saveConfig(c);
    keybox.hidden = true;
    input.focus();
  });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (state.busy) return;
    var q = input.value.trim();
    if (!q) return;
    var cfg = loadConfig();
    if (!cfg.key) {
      keybox.hidden = false;
      keyInput.focus();
      return;
    }
    state.messages.push({ role: 'user', content: q });
    input.value = '';
    render();
    state.busy = true;
    panel.classList.add('busy');
    var sys = '你是《' + subject + '》课程助教。用简洁中文回答，先给结论，再分 2—4 点解释；优先用课程术语；不确定就说明。';
    if (state.context) sys += '\n当前页面内容：' + state.context;
    var msgs = [{ role: 'system', content: sys }].concat(state.messages.slice(-8));
    log.insertAdjacentHTML('beforeend', '<div class="cai-msg assistant cai-pending"><div class="cai-role">AI</div><div class="cai-text">思考中…</div></div>');
    log.scrollTop = log.scrollHeight;

    fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.key },
      body: JSON.stringify({ model: cfg.model || 'deepseek-chat', messages: msgs, temperature: 0.3, max_tokens: 800 })
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (data) {
      var text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '没有返回内容。';
      state.messages.push({ role: 'assistant', content: text.trim() });
    }).catch(function (err) {
      state.messages.push({ role: 'assistant', content: '连不上 api.deepseek.com（' + err.message + '）。检查网络/代理，Key 是否正确；本地请用 start.bat 打开。' });
    }).then(function () {
      state.busy = false;
      panel.classList.remove('busy');
      render();
    });
  });

  // section-level "问 AI" buttons
  document.querySelectorAll('.course-section h2').forEach(function (h2) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cai-inline';
    btn.textContent = '问 AI';
    btn.addEventListener('click', function () {
      open(h2.textContent.trim().replace(/\s+/g, ' '));
    });
    h2.insertAdjacentElement('afterend', btn);
  });

  // select text -> small "问 AI" bubble
  var bubble = document.createElement('button');
  bubble.type = 'button';
  bubble.className = 'cai-sel';
  bubble.textContent = '问 AI';
  bubble.hidden = true;
  document.body.appendChild(bubble);
  var selected = '';
  document.addEventListener('mouseup', function (e) {
    if (e.target.closest('.cai-panel') || e.target.closest('.cai-fab')) return;
    setTimeout(function () {
      var sel = window.getSelection();
      var text = sel ? sel.toString().trim() : '';
      if (!text || text.length < 3 || text.length > 300) { bubble.hidden = true; return; }
      selected = text;
      var rect = sel.getRangeAt(0).getBoundingClientRect();
      bubble.style.left = Math.min(window.innerWidth - 80, Math.max(8, rect.left + rect.width / 2 - 30)) + 'px';
      bubble.style.top = Math.min(window.innerHeight - 44, rect.bottom + 8) + 'px';
      bubble.hidden = false;
    }, 10);
  });
  document.addEventListener('mousedown', function (e) {
    if (!e.target.closest('.cai-sel')) bubble.hidden = true;
  });
  bubble.addEventListener('click', function () {
    bubble.hidden = true;
    open(selected);
    input.value = '请解释这个知识点：' + selected;
    input.focus();
  });

  render();
})();
