(function () {
  'use strict';

  // =========================================================================
  // STARS-AND-BARS DISTRIBUTION BUILDER (W28) — embeddable widget
  //
  // A row of k+n-1 slots, each a star or a bar. Bars are draggable; the same
  // selection (= bar positions) is rendered three different ways:
  //   - Scooper:   stars are colored ice-cream scoops, bars are wash gaps;
  //                downstream a stacked cone shows the resulting scoops.
  //   - Slushy:    stars are filled cups, bars are advance arrows; downstream
  //                n colored stations show how many cups went to each color.
  //   - Bijection: stars are *, bars are |; downstream the literal string +
  //                length annotation.
  // Prev / Next walk the lex-ordered configurations, exposing the count
  // C(k+n-1, n-1) by enumeration. "Show count" reveals the formula.
  // =========================================================================

  const SVG_NS = 'http://www.w3.org/2000/svg';
  let widgetSeq = 0;

  // Ice-cream-flavor palette. The first 5 are the canonical 2020 scooper
  // example; remaining 5 extend so n up to 10 is meaningful.
  const SCOOPER_COLORS = [
    { name: 'Chocolate',   fill: '#6b3e1f', text: '#fff' },
    { name: 'Vanilla',     fill: '#f4e3b8', text: '#3d342a' },
    { name: 'Strawberry',  fill: '#d96389', text: '#fff' },
    { name: 'Pistachio',   fill: '#8db871', text: '#fff' },
    { name: 'Black Rasp',  fill: '#6f3970', text: '#fff' },
    { name: 'Mint Chip',   fill: '#66c2a5', text: '#fff' },
    { name: 'Coffee',      fill: '#8b6f47', text: '#fff' },
    { name: 'Lemon',       fill: '#f4d03f', text: '#3d342a' },
    { name: 'Blueberry',   fill: '#4a78c2', text: '#fff' },
    { name: 'Mango',       fill: '#e89e2d', text: '#fff' }
  ];
  // Slushy palette. The first 4 are the canonical 2026 slushy example.
  const SLUSHY_COLORS = [
    { name: 'Red',     fill: '#d24747', text: '#fff' },
    { name: 'Blue',    fill: '#4a78c2', text: '#fff' },
    { name: 'Purple',  fill: '#7b4daa', text: '#fff' },
    { name: 'Orange',  fill: '#e89e2d', text: '#fff' },
    { name: 'Green',   fill: '#4a9b6f', text: '#fff' },
    { name: 'Yellow',  fill: '#f4d03f', text: '#3d342a' },
    { name: 'Cyan',    fill: '#5dade2', text: '#fff' },
    { name: 'Magenta', fill: '#c4506e', text: '#fff' },
    { name: 'Lime',    fill: '#8db871', text: '#fff' },
    { name: 'Teal',    fill: '#3a7d6e', text: '#fff' }
  ];

  // ── Combinatorics helpers ───────────────────────────────────────────────
  function binom(n, k) {
    if (k < 0 || k > n) return 0;
    if (k === 0 || k === n) return 1;
    if (k > n - k) k = n - k;
    let r = 1;
    for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
    return Math.round(r);
  }

  // Bars at the leftmost slots: e.g. k=3, n=5 → [0,1,2,3] (n-1 bars).
  // This is the lex-first configuration, so the rank indicator reads
  // "1 of N" on initial load — matching natural user expectation.
  function initialPositions(k, n) {
    const m = n - 1;
    const arr = [];
    for (let i = 0; i < m; i++) arr.push(i);
    return arr;
  }

  // Lexicographically next combination. Returns wrap-to-first if at end.
  function nextConfig(positions, totalSlots) {
    const m = positions.length;
    const arr = positions.slice().sort((a, b) => a - b);
    let i = m - 1;
    // Find rightmost index that can be incremented.
    while (i >= 0 && arr[i] === totalSlots - 1 - (m - 1 - i)) i--;
    if (i < 0) {
      const first = [];
      for (let j = 0; j < m; j++) first.push(j);
      return first;
    }
    arr[i]++;
    for (let j = i + 1; j < m; j++) arr[j] = arr[j - 1] + 1;
    return arr;
  }

  // Lexicographically previous combination. Wrap to last if at start.
  function prevConfig(positions, totalSlots) {
    const m = positions.length;
    const arr = positions.slice().sort((a, b) => a - b);
    let i = m - 1;
    while (i >= 0) {
      const minVal = i === 0 ? 0 : arr[i - 1] + 1;
      if (arr[i] > minVal) {
        arr[i]--;
        for (let j = i + 1; j < m; j++) arr[j] = totalSlots - 1 - (m - 1 - j);
        return arr;
      }
      i--;
    }
    const last = [];
    for (let j = 0; j < m; j++) last.push(totalSlots - 1 - (m - 1 - j));
    return last;
  }

  // Lex rank of the current combination (0-indexed).
  function lexRank(positions, totalSlots) {
    const m = positions.length;
    if (m === 0) return 0;
    const arr = positions.slice().sort((a, b) => a - b);
    let rank = 0;
    let prev = -1;
    for (let i = 0; i < m; i++) {
      for (let v = prev + 1; v < arr[i]; v++) {
        rank += binom(totalSlots - 1 - v, m - 1 - i);
      }
      prev = arr[i];
    }
    return rank;
  }

  // Per-kind counts: for each kind 0..n-1, how many stars fall in that kind's
  // segment of the row (the segment between bar i-1 and bar i).
  function multisetFromBars(positions, k, n) {
    const counts = new Array(n).fill(0);
    const sorted = positions.slice().sort((a, b) => a - b);
    let lastBar = -1;
    for (let i = 0; i < sorted.length; i++) {
      counts[i] = sorted[i] - lastBar - 1;
      lastBar = sorted[i];
    }
    counts[n - 1] = (k + n - 1) - lastBar - 1;
    return counts;
  }

  function svgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    if (attrs) for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  // ── Mount ────────────────────────────────────────────────────────────────
  function mountWidget(root) {
    let problem = {};
    try {
      problem = JSON.parse(root.dataset.problem || '{}');
    } catch (e) {
      console.error('stars-and-bars-builder: invalid data-problem JSON', e);
    }

    const titleText = (typeof problem.title === 'string' && problem.title.length)
      ? problem.title : 'Stars-and-Bars Distribution Builder';
    const introHtml = (typeof problem.intro === 'string') ? problem.intro : '';
    const minK = Number.isFinite(problem.minK) ? problem.minK : 0;
    const maxK = Number.isFinite(problem.maxK) ? problem.maxK : 12;
    const minN = Number.isFinite(problem.minN) ? problem.minN : 1;
    const maxN = Number.isFinite(problem.maxN) ? problem.maxN : 10;
    let k = Number.isFinite(problem.defaultK) ? problem.defaultK : 3;
    let n = Number.isFinite(problem.defaultN) ? problem.defaultN : 5;
    k = Math.max(minK, Math.min(maxK, k));
    n = Math.max(minN, Math.min(maxN, n));
    const validModes = ['scooper', 'slushy', 'bijection'];
    let mode = validModes.includes(problem.defaultMode) ? problem.defaultMode : 'scooper';
    let barPositions = initialPositions(k, n);
    let countShown = false;
    let drag = null;
    // Practice-mode bookkeeping. If problem.practiceProblems is provided
    // (non-empty array), the widget exposes a Watch / Practice learn-mode
    // toggle. In Practice mode the student must set the k and n sliders to
    // match the current problem before the visualization unlocks.
    const practiceProblems = Array.isArray(problem.practiceProblems)
      ? problem.practiceProblems.filter(p =>
          Number.isFinite(p && p.k) && Number.isFinite(p && p.n) &&
          typeof p.statement === 'string' && p.statement.length > 0)
      : [];
    let learnMode = (practiceProblems.length > 0
      && problem.defaultLearnMode !== 'watch') ? 'practice' : 'watch';
    let practiceIdx = 0;
    let practiceHintShown = false;
    function currentProblem() {
      if (practiceProblems.length === 0) return null;
      const p = practiceProblems[practiceIdx % practiceProblems.length];
      return p;
    }
    function isPracticeSolved() {
      const p = currentProblem();
      if (!p) return true;
      return k === p.k && n === p.n;
    }

    widgetSeq++;
    const instanceId = 'sb-' + widgetSeq;

    // ── Build DOM scaffold ─────────────────────────────────────────────────
    root.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'sb-header';
    {
      const h = document.createElement('h2');
      h.appendChild(document.createTextNode(titleText + ' '));
      const sub = document.createElement('span');
      sub.className = 'sb-subtitle';
      sub.textContent = 'three framings, one configuration';
      h.appendChild(sub);
      header.appendChild(h);
    }
    root.appendChild(header);

    if (introHtml) {
      const intro = document.createElement('div');
      intro.className = 'sb-intro';
      intro.innerHTML = introHtml;
      root.appendChild(intro);
    }

    // ── Learn-mode toggle (Watch / Practice) — only when problems exist ───
    let learnToggle = null;
    let learnBtns = {};
    if (practiceProblems.length > 0) {
      const learnRow = document.createElement('div');
      learnRow.className = 'sb-learn-row';
      const learnLabel = document.createElement('span');
      learnLabel.className = 'sb-form-label';
      learnLabel.textContent = 'mode:';
      learnRow.appendChild(learnLabel);
      learnToggle = document.createElement('div');
      learnToggle.className = 'sb-mode-toggle sb-learn-toggle';
      [
        { key: 'watch', label: 'Watch', title: 'Free exploration with sliders.' },
        { key: 'practice', label: 'Practice', title: 'Given a scenario, set k and n.' }
      ].forEach(({ key, label, title }) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = label;
        b.title = title;
        learnBtns[key] = b;
        learnToggle.appendChild(b);
      });
      learnRow.appendChild(learnToggle);
      root.appendChild(learnRow);
    }

    // ── Practice panel ────────────────────────────────────────────────────
    let practicePanel = null;
    let practiceStatement = null;
    let practiceCounter = null;
    let practiceStatus = null;
    let hintBtn = null;
    let showSolutionBtn = null;
    let nextProblemBtn = null;
    if (practiceProblems.length > 0) {
      practicePanel = document.createElement('div');
      practicePanel.className = 'sb-practice-panel';

      const head = document.createElement('div');
      head.className = 'sb-practice-head';
      practiceCounter = document.createElement('span');
      practiceCounter.className = 'sb-practice-counter';
      head.appendChild(practiceCounter);
      practicePanel.appendChild(head);

      practiceStatement = document.createElement('div');
      practiceStatement.className = 'sb-practice-statement';
      practicePanel.appendChild(practiceStatement);

      practiceStatus = document.createElement('div');
      practiceStatus.className = 'sb-practice-status';
      practicePanel.appendChild(practiceStatus);

      const ctrls = document.createElement('div');
      ctrls.className = 'sb-practice-ctrls';
      hintBtn = document.createElement('button');
      hintBtn.type = 'button';
      hintBtn.className = 'sb-practice-btn';
      hintBtn.textContent = 'Hint';
      showSolutionBtn = document.createElement('button');
      showSolutionBtn.type = 'button';
      showSolutionBtn.className = 'sb-practice-btn';
      showSolutionBtn.textContent = 'Show solution';
      nextProblemBtn = document.createElement('button');
      nextProblemBtn.type = 'button';
      nextProblemBtn.className = 'sb-practice-btn sb-practice-next';
      nextProblemBtn.textContent = 'Next problem →';
      ctrls.appendChild(hintBtn);
      ctrls.appendChild(showSolutionBtn);
      ctrls.appendChild(nextProblemBtn);
      practicePanel.appendChild(ctrls);

      root.appendChild(practicePanel);
    }

    // ── Controls ───────────────────────────────────────────────────────────
    const controls = document.createElement('div');
    controls.className = 'sb-controls';

    function makeSlider(labelHtml, idSuffix, min, max, value) {
      const grp = document.createElement('div');
      grp.className = 'sb-slider-group';
      const lbl = document.createElement('label');
      lbl.htmlFor = instanceId + '-' + idSuffix;
      lbl.innerHTML = labelHtml;
      const inp = document.createElement('input');
      inp.id = instanceId + '-' + idSuffix;
      inp.type = 'range';
      inp.min = String(min);
      inp.max = String(max);
      inp.value = String(value);
      const out = document.createElement('span');
      out.className = 'sb-slider-value';
      out.textContent = String(value);
      grp.appendChild(lbl);
      grp.appendChild(inp);
      grp.appendChild(out);
      return { group: grp, input: inp, output: out, label: lbl };
    }

    const slidersRow = document.createElement('div');
    slidersRow.className = 'sb-controls-row sb-sliders-row';
    // The first slider is always stars (= k objects in Watch labels);
    // the second is bars (= n − 1) in Practice mode and types (= n) in
    // Watch mode. Default labels are Watch; renderControls adjusts them.
    const kSlider = makeSlider('<i>k</i> = objects', 'k', minK, maxK, k);
    const nSlider = makeSlider('<i>n</i> = types', 'n', minN, maxN, n);
    slidersRow.appendChild(kSlider.group);
    slidersRow.appendChild(nSlider.group);
    controls.appendChild(slidersRow);

    const modeRow = document.createElement('div');
    modeRow.className = 'sb-controls-row sb-mode-row';

    const modeToggleLabel = document.createElement('span');
    modeToggleLabel.className = 'sb-form-label';
    modeToggleLabel.textContent = 'view:';
    modeRow.appendChild(modeToggleLabel);

    const modeToggle = document.createElement('div');
    modeToggle.className = 'sb-mode-toggle';
    const modeBtns = {};
    [
      { key: 'scooper',   label: 'Scooper' },
      { key: 'slushy',    label: 'Slushy' },
      { key: 'bijection', label: 'Bijection' }
    ].forEach(({ key, label }) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      modeBtns[key] = b;
      modeToggle.appendChild(b);
    });
    modeRow.appendChild(modeToggle);

    const navGroup = document.createElement('div');
    navGroup.className = 'sb-nav-group';
    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'sb-nav-btn';
    prevBtn.textContent = '← Prev';
    const configIndicator = document.createElement('span');
    configIndicator.className = 'sb-config-indicator';
    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'sb-nav-btn';
    nextBtn.textContent = 'Next →';
    navGroup.appendChild(prevBtn);
    navGroup.appendChild(configIndicator);
    navGroup.appendChild(nextBtn);
    modeRow.appendChild(navGroup);

    const countBtn = document.createElement('button');
    countBtn.type = 'button';
    countBtn.className = 'sb-count-btn';
    countBtn.textContent = 'Show count';
    modeRow.appendChild(countBtn);

    controls.appendChild(modeRow);
    root.appendChild(controls);

    // ── Slot row + downstream + tally + count ──────────────────────────────
    const slotRowWrap = document.createElement('div');
    slotRowWrap.className = 'sb-slot-row-wrap';
    const slotRowLabel = document.createElement('div');
    slotRowLabel.className = 'sb-slot-row-label';
    slotRowLabel.textContent = 'drag bars to rearrange:';
    slotRowWrap.appendChild(slotRowLabel);
    const slotRow = document.createElement('div');
    slotRow.className = 'sb-slot-row';
    slotRowWrap.appendChild(slotRow);
    root.appendChild(slotRowWrap);

    const downstream = document.createElement('div');
    downstream.className = 'sb-downstream';
    root.appendChild(downstream);

    const tally = document.createElement('div');
    tally.className = 'sb-tally';
    root.appendChild(tally);

    const countPanel = document.createElement('div');
    countPanel.className = 'sb-count-panel';
    root.appendChild(countPanel);

    // ── Helpers ────────────────────────────────────────────────────────────
    function totalSlots() { return k + n - 1; }
    function totalConfigs() { return binom(k + n - 1, n - 1); }
    function getPalette() {
      return mode === 'slushy' ? SLUSHY_COLORS : SCOOPER_COLORS;
    }
    function isBarAt(idx) {
      for (let i = 0; i < barPositions.length; i++) {
        if (barPositions[i] === idx) return true;
      }
      return false;
    }

    // ── Render ─────────────────────────────────────────────────────────────
    function renderAll() {
      renderLearnToggle();
      renderPractice();
      renderControls();
      renderSlotRow();
      renderDownstream();
      renderTally();
      renderCount();
      applyPracticeGating();
    }

    function renderLearnToggle() {
      if (!learnToggle) return;
      Object.keys(learnBtns).forEach(key => {
        learnBtns[key].classList.toggle('sb-active', learnMode === key);
      });
    }

    function renderPractice() {
      if (!practicePanel) return;
      practicePanel.style.display = (learnMode === 'practice') ? '' : 'none';
      if (learnMode !== 'practice') return;
      const p = currentProblem();
      practiceCounter.textContent = 'Problem ' + (practiceIdx + 1) + ' of ' + practiceProblems.length;
      practiceStatement.textContent = p.statement;
      // Practice compares the underlying (k, n) state against the
      // expected values; the student manipulates them via the
      // stars/bars sliders.
      const expK = p.k, expN = p.n;
      const expBars = expN - 1;
      const objLbl = p.objectsLabel || 'objects';
      const typLbl = p.typesLabel || 'types';
      practiceStatus.classList.remove('sb-status-right', 'sb-status-wrong', 'sb-status-hint');
      if (k === expK && n === expN) {
        const tot = binom(expK + expN - 1, expN - 1);
        practiceStatus.classList.add('sb-status-right');
        practiceStatus.innerHTML =
          '<strong>✓ Right!</strong> ' +
          '<span class="sb-status-detail">' + expK + ' stars (the ' + expK + ' ' + objLbl + ') and ' +
          expBars + ' bar' + (expBars === 1 ? '' : 's') + ' (one fewer than the ' + expN + ' ' + typLbl + '). ' +
          'C(' + (expK + expN - 1) + ', ' + (expN - 1) + ') = <strong>' + tot.toLocaleString() + '</strong>.</span>';
      } else if (k === expBars && (n - 1) === expK && expK !== expBars) {
        // Common error: stars-count is what bars should be, and vice versa.
        practiceStatus.classList.add('sb-status-wrong');
        practiceStatus.innerHTML =
          'Close — but you have <strong>stars</strong> and <strong>bars</strong> swapped. ' +
          '<span class="sb-status-detail">Stars and bars play different roles: stars are the things you\'re picking; bars are the dividers between types.</span>';
      } else if (k === expK) {
        practiceStatus.classList.add('sb-status-wrong');
        practiceStatus.innerHTML = '<strong>stars</strong> is right; check the number of <strong>bars</strong>.';
      } else if ((n - 1) === expBars) {
        practiceStatus.classList.add('sb-status-wrong');
        practiceStatus.innerHTML = '<strong>bars</strong> is right; check the number of <strong>stars</strong>.';
      } else {
        practiceStatus.classList.add('sb-status-wrong');
        practiceStatus.textContent = 'Set the sliders to model this problem.';
      }
      if (practiceHintShown && !(k === expK && n === expN)) {
        practiceStatus.classList.add('sb-status-hint');
        const hint = document.createElement('div');
        hint.className = 'sb-status-hint-line';
        hint.innerHTML =
          '<strong>Hint:</strong> Each <strong>star</strong> represents one of the ' + objLbl + ' you\'re picking. ' +
          '<strong>Bars</strong> are the dividers <em>between</em> types — so the number of bars is one fewer than the number of ' + typLbl + '.';
        practiceStatus.appendChild(hint);
      }
      nextProblemBtn.classList.toggle('sb-practice-next-ready', k === expK && n === expN);
      nextProblemBtn.disabled = practiceProblems.length <= 1;
    }

    function applyPracticeGating() {
      const inPractice = (learnMode === 'practice') && practicePanel;
      const solved = isPracticeSolved();
      const hide = inPractice && !solved;
      slotRowWrap.style.display = hide ? 'none' : '';
      downstream.style.display = hide ? 'none' : '';
      tally.style.display = hide ? 'none' : '';
      countPanel.style.display = hide ? 'none' : '';
      // Hide view-mode + nav controls in unsolved practice.
      modeRow.style.display = hide ? 'none' : '';
      // In practice mode, auto-show the count once solved.
      if (inPractice && solved && !countShown) {
        countShown = true;
        renderCount();
      }
    }

    function renderControls() {
      // Slider labels and bounds depend on learnMode. In Practice the
      // student sees the abstraction layer (stars and bars) — they have
      // to map the problem onto stars/bars themselves. In Watch they see
      // the formula's variables (k objects, n types) directly.
      if (learnMode === 'practice') {
        kSlider.label.innerHTML = '<i>stars</i>';
        nSlider.label.innerHTML = '<i>bars</i>';
        kSlider.input.min = String(minK);
        kSlider.input.max = String(maxK);
        nSlider.input.min = String(Math.max(0, minN - 1));
        nSlider.input.max = String(Math.max(0, maxN - 1));
        kSlider.input.value = String(k);
        kSlider.output.textContent = String(k);
        nSlider.input.value = String(n - 1);
        nSlider.output.textContent = String(n - 1);
      } else {
        kSlider.label.innerHTML = '<i>k</i> = objects';
        nSlider.label.innerHTML = '<i>n</i> = types';
        kSlider.input.min = String(minK);
        kSlider.input.max = String(maxK);
        nSlider.input.min = String(minN);
        nSlider.input.max = String(maxN);
        kSlider.input.value = String(k);
        kSlider.output.textContent = String(k);
        nSlider.input.value = String(n);
        nSlider.output.textContent = String(n);
      }
      Object.keys(modeBtns).forEach(key => {
        modeBtns[key].classList.toggle('sb-active', mode === key);
      });
      const total = totalConfigs();
      if (total <= 0) {
        configIndicator.textContent = '0 of 0';
      } else {
        const rank = lexRank(barPositions, totalSlots()) + 1;
        configIndicator.textContent = rank + ' of ' + total;
      }
      prevBtn.disabled = total <= 1;
      nextBtn.disabled = total <= 1;
    }

    function createBarPiece() {
      const p = document.createElement('div');
      p.className = 'sb-bar-piece sb-bar-' + mode;
      p.setAttribute('role', 'button');
      p.setAttribute('tabindex', '0');
      p.setAttribute('aria-label', 'bar — drag to a new slot');
      if (mode === 'scooper') {
        p.innerHTML = '' +
          '<svg viewBox="0 0 24 56" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' +
          '<rect x="9" y="4" width="6" height="48" fill="#5d8aa8" rx="1.5"/>' +
          '<rect x="6" y="10" width="12" height="2" fill="#3a5a78"/>' +
          '<rect x="6" y="20" width="12" height="2" fill="#3a5a78"/>' +
          '<rect x="6" y="30" width="12" height="2" fill="#3a5a78"/>' +
          '<rect x="6" y="40" width="12" height="2" fill="#3a5a78"/>' +
          '</svg>' +
          '<span class="sb-bar-label">wash</span>';
      } else if (mode === 'slushy') {
        p.innerHTML = '' +
          '<svg viewBox="0 0 24 56" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' +
          '<path d="M 6 12 L 18 28 L 6 44" stroke="#3d342a" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
          '</svg>' +
          '<span class="sb-bar-label">advance</span>';
      } else {
        p.innerHTML = '<span class="sb-bar-glyph">|</span>';
      }
      return p;
    }

    function createStarPiece(kindIdx, palette) {
      const color = palette[kindIdx % palette.length];
      const p = document.createElement('div');
      p.className = 'sb-star-piece sb-star-' + mode;
      p.style.setProperty('--sb-fill', color.fill);
      p.style.setProperty('--sb-text', color.text);
      if (mode === 'scooper') {
        p.innerHTML = '' +
          '<svg viewBox="0 0 56 56" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' +
          '<circle cx="28" cy="28" r="20" fill="' + color.fill + '" stroke="#3d342a" stroke-width="1.4"/>' +
          '<circle cx="22" cy="22" r="4.5" fill="rgba(255,255,255,0.45)"/>' +
          '</svg>';
      } else if (mode === 'slushy') {
        p.innerHTML = '' +
          '<svg viewBox="0 0 56 56" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' +
          '<path d="M 12 8 L 44 8 L 40 50 L 16 50 Z" fill="#fff" stroke="#3d342a" stroke-width="1.4"/>' +
          '<path d="M 16 14 L 40 14 L 37 47 L 19 47 Z" fill="' + color.fill + '"/>' +
          '<ellipse cx="28" cy="13" rx="11" ry="2" fill="rgba(255,255,255,0.4)"/>' +
          '</svg>';
      } else {
        p.innerHTML = '<span class="sb-star-glyph" style="color:' + color.fill + '">*</span>';
      }
      return p;
    }

    function renderSlotRow() {
      slotRow.innerHTML = '';
      slotRow.dataset.mode = mode;
      const ts = totalSlots();
      const palette = getPalette();

      if (ts === 0) {
        const empty = document.createElement('div');
        empty.className = 'sb-slot-empty';
        empty.textContent = '(empty selection — k = 0 and n = 1)';
        slotRow.appendChild(empty);
        return;
      }

      let kindIdx = 0;
      for (let i = 0; i < ts; i++) {
        const bar = isBarAt(i);
        const slot = document.createElement('div');
        slot.className = 'sb-slot' + (bar ? ' sb-slot-bar' : ' sb-slot-star');
        slot.dataset.index = String(i);
        slot.dataset.mode = mode;
        if (bar) {
          slot.appendChild(createBarPiece());
          kindIdx++;
        } else {
          slot.appendChild(createStarPiece(kindIdx, palette));
        }
        slotRow.appendChild(slot);
      }
      slotRow.querySelectorAll('.sb-bar-piece').forEach(piece => {
        piece.addEventListener('pointerdown', onBarPointerDown);
        piece.addEventListener('keydown', onBarKeyDown);
      });
    }

    function renderDownstream() {
      downstream.innerHTML = '';
      downstream.dataset.mode = mode;
      const counts = multisetFromBars(barPositions, k, n);
      const palette = getPalette();
      const ts = totalSlots();

      if (mode === 'scooper') {
        const wrap = document.createElement('div');
        wrap.className = 'sb-cone-wrap';
        // Compute scoop list: for each star slot in left-to-right order, its kind.
        const scoopList = [];
        let kIdx = 0;
        for (let i = 0; i < ts; i++) {
          if (isBarAt(i)) { kIdx++; continue; }
          scoopList.push(kIdx);
        }
        const scoopRadius = 24;
        const scoopVStep = scoopRadius * 1.55;
        const coneTopY = 230;
        // Total height: cone + scoops stacked.
        const stackHeight = scoopList.length * scoopVStep;
        const svgHeight = Math.max(360, coneTopY + 90 + stackHeight + 10);
        const svgWidth = 240;
        const svg = svgEl('svg', {
          class: 'sb-cone-svg',
          viewBox: '0 0 ' + svgWidth + ' ' + svgHeight,
          width: svgWidth,
          height: svgHeight,
          preserveAspectRatio: 'xMidYMax meet'
        });
        // Cone (waffle) at the bottom. Sized to be roughly proportional to
        // one scoop: top width ~56px (a touch wider than the 48px scoop
        // diameter so the bottom scoop nestles in), height ~75px.
        const coneHalfWidth = 28;
        const coneHeight = 75;
        const coneApexY = svgHeight - 10;
        const coneTop = coneApexY - coneHeight;
        const cx = svgWidth / 2;
        const coneShape = svgEl('path', {
          d: 'M ' + (cx - coneHalfWidth) + ' ' + coneTop + ' L ' + (cx + coneHalfWidth) + ' ' + coneTop + ' L ' + cx + ' ' + coneApexY + ' Z',
          fill: '#d4a574',
          stroke: '#3d342a',
          'stroke-width': '1.5'
        });
        svg.appendChild(coneShape);
        // Diagonal waffle hatch (subtle).
        for (let v = 5; v <= coneHeight - 6; v += 9) {
          const y = coneTop + v;
          const inset = (v / coneHeight) * coneHalfWidth;
          svg.appendChild(svgEl('line', {
            x1: cx - coneHalfWidth + inset,
            y1: y,
            x2: cx + coneHalfWidth - inset,
            y2: y,
            stroke: 'rgba(61,52,42,0.28)',
            'stroke-width': '0.8'
          }));
        }
        // Scoops, stacked from cone-top upward.
        scoopList.forEach((ki, idx) => {
          const cy = coneTop - 4 - idx * scoopVStep - scoopRadius * 0.4;
          if (cy - scoopRadius < 4) return; // out of canvas guard
          svg.appendChild(svgEl('circle', {
            cx: cx,
            cy: cy,
            r: scoopRadius,
            fill: palette[ki % palette.length].fill,
            stroke: '#3d342a',
            'stroke-width': '1.3'
          }));
          svg.appendChild(svgEl('circle', {
            cx: cx - 7,
            cy: cy - 7,
            r: 5.5,
            fill: 'rgba(255,255,255,0.45)'
          }));
        });
        if (scoopList.length === 0) {
          const t = svgEl('text', {
            x: cx,
            y: coneTop - 30,
            'text-anchor': 'middle',
            'font-family': 'Crimson Pro, Georgia, serif',
            'font-style': 'italic',
            'font-size': '14',
            fill: '#5d534a'
          });
          t.textContent = '(empty cone)';
          svg.appendChild(t);
        }
        wrap.appendChild(svg);
        downstream.appendChild(wrap);
      } else if (mode === 'slushy') {
        const wrap = document.createElement('div');
        wrap.className = 'sb-cups-wrap';
        const maxCount = Math.max(1, ...counts);
        for (let i = 0; i < n; i++) {
          const station = document.createElement('div');
          station.className = 'sb-station';
          const colorBar = document.createElement('div');
          colorBar.className = 'sb-station-color';
          colorBar.style.background = palette[i % palette.length].fill;
          colorBar.style.color = palette[i % palette.length].text;
          colorBar.textContent = palette[i % palette.length].name;
          station.appendChild(colorBar);

          const cupSvg = svgEl('svg', {
            class: 'sb-cup-svg',
            viewBox: '0 0 60 80',
            preserveAspectRatio: 'xMidYMax meet'
          });
          // Cup outline
          cupSvg.appendChild(svgEl('path', {
            d: 'M 10 10 L 50 10 L 44 72 L 16 72 Z',
            fill: '#fff',
            stroke: '#3d342a',
            'stroke-width': '1.4'
          }));
          // Liquid fill
          const fillFrac = counts[i] / maxCount;
          if (fillFrac > 0) {
            const clipId = 'sb-cupclip-' + instanceId + '-' + i;
            const defs = svgEl('defs', {});
            const clip = svgEl('clipPath', { id: clipId });
            clip.appendChild(svgEl('path', {
              d: 'M 12 12 L 48 12 L 43 70 L 17 70 Z'
            }));
            defs.appendChild(clip);
            cupSvg.appendChild(defs);
            const liquidH = 58 * fillFrac;
            cupSvg.appendChild(svgEl('rect', {
              x: 0,
              y: 70 - liquidH,
              width: 60,
              height: liquidH,
              fill: palette[i % palette.length].fill,
              'clip-path': 'url(#' + clipId + ')'
            }));
            // Surface highlight
            cupSvg.appendChild(svgEl('ellipse', {
              cx: 30,
              cy: 70 - liquidH + 1,
              rx: 13 - (counts[i] === 0 ? 13 : 0),
              ry: 1.5,
              fill: 'rgba(255,255,255,0.35)',
              'clip-path': 'url(#' + clipId + ')'
            }));
          }
          station.appendChild(cupSvg);

          const cnt = document.createElement('div');
          cnt.className = 'sb-station-count';
          cnt.textContent = '×' + counts[i];
          station.appendChild(cnt);
          wrap.appendChild(station);
        }
        downstream.appendChild(wrap);
      } else {
        // Bijection: literal string + length annotation.
        const wrap = document.createElement('div');
        wrap.className = 'sb-bijection-wrap';
        const stringDisp = document.createElement('div');
        stringDisp.className = 'sb-bijection-string';
        let kIdx = 0;
        for (let i = 0; i < ts; i++) {
          const sp = document.createElement('span');
          if (isBarAt(i)) {
            sp.className = 'sb-bij-bar';
            sp.textContent = '|';
            kIdx++;
          } else {
            sp.className = 'sb-bij-star';
            sp.style.color = palette[kIdx % palette.length].fill;
            sp.textContent = '*';
          }
          stringDisp.appendChild(sp);
        }
        if (ts === 0) {
          const empty = document.createElement('span');
          empty.className = 'sb-bij-empty';
          empty.textContent = '(empty string)';
          stringDisp.appendChild(empty);
        }
        wrap.appendChild(stringDisp);
        const note = document.createElement('div');
        note.className = 'sb-bijection-note';
        note.innerHTML = 'length-' + ts + ' string with <strong>' + k + '</strong> stars and <strong>' + (n - 1) + '</strong> bars';
        wrap.appendChild(note);
        downstream.appendChild(wrap);
      }
    }

    function renderTally() {
      tally.innerHTML = '';
      const counts = multisetFromBars(barPositions, k, n);
      const palette = getPalette();
      const title = document.createElement('div');
      title.className = 'sb-tally-title';
      title.textContent = 'Selection (multiset):';
      tally.appendChild(title);
      const list = document.createElement('div');
      list.className = 'sb-tally-list';
      for (let i = 0; i < n; i++) {
        const item = document.createElement('div');
        item.className = 'sb-tally-item' + (counts[i] === 0 ? ' sb-tally-zero' : '');
        const swatch = document.createElement('span');
        swatch.className = 'sb-swatch';
        swatch.style.background = palette[i % palette.length].fill;
        const name = document.createElement('span');
        name.className = 'sb-tally-name';
        name.textContent = palette[i % palette.length].name;
        const cnt = document.createElement('span');
        cnt.className = 'sb-tally-count';
        cnt.textContent = '×' + counts[i];
        item.appendChild(swatch);
        item.appendChild(name);
        item.appendChild(cnt);
        list.appendChild(item);
      }
      tally.appendChild(list);
    }

    function renderCount() {
      countPanel.innerHTML = '';
      countBtn.textContent = countShown ? 'Hide count' : 'Show count';
      if (!countShown) return;
      const tot = totalConfigs();
      let phrase;
      if (mode === 'scooper') {
        phrase = tot + ' way' + (tot === 1 ? '' : 's') + ' to pick ' + k + ' scoop' + (k === 1 ? '' : 's') + ' from ' + n + ' flavor' + (n === 1 ? '' : 's') + ' (with repeats)';
      } else if (mode === 'slushy') {
        phrase = tot + ' distinct slushy order' + (tot === 1 ? '' : 's') + ' for ' + k + ' cup' + (k === 1 ? '' : 's') + ' across ' + n + ' color' + (n === 1 ? '' : 's');
      } else {
        phrase = tot + ' length-' + (k + n - 1) + ' string' + (tot === 1 ? '' : 's') + ' with ' + k + ' star' + (k === 1 ? '' : 's') + ' and ' + (n - 1) + ' bar' + ((n - 1) === 1 ? '' : 's');
      }
      const formula = document.createElement('div');
      formula.className = 'sb-count-formula';
      formula.innerHTML =
        '<span class="sb-formula-label">C(<i>k</i> + <i>n</i> − 1, <i>n</i> − 1) =</span> ' +
        'C(' + (k + n - 1) + ', ' + (n - 1) + ') = <strong>' + tot + '</strong>';
      const phraseDiv = document.createElement('div');
      phraseDiv.className = 'sb-count-phrase';
      phraseDiv.textContent = phrase;
      countPanel.appendChild(formula);
      countPanel.appendChild(phraseDiv);
    }

    // ── Drag handlers ──────────────────────────────────────────────────────
    // Snap target by querying each slot's actual bounding rect — robust
    // against gaps and mode-specific slot widths.
    function findNearestSlotIndex(clientX, slotRects) {
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let i = 0; i < slotRects.length; i++) {
        const r = slotRects[i];
        const center = (r.left + r.right) / 2;
        const d = Math.abs(clientX - center);
        if (d < bestDist) { bestDist = d; bestIdx = i; }
      }
      return bestIdx;
    }

    function clearTargetHighlights() {
      slotRow.querySelectorAll('.sb-slot.sb-target, .sb-slot.sb-target-blocked')
        .forEach(s => s.classList.remove('sb-target', 'sb-target-blocked'));
    }

    function onBarPointerDown(e) {
      if (e.button !== undefined && e.button !== 0) return;
      const piece = e.currentTarget;
      const slot = piece.closest('.sb-slot');
      if (!slot) return;
      const slotIdx = Number(slot.dataset.index);
      const slots = slotRow.querySelectorAll('.sb-slot');
      const slotRects = Array.from(slots).map(s => s.getBoundingClientRect());
      const pieceRect = piece.getBoundingClientRect();
      drag = {
        piece: piece,
        originalSlot: slotIdx,
        slotRects: slotRects,
        startClientX: e.clientX,
        startClientY: e.clientY,
        pieceCenterX: (pieceRect.left + pieceRect.right) / 2,
        pieceCenterY: (pieceRect.top + pieceRect.bottom) / 2,
        targetSlot: slotIdx,
        pointerId: e.pointerId
      };
      piece.classList.add('sb-bar-dragging');
      try { piece.setPointerCapture(e.pointerId); } catch (err) {}
      piece.addEventListener('pointermove', onBarPointerMove);
      piece.addEventListener('pointerup', onBarPointerUp);
      piece.addEventListener('pointercancel', onBarPointerUp);
      // Prime the target highlight on the originating slot so users see
      // the drop affordance immediately.
      slot.classList.add('sb-target-self');
      e.preventDefault();
    }

    function onBarPointerMove(e) {
      if (!drag) return;
      // Move the dragged piece visually so it follows the pointer in both
      // axes (Y dampened so it stays roughly in the row).
      const dx = e.clientX - drag.startClientX;
      const dy = e.clientY - drag.startClientY;
      drag.piece.style.transform = 'translate(' + dx + 'px, ' + (dy * 0.4) + 'px)';
      // Snap target by nearest slot center.
      const newTarget = findNearestSlotIndex(e.clientX, drag.slotRects);
      if (newTarget === drag.targetSlot) return;
      drag.targetSlot = newTarget;
      clearTargetHighlights();
      const slots = slotRow.querySelectorAll('.sb-slot');
      const tgt = slots[newTarget];
      if (!tgt) return;
      if (newTarget === drag.originalSlot) {
        tgt.classList.add('sb-target-self');
      } else if (tgt.classList.contains('sb-slot-bar')) {
        // Another bar already lives there — drop is a no-op.
        tgt.classList.add('sb-target-blocked');
      } else {
        tgt.classList.add('sb-target');
      }
    }

    function onBarPointerUp(e) {
      if (!drag) return;
      const piece = drag.piece;
      const newPos = drag.targetSlot;
      const oldPos = drag.originalSlot;
      piece.classList.remove('sb-bar-dragging');
      piece.style.transform = '';
      clearTargetHighlights();
      slotRow.querySelectorAll('.sb-slot.sb-target-self').forEach(s => s.classList.remove('sb-target-self'));
      try { piece.releasePointerCapture(drag.pointerId); } catch (err) {}
      piece.removeEventListener('pointermove', onBarPointerMove);
      piece.removeEventListener('pointerup', onBarPointerUp);
      piece.removeEventListener('pointercancel', onBarPointerUp);
      drag = null;
      if (newPos !== oldPos && !isBarAt(newPos)) {
        barPositions = barPositions
          .filter(p => p !== oldPos)
          .concat(newPos)
          .sort((a, b) => a - b);
        renderAll();
      }
      // No-op drops (same slot or onto another bar): no re-render needed,
      // since we only moved the piece visually via transform — already
      // cleared above.
    }

    // Keyboard nudge: arrow keys move a focused bar one slot at a time.
    function onBarKeyDown(e) {
      const slot = e.currentTarget.closest('.sb-slot');
      if (!slot) return;
      const idx = Number(slot.dataset.index);
      let target = null;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') target = idx - 1;
      else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') target = idx + 1;
      else return;
      e.preventDefault();
      if (target < 0 || target >= totalSlots()) return;
      if (isBarAt(target)) return;
      barPositions = barPositions.filter(p => p !== idx).concat(target).sort((a, b) => a - b);
      renderAll();
      // Refocus the bar that just moved.
      const newSlot = slotRow.querySelector('[data-index="' + target + '"] .sb-bar-piece');
      if (newSlot) newSlot.focus();
    }

    // ── Wire control events ────────────────────────────────────────────────
    kSlider.input.addEventListener('input', () => {
      const v = Math.max(minK, Math.min(maxK, Math.floor(Number(kSlider.input.value))));
      if (v === k) return;
      k = v;
      barPositions = initialPositions(k, n);
      countShown = false;
      renderAll();
    });
    nSlider.input.addEventListener('input', () => {
      const raw = Math.floor(Number(nSlider.input.value));
      // In Practice mode the slider value is "bars" (= n − 1); in Watch
      // mode it's "n" directly.
      const newN = (learnMode === 'practice')
        ? Math.max(minN, Math.min(maxN, raw + 1))
        : Math.max(minN, Math.min(maxN, raw));
      if (newN === n) return;
      n = newN;
      barPositions = initialPositions(k, n);
      countShown = false;
      renderAll();
    });
    Object.keys(modeBtns).forEach(key => {
      modeBtns[key].addEventListener('click', () => {
        if (mode === key) return;
        mode = key;
        renderAll();
      });
    });
    prevBtn.addEventListener('click', () => {
      if (totalConfigs() <= 1) return;
      barPositions = prevConfig(barPositions, totalSlots());
      renderAll();
    });
    nextBtn.addEventListener('click', () => {
      if (totalConfigs() <= 1) return;
      barPositions = nextConfig(barPositions, totalSlots());
      renderAll();
    });
    countBtn.addEventListener('click', () => {
      countShown = !countShown;
      renderCount();
    });

    // Apply a practice problem's recommended view mode. Defaults to
    // bijection (the generic stars-and-bars graphics) — the activity is
    // about modeling a problem onto the abstraction, so the abstract
    // view is the natural default. Per-problem `viewMode` overrides
    // this when a concrete metaphor (scooper / slushy) genuinely fits
    // the scenario.
    function applyProblemViewMode() {
      const p = currentProblem();
      if (!p) return;
      mode = validModes.includes(p.viewMode) ? p.viewMode : 'bijection';
    }

    // Practice-mode wiring.
    if (learnToggle) {
      Object.keys(learnBtns).forEach(key => {
        learnBtns[key].addEventListener('click', () => {
          if (learnMode === key) return;
          learnMode = key;
          if (learnMode === 'practice') {
            k = Math.max(minK, 0);
            n = Math.max(minN, 1);
            barPositions = initialPositions(k, n);
            countShown = false;
            practiceHintShown = false;
            applyProblemViewMode();
          }
          renderAll();
        });
      });
    }
    if (hintBtn) {
      hintBtn.addEventListener('click', () => {
        practiceHintShown = !practiceHintShown;
        renderPractice();
      });
    }
    if (showSolutionBtn) {
      showSolutionBtn.addEventListener('click', () => {
        const p = currentProblem();
        if (!p) return;
        k = Math.max(minK, Math.min(maxK, p.k));
        n = Math.max(minN, Math.min(maxN, p.n));
        barPositions = initialPositions(k, n);
        renderAll();
      });
    }
    if (nextProblemBtn) {
      nextProblemBtn.addEventListener('click', () => {
        if (practiceProblems.length <= 1) return;
        practiceIdx = (practiceIdx + 1) % practiceProblems.length;
        k = Math.max(minK, 0);
        n = Math.max(minN, 1);
        barPositions = initialPositions(k, n);
        countShown = false;
        practiceHintShown = false;
        applyProblemViewMode();
        renderAll();
      });
    }
    // Initial: if we boot in Practice mode, apply the first problem's
    // recommended view mode before the first render.
    if (learnMode === 'practice') applyProblemViewMode();

    renderAll();
  }

  function bootAll() {
    document.querySelectorAll('.sb-widget').forEach(root => {
      if (root.dataset.sbMounted === '1') return;
      root.dataset.sbMounted = '1';
      mountWidget(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAll);
  } else {
    bootAll();
  }
}());
