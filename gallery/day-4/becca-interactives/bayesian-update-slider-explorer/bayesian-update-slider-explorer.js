(function () {
  'use strict';

  // =========================================================================
  // BAYESIAN UPDATE SLIDER EXPLORER (W30) — embeddable widget
  //
  // Segment 8.1 Activity 10. Three sliders (prior P(D), sensitivity P(+|D),
  // FPR P(+|¬D)) feed two synchronized views of the Bayes posterior P(D|+):
  //   • an algebraic view (live formula with values plugged in)
  //   • a frequency-grid view (1000-dot 40×25 grid color-coded by D × +)
  // A "Pin snapshot" affordance enables side-by-side comparison so students
  // can isolate the role-of-the-prior, FPR-sweep, etc.
  //
  // URL parameters (read once at mount): ?prior=…&sens=…&fpr=… prefill the
  // sliders. Per-instance `data-problem.defaultPreset` overrides URL params.
  // =========================================================================

  let widgetSeq = 0;

  const PRESETS = {
    laura: {
      label: 'Laura — Honor Council (prior 6.25%, sens 0.90, FPR 0.05)',
      prior: 0.0625, sens: 0.90, fpr: 0.05
    },
    mammogram: {
      label: 'Mammogram (prior 1%, sens 0.90, FPR 0.05)',
      prior: 0.01, sens: 0.90, fpr: 0.05
    },
    lowPrior: {
      label: 'Low-prior screening (prior 0.1%, sens 0.95, FPR 0.05)',
      prior: 0.001, sens: 0.95, fpr: 0.05
    }
  };

  function clamp01(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(1, n));
  }

  function fmtFraction(v, places) {
    const p = (places == null) ? 4 : places;
    let s = (Number(v) || 0).toFixed(p);
    s = s.replace(/0+$/, '').replace(/\.$/, '');
    if (s === '' || s === '-' || s === '-.') s = '0';
    return s;
  }

  function fmtPercent(v, places) {
    return ((Number(v) || 0) * 100).toFixed(places == null ? 1 : places) + '%';
  }

  function posteriorOf(prior, sens, fpr) {
    const num = sens * prior;
    const denom = sens * prior + fpr * (1 - prior);
    return denom > 0 ? num / denom : 0;
  }

  function makeSpan(cls, text) {
    const s = document.createElement('span');
    s.className = cls;
    s.textContent = text;
    return s;
  }

  function makeFrac(numText, denomText) {
    const f = document.createElement('div');
    f.className = 'bus-frac';
    const n = document.createElement('div');
    n.className = 'bus-frac-num';
    n.textContent = numText;
    const bar = document.createElement('div');
    bar.className = 'bus-frac-bar';
    const d = document.createElement('div');
    d.className = 'bus-frac-denom';
    d.textContent = denomText;
    f.appendChild(n);
    f.appendChild(bar);
    f.appendChild(d);
    return f;
  }

  function mountWidget(root) {
    let problem = {};
    try {
      problem = JSON.parse(root.dataset.problem || '{}');
    } catch (e) {
      console.error('bayesian-update-slider-explorer: invalid data-problem JSON', e);
    }

    const titleText = (typeof problem.title === 'string' && problem.title.length)
      ? problem.title : 'Bayesian-Update Slider Explorer';
    const introHtml = (typeof problem.intro === 'string') ? problem.intro : '';

    widgetSeq++;
    const instanceId = 'bus-' + widgetSeq;

    // ── State ────────────────────────────────────────────────────────────
    let prior = 0.0625, sens = 0.90, fpr = 0.05;
    let presetKey = 'laura';
    let pinned = null;  // { prior, sens, fpr } | null

    // URL-param prefill (shared across all instances on the page).
    try {
      const params = new URLSearchParams(window.location.search);
      let touched = false;
      if (params.has('prior')) { prior = clamp01(params.get('prior')); touched = true; }
      if (params.has('sens'))  { sens  = clamp01(params.get('sens'));  touched = true; }
      if (params.has('fpr'))   { fpr   = clamp01(params.get('fpr'));   touched = true; }
      if (touched) presetKey = '__custom__';
    } catch (e) { /* no-op */ }

    // Per-instance defaultPreset overrides URL params.
    if (problem.defaultPreset && PRESETS[problem.defaultPreset]) {
      const p = PRESETS[problem.defaultPreset];
      prior = p.prior; sens = p.sens; fpr = p.fpr;
      presetKey = problem.defaultPreset;
    }

    // ── DOM scaffold ─────────────────────────────────────────────────────
    root.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'bus-header';
    {
      const h = document.createElement('h2');
      h.appendChild(document.createTextNode(titleText + ' '));
      h.appendChild(makeSpan('bus-subtitle', 'move the sliders · watch the posterior'));
      header.appendChild(h);
    }
    root.appendChild(header);

    if (introHtml) {
      const intro = document.createElement('div');
      intro.className = 'bus-intro';
      intro.innerHTML = introHtml;
      root.appendChild(intro);
    }

    // Controls row.
    const controls = document.createElement('div');
    controls.className = 'bus-controls';

    const presetGroup = document.createElement('div');
    presetGroup.className = 'bus-preset-group';
    const presetLabel = document.createElement('label');
    presetLabel.className = 'bus-form-label';
    presetLabel.htmlFor = instanceId + '-preset';
    presetLabel.textContent = 'preset:';
    const presetSelect = document.createElement('select');
    presetSelect.id = instanceId + '-preset';
    presetSelect.className = 'bus-preset-select';
    Object.keys(PRESETS).forEach(key => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = PRESETS[key].label;
      if (key === presetKey) opt.selected = true;
      presetSelect.appendChild(opt);
    });
    presetGroup.appendChild(presetLabel);
    presetGroup.appendChild(presetSelect);
    controls.appendChild(presetGroup);

    const actionsRight = document.createElement('div');
    actionsRight.className = 'bus-actions-right';
    const pinBtn = document.createElement('button');
    pinBtn.type = 'button';
    pinBtn.className = 'bus-pin-btn';
    pinBtn.textContent = 'Pin snapshot';
    pinBtn.title = 'Save the current slider values; move sliders to compare.';
    actionsRight.appendChild(pinBtn);
    const clearPinBtn = document.createElement('button');
    clearPinBtn.type = 'button';
    clearPinBtn.className = 'bus-clear-pin-btn';
    clearPinBtn.textContent = 'Clear';
    clearPinBtn.style.display = 'none';
    actionsRight.appendChild(clearPinBtn);
    controls.appendChild(actionsRight);
    root.appendChild(controls);

    // Sliders.
    const slidersWrap = document.createElement('div');
    slidersWrap.className = 'bus-sliders';

    function makeSliderRow(labelHtml, sublabel, initialValue, ariaLabel) {
      const row = document.createElement('div');
      row.className = 'bus-slider-row';
      const lbl = document.createElement('div');
      lbl.className = 'bus-slider-label';
      lbl.innerHTML = labelHtml + '<small>' + sublabel + '</small>';
      const sli = document.createElement('input');
      sli.type = 'range';
      sli.className = 'bus-slider';
      sli.min = '0'; sli.max = '1'; sli.step = '0.01';
      sli.value = String(initialValue);
      sli.setAttribute('aria-label', ariaLabel);
      const val = document.createElement('div');
      val.className = 'bus-slider-value';
      val.textContent = Number(initialValue).toFixed(2);
      row.appendChild(lbl);
      row.appendChild(sli);
      row.appendChild(val);
      slidersWrap.appendChild(row);
      return { row: row, slider: sli, valueEl: val };
    }
    const priorRow = makeSliderRow(
      'Prior P(D)', 'before observing the test', prior,
      'prior probability — base rate before observing any test result');
    const sensRow = makeSliderRow(
      'Sensitivity P(+ | D)', 'true-positive rate', sens,
      'sensitivity — probability the test fires positive given D');
    const fprRow = makeSliderRow(
      'FPR P(+ | ¬D)', 'false-positive rate', fpr,
      'false-positive rate — probability the test fires positive given not D');
    root.appendChild(slidersWrap);

    // Two-pane main.
    const main = document.createElement('div');
    main.className = 'bus-main';

    const algPane = document.createElement('div');
    algPane.className = 'bus-pane bus-pane-algebraic';
    algPane.appendChild(makeSpan('bus-pane-title', 'Algebraic view'));
    const posteriorCard = document.createElement('div');
    posteriorCard.className = 'bus-posterior-card';
    posteriorCard.appendChild(makeSpan('bus-posterior-card-title', 'Posterior P(D | +)'));
    const posteriorValueEl = document.createElement('div');
    posteriorValueEl.className = 'bus-posterior-value';
    posteriorValueEl.textContent = '—';
    posteriorCard.appendChild(posteriorValueEl);
    const posteriorPercentEl = document.createElement('div');
    posteriorPercentEl.className = 'bus-posterior-percent';
    posteriorPercentEl.textContent = '—';
    posteriorCard.appendChild(posteriorPercentEl);
    algPane.appendChild(posteriorCard);
    const formulaCard = document.createElement('div');
    formulaCard.className = 'bus-formula-card';
    algPane.appendChild(formulaCard);
    main.appendChild(algPane);

    const gridPane = document.createElement('div');
    gridPane.className = 'bus-pane bus-pane-grid';
    gridPane.appendChild(makeSpan('bus-pane-title', 'Frequency grid (N = 1000)'));
    const gridWrap = document.createElement('div');
    gridWrap.className = 'bus-grid-wrap';
    const grid = document.createElement('div');
    grid.className = 'bus-grid';
    // Pre-create 1000 dots in row-major order; renderGrid() updates classes.
    const dots = [];
    for (let i = 0; i < 1000; i++) {
      const d = document.createElement('div');
      d.className = 'bus-dot';
      grid.appendChild(d);
      dots.push(d);
    }
    gridWrap.appendChild(grid);
    const legend = document.createElement('div');
    legend.className = 'bus-grid-legend';
    legend.innerHTML =
      '<span class="bus-legend-item"><span class="bus-legend-swatch" style="background:var(--bus-purple)"></span>D ∩ + (true positive)</span>' +
      '<span class="bus-legend-item"><span class="bus-legend-swatch" style="background:var(--bus-purple-dim);border:1px solid var(--bus-purple)"></span>D ∩ − (false negative)</span>' +
      '<span class="bus-legend-item"><span class="bus-legend-swatch" style="background:var(--bus-blue)"></span>¬D ∩ + (false positive)</span>' +
      '<span class="bus-legend-item"><span class="bus-legend-swatch" style="background:rgba(26,22,18,0.10)"></span>¬D ∩ − (true negative)</span>';
    gridWrap.appendChild(legend);
    const counts = document.createElement('div');
    counts.className = 'bus-counts';
    gridWrap.appendChild(counts);
    gridPane.appendChild(gridWrap);
    main.appendChild(gridPane);

    root.appendChild(main);

    // Compare card (hidden until pinned).
    const compareCard = document.createElement('div');
    compareCard.className = 'bus-compare';
    root.appendChild(compareCard);

    // ── Render ───────────────────────────────────────────────────────────
    function renderSliders() {
      priorRow.slider.value = String(prior);
      sensRow.slider.value = String(sens);
      fprRow.slider.value = String(fpr);
      priorRow.valueEl.textContent = prior.toFixed(2);
      sensRow.valueEl.textContent = sens.toFixed(2);
      fprRow.valueEl.textContent = fpr.toFixed(2);
    }

    function renderAlgebraic() {
      const num = sens * prior;
      const denom = sens * prior + fpr * (1 - prior);
      const post = denom > 0 ? num / denom : 0;
      posteriorValueEl.textContent = fmtFraction(post, 4);
      posteriorPercentEl.textContent = fmtPercent(post, 1);

      formulaCard.innerHTML = '';

      // Symbolic.
      const symRow = document.createElement('div');
      symRow.className = 'bus-formula-row';
      symRow.appendChild(makeFrac('P(+|D)·P(D)', 'P(+|D)·P(D) + P(+|¬D)·P(¬D)'));
      formulaCard.appendChild(symRow);

      // Numeric substitution.
      const numRow = document.createElement('div');
      numRow.className = 'bus-formula-row';
      numRow.appendChild(makeSpan('bus-formula-symbolic', '='));
      const subFrac = makeFrac(
        sens.toFixed(2) + ' · ' + prior.toFixed(2),
        sens.toFixed(2) + ' · ' + prior.toFixed(2) + ' + ' +
          fpr.toFixed(2) + ' · ' + (1 - prior).toFixed(2)
      );
      subFrac.classList.add('bus-formula-numeric');
      numRow.appendChild(subFrac);
      formulaCard.appendChild(numRow);

      // Numeric simplified.
      const simpRow = document.createElement('div');
      simpRow.className = 'bus-formula-row';
      simpRow.appendChild(makeSpan('bus-formula-symbolic', '='));
      const simpFrac = makeFrac(fmtFraction(num, 4), fmtFraction(denom, 4));
      simpFrac.classList.add('bus-formula-numeric');
      simpRow.appendChild(simpFrac);
      simpRow.appendChild(makeSpan('bus-formula-symbolic', '≈'));
      simpRow.appendChild(makeSpan('bus-formula-result', fmtFraction(post, 4)));
      simpRow.appendChild(makeSpan('bus-formula-symbolic', '(' + fmtPercent(post, 1) + ')'));
      formulaCard.appendChild(simpRow);
    }

    function renderGrid() {
      const N = 1000;
      const nD = Math.round(prior * N);
      const nNotD = N - nD;
      const nDpos = Math.round(nD * sens);
      const nDneg = nD - nDpos;
      const nNotDpos = Math.round(nNotD * fpr);
      const nNotDneg = nNotD - nNotDpos;

      let i = 0;
      function paint(count, cls) {
        const end = Math.min(N, i + count);
        for (; i < end; i++) dots[i].className = 'bus-dot ' + cls;
      }
      paint(nDpos, 'bus-dot-tp');
      paint(nDneg, 'bus-dot-fn');
      paint(nNotDpos, 'bus-dot-fp');
      paint(nNotDneg, 'bus-dot-tn');
      while (i < N) { dots[i].className = 'bus-dot bus-dot-tn'; i++; }

      const totalPos = nDpos + nNotDpos;
      const post = totalPos > 0 ? nDpos / totalPos : 0;
      counts.innerHTML = '';
      function addRow(label, value, isPosterior) {
        const lblEl = document.createElement('span');
        lblEl.className = 'bus-count-label' + (isPosterior ? ' bus-count-posterior-label' : '');
        lblEl.textContent = label;
        const valEl = document.createElement('span');
        valEl.className = 'bus-count-value' + (isPosterior ? ' bus-count-posterior-value' : '');
        valEl.textContent = value;
        counts.appendChild(lblEl);
        counts.appendChild(valEl);
      }
      addRow('D total (have the condition)', String(nD));
      addRow('+ total (test fires positive)', String(totalPos));
      addRow('D ∩ + (true positives)', String(nDpos));
      addRow('¬D ∩ + (false positives)', String(nNotDpos));
      addRow('posterior ≈ ' + nDpos + ' / ' + totalPos,
        totalPos > 0 ? fmtFraction(post, 3) : '—', true);
    }

    function renderCompare() {
      compareCard.innerHTML = '';
      if (!pinned) {
        compareCard.classList.remove('bus-compare-on');
        clearPinBtn.style.display = 'none';
        pinBtn.classList.remove('bus-pinned');
        pinBtn.textContent = 'Pin snapshot';
        return;
      }
      compareCard.classList.add('bus-compare-on');
      clearPinBtn.style.display = '';
      pinBtn.classList.add('bus-pinned');
      pinBtn.textContent = 'Update pin';

      const pinPost = posteriorOf(pinned.prior, pinned.sens, pinned.fpr);
      const curPost = posteriorOf(prior, sens, fpr);
      const delta = curPost - pinPost;
      const sign = delta >= 0 ? '+' : '−';

      compareCard.appendChild(makeSpan('bus-compare-title', 'Compare snapshot'));
      const grid = document.createElement('div');
      grid.className = 'bus-compare-grid';

      function makeCell(title, p, s, f, post) {
        const cell = document.createElement('div');
        cell.className = 'bus-compare-cell';
        cell.appendChild(makeSpan('bus-compare-cell-title', title));
        const params = document.createElement('div');
        params.className = 'bus-compare-params';
        params.textContent = 'prior ' + p.toFixed(2) +
          ' · sens ' + s.toFixed(2) +
          ' · FPR ' + f.toFixed(2);
        cell.appendChild(params);
        const ppost = document.createElement('div');
        ppost.className = 'bus-compare-posterior';
        ppost.textContent = 'P(D | +) ≈ ' + fmtFraction(post, 3) +
          ' (' + fmtPercent(post, 1) + ')';
        cell.appendChild(ppost);
        return cell;
      }
      grid.appendChild(makeCell('Pinned', pinned.prior, pinned.sens, pinned.fpr, pinPost));
      grid.appendChild(makeSpan('bus-compare-arrow', '→'));
      grid.appendChild(makeCell('Current', prior, sens, fpr, curPost));
      compareCard.appendChild(grid);

      const deltaEl = document.createElement('div');
      deltaEl.className = 'bus-compare-delta';
      deltaEl.textContent = 'Change in posterior: ' + sign +
        fmtFraction(Math.abs(delta), 3) + ' (' +
        sign + fmtPercent(Math.abs(delta), 1) + ')';
      compareCard.appendChild(deltaEl);
    }

    function renderAll() {
      renderSliders();
      renderAlgebraic();
      renderGrid();
      renderCompare();
    }

    // ── Wire control events ──────────────────────────────────────────────
    function onSliderInput() {
      prior = clamp01(priorRow.slider.value);
      sens  = clamp01(sensRow.slider.value);
      fpr   = clamp01(fprRow.slider.value);
      presetKey = '__custom__';
      presetSelect.value = '';
      renderAll();
    }
    priorRow.slider.addEventListener('input', onSliderInput);
    sensRow.slider.addEventListener('input', onSliderInput);
    fprRow.slider.addEventListener('input', onSliderInput);

    presetSelect.addEventListener('change', () => {
      const k = presetSelect.value;
      if (!PRESETS[k]) return;
      const p = PRESETS[k];
      prior = p.prior; sens = p.sens; fpr = p.fpr;
      presetKey = k;
      renderAll();
    });

    pinBtn.addEventListener('click', () => {
      pinned = { prior: prior, sens: sens, fpr: fpr };
      renderCompare();
    });
    clearPinBtn.addEventListener('click', () => {
      pinned = null;
      renderCompare();
    });

    renderAll();
  }

  function bootAll() {
    document.querySelectorAll('.bus-widget').forEach(root => {
      if (root.dataset.busMounted === '1') return;
      root.dataset.busMounted = '1';
      mountWidget(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAll);
  } else {
    bootAll();
  }
}());
