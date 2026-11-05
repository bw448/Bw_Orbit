/* Orbit · BW有话说 — public timeline (posts + likes only). */
(function () {
  'use strict';
  var C = window.CLOUDBASE_CONFIG || {};
  var list = document.getElementById('bwPosts');
  var countEl = document.getElementById('bwCount');
  var visitorKey = 'orbit-bw-visitor';
  var likedKey = 'orbit-bw-liked';
  var liked = new Set(loadLiked());
  var counts = {};
  var posts = [];
  var visitor = getVisitor();

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function getVisitor() {
    try {
      var v = localStorage.getItem(visitorKey);
      if (!v) {
        v = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : ('v-' + Date.now() + '-' + Math.random().toString(36).slice(2));
        localStorage.setItem(visitorKey, v);
      }
      return v;
    } catch (e) { return 'v-' + Date.now() + '-' + Math.random().toString(36).slice(2); }
  }
  function loadLiked() {
    try { var a = JSON.parse(localStorage.getItem(likedKey) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; }
  }
  function saveLiked() { try { localStorage.setItem(likedKey, JSON.stringify([].slice.call(liked))); } catch (e) {} }
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
  function safeLink(url) {
    try { var u = new URL(url); return (u.protocol === 'http:' || u.protocol === 'https:') ? u : null; } catch (e) { return null; }
  }
  function dateLabel(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '';
    var p = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '.' + p(d.getMonth() + 1) + '.' + p(d.getDate());
  }
  function heartSVG() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8z"/></svg>';
  }
  function render() {
    if (!list) return;
    if (!posts.length) {
      list.innerHTML = '<div class="bw-empty">还没有内容。等 BW 想说话的时候，就会出现在这里。</div>';
      if (countEl) countEl.textContent = '0 条';
      return;
    }
    list.innerHTML = posts.map(function (p, i) {
      var media = '';
      if (p.media_url && p.media_type === 'image') {
        media = '<figure class="bw-media"><img src="' + esc(p.media_url) + '" alt="' + esc(p.title || 'BW 的图片') + '" loading="lazy"></figure>';
      } else if (p.media_url && p.media_type === 'video') {
        media = '<figure class="bw-media"><video src="' + esc(p.media_url) + '" controls playsinline preload="metadata"></video></figure>';
      }
      var link = safeLink(p.link_url);
      var linkHTML = link ? '<a class="bw-link-card" href="' + esc(link.href) + '" target="_blank" rel="noopener"><span>' + esc(link.href) + '</span><b>打开链接 ↗</b></a>' : '';
      var isLiked = liked.has(p.id);
      return '<article class="bw-post" data-post="' + esc(p.id) + '">' +
        '<div class="bw-post-meta"><span class="date">' + dateLabel(p.created_at) + '</span><span>NO. ' + String(posts.length - i).padStart(2, '0') + '</span></div>' +
        (p.title ? '<h3>' + esc(p.title) + '</h3>' : '') +
        (p.body ? '<div class="bw-post-body">' + esc(p.body) + '</div>' : '') +
        media + linkHTML +
        '<div class="bw-post-foot"><button type="button" class="bw-like' + (isLiked ? ' liked' : '') + '" data-like="' + esc(p.id) + '" aria-pressed="' + isLiked + '" aria-label="点赞">' +
        heartSVG() + '<span data-count>' + (counts[p.id] || 0) + '</span></button></div></article>';
    }).join('');
    if (countEl) countEl.textContent = posts.length + ' 条';
  }
  function load() {
    if (!C.url || !C.key) {
      list.innerHTML = '<div class="bw-error"><b>BW有话说还没有连接。</b><br>请在 assets/cloudbase-config.js 填入 CloudBase 网关地址和 publishable key。</div>';
      return;
    }
    Promise.all([
      api('/posts?select=id,created_at,title,body,media_url,media_type,link_url&published=eq.true&order=created_at.desc').then(function (r) {
        if (!r.ok) throw new Error('posts ' + r.status);
        return r.json();
      }),
      api('/rpc/like_counts', { method: 'POST', body: '{}' }).then(function (r) {
        if (!r.ok) return [];
        return r.json();
      }).catch(function () { return []; })
    ]).then(function (res) {
      posts = Array.isArray(res[0]) ? res[0] : [];
      counts = {};
      (Array.isArray(res[1]) ? res[1] : []).forEach(function (x) { counts[x.post_id] = Number(x.likes) || 0; });
      render();
    }).catch(function () {
      list.innerHTML = '<div class="bw-error"><b>内容暂时没有打开。</b><br>可能是网络或 CloudBase 表还没有建好；稍后再试。</div>';
    });
  }
  if (list) {
    list.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-like]');
      if (!btn) return;
      var id = btn.getAttribute('data-like');
      if (btn.disabled) return;
      btn.disabled = true;
      api('/rpc/toggle_like', {
        method: 'POST',
        body: JSON.stringify({ p_post: id, p_visitor: visitor })
      }).then(function (r) {
        if (!r.ok) throw new Error('like ' + r.status);
        return r.json();
      }).then(function (nowLiked) {
        if (nowLiked) { liked.add(id); counts[id] = (counts[id] || 0) + 1; }
        else { liked.delete(id); counts[id] = Math.max(0, (counts[id] || 0) - 1); }
        saveLiked();
        btn.classList.toggle('liked', !!nowLiked);
        btn.setAttribute('aria-pressed', !!nowLiked);
        var c = btn.querySelector('[data-count]');
        if (c) c.textContent = counts[id] || 0;
        btn.disabled = false;
      }).catch(function () {
        btn.disabled = false;
        btn.title = '点赞没有成功，稍后再试';
      });
    });
  }
  load();
})();
