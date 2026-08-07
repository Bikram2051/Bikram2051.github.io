/* Small progressive enhancements. The site reads fine without them. */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var nav = document.querySelector('.nav');
  if (nav) {
    var mark = function () { nav.classList.toggle('stuck', window.scrollY > 6); };
    window.addEventListener('scroll', mark, { passive: true });
    mark();
  }

  document.documentElement.classList.add('js-reveal');

  var targets = document.querySelectorAll('.reveal, .signature');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(function (el) { io.observe(el); });
  } else {
    targets.forEach(function (el) { el.classList.add('visible'); });
  }
})();
