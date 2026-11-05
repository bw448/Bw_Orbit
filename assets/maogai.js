/* Orbit Maoism module — choice bank mount. */
(function () {
  'use strict';
  var B = window.MAOGAI_BANK;
  if (!B || !B.items || !window.OrbitQuiz) return;
  var mount = document.getElementById('mgQuiz');
  if (!mount) return;

  var items = B.items.map(function (x) {
    var y = {};
    for (var k in x) if (Object.prototype.hasOwnProperty.call(x, k)) y[k] = x[k];
    y.chapter = (x.source ? x.source + ' · ' : '') + (x.chapter || '未分章');
    return y;
  });

  var total = document.getElementById('mgTotal');
  if (total) total.textContent = items.length;
  var primary = document.getElementById('mgPrimary');
  if (primary) primary.textContent = items.length;

  window.OrbitQuiz.mount(mount, { id: 'maogai', items: items, perPage: 12 });
})();
