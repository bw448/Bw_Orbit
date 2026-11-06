/* Orbit e-books — library cards + fast page-image reader with part downloads. */
(function () {
  'use strict';
  var books = Array.isArray(window.ORBIT_EBOOKS) ? window.ORBIT_EBOOKS : [];
  var grid = document.getElementById('bookGrid');
  var reader = document.getElementById('reader');
  var stage = document.getElementById('readerStage');
  var pageImg = document.getElementById('pageImage');
  var coverImg = document.getElementById('readerCover');
  var titleEl = document.getElementById('readerTitle');
  var pageLabel = document.getElementById('pageLabel');
  var progress = document.getElementById('readerProgress');
  var loading = document.getElementById('readerLoading');
  var download = document.getElementById('downloadBook');
  var downloadPart = document.getElementById('downloadPart');
  var readFull = document.getElementById('readFullBook');
  var previewNote = document.getElementById('readerPreviewNote');
  var prev = document.getElementById('prevPage');
  var next = document.getElementById('nextPage');
  var zoomOut = document.getElementById('zoomOut');
  var zoomIn = document.getElementById('zoomIn');
  var closeBtn = document.getElementById('closeReader');

  var pageNum = 1, zoom = 1, book = null, loadToken = 0, touchX = 0;

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function pad(n) { return String(n).padStart(3, '0'); }

  function renderCards() {
    if (!grid) return;
    if (!books.length) {
      grid.innerHTML = '<p class="book-empty">书库正在装订，稍后再来。</p>';
      return;
    }
    grid.innerHTML = books.map(function (b) {
      var parts = b.parts ? ' · ' + b.parts + ' 卷' : '';
      return '<button type="button" class="book-card" data-book="' + esc(b.id) + '" aria-label="阅读 ' + esc(b.title) + '">' +
        '<span class="book-cover"><img src="' + esc(b.cover) + '" alt="' + esc(b.title) + ' 封面" loading="lazy"></span>' +
        '<span class="book-body"><span class="book-subject">' + esc(b.subject) + '</span>' +
        '<span class="book-title">' + esc(b.title) + '</span>' +
        '<span class="book-author">' + esc(b.author) + '</span>' +
        '<span class="book-meta"><span>全页阅读 · ' + b.pages + ' 页' + parts + '</span><span>' + esc(b.webSize || b.size) + ' 压缩版</span></span>' +
        '<span class="book-open">开始阅读 <span>↗</span></span></span></button>';
    }).join('');
  }

  function setLoading(on, text) {
    if (!loading) return;
    loading.hidden = !on;
    var label = loading.querySelector('span');
    if (label && text) label.textContent = text;
  }

  function totalPages() { return book ? book.pages : 0; }

  function updateControls() {
    var total = totalPages();
    if (pageLabel) pageLabel.textContent = total ? (pageNum + ' / ' + total) : '— / —';
    if (progress) progress.style.width = total ? (pageNum / total * 100) + '%' : '0%';
    if (prev) prev.disabled = !total || pageNum <= 1;
    if (next) next.disabled = !total || pageNum >= total;
    if (downloadPart && book) {
      var per = book.partPages || 50;
      var part = Math.floor((pageNum - 1) / per) + 1;
      var start = (part - 1) * per + 1;
      var end = Math.min(total, part * per);
      downloadPart.href = book.partsDir + 'part-' + String(part).padStart(2, '0') + '.pdf';
      downloadPart.setAttribute('download', 'part-' + String(part).padStart(2, '0') + '.pdf');
      downloadPart.textContent = '下载本部分（' + start + '—' + end + ' 页）';
      downloadPart.hidden = false;
    }
  }

  function pageSrc(n) {
    return book.pagesDir + pad(n) + '.jpg';
  }

  function prefetch(n) {
    if (!book || n < 1 || n > totalPages()) return;
    var im = new Image();
    im.src = pageSrc(n);
  }

  function renderPage() {
    if (!book || !pageImg) return;
    var myToken = loadToken;
    setLoading(true, '正在加载第 ' + pageNum + ' 页…');
    pageImg.onload = function () {
      if (myToken !== loadToken) return;
      if (coverImg) coverImg.hidden = true;
      setLoading(false);
      stage.scrollTop = 0;
      updateControls();
      prefetch(pageNum + 1);
      prefetch(pageNum + 2);
    };
    pageImg.onerror = function () {
      if (myToken !== loadToken) return;
      setLoading(false);
      showError('这一页没有加载出来。可以下载本部分或完整版 PDF 阅读。');
    };
    pageImg.style.width = Math.round(Math.max(240, stage.clientWidth - 26) * zoom) + 'px';
    pageImg.src = pageSrc(pageNum);
    pageImg.alt = (book.title || '') + ' 第 ' + pageNum + ' 页';
  }

  function showError(text) {
    if (!loading) return;
    loading.hidden = false;
    loading.innerHTML = '<span>' + esc(text) + '</span>';
  }

  function openBook(id) {
    book = books.filter(function (b) { return b.id === id; })[0];
    if (!book) return;
    loadToken++;
    pageNum = 1; zoom = 1;
    reader.hidden = false;
    document.body.classList.add('reader-open');
    titleEl.textContent = book.title;
    var dl = book.webFile || book.file;
    download.href = dl;
    download.setAttribute('download', dl.split('/').pop());
    if (readFull) { readFull.hidden = false; readFull.href = book.webFile || book.file; }
    if (previewNote) {
      previewNote.hidden = false;
      previewNote.textContent = '全页阅读 · ' + book.pages + ' 页';
    }
    if (coverImg) {
      coverImg.src = book.cover;
      coverImg.hidden = false;
    }
    if (pageImg) {
      pageImg.removeAttribute('src');
      pageImg.style.width = '';
      pageImg.hidden = false;
    }
    updateControls();
    renderPage();
  }

  function closeReader() {
    loadToken++;
    reader.hidden = true;
    document.body.classList.remove('reader-open');
    if (pageImg) { pageImg.removeAttribute('src'); pageImg.style.width = ''; }
    if (coverImg) coverImg.hidden = true;
    book = null;
    if (location.hash && location.hash.indexOf('#read-') === 0) history.replaceState(null, '', '#library');
  }

  function go(delta) {
    if (!book) return;
    var target = pageNum + delta;
    if (target < 1 || target > totalPages()) return;
    pageNum = target;
    renderPage();
  }

  function setZoom(delta) {
    if (!book || !pageImg) return;
    zoom = Math.max(0.6, Math.min(3, zoom + delta));
    pageImg.style.width = Math.round(Math.max(240, stage.clientWidth - 26) * zoom) + 'px';
  }

  if (grid) {
    grid.addEventListener('click', function (e) {
      var card = e.target.closest('[data-book]');
      if (card) openBook(card.getAttribute('data-book'));
    });
  }
  if (closeBtn) closeBtn.addEventListener('click', closeReader);
  if (prev) prev.addEventListener('click', function () { go(-1); });
  if (next) next.addEventListener('click', function () { go(1); });
  if (zoomOut) zoomOut.addEventListener('click', function () { setZoom(-0.15); });
  if (zoomIn) zoomIn.addEventListener('click', function () { setZoom(0.15); });
  if (stage) {
    stage.addEventListener('touchstart', function (e) {
      touchX = e.changedTouches[0].clientX;
    }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 55) go(dx > 0 ? -1 : 1);
    }, { passive: true });
  }
  document.addEventListener('keydown', function (e) {
    if (!reader || reader.hidden) return;
    if (e.key === 'Escape') closeReader();
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  });
  window.addEventListener('resize', function () {
    if (book && reader && !reader.hidden && pageImg) {
      pageImg.style.width = Math.round(Math.max(240, stage.clientWidth - 26) * zoom) + 'px';
    }
  });

  renderCards();
  if (location.hash && location.hash.indexOf('#read-') === 0) {
    openBook(location.hash.slice(6));
  }
})();
