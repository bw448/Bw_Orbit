/* Orbit · BW有话说 — CloudBase PostgreSQL admin (password → RPC). */
(function () {
  'use strict';
  var C = window.CLOUDBASE_CONFIG || {};
  var PASS_KEY = 'orbit-bw-admin-pass';
  var password = '';
  var loginBox = document.getElementById('loginBox');
  var appBox = document.getElementById('appBox');
  var loginForm = document.getElementById('loginForm');
  var postForm = document.getElementById('postForm');
  var loginStatus = document.getElementById('loginStatus');
  var postStatus = document.getElementById('postStatus');
  var adminList = document.getElementById('adminList');
  var adminStatus = document.getElementById('adminStatus');
  var mediaInput = document.getElementById('media');
  var fileHint = document.getElementById('fileHint');
  var who = document.getElementById('who');

  try { password = sessionStorage.getItem(PASS_KEY) || ''; } catch (e) {}

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function api(path, opts) {
    opts = opts || {};
    var headers = Object.assign({ Authorization: 'Bearer ' + C.key, 'Content-Type': 'application/json' }, opts.headers || {});
    return fetch(C.url + (C.rest || '/v1/rdb/rest') + path, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body,
      cache: 'no-store'
    });
  }
  function rpc(name, data) {
    return api('/rpc/' + name, { method: 'POST', body: JSON.stringify(data || {}) }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok) {
          var msg = (j && (j.message || j.details || j.hint)) || ('请求失败 ' + r.status);
          throw new Error(msg);
        }
        return j;
      });
    });
  }
  function setStatus(el, text, kind) {
    if (!el) return;
    el.textContent = text || '';
    el.className = 'bw-status' + (kind ? ' ' + kind : '');
  }
  function logout() {
    password = '';
    try { sessionStorage.removeItem(PASS_KEY); } catch (e) {}
    if (appBox) appBox.hidden = true;
    if (loginBox) loginBox.hidden = false;
    setStatus(loginStatus, '');
  }
  function enterApp() {
    if (loginBox) loginBox.hidden = true;
    if (appBox) appBox.hidden = false;
    if (who) who.textContent = '管理员模式';
    loadPosts();
  }
  function checkPassword(p) {
    return rpc('bw_admin_check', { p_password: p }).then(function (v) { return v === true || v === 'true'; });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var p = document.getElementById('password').value;
      if (!p) return;
      setStatus(loginStatus, '验证中…');
      checkPassword(p).then(function (ok) {
        if (!ok) throw new Error('密码不对');
        password = p;
        try { sessionStorage.setItem(PASS_KEY, p); } catch (e) {}
        setStatus(loginStatus, '');
        enterApp();
      }).catch(function (err) {
        setStatus(loginStatus, err.message || '登录失败，先确认 SQL 是否已运行', 'bad');
      });
    });
  }

  if (mediaInput) {
    mediaInput.addEventListener('change', function () {
      var f = mediaInput.files && mediaInput.files[0];
      if (!f) { fileHint.textContent = '图片会自动压缩；视频请用上面的链接'; return; }
      fileHint.textContent = f.name + ' · ' + (f.size / 1024 / 1024).toFixed(1) + ' MB · 会压缩后保存';
    });
  }

  function loadPosts() {
    if (!adminList) return;
    adminList.innerHTML = '<div class="bw-loading" style="padding:20px"><i></i><span>正在读取…</span></div>';
    api('/posts?select=id,created_at,title,body,media_url,media_type,link_url&order=created_at.desc').then(function (r) {
      if (!r.ok) throw new Error('读取失败 ' + r.status);
      return r.json();
    }).then(function (rows) {
      if (!rows.length) {
        adminList.innerHTML = '<div class="bw-empty" style="padding:20px">还没有帖子。写下第一条。</div>';
        return;
      }
      adminList.innerHTML = rows.map(function (p) {
        return '<div class="bw-admin-row" data-id="' + esc(p.id) + '"><div><b>' + esc(p.title || '(无标题)') + '</b><small>' + esc((p.body || '').slice(0, 100)) + '</small><small>' + esc(p.created_at || '') + '</small></div>' +
          '<div class="actions"><button class="bw-btn danger" type="button" data-del="' + esc(p.id) + '">删除</button></div></div>';
      }).join('');
    }).catch(function (err) {
      adminList.innerHTML = '<div class="bw-error" style="padding:20px">' + esc(err.message || '读取失败') + '</div>';
    });
  }

  if (adminList) {
    adminList.addEventListener('click', function (e) {
      var b = e.target.closest('[data-del]');
      if (!b) return;
      if (b.getAttribute('data-armed') !== '1') {
        adminList.querySelectorAll('[data-del]').forEach(function (x) {
          x.removeAttribute('data-armed');
          x.textContent = '删除';
        });
        b.setAttribute('data-armed', '1');
        b.textContent = '再点一次确认';
        setTimeout(function () {
          if (b.getAttribute('data-armed') === '1') {
            b.removeAttribute('data-armed');
            b.textContent = '删除';
          }
        }, 4000);
        return;
      }
      var id = b.getAttribute('data-del');
      b.disabled = true;
      b.textContent = '删除中…';
      setStatus(adminStatus, '');
      rpc('bw_admin_delete', { p_password: password, p_id: id }).then(function (deleted) {
        if (deleted === false) {
          setStatus(adminStatus, '没有找到这条帖子，可能已经删除。', 'bad');
          b.disabled = false; b.removeAttribute('data-armed'); b.textContent = '删除';
          return;
        }
        setStatus(adminStatus, '已删除。', 'ok');
        loadPosts();
      }).catch(function (err) {
        b.disabled = false; b.removeAttribute('data-armed'); b.textContent = '删除';
        setStatus(adminStatus, err.message || '删除失败', 'bad');
      });
    });
  }

  function compressImage(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var max = 1400;
        var scale = Math.min(1, max / Math.max(img.width, img.height));
        var canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        var q = 0.82;
        var data = canvas.toDataURL('image/jpeg', q);
        while (data.length > 950000 && q > 0.45) {
          q -= 0.1;
          data = canvas.toDataURL('image/jpeg', q);
        }
        if (data.length > 1200000) reject(new Error('图片压缩后仍然太大，换一张小一点的'));
        else resolve(data);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('图片读取失败')); };
      img.src = url;
    });
  }

  function safeUrl(value) {
    try { var u = new URL(value); return (u.protocol === 'http:' || u.protocol === 'https:') ? u.href : ''; } catch (e) { return ''; }
  }

  if (postForm) {
    postForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var title = document.getElementById('title').value.trim();
      var body = document.getElementById('body').value.trim();
      var link = document.getElementById('link').value.trim();
      var video = document.getElementById('videoUrl').value.trim();
      var file = mediaInput && mediaInput.files ? mediaInput.files[0] : null;
      if (!title && !body && !link && !video && !file) {
        setStatus(postStatus, '至少写一点内容、选一张图或填一个链接。', 'bad');
        return;
      }
      if (link && !safeUrl(link)) { setStatus(postStatus, '普通链接要以 http:// 或 https:// 开头。', 'bad'); return; }
      if (video && !safeUrl(video)) { setStatus(postStatus, '视频链接要以 http:// 或 https:// 开头。', 'bad'); return; }
      var btn = document.getElementById('publish');
      btn.disabled = true;
      setStatus(postStatus, '准备发布…');
      var mediaPromise = file ? compressImage(file).then(function (data) {
        return { url: data, type: 'image' };
      }) : Promise.resolve(video ? { url: video, type: 'video' } : null);
      mediaPromise.then(function (media) {
        setStatus(postStatus, '发布中…');
        return rpc('bw_admin_create', {
          p_password: password,
          p_title: title,
          p_body: body,
          p_media_url: media ? media.url : null,
          p_media_type: media ? media.type : null,
          p_link_url: link || null
        });
      }).then(function () {
        postForm.reset();
        if (fileHint) fileHint.textContent = '图片会自动压缩；视频请用上面的链接';
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

  if (password) {
    checkPassword(password).then(function (ok) {
      if (ok) enterApp(); else logout();
    }).catch(function () { logout(); });
  } else if (loginBox) {
    loginBox.hidden = false;
  }
})();
