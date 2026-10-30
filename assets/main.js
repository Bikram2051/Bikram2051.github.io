/* Small progressive enhancements. The site reads fine without them. */
(function () {
  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* Light and dark theme. The script in <head> has already applied the saved
     or system theme before first paint, so this only handles changes. */
  var toggle = document.querySelector('.theme-toggle');
  var systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  var saved = function () { try { return localStorage.getItem('theme'); } catch (e) { return null; } };
  var apply = function (theme) {
    root.setAttribute('data-theme', theme);
    var next = theme === 'dark' ? 'light' : 'dark';
    if (toggle) {
      toggle.setAttribute('aria-label', 'Switch to ' + next + ' theme');
      toggle.setAttribute('title', 'Switch to ' + next + ' theme');
    }
    var colour = theme === 'dark' ? '#100E0B' : '#E6E1D5';
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) { m.setAttribute('content', colour); });
  };
  apply(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var theme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      apply(theme);
      try { localStorage.setItem('theme', theme); } catch (e) { /* private mode: still switches */ }
    });
  }
  var followSystem = function (e) { if (!saved()) apply(e.matches ? 'dark' : 'light'); };
  if (systemDark.addEventListener) systemDark.addEventListener('change', followSystem);
  else if (systemDark.addListener) systemDark.addListener(followSystem);

  var nav = document.querySelector('.nav');
  if (nav) {
    var mark = function () { nav.classList.toggle('stuck', window.scrollY > 6); };
    window.addEventListener('scroll', mark, { passive: true });
    mark();
  }

  /* Reveal on scroll. The signature is clipped until it is "written", and an
     element clipped to nothing never registers as intersecting, so it is
     revealed through its unclipped parent (.sign-off) instead. */
  var show = function (el) {
    el.classList.add('visible');
    el.querySelectorAll('.signature').forEach(function (s) { s.classList.add('visible'); });
  };
  var targets = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        show(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(function (el) { io.observe(el); });
  } else {
    targets.forEach(show);
  }
  /* A signature outside any revealed block is shown straight away. */
  document.querySelectorAll('.signature').forEach(function (s) {
    if (!s.closest('.reveal')) s.classList.add('visible');
  });
})();
