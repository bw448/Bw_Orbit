/* Orbit e-books — library cards + a small PDF.js reader. */
(function () {
  'use strict';
  var books = Array.isArray(window.ORBIT_EBOOKS) ? window.ORBIT_EBOOKS : [];
  var grid = document.getElementById('bookGrid');
  var reader = document.getElementById('reader');
  var canvas = document.getElementById('pdfCanvas');
  var stage = document.getElementById('readerStage');
  var titleEl = document.getElementById('readerTitle');
  var pageLabel = document.getElementById('pageLabel');
  var progress = document.getElementById('readerProgress');
  var loading = document.getElementById('readerLoading');
  var download = document.getElementById('downloadBook');
  var prev = document.getElementById('prevPage');
  var next = document.getElementById('nextPage');
  var zoomOut = document.getElementById('zoomOut');
  var zoomIn = document.getElementById('zoomIn');
  var closeBtn = document.getElementById('closeReader');
  var previewNote = document.getElementById('readerPreviewNote');
  var readFull = document.getElementById('readFullBook');

  var pdf = null, pageNum = 1, zoom = 1, book = null, renderTask = null, loadToken = 0, touchX = 0, previewMode = false;

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function renderCards() {
    if (!grid) return;
    if (!books.length) {
      grid.innerHTML = '<p class="book-empty">书库正在装订，稍后再来。</p>';
      return;
    }
    grid.innerHTML = books.map(function (b) {
      return '<button type="button" class="book-card" data-book="' + esc(b.id) + '" aria-label="阅读 ' + esc(b.title) + '">' +
        '<span class="book-cover"><img src="' + esc(b.cover) + '" alt="' + esc(b.title) + ' 封面" loading="lazy"></span>' +
        '<span class="book-body"><span class="book-subject">' + esc(b.subject) + '</span>' +
        '<span class="book-title">' + esc(b.title) + '</span>' +
        '<span class="book-author">' + esc(b.author) + '</span>' +
        '<span class="book-meta"><span>试读 ' + (b.previewPages || 24) + ' 页 · 共 ' + b.pages + ' 页</span><span>' + esc(b.size) + '</span></span>' +
        '<span class="book-open">开始阅读 <span>↗</span></span></span></button>';
    }).join('');
  }

  function setLoading(on, text) {
    if (!loading) return;
    loading.hidden = !on;
    var label = loading.querySelector('span');
    if (label && text) label.textContent = text;
  }

  function updateControls() {
    var total = pdf ? pdf.numPages : 0;
    if (pageLabel) pageLabel.textContent = total ? (pageNum + ' / ' + total) : '— / —';
    if (progress) progress.style.width = total ? (pageNum / total * 100) + '%' : '0%';
    if (prev) prev.disabled = !pdf || pageNum <= 1;
    if (next) next.disabled = !pdf || pageNum >= total;
  }

  function clearCanvas() {
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = 1; canvas.height = 1;
    canvas.style.width = ''; canvas.style.height = '';
  }

  function renderPage() {
    if (!pdf) return;
    if (renderTask) { try { renderTask.cancel(); } catch (e) {} renderTask = null; }
    var myToken = loadToken;
    setLoading(true, '正在渲染第 ' + pageNum + ' 页…');
    pdf.getPage(pageNum).then(function (page) {
      if (myToken !== loadToken) return;
      var base = page.getViewport({ scale: 1 });
      var availW = Math.max(240, stage.clientWidth - 26);
      var availH = Math.max(240, stage.clientHeight - 26);
      var fit = window.innerWidth <= 640 ? availW / base.width : Math.min(availW / base.width, availH / base.height);
      var scale = Math.max(0.25, fit * zoom);
      var vp = page.getViewport({ scale: scale });
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(vp.width * dpr);
      canvas.height = Math.floor(vp.height * dpr);
      canvas.style.width = vp.width + 'px';
      canvas.style.height = vp.height + 'px';
      var ctx = canvas.getContext('2d');
      renderTask = page.render({ canvasContext: ctx, viewport: vp, transform: [dpr, 0, 0, dpr, 0, 0] });
      return renderTask.promise.then(function () {
        if (myToken !== loadToken) return;
        setLoading(false);
        stage.scrollTop = 0;
        updateControls();
      });
    }).catch(function (err) {
      if (err && err.name === 'RenderingCancelledException') return;
      setLoading(false);
      showError('这一页没有渲染出来，可以直接下载 PDF 阅读。');
    });
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
    if (pdf) { try { pdf.destroy(); } catch (e) {} pdf = null; }
    clearCanvas();
    reader.hidden = false;
    document.body.classList.add('reader-open');
    previewMode = !!(book.preview && book.preview !== book.file);
    titleEl.textContent = book.title + (previewMode ? ' · 试读' : '');
    download.href = book.file;
    download.setAttribute('download', book.file.split('/').pop());
    if (previewNote) {
      previewNote.hidden = !previewMode;
      previewNote.textContent = previewMode ? '试读前 ' + (book.previewPages || 24) + ' 页' : '';
    }
    if (readFull) {
      readFull.hidden = !previewMode;
      readFull.href = book.file;
    }
    updateControls();
    if (!window.pdfjsLib) {
      showError('PDF 组件没有加载，请直接下载文件阅读。');
      return;
    }
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/pdfjs/pdf.worker.min.js';
    var src = previewMode ? book.preview : book.file;
    setLoading(true, previewMode ? '正在打开试读…' : '正在打开 PDF…');
    var token = loadToken;
    var task = window.pdfjsLib.getDocument(src);
    task.onProgress = function (p) {
      if (token !== loadToken || !p || !p.total) return;
      var pct = Math.round(p.loaded / p.total * 100);
      setLoading(true, (previewMode ? '正在打开试读… ' : '正在打开 PDF… ') + pct + '%');
    };
    task.promise.then(function (doc) {
      if (token !== loadToken) { doc.destroy(); return; }
      pdf = doc;
      updateControls();
      renderPage();
    }).catch(function () {
      if (token !== loadToken) return;
      showError(previewMode ? '试读没有打开，可能是网络中断；可以点“下载”保存完整版后阅读。' : 'PDF 没有打开，可能是文件较大或网络中断；可以点“下载”保存后阅读。');
    });
  }

  function closeReader() {
    loadToken++;
    reader.hidden = true;
    document.body.classList.remove('reader-open');
    if (pdf) { try { pdf.destroy(); } catch (e) {} pdf = null; }
    clearCanvas();
    book = null;
    if (location.hash && location.hash.indexOf('#read-') === 0) history.replaceState(null, '', '#library');
  }

  function go(delta) {
    if (!pdf) return;
    var target = pageNum + delta;
    if (target < 1 || target > pdf.numPages) return;
    pageNum = target;
    renderPage();
  }

  function setZoom(delta) {
    zoom = Math.max(0.6, Math.min(3, zoom + delta));
    renderPage();
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
    if (pdf && reader && !reader.hidden) renderPage();
  });

  renderCards();
  if (location.hash && location.hash.indexOf('#read-') === 0) {
    openBook(location.hash.slice(6));
  }
})();
