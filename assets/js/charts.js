/* Small SVG chart helpers: a dot-and-interval plot and a line chart.
   No dependencies. Charts redraw to the width of their container. */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function node(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) if (attrs[k] !== undefined) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function text(parent, x, y, str, cls, anchor) {
    var t = node('text', { x: x, y: y, 'text-anchor': anchor || 'start', 'class': cls || undefined }, parent);
    t.textContent = str;
    return t;
  }
  function scale(type, d0, d1, r0, r1) {
    if (type === 'log') {
      var a = Math.log(d0), b = Math.log(d1);
      return function (v) { return r0 + (Math.log(v) - a) / (b - a) * (r1 - r0); };
    }
    return function (v) { return r0 + (v - d0) / (d1 - d0) * (r1 - r0); };
  }
  function tween(ms, step) {
    if (still || !ms) { step(1); return; }
    var t0 = null;
    function frame(now) {
      if (t0 === null) t0 = now;
      var t = Math.min(1, (now - t0) / ms);
      step(1 - Math.pow(1 - t, 3));
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  function whenSeen(el, run) {
    if (!('IntersectionObserver' in window)) { run(); return; }
    var done = false;
    function once() { if (done) return; done = true; io.disconnect(); run(); }
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (entry) { return entry.isIntersecting; })) once();
    }, { threshold: 0.15 });
    io.observe(el);
    window.addEventListener('beforeprint', once);
  }
  function onWidthChange(el, run) {
    if (!('ResizeObserver' in window)) return;
    var last = el.clientWidth, timer;
    new ResizeObserver(function () {
      if (el.clientWidth === last) return;
      last = el.clientWidth;
      clearTimeout(timer);
      timer = setTimeout(run, 120);
    }).observe(el);
  }

  /* One tooltip per chart. Content is set with textContent only. */
  function tooltip(el) {
    var tip = document.createElement('div');
    tip.className = 'tip';
    tip.hidden = true;
    tip.setAttribute('role', 'status');
    el.appendChild(tip);
    return {
      show: function (x, y, title, lines, place) {
        tip.textContent = '';
        var b = document.createElement('b');
        b.textContent = title;
        tip.appendChild(b);
        (lines || []).forEach(function (line) {
          var row = document.createElement('span');
          if (typeof line === 'string') {
            row.textContent = line;
          } else {
            row.className = 'tip__row';
            var key = document.createElement('i');
            key.style.background = line.color;
            if (line.dot) { key.style.width = '0.5rem'; key.style.height = '0.5rem'; key.style.borderRadius = '50%'; }
            var name = document.createElement('em');
            name.textContent = line.name;
            var val = document.createElement('b');
            val.style.display = 'inline';
            val.textContent = line.value;
            row.appendChild(key); row.appendChild(name); row.appendChild(val);
          }
          tip.appendChild(row);
        });
        tip.hidden = false;
        var half = tip.offsetWidth / 2, W = el.clientWidth;
        if (place) {
          var spot = place(tip.offsetWidth, tip.offsetHeight, W);
          x = spot.left; y = spot.top;
        }
        var left = Math.max(half, Math.min(W - half, x));
        tip.style.left = left + 'px';
        tip.style.top = Math.max(tip.offsetHeight + 12, y) + 'px';
      },
      hide: function () { tip.hidden = true; }
    };
  }

  /* Dot plot with optional intervals. Rows: {label, kind: head|ref|est|muted, value, lo, hi} */
  function dotPlot(el, cfg) {
    var played = false, tip;

    function render(animate) {
      el.textContent = '';
      tip = tooltip(el);
      var rows = cfg.rows;
      var W = el.clientWidth || 640;
      var showValues = W >= 620 && cfg.valueColumn !== false;
      var labelW = Math.min(cfg.labelWidth || 210, Math.round(W * 0.46));
      var valW = showValues ? (cfg.valueWidth || 150) : 0;
      var x0 = labelW + 10, x1 = W - valW - 12;
      var rowH = cfg.rowHeight || 26, top = 6;
      var bottom = top + rows.length * rowH;
      var H = bottom + (cfg.axisTitle ? 46 : 26);
      var svg = node('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': cfg.label, tabindex: 0 }, el);
      var sx = scale(cfg.scale || 'linear', cfg.domain[0], cfg.domain[1], x0, x1);
      var xr = sx(cfg.ref);

      var lastRight = -Infinity;
      cfg.ticks.forEach(function (v) {
        node('line', { 'class': v === cfg.ref ? 'ref' : 'grid', x1: sx(v), x2: sx(v), y1: top, y2: bottom }, svg);
        var label = cfg.tickFormat ? cfg.tickFormat(v) : String(v);
        var half = label.length * 3.6 + 5;
        if (sx(v) - half < lastRight) return;
        lastRight = sx(v) + half;
        text(svg, sx(v), bottom + 17, label, '', 'middle');
      });
      if (cfg.refNotTick) node('line', { 'class': 'ref', x1: xr, x2: xr, y1: top, y2: bottom }, svg);
      if (cfg.axisTitle) text(svg, (x0 + x1) / 2, H - 4, cfg.axisTitle, '', 'middle');

      var marks = [];
      rows.forEach(function (r, i) {
        var cy = top + i * rowH + rowH / 2;
        var g = node('g', { 'class': r.kind === 'muted' ? 'is-quiet' : (r.kind === 'ref' ? 'is-ref' : undefined) }, svg);
        if (r.kind === 'head') { text(g, 0, cy + 5, r.label, 't-strong'); return; }
        var hover = node('rect', { 'class': 'row-hover', x: 0, y: cy - rowH / 2 + 1, width: W, height: rowH - 2, rx: 3, opacity: 0 }, g);
        text(g, cfg.indent === false ? 0 : 12, cy + 4.5, r.label + (r.kind === 'muted' ? ' *' : ''), 't-ink');
        var value = r.kind === 'ref' ? cfg.ref : r.value;
        var whisker = r.lo !== undefined && r.kind !== 'ref' ? node('line', { 'class': 'whisker', y1: cy, y2: cy }, g) : null;
        var dot = node('circle', { 'class': 'mark', cy: cy, r: 5 }, g);
        if (showValues && r.kind !== 'ref') text(g, W, cy + 4.5, cfg.valueFormat(r), '', 'end');
        var hit = node('rect', { 'class': 'hit', x: 0, y: cy - rowH / 2, width: W, height: rowH }, g);
        var m = { r: r, cy: cy, value: value, whisker: whisker, dot: dot, hover: hover, x: xr };
        hit.addEventListener('pointerenter', function () { focusRow(marks.indexOf(m)); });
        hit.addEventListener('pointerleave', function () { focusRow(-1); });
        marks.push(m);
      });

      function draw(t) {
        marks.forEach(function (m) {
          m.x = xr + (sx(m.value) - xr) * t;
          m.dot.setAttribute('cx', m.x);
          if (m.whisker) {
            m.whisker.setAttribute('x1', xr + (sx(Math.max(m.r.lo, cfg.domain[0])) - xr) * t);
            m.whisker.setAttribute('x2', xr + (sx(Math.min(m.r.hi, cfg.domain[1])) - xr) * t);
          }
        });
      }

      var active = -1;
      function focusRow(i) {
        if (active > -1 && marks[active]) marks[active].hover.setAttribute('opacity', 0);
        active = i;
        if (i < 0 || !marks[i]) { tip.hide(); return; }
        var m = marks[i];
        m.hover.setAttribute('opacity', 1);
        var title = m.r.kind === 'ref' ? 'Reference group' : cfg.valueFormat(m.r);
        var lines = [m.r.label];
        if (m.r.kind === 'muted' && cfg.mutedNote) lines.push(cfg.mutedNote);
        tip.show(Math.max(m.x, x0), m.cy - 4, title, lines);
      }
      svg.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          var next = active + (e.key === 'ArrowDown' ? 1 : -1);
          focusRow(Math.max(0, Math.min(marks.length - 1, next)));
        } else if (e.key === 'Escape') { focusRow(-1); }
      });
      svg.addEventListener('focus', function () { if (svg.matches(':focus-visible')) focusRow(Math.max(0, active)); });
      svg.addEventListener('blur', function () { focusRow(-1); });

      if (animate) { draw(0); tween(1100, draw); } else { draw(1); }
    }

    render(false);
    el.querySelector('svg').style.visibility = 'hidden';
    whenSeen(el, function () { played = true; render(true); });
    onWidthChange(el, function () { if (played) render(false); });
  }

  /* Line chart. Series: {name, key: '1'|'2'|'q', type: 'line'|'dots', points: [[x, y]], at: function(x)} */
  function lineChart(el, cfg) {
    var played = false, tip;
    var colors = { '1': 'var(--series-1)', '2': 'var(--series-2)', 'q': 'var(--mark-quiet)' };

    function render(animate) {
      el.textContent = '';
      tip = tooltip(el);
      var W = el.clientWidth || 640;
      var H = cfg.height || Math.round(Math.max(250, Math.min(380, W * 0.52)));
      var m = { l: cfg.marginLeft || 48, r: cfg.marginRight || 18, t: 14, b: cfg.x.title ? 50 : 30 };
      var svg = node('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': cfg.label, tabindex: 0 }, el);
      var sx = scale(cfg.x.scale || 'linear', cfg.x.domain[0], cfg.x.domain[1], m.l, W - m.r);
      var sy = scale(cfg.y.scale || 'linear', cfg.y.domain[0], cfg.y.domain[1], H - m.b, m.t);

      if (cfg.shade) {
        node('rect', { 'class': 'shade', x: sx(cfg.shade.from), y: m.t, width: sx(cfg.shade.to) - sx(cfg.shade.from), height: H - m.b - m.t }, svg);
      }
      cfg.y.ticks.forEach(function (v) {
        node('line', { 'class': v === cfg.y.ref ? 'ref' : 'grid', x1: m.l, x2: W - m.r, y1: sy(v), y2: sy(v) }, svg);
        text(svg, m.l - 8, sy(v) + 4.5, cfg.y.format ? cfg.y.format(v) : String(v), '', 'end');
      });
      var plotW = W - m.l - m.r;
      var every = Math.ceil(cfg.x.ticks.length * (cfg.x.tickWidth || 46) / plotW);
      cfg.x.ticks.forEach(function (v, i) {
        if ((cfg.x.ticks.length - 1 - i) % every !== 0) return;
        text(svg, sx(v), H - m.b + 18, cfg.x.format ? cfg.x.format(v) : String(v), '', 'middle');
      });
      if (cfg.x.title) text(svg, m.l + plotW / 2, H - 6, cfg.x.title, '', 'middle');
      if (cfg.shade && cfg.shade.label && plotW > 420) text(svg, sx(cfg.shade.from) + 6, m.t + 15, cfg.shade.label, '');

      var paths = [], dots = [];
      cfg.series.forEach(function (s) {
        if (s.type === 'dots') {
          s.points.forEach(function (p) {
            dots.push(node('circle', { 'class': 'dot--' + s.key, cx: sx(p[0]), cy: sy(p[1]), r: 4.5 }, svg));
          });
        } else {
          var d = s.points.map(function (p, i) { return (i ? 'L' : 'M') + sx(p[0]).toFixed(1) + ' ' + sy(p[1]).toFixed(1); }).join(' ');
          paths.push(node('path', { 'class': 'line line--' + s.key, d: d, pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 0 }, svg));
          if (s.ends) {
            var first = s.points[0], last = s.points[s.points.length - 1];
            dots.push(node('circle', { 'class': 'dot--' + s.key, cx: sx(first[0]), cy: sy(first[1]), r: 4.5 }, svg));
            dots.push(node('circle', { 'class': 'dot--' + s.key, cx: sx(last[0]), cy: sy(last[1]), r: 4.5 }, svg));
            dots.push(text(svg, sx(first[0]) - 2, sy(first[1]) - 12, s.ends(first[1]), 't-strong', 'start'));
            dots.push(text(svg, sx(last[0]) + 2, sy(last[1]) - 12, s.ends(last[1]), 't-strong', 'end'));
          }
        }
      });

      var cross = node('line', { 'class': 'cross', y1: m.t, y2: H - m.b }, svg);
      cross.style.opacity = 0;
      var hit = node('rect', { 'class': 'hit', x: m.l, y: m.t, width: plotW, height: H - m.b - m.t }, svg);
      var active = -1;
      function valueAt(s, x) {
        if (s.at) return s.at(x);
        for (var i = 0; i < s.points.length; i++) if (s.points[i][0] === x) return s.points[i][1];
        return null;
      }
      function focusX(i) {
        active = i;
        if (i < 0) { cross.style.opacity = 0; tip.hide(); return; }
        var x = cfg.snap[i], px = sx(x), topY = H;
        var lines = [];
        cfg.series.forEach(function (s) {
          var v = valueAt(s, x);
          if (v === null) return;
          topY = Math.min(topY, sy(v));
          lines.push({ name: s.name, value: cfg.y.tip ? cfg.y.tip(v) : String(v), color: colors[s.key], dot: s.type === 'dots' });
        });
        cross.setAttribute('x1', px); cross.setAttribute('x2', px); cross.style.opacity = 0.5;
        // Sit beside the crosshair, on whichever half of the plot the data is not using
        var high = topY < (m.t + H - m.b) / 2;
        tip.show(px, 0, cfg.x.tip ? cfg.x.tip(x) : String(x), cfg.series.length > 1 ? lines : [lines[0].value], function (w, h, full) {
          var left = px + 14 + w / 2;
          if (left + w / 2 > full) left = px - 14 - w / 2;
          return { left: left, top: high ? H - m.b + 4 : m.t + h + 14 };
        });
      }
      function nearest(clientX) {
        var box = svg.getBoundingClientRect();
        var px = (clientX - box.left) * (W / box.width), best = 0, gap = Infinity;
        cfg.snap.forEach(function (x, i) { var g = Math.abs(sx(x) - px); if (g < gap) { gap = g; best = i; } });
        return best;
      }
      hit.addEventListener('pointermove', function (e) { focusX(nearest(e.clientX)); });
      hit.addEventListener('pointerleave', function () { focusX(-1); });
      svg.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          var next = active + (e.key === 'ArrowRight' ? 1 : -1);
          focusX(Math.max(0, Math.min(cfg.snap.length - 1, next)));
        } else if (e.key === 'Escape') { focusX(-1); }
      });
      svg.addEventListener('focus', function () { if (svg.matches(':focus-visible')) focusX(Math.max(0, active)); });
      svg.addEventListener('blur', function () { focusX(-1); });

      function draw(t) {
        paths.forEach(function (p) { p.setAttribute('stroke-dashoffset', 1 - t); });
        var o = Math.max(0, (t - 0.7) / 0.3);
        dots.forEach(function (d) { d.setAttribute('opacity', o); });
      }
      if (animate) { draw(0); tween(1400, draw); } else { draw(1); }
    }

    render(false);
    el.querySelector('svg').style.visibility = 'hidden';
    whenSeen(el, function () { played = true; render(true); });
    onWidthChange(el, function () { if (played) render(false); });
  }

  window.Charts = { dotPlot: dotPlot, lineChart: lineChart, node: node, text: text, scale: scale, onWidthChange: onWidthChange };
})();
