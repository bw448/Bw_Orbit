/* Orbit landing — small, restrained motion layer. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  var nav = document.getElementById('landNav');
  var system = document.getElementById('heroSystem');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function onScroll() {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 22);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(function (el, i) {
      el.style.transitionDelay = ((i % 3) * 0.07) + 's';
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  if (system && !reduce) {
    var raf = null, tx = 0, ty = 0;
    window.addEventListener('pointermove', function (e) {
      tx = (e.clientX / window.innerWidth - 0.5) * 18;
      ty = (e.clientY / window.innerHeight - 0.5) * 14;
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = null;
        system.style.setProperty('--px', tx.toFixed(2) + 'px');
        system.style.setProperty('--py', ty.toFixed(2) + 'px');
      });
    }, { passive: true });
  }
})();
