(function () {
  'use strict';

  // =========================================================================
  // JUGS SANDBOX (W24) — embeddable widget
  //
  // State machine for the Die Hard 3-jugs puzzle. Two jugs A and B with
  // capacities (cap_a, cap_b). Six actions: fill A, fill B, empty A,
  // empty B, pour A→B, pour B→A. Visualization: two visual jugs (water
  // levels animate), a state grid showing all (a, b) cells with visited
  // cells lit up, goal cells tinted, and a path history of the actions
  // taken.
  // =========================================================================

  const SVG_NS = 'http://www.w3.org/2000/svg';

  // Hardcoded variants. Each defines (cap_a, cap_b, goal). A goal state
  // is any (a, b) where a === goal OR b === goal. Cells with this value
  // are pre-tinted yellow on the grid.
  const VARIANTS = {
    'die-hard': {
      label: 'Die Hard (3, 5) — goal 4',
      cap_a: 3, cap_b: 5, goal: 4
    },
    'coprime': {
      label: 'Coprime (4, 9) — goal 1',
      cap_a: 4, cap_b: 9, goal: 1
    }
  };

  let widgetSeq = 0;

  function isObject(x) { return x && typeof x === 'object'; }

  function svgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    if (attrs) for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  // The six action functions, applied to (a, b) given (cap_a, cap_b).
  // Each returns the new state. If the action has no effect (e.g. filling
  // a jug that is already full), it returns null so the caller can skip.
  function ACTIONS(cap_a, cap_b) {
    return [
      { key: 'fillA', label: 'Fill ' + cap_a + '-gal', apply: (a, b) => a === cap_a ? null : { a: cap_a, b } },
      { key: 'fillB', label: 'Fill ' + cap_b + '-gal', apply: (a, b) => b === cap_b ? null : { a, b: cap_b } },
      { key: 'emptyA', label: 'Empty ' + cap_a + '-gal', apply: (a, b) => a === 0 ? null : { a: 0, b } },
      { key: 'emptyB', label: 'Empty ' + cap_b + '-gal', apply: (a, b) => b === 0 ? null : { a, b: 0 } },
      { key: 'pourAB', label: 'Pour ' + cap_a + '→' + cap_b, apply: (a, b) => {
          if (a === 0 || b === cap_b) return null;
          const amt = Math.min(a, cap_b - b);
          return { a: a - amt, b: b + amt };
      }},
      { key: 'pourBA', label: 'Pour ' + cap_b + '→' + cap_a, apply: (a, b) => {
          if (b === 0 || a === cap_a) return null;
          const amt = Math.min(b, cap_a - a);
          return { a: a + amt, b: b - amt };
      }}
    ];
  }

  // BFS over the state space starting from (0, 0). Returns Set of "a,b" keys.
  function reachableStates(cap_a, cap_b) {
    const acts = ACTIONS(cap_a, cap_b);
    const visited = new Set(['0,0']);
    const queue = [{ a: 0, b: 0 }];
    while (queue.length) {
      const s = queue.shift();
      for (const act of acts) {
        const next = act.apply(s.a, s.b);
        if (!next) continue;
        const key = next.a + ',' + next.b;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push(next);
        }
      }
    }
    return visited;
  }

  function isGoal(a, b, goal) { return a === goal || b === goal; }

  // ── Mount ────────────────────────────────────────────────────────────────
  function mountWidget(root) {
    let problem = {};
    try {
      problem = JSON.parse(root.dataset.problem || '{}');
    } catch (e) {
      console.error('jugs-sandbox: invalid data-problem JSON', e);
      problem = {};
    }
    const titleText = (typeof problem.title === 'string' && problem.title.length)
      ? problem.title : 'Jugs Sandbox';
    let initialVariantKey = (typeof problem.defaultPreset === 'string' && VARIANTS[problem.defaultPreset])
      ? problem.defaultPreset : 'die-hard';

    widgetSeq++;
    const instanceId = 'jugs-' + widgetSeq;
    if (!root.hasAttribute('tabindex')) root.setAttribute('tabindex', '0');

    // ── Build DOM scaffold ─────────────────────────────────────────────────
    root.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'jugs-header';
    {
      const h = document.createElement('h2');
      h.appendChild(document.createTextNode(titleText + ' '));
      const sub = document.createElement('span');
      sub.className = 'jugs-subtitle';
      sub.textContent = 'a state-machine sandbox';
      h.appendChild(sub);
      header.appendChild(h);
    }

    const tools = document.createElement('div');
    tools.className = 'jugs-header-tools';

    const variantSelect = document.createElement('select');
    variantSelect.className = 'jugs-variant-select';
    for (const key of Object.keys(VARIANTS)) {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = VARIANTS[key].label;
      if (key === initialVariantKey) opt.selected = true;
      variantSelect.appendChild(opt);
    }
    tools.appendChild(variantSelect);

    const reachBtn = document.createElement('button');
    reachBtn.type = 'button';
    reachBtn.className = 'jugs-tool-btn jugs-btn-reach';
    reachBtn.textContent = 'Highlight reachable';
    tools.appendChild(reachBtn);

    header.appendChild(tools);
    root.appendChild(header);

    const main = document.createElement('div');
    main.className = 'jugs-main';

    // Left panel: jugs visualization + actions + controls + status.
    const left = document.createElement('div');
    left.className = 'jugs-left';

    const jugsSvg = svgEl('svg', { class: 'jugs-jugs-svg', viewBox: '0 0 280 200' });
    left.appendChild(jugsSvg);

    const actionsHost = document.createElement('div');
    actionsHost.className = 'jugs-actions';
    left.appendChild(actionsHost);

    const controlsHost = document.createElement('div');
    controlsHost.className = 'jugs-controls';
    const undoBtn = document.createElement('button');
    undoBtn.type = 'button';
    undoBtn.className = 'jugs-action-btn jugs-undo';
    undoBtn.textContent = '↶ Undo';
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'jugs-action-btn jugs-reset';
    resetBtn.textContent = 'Reset';
    controlsHost.appendChild(undoBtn);
    controlsHost.appendChild(resetBtn);
    left.appendChild(controlsHost);

    const statusEl = document.createElement('div');
    statusEl.className = 'jugs-status';
    left.appendChild(statusEl);

    main.appendChild(left);

    // Right panel: state grid + path history.
    const right = document.createElement('div');
    right.className = 'jugs-right';

    const gridHost = document.createElement('div');
    gridHost.className = 'jugs-grid-host';

    const gridTitle = document.createElement('div');
    gridTitle.className = 'jugs-grid-title';
    gridTitle.innerHTML =
      '<span>State Grid</span>' +
      '<span class="jugs-grid-legend">' +
        '<span><span class="jugs-legend-swatch jugs-sw-current"></span>current</span>' +
        '<span><span class="jugs-legend-swatch jugs-sw-visited"></span>visited</span>' +
        '<span><span class="jugs-legend-swatch jugs-sw-goal"></span>goal</span>' +
        '<span class="jugs-reach-legend" style="display:none"><span class="jugs-legend-swatch jugs-sw-reach"></span>reachable</span>' +
      '</span>';
    gridHost.appendChild(gridTitle);

    const gridSvg = svgEl('svg', { class: 'jugs-grid-svg' });
    gridHost.appendChild(gridSvg);

    right.appendChild(gridHost);

    const pathHost = document.createElement('div');
    pathHost.className = 'jugs-path-host';
    const pathTitle = document.createElement('div');
    pathTitle.className = 'jugs-path-title';
    pathTitle.textContent = 'Path History';
    pathHost.appendChild(pathTitle);
    const pathList = document.createElement('div');
    pathList.className = 'jugs-path-list';
    pathHost.appendChild(pathList);
    right.appendChild(pathHost);

    main.appendChild(right);
    root.appendChild(main);

    // ── State (per-instance) ──────────────────────────────────────────────
    let variant = null;       // current variant config
    let actions = [];         // current ACTIONS(cap_a, cap_b)
    let actionByKey = {};
    let actionBtnByKey = {};

    let cur = { a: 0, b: 0 };
    let visited = new Set(['0,0']);
    let history = [];          // [{ actionKey, prevState, nextState }]
    let highlightReach = false;
    let reachSet = null;       // cached reachable-states Set

    // ── Variant load / reset ──────────────────────────────────────────────
    function loadVariant(key) {
      const v = VARIANTS[key];
      if (!v) return;
      variant = v;
      actions = ACTIONS(v.cap_a, v.cap_b);
      actionByKey = {};
      for (const a of actions) actionByKey[a.key] = a;
      reachSet = null;        // recompute lazily when needed
      // Build the buttons + grid BEFORE the first reset/render. reset()
      // calls renderAll() which calls updateStatus(), which expects the
      // action buttons to exist (so it can disable no-op actions). If we
      // reset first, updateStatus throws and the rest of loadVariant
      // (including buildActionButtons + buildGrid) never runs.
      buildActionButtons();
      buildGrid();
      reset();
    }

    function reset() {
      cur = { a: 0, b: 0 };
      visited = new Set(['0,0']);
      history = [];
      renderAll();
    }

    function applyAction(key) {
      const act = actionByKey[key];
      if (!act) return;
      const next = act.apply(cur.a, cur.b);
      if (!next) return; // no-op (jug already full / empty)
      const prev = { a: cur.a, b: cur.b };
      cur = next;
      visited.add(cur.a + ',' + cur.b);
      history.push({ actionKey: key, prevState: prev, nextState: { a: cur.a, b: cur.b } });
      renderAll();
    }

    function undo() {
      if (history.length === 0) return;
      const last = history.pop();
      cur = last.prevState;
      // We do NOT remove the popped state from the visited set — students
      // have observed that state, so it stays "visited" for highlighting
      // purposes. Reset is the way to clear visited.
      renderAll();
    }

    // ── Build action buttons ──────────────────────────────────────────────
    function buildActionButtons() {
      actionsHost.innerHTML = '';
      actionBtnByKey = {};
      for (const a of actions) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'jugs-action-btn';
        b.textContent = a.label;
        b.addEventListener('click', () => {
          applyAction(a.key);
          root.focus({ preventScroll: true });
        });
        actionsHost.appendChild(b);
        actionBtnByKey[a.key] = b;
      }
    }

    // ── State grid ────────────────────────────────────────────────────────
    // The grid is rebuilt whenever the variant changes. Cells are rect+text
    // pairs, stored in a 2D map for fast updates.
    let cellRefs = null;       // [a][b] = { rect, text, isGoal }
    let gridLayout = null;     // { cellSize, marginLeft, marginTop, w, h }

    function buildGrid() {
      gridSvg.innerHTML = '';
      cellRefs = [];
      const cap_a = variant.cap_a;
      const cap_b = variant.cap_b;
      // Cap_a + 1 rows (a values 0..cap_a), cap_b + 1 cols (b values 0..cap_b).
      const cols = cap_b + 1;
      const rows = cap_a + 1;
      // Cell size auto-fits to a target total width.
      const targetWidth = 540; // viewBox-ish width
      const marginLeft = 36, marginTop = 26;
      const marginRight = 6, marginBottom = 26;
      const availW = targetWidth - marginLeft - marginRight;
      const cellSize = Math.min(48, Math.floor(availW / cols));
      const gridW = cellSize * cols;
      const gridH = cellSize * rows;
      const totalW = marginLeft + gridW + marginRight;
      const totalH = marginTop + gridH + marginBottom;
      gridSvg.setAttribute('viewBox', '0 0 ' + totalW + ' ' + totalH);
      gridLayout = { cellSize, marginLeft, marginTop, w: totalW, h: totalH };

      // Column header (b values).
      for (let bb = 0; bb <= cap_b; bb++) {
        const x = marginLeft + bb * cellSize + cellSize / 2;
        const t = svgEl('text', {
          x: x, y: marginTop - 12,
          class: 'jugs-axis-label'
        });
        t.textContent = String(bb);
        gridSvg.appendChild(t);
      }
      // Row header (a values).
      for (let aa = 0; aa <= cap_a; aa++) {
        const y = marginTop + aa * cellSize + cellSize / 2;
        const t = svgEl('text', {
          x: marginLeft - 14, y: y,
          class: 'jugs-axis-label'
        });
        t.textContent = String(aa);
        gridSvg.appendChild(t);
      }
      // Axis-label tags.
      const aLabel = svgEl('text', {
        x: 10, y: marginTop - 12,
        class: 'jugs-axis-label',
        'text-anchor': 'start'
      });
      aLabel.textContent = 'a / b';
      gridSvg.appendChild(aLabel);
      const bLabelMain = svgEl('text', {
        x: marginLeft + gridW / 2, y: totalH - 6,
        class: 'jugs-axis-label'
      });
      bLabelMain.textContent = 'b (jug ' + cap_b + '-gal)';
      gridSvg.appendChild(bLabelMain);
      const aLabelMain = svgEl('text', {
        x: 10, y: marginTop + gridH / 2,
        class: 'jugs-axis-label',
        transform: 'rotate(-90 10 ' + (marginTop + gridH / 2) + ')',
        'text-anchor': 'middle'
      });
      aLabelMain.textContent = 'a (jug ' + cap_a + '-gal)';
      gridSvg.appendChild(aLabelMain);

      // Build cells.
      for (let aa = 0; aa <= cap_a; aa++) {
        cellRefs[aa] = [];
        for (let bb = 0; bb <= cap_b; bb++) {
          const x = marginLeft + bb * cellSize;
          const y = marginTop + aa * cellSize;
          const goal = isGoal(aa, bb, variant.goal);
          const rect = svgEl('rect', {
            x: x + 1, y: y + 1,
            width: cellSize - 2, height: cellSize - 2,
            rx: 2,
            class: 'jugs-cell-bg' + (goal ? ' jugs-cell-goal' : '')
          });
          gridSvg.appendChild(rect);
          const text = svgEl('text', {
            x: x + cellSize / 2, y: y + cellSize / 2,
            class: 'jugs-cell-text'
          });
          text.textContent = '(' + aa + ',' + bb + ')';
          gridSvg.appendChild(text);
          cellRefs[aa][bb] = { rect, text, goal };
        }
      }
    }

    function updateGrid() {
      if (!cellRefs) return;
      const cap_a = variant.cap_a, cap_b = variant.cap_b;
      const showReach = highlightReach;
      if (showReach && reachSet === null) {
        reachSet = reachableStates(cap_a, cap_b);
      }
      for (let aa = 0; aa <= cap_a; aa++) {
        for (let bb = 0; bb <= cap_b; bb++) {
          const ref = cellRefs[aa][bb];
          const key = aa + ',' + bb;
          const isCurrent = (aa === cur.a && bb === cur.b);
          const isVisited = visited.has(key);
          const isReach = showReach && reachSet && reachSet.has(key);

          let cls = 'jugs-cell-bg';
          if (ref.goal) cls += ' jugs-cell-goal';
          if (isReach && !isVisited && !isCurrent) cls += ' jugs-cell-reach';
          if (isVisited) cls += ' jugs-cell-visited';
          if (isCurrent) cls += ' jugs-cell-current';
          ref.rect.setAttribute('class', cls);

          ref.text.setAttribute('class', 'jugs-cell-text' + (isCurrent ? ' jugs-cell-text-current' : ''));
        }
      }

      // Toggle the reach legend visibility.
      const reachLegend = gridTitle.querySelector('.jugs-reach-legend');
      if (reachLegend) reachLegend.style.display = showReach ? '' : 'none';
    }

    // ── Visual jugs ────────────────────────────────────────────────────────
    function renderJugsSvg() {
      jugsSvg.innerHTML = '';
      const cap_a = variant.cap_a, cap_b = variant.cap_b;
      const goal = variant.goal;
      // Layout: two jugs side by side, each ~80px wide by 130px tall, with
      // capacity ratio scaled visually so the bigger jug looks bigger.
      const jugTopY = 30;
      const jugMaxHeight = 120;
      const jugWidth = 70;
      const padding = 30;
      // Heights proportional to capacity but minimum size.
      const heightA = Math.max(60, jugMaxHeight * cap_a / Math.max(cap_a, cap_b));
      const heightB = Math.max(60, jugMaxHeight * cap_b / Math.max(cap_a, cap_b));
      // Both jugs anchored at the same bottom line.
      const baseY = jugTopY + jugMaxHeight;
      const jugAY = baseY - heightA;
      const jugBY = baseY - heightB;
      const jugAX = padding;
      const jugBX = padding + jugWidth + 60;

      function drawJug(x, yTop, height, current, capacity, label, isGoalActive) {
        // Jug body (open at top): U-shaped path.
        const w = jugWidth;
        const r = 6;
        const path =
          'M ' + x + ',' + yTop +
          ' L ' + x + ',' + (yTop + height - r) +
          ' Q ' + x + ',' + (yTop + height) + ' ' + (x + r) + ',' + (yTop + height) +
          ' L ' + (x + w - r) + ',' + (yTop + height) +
          ' Q ' + (x + w) + ',' + (yTop + height) + ' ' + (x + w) + ',' + (yTop + height - r) +
          ' L ' + (x + w) + ',' + yTop;
        const shell = svgEl('path', { d: path, class: 'jugs-jug-shell' });
        jugsSvg.appendChild(shell);

        // Water (rect from bottom up).
        const waterHeight = (current / capacity) * (height - 2);
        const waterY = yTop + height - 1 - waterHeight;
        if (waterHeight > 0.5) {
          const water = svgEl('rect', {
            x: x + 1.5, y: waterY,
            width: w - 3, height: waterHeight,
            class: 'jugs-jug-water'
          });
          jugsSvg.appendChild(water);
        }

        // Tick marks at integer levels (one per unit).
        for (let i = 1; i <= capacity; i++) {
          const ty = yTop + height * (1 - i / capacity);
          const tick = svgEl('line', {
            x1: x, y1: ty, x2: x + 6, y2: ty,
            class: 'jugs-jug-tick'
          });
          jugsSvg.appendChild(tick);
        }

        // Label (capacity).
        const lbl = svgEl('text', {
          x: x + w / 2, y: yTop + height + 14,
          class: 'jugs-jug-label'
        });
        lbl.textContent = label;
        jugsSvg.appendChild(lbl);
        // Current value.
        const val = svgEl('text', {
          x: x + w / 2, y: yTop - 8,
          class: 'jugs-jug-value'
        });
        val.textContent = String(current) + (current === goal ? ' ✓' : '');
        if (current === goal) val.setAttribute('fill', '#2d5a27');
        jugsSvg.appendChild(val);
      }

      drawJug(jugAX, jugAY, heightA, cur.a, cap_a, 'A · ' + cap_a + '-gal', isGoal(cur.a, cur.b, goal));
      drawJug(jugBX, jugBY, heightB, cur.b, cap_b, 'B · ' + cap_b + '-gal', isGoal(cur.a, cur.b, goal));
    }

    // ── Status + path + button states ─────────────────────────────────────
    function updateStatus() {
      const reached = isGoal(cur.a, cur.b, variant.goal);
      const stateStr = '(' + cur.a + ', ' + cur.b + ')';
      const stepCount = history.length;
      let text = 'Step ' + stepCount + ' · State ' + stateStr;
      if (reached) text += ' · 🎯 Goal reached (' + variant.goal + ' gallons)';
      statusEl.textContent = text;
      statusEl.classList.toggle('jugs-status-goal', reached);

      undoBtn.disabled = history.length === 0;

      // Disable action buttons whose action is a no-op from current state.
      for (const a of actions) {
        const next = a.apply(cur.a, cur.b);
        actionBtnByKey[a.key].disabled = next === null;
      }
    }

    function updatePath() {
      pathList.innerHTML = '';
      if (history.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'jugs-path-empty';
        empty.textContent = '(no actions yet — start at (0, 0))';
        pathList.appendChild(empty);
        return;
      }
      history.forEach((h, idx) => {
        const item = document.createElement('div');
        item.className = 'jugs-path-item';
        const act = actionByKey[h.actionKey];
        item.innerHTML =
          '<span><span class="jugs-path-step">' + (idx + 1) + '.</span>' +
          (act ? act.label : h.actionKey) + '</span>' +
          '<span class="jugs-path-state">→ (' + h.nextState.a + ', ' + h.nextState.b + ')</span>';
        pathList.appendChild(item);
      });
      // Auto-scroll path to bottom so the latest action is visible.
      pathHost.scrollTop = pathHost.scrollHeight;
    }

    function renderAll() {
      renderJugsSvg();
      updateGrid();
      updateStatus();
      updatePath();
    }

    // ── Wire controls ─────────────────────────────────────────────────────
    variantSelect.addEventListener('change', () => {
      loadVariant(variantSelect.value);
    });
    reachBtn.addEventListener('click', () => {
      highlightReach = !highlightReach;
      reachBtn.classList.toggle('jugs-active', highlightReach);
      if (highlightReach && reachSet === null) {
        reachSet = reachableStates(variant.cap_a, variant.cap_b);
      }
      updateGrid();
    });
    undoBtn.addEventListener('click', undo);
    resetBtn.addEventListener('click', reset);

    root.addEventListener('keydown', (e) => {
      // Keyboard shortcuts: 1-6 for actions, U for undo, R for reset.
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      const k = e.key;
      if (k >= '1' && k <= '6') {
        const idx = parseInt(k, 10) - 1;
        if (actions[idx]) applyAction(actions[idx].key);
        e.preventDefault();
      } else if (k.toLowerCase() === 'u') {
        undo();
        e.preventDefault();
      } else if (k.toLowerCase() === 'r') {
        reset();
        e.preventDefault();
      }
    });

    // ── Initial load ──────────────────────────────────────────────────────
    loadVariant(initialVariantKey);
  }

  function bootAll() {
    document.querySelectorAll('.jugs-widget').forEach((root) => {
      if (root.dataset.jugsMounted === '1') return;
      root.dataset.jugsMounted = '1';
      mountWidget(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAll);
  } else {
    bootAll();
  }
}());
