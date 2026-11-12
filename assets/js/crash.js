/* Charts for the vehicle weight case study. Data is the JSON block at the end of the page. */
(function () {
  'use strict';
  var source = document.getElementById('crash-data');
  if (!source || !window.Charts) return;
  var data = JSON.parse(source.textContent);
  var C = window.Charts;
  var comma = function (n) { return Math.round(n).toLocaleString('en-AU'); };

  // Adjusted odds ratios
  var forest = document.getElementById('chart-forest');
  if (forest) {
    C.dotPlot(forest, {
      label: 'Dot plot of adjusted odds ratios with 95% confidence intervals. The numbers are in the table below the chart.',
      rows: data.forest.map(function (r) {
        return { label: r.label, kind: r.kind, value: r.or, lo: r.lo, hi: r.hi, digits: r.label.indexOf('10%') > -1 ? 3 : 2 };
      }),
      scale: 'log', domain: [0.1, 6.5], ref: 1, ticks: [0.25, 0.5, 1, 2, 4],
      axisTitle: 'Odds ratio (log scale)',
      valueFormat: function (r) { return r.value.toFixed(r.digits) + ' (' + r.lo.toFixed(r.digits) + ' to ' + r.hi.toFixed(r.digits) + ')'; },
      mutedNote: 'Not read as an effect'
    });
  }

  // One factor at a time
  var steps = document.getElementById('chart-steps');
  if (steps) {
    C.dotPlot(steps, {
      label: 'Dot plot of the weight odds ratio as each factor is added on its own. The numbers are in the table below the chart.',
      rows: data.steps.map(function (s) { return { label: s.label, kind: 'est', value: s.or }; }),
      scale: 'linear', domain: [0.755, 0.8], ref: data.steps[0].or, refNotTick: true,
      ticks: [0.76, 0.77, 0.78, 0.79, 0.8],
      tickFormat: function (v) { return v.toFixed(2); },
      axisTitle: 'Odds ratio per 10% heavier',
      indent: false, labelWidth: 170, valueWidth: 60, rowHeight: 30,
      valueFormat: function (r) { return r.value.toFixed(3); }
    });
  }

  // Three shapes for the weight effect
  var shape = document.getElementById('chart-shape');
  if (shape) {
    var power = data.shape_coef.log_power, slope = data.shape_coef.linear_per_kg;
    var logAt = function (kg) { return Math.pow(kg / 1500, power); };
    var linAt = function (kg) { return Math.exp(slope * (kg - 1500)); };
    var grid = [];
    for (var kg = 1000; kg <= 2500; kg += 25) grid.push(kg);
    C.lineChart(shape, {
      label: 'Line chart of three models of the weight effect. The numbers are in the table below the chart.',
      x: { domain: [1000, 2500], ticks: [1000, 1250, 1500, 1750, 2000, 2250, 2500], format: comma, tip: function (v) { return comma(v) + ' kg car'; }, title: 'Weight of the driver\'s own car (kg)', tickWidth: 58 },
      y: { scale: 'log', domain: [0.18, 3], ticks: [0.25, 0.5, 1, 2], ref: 1, tip: function (v) { return v.toFixed(2); } },
      series: [
        { name: 'Straight line', key: '2', type: 'line', points: grid.map(function (k) { return [k, linAt(k)]; }), at: linAt },
        { name: 'Weight ratio', key: '1', type: 'line', points: grid.map(function (k) { return [k, logAt(k)]; }), at: logAt },
        { name: 'Spline', key: 'q', type: 'dots', points: data.shape.map(function (s) { return [s.kg, s.spline]; }) }
      ],
      snap: data.shape.map(function (s) { return s.kg; }),
      shade: { from: 2443, to: 2500 },
      height: 340
    });
  }

  // Median weight by year
  var years = document.getElementById('chart-years');
  if (years) {
    C.lineChart(years, {
      label: 'Line chart of median vehicle weight by crash year, rising from 1,395 kg in 2012 to 1,495 kg in 2024.',
      x: { domain: [2012, 2024], ticks: data.by_year.map(function (y) { return y.year; }), tip: function (v) { return String(v); }, tickWidth: 50 },
      y: { domain: [1380, 1510], ticks: [1400, 1425, 1450, 1475, 1500], format: comma, tip: function (v) { return comma(v) + ' kg'; } },
      series: [{ name: 'Median weight', key: '1', type: 'line', points: data.by_year.map(function (y) { return [y.year, y.median_kg]; }), ends: function (v) { return comma(v) + ' kg'; } }],
      snap: data.by_year.map(function (y) { return y.year; }),
      marginLeft: 52, marginRight: 22, height: 300
    });
  }

  // Two cars
  var own = document.getElementById('try-own'), other = document.getElementById('try-other');
  var holder = document.getElementById('chart-try');
  if (own && other && holder) {
    var p = -data.shape_coef.log_power;
    var pLo = data.secondary.main.power_lo, pHi = data.secondary.main.power_hi;
    var result = document.getElementById('try-result'), ci = document.getElementById('try-ci');
    var ownOut = document.getElementById('try-own-out'), otherOut = document.getElementById('try-other-out');
    var marker, sx, sy;
    var times = function (v) { return v >= 10 ? v.toFixed(0) : v.toFixed(1); };

    function drawCurve() {
      holder.textContent = '';
      var W = holder.clientWidth || 420, H = Math.round(Math.max(240, Math.min(320, W * 0.72)));
      var m = { l: 44, r: 14, t: 12, b: 48 };
      var svg = C.node('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'Curve of the odds between two drivers against the weight ratio of their cars, with the current choice marked.' }, holder);
      var d0 = 900 / 2400, d1 = 2400 / 900;
      sx = C.scale('log', d0, d1, m.l, W - m.r);
      sy = C.scale('log', Math.pow(d0, pHi), Math.pow(d1, pHi), H - m.b, m.t);
      [0.125, 0.25, 0.5, 1, 2, 4, 8].forEach(function (v) {
        C.node('line', { 'class': v === 1 ? 'ref' : 'grid', x1: m.l, x2: W - m.r, y1: sy(v), y2: sy(v) }, svg);
        C.text(svg, m.l - 7, sy(v) + 4.5, (v < 1 ? '1/' + (1 / v) : v) + '×', '', 'end');
      });
      [[0.5, 'Half your weight'], [1, 'Same'], [2, 'Double']].forEach(function (t) {
        C.node('line', { 'class': t[0] === 1 ? 'ref' : 'grid', x1: sx(t[0]), x2: sx(t[0]), y1: m.t, y2: H - m.b }, svg);
        C.text(svg, sx(t[0]), H - m.b + 17, t[1], '', 'middle');
      });
      C.text(svg, (m.l + W - m.r) / 2, H - 6, 'Weight of the other car', '', 'middle');
      var up = [], down = [], line = [];
      for (var i = 0; i <= 60; i++) {
        var r = d0 * Math.pow(d1 / d0, i / 60);
        up.push(sx(r).toFixed(1) + ' ' + sy(Math.pow(r, pHi)).toFixed(1));
        down.unshift(sx(r).toFixed(1) + ' ' + sy(Math.pow(r, pLo)).toFixed(1));
        line.push((i ? 'L' : 'M') + sx(r).toFixed(1) + ' ' + sy(Math.pow(r, p)).toFixed(1));
      }
      C.node('path', { 'class': 'band', d: 'M' + up.join(' L') + ' L' + down.join(' L') + ' Z' }, svg);
      C.node('path', { 'class': 'line line--1', d: line.join(' ') }, svg);
      marker = C.node('circle', { 'class': 'dot--1', r: 7 }, svg);
      place();
    }
    function place() {
      var ratio = other.value / own.value;
      if (marker) { marker.setAttribute('cx', sx(ratio)); marker.setAttribute('cy', sy(Math.pow(ratio, p))); }
    }
    function update() {
      var a = Number(own.value), b = Number(other.value), ratio = b / a;
      ownOut.textContent = comma(a) + ' kg';
      otherOut.textContent = comma(b) + ' kg';
      if (Math.abs(ratio - 1) < 0.005) {
        result.textContent = 'The two cars weigh the same. On weight alone, the model sees no difference between the drivers.';
        ci.textContent = '';
      } else if (ratio > 1) {
        result.textContent = 'The other car is ' + Math.round((ratio - 1) * 100) + '% heavier. Your odds of being killed or seriously injured are about ' + times(Math.pow(ratio, p)) + ' times the other driver\'s.';
        ci.textContent = '95% confidence interval: ' + times(Math.pow(ratio, pLo)) + ' to ' + times(Math.pow(ratio, pHi)) + ' times.';
      } else {
        var inv = 1 / ratio;
        result.textContent = 'Your car is ' + Math.round((inv - 1) * 100) + '% heavier. The other driver\'s odds of being killed or seriously injured are about ' + times(Math.pow(inv, p)) + ' times yours.';
        ci.textContent = '95% confidence interval: ' + times(Math.pow(inv, pLo)) + ' to ' + times(Math.pow(inv, pHi)) + ' times.';
      }
      place();
    }
    own.addEventListener('input', update);
    other.addEventListener('input', update);
    drawCurve();
    update();
    C.onWidthChange(holder, drawCurve);
  }
})();
