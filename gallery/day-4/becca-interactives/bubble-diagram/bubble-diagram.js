(function () {
  'use strict';

  // =========================================================================
  // BUBBLE DIAGRAM (composition counterexample) — embeddable widget
  //
  // Each <div class="bd-widget" data-problem='{...}'></div> on the page is
  // mounted as an independent instance. State and DOM refs are kept in a
  // closure per mount, so multiple widgets can coexist without interference.
  // SVG marker IDs are made unique per instance to avoid url(#...) collisions.
  // =========================================================================

  const NS = 'http://www.w3.org/2000/svg';

  // Geometry & limits
  const OVAL_CX      = { A: 140, B: 430, C: 720 };
  const ELEM_TOP     = 62;
  const ELEM_BOT     = 384;
  const ELEM_R       = 14;
  const MIN_ELEMS    = 2;
  const MAX_ELEMS    = 5;
  const CURVE_OFFSET = 22;
  const SUB          = ['', '₁', '₂', '₃', '₄', '₅'];

  const SRC = { f: 'A', g: 'B' };
  const TGT = { f: 'B', g: 'C' };

  // Global instance counter for unique SVG marker IDs across mounts.
  let widgetSeq = 0;

  // ── Pure helpers (shared across instances) ─────────────────────────────
  function elemLabel(setKey, i) {
    return { A: 'a', B: 'b', C: 'c' }[setKey] + SUB[i + 1];
  }

  function elemPos(setKey, i, n) {
    const spacing = (ELEM_BOT - ELEM_TOP) / (n + 1);
    return { x: OVAL_CX[setKey], y: ELEM_TOP + spacing * (i + 1) };
  }

  function endpoints(x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return { sx: x1, sy: y1, ex: x2, ey: y2 };
    const ux = dx / dist, uy = dy / dist;
    return {
      sx: x1 + ux * (ELEM_R + 2),
      sy: y1 + uy * (ELEM_R + 2),
      ex: x2 - ux * (ELEM_R + 4),
      ey: y2 - uy * (ELEM_R + 4),
    };
  }

  function bezierPath(x1, y1, x2, y2, curveSign = 1, curveOffset = CURVE_OFFSET) {
    const { sx, sy, ex, ey } = endpoints(x1, y1, x2, y2);
    const mx = (sx + ex) / 2, my = (sy + ey) / 2;
    const dx = ex - sx, dy = ey - sy;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return `M ${sx},${sy} L ${ex},${ey}`;
    const nx = dy / dist, ny = -dx / dist;
    const cx = mx + nx * curveOffset * curveSign,
          cy = my + ny * curveOffset * curveSign;
    return `M ${sx},${sy} Q ${cx},${cy} ${ex},${ey}`;
  }

  function svgEl(tag, attrs) {
    const el = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  }

  // {total, injective, surjective} for a relation given by arrowMap.
  function computeProps(arrowMap, srcCount, tgtCount) {
    let total = true;
    for (let i = 0; i < srcCount; i++) {
      if (!(i in arrowMap)) { total = false; break; }
    }
    const targets   = Object.values(arrowMap).map(Number);
    const injective = targets.length === new Set(targets).size;
    const targetSet = new Set(targets);
    let surjective  = true;
    for (let i = 0; i < tgtCount; i++) {
      if (!targetSet.has(i)) { surjective = false; break; }
    }
    return { total, injective, surjective };
  }

  function clampCount(n) {
    n = Math.floor(Number(n));
    if (!Number.isFinite(n)) return 3;
    if (n < MIN_ELEMS) return MIN_ELEMS;
    if (n > MAX_ELEMS) return MAX_ELEMS;
    return n;
  }

  function escapeText(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ── Mount a single widget instance ─────────────────────────────────────
  function mountWidget(root) {
    let problem;
    try {
      problem = JSON.parse(root.dataset.problem || '{}');
    } catch (e) {
      console.error('bubble-diagram: invalid data-problem JSON', e);
      return;
    }
    if (!problem.parts || !problem.parts.length) {
      console.error('bubble-diagram: data-problem must include a non-empty "parts" array');
      return;
    }

    const instanceId = ++widgetSeq;
    const markerIds  = {
      f:   `bd-arrow-f-${instanceId}`,
      g:   `bd-arrow-g-${instanceId}`,
      gof: `bd-arrow-gof-${instanceId}`,
    };

    const setDefaults = problem.setDefaults || {};
    const INITIAL_COUNTS = {
      A: clampCount(setDefaults.A != null ? setDefaults.A : 3),
      B: clampCount(setDefaults.B != null ? setDefaults.B : 4),
      C: clampCount(setDefaults.C != null ? setDefaults.C : 2),
    };

    const counts  = { ...INITIAL_COUNTS };
    const arrows  = { f: {}, g: {} };
    let pending   = null;
    let mode      = 'f';
    let activePartIdx = 0;

    const parts = problem.parts;

    // ── Build inner DOM ────────────────────────────────────────────────
    const titleHtml = problem.title
      ? `<h1 class="bd-title">${escapeText(problem.title)}</h1>`
      : '';

    const tabsHtml = parts.map((p, i) =>
      `<button class="part-tab ${i === 0 ? 'active' : ''}" data-part-idx="${i}" type="button">${escapeText(p.label || `Part ${i + 1}`)}</button>`
    ).join('');

    const stmtsHtml = parts.map((p, i) =>
      `<div class="problem-statement ${i === 0 ? '' : 'hidden'}" data-part-idx="${i}">${p.statement || ''}</div>`
    ).join('');

    const goalsHtml = parts.map((p, i) =>
      `<div class="goal-panel ${i === 0 ? '' : 'hidden'}" data-part-idx="${i}">${p.goalHtml || ''}</div>`
    ).join('');

    const anyHints = parts.some(p => p.hintHtml);
    const hintsListHtml = parts.map((p, i) =>
      p.hintHtml
        ? `<li class="${i === 0 ? '' : 'hidden'}" data-part-idx="${i}">${p.hintHtml}</li>`
        : ''
    ).join('');

    const hintsPanelHtml = anyHints ? `
      <div class="hints hidden">
        <div class="hints-heading">Hints</div>
        <ul>${hintsListHtml}</ul>
      </div>` : '';

    const hintToggleHtml = anyHints
      ? '<button class="btn hint-toggle" type="button">Show hints</button>'
      : '';

    root.innerHTML = `
      ${titleHtml}
      <div class="part-tabs">${tabsHtml}</div>
      ${stmtsHtml}
      ${goalsHtml}
      <div class="controls">
        <span class="mode-label">Drawing mode:</span>
        <button class="mode-btn active" data-mode="f" type="button">Draw <em>f</em>&nbsp; (A → B)</button>
        <button class="mode-btn" data-mode="g" type="button">Draw <em>g</em>&nbsp; (B → C)</button>
        ${hintToggleHtml}
        <button class="btn btn-reset reset-btn" type="button">↺ Reset</button>
      </div>
      ${hintsPanelHtml}
      <div class="svg-wrapper">
        <svg class="bd-svg" viewBox="0 0 860 420" xmlns="${NS}">
          <defs>
            <marker id="${markerIds.f}" markerUnits="strokeWidth" markerWidth="9" markerHeight="7" refX="7" refY="3.5" orient="auto">
              <path d="M0,0 L0,7 L9,3.5 z" fill="#4a7fc1"/>
            </marker>
            <marker id="${markerIds.g}" markerUnits="strokeWidth" markerWidth="9" markerHeight="7" refX="7" refY="3.5" orient="auto">
              <path d="M0,0 L0,7 L9,3.5 z" fill="#3a9a6a"/>
            </marker>
            <marker id="${markerIds.gof}" markerUnits="strokeWidth" markerWidth="10" markerHeight="8" refX="8" refY="4" orient="auto">
              <path d="M0,0 L0,8 L10,4 z" fill="#aaa"/>
            </marker>
          </defs>
          <ellipse cx="140" cy="218" rx="84" ry="178" fill="#fafafa" stroke="#bbb" stroke-width="1.5"/>
          <ellipse cx="430" cy="218" rx="84" ry="178" fill="#fafafa" stroke="#bbb" stroke-width="1.5"/>
          <ellipse cx="720" cy="218" rx="84" ry="178" fill="#fafafa" stroke="#bbb" stroke-width="1.5"/>
          <text x="140" y="28" font-family="Georgia, 'Times New Roman', serif" font-size="22" font-weight="bold" font-style="italic" fill="#333" text-anchor="middle">A</text>
          <text x="430" y="28" font-family="Georgia, 'Times New Roman', serif" font-size="22" font-weight="bold" font-style="italic" fill="#333" text-anchor="middle">B</text>
          <text x="720" y="28" font-family="Georgia, 'Times New Roman', serif" font-size="22" font-weight="bold" font-style="italic" fill="#333" text-anchor="middle">C</text>
          <text x="285" y="22" font-family="Georgia, 'Times New Roman', serif" font-size="15" font-style="italic" fill="#4a7fc1" text-anchor="middle">f</text>
          <line x1="260" y1="17" x2="308" y2="17" stroke="#4a7fc1" stroke-width="1" opacity="0.35" marker-end="url(#${markerIds.f})"/>
          <text x="575" y="22" font-family="Georgia, 'Times New Roman', serif" font-size="15" font-style="italic" fill="#3a9a6a" text-anchor="middle">g</text>
          <line x1="550" y1="17" x2="598" y2="17" stroke="#3a9a6a" stroke-width="1" opacity="0.35" marker-end="url(#${markerIds.g})"/>
          <text x="430" y="412" font-family="Georgia, 'Times New Roman', serif" font-size="13" font-style="italic" fill="#aaa" text-anchor="middle">g ∘ f</text>
          <g class="layer-gof-arrows"></g>
          <g class="layer-g-arrows"></g>
          <g class="layer-f-arrows"></g>
          <g class="layer-elements"></g>
        </svg>
      </div>
      <p class="svg-instructions">Click a source element, then a target element to draw an arrow &nbsp;·&nbsp; Shift-click or right-click an arrow to remove it</p>
      <div class="set-controls">
        <div class="set-ctrl">
          <span class="set-ctrl-name">Set <em>A</em></span>
          <button class="elem-btn" data-set="A" data-delta="-1" type="button">−</button>
          <span class="elem-count" data-set="A">${INITIAL_COUNTS.A}</span>
          <button class="elem-btn" data-set="A" data-delta="1" type="button">+</button>
        </div>
        <div class="set-ctrl">
          <span class="set-ctrl-name">Set <em>B</em></span>
          <button class="elem-btn" data-set="B" data-delta="-1" type="button">−</button>
          <span class="elem-count" data-set="B">${INITIAL_COUNTS.B}</span>
          <button class="elem-btn" data-set="B" data-delta="1" type="button">+</button>
        </div>
        <div class="set-ctrl">
          <span class="set-ctrl-name">Set <em>C</em></span>
          <button class="elem-btn" data-set="C" data-delta="-1" type="button">−</button>
          <span class="elem-count" data-set="C">${INITIAL_COUNTS.C}</span>
          <button class="elem-btn" data-set="C" data-delta="1" type="button">+</button>
        </div>
      </div>
      <div class="properties-panel">
        <h2>Properties</h2>
        <table class="props-table">
          <thead>
            <tr><th></th><th>Total fn</th><th>Injective</th><th>Surjective</th></tr>
          </thead>
          <tbody>
            <tr data-row="f"><th><em>f</em></th><td>—</td><td>—</td><td>—</td></tr>
            <tr data-row="g"><th><em>g</em></th><td>—</td><td>—</td><td>—</td></tr>
            <tr data-row="gof"><th><em>g</em> ∘ <em>f</em></th><td>—</td><td>—</td><td>—</td></tr>
          </tbody>
        </table>
      </div>
      <div class="success-banner hidden">✓ Valid example found! This construction satisfies all the goal conditions.</div>
    `;

    // ── DOM refs (scoped to root) ──────────────────────────────────────
    const svg            = root.querySelector('.bd-svg');
    const layerElems     = root.querySelector('.layer-elements');
    const layerFArr      = root.querySelector('.layer-f-arrows');
    const layerGArr      = root.querySelector('.layer-g-arrows');
    const layerGofArr    = root.querySelector('.layer-gof-arrows');
    const hintsPanel     = root.querySelector('.hints');
    const hintToggleBtn  = root.querySelector('.hint-toggle');
    const resetBtn       = root.querySelector('.reset-btn');
    const successBanner  = root.querySelector('.success-banner');

    // ── Per-instance methods ───────────────────────────────────────────
    function computeGof() {
      const gof = {};
      for (const [ai, bi] of Object.entries(arrows.f)) {
        const bIdx = +bi;
        if (bIdx in arrows.g) gof[+ai] = arrows.g[bIdx];
      }
      return gof;
    }

    function makeArrowEl(pathD, color, markerUrl, fn, fromIdx, toIdx) {
      const g = svgEl('g', {
        class:       `arrow arrow-${fn}`,
        'data-fn':   fn,
        'data-from': fromIdx,
        'data-to':   toIdx,
        cursor:      'pointer',
      });
      g.appendChild(svgEl('path', {
        d:              pathD,
        stroke:         'transparent',
        'stroke-width': 12,
        fill:           'none',
      }));
      g.appendChild(svgEl('path', {
        d:                pathD,
        stroke:           color,
        'stroke-width':   1.8,
        fill:             'none',
        'marker-end':     markerUrl,
        'pointer-events': 'none',
      }));
      return g;
    }

    function refreshSelectionHighlight() {
      layerElems.querySelectorAll('.element-circle.selected')
        .forEach(el => el.classList.remove('selected'));
      if (pending) {
        const elemG = layerElems.querySelector(`.element[data-set="${pending.fromKey}"][data-idx="${pending.fromIdx}"]`);
        if (elemG) elemG.querySelector('.element-circle').classList.add('selected');
      }
    }

    function renderElements() {
      layerElems.innerHTML = '';
      for (const key of ['A', 'B', 'C']) {
        const n = counts[key];
        for (let i = 0; i < n; i++) {
          const { x, y } = elemPos(key, i, n);
          const g = svgEl('g', {
            class:      'element',
            'data-set': key,
            'data-idx': i,
          });
          g.appendChild(svgEl('circle', { cx: x, cy: y, r: ELEM_R, class: 'element-circle' }));
          const txt = svgEl('text', {
            x, y,
            class:               'element-label',
            'dominant-baseline': 'central',
            'text-anchor':       'middle',
          });
          txt.textContent = elemLabel(key, i);
          g.appendChild(txt);
          layerElems.appendChild(g);
        }
      }
      refreshSelectionHighlight();
    }

    function renderArrows() {
      layerFArr.innerHTML   = '';
      layerGArr.innerHTML   = '';
      layerGofArr.innerHTML = '';

      for (const [from, to] of Object.entries(arrows.f)) {
        const fi = +from, ti = +to;
        if (fi >= counts.A || ti >= counts.B) continue;
        const s = elemPos('A', fi, counts.A);
        const t = elemPos('B', ti, counts.B);
        layerFArr.appendChild(
          makeArrowEl(bezierPath(s.x, s.y, t.x, t.y), '#4a7fc1', `url(#${markerIds.f})`, 'f', fi, ti)
        );
      }

      for (const [from, to] of Object.entries(arrows.g)) {
        const fi = +from, ti = +to;
        if (fi >= counts.B || ti >= counts.C) continue;
        const s = elemPos('B', fi, counts.B);
        const t = elemPos('C', ti, counts.C);
        layerGArr.appendChild(
          makeArrowEl(bezierPath(s.x, s.y, t.x, t.y), '#3a9a6a', `url(#${markerIds.g})`, 'g', fi, ti)
        );
      }

      const gof = computeGof();
      for (const [ai, ci] of Object.entries(gof)) {
        const aIdx = +ai, cIdx = +ci;
        if (aIdx >= counts.A || cIdx >= counts.C) continue;
        const s = elemPos('A', aIdx, counts.A);
        const t = elemPos('C', cIdx, counts.C);
        layerGofArr.appendChild(svgEl('path', {
          d:                bezierPath(s.x, s.y, t.x, t.y, -1, 40),
          stroke:           '#aaa',
          'stroke-width':   1.2,
          'stroke-dasharray': '6,4',
          fill:             'none',
          'marker-end':     `url(#${markerIds.gof})`,
          'pointer-events': 'none',
        }));
      }

      updateProperties();
    }

    function updateProperties() {
      const propsF   = computeProps(arrows.f, counts.A, counts.B);
      const propsG   = computeProps(arrows.g, counts.B, counts.C);
      const gof      = computeGof();
      const propsGof = computeProps(gof, counts.A, counts.C);

      const propsByRow = { f: propsF, g: propsG, gof: propsGof };
      const PROP_KEYS  = ['total', 'injective', 'surjective'];
      const PROP_INDEX = { total: 0, injective: 1, surjective: 2 };

      for (const rowKey of ['f', 'g', 'gof']) {
        const tds  = root.querySelectorAll(`tr[data-row="${rowKey}"] td`);
        const p    = propsByRow[rowKey];
        PROP_KEYS.forEach((k, i) => {
          const v = p[k];
          tds[i].textContent = v ? '✓' : '✗';
          tds[i].className   = v ? 'check' : 'cross';
        });
      }

      const part = parts[activePartIdx];
      let allMet = (part.constraints && part.constraints.length > 0);

      for (const c of part.constraints || []) {
        const rowProps = propsByRow[c.fn];
        if (!rowProps) continue;
        for (const propSpec of c.props || []) {
          const wantTrue = !propSpec.startsWith('!');
          const propName = wantTrue ? propSpec : propSpec.slice(1);
          const colIdx   = PROP_INDEX[propName];
          if (colIdx == null) continue;
          const td  = root.querySelectorAll(`tr[data-row="${c.fn}"] td`)[colIdx];
          const got = rowProps[propName];
          const met = (got === wantTrue);
          td.classList.add(met ? 'goal-met' : 'goal-unmet');
          if (!met) allMet = false;
        }
      }

      successBanner.classList.toggle('hidden', !allMet);
    }

    // ── Click handlers ─────────────────────────────────────────────────
    function handleElemClick(setKey, idx) {
      const src = SRC[mode], tgt = TGT[mode];

      if (!pending) {
        if (setKey !== src) return;
        pending = { fromKey: setKey, fromIdx: idx };
        refreshSelectionHighlight();
        return;
      }
      if (setKey === pending.fromKey && idx === pending.fromIdx) {
        pending = null;
        refreshSelectionHighlight();
        return;
      }
      if (setKey === src) {
        pending = { fromKey: setKey, fromIdx: idx };
        refreshSelectionHighlight();
        return;
      }
      if (setKey === tgt) {
        arrows[mode][pending.fromIdx] = idx;
        pending = null;
        refreshSelectionHighlight();
        renderArrows();
      }
    }

    function removeArrow(fn, fromIdx) {
      delete arrows[fn][fromIdx];
      renderArrows();
    }

    svg.addEventListener('click', (e) => {
      if (e.shiftKey) {
        const arrowG = e.target.closest('.arrow');
        if (arrowG) { removeArrow(arrowG.dataset.fn, +arrowG.dataset.from); return; }
      }
      const elemG = e.target.closest('.element');
      if (elemG) { handleElemClick(elemG.dataset.set, +elemG.dataset.idx); return; }
      pending = null;
      refreshSelectionHighlight();
    });

    svg.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const arrowG = e.target.closest('.arrow');
      if (arrowG) removeArrow(arrowG.dataset.fn, +arrowG.dataset.from);
    });

    // ── Set size controls ──────────────────────────────────────────────
    function pruneArrows(key, removedIdx) {
      if (key === 'A') {
        delete arrows.f[removedIdx];
      }
      if (key === 'B') {
        delete arrows.g[removedIdx];
        for (const k of Object.keys(arrows.f)) {
          if (arrows.f[k] === removedIdx) delete arrows.f[k];
        }
      }
      if (key === 'C') {
        for (const k of Object.keys(arrows.g)) {
          if (arrows.g[k] === removedIdx) delete arrows.g[k];
        }
      }
    }

    function updateCountDisplays() {
      for (const key of ['A', 'B', 'C']) {
        root.querySelector(`.elem-count[data-set="${key}"]`).textContent = counts[key];
        root.querySelectorAll(`.elem-btn[data-set="${key}"]`).forEach(b => {
          const delta = +b.dataset.delta;
          b.disabled = (delta < 0 && counts[key] <= MIN_ELEMS) ||
                       (delta > 0 && counts[key] >= MAX_ELEMS);
        });
      }
    }

    root.querySelector('.set-controls').addEventListener('click', (e) => {
      const btn = e.target.closest('.elem-btn');
      if (!btn) return;
      const key   = btn.dataset.set;
      const delta = +btn.dataset.delta;
      if (delta > 0 && counts[key] < MAX_ELEMS) {
        counts[key]++;
      } else if (delta < 0 && counts[key] > MIN_ELEMS) {
        const lastIdx = counts[key] - 1;
        if (pending && pending.fromKey === key && pending.fromIdx === lastIdx) pending = null;
        pruneArrows(key, lastIdx);
        counts[key]--;
      } else {
        return;
      }
      renderElements();
      renderArrows();
      updateCountDisplays();
    });

    // ── Tab / part switching ───────────────────────────────────────────
    function switchPart(idx) {
      activePartIdx = idx;
      root.querySelectorAll('.part-tab').forEach(tab => {
        tab.classList.toggle('active', +tab.dataset.partIdx === idx);
      });
      root.querySelectorAll('.problem-statement').forEach(el => {
        el.classList.toggle('hidden', +el.dataset.partIdx !== idx);
      });
      root.querySelectorAll('.goal-panel').forEach(el => {
        el.classList.toggle('hidden', +el.dataset.partIdx !== idx);
      });
      if (hintsPanel) {
        hintsPanel.querySelectorAll('li').forEach(el => {
          el.classList.toggle('hidden', +el.dataset.partIdx !== idx);
        });
        hintsPanel.classList.add('hidden');
      }
      if (hintToggleBtn) hintToggleBtn.textContent = 'Show hints';
      resetDiagram();
    }

    root.querySelector('.part-tabs').addEventListener('click', (e) => {
      const tab = e.target.closest('.part-tab');
      if (!tab) return;
      switchPart(+tab.dataset.partIdx);
    });

    // ── Hint toggle ────────────────────────────────────────────────────
    if (hintToggleBtn && hintsPanel) {
      hintToggleBtn.addEventListener('click', () => {
        const isHidden = hintsPanel.classList.toggle('hidden');
        hintToggleBtn.textContent = isHidden ? 'Show hints' : 'Hide hints';
      });
    }

    // ── Mode selector ──────────────────────────────────────────────────
    root.querySelector('.controls').addEventListener('click', (e) => {
      const btn = e.target.closest('.mode-btn');
      if (!btn) return;
      mode = btn.dataset.mode;
      root.querySelectorAll('.mode-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.mode === mode);
      });
      pending = null;
      refreshSelectionHighlight();
    });

    // ── Reset ──────────────────────────────────────────────────────────
    function resetDiagram() {
      arrows.f = {};
      arrows.g = {};
      pending  = null;
      for (const key of ['A', 'B', 'C']) counts[key] = INITIAL_COUNTS[key];
      mode = 'f';
      root.querySelectorAll('.mode-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.mode === 'f');
      });
      renderElements();
      renderArrows();
      updateCountDisplays();
      refreshSelectionHighlight();
    }

    resetBtn.addEventListener('click', resetDiagram);

    // ── Initial render ─────────────────────────────────────────────────
    renderElements();
    updateCountDisplays();
    updateProperties();
  }

  // ── Bootstrap: mount every .bd-widget on the page (idempotent) ─────────
  function bootAll() {
    document.querySelectorAll('.bd-widget').forEach((root) => {
      if (root.dataset.bdMounted === '1') return;
      root.dataset.bdMounted = '1';
      mountWidget(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAll);
  } else {
    bootAll();
  }
}());
