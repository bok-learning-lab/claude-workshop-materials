(function () {
  'use strict';

  // =========================================================================
  // LAZY SUSAN PIGEONHOLE VISUALIZER (W35) — embeddable widget
  //
  // Each <div class="lzs-widget" data-problem='{...}'></div> on the page is
  // mounted as an independent instance. The widget pairs an SVG-based
  // circular-table visualization (rotate the lazy Susan to find dish/person
  // matches) with the same 4-component PHP setup mapper used by W18.
  //
  // No document-wide IDs; everything scoped via root.querySelector.
  // =========================================================================

  // ── Constants ────────────────────────────────────────────────────────────
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const VB = 380;
  const CX = VB / 2;
  const CY = VB / 2;
  const R_TABLE = 180;
  const R_SEAT = 150;
  const R_SUSAN = 108;
  const R_DISH = 88;
  const SEAT_R = 17;
  const DISH_R = 14;

  const COMPONENT_KEYS = ['pigeons', 'pigeonholes', 'mapping', 'conclusion'];
  const DEFAULT_LABELS = {
    pigeons:     'Pigeons',
    pigeonholes: 'Pigeonholes',
    mapping:     'Mapping',
    conclusion:  'Conclusion'
  };
  const DEFAULT_PROMPTS = {
    pigeons:     'What is the domain set A?',
    pigeonholes: 'What is the codomain set B?',
    mapping:     'What function maps each pigeon to a pigeonhole?',
    conclusion:  'What does the Pigeonhole Principle let us conclude here?'
  };

  let widgetSeq = 0;

  // ── Pure helpers ─────────────────────────────────────────────────────────
  function isString(x) { return typeof x === 'string' && x.length > 0; }

  function hashString(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function seededShuffle(arr, seed) {
    const out = arr.slice();
    let state = seed || 1;
    for (let i = out.length - 1; i > 0; i--) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      const j = state % (i + 1);
      const tmp = out[i]; out[i] = out[j]; out[j] = tmp;
    }
    return out;
  }

  // 32-bit LCG RNG seeded by an integer. Returns a float in [0, 1).
  function makeRng(seed) {
    let state = (seed || 1) >>> 0;
    return function () {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 0x100000000;
    };
  }

  // Generate a derangement of {0, 1, ..., n-1} using rejection sampling.
  // Returns an array `perm` of length n where perm[j] ≠ j for all j and
  // perm is a permutation of {0..n-1}. Pr(derangement) ≈ 1/e ≈ 0.368, so
  // a random shuffle takes ~3 attempts on average. Safe upper bound.
  function generateDerangement(n, rng) {
    for (let attempt = 0; attempt < 200; attempt++) {
      const p = [];
      for (let i = 0; i < n; i++) p.push(i);
      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        const t = p[i]; p[i] = p[j]; p[j] = t;
      }
      let ok = true;
      for (let i = 0; i < n; i++) if (p[i] === i) { ok = false; break; }
      if (ok) return p;
    }
    // Fallback: cyclic shift, which is always a derangement for n ≥ 2.
    const p = [];
    for (let i = 0; i < n; i++) p.push((i + 1) % n);
    return p;
  }

  // For a given derangement, compute each person's "needed rotation":
  // r[i] = (i - inv[i]) mod n, where inv[d] is the slot holding dish d.
  function computeNeededRotations(perm) {
    const n = perm.length;
    const inv = new Array(n);
    for (let j = 0; j < n; j++) inv[perm[j]] = j;
    const r = new Array(n);
    for (let i = 0; i < n; i++) r[i] = ((i - inv[i]) % n + n) % n;
    return r;
  }

  // Polar-to-cartesian using "0 at top, increasing clockwise".
  function seatPos(i, n, radius) {
    const angle = -Math.PI / 2 + 2 * Math.PI * i / n;
    return {
      x: CX + radius * Math.cos(angle),
      y: CY + radius * Math.sin(angle)
    };
  }

  function svgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    if (attrs) for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  // ── Mount a single widget instance ───────────────────────────────────────
  function mountWidget(root) {
    let problem;
    try {
      problem = JSON.parse(root.dataset.problem || '{}');
    } catch (e) {
      console.error('lazy-susan-pigeonhole: invalid data-problem JSON', e);
      return;
    }

    if (!isString(problem.statement)) {
      console.error('lazy-susan-pigeonhole: data-problem must include a statement string');
      return;
    }
    if (!problem.components || typeof problem.components !== 'object') {
      console.error('lazy-susan-pigeonhole: data-problem must include a components object');
      return;
    }

    // Validate components.
    const compState = Object.create(null);
    for (const key of COMPONENT_KEYS) {
      const c = problem.components[key];
      if (!c || !Array.isArray(c.options) || c.options.length < 2) {
        console.error('lazy-susan-pigeonhole: component "' + key + '" must have at least 2 options');
        return;
      }
      const seenIds = Object.create(null);
      let correctCount = 0;
      const opts = [];
      for (const o of c.options) {
        if (!isString(o.id) || !isString(o.text)) {
          console.error('lazy-susan-pigeonhole: each option needs id and text', o);
          return;
        }
        if (seenIds[o.id]) {
          console.error('lazy-susan-pigeonhole: duplicate option id "' + o.id + '" in component "' + key + '"');
          return;
        }
        seenIds[o.id] = true;
        if (o.correct) correctCount++;
        opts.push({
          id: o.id, text: o.text, correct: !!o.correct,
          feedback: isString(o.feedback) ? o.feedback : null
        });
      }
      if (correctCount !== 1) {
        console.error('lazy-susan-pigeonhole: component "' + key + '" must have exactly one correct option, found ' + correctCount);
        return;
      }
      compState[key] = {
        label: isString(c.label) ? c.label : DEFAULT_LABELS[key],
        prompt: isString(c.prompt) ? c.prompt : DEFAULT_PROMPTS[key],
        options: opts,
        displayOrder: null,
        rootEl: null, selectEl: null, markerEl: null, feedbackEl: null
      };
    }

    // Visualization parameters.
    const vizCfg = (problem.viz && typeof problem.viz === 'object') ? problem.viz : {};
    const N = (typeof vizCfg.people === 'number' && vizCfg.people >= 4 && vizCfg.people <= 30)
      ? Math.floor(vizCfg.people) : 11;
    // Derangement seed: explicit seed > derived from option ids (stable per
    // widget). The "new derangement" link increments seedOffset to vary.
    const baseSeed = (typeof vizCfg.seed === 'number')
      ? (vizCfg.seed >>> 0)
      : hashString(JSON.stringify(problem.components));
    let seedOffset = 0;

    widgetSeq++;
    const instanceId = 'lzs-' + widgetSeq;

    // Seeded display orders for the dropdowns.
    for (const key of COMPONENT_KEYS) {
      const c = compState[key];
      const idsKey = c.options.map(o => o.id).join('|');
      const seed = hashString(instanceId + ':' + key + ':' + idsKey);
      c.displayOrder = seededShuffle(c.options.slice(), seed);
    }

    // Mutable visualization state.
    let perm = null;       // Current derangement
    let needed = null;     // Per-person needed rotations
    let rotation = 0;      // Cumulative rotation count (unbounded; mod N for matching)

    function regenerateDerangement() {
      const rng = makeRng(baseSeed + seedOffset * 9176);
      perm = generateDerangement(N, rng);
      needed = computeNeededRotations(perm);
      rotation = 0;
    }
    regenerateDerangement();

    // ── Build DOM scaffold ─────────────────────────────────────────────────
    root.innerHTML = '';

    if (isString(problem.title)) {
      const h = document.createElement('h1');
      h.className = 'lzs-title';
      h.textContent = problem.title;
      root.appendChild(h);
    }

    const successBanner = document.createElement('div');
    successBanner.className = 'lzs-success-banner';
    successBanner.innerHTML = (problem.success && isString(problem.success.banner))
      ? problem.success.banner
      : '<strong>Correct setup.</strong> All four components match.';
    root.appendChild(successBanner);

    const statementEl = document.createElement('div');
    statementEl.className = 'lzs-statement';
    statementEl.innerHTML = problem.statement;
    root.appendChild(statementEl);

    if (isString(problem.hint)) {
      const hintEl = document.createElement('div');
      hintEl.className = 'lzs-hint';
      hintEl.innerHTML = problem.hint;
      root.appendChild(hintEl);
    }

    // ── Body: viz panel | mapper panel ────────────────────────────────────
    const body = document.createElement('div');
    body.className = 'lzs-body';

    // ── Viz panel ─────────────────────────────────────────────────────────
    const vizPanel = document.createElement('div');
    vizPanel.className = 'lzs-panel';
    const vizTitle = document.createElement('div');
    vizTitle.className = 'lzs-panel-title';
    vizTitle.textContent = 'Spin the lazy Susan to find rotations that match';
    vizPanel.appendChild(vizTitle);

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'lzs-viz-svg');
    svg.setAttribute('viewBox', '0 0 ' + VB + ' ' + VB);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Circular table with people seated outside and a lazy Susan with dishes in the center');
    vizPanel.appendChild(svg);

    // Refs into the SVG, populated by buildSvgStatic().
    let susanGroup = null;
    let seatCircles = [];   // length N
    let matchLinesGroup = null;

    // ── Rotation controls ─────────────────────────────────────────────────
    const rotationRow = document.createElement('div');
    rotationRow.className = 'lzs-rotation-row';

    const leftBtn = document.createElement('button');
    leftBtn.type = 'button';
    leftBtn.className = 'lzs-rotate-btn';
    leftBtn.setAttribute('aria-label', 'Rotate Susan one position counter-clockwise');
    leftBtn.textContent = '◀';

    const status = document.createElement('div');
    status.className = 'lzs-rotation-status';

    const rightBtn = document.createElement('button');
    rightBtn.type = 'button';
    rightBtn.className = 'lzs-rotate-btn';
    rightBtn.setAttribute('aria-label', 'Rotate Susan one position clockwise');
    rightBtn.textContent = '▶';

    rotationRow.appendChild(leftBtn);
    rotationRow.appendChild(status);
    rotationRow.appendChild(rightBtn);
    vizPanel.appendChild(rotationRow);

    // ── Tools row (new derangement) ──────────────────────────────────────
    const toolsRow = document.createElement('div');
    toolsRow.className = 'lzs-tools-row';
    const newDerangementBtn = document.createElement('button');
    newDerangementBtn.type = 'button';
    newDerangementBtn.className = 'lzs-tool-link';
    newDerangementBtn.textContent = 'New configuration';
    toolsRow.appendChild(newDerangementBtn);
    vizPanel.appendChild(toolsRow);

    // ── Needed-rotations disclosure ──────────────────────────────────────
    const detailsEl = document.createElement('details');
    detailsEl.className = 'lzs-needed-details';
    const summaryEl = document.createElement('summary');
    summaryEl.textContent = 'Show needed rotations for each person';
    detailsEl.appendChild(summaryEl);
    const neededTableHost = document.createElement('div');
    detailsEl.appendChild(neededTableHost);
    vizPanel.appendChild(detailsEl);

    body.appendChild(vizPanel);

    // ── Mapper panel ──────────────────────────────────────────────────────
    const mapPanel = document.createElement('div');
    mapPanel.className = 'lzs-panel';
    const mapTitle = document.createElement('div');
    mapTitle.className = 'lzs-panel-title';
    mapTitle.textContent = 'Identify the four components';
    mapPanel.appendChild(mapTitle);

    for (const key of COMPONENT_KEYS) {
      const c = compState[key];
      const compEl = document.createElement('div');
      compEl.className = 'lzs-component';
      compEl.dataset.component = key;

      const label = document.createElement('label');
      label.className = 'lzs-component-label';
      label.textContent = c.label;

      const prompt = document.createElement('span');
      prompt.className = 'lzs-component-prompt';
      prompt.textContent = c.prompt;

      const row = document.createElement('div');
      row.className = 'lzs-select-row';

      const select = document.createElement('select');
      select.className = 'lzs-select';
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = '— choose one —';
      select.appendChild(placeholder);
      for (const o of c.displayOrder) {
        const opt = document.createElement('option');
        opt.value = o.id;
        opt.textContent = stripTags(o.text);
        select.appendChild(opt);
      }
      select.addEventListener('change', () => {
        clearComponentFeedback(key);
        successBanner.classList.remove('lzs-visible');
      });

      const marker = document.createElement('span');
      marker.className = 'lzs-marker';
      marker.setAttribute('aria-hidden', 'true');

      row.appendChild(select);
      row.appendChild(marker);

      const feedback = document.createElement('div');
      feedback.className = 'lzs-component-feedback';

      const selectId = instanceId + '-select-' + key;
      select.id = selectId;
      label.htmlFor = selectId;

      compEl.appendChild(label);
      compEl.appendChild(prompt);
      compEl.appendChild(row);
      compEl.appendChild(feedback);
      mapPanel.appendChild(compEl);

      c.rootEl = compEl;
      c.selectEl = select;
      c.markerEl = marker;
      c.feedbackEl = feedback;
    }
    body.appendChild(mapPanel);

    root.appendChild(body);

    // ── Controls (Check / Reset) ──────────────────────────────────────────
    const controls = document.createElement('div');
    controls.className = 'lzs-controls';
    const checkBtn = document.createElement('button');
    checkBtn.type = 'button';
    checkBtn.className = 'lzs-btn lzs-btn-primary';
    checkBtn.textContent = 'Check';
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'lzs-btn';
    resetBtn.textContent = 'Reset';
    controls.appendChild(checkBtn);
    controls.appendChild(resetBtn);
    root.appendChild(controls);

    const statusLine = document.createElement('div');
    statusLine.className = 'lzs-status-line';
    statusLine.setAttribute('role', 'status');
    statusLine.setAttribute('aria-live', 'polite');
    root.appendChild(statusLine);

    // ── Helpers ──────────────────────────────────────────────────────────
    function stripTags(html) {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
    }

    // ── Render: static SVG (rebuilt on each derangement) ──────────────────
    function buildSvgStatic() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      seatCircles = [];

      // Outer table background.
      svg.appendChild(svgEl('circle', {
        cx: CX, cy: CY, r: R_TABLE,
        class: 'lzs-table-bg'
      }));

      // Susan group (rotates as the rotation changes). The CSS rule
      // sets `transform-box: fill-box; transform-origin: center` so the
      // rotation pivots around the center of the group's bounding box —
      // do NOT set transformOrigin inline (an inline px value would be
      // interpreted in fill-box coordinates and mis-anchor the rotation).
      susanGroup = svgEl('g', { class: 'lzs-susan-group' });
      susanGroup.style.transform = 'rotate(0deg)';

      // Susan disk.
      susanGroup.appendChild(svgEl('circle', {
        cx: CX, cy: CY, r: R_SUSAN,
        class: 'lzs-susan-disk'
      }));
      susanGroup.appendChild(svgEl('circle', {
        cx: CX, cy: CY, r: 6,
        class: 'lzs-susan-spindle'
      }));

      // Dishes (in local Susan frame). Dish j shows label perm[j] (1-indexed).
      for (let j = 0; j < N; j++) {
        const pos = seatPos(j, N, R_DISH);
        susanGroup.appendChild(svgEl('circle', {
          cx: pos.x, cy: pos.y, r: DISH_R,
          class: 'lzs-dish-circle'
        }));
        const t = svgEl('text', {
          x: pos.x, y: pos.y,
          class: 'lzs-dish-text'
        });
        t.textContent = String(perm[j] + 1);
        susanGroup.appendChild(t);
      }
      svg.appendChild(susanGroup);

      // Seats (table-frame, fixed). Seat i shows label i+1.
      for (let i = 0; i < N; i++) {
        const pos = seatPos(i, N, R_SEAT);
        const c = svgEl('circle', {
          cx: pos.x, cy: pos.y, r: SEAT_R,
          class: 'lzs-seat-circle',
          'data-seat': String(i)
        });
        const t = svgEl('text', {
          x: pos.x, y: pos.y,
          class: 'lzs-seat-text'
        });
        t.textContent = String(i + 1);
        svg.appendChild(c);
        svg.appendChild(t);
        seatCircles[i] = c;
      }

      // Match lines group (drawn last so it's on top).
      matchLinesGroup = svgEl('g', { class: 'lzs-match-lines' });
      svg.appendChild(matchLinesGroup);
    }

    // ── Render: rotation-dependent updates ────────────────────────────────
    function updateRotationView() {
      // Susan transform.
      const angle = 360 * rotation / N;
      susanGroup.style.transform = 'rotate(' + angle + 'deg)';

      // Match indicators.
      const r = ((rotation % N) + N) % N;
      const matched = [];
      for (let i = 0; i < N; i++) {
        const isMatch = (needed[i] === r);
        seatCircles[i].classList.toggle('lzs-matched', isMatch);
        if (isMatch) matched.push(i);
      }

      // Match lines.
      while (matchLinesGroup.firstChild) matchLinesGroup.removeChild(matchLinesGroup.firstChild);
      for (const i of matched) {
        const sp = seatPos(i, N, R_SEAT - SEAT_R);
        const dp = seatPos(i, N, R_DISH + DISH_R);
        matchLinesGroup.appendChild(svgEl('line', {
          x1: sp.x, y1: sp.y, x2: dp.x, y2: dp.y,
          class: 'lzs-match-line'
        }));
      }

      // Status text.
      const matchSpan = matched.length > 0 ? ' lzs-active' : '';
      status.innerHTML =
        'Rotation: <strong>' + r + '</strong> &nbsp;·&nbsp; ' +
        '<span class="lzs-match-count' + matchSpan + '">Matches: ' + matched.length + '</span>';
    }

    // ── Render: needed-rotations table (rebuilt on each derangement) ─────
    function buildNeededTable() {
      neededTableHost.innerHTML = '';

      // Group persons by their needed rotation to identify duplicates.
      const groups = Object.create(null);
      for (let i = 0; i < N; i++) {
        const r = needed[i];
        if (!groups[r]) groups[r] = [];
        groups[r].push(i);
      }

      const table = document.createElement('table');
      table.className = 'lzs-needed-table';
      const thead = document.createElement('thead');
      const trH = document.createElement('tr');
      const th1 = document.createElement('th');
      th1.textContent = 'Person';
      const th2 = document.createElement('th');
      th2.textContent = 'Needed rotation';
      const th3 = document.createElement('th');
      th3.textContent = 'Wants dish';
      trH.appendChild(th1); trH.appendChild(th2); trH.appendChild(th3);
      thead.appendChild(trH);
      table.appendChild(thead);

      const tbody = document.createElement('tbody');
      for (let i = 0; i < N; i++) {
        const tr = document.createElement('tr');
        if (groups[needed[i]].length >= 2) tr.classList.add('lzs-needed-dup');
        const td1 = document.createElement('td');
        td1.textContent = String(i + 1);
        const td2 = document.createElement('td');
        td2.textContent = String(needed[i]);
        const td3 = document.createElement('td');
        td3.textContent = String(i + 1);
        tr.appendChild(td1); tr.appendChild(td2); tr.appendChild(td3);
        tbody.appendChild(tr);
      }
      table.appendChild(tbody);
      neededTableHost.appendChild(table);

      // Summary line: which rotations are duplicated and by whom.
      const dupRotations = Object.keys(groups)
        .filter(r => groups[r].length >= 2)
        .sort((a, b) => Number(a) - Number(b));
      if (dupRotations.length) {
        const summary = document.createElement('div');
        summary.className = 'lzs-needed-summary';
        const parts = dupRotations.map(r => {
          const persons = groups[r].map(i => 'P' + (i + 1)).join(', ');
          return 'r = ' + r + ' is needed by ' + persons;
        });
        summary.textContent = 'Pigeonhole hit: ' + parts.join('; ') + '.';
        neededTableHost.appendChild(summary);
      }
    }

    // ── Re-render everything (used on derangement change) ─────────────────
    function renderAll() {
      buildSvgStatic();
      buildNeededTable();
      updateRotationView();
    }

    // ── Event handlers ────────────────────────────────────────────────────
    leftBtn.addEventListener('click', () => {
      rotation -= 1;
      updateRotationView();
    });
    rightBtn.addEventListener('click', () => {
      rotation += 1;
      updateRotationView();
    });
    newDerangementBtn.addEventListener('click', () => {
      seedOffset += 1;
      regenerateDerangement();
      renderAll();
    });

    // ── Mapper panel grading ─────────────────────────────────────────────
    function clearComponentFeedback(key) {
      const c = compState[key];
      c.rootEl.classList.remove('lzs-component-ok', 'lzs-component-bad');
      c.markerEl.classList.remove('lzs-marker-ok', 'lzs-marker-bad');
      c.markerEl.textContent = '';
      c.feedbackEl.classList.remove('lzs-feedback-ok', 'lzs-feedback-bad');
      c.feedbackEl.innerHTML = '';
    }
    function clearAllFeedback() {
      for (const key of COMPONENT_KEYS) clearComponentFeedback(key);
      successBanner.classList.remove('lzs-visible');
      statusLine.textContent = '';
      statusLine.classList.remove('lzs-status-error');
    }
    function setStatus(text, isError) {
      statusLine.textContent = text || '';
      statusLine.classList.toggle('lzs-status-error', !!isError);
    }

    function validate() {
      const results = Object.create(null);
      let allAnswered = true, allCorrect = true;
      for (const key of COMPONENT_KEYS) {
        const c = compState[key];
        const v = c.selectEl.value;
        if (!v) { results[key] = { state: 'unanswered' }; allAnswered = false; allCorrect = false; continue; }
        const opt = c.options.find(o => o.id === v);
        if (!opt) { results[key] = { state: 'unanswered' }; allAnswered = false; allCorrect = false; continue; }
        results[key] = { state: opt.correct ? 'ok' : 'bad', option: opt };
        if (!opt.correct) allCorrect = false;
      }
      return { allCorrect, allAnswered, results };
    }

    function applyResults(verdict) {
      let unanswered = 0, wrong = 0;
      for (const key of COMPONENT_KEYS) {
        const c = compState[key];
        const r = verdict.results[key];
        clearComponentFeedback(key);
        if (r.state === 'unanswered') {
          unanswered++;
          c.rootEl.classList.add('lzs-component-bad');
          c.feedbackEl.classList.add('lzs-feedback-bad');
          c.feedbackEl.innerHTML = 'Pick an option from the dropdown before checking.';
          continue;
        }
        if (r.state === 'ok') {
          c.rootEl.classList.add('lzs-component-ok');
          c.markerEl.classList.add('lzs-marker-ok');
          c.markerEl.textContent = '✓';
          c.feedbackEl.classList.add('lzs-feedback-ok');
          c.feedbackEl.innerHTML = 'Correct.';
        } else {
          wrong++;
          c.rootEl.classList.add('lzs-component-bad');
          c.markerEl.classList.add('lzs-marker-bad');
          c.markerEl.textContent = '✗';
          c.feedbackEl.classList.add('lzs-feedback-bad');
          c.feedbackEl.innerHTML = r.option.feedback || 'Not quite. Try a different option.';
        }
      }
      if (verdict.allCorrect) {
        successBanner.classList.add('lzs-visible');
        setStatus('Setup complete.', false);
      } else if (!verdict.allAnswered && wrong === 0) {
        setStatus(unanswered + ' component' + (unanswered > 1 ? 's' : '') +
          ' need' + (unanswered > 1 ? '' : 's') + ' an answer.', true);
      } else {
        const parts = [];
        if (wrong) parts.push(wrong + ' component' + (wrong > 1 ? 's are' : ' is') + ' incorrect.');
        if (unanswered) parts.push(unanswered + ' still unanswered.');
        setStatus(parts.join(' ') + ' See the messages below each dropdown.', true);
      }
    }

    function handleCheck() {
      const verdict = validate();
      applyResults(verdict);
    }
    function handleReset() {
      rotation = 0;
      seedOffset = 0;
      regenerateDerangement();
      for (const key of COMPONENT_KEYS) compState[key].selectEl.value = '';
      detailsEl.open = false;
      clearAllFeedback();
      renderAll();
    }

    checkBtn.addEventListener('click', handleCheck);
    resetBtn.addEventListener('click', handleReset);

    // ── Container-width responsive classes ──────────────────────────────
    // Toggle classes based on the widget root's own width so the layout
    // adapts to narrow embedding containers (e.g. LXP content columns)
    // regardless of viewport width.
    if (typeof ResizeObserver !== 'undefined') {
      const rootRo = new ResizeObserver((entries) => {
        const w = entries[0].contentRect.width;
        root.classList.toggle('lzs-narrow', w < 760);
      });
      rootRo.observe(root);
    }

    // ── Initial render ────────────────────────────────────────────────────
    renderAll();
  }

  // ── Bootstrap ───────────────────────────────────────────────────────────
  function bootAll() {
    document.querySelectorAll('.lzs-widget').forEach((root) => {
      if (root.dataset.lzsMounted === '1') return;
      root.dataset.lzsMounted = '1';
      mountWidget(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAll);
  } else {
    bootAll();
  }
}());
