(function () {
  'use strict';

  // =========================================================================
  // VENN DIAGRAM SET OPERATIONS EXPLORER — embeddable widget
  //
  // Each <div class="ven-widget" data-problem='{...}'></div> on the page is
  // mounted as an independent instance. State and DOM refs are kept in a
  // closure per mount, so multiple widgets can coexist without interference.
  // SVG clipPath / mask IDs are made unique per instance via a module-
  // level counter to avoid url(#...) collisions.
  //
  // Region geometry is implemented via SVG <clipPath> + <mask> boolean
  // composition: each circle has a clipPath (interior) and a mask (interior
  // black on a white background, i.e. "outside this circle" passes through).
  // A region is a covering rectangle of the highlight color, wrapped in
  // nested <g clip-path="..."> for "inside" constraints and given
  // mask="..." for "outside" constraints. This avoids manual SVG arc-flag
  // bookkeeping, which is the historical source of region-mismatch bugs.
  // =========================================================================

  const NS = 'http://www.w3.org/2000/svg';

  // Module-level instance counter for unique SVG IDs across mounts.
  let widgetSeq = 0;

  // ── Geometry constants ─────────────────────────────────────────────────
  // Two-set layout
  const TWO = {
    viewW: 640,
    viewH: 380,
    rect:  { x: 30,  y: 30,  w: 580, h: 320 },
    A:     { cx: 250, cy: 200, r: 110 },
    B:     { cx: 390, cy: 200, r: 110 },
  };

  // Three-set layout — three circles arranged in a triangular pattern.
  // Spacing chosen so the central A∩B∩C region is moderate (not so big
  // that it dominates, not so small that the label doesn't fit).
  const THREE = {
    viewW: 640,
    viewH: 440,
    rect:  { x: 30,  y: 30,  w: 580, h: 380 },
    A:     { cx: 245, cy: 180, r: 95 },
    B:     { cx: 395, cy: 180, r: 95 },
    C:     { cx: 320, cy: 300, r: 95 },
  };

  // ── Pure helpers ───────────────────────────────────────────────────────
  function svgEl(tag, attrs) {
    const el = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, v);
    return el;
  }

  function escapeText(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ── Default expression lists (when not provided in data-problem) ───────
  const DEFAULT_EXPRS_TWO = [
    { expr: 'A',          regions: ['A_only', 'AB'],            description: 'x ∈ A' },
    { expr: 'B',          regions: ['B_only', 'AB'],            description: 'x ∈ B' },
    { expr: 'A ∪ B',      regions: ['A_only', 'B_only', 'AB'],  description: 'x ∈ A or x ∈ B' },
    { expr: 'A ∩ B',      regions: ['AB'],                       description: 'x ∈ A and x ∈ B' },
    { expr: 'A \\ B',     regions: ['A_only'],                   description: 'x ∈ A and x ∉ B' },
    { expr: 'B \\ A',     regions: ['B_only'],                   description: 'x ∈ B and x ∉ A' },
    { expr: 'A ∩ B̄',      regions: ['A_only'],                   description: 'x ∈ A and x ∉ B  (same as A \\ B)' },
    { expr: 'Ā',          regions: ['B_only', 'complement'],     description: 'x ∉ A' },
    { expr: '(A ∪ B)̄',    regions: ['complement'],               description: 'x ∉ A and x ∉ B' },
    { expr: 'Ā ∩ B̄',      regions: ['complement'],               description: 'x ∉ A and x ∉ B  (De Morgan: same as (A ∪ B)̄)' },
  ];

  const DEFAULT_EXPRS_THREE = [
    { expr: 'A ∪ B ∪ C',       regions: ['A_only','B_only','C_only','AB','AC','BC','ABC'], description: 'x ∈ A or x ∈ B or x ∈ C' },
    { expr: 'A ∩ B ∩ C',       regions: ['ABC'],                                            description: 'x ∈ A and x ∈ B and x ∈ C' },
    { expr: 'A ∩ B',           regions: ['AB','ABC'],                                       description: 'x ∈ A and x ∈ B' },
    { expr: '(A ∩ B) \\ C',    regions: ['AB'],                                             description: 'x ∈ A and x ∈ B and x ∉ C' },
    { expr: 'A \\ (B ∪ C)',    regions: ['A_only'],                                         description: 'x ∈ A and x ∉ B and x ∉ C' },
    { expr: '(A ∪ B) ∩ C',     regions: ['AC','BC','ABC'],                                  description: 'x ∈ C and (x ∈ A or x ∈ B)' },
    { expr: '(A ∩ B ∩ C)̄',     regions: ['A_only','B_only','C_only','AB','AC','BC','complement'], description: 'NOT (x ∈ A and x ∈ B and x ∈ C)' },
  ];

  // ── Region label metadata ──────────────────────────────────────────────
  const TWO_LABELS = {
    A_only:     { text: 'A ∩ B̄' },
    B_only:     { text: 'Ā ∩ B' },
    AB:         { text: 'A ∩ B' },
    complement: { text: 'Ā ∩ B̄' },
  };

  const THREE_LABELS = {
    A_only:     { text: 'A ∩ B̄ ∩ C̄' },
    B_only:     { text: 'Ā ∩ B ∩ C̄' },
    C_only:     { text: 'Ā ∩ B̄ ∩ C' },
    AB:         { text: 'A ∩ B ∩ C̄' },
    AC:         { text: 'A ∩ B̄ ∩ C' },
    BC:         { text: 'Ā ∩ B ∩ C' },
    ABC:        { text: 'A ∩ B ∩ C' },
    complement: { text: 'Ā ∩ B̄ ∩ C̄' },
  };

  // Approximate label positions (centroids) per region.
  // Two-set: A=(250,200,r=110), B=(390,200,r=110).
  const TWO_LABEL_POS = {
    A_only:     { x: 200, y: 200 },
    B_only:     { x: 440, y: 200 },
    AB:         { x: 320, y: 200 },
    complement: { x: 78,  y: 60  },
  };

  // Three-set: A=(245,180,r=95), B=(395,180,r=95), C=(320,300,r=95).
  const THREE_LABEL_POS = {
    A_only:     { x: 188, y: 190 },
    B_only:     { x: 452, y: 190 },
    C_only:     { x: 320, y: 360 },
    AB:         { x: 320, y: 150 },
    AC:         { x: 245, y: 250 },
    BC:         { x: 395, y: 250 },
    ABC:        { x: 320, y: 225 },
    complement: { x: 78,  y: 60  },
  };

  // ── Mount a single widget instance ─────────────────────────────────────
  function mountWidget(root) {
    let problem;
    try {
      problem = JSON.parse(root.dataset.problem || '{}');
    } catch (e) {
      console.error('venn-diagram-explorer: invalid data-problem JSON', e);
      return;
    }

    // Unique instance id used to namespace url(#...) references
    // (clipPath and mask ids) so multiple widgets on the same page do
    // not collide.
    const instanceId = ++widgetSeq;

    const allowedModes = Array.isArray(problem.modes) && problem.modes.length
      ? problem.modes.filter(m => m === 'two' || m === 'three')
      : ['two', 'three'];

    let mode = problem.defaultMode && allowedModes.includes(problem.defaultMode)
      ? problem.defaultMode
      : allowedModes[0];

    const exprsTwo   = Array.isArray(problem.expressionsTwoSet)   && problem.expressionsTwoSet.length
      ? problem.expressionsTwoSet
      : DEFAULT_EXPRS_TWO;
    const exprsThree = Array.isArray(problem.expressionsThreeSet) && problem.expressionsThreeSet.length
      ? problem.expressionsThreeSet
      : DEFAULT_EXPRS_THREE;

    let activeExprIdx = -1;

    // ── Build inner DOM ────────────────────────────────────────────────
    const titleHtml = problem.title
      ? `<h1 class="ven-title">${escapeText(problem.title)}</h1>`
      : '';

    const introHtml = problem.intro
      ? `<div class="ven-intro">${problem.intro}</div>`
      : '';

    const showModeToggle = allowedModes.length > 1;
    const modeToggleHtml = showModeToggle ? `
      <div class="ven-mode-toggle">
        <span class="ven-mode-label">Mode:</span>
        <button class="ven-mode-btn ${mode === 'two' ? 'active' : ''}" data-mode="two" type="button">Two sets</button>
        <button class="ven-mode-btn ${mode === 'three' ? 'active' : ''}" data-mode="three" type="button">Three sets</button>
      </div>
    ` : '';

    root.innerHTML = `
      ${titleHtml}
      ${introHtml}
      ${modeToggleHtml}
      <div class="ven-body">
        <div class="ven-svg-wrapper">
          <svg class="ven-svg" xmlns="${NS}"></svg>
          <div class="ven-description"></div>
        </div>
        <div class="ven-expr-panel">
          <div class="ven-expr-heading">Expressions</div>
          <ul class="ven-expr-list"></ul>
          <button class="ven-clear-btn" type="button">Clear highlight</button>
          <div class="ven-de-morgan-note"></div>
        </div>
      </div>
    `;

    // ── DOM refs ───────────────────────────────────────────────────────
    const svg          = root.querySelector('.ven-svg');
    const exprListEl   = root.querySelector('.ven-expr-list');
    const descEl       = root.querySelector('.ven-description');
    const clearBtn     = root.querySelector('.ven-clear-btn');
    const deMorganNote = root.querySelector('.ven-de-morgan-note');

    // ── Render the SVG diagram for the current mode ────────────────────
    //
    // Region geometry strategy (per instance, per mode):
    //
    //   <defs>
    //     <clipPath id="ven-clip-A-{i}">  <circle A/></clipPath>
    //     <clipPath id="ven-clip-B-{i}">  <circle B/></clipPath>
    //     <clipPath id="ven-clip-C-{i}">  <circle C/></clipPath>   (3-set only)
    //
    //     <mask id="ven-mask-not-A-{i}">    rect(white) + circle A (black)
    //     <mask id="ven-mask-not-B-{i}">    rect(white) + circle B (black)
    //     <mask id="ven-mask-not-C-{i}">    rect(white) + circle C (black)
    //     <mask id="ven-mask-not-BC-{i}">   rect(white) + B black + C black
    //     <mask id="ven-mask-not-AC-{i}">   rect(white) + A black + C black
    //     <mask id="ven-mask-not-AB-{i}">   rect(white) + A black + B black
    //     <mask id="ven-mask-not-ABC-{i}">  rect(white) + A,B,C black
    //   </defs>
    //
    // Each region is a <g class="ven-region" data-region="...">
    // containing a covering <rect class="ven-region-fill"> in the
    // highlight color. Constraints:
    //   - "inside circle X" → wrap rect in <g clip-path="url(#clipX)">
    //   - "outside circle Y" → set mask="url(#mask-not-Y)" on the rect
    //
    // The rect's fill-opacity is 0 by default and rises to 0.55 when the
    // parent .ven-region has class "active" (set by JS based on the
    // selected expression).
    function renderDiagram() {
      svg.innerHTML = '';
      const cfg = (mode === 'two') ? TWO : THREE;
      svg.setAttribute('viewBox', `0 0 ${cfg.viewW} ${cfg.viewH}`);

      // Universe-rect coordinates; reused for every fill rect and
      // mask background so every "white" pixel of the universe is in scope.
      const r = cfg.rect;

      // Per-instance unique id helpers.
      const clipIds = {
        A: `ven-clip-A-${instanceId}`,
        B: `ven-clip-B-${instanceId}`,
        C: `ven-clip-C-${instanceId}`,
      };
      const maskIds = {
        notA:   `ven-mask-not-A-${instanceId}`,
        notB:   `ven-mask-not-B-${instanceId}`,
        notC:   `ven-mask-not-C-${instanceId}`,
        notAB:  `ven-mask-not-AB-${instanceId}`,
        notAC:  `ven-mask-not-AC-${instanceId}`,
        notBC:  `ven-mask-not-BC-${instanceId}`,
        notABC: `ven-mask-not-ABC-${instanceId}`,
      };

      // ── <defs>: clipPaths + masks ──────────────────────────────────
      const defs = svgEl('defs', {});

      // Helper to make a clipPath wrapping a single circle.
      function makeCircleClip(id, c) {
        const cp = svgEl('clipPath', { id });
        cp.appendChild(svgEl('circle', { cx: c.cx, cy: c.cy, r: c.r }));
        return cp;
      }

      // Helper to make a mask that is "white everywhere except inside
      // these circles". Rendering with this mask shows the rect's pixels
      // OUTSIDE all listed circles.
      function makeOutsideMask(id, circles) {
        const m = svgEl('mask', { id, maskUnits: 'userSpaceOnUse' });
        // Background rect (white = visible). Cover the universe.
        m.appendChild(svgEl('rect', {
          x: r.x, y: r.y, width: r.w, height: r.h, fill: 'white',
        }));
        for (const c of circles) {
          m.appendChild(svgEl('circle', {
            cx: c.cx, cy: c.cy, r: c.r, fill: 'black',
          }));
        }
        return m;
      }

      // Always define A & B clip + outside masks.
      defs.appendChild(makeCircleClip(clipIds.A, cfg.A));
      defs.appendChild(makeCircleClip(clipIds.B, cfg.B));
      defs.appendChild(makeOutsideMask(maskIds.notA, [cfg.A]));
      defs.appendChild(makeOutsideMask(maskIds.notB, [cfg.B]));

      if (mode === 'three') {
        defs.appendChild(makeCircleClip(clipIds.C, cfg.C));
        defs.appendChild(makeOutsideMask(maskIds.notC,   [cfg.C]));
        defs.appendChild(makeOutsideMask(maskIds.notAB,  [cfg.A, cfg.B]));
        defs.appendChild(makeOutsideMask(maskIds.notAC,  [cfg.A, cfg.C]));
        defs.appendChild(makeOutsideMask(maskIds.notBC,  [cfg.B, cfg.C]));
        defs.appendChild(makeOutsideMask(maskIds.notABC, [cfg.A, cfg.B, cfg.C]));
      } else {
        // For two-set complement we need "outside A and B".
        defs.appendChild(makeOutsideMask(maskIds.notAB, [cfg.A, cfg.B]));
      }

      svg.appendChild(defs);

      // ── Universe rectangle (visible background) ────────────────────
      svg.appendChild(svgEl('rect', {
        x: r.x, y: r.y, width: r.w, height: r.h,
        class: 'ven-universe-rect',
      }));

      // "U" label in upper-left corner of universe
      const uLabel = svgEl('text', {
        x: r.x + 14, y: r.y + 22,
        class: 'ven-universe-label',
      });
      uLabel.textContent = 'U';
      svg.appendChild(uLabel);

      // ── Region fills (boolean-composed) ────────────────────────────
      // Each region is a <g class="ven-region" data-region="..."> that
      // contains a rect (covering the universe) constrained by
      // clip-paths (insides) and a mask (outsides). The rect is invisible
      // until the region's parent gets class .active.
      function makeRegionFillRect(maskId) {
        const attrs = {
          x: r.x, y: r.y, width: r.w, height: r.h,
          class: 'ven-region-fill',
        };
        if (maskId) attrs.mask = `url(#${maskId})`;
        return svgEl('rect', attrs);
      }

      // Build a region <g> whose contents are wrapped in nested
      // <g clip-path="..."> for each "inside circle X" constraint, with
      // the inner rect carrying the outside-mask for "outside Y" parts.
      function makeRegion(key, insideClipIds, outsideMaskId) {
        const g = svgEl('g', {
          class: 'ven-region',
          'data-region': key,
        });
        // Build innermost rect first.
        let cur = makeRegionFillRect(outsideMaskId);
        // Wrap with each clipPath from innermost to outermost.
        for (let i = insideClipIds.length - 1; i >= 0; i--) {
          const wrapper = svgEl('g', { 'clip-path': `url(#${insideClipIds[i]})` });
          wrapper.appendChild(cur);
          cur = wrapper;
        }
        g.appendChild(cur);
        return g;
      }

      if (mode === 'two') {
        // A_only: inside A, outside B
        svg.appendChild(makeRegion('A_only', [clipIds.A], maskIds.notB));
        // B_only: inside B, outside A
        svg.appendChild(makeRegion('B_only', [clipIds.B], maskIds.notA));
        // AB: inside A and B
        svg.appendChild(makeRegion('AB', [clipIds.A, clipIds.B], null));
        // complement: outside A and B (no clipPath; just the mask)
        svg.appendChild(makeRegion('complement', [], maskIds.notAB));
      } else {
        // A_only: inside A, outside B and C
        svg.appendChild(makeRegion('A_only', [clipIds.A], maskIds.notBC));
        // B_only: inside B, outside A and C
        svg.appendChild(makeRegion('B_only', [clipIds.B], maskIds.notAC));
        // C_only: inside C, outside A and B
        svg.appendChild(makeRegion('C_only', [clipIds.C], maskIds.notAB));
        // AB sliver: inside A and B, outside C
        svg.appendChild(makeRegion('AB', [clipIds.A, clipIds.B], maskIds.notC));
        // AC sliver: inside A and C, outside B
        svg.appendChild(makeRegion('AC', [clipIds.A, clipIds.C], maskIds.notB));
        // BC sliver: inside B and C, outside A
        svg.appendChild(makeRegion('BC', [clipIds.B, clipIds.C], maskIds.notA));
        // ABC: inside A, B, and C
        svg.appendChild(makeRegion('ABC', [clipIds.A, clipIds.B, clipIds.C], null));
        // complement: outside A, B, and C
        svg.appendChild(makeRegion('complement', [], maskIds.notABC));
      }

      // ── Circle outlines (drawn on top of region fills) ─────────────
      const circleData = (mode === 'two')
        ? [{ key: 'A', c: cfg.A }, { key: 'B', c: cfg.B }]
        : [{ key: 'A', c: cfg.A }, { key: 'B', c: cfg.B }, { key: 'C', c: cfg.C }];

      for (const { c } of circleData) {
        svg.appendChild(svgEl('circle', {
          cx: c.cx, cy: c.cy, r: c.r,
          class: 'ven-circle-outline',
        }));
      }

      // ── Set name labels (A, B, C) outside circles ──────────────────
      const setLabels = (mode === 'two')
        ? [
            { text: 'A', x: cfg.A.cx - cfg.A.r + 18, y: cfg.A.cy - cfg.A.r + 6 },
            { text: 'B', x: cfg.B.cx + cfg.B.r - 18, y: cfg.B.cy - cfg.B.r + 6 },
          ]
        : [
            { text: 'A', x: cfg.A.cx - cfg.A.r + 18, y: cfg.A.cy - cfg.A.r + 4 },
            { text: 'B', x: cfg.B.cx + cfg.B.r - 18, y: cfg.B.cy - cfg.B.r + 4 },
            { text: 'C', x: cfg.C.cx, y: cfg.C.cy + cfg.C.r - 8 },
          ];

      for (const lbl of setLabels) {
        const t = svgEl('text', {
          x: lbl.x, y: lbl.y,
          class: 'ven-set-label',
        });
        t.textContent = lbl.text;
        svg.appendChild(t);
      }

      // ── Tiny region labels inside each region ──────────────────────
      const labelMap = (mode === 'two') ? TWO_LABELS : THREE_LABELS;
      const posMap   = (mode === 'two') ? TWO_LABEL_POS : THREE_LABEL_POS;
      const regionKeys = (mode === 'two')
        ? ['A_only', 'B_only', 'AB', 'complement']
        : ['A_only', 'B_only', 'C_only', 'AB', 'AC', 'BC', 'ABC', 'complement'];

      for (const key of regionKeys) {
        const pos = posMap[key];
        const meta = labelMap[key];
        if (!pos || !meta) continue;
        const t = svgEl('text', {
          x: pos.x, y: pos.y,
          class: 'ven-region-label',
          'data-region-label': key,
        });
        t.textContent = meta.text;
        svg.appendChild(t);
      }
    }

    // ── Render the expression list ─────────────────────────────────────
    function renderExprList() {
      exprListEl.innerHTML = '';
      const exprs = currentExprs();
      exprs.forEach((e, i) => {
        const li = document.createElement('li');
        li.className = 'ven-expr-item';
        li.dataset.exprIdx = i;
        li.title = e.description || '';
        li.innerHTML = `<span class="ven-expr-text">${escapeText(e.expr)}</span>`;
        exprListEl.appendChild(li);
      });
      activeExprIdx = -1;
      applyHighlight(null);
    }

    function currentExprs() {
      return (mode === 'two') ? exprsTwo : exprsThree;
    }

    // ── Apply / clear region highlight ─────────────────────────────────
    function applyHighlight(regions) {
      // regions: array of region keys, or null/empty to clear
      const set = new Set(regions || []);
      svg.querySelectorAll('.ven-region').forEach(g => {
        const key = g.getAttribute('data-region');
        g.classList.toggle('active', set.has(key));
      });
      // Update active expression styling
      exprListEl.querySelectorAll('.ven-expr-item').forEach(li => {
        li.classList.toggle('active', +li.dataset.exprIdx === activeExprIdx);
      });
    }

    function setActiveExpr(idx) {
      const exprs = currentExprs();
      if (idx < 0 || idx >= exprs.length) {
        activeExprIdx = -1;
        descEl.textContent = '';
        descEl.classList.remove('visible');
        deMorganNote.textContent = '';
        deMorganNote.classList.remove('visible');
        applyHighlight(null);
        return;
      }
      activeExprIdx = idx;
      const e = exprs[idx];
      const regions = Array.isArray(e.regions) ? e.regions : [];
      applyHighlight(regions);

      // Description below diagram
      if (e.description) {
        descEl.textContent = `${e.expr}  =  { x : ${e.description} }`;
        descEl.classList.add('visible');
      } else {
        descEl.textContent = e.expr;
        descEl.classList.add('visible');
      }

      // De Morgan note: if another expression in the list maps to the
      // exact same region set, point that out.
      const sig = (regions.slice().sort().join(','));
      const matches = exprs
        .map((other, j) => ({ other, j }))
        .filter(({ other, j }) =>
          j !== idx && Array.isArray(other.regions) &&
          other.regions.slice().sort().join(',') === sig);
      if (matches.length > 0) {
        const otherTexts = matches.map(m => m.other.expr).join(', ');
        deMorganNote.textContent = `Same region as: ${otherTexts}`;
        deMorganNote.classList.add('visible');
      } else {
        deMorganNote.textContent = '';
        deMorganNote.classList.remove('visible');
      }
    }

    // ── Event wiring ───────────────────────────────────────────────────
    exprListEl.addEventListener('click', (e) => {
      const li = e.target.closest('.ven-expr-item');
      if (!li) return;
      const idx = +li.dataset.exprIdx;
      if (idx === activeExprIdx) {
        setActiveExpr(-1);
      } else {
        setActiveExpr(idx);
      }
    });

    clearBtn.addEventListener('click', () => setActiveExpr(-1));

    if (showModeToggle) {
      root.querySelector('.ven-mode-toggle').addEventListener('click', (e) => {
        const btn = e.target.closest('.ven-mode-btn');
        if (!btn) return;
        const newMode = btn.dataset.mode;
        if (newMode === mode) return;
        mode = newMode;
        root.querySelectorAll('.ven-mode-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.mode === mode);
        });
        renderDiagram();
        renderExprList();
      });
    }

    // ── Container-width responsive classes ──────────────────────────────
    // Toggle a class based on the widget root's own width so the layout
    // adapts to narrow embedding containers (e.g. LXP content columns)
    // regardless of viewport width. Mirrors the breakpoint in the
    // @media rule below.
    if (typeof ResizeObserver !== 'undefined') {
      const rootRo = new ResizeObserver((entries) => {
        const w = entries[0].contentRect.width;
        root.classList.toggle('ven-narrow', w < 700);
      });
      rootRo.observe(root);
    }

    // ── Initial render ─────────────────────────────────────────────────
    renderDiagram();
    renderExprList();
  }

  // ── Bootstrap: mount every .ven-widget on the page (idempotent) ────────
  function bootAll() {
    document.querySelectorAll('.ven-widget').forEach((root) => {
      if (root.dataset.venMounted === '1') return;
      root.dataset.venMounted = '1';
      mountWidget(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAll);
  } else {
    bootAll();
  }
}());
