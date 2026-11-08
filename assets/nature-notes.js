/* Orbit · 自然地理手写稿文字版：目录与阅读辅助 */
(function () {
  'use strict';
  var doc = document.querySelector('.nn-doc');
  var toc = document.getElementById('nnToc');
  if (!doc || !toc) return;

  var parts = [].slice.call(doc.querySelectorAll('h1'));
  toc.innerHTML = parts.map(function (h, i) {
    if (!h.id) h.id = 'nn-part-' + i;
    return '<a href="#' + h.id + '">' + h.textContent.trim() + '</a>';
  }).join('');

  // 让打印时不留下目录空块
  if (!parts.length) {
    var wrap = toc.closest('.nn-toc');
    if (wrap) wrap.hidden = true;
  }
})();
