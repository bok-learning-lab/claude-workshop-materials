(function () {
  // =========================================================================
  // PMF / CDF Builder (W32) — single-file widget logic.
  //
  // Each <div class="pmf-widget" data-problem='{...}'> on the page is mounted
  // as an independent instance. State and DOM refs are scoped per-instance.
  // The script can be loaded multiple times safely (idempotent self-tests,
  // idempotent per-element mount).
  //
  // data-problem JSON keys (all optional):
  //   title         (string)
  //   intro         (HTML string)
  //   defaultPreset ("blank" | "twoDice" | "binomial10" | "sailor4")
  //
  // Pedagogy: students enter (value, probability) pairs, see the bar-chart
  // PMF, the step-function CDF, the running Σp validity check, and the live
  // expectation E[X]. Click any bar (PMF) or any step (CDF) to highlight the
  // corresponding row in the input table — the cross-panel coupling makes
  // "PMF and CDF are two views of the same RV" visceral.
  // =========================================================================

  // ----- numerical helpers ----------------------------------------------------
  // Parse a value string. Allows decimals, fractions ("a/b"), and negatives.
  // Returns { ok: bool, value: number, error: string|null }.
  function parseNumber(raw) {
    if (raw == null) return { ok: false, value: NaN, error: 'empty' };
    var s = String(raw).trim();
    if (s === '') return { ok: false, value: NaN, error: 'empty' };
    // fraction
    var m = s.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
    if (m) {
      var num = Number(m[1]);
      var den = Number(m[2]);
      if (!isFinite(num) || !isFinite(den) || den === 0) {
        return { ok: false, value: NaN, error: 'bad fraction' };
      }
      return { ok: true, value: num / den, error: null };
    }
    var n = Number(s);
    if (!isFinite(n)) return { ok: false, value: NaN, error: 'not a number' };
    return { ok: true, value: n, error: null };
  }

  // Round small floating-point dust toward 0 / 1 for the validity check.
  function nearOne(sum) {
    return Math.abs(sum - 1) < 1e-9;
  }

  // Format a probability for display in readouts. Show fractions when entered
  // as a clean fraction; otherwise round.
  function fmtNum(n, digits) {
    if (n == null || !isFinite(n)) return '–';
    if (digits == null) digits = 4;
    // keep zero clean
    if (Math.abs(n) < 1e-12) return '0';
    var rounded = Number(n.toFixed(digits));
    var s = String(rounded);
    return s;
  }

  function fmtProb(n) {
    if (n == null || !isFinite(n)) return '–';
    if (Math.abs(n) < 1e-12) return '0';
    return Number(n.toFixed(4)).toString();
  }

  // ----- presets --------------------------------------------------------------
  // Each preset is a flat list of {x, pStr} entries. Probabilities are stored
  // as strings so fractions are preserved in the input field.
  function binomialCoeff(n, k) {
    if (k < 0 || k > n) return 0;
    k = Math.min(k, n - k);
    var c = 1;
    for (var i = 0; i < k; i++) c = c * (n - i) / (i + 1);
    return c;
  }

  function presetTwoDiceSum() {
    // X = R1 + R2, R_i uniform on {1..6}; PMF triangular over {2..12}.
    var counts = [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
    var rows = [];
    for (var i = 0; i < counts.length; i++) {
      rows.push({ x: String(i + 2), p: counts[i] + '/36' });
    }
    return rows;
  }

  function presetBinomial10() {
    // X = # heads in 10 fair flips; P(X=k) = C(10,k) * 2^-10.
    var rows = [];
    for (var k = 0; k <= 10; k++) {
      var c = binomialCoeff(10, k);
      rows.push({ x: String(k), p: c + '/1024' });
    }
    return rows;
  }

  function presetSailor4() {
    // Symmetric random walk at t=4. Values in {-4,-2,0,2,4} with C(4,k)/16.
    // X(k heads) = 2k - t = 2k - 4. Counts: C(4,0..4) = 1,4,6,4,1.
    var counts = [1, 4, 6, 4, 1];
    var rows = [];
    for (var k = 0; k <= 4; k++) {
      var x = 2 * k - 4;
      rows.push({ x: String(x), p: counts[k] + '/16' });
    }
    return rows;
  }

  function presetBlank() {
    return [
      { x: '', p: '' },
      { x: '', p: '' },
      { x: '', p: '' },
      { x: '', p: '' }
    ];
  }

  function presetRows(name) {
    switch (name) {
      case 'twoDice':    return presetTwoDiceSum();
      case 'binomial10': return presetBinomial10();
      case 'sailor4':    return presetSailor4();
      case 'blank':
      default:           return presetBlank();
    }
  }

  // ----- DOM build helpers ----------------------------------------------------
  function el(tag, opts) {
    var node = document.createElement(tag);
    if (!opts) return node;
    if (opts.cls) node.className = opts.cls;
    if (opts.text != null) node.textContent = opts.text;
    if (opts.html != null) node.innerHTML = opts.html;
    if (opts.attrs) {
      for (var k in opts.attrs) {
        if (Object.prototype.hasOwnProperty.call(opts.attrs, k)) {
          node.setAttribute(k, opts.attrs[k]);
        }
      }
    }
    return node;
  }

  function svgEl(tag, attrs) {
    var node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    if (attrs) {
      for (var k in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, k)) {
          node.setAttribute(k, attrs[k]);
        }
      }
    }
    return node;
  }

  // ----- main per-instance mount ---------------------------------------------
  function mount(root) {
    // idempotent — skip if already mounted
    if (root.__pmfMounted) return;
    root.__pmfMounted = true;

    // parse problem config
    var cfg = {};
    var raw = root.getAttribute('data-problem');
    if (raw) {
      try { cfg = JSON.parse(raw) || {}; }
      catch (e) {
        console.warn('[pmf-widget] invalid data-problem JSON, falling back', e);
      }
    }

    var defaultPreset = cfg.defaultPreset || 'blank';

    // state
    var state = {
      preset: defaultPreset,
      rows: presetRows(defaultPreset).map(function (r) { return { x: r.x, p: r.p }; }),
      selectedKey: null   // identity-style ref to the currently-highlighted row
    };

    // ===== build static DOM ===================================================
    root.innerHTML = '';

    if (cfg.title) {
      root.appendChild(el('div', { cls: 'pmf-title', text: cfg.title }));
    }
    if (cfg.intro) {
      root.appendChild(el('div', { cls: 'pmf-intro', html: cfg.intro }));
    }

    // ----- top controls row -----
    var controls = el('div', { cls: 'pmf-controls' });

    var presetGroup = el('div', { cls: 'pmf-control-group' });
    presetGroup.appendChild(el('label', { text: 'Preset' }));
    var presetSel = el('select');
    [
      { v: 'blank',      l: 'Custom (blank)' },
      { v: 'twoDice',    l: 'Two-dice sum (Activity 2)' },
      { v: 'binomial10', l: 'Binomial(10, 1/2) (Activity 8)' },
      { v: 'sailor4',    l: 'Sailor walk at t=4 (Activity 11)' }
    ].forEach(function (opt) {
      var o = el('option', { text: opt.l });
      o.value = opt.v;
      if (opt.v === defaultPreset) o.selected = true;
      presetSel.appendChild(o);
    });
    presetGroup.appendChild(presetSel);
    controls.appendChild(presetGroup);

    var loadBtn = el('button', { cls: 'pmf-primary', text: 'Load preset' });
    controls.appendChild(loadBtn);

    var clearBtn = el('button', { text: 'Clear all' });
    controls.appendChild(clearBtn);

    root.appendChild(controls);

    // ----- two-column body -----
    var body = el('div', { cls: 'pmf-body' });

    // ===== left column: input table ===========================================
    var inputCard = el('div', { cls: 'pmf-input-card' });
    inputCard.appendChild(el('h4', { text: 'PMF input — (value, probability) pairs' }));

    var table = el('table', { cls: 'pmf-table' });
    var thead = el('thead');
    var headRow = el('tr');
    headRow.appendChild(el('th', { cls: 'pmf-col-x',      text: 'value x' }));
    headRow.appendChild(el('th', { cls: 'pmf-col-p',      text: 'P(X = x)' }));
    headRow.appendChild(el('th', { cls: 'pmf-col-action', text: '' }));
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = el('tbody');
    table.appendChild(tbody);
    inputCard.appendChild(table);

    var addRowBtn = el('button', { cls: 'pmf-add-row', text: '+ add row' });
    var addRowWrap = el('div', { attrs: { style: 'text-align: center; padding-top: 10px;' } });
    addRowWrap.appendChild(addRowBtn);
    inputCard.appendChild(addRowWrap);

    body.appendChild(inputCard);

    // ===== right column: stacked output =======================================
    var outputStack = el('div', { cls: 'pmf-output-stack' });

    // readout strip: validity + E[X]
    var readouts = el('div', { cls: 'pmf-readouts' });

    var validityBox = el('div', { cls: 'pmf-readout' });
    validityBox.appendChild(el('span', { cls: 'pmf-readout-label', text: 'Σ P(X = x)' }));
    var validityPill = el('span', { cls: 'pmf-validity-pill pmf-bad' });
    validityPill.appendChild(el('span', { cls: 'pmf-validity-icon', text: '✗' }));
    var validityVal = el('span', { text: '–' });
    validityPill.appendChild(validityVal);
    validityBox.appendChild(validityPill);
    readouts.appendChild(validityBox);

    var expBox = el('div', { cls: 'pmf-readout' });
    expBox.appendChild(el('span', { cls: 'pmf-readout-label', text: 'E[X]' }));
    var expVal = el('span', { cls: 'pmf-readout-value', text: '–' });
    expBox.appendChild(expVal);
    readouts.appendChild(expBox);

    outputStack.appendChild(readouts);

    // errors / warnings
    var errorList = el('ul', { cls: 'pmf-errors' });
    outputStack.appendChild(errorList);

    // PMF chart card
    var pmfChartCard = el('div', { cls: 'pmf-chart-card' });
    var pmfHead = el('h4');
    pmfHead.appendChild(el('span', { text: 'PMF — bar chart' }));
    pmfHead.appendChild(el('span', { cls: 'pmf-chart-hint', text: 'click a bar to link with the table & CDF' }));
    pmfChartCard.appendChild(pmfHead);
    var pmfSvg = svgEl('svg', { class: 'pmf-chart-svg', viewBox: '0 0 480 220', preserveAspectRatio: 'xMidYMid meet' });
    pmfChartCard.appendChild(pmfSvg);
    outputStack.appendChild(pmfChartCard);

    // CDF chart card
    var cdfChartCard = el('div', { cls: 'pmf-chart-card' });
    var cdfHead = el('h4');
    cdfHead.appendChild(el('span', { text: 'CDF — step function F(x) = P(X ≤ x)' }));
    cdfHead.appendChild(el('span', { cls: 'pmf-chart-hint', text: 'right-continuous: closed dot at the jump' }));
    cdfChartCard.appendChild(cdfHead);
    var cdfSvg = svgEl('svg', { class: 'pmf-chart-svg', viewBox: '0 0 480 220', preserveAspectRatio: 'xMidYMid meet' });
    cdfChartCard.appendChild(cdfSvg);
    outputStack.appendChild(cdfChartCard);

    // CDF table
    var cdfTableCard = el('div', { cls: 'pmf-cdf-table-card' });
    cdfTableCard.appendChild(el('h4', { text: 'CDF — tabular view' }));
    var cdfTable = el('table', { cls: 'pmf-cdf-table' });
    var cdfThead = el('thead');
    var cdfHeadRow = el('tr');
    cdfHeadRow.appendChild(el('th', { text: 'x' }));
    cdfHeadRow.appendChild(el('th', { text: 'P(X = x)' }));
    cdfHeadRow.appendChild(el('th', { text: 'F(x) = P(X ≤ x)' }));
    cdfThead.appendChild(cdfHeadRow);
    cdfTable.appendChild(cdfThead);
    var cdfTbody = el('tbody');
    cdfTable.appendChild(cdfTbody);
    cdfTableCard.appendChild(cdfTable);
    outputStack.appendChild(cdfTableCard);

    body.appendChild(outputStack);
    root.appendChild(body);

    // ===== row rendering ======================================================
    // Each row in state.rows gets a stable identity; we tag it with a __key
    // so highlight cross-references survive sort/round-trip.
    var nextKey = 1;
    function ensureKey(row) {
      if (row.__key == null) row.__key = nextKey++;
      return row.__key;
    }
    state.rows.forEach(ensureKey);

    function renderTable() {
      tbody.innerHTML = '';
      state.rows.forEach(function (row, idx) {
        var key = ensureKey(row);
        var tr = el('tr');
        tr.dataset.key = String(key);
        if (state.selectedKey === key) tr.classList.add('pmf-row-selected');

        // value cell
        var tdX = el('td');
        var inX = el('input', { attrs: { type: 'text', inputmode: 'decimal', placeholder: 'x' } });
        inX.value = row.x;
        inX.addEventListener('input', function () {
          row.x = inX.value;
          recompute();
        });
        inX.addEventListener('focus', function () { setSelected(key); });
        tdX.appendChild(inX);
        tr.appendChild(tdX);

        // probability cell
        var tdP = el('td');
        var inP = el('input', { attrs: { type: 'text', inputmode: 'decimal', placeholder: '0.5 or 1/6' } });
        inP.value = row.p;
        inP.addEventListener('input', function () {
          row.p = inP.value;
          recompute();
        });
        inP.addEventListener('focus', function () { setSelected(key); });
        tdP.appendChild(inP);
        tr.appendChild(tdP);

        // delete button
        var tdAct = el('td', { attrs: { style: 'text-align: center;' } });
        var del = el('button', { cls: 'pmf-row-delete', attrs: { 'aria-label': 'remove row' }, text: '×' });
        del.addEventListener('click', function () {
          var i = state.rows.indexOf(row);
          if (i >= 0) {
            state.rows.splice(i, 1);
            if (state.rows.length === 0) {
              state.rows.push({ x: '', p: '', __key: nextKey++ });
            }
            if (state.selectedKey === key) state.selectedKey = null;
            renderTable();
            recompute();
          }
        });
        tdAct.appendChild(del);
        tr.appendChild(tdAct);

        tr.addEventListener('click', function (ev) {
          // don't override clicks that already focused an input
          if (ev.target && (ev.target.tagName === 'INPUT' || ev.target.tagName === 'BUTTON')) return;
          setSelected(key);
        });

        tbody.appendChild(tr);
      });
      // mark inputs that are invalid
      markInputValidity();
    }

    function markInputValidity() {
      var rows = state.rows;
      var trs = tbody.querySelectorAll('tr');
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var tr = trs[i];
        if (!tr) continue;
        var inputs = tr.querySelectorAll('input');
        var inX = inputs[0];
        var inP = inputs[1];
        var xRes = parseNumber(row.x);
        var pRes = parseNumber(row.p);
        // x: empty is allowed (treated as "row not yet entered")
        if (row.x.trim() !== '' && !xRes.ok) inX.classList.add('pmf-input-bad');
        else inX.classList.remove('pmf-input-bad');
        // p: bad if not parseable when non-empty, or out of [0,1]
        var pBad = false;
        if (row.p.trim() !== '') {
          if (!pRes.ok) pBad = true;
          else if (pRes.value < 0) pBad = true;
        }
        if (pBad) inP.classList.add('pmf-input-bad');
        else inP.classList.remove('pmf-input-bad');
      }
    }

    function setSelected(key) {
      state.selectedKey = key;
      // re-render only what changes
      var trs = tbody.querySelectorAll('tr');
      trs.forEach(function (tr) {
        if (Number(tr.dataset.key) === key) tr.classList.add('pmf-row-selected');
        else tr.classList.remove('pmf-row-selected');
      });
      // chart highlights
      pmfSvg.querySelectorAll('.pmf-bar').forEach(function (b) {
        if (Number(b.dataset.key) === key) b.classList.add('pmf-bar-selected');
        else b.classList.remove('pmf-bar-selected');
      });
      cdfSvg.querySelectorAll('.pmf-cdf-step-marker').forEach(function (m) {
        if (Number(m.dataset.key) === key) m.classList.add('pmf-cdf-step-selected');
        else m.classList.remove('pmf-cdf-step-selected');
      });
      // cdf table
      cdfTbody.querySelectorAll('tr').forEach(function (tr) {
        if (Number(tr.dataset.key) === key) tr.classList.add('pmf-row-selected');
        else tr.classList.remove('pmf-row-selected');
      });
    }

    // ===== compute → render charts + readouts =================================
    function computeData() {
      // collect parsed rows; only "complete" rows (both x and p valid) contribute
      // to the charts and the sum.
      var entries = [];
      var errors = [];
      var seenX = {};
      state.rows.forEach(function (row, idx) {
        var rowNum = idx + 1;
        var xRaw = row.x.trim();
        var pRaw = row.p.trim();
        if (xRaw === '' && pRaw === '') return; // skip empty
        if (xRaw === '') {
          errors.push({ kind: 'err', msg: 'Row ' + rowNum + ': missing value x.' });
          return;
        }
        if (pRaw === '') {
          errors.push({ kind: 'err', msg: 'Row ' + rowNum + ': missing probability for x = ' + xRaw + '.' });
          return;
        }
        var xRes = parseNumber(xRaw);
        var pRes = parseNumber(pRaw);
        if (!xRes.ok) {
          errors.push({ kind: 'err', msg: 'Row ' + rowNum + ': "' + xRaw + '" is not a number.' });
          return;
        }
        if (!pRes.ok) {
          errors.push({ kind: 'err', msg: 'Row ' + rowNum + ': "' + pRaw + '" is not a number.' });
          return;
        }
        if (pRes.value < 0) {
          errors.push({ kind: 'err', msg: 'Row ' + rowNum + ': probability must be ≥ 0 (got ' + fmtProb(pRes.value) + ').' });
          return;
        }
        if (pRes.value > 1) {
          errors.push({ kind: 'warn', msg: 'Row ' + rowNum + ': probability ' + fmtProb(pRes.value) + ' > 1.' });
        }
        var keyX = String(xRes.value);
        if (Object.prototype.hasOwnProperty.call(seenX, keyX)) {
          errors.push({ kind: 'warn', msg: 'Row ' + rowNum + ': duplicate value x = ' + xRes.value + '. Combine into one row.' });
        } else {
          seenX[keyX] = true;
        }
        entries.push({ x: xRes.value, p: pRes.value, key: row.__key });
      });
      // sort ascending by x for chart + CDF
      entries.sort(function (a, b) {
        if (a.x < b.x) return -1;
        if (a.x > b.x) return 1;
        return 0;
      });
      var sum = entries.reduce(function (a, e) { return a + e.p; }, 0);
      var ex = entries.reduce(function (a, e) { return a + e.x * e.p; }, 0);
      // CDF entries
      var running = 0;
      var cdf = entries.map(function (e) {
        running += e.p;
        return { x: e.x, p: e.p, F: running, key: e.key };
      });
      return {
        entries: entries,
        cdf: cdf,
        sum: sum,
        expectation: ex,
        errors: errors
      };
    }

    function renderReadouts(data) {
      // validity pill
      validityPill.classList.remove('pmf-ok', 'pmf-bad');
      var icon = validityPill.querySelector('.pmf-validity-icon');
      if (data.entries.length === 0) {
        validityPill.classList.add('pmf-bad');
        icon.textContent = '–';
        validityVal.textContent = 'no entries';
      } else if (nearOne(data.sum)) {
        validityPill.classList.add('pmf-ok');
        icon.textContent = '✓';
        validityVal.textContent = '= 1';
      } else {
        validityPill.classList.add('pmf-bad');
        icon.textContent = '✗';
        validityVal.textContent = '= ' + fmtNum(data.sum, 4);
      }
      // expectation
      if (data.entries.length === 0) {
        expVal.textContent = '–';
      } else {
        expVal.textContent = fmtNum(data.expectation, 4);
      }
      // errors
      errorList.innerHTML = '';
      data.errors.forEach(function (e) {
        var li = el('li', { text: e.msg });
        if (e.kind === 'warn') li.classList.add('pmf-warning');
        errorList.appendChild(li);
      });
    }

    // ----- chart rendering -----------------------------------------------------
    // Common coordinate system:
    //   viewBox 480 x 220
    //   plot area: x∈[plotL, plotR], y∈[plotT, plotB] (top→bottom)
    var PLOT_L = 46, PLOT_R = 460, PLOT_T = 14, PLOT_B = 188;
    var PLOT_W = PLOT_R - PLOT_L;
    var PLOT_H = PLOT_B - PLOT_T;

    // For non-evenly-spaced x: keep the geometric ordinal positions.
    // Each entry gets a slot center; slot width scales to fit.
    function slotCenters(entries) {
      var n = entries.length;
      if (n === 0) return [];
      // single-entry case → centered
      if (n === 1) return [PLOT_L + PLOT_W / 2];
      // ordinal positions: keep equal spacing for the bar chart (clean look)
      var step = PLOT_W / n;
      return entries.map(function (_, i) { return PLOT_L + step * (i + 0.5); });
    }

    function clearSvg(svg) {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
    }

    function renderPmfChart(data) {
      clearSvg(pmfSvg);
      if (data.entries.length === 0) {
        var msg = svgEl('text', {
          x: 240, y: 110,
          'text-anchor': 'middle',
          fill: '#9aa0ac',
          'font-style': 'italic',
          'font-size': 13
        });
        msg.textContent = 'Add (value, probability) pairs to see the PMF.';
        pmfSvg.appendChild(msg);
        return;
      }
      var entries = data.entries;
      var centers = slotCenters(entries);
      // y scale: map [0, max(p)] → [PLOT_B, PLOT_T] with a bit of headroom.
      var pmax = 0;
      entries.forEach(function (e) { if (e.p > pmax) pmax = e.p; });
      if (pmax <= 0) pmax = 1;
      var pceil = niceTop(pmax);

      // gridlines (4 horizontal)
      var gridSteps = 4;
      for (var g = 0; g <= gridSteps; g++) {
        var pv = (pceil * g) / gridSteps;
        var ypx = PLOT_B - (pv / pceil) * PLOT_H;
        pmfSvg.appendChild(svgEl('line', {
          x1: PLOT_L, x2: PLOT_R, y1: ypx, y2: ypx,
          class: 'pmf-grid-line'
        }));
        var t = svgEl('text', {
          x: PLOT_L - 6, y: ypx + 3.5,
          class: 'pmf-axis-tick pmf-axis-tick-y'
        });
        t.textContent = fmtNum(pv, 3);
        pmfSvg.appendChild(t);
      }

      // axes
      pmfSvg.appendChild(svgEl('line', {
        x1: PLOT_L, x2: PLOT_R, y1: PLOT_B, y2: PLOT_B,
        class: 'pmf-axis-line'
      }));
      pmfSvg.appendChild(svgEl('line', {
        x1: PLOT_L, x2: PLOT_L, y1: PLOT_T, y2: PLOT_B,
        class: 'pmf-axis-line'
      }));

      // y-axis title
      var yTitle = svgEl('text', {
        x: PLOT_L - 32, y: PLOT_T + PLOT_H / 2,
        class: 'pmf-axis-title',
        transform: 'rotate(-90 ' + (PLOT_L - 32) + ' ' + (PLOT_T + PLOT_H / 2) + ')',
        'text-anchor': 'middle'
      });
      yTitle.textContent = 'P(X = x)';
      pmfSvg.appendChild(yTitle);

      // x-axis title
      var xTitle = svgEl('text', {
        x: (PLOT_L + PLOT_R) / 2, y: PLOT_B + 30,
        class: 'pmf-axis-title',
        'text-anchor': 'middle'
      });
      xTitle.textContent = 'value x';
      pmfSvg.appendChild(xTitle);

      // bars
      var slotW = PLOT_W / entries.length;
      var barW = Math.max(8, Math.min(40, slotW * 0.7));
      entries.forEach(function (e, i) {
        var cx = centers[i];
        var h = (e.p / pceil) * PLOT_H;
        if (e.p <= 0) {
          // zero-prob: draw a tiny grey marker so x is visible
          var zero = svgEl('rect', {
            x: cx - barW / 2, y: PLOT_B - 1,
            width: barW, height: 1,
            class: 'pmf-bar pmf-bar-zero'
          });
          zero.dataset.key = String(e.key);
          zero.addEventListener('click', function () { setSelected(e.key); });
          pmfSvg.appendChild(zero);
        } else {
          var bar = svgEl('rect', {
            x: cx - barW / 2, y: PLOT_B - h,
            width: barW, height: h,
            class: 'pmf-bar'
          });
          bar.dataset.key = String(e.key);
          if (state.selectedKey === e.key) bar.classList.add('pmf-bar-selected');
          bar.addEventListener('click', function () { setSelected(e.key); });
          // tooltip
          var title = svgEl('title');
          title.textContent = 'x = ' + e.x + ', P = ' + fmtProb(e.p);
          bar.appendChild(title);
          pmfSvg.appendChild(bar);
          // value label above bar (when there's room)
          if (h > 14 && entries.length <= 16) {
            var lbl = svgEl('text', {
              x: cx, y: PLOT_B - h - 3,
              class: 'pmf-bar-label'
            });
            lbl.textContent = fmtProb(e.p);
            pmfSvg.appendChild(lbl);
          }
        }
        // x-tick label
        var xt = svgEl('text', {
          x: cx, y: PLOT_B + 14,
          class: 'pmf-axis-tick'
        });
        xt.textContent = String(e.x);
        pmfSvg.appendChild(xt);
      });
    }

    function renderCdfChart(data) {
      clearSvg(cdfSvg);
      if (data.cdf.length === 0) {
        var msg = svgEl('text', {
          x: 240, y: 110,
          'text-anchor': 'middle',
          fill: '#9aa0ac',
          'font-style': 'italic',
          'font-size': 13
        });
        msg.textContent = 'Add entries to see the step-function CDF.';
        cdfSvg.appendChild(msg);
        return;
      }
      var cdf = data.cdf;
      var entries = data.entries;
      var centers = slotCenters(entries);
      // y scale: 0 → 1 fixed (or the max F if Σ > 1, with red zone implicit).
      var ymax = Math.max(1, cdf[cdf.length - 1].F);
      // CDF gridlines + ticks at 0, 0.25, 0.5, 0.75, 1
      var ticks = [0, 0.25, 0.5, 0.75, 1];
      ticks.forEach(function (tv) {
        var ypx = PLOT_B - (tv / ymax) * PLOT_H;
        cdfSvg.appendChild(svgEl('line', {
          x1: PLOT_L, x2: PLOT_R, y1: ypx, y2: ypx,
          class: 'pmf-grid-line'
        }));
        var t = svgEl('text', {
          x: PLOT_L - 6, y: ypx + 3.5,
          class: 'pmf-axis-tick pmf-axis-tick-y'
        });
        t.textContent = String(tv);
        cdfSvg.appendChild(t);
      });
      // also a line at y=1 if ymax > 1 (sum invalid) — render a softer guide
      if (ymax > 1.001) {
        var y1 = PLOT_B - (1 / ymax) * PLOT_H;
        var lineOne = svgEl('line', {
          x1: PLOT_L, x2: PLOT_R, y1: y1, y2: y1,
          stroke: '#b22e1c', 'stroke-dasharray': '4 3', 'stroke-width': 1
        });
        cdfSvg.appendChild(lineOne);
      }
      // axes
      cdfSvg.appendChild(svgEl('line', {
        x1: PLOT_L, x2: PLOT_R, y1: PLOT_B, y2: PLOT_B,
        class: 'pmf-axis-line'
      }));
      cdfSvg.appendChild(svgEl('line', {
        x1: PLOT_L, x2: PLOT_L, y1: PLOT_T, y2: PLOT_B,
        class: 'pmf-axis-line'
      }));

      var yTitle = svgEl('text', {
        x: PLOT_L - 32, y: PLOT_T + PLOT_H / 2,
        class: 'pmf-axis-title',
        transform: 'rotate(-90 ' + (PLOT_L - 32) + ' ' + (PLOT_T + PLOT_H / 2) + ')',
        'text-anchor': 'middle'
      });
      yTitle.textContent = 'F(x)';
      cdfSvg.appendChild(yTitle);

      var xTitle = svgEl('text', {
        x: (PLOT_L + PLOT_R) / 2, y: PLOT_B + 30,
        class: 'pmf-axis-title',
        'text-anchor': 'middle'
      });
      xTitle.textContent = 'x';
      cdfSvg.appendChild(xTitle);

      // step path: F = 0 below the smallest x; jumps up at each x.
      // We draw segments left-to-right.
      var segments = [];
      var prevY = PLOT_B - (0 / ymax) * PLOT_H;
      // initial flat at 0 from PLOT_L to first x's center
      segments.push({ x1: PLOT_L, y1: prevY, x2: centers[0], y2: prevY });
      // jump at first x
      var firstY = PLOT_B - (cdf[0].F / ymax) * PLOT_H;
      segments.push({ x1: centers[0], y1: prevY, x2: centers[0], y2: firstY, jump: true });
      prevY = firstY;
      for (var i = 1; i < cdf.length; i++) {
        // flat segment from previous center to this center at prevY
        segments.push({ x1: centers[i - 1], y1: prevY, x2: centers[i], y2: prevY });
        // jump up to this F
        var thisY = PLOT_B - (cdf[i].F / ymax) * PLOT_H;
        segments.push({ x1: centers[i], y1: prevY, x2: centers[i], y2: thisY, jump: true });
        prevY = thisY;
      }
      // trailing flat from last center to PLOT_R
      segments.push({ x1: centers[centers.length - 1], y1: prevY, x2: PLOT_R, y2: prevY });

      // draw step path as a polyline
      var d = '';
      segments.forEach(function (s, k) {
        if (k === 0) d += 'M ' + s.x1 + ' ' + s.y1 + ' ';
        d += 'L ' + s.x2 + ' ' + s.y2 + ' ';
      });
      cdfSvg.appendChild(svgEl('path', {
        d: d,
        class: 'pmf-cdf-step'
      }));

      // dots: closed dot at each (x_i, F_i); open dot at (x_i, F_{i-1}).
      var prevF = 0;
      for (var j = 0; j < cdf.length; j++) {
        var cx = centers[j];
        var cF = cdf[j].F;
        var yClosed = PLOT_B - (cF / ymax) * PLOT_H;
        var yOpen = PLOT_B - (prevF / ymax) * PLOT_H;
        // open dot at the lower end of the jump (only if there's a jump)
        if (cdf[j].p > 1e-12) {
          cdfSvg.appendChild(svgEl('circle', {
            cx: cx, cy: yOpen, r: 3.5,
            class: 'pmf-cdf-dot pmf-cdf-dot-open'
          }));
        }
        var dotClosed = svgEl('circle', {
          cx: cx, cy: yClosed, r: 3.5,
          class: 'pmf-cdf-dot'
        });
        cdfSvg.appendChild(dotClosed);
        prevF = cF;

        // x-tick
        var xt = svgEl('text', {
          x: cx, y: PLOT_B + 14,
          class: 'pmf-axis-tick'
        });
        xt.textContent = String(cdf[j].x);
        cdfSvg.appendChild(xt);

        // invisible click marker spanning the half-step on either side, for highlight UX
        var leftEdge  = (j === 0) ? PLOT_L : (centers[j - 1] + cx) / 2;
        var rightEdge = (j === cdf.length - 1) ? PLOT_R : (cx + centers[j + 1]) / 2;
        var marker = svgEl('rect', {
          x: leftEdge, y: PLOT_T,
          width: rightEdge - leftEdge, height: PLOT_H,
          class: 'pmf-cdf-step-marker'
        });
        marker.dataset.key = String(cdf[j].key);
        if (state.selectedKey === cdf[j].key) marker.classList.add('pmf-cdf-step-selected');
        marker.addEventListener('click', function (key) {
          return function () { setSelected(key); };
        }(cdf[j].key));
        // Title for tooltip
        var mt = svgEl('title');
        mt.textContent = 'F(' + cdf[j].x + ') = ' + fmtProb(cF);
        marker.appendChild(mt);
        cdfSvg.appendChild(marker);
      }
    }

    function renderCdfTable(data) {
      cdfTbody.innerHTML = '';
      if (data.cdf.length === 0) {
        var tr = el('tr');
        var td = el('td', { cls: 'pmf-empty-msg', attrs: { colspan: '3' }, text: 'no entries yet' });
        tr.appendChild(td);
        cdfTbody.appendChild(tr);
        return;
      }
      data.cdf.forEach(function (e) {
        var tr = el('tr');
        tr.dataset.key = String(e.key);
        if (state.selectedKey === e.key) tr.classList.add('pmf-row-selected');
        tr.appendChild(el('td', { text: String(e.x) }));
        tr.appendChild(el('td', { text: fmtProb(e.p) }));
        tr.appendChild(el('td', { text: fmtProb(e.F) }));
        tr.addEventListener('click', function () { setSelected(e.key); });
        cdfTbody.appendChild(tr);
      });
    }

    function recompute() {
      markInputValidity();
      var data = computeData();
      renderReadouts(data);
      renderPmfChart(data);
      renderCdfChart(data);
      renderCdfTable(data);
    }

    // ----- nice y-axis top -----
    function niceTop(p) {
      // Choose a clean ceiling >= p. Useful values: 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.75, 1.
      var stops = [0.005, 0.01, 0.02, 0.025, 0.05, 0.1, 0.125, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.75, 0.8, 1.0];
      for (var i = 0; i < stops.length; i++) {
        if (p <= stops[i] + 1e-12) return stops[i];
      }
      return Math.ceil(p * 4) / 4;
    }

    // ===== controls wiring ====================================================
    loadBtn.addEventListener('click', function () {
      var name = presetSel.value;
      state.preset = name;
      state.rows = presetRows(name).map(function (r) {
        var row = { x: r.x, p: r.p };
        ensureKey(row);
        return row;
      });
      state.selectedKey = null;
      renderTable();
      recompute();
    });

    clearBtn.addEventListener('click', function () {
      state.rows = [
        { x: '', p: '' },
        { x: '', p: '' },
        { x: '', p: '' },
        { x: '', p: '' }
      ];
      state.rows.forEach(ensureKey);
      state.selectedKey = null;
      renderTable();
      recompute();
    });

    addRowBtn.addEventListener('click', function () {
      var row = { x: '', p: '' };
      ensureKey(row);
      state.rows.push(row);
      renderTable();
      recompute();
    });

    // initial render
    renderTable();
    recompute();
  }

  // ----- bootstrapping --------------------------------------------------------
  function mountAll() {
    var nodes = document.querySelectorAll('.pmf-widget');
    Array.prototype.forEach.call(nodes, function (n) {
      try { mount(n); }
      catch (e) {
        console.error('[pmf-widget] mount failed', e);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountAll);
  } else {
    mountAll();
  }

  // ----- self-tests (run once per script load) -------------------------------
  if (!window.__pmfSelfTested) {
    window.__pmfSelfTested = true;
    (function selfTest() {
      function assert(cond, msg) {
        if (!cond) console.error('[pmf-widget self-test] FAIL:', msg);
      }
      // parseNumber
      assert(parseNumber('0.5').value === 0.5, '0.5 → 0.5');
      assert(Math.abs(parseNumber('1/6').value - 1 / 6) < 1e-12, '1/6 → 0.1666…');
      assert(parseNumber('').ok === false, 'empty fails');
      assert(parseNumber('abc').ok === false, 'abc fails');
      assert(parseNumber('-2').value === -2, '-2 → -2');
      // presets
      var dice = presetTwoDiceSum();
      assert(dice.length === 11, 'two-dice sum has 11 entries');
      var sumDice = dice.reduce(function (a, r) {
        var pr = parseNumber(r.p);
        return a + (pr.ok ? pr.value : 0);
      }, 0);
      assert(Math.abs(sumDice - 1) < 1e-9, 'two-dice probs sum to 1, got ' + sumDice);
      var bin = presetBinomial10();
      assert(bin.length === 11, 'binomial10 has 11 entries');
      var sumBin = bin.reduce(function (a, r) {
        var pr = parseNumber(r.p);
        return a + (pr.ok ? pr.value : 0);
      }, 0);
      assert(Math.abs(sumBin - 1) < 1e-9, 'binomial10 probs sum to 1, got ' + sumBin);
      var sail = presetSailor4();
      assert(sail.length === 5, 'sailor4 has 5 entries');
      var sumSail = sail.reduce(function (a, r) {
        var pr = parseNumber(r.p);
        return a + (pr.ok ? pr.value : 0);
      }, 0);
      assert(Math.abs(sumSail - 1) < 1e-9, 'sailor4 probs sum to 1, got ' + sumSail);
      // E[X] sanity for two-dice sum
      var eDice = dice.reduce(function (a, r) {
        var pr = parseNumber(r.p).value;
        var x = parseNumber(r.x).value;
        return a + x * pr;
      }, 0);
      assert(Math.abs(eDice - 7) < 1e-9, 'E[two-dice sum] = 7, got ' + eDice);
      // E[X] for binomial(10, 1/2) = 5
      var eBin = bin.reduce(function (a, r) {
        var pr = parseNumber(r.p).value;
        var x = parseNumber(r.x).value;
        return a + x * pr;
      }, 0);
      assert(Math.abs(eBin - 5) < 1e-9, 'E[Binomial(10,1/2)] = 5, got ' + eBin);
      // E[X] for sailor4 = 0
      var eSail = sail.reduce(function (a, r) {
        var pr = parseNumber(r.p).value;
        var x = parseNumber(r.x).value;
        return a + x * pr;
      }, 0);
      assert(Math.abs(eSail) < 1e-9, 'E[sailor walk t=4] = 0, got ' + eSail);
    })();
  }
})();
