/* Orbit guide — highlight the section you're reading. */
(function () {
  'use strict';
  var links = Array.prototype.slice.call(document.querySelectorAll('.guide-toc a[href^="#"]'));
  if (!links.length || !('IntersectionObserver' in window)) return;
  var map = {};
  var sections = [];
  links.forEach(function (a) {
    var id = a.getAttribute('href').slice(1);
    var sec = document.getElementById(id);
    if (sec) { map[id] = a; sections.push(sec); }
  });
  if (!sections.length) return;
  var current = '';
  function setOn(id) {
    if (id === current) return;
    current = id;
    links.forEach(function (a) {
      var on = a.getAttribute('href') === '#' + id;
      a.classList.toggle('on', on);
      if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) setOn(e.target.id);
    });
  }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
  sections.forEach(function (s) { io.observe(s); });
  window.addEventListener('scroll', function () {
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 6) {
      setOn(sections[sections.length - 1].id);
    }
  }, { passive: true });
  // Keep the address bar clean when using the in-page nav.
  links.forEach(function (a) {
    a.addEventListener('click', function (e) {
      var sec = document.getElementById(a.getAttribute('href').slice(1));
      if (!sec) return;
      e.preventDefault();
      sec.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', a.getAttribute('href'));
      setOn(sec.id);
    });
  });
})();
