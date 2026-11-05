/* Orbit · BW有话说 — admin (Supabase Auth + posts + storage). */
(function () {
  'use strict';
  var C = window.SUPABASE_CONFIG || {};
  var TOKEN_KEY = 'orbit-bw-admin-token';
  var EMAIL_KEY = 'orbit-bw-admin-email';
  var token = '';
  var email = '';
  var loginBox = document.getElementById('loginBox');
  var appBox = document.getElementById('appBox');
  var loginForm = document.getElementById('loginForm');
  var postForm = document.getElementById('postForm');
  var loginStatus = document.getElementById('loginStatus');
  var postStatus = document.getElementById('postStatus');
  var adminList = document.getElementById('adminList');
  var mediaInput = document.getElementById('media');
  var fileHint = document.getElementById('fileHint');

  try { token = sessionStorage.getItem(TOKEN_KEY) || ''; email = sessionStorage.getItem(EMAIL_KEY) || ''; } catch (e) {}

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function api(path, opts) {
    opts = opts || {};
    var headers = Object.assign({ apikey: C.key }, opts.headers || {});
    if (token) headers.Authorization = 'Bearer ' + token;
    if (opts.json) headers['Content-Type'] = 'application/json';
    return fetch(C.url + path, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body,
      cache: 'no-store'
    });
  }
  function setStatus(el, text, kind) {
    if (!el) return;
    el.textContent = text || '';
    el.className = 'bw-status' + (kind ? ' ' + kind : '');
  }
  function logout() {
    token = ''; email = '';
    try { sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(EMAIL_KEY); } catch (e) {}
    if (appBox) appBox.hidden = true;
    if (loginBox) loginBox.hidden = false;
  }
  function enterApp() {
    if (loginBox) loginBox.hidden = true;
    if (appBox) appBox.hidden = false;
    var who = document.getElementById('who');
    if (who) who.textContent = email ? ('已登录 · ' + email) : '已登录';
    loadPosts();
  }
  function authHeaders(json) { return json ? { 'Content-Type': 'application/json' } : {}; }

  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var em = document.getElementById('email').value.trim();
      var pw = document.getElementById('password').value;
      if (!em || !pw) return;
      setStatus(loginStatus, '登录中…');
      fetch(C.url + '/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: { apikey: C.key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: em, password: pw })
      }).then(function (r) {
        return r.json().then(function (j) {
          if (!r.ok) throw new Error(j.error_description || j.msg || j.message || ('登录失败 ' + r.status));
          return j;
        });
      }).then(function (j) {
        token = j.access_token;
        email = (j.user && j.user.email) || em;
        try { sessionStorage.setItem(TOKEN_KEY, token); sessionStorage.setItem(EMAIL_KEY, email); } catch (e) {}
        setStatus(loginStatus, '');
        enterApp();
      }).catch(function (err) {
        setStatus(loginStatus, err.message || '登录失败，检查邮箱和密码', 'bad');
      });
    });
  }

  if (mediaInput) {
    mediaInput.addEventListener('change', function () {
      var f = mediaInput.files && mediaInput.files[0];
      if (!f) { fileHint.textContent = '图片或视频，最大 50MB'; return; }
      fileHint.textContent = f.name + ' · ' + (f.size / 1024 / 1024).toFixed(1) + ' MB';
    });
  }

  function loadPosts() {
    if (!adminList) return;
    adminList.innerHTML = '<div class="bw-loading"><i></i><span>正在读取…</span></div>';
    api('/rest/v1/posts?select=id,created_at,title,body,media_url,media_type,link_url&order=created_at.desc').then(function (r) {
      if (r.status === 401) { logout(); throw new Error('登录已过期，请重新登录'); }
      if (!r.ok) throw new Error('读取失败 ' + r.status);
      return r.json();
    }).then(function (rows) {
      if (!rows.length) {
        adminList.innerHTML = '<div class="bw-empty" style="padding:20px">还没有帖子。写下第一条。</div>';
        return;
      }
      adminList.innerHTML = rows.map(function (p) {
        return '<div class="bw-admin-row" data-id="' + esc(p.id) + '"><div><b>' + esc(p.title || '(无标题)') + '</b><small>' + esc((p.body || '').slice(0, 100)) + '</small><small>' + esc(p.created_at || '') + '</small></div>' +
          '<div class="actions"><button class="bw-btn danger" type="button" data-del="' + esc(p.id) + '" data-media="' + esc(p.media_url || '') + '">删除</button></div></div>';
      }).join('');
    }).catch(function (err) {
      adminList.innerHTML = '<div class="bw-error" style="padding:20px">' + esc(err.message || '读取失败') + '</div>';
    });
  }

  if (adminList) {
    adminList.addEventListener('click', function (e) {
      var b = e.target.closest('[data-del]');
      if (!b) return;
      var id = b.getAttribute('data-del');
      if (!confirm('确定删除这条帖子？')) return;
      b.disabled = true;
      var media = b.getAttribute('data-media') || '';
      var delMedia = Promise.resolve();
      if (media.indexOf('/object/public/bw-talk/') >= 0) {
        var path = media.split('/object/public/bw-talk/')[1];
        delMedia = api('/storage/v1/object/bw-talk/' + path, { method: 'DELETE' }).catch(function () {});
      }
      delMedia.then(function () {
        return api('/rest/v1/posts?id=eq.' + encodeURIComponent(id), { method: 'DELETE' });
      }).then(function (r) {
        if (!r.ok) throw new Error('删除失败 ' + r.status);
        loadPosts();
      }).catch(function (err) {
        b.disabled = false;
        alert(err.message || '删除失败');
      });
    });
  }

  if (postForm) {
    postForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var title = document.getElementById('title').value.trim();
      var body = document.getElementById('body').value.trim();
      var link = document.getElementById('link').value.trim();
      var file = mediaInput && mediaInput.files ? mediaInput.files[0] : null;
      if (!title && !body && !link && !file) { setStatus(postStatus, '至少写一点内容或选一个文件。', 'bad'); return; }
      if (link) {
        try { var u = new URL(link); if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error(); } catch (err) {
          setStatus(postStatus, '链接要以 http:// 或 https:// 开头。', 'bad'); return;
        }
      }
      if (file && file.size > 50 * 1024 * 1024) { setStatus(postStatus, '文件超过 50MB，请压缩或换成链接。', 'bad'); return; }
      var btn = document.getElementById('publish');
      btn.disabled = true;
      setStatus(postStatus, '准备发布…');
      var mediaPromise = Promise.resolve(null);
      if (file) {
        var ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
        var path = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;
        setStatus(postStatus, '上传媒体…');
        mediaPromise = api('/storage/v1/object/bw-talk/' + encodeURIComponent(path), {
          method: 'POST',
          headers: { 'Content-Type': file.type || 'application/octet-stream', 'x-upsert': 'false' },
          body: file
        }).then(function (r) {
          if (!r.ok) throw new Error('上传失败 ' + r.status);
          return { url: C.url + '/storage/v1/object/public/bw-talk/' + encodeURIComponent(path), type: file.type.indexOf('video/') === 0 ? 'video' : 'image' };
        });
      }
      mediaPromise.then(function (media) {
        setStatus(postStatus, '发布中…');
        var payload = {
          title: title || null,
          body: body,
          link_url: link || null,
          media_url: media ? media.url : null,
          media_type: media ? media.type : null,
          published: true
        };
        return api('/rest/v1/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
          body: JSON.stringify(payload)
        });
      }).then(function (r) {
        if (r.status === 401) { logout(); throw new Error('登录已过期，请重新登录'); }
        if (!r.ok) throw new Error('发布失败 ' + r.status);
        postForm.reset();
        if (fileHint) fileHint.textContent = '图片或视频，最大 50MB';
        setStatus(postStatus, '已发布。', 'ok');
        loadPosts();
      }).catch(function (err) {
        setStatus(postStatus, err.message || '发布失败', 'bad');
      }).finally(function () {
        btn.disabled = false;
      });
    });
  }

  var logoutBtn = document.getElementById('logout');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);
  if (token) enterApp(); else if (loginBox) loginBox.hidden = false;
})();
