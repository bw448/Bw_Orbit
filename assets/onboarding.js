/* Orbit — one-time first-visit guide on the homepage. */
(function () {
  'use strict';
  var KEY = 'orbit.guide.welcome.v1';
  var box = document.getElementById('welcome');
  if (!box) return;

  function seen() {
    try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; }
  }
  function remember() {
    try { localStorage.setItem(KEY, '1'); } catch (e) {}
  }

  var lastFocus = null;
  var card = box.querySelector('.welcome-card');
  var focusables = [];

  function collect() {
    focusables = Array.prototype.slice.call(card.querySelectorAll('a[href],button:not([disabled])'));
  }
  function close() {
    if (box.hidden) return;
    box.hidden = true;
    document.documentElement.style.overflow = '';
    remember();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function open() {
    if (!box.hidden) return;
    lastFocus = document.activeElement;
    box.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    collect();
    card.focus();
  }

  box.addEventListener('click', function (e) {
    if (e.target.closest('[data-welcome-close]')) {
      remember();
      if (!e.target.closest('a')) {
        e.preventDefault();
        close();
      } else {
        // Let the link navigate; just remember the choice.
        box.hidden = true;
        document.documentElement.style.overflow = '';
      }
    }
  });
  document.addEventListener('keydown', function (e) {
    if (box.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab' || !focusables.length) return;
    var i = focusables.indexOf(document.activeElement);
    if (e.shiftKey) {
      if (i <= 0) { e.preventDefault(); focusables[focusables.length - 1].focus(); }
    } else if (i === focusables.length - 1) {
      e.preventDefault(); focusables[0].focus();
    }
  });

  if (seen()) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) setTimeout(open, 200);
  else setTimeout(open, 700);
})();
