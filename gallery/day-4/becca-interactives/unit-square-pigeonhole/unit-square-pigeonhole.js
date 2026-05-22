(function () {
  'use strict';

  // =========================================================================
  // UNIT SQUARE PIGEONHOLE VISUALIZER (W34) — embeddable widget
  //
  // Each <div class="usq-widget" data-problem='{...}'></div> on the page is
  // mounted as an independent instance. The widget pairs an SVG-based
  // unit-square visualization (click-to-place points; partition is driven
  // by the pigeonholes dropdown selection) with the same 4-component PHP
  // setup mapper used by W18.
  //
  // Single UI: the dropdowns are the controls. The pigeonholes dropdown's
  // selected option-id is used to look up which partition to draw. Option
  // ids without a matching partition draw no grid (just the square + points).
  //
  // No document-wide IDs; everything scoped via root.querySelector.
  // =========================================================================

  // ── Constants ────────────────────────────────────────────────────────────
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const VB = 380;             // viewBox side length
  const MARGIN = 10;          // square inset from viewBox edge
  const SQ = VB - 2 * MARGIN; // square pixel side (= 360)
  const POINT_R = 6;          // point circle radius (pixels)
  const POINT_HIT_R = 12;     // pixel distance under which a click "hits" a point

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

  // Partition definitions. `regionOf(x, y)` returns an integer region index
  // for a point in [0, 1]². `gridLines` are the partition boundaries to
  // draw (in unit-square coordinates):
  //   { type: 'v', at: <x> }            — vertical line at x = at
  //   { type: 'h', at: <y> }            — horizontal line at y = at
  //   { type: 'd', x1, y1, x2, y2 }     — diagonal line in unit coords
  const PARTITIONS = {
    'strip2': {
      label: '2 strips',
      count: 2,
      regionOf: function (x) { return x < 0.5 ? 0 : 1; },
      gridLines: [{ type: 'v', at: 0.5 }]
    },
    'quad4': {
      label: '4 quadrants',
      count: 4,
      regionOf: function (x, y) {
        const col = x < 0.5 ? 0 : 1;
        const row = y < 0.5 ? 0 : 1;
        return row * 2 + col;
      },
      gridLines: [
        { type: 'v', at: 0.5 },
        { type: 'h', at: 0.5 }
      ]
    },
    // Four triangles formed by the two diagonals of the unit square.
    // Same hole count as quad4, but the longest pair within any triangle is
    // the full bottom/top edge (length 1) — a much weaker bound. Useful
    // teaching counterexample to "any 4-region partition works."
    'diag4': {
      label: '4 diagonal triangles',
      count: 4,
      regionOf: function (x, y) {
        // Top triangle:    y < x and y < 1 - x
        // Right triangle:  x > y and x > 1 - y
        // Bottom triangle: y > x and y > 1 - x
        // Left triangle:   x < y and x < 1 - y  (fall-through)
        if (y < x && y < 1 - x) return 0;
        if (x > y && x > 1 - y) return 1;
        if (y > x && y > 1 - x) return 2;
        return 3;
      },
      gridLines: [
        { type: 'd', x1: 0, y1: 0, x2: 1, y2: 1 },
        { type: 'd', x1: 0, y1: 1, x2: 1, y2: 0 }
      ]
    },
    'strip5': {
      label: '5 strips',
      count: 5,
      regionOf: function (x) { return Math.min(4, Math.max(0, Math.floor(x * 5))); },
      gridLines: [
        { type: 'v', at: 0.2 },
        { type: 'v', at: 0.4 },
        { type: 'v', at: 0.6 },
        { type: 'v', at: 0.8 }
      ]
    },
    'sq9': {
      label: '9 small squares',
      count: 9,
      regionOf: function (x, y) {
        const col = Math.min(2, Math.max(0, Math.floor(x * 3)));
        const row = Math.min(2, Math.max(0, Math.floor(y * 3)));
        return row * 3 + col;
      },
      gridLines: [
        { type: 'v', at: 1 / 3 }, { type: 'v', at: 2 / 3 },
        { type: 'h', at: 1 / 3 }, { type: 'h', at: 2 / 3 }
      ]
    }
  };

  // Map dropdown option-id → partition key. Options whose ids don't appear
  // here just leave the visualization unparted (no grid). Authors who want
  // a non-geometric distractor (e.g. "the 4 corners") can use any id not
  // in this map and the visual stays clean.
  const OPTION_ID_TO_PARTITION = {
    'strip2':  'strip2',
    'quad4':   'quad4',
    'diag4':   'diag4',
    'strip5':  'strip5',
    'sq9':     'sq9'
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

  function worldToPixel(x, y) {
    return { px: MARGIN + SQ * x, py: MARGIN + SQ * y };
  }

  function svgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    if (attrs) {
      for (const k in attrs) el.setAttribute(k, attrs[k]);
    }
    return el;
  }

  function fmt(n) { return Number(n).toFixed(3); }

  // ── Mount a single widget instance ───────────────────────────────────────
  function mountWidget(root) {
    let problem;
    try {
      problem = JSON.parse(root.dataset.problem || '{}');
    } catch (e) {
      console.error('unit-square-pigeonhole: invalid data-problem JSON', e);
      return;
    }

    if (!isString(problem.statement)) {
      console.error('unit-square-pigeonhole: data-problem must include a statement string');
      return;
    }
    if (!problem.components || typeof problem.components !== 'object') {
      console.error('unit-square-pigeonhole: data-problem must include a components object');
      return;
    }

    // Validate components (same shape as W18).
    const compState = Object.create(null);
    for (const key of COMPONENT_KEYS) {
      const c = problem.components[key];
      if (!c || !Array.isArray(c.options) || c.options.length < 2) {
        console.error('unit-square-pigeonhole: component "' + key + '" must have at least 2 options');
        return;
      }
      const seenIds = Object.create(null);
      let correctCount = 0;
      const opts = [];
      for (const o of c.options) {
        if (!isString(o.id) || !isString(o.text)) {
          console.error('unit-square-pigeonhole: each option needs id and text', o);
          return;
        }
        if (seenIds[o.id]) {
          console.error('unit-square-pigeonhole: duplicate option id "' + o.id + '" in component "' + key + '"');
          return;
        }
        seenIds[o.id] = true;
        if (o.correct) correctCount++;
        opts.push({
          id: o.id,
          text: o.text,
          correct: !!o.correct,
          feedback: isString(o.feedback) ? o.feedback : null
        });
      }
      if (correctCount !== 1) {
        console.error('unit-square-pigeonhole: component "' + key + '" must have exactly one correct option, found ' + correctCount);
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

    // Visualization parameters. Only `pointCap` remains relevant — the
    // partition is now driven by the pigeonholes dropdown selection, so
    // there's no separate selector or default to configure.
    const vizCfg = (problem.viz && typeof problem.viz === 'object') ? problem.viz : {};
    const pointCap = (typeof vizCfg.pointCap === 'number' && vizCfg.pointCap > 0)
      ? Math.floor(vizCfg.pointCap) : 5;

    widgetSeq++;
    const instanceId = 'usq-' + widgetSeq;

    // Seeded display orders for the dropdowns.
    for (const key of COMPONENT_KEYS) {
      const c = compState[key];
      const idsKey = c.options.map(o => o.id).join('|');
      const seed = hashString(instanceId + ':' + key + ':' + idsKey);
      c.displayOrder = seededShuffle(c.options.slice(), seed);
    }

    // Mutable state.
    let points = [];                  // Array<{ x, y }>
    let currentPartition = null;      // null = no partition; else PARTITIONS key

    // ── Build DOM scaffold ─────────────────────────────────────────────────
    root.innerHTML = '';

    if (isString(problem.title)) {
      const h = document.createElement('h1');
      h.className = 'usq-title';
      h.textContent = problem.title;
      root.appendChild(h);
    }

    const successBanner = document.createElement('div');
    successBanner.className = 'usq-success-banner';
    successBanner.innerHTML = (problem.success && isString(problem.success.banner))
      ? problem.success.banner
      : '<strong>Correct setup.</strong> All four components match.';
    root.appendChild(successBanner);

    const statementEl = document.createElement('div');
    statementEl.className = 'usq-statement';
    statementEl.innerHTML = problem.statement;
    root.appendChild(statementEl);

    if (isString(problem.hint)) {
      const hintEl = document.createElement('div');
      hintEl.className = 'usq-hint';
      hintEl.innerHTML = problem.hint;
      root.appendChild(hintEl);
    }

    // ── Body: viz panel | mapper panel ────────────────────────────────────
    const body = document.createElement('div');
    body.className = 'usq-body';

    // ── Viz panel (just SVG; no buttons, no annotation) ───────────────────
    const vizPanel = document.createElement('div');
    vizPanel.className = 'usq-panel';
    const vizTitle = document.createElement('div');
    vizTitle.className = 'usq-panel-title';
    vizTitle.textContent = 'Place up to ' + pointCap + ' points · Click a placed point to remove it';
    vizPanel.appendChild(vizTitle);

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'usq-viz-svg');
    svg.setAttribute('viewBox', '0 0 ' + VB + ' ' + VB);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Unit square with placed points and partition grid');
    vizPanel.appendChild(svg);

    body.appendChild(vizPanel);

    // ── Mapper panel ──────────────────────────────────────────────────────
    const mapPanel = document.createElement('div');
    mapPanel.className = 'usq-panel';
    const mapTitle = document.createElement('div');
    mapTitle.className = 'usq-panel-title';
    mapTitle.textContent = 'Identify the four components';
    mapPanel.appendChild(mapTitle);

    for (const key of COMPONENT_KEYS) {
      const c = compState[key];
      const compEl = document.createElement('div');
      compEl.className = 'usq-component';
      compEl.dataset.component = key;

      const label = document.createElement('label');
      label.className = 'usq-component-label';
      label.textContent = c.label;

      const prompt = document.createElement('span');
      prompt.className = 'usq-component-prompt';
      prompt.textContent = c.prompt;

      const row = document.createElement('div');
      row.className = 'usq-select-row';

      const select = document.createElement('select');
      select.className = 'usq-select';
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
      // On every change: clear feedback and (for pigeonholes) update the
      // partition so the visualization tracks the current selection.
      select.addEventListener('change', () => {
        clearComponentFeedback(key);
        successBanner.classList.remove('usq-visible');
        if (key === 'pigeonholes') {
          updatePartitionFromDropdown();
          renderViz();
        }
      });

      const marker = document.createElement('span');
      marker.className = 'usq-marker';
      marker.setAttribute('aria-hidden', 'true');

      row.appendChild(select);
      row.appendChild(marker);

      const feedback = document.createElement('div');
      feedback.className = 'usq-component-feedback';

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
    controls.className = 'usq-controls';
    const checkBtn = document.createElement('button');
    checkBtn.type = 'button';
    checkBtn.className = 'usq-btn usq-btn-primary';
    checkBtn.textContent = 'Check';
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'usq-btn';
    resetBtn.textContent = 'Reset';
    controls.appendChild(checkBtn);
    controls.appendChild(resetBtn);
    root.appendChild(controls);

    const statusLine = document.createElement('div');
    statusLine.className = 'usq-status-line';
    statusLine.setAttribute('role', 'status');
    statusLine.setAttribute('aria-live', 'polite');
    root.appendChild(statusLine);

    // ── Helpers ──────────────────────────────────────────────────────────
    function stripTags(html) {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
    }

    function pixelToWorld(ev) {
      const pt = svg.createSVGPoint();
      pt.x = ev.clientX;
      pt.y = ev.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return null;
      const local = pt.matrixTransform(ctm.inverse());
      const x = (local.x - MARGIN) / SQ;
      const y = (local.y - MARGIN) / SQ;
      return { x: x, y: y, px: local.x, py: local.y };
    }

    function findNearestPointIdx(localPx, localPy) {
      let best = -1, bestD = POINT_HIT_R;
      for (let i = 0; i < points.length; i++) {
        const wp = worldToPixel(points[i].x, points[i].y);
        const dx = wp.px - localPx;
        const dy = wp.py - localPy;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d <= bestD) { best = i; bestD = d; }
      }
      return best;
    }

    function pointsByRegion() {
      if (!currentPartition) return null;
      const partition = PARTITIONS[currentPartition];
      const regions = Object.create(null);
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const r = partition.regionOf(p.x, p.y);
        if (!regions[r]) regions[r] = [];
        regions[r].push(i);
      }
      return regions;
    }

    // Find the longest pair of points that share a region. Returns null
    // if no two points share a region (or no partition is selected).
    function findHighlightPair() {
      const regions = pointsByRegion();
      if (!regions) return null;
      let best = null;
      for (const r in regions) {
        const indices = regions[r];
        if (indices.length < 2) continue;
        for (let a = 0; a < indices.length; a++) {
          for (let b = a + 1; b < indices.length; b++) {
            const i = indices[a], j = indices[b];
            const dx = points[i].x - points[j].x;
            const dy = points[i].y - points[j].y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (!best || d > best.dist) best = { i: i, j: j, dist: d };
          }
        }
      }
      return best;
    }

    function updatePartitionFromDropdown() {
      const optId = compState.pigeonholes.selectEl.value;
      currentPartition = OPTION_ID_TO_PARTITION[optId] || null;
    }

    // ── Render ────────────────────────────────────────────────────────────
    function renderViz() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);

      // Square outline.
      svg.appendChild(svgEl('rect', {
        x: MARGIN, y: MARGIN, width: SQ, height: SQ,
        class: 'usq-square-outline'
      }));

      // Partition grid lines (if any).
      if (currentPartition) {
        const partition = PARTITIONS[currentPartition];
        for (const ln of partition.gridLines) {
          if (ln.type === 'v') {
            const px = MARGIN + SQ * ln.at;
            svg.appendChild(svgEl('line', {
              x1: px, y1: MARGIN, x2: px, y2: MARGIN + SQ,
              class: 'usq-grid-line'
            }));
          } else if (ln.type === 'h') {
            const py = MARGIN + SQ * ln.at;
            svg.appendChild(svgEl('line', {
              x1: MARGIN, y1: py, x2: MARGIN + SQ, y2: py,
              class: 'usq-grid-line'
            }));
          } else if (ln.type === 'd') {
            const a = worldToPixel(ln.x1, ln.y1);
            const b = worldToPixel(ln.x2, ln.y2);
            svg.appendChild(svgEl('line', {
              x1: a.px, y1: a.py, x2: b.px, y2: b.py,
              class: 'usq-grid-line'
            }));
          }
        }
      }

      // Highlight pair (longest pair sharing a region).
      const pair = findHighlightPair();
      if (pair) {
        const a = worldToPixel(points[pair.i].x, points[pair.i].y);
        const b = worldToPixel(points[pair.j].x, points[pair.j].y);
        svg.appendChild(svgEl('line', {
          x1: a.px, y1: a.py, x2: b.px, y2: b.py,
          class: 'usq-pair-line'
        }));
        const mx = (a.px + b.px) / 2;
        const my = (a.py + b.py) / 2;
        const label = svgEl('text', {
          x: mx, y: my - 6,
          'text-anchor': 'middle',
          class: 'usq-pair-label'
        });
        label.textContent = 'd ≈ ' + fmt(pair.dist);
        svg.appendChild(label);
      }

      // Points.
      for (let i = 0; i < points.length; i++) {
        const wp = worldToPixel(points[i].x, points[i].y);
        const c = svgEl('circle', {
          cx: wp.px, cy: wp.py, r: POINT_R,
          class: 'usq-point',
          'data-pt-idx': String(i)
        });
        c.addEventListener('click', (ev) => {
          ev.stopPropagation();
          points.splice(i, 1);
          renderViz();
        });
        svg.appendChild(c);
      }
    }

    // ── SVG click handler (add point) ────────────────────────────────────
    svg.addEventListener('click', (ev) => {
      const w = pixelToWorld(ev);
      if (!w) return;
      if (w.x < 0 || w.x > 1 || w.y < 0 || w.y > 1) return;
      const localPx = MARGIN + SQ * w.x;
      const localPy = MARGIN + SQ * w.y;
      const hit = findNearestPointIdx(localPx, localPy);
      if (hit !== -1) {
        points.splice(hit, 1);
        renderViz();
        return;
      }
      if (points.length >= pointCap) return;
      const x = Math.max(0.005, Math.min(0.995, w.x));
      const y = Math.max(0.005, Math.min(0.995, w.y));
      points.push({ x: x, y: y });
      renderViz();
    });

    // ── Mapper panel grading ─────────────────────────────────────────────
    function clearComponentFeedback(key) {
      const c = compState[key];
      c.rootEl.classList.remove('usq-component-ok', 'usq-component-bad');
      c.markerEl.classList.remove('usq-marker-ok', 'usq-marker-bad');
      c.markerEl.textContent = '';
      c.feedbackEl.classList.remove('usq-feedback-ok', 'usq-feedback-bad');
      c.feedbackEl.innerHTML = '';
    }
    function clearAllFeedback() {
      for (const key of COMPONENT_KEYS) clearComponentFeedback(key);
      successBanner.classList.remove('usq-visible');
      statusLine.textContent = '';
      statusLine.classList.remove('usq-status-error');
    }
    function setStatus(text, isError) {
      statusLine.textContent = text || '';
      statusLine.classList.toggle('usq-status-error', !!isError);
    }

    function validate() {
      const results = Object.create(null);
      let allAnswered = true;
      let allCorrect = true;
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
          c.rootEl.classList.add('usq-component-bad');
          c.feedbackEl.classList.add('usq-feedback-bad');
          c.feedbackEl.innerHTML = 'Pick an option from the dropdown before checking.';
          continue;
        }
        if (r.state === 'ok') {
          c.rootEl.classList.add('usq-component-ok');
          c.markerEl.classList.add('usq-marker-ok');
          c.markerEl.textContent = '✓';
          c.feedbackEl.classList.add('usq-feedback-ok');
          c.feedbackEl.innerHTML = 'Correct.';
        } else {
          wrong++;
          c.rootEl.classList.add('usq-component-bad');
          c.markerEl.classList.add('usq-marker-bad');
          c.markerEl.textContent = '✗';
          c.feedbackEl.classList.add('usq-feedback-bad');
          c.feedbackEl.innerHTML = r.option.feedback || 'Not quite. Try a different option.';
        }
      }
      if (verdict.allCorrect) {
        successBanner.classList.add('usq-visible');
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
      points = [];
      currentPartition = null;
      for (const key of COMPONENT_KEYS) compState[key].selectEl.value = '';
      clearAllFeedback();
      renderViz();
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
        root.classList.toggle('usq-narrow', w < 760);
      });
      rootRo.observe(root);
    }

    // ── Initial render ────────────────────────────────────────────────────
    renderViz();
  }

  // ── Bootstrap ───────────────────────────────────────────────────────────
  function bootAll() {
    document.querySelectorAll('.usq-widget').forEach((root) => {
      if (root.dataset.usqMounted === '1') return;
      root.dataset.usqMounted = '1';
      mountWidget(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAll);
  } else {
    bootAll();
  }
}());
