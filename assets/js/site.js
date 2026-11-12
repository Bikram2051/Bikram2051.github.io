(function () {
  'use strict';
  var root = document.documentElement;

  // Light and dark: follow the system until the visitor chooses
  var toggle = document.querySelector('[data-theme-toggle]');
  var media = window.matchMedia('(prefers-color-scheme: dark)');
  function current() {
    return root.getAttribute('data-theme') || (media.matches ? 'dark' : 'light');
  }
  function label() {
    if (!toggle) return;
    var dark = current() === 'dark';
    toggle.textContent = dark ? 'Light' : 'Dark';
    toggle.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  }
  if (toggle) {
    toggle.hidden = false;
    label();
    toggle.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      label();
      document.dispatchEvent(new CustomEvent('themechange'));
    });
    if (media.addEventListener) media.addEventListener('change', label);
  }

  // Start a figure's one-time animation when it scrolls into view
  var waiting = document.querySelectorAll('[data-reveal]');
  function start(el) {
    el.classList.remove('is-waiting');
    el.classList.add('is-live');
  }
  if ('IntersectionObserver' in window && waiting.length) {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { start(entry.target); seen.unobserve(entry.target); }
      });
    }, { threshold: 0.35 });
    waiting.forEach(function (el) { el.classList.add('is-waiting'); seen.observe(el); });
  } else {
    waiting.forEach(start);
  }

  // Looping diagrams only run while they are on screen
  var loops = document.querySelectorAll('[data-loop]');
  if ('IntersectionObserver' in window && loops.length) {
    var onScreen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { entry.target.classList.toggle('is-live', entry.isIntersecting); });
    }, { threshold: 0.4 });
    loops.forEach(function (el) { onScreen.observe(el); });
  }

  // Copy link on articles
  var copy = document.querySelector('[data-copy]');
  if (copy && navigator.clipboard) {
    copy.hidden = false;
    copy.addEventListener('click', function () {
      navigator.clipboard.writeText(copy.getAttribute('data-copy')).then(function () {
        copy.textContent = 'Link copied';
        setTimeout(function () { copy.textContent = 'Copy link'; }, 2000);
      });
    });
  }
})();
