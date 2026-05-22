(function () {
  'use strict';

  // =========================================================================
  // BUBBLE DIAGRAM PROPERTY IDENTIFIER (W33) — embeddable widget
  //
  // Each <div class="bdpi-widget" data-problem='{...}'></div> on the page is
  // mounted as an independent instance. State and DOM refs live in a closure
  // per mount, so multiple widgets coexist without interference. SVG marker
  // IDs are made unique per instance via a module-level counter.
  //
  // Pedagogical model: the widget shows a sequence of pre-built bubble
  // diagrams (a relation from set A to set B, drawn as arrows). For each
  // diagram the student checks every property they think applies. After
  // clicking Check, each property is marked correct or incorrect with a
  // short explanation that references the diagram. After all rounds, a
  // summary panel reports diagrams correctly identified.
  // =========================================================================

  const NS = 'http://www.w3.org/2000/svg';

  // Geometry & limits — narrower than the W5 widget because we have only
  // two sets, A and B (no third set C). The W5 widget uses
  // viewBox 0 0 860 420 with sets at x=140, 430, 720; here we use
  // viewBox 0 0 540 420 with sets at x=140 and x=400.
  const OVAL_CX   = { A: 140, B: 400 };
  const OVAL_CY   = 218;
  const OVAL_RX   = 84;
  const OVAL_RY   = 178;
  const ELEM_TOP  = 62;
  const ELEM_BOT  = 384;
  const ELEM_R    = 14;
  const SUB       = ['', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];

  const ARROW_COLOR = '#4a7fc1';

  // Property keys in the order they are presented to the student.
  const PROPERTIES = [
    { key: 'relation',   label: 'Relation' },
    { key: 'partial',    label: 'Partial function' },
    { key: 'total',      label: 'Total function' },
    { key: 'injective',  label: 'Injective' },
    { key: 'surjective', label: 'Surjective' },
    { key: 'bijective',  label: 'Bijective' },
  ];

  // Global instance counter for unique SVG marker IDs across mounts.
  let widgetSeq = 0;

  // ── Pure helpers (shared across instances) ─────────────────────────────
  function elemLabel(setKey, i) {
    return ({ A: 'a', B: 'b' })[setKey] + SUB[i + 1];
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

  function bezierPath(x1, y1, x2, y2, curveSign = 1, curveOffset = 22) {
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

  function escapeText(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Compute which properties hold for a relation A→B given as list of
  // [fromIdx, toIdx] pairs, with |A|=aCount and |B|=bCount.
  function computeProperties(arrows, aCount, bCount) {
    // Build per-source outgoing-target lists.
    const outs = new Map();
    for (let i = 0; i < aCount; i++) outs.set(i, []);
    for (const [fi, ti] of arrows) {
      if (fi < 0 || fi >= aCount || ti < 0 || ti >= bCount) continue;
      outs.get(fi).push(ti);
    }

    // Partial: every A-element has at most one outgoing arrow.
    let partial = true;
    for (const list of outs.values()) {
      if (list.length > 1) { partial = false; break; }
    }

    // Total: partial AND every A-element has exactly one outgoing arrow.
    // (For empty A, vacuously total — but we guard A-empty as not-total
    // to match the spec note: "total=false (unless A is empty)".)
    let total = partial && aCount > 0;
    if (total) {
      for (const list of outs.values()) {
        if (list.length !== 1) { total = false; break; }
      }
    } else if (partial && aCount === 0) {
      // No A-elements: vacuously total.
      total = true;
    }

    // Injective: no two A-elements point to the same B-element. We only
    // consider distinct sources; if a single source has multiple arrows
    // to the same target that does not break injectivity per se, but we
    // also check for distinct (source, target) pairs collapsing to one
    // target across different sources.
    let injective = true;
    const seenTargets = new Set();
    for (const [src, list] of outs) {
      // Use the unique targets of this source so that the same source
      // mapping to one target multiple times does not falsely collide.
      const uniq = new Set(list);
      for (const t of uniq) {
        if (seenTargets.has(t)) { injective = false; break; }
        seenTargets.add(t);
      }
      if (!injective) break;
    }

    // Surjective: every B-element is hit by at least one arrow.
    // (If B is empty, vacuously surjective.)
    let surjective = true;
    if (bCount > 0) {
      const hit = new Set();
      for (const list of outs.values()) {
        for (const t of list) hit.add(t);
      }
      for (let j = 0; j < bCount; j++) {
        if (!hit.has(j)) { surjective = false; break; }
      }
    }

    const bijective = total && injective && surjective;

    return {
      relation:   true,    // anything is a relation, including the empty relation
      partial:    partial,
      total:      total,
      injective:  injective,
      surjective: surjective,
      bijective:  bijective,
    };
  }

  // Produce a short, diagram-referenced explanation for a given property.
  // Used both for "matches" and "doesn't match" cases — the explanation
  // is the SAME (it explains WHY the property holds or fails), and the
  // green/red mark indicates whether the student's selection matched.
  function explainProperty(propKey, props, arrows, aCount, bCount) {
    const outs = new Map();
    for (let i = 0; i < aCount; i++) outs.set(i, []);
    for (const [fi, ti] of arrows) {
      if (fi < 0 || fi >= aCount || ti < 0 || ti >= bCount) continue;
      outs.get(fi).push(ti);
    }

    function aLab(i) { return elemLabel('A', i); }
    function bLab(i) { return elemLabel('B', i); }

    if (propKey === 'relation') {
      return 'Any set of ordered pairs from A to B is a relation, so this is always true (even for the empty relation).';
    }

    if (propKey === 'partial') {
      if (props.partial) {
        return 'Every element of A has at most one outgoing arrow, so this is a partial function.';
      }
      // Find an A-element with >1 outgoing.
      for (const [src, list] of outs) {
        if (list.length > 1) {
          const targets = Array.from(new Set(list)).map(bLab).join(', ');
          return `${aLab(src)} has more than one outgoing arrow (to ${targets}), so this is not a partial function.`;
        }
      }
      return 'Some element of A has more than one outgoing arrow, so this is not a partial function.';
    }

    if (propKey === 'total') {
      if (props.total) {
        return 'Every element of A has exactly one outgoing arrow, so this is a total function.';
      }
      // First check non-partial reason.
      for (const [src, list] of outs) {
        if (list.length > 1) {
          return `${aLab(src)} has more than one outgoing arrow, so this is not a function (and therefore not total).`;
        }
      }
      // Then check missing source.
      for (const [src, list] of outs) {
        if (list.length === 0) {
          return `${aLab(src)} has no outgoing arrow, so this is not a total function.`;
        }
      }
      return 'Not every element of A has exactly one outgoing arrow, so this is not a total function.';
    }

    if (propKey === 'injective') {
      if (props.injective) {
        return 'No two elements of A point to the same element of B, so this is injective.';
      }
      // Find a B-element hit by two different A-elements.
      const hitBy = new Map();
      for (const [src, list] of outs) {
        const uniq = new Set(list);
        for (const t of uniq) {
          if (!hitBy.has(t)) hitBy.set(t, []);
          hitBy.get(t).push(src);
        }
      }
      for (const [t, srcs] of hitBy) {
        if (srcs.length >= 2) {
          return `${aLab(srcs[0])} and ${aLab(srcs[1])} both point to ${bLab(t)}, so this is not injective.`;
        }
      }
      return 'Two elements of A share a target in B, so this is not injective.';
    }

    if (propKey === 'surjective') {
      if (props.surjective) {
        return 'Every element of B has at least one incoming arrow, so this is surjective.';
      }
      const hit = new Set();
      for (const list of outs.values()) {
        for (const t of list) hit.add(t);
      }
      for (let j = 0; j < bCount; j++) {
        if (!hit.has(j)) {
          return `${bLab(j)} has no incoming arrow, so this is not surjective.`;
        }
      }
      return 'Some element of B has no incoming arrow, so this is not surjective.';
    }

    if (propKey === 'bijective') {
      if (props.bijective) {
        return 'The relation is total, injective, and surjective, so it is a bijection.';
      }
      const missing = [];
      if (!props.total)      missing.push('total');
      if (!props.injective)  missing.push('injective');
      if (!props.surjective) missing.push('surjective');
      return `A bijection must be total, injective, and surjective; this relation is not ${missing.join(' or not ')}.`;
    }

    return '';
  }

  // ── Mount a single widget instance ─────────────────────────────────────
  function mountWidget(root) {
    let problem;
    try {
      problem = JSON.parse(root.dataset.problem || '{}');
    } catch (e) {
      console.error('bubble-diagram-property-identifier: invalid data-problem JSON', e);
      return;
    }
    const rounds = Array.isArray(problem.rounds) ? problem.rounds : [];
    if (!rounds.length) {
      console.error('bubble-diagram-property-identifier: data-problem must include a non-empty "rounds" array');
      return;
    }

    const instanceId = ++widgetSeq;
    const markerId   = `bdpi-arrow-${instanceId}`;

    // Pre-compute properties and explanations once per round.
    const roundData = rounds.map((r, idx) => {
      const aSize  = Array.isArray(r.A) ? r.A.length : 0;
      const bSize  = Array.isArray(r.B) ? r.B.length : 0;
      const arrows = Array.isArray(r.arrows)
        ? r.arrows.map(p => [Math.floor(Number(p[0])), Math.floor(Number(p[1]))])
        : [];
      const props = computeProperties(arrows, aSize, bSize);
      const label = r.label || `Diagram ${idx + 1}`;
      return { label, aSize, bSize, arrows, props };
    });

    let roundIdx       = 0;
    let answered       = false;
    let correctRounds  = 0;
    let totalAnswered  = 0;
    // Per-round student selections: { propKey: bool }.
    let selections     = {};

    // ── Build outer DOM ────────────────────────────────────────────────
    const titleHtml = problem.title
      ? `<h1 class="bdpi-title">${escapeText(problem.title)}</h1>`
      : '';
    const introHtml = problem.intro
      ? `<div class="bdpi-intro">${problem.intro}</div>`
      : '';

    const checklistHtml = PROPERTIES.map((p) => `
      <li class="bdpi-prop-row" data-prop="${p.key}">
        <label class="bdpi-prop-label">
          <input type="checkbox" class="bdpi-prop-check" data-prop="${p.key}">
          <span class="bdpi-prop-name">${p.label}</span>
        </label>
        <span class="bdpi-prop-mark"></span>
        <div class="bdpi-prop-explain"></div>
      </li>
    `).join('');

    root.innerHTML = `
      ${titleHtml}
      ${introHtml}
      <div class="bdpi-round-header">
        <span class="bdpi-round-counter"></span>
        <span class="bdpi-score"></span>
      </div>
      <div class="bdpi-round-label"></div>
      <div class="bdpi-main">
        <div class="bdpi-svg-wrapper">
          <svg class="bdpi-svg" viewBox="0 0 540 420" xmlns="${NS}">
            <defs>
              <marker id="${markerId}" markerUnits="strokeWidth" markerWidth="9" markerHeight="7" refX="7" refY="3.5" orient="auto">
                <path d="M0,0 L0,7 L9,3.5 z" fill="${ARROW_COLOR}"/>
              </marker>
            </defs>
            <ellipse cx="${OVAL_CX.A}" cy="${OVAL_CY}" rx="${OVAL_RX}" ry="${OVAL_RY}" fill="#fafafa" stroke="#bbb" stroke-width="1.5"/>
            <ellipse cx="${OVAL_CX.B}" cy="${OVAL_CY}" rx="${OVAL_RX}" ry="${OVAL_RY}" fill="#fafafa" stroke="#bbb" stroke-width="1.5"/>
            <text x="${OVAL_CX.A}" y="28" font-family="Georgia, 'Times New Roman', serif" font-size="22" font-weight="bold" font-style="italic" fill="#333" text-anchor="middle">A</text>
            <text x="${OVAL_CX.B}" y="28" font-family="Georgia, 'Times New Roman', serif" font-size="22" font-weight="bold" font-style="italic" fill="#333" text-anchor="middle">B</text>
            <g class="bdpi-layer-arrows"></g>
            <g class="bdpi-layer-elements"></g>
          </svg>
        </div>
        <div class="bdpi-checklist-panel">
          <h2 class="bdpi-checklist-heading">Check all that apply</h2>
          <ul class="bdpi-checklist">
            ${checklistHtml}
          </ul>
        </div>
      </div>
      <div class="bdpi-actions">
        <button class="bdpi-btn bdpi-check-btn" type="button">Check</button>
        <button class="bdpi-btn bdpi-next-btn hidden" type="button">Next diagram &rarr;</button>
      </div>
      <div class="bdpi-roundfeedback hidden"></div>
      <div class="bdpi-summary hidden">
        <div class="bdpi-summary-headline"></div>
        <div class="bdpi-summary-detail"></div>
        <button class="bdpi-restart-btn" type="button">Start over</button>
      </div>
    `;

    // ── DOM refs (scoped to root) ──────────────────────────────────────
    const counterEl    = root.querySelector('.bdpi-round-counter');
    const scoreEl      = root.querySelector('.bdpi-score');
    const roundLabelEl = root.querySelector('.bdpi-round-label');
    const layerArrows  = root.querySelector('.bdpi-layer-arrows');
    const layerElems   = root.querySelector('.bdpi-layer-elements');
    const checkBtn     = root.querySelector('.bdpi-check-btn');
    const nextBtn      = root.querySelector('.bdpi-next-btn');
    const feedbackEl   = root.querySelector('.bdpi-roundfeedback');
    const summaryEl    = root.querySelector('.bdpi-summary');
    const summaryHead  = root.querySelector('.bdpi-summary-headline');
    const summaryDet   = root.querySelector('.bdpi-summary-detail');
    const restartBtn   = root.querySelector('.bdpi-restart-btn');

    // ── Diagram rendering ──────────────────────────────────────────────
    function renderDiagram(round) {
      // Elements.
      layerElems.innerHTML = '';
      for (const key of ['A', 'B']) {
        const n = key === 'A' ? round.aSize : round.bSize;
        for (let i = 0; i < n; i++) {
          const { x, y } = elemPos(key, i, n);
          const g = svgEl('g', {
            class:      'bdpi-element',
            'data-set': key,
            'data-idx': i,
          });
          g.appendChild(svgEl('circle', {
            cx: x, cy: y, r: ELEM_R, class: 'bdpi-element-circle',
          }));
          const txt = svgEl('text', {
            x, y,
            class:               'bdpi-element-label',
            'dominant-baseline': 'central',
            'text-anchor':       'middle',
          });
          txt.textContent = elemLabel(key, i);
          g.appendChild(txt);
          layerElems.appendChild(g);
        }
      }

      // Arrows. If the same source has multiple outgoing arrows, alternate
      // the curve sign so they fan out instead of overlapping.
      layerArrows.innerHTML = '';
      const perSrcCounts = new Map();
      for (const [fi, ti] of round.arrows) {
        if (fi < 0 || fi >= round.aSize || ti < 0 || ti >= round.bSize) continue;
        const s = elemPos('A', fi, round.aSize);
        const t = elemPos('B', ti, round.bSize);
        const seenSoFar = perSrcCounts.get(fi) || 0;
        perSrcCounts.set(fi, seenSoFar + 1);
        // Curve sign alternates: 0 → +1, 1 → -1, 2 → +1, ...; offset
        // grows with index so multiple arrows from the same source spread.
        const sign   = seenSoFar % 2 === 0 ? 1 : -1;
        const offset = 22 + Math.floor(seenSoFar / 2) * 18;
        const d      = bezierPath(s.x, s.y, t.x, t.y, sign, offset);
        layerArrows.appendChild(svgEl('path', {
          d,
          stroke:           ARROW_COLOR,
          'stroke-width':   1.8,
          fill:             'none',
          'marker-end':     `url(#${markerId})`,
          'pointer-events': 'none',
        }));
      }
    }

    // ── Round chrome ───────────────────────────────────────────────────
    function renderRoundChrome(round) {
      counterEl.textContent = `Round ${roundIdx + 1} of ${rounds.length}`;
      scoreEl.textContent   = totalAnswered > 0
        ? `Score: ${correctRounds} / ${totalAnswered}`
        : '';
      roundLabelEl.textContent = round.label;

      // Reset checkboxes.
      root.querySelectorAll('.bdpi-prop-check').forEach(cb => {
        cb.checked  = false;
        cb.disabled = false;
      });

      // Reset row styling.
      root.querySelectorAll('.bdpi-prop-row').forEach(row => {
        row.classList.remove('correct', 'wrong');
        row.querySelector('.bdpi-prop-mark').textContent = '';
        const exp = row.querySelector('.bdpi-prop-explain');
        exp.textContent = '';
        exp.classList.remove('visible');
      });

      checkBtn.disabled = false;
      checkBtn.classList.remove('hidden');
      nextBtn.classList.add('hidden');
      feedbackEl.classList.add('hidden');
      feedbackEl.classList.remove('correct', 'wrong');
      feedbackEl.textContent = '';
      selections = {};
    }

    function renderRound() {
      summaryEl.classList.add('hidden');
      const round = roundData[roundIdx];
      renderDiagram(round);
      renderRoundChrome(round);
      answered = false;
    }

    // ── Check handling ─────────────────────────────────────────────────
    function handleCheck() {
      if (answered) return;
      answered = true;
      totalAnswered++;
      const round = roundData[roundIdx];

      // Read selections.
      selections = {};
      root.querySelectorAll('.bdpi-prop-check').forEach(cb => {
        selections[cb.dataset.prop] = cb.checked;
        cb.disabled = true;
      });

      let allCorrect = true;
      for (const p of PROPERTIES) {
        const truth = !!round.props[p.key];
        const said  = !!selections[p.key];
        const ok    = (truth === said);
        if (!ok) allCorrect = false;

        const row = root.querySelector(`.bdpi-prop-row[data-prop="${p.key}"]`);
        row.classList.add(ok ? 'correct' : 'wrong');
        const mark = row.querySelector('.bdpi-prop-mark');
        // Use a check or X plus a parenthetical for the truth value, so the
        // student sees both whether they were right AND whether the property
        // actually holds.
        const truthGlyph = truth ? '✓' : '✗';
        mark.textContent = ok
          ? `✓ ${truthGlyph}`
          : `✗ ${truthGlyph}`;
        mark.classList.toggle('truth-true',  truth);
        mark.classList.toggle('truth-false', !truth);

        const exp = row.querySelector('.bdpi-prop-explain');
        exp.innerHTML = explainProperty(p.key, round.props, round.arrows, round.aSize, round.bSize);
        exp.classList.add('visible');
      }

      if (allCorrect) correctRounds++;
      scoreEl.textContent = `Score: ${correctRounds} / ${totalAnswered}`;

      feedbackEl.classList.remove('hidden');
      if (allCorrect) {
        feedbackEl.classList.add('correct');
        feedbackEl.classList.remove('wrong');
        feedbackEl.textContent = 'All properties identified correctly.';
      } else {
        feedbackEl.classList.add('wrong');
        feedbackEl.classList.remove('correct');
        feedbackEl.textContent = 'Not quite — see the explanations beside each property.';
      }

      checkBtn.classList.add('hidden');
      nextBtn.classList.remove('hidden');
      nextBtn.textContent = (roundIdx === rounds.length - 1)
        ? 'See summary →'
        : 'Next diagram →';
    }

    function showSummary() {
      summaryHead.textContent = `${correctRounds} of ${rounds.length} diagrams correctly identified.`;
      let detail;
      if (correctRounds === rounds.length) {
        detail = 'Nice work — every diagram identified correctly.';
      } else if (correctRounds === 0) {
        detail = 'Restart below to revisit each diagram.';
      } else {
        detail = 'Restart below to revisit any diagrams you missed.';
      }
      summaryDet.textContent = detail;
      summaryEl.classList.remove('hidden');
      checkBtn.classList.add('hidden');
      nextBtn.classList.add('hidden');
      feedbackEl.classList.add('hidden');
    }

    // ── Event wiring ───────────────────────────────────────────────────
    checkBtn.addEventListener('click', handleCheck);
    nextBtn.addEventListener('click', () => {
      if (roundIdx < rounds.length - 1) {
        roundIdx++;
        renderRound();
      } else {
        showSummary();
      }
    });
    restartBtn.addEventListener('click', () => {
      roundIdx       = 0;
      correctRounds  = 0;
      totalAnswered  = 0;
      renderRound();
    });

    // ── Container-width responsive classes ──────────────────────────────
    // Toggle classes based on the widget root's own width so the layout
    // adapts to narrow embedding containers (e.g. LXP content columns)
    // regardless of viewport width.
    if (typeof ResizeObserver !== 'undefined') {
      const rootRo = new ResizeObserver((entries) => {
        const w = entries[0].contentRect.width;
        root.classList.toggle('bdpi-narrow', w < 720);
      });
      rootRo.observe(root);
    }

    // ── Initial render ─────────────────────────────────────────────────
    renderRound();
  }

  // ── Bootstrap: mount every .bdpi-widget on the page (idempotent) ───────
  function bootAll() {
    document.querySelectorAll('.bdpi-widget').forEach((root) => {
      if (root.dataset.bdpiMounted === '1') return;
      root.dataset.bdpiMounted = '1';
      mountWidget(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAll);
  } else {
    bootAll();
  }
}());
