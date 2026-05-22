(function () {
  'use strict';

  // =========================================================================
  // PRIM'S ALGORITHM STEPPER (W23) — embeddable widget
  //
  // Each <div class="prim-widget" data-problem='{...}'></div> is mounted as
  // an independent instance. Multiple instances coexist; no document-wide
  // IDs.
  //
  // State flow: load preset → click vertex to set start → Step (advance
  // one edge) / Run (animate to completion) / Reset.
  //
  // Tiebreaking: deterministic — among frontier edges with minimum weight,
  // the one with the smallest edge id wins. So the trace is reproducible
  // per starting vertex, but different starts may produce different MSTs.
  // =========================================================================

  // ── Constants ────────────────────────────────────────────────────────────
  const NODE_RADIUS = 18;
  const NODE_HIT_RADIUS = 22;
  const RUN_INTERVAL_MS = 700;

  // Hardcoded presets. Each has labeled vertices with positions and a list
  // of weighted undirected edges. Coordinates are in canvas pixels.
  const PRESETS = {
    lecture: {
      label: '6-vertex lecture example',
      vertices: [
        { id: 1, x: 290, y: 260, label: 'A' },
        { id: 2, x: 200, y: 170, label: 'B' },
        { id: 3, x: 380, y: 170, label: 'C' },
        { id: 4, x: 380, y: 360, label: 'D' },
        { id: 5, x: 200, y: 360, label: 'E' },
        { id: 6, x:  90, y: 170, label: 'F' }
      ],
      // Edge ids matter for deterministic tiebreaking.
      edges: [
        { id: 1, from: 1, to: 2, weight: 1 },  // A-B
        { id: 2, from: 1, to: 3, weight: 3 },  // A-C
        { id: 3, from: 1, to: 4, weight: 4 },  // A-D
        { id: 4, from: 1, to: 5, weight: 7 },  // A-E
        { id: 5, from: 2, to: 3, weight: 2 },  // B-C
        { id: 6, from: 2, to: 6, weight: 4 },  // B-F
        { id: 7, from: 3, to: 6, weight: 1 },  // C-F
        { id: 8, from: 6, to: 4, weight: 5 },  // F-D
        { id: 9, from: 4, to: 5, weight: 3 }   // D-E
      ],
      defaultStartLabel: 'A'
    },
    ties: {
      label: '4-vertex with tied weights',
      vertices: [
        { id: 1, x: 240, y: 130, label: 'A' },
        { id: 2, x: 130, y: 280, label: 'B' },
        { id: 3, x: 350, y: 280, label: 'C' },
        { id: 4, x: 240, y: 380, label: 'D' }
      ],
      edges: [
        { id: 1, from: 1, to: 2, weight: 2 },  // A-B
        { id: 2, from: 1, to: 3, weight: 2 },  // A-C  (tied with A-B)
        { id: 3, from: 1, to: 4, weight: 3 },  // A-D
        { id: 4, from: 2, to: 3, weight: 4 },  // B-C
        { id: 5, from: 2, to: 4, weight: 1 },  // B-D
        { id: 6, from: 3, to: 4, weight: 1 }   // C-D  (tied with B-D)
      ],
      defaultStartLabel: 'A'
    }
  };

  let widgetSeq = 0;

  function isObject(x) { return x && typeof x === 'object'; }

  // Pure step function. Given current state, return { chosenEdgeId, frontier }
  // where chosenEdgeId is the edge Prim's would add next (null if no
  // frontier exists, i.e., MST complete or unreachable vertices remain).
  function computeFrontier(edges, inTree) {
    const frontier = [];
    for (const e of edges) {
      const fromIn = inTree.has(e.from);
      const toIn = inTree.has(e.to);
      if (fromIn !== toIn) frontier.push(e);
    }
    // Deterministic tiebreaking: lower weight first, then lower edge id.
    frontier.sort((a, b) => a.weight - b.weight || a.id - b.id);
    return frontier;
  }

  // Compute a perpendicular offset for the edge from `from` to `to` so that
  // the edge curves around any obstacle vertex (a third vertex that lies
  // on or close to the straight segment). Returns 0 for a straight edge,
  // or a signed magnitude — the quadratic-bezier control point is placed
  // at (midpoint + offset · perpendicular_unit_vector). Sign is chosen so
  // the curve bends AWAY from the closest obstacle.
  function computeEdgeCurveOffset(from, to, allVertices) {
    const dx = to.x - from.x, dy = to.y - from.y;
    const len = Math.hypot(dx, dy);
    if (len < 1) return 0;
    const ux = dx / len, uy = dy / len;
    const px = -uy, py = ux; // perpendicular (90° CCW of edge direction)
    const MAGNITUDE = 60;
    const T_MIN = 0.1, T_MAX = 0.9;
    const PERP_THRESHOLD = 28;
    let result = 0;
    for (const w of allVertices) {
      if (w.id === from.id || w.id === to.id) continue;
      const wx = w.x - from.x, wy = w.y - from.y;
      const t = (wx * ux + wy * uy) / len;
      if (t < T_MIN || t > T_MAX) continue;
      const perp = wx * px + wy * py;
      if (Math.abs(perp) > PERP_THRESHOLD) continue;
      // Curve to the opposite side of the obstacle.
      const offset = perp > 0 ? -MAGNITUDE : MAGNITUDE;
      if (Math.abs(offset) > Math.abs(result)) result = offset;
    }
    return result;
  }

  function deepCloneGraph(preset) {
    return {
      vertices: preset.vertices.map(v => Object.assign({}, v)),
      edges: preset.edges.map(e => Object.assign({}, e)),
      defaultStartLabel: preset.defaultStartLabel,
      label: preset.label
    };
  }

  // ── Mount a single widget instance ───────────────────────────────────────
  function mountWidget(root) {
    let problem = {};
    try {
      problem = JSON.parse(root.dataset.problem || '{}');
    } catch (e) {
      console.error('prim-stepper: invalid data-problem JSON', e);
      problem = {};
    }
    const titleText = (typeof problem.title === 'string' && problem.title.length)
      ? problem.title : "Prim's Algorithm Stepper";
    const introHtml = (typeof problem.intro === 'string' && problem.intro.length)
      ? problem.intro : null;
    let initialPresetKey = (typeof problem.defaultPreset === 'string' && PRESETS[problem.defaultPreset])
      ? problem.defaultPreset : 'lecture';

    widgetSeq++;
    const instanceId = 'prim-' + widgetSeq;
    if (!root.hasAttribute('tabindex')) root.setAttribute('tabindex', '0');

    // ── Build DOM scaffold ─────────────────────────────────────────────────
    root.innerHTML = '';

    // Outer wrapper (the .prim-widget IS root, so we keep header + main inside).
    const header = document.createElement('div');
    header.className = 'prim-header';
    {
      const h = document.createElement('h2');
      h.appendChild(document.createTextNode(titleText + ' '));
      const sub = document.createElement('span');
      sub.className = 'prim-subtitle';
      sub.textContent = "step through Prim's algorithm on a small weighted graph";
      h.appendChild(sub);
      header.appendChild(h);
    }

    const tools = document.createElement('div');
    tools.className = 'prim-header-tools';

    const presetSelect = document.createElement('select');
    presetSelect.className = 'prim-preset-select';
    presetSelect.id = instanceId + '-preset';
    for (const key of Object.keys(PRESETS)) {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = PRESETS[key].label;
      if (key === initialPresetKey) opt.selected = true;
      presetSelect.appendChild(opt);
    }
    tools.appendChild(presetSelect);

    function makeBtn(extraClass, label) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'prim-tool-btn ' + (extraClass || '');
      b.textContent = label;
      return b;
    }
    const stepBtn = makeBtn('prim-primary prim-btn-step', 'Step ▶');
    const runBtn = makeBtn('prim-btn-run', 'Run all');
    const resetBtn = makeBtn('prim-danger prim-btn-reset', 'Reset');
    tools.appendChild(stepBtn);
    tools.appendChild(runBtn);
    tools.appendChild(resetBtn);

    header.appendChild(tools);
    root.appendChild(header);

    const main = document.createElement('div');
    main.className = 'prim-main';

    const canvasContainer = document.createElement('div');
    canvasContainer.className = 'prim-canvas-container';
    const canvas = document.createElement('canvas');
    canvas.className = 'prim-canvas';
    canvasContainer.appendChild(canvas);
    const statusBanner = document.createElement('div');
    statusBanner.className = 'prim-status-banner prim-state-pick';
    statusBanner.textContent = 'Click a vertex to choose a starting point';
    canvasContainer.appendChild(statusBanner);
    const canvasHint = document.createElement('div');
    canvasHint.className = 'prim-canvas-hint';
    canvasHint.textContent = 'Tiebreaking: among edges of equal weight, the lower edge id wins (deterministic).';
    canvasContainer.appendChild(canvasHint);
    main.appendChild(canvasContainer);

    const sidebar = document.createElement('div');
    sidebar.className = 'prim-sidebar';

    const sidebarHeader = document.createElement('div');
    sidebarHeader.className = 'prim-sidebar-header';
    {
      const h = document.createElement('h3');
      h.textContent = 'Algorithm State';
      sidebarHeader.appendChild(h);
      const sub = document.createElement('div');
      sub.className = 'prim-sidebar-sub';
      sub.textContent = 'Pick a start vertex';
      sidebarHeader.appendChild(sub);
    }
    sidebar.appendChild(sidebarHeader);

    function makeSection(title, markerColor) {
      const sec = document.createElement('div');
      sec.className = 'prim-prop-section';
      const t = document.createElement('div');
      t.className = 'prim-prop-section-title';
      const m = document.createElement('span');
      m.className = 'prim-section-marker';
      if (markerColor) m.style.color = markerColor;
      t.appendChild(m);
      t.appendChild(document.createTextNode(' ' + title));
      sec.appendChild(t);
      return sec;
    }

    const sumSec = makeSection('Summary', null);
    sumSec.innerHTML +=
      '<div class="prim-prop-row"><span class="prim-prop-label">Vertices</span><span class="prim-prop-value prim-info prim-prop-vertices">--</span></div>' +
      '<div class="prim-prop-row"><span class="prim-prop-label">Edges</span><span class="prim-prop-value prim-info prim-prop-edges">--</span></div>' +
      '<div class="prim-prop-row"><span class="prim-prop-label">Start vertex</span><span class="prim-prop-value prim-prop-start">--</span></div>';
    sidebar.appendChild(sumSec);
    const sumRefs = {
      vertices: sumSec.querySelector('.prim-prop-vertices'),
      edges: sumSec.querySelector('.prim-prop-edges'),
      start: sumSec.querySelector('.prim-prop-start')
    };

    const progSec = makeSection('Progress', 'var(--prim-amber)');
    progSec.innerHTML +=
      '<div class="prim-prop-row"><span class="prim-prop-label">Step</span><span class="prim-prop-value prim-info prim-prop-step">0</span></div>' +
      '<div class="prim-prop-row"><span class="prim-prop-label">Total weight</span><span class="prim-prop-value prim-info prim-prop-weight">0</span></div>' +
      '<div class="prim-prop-row"><span class="prim-prop-label">MST complete?</span><span class="prim-prop-value prim-prop-complete">--</span></div>';
    sidebar.appendChild(progSec);
    const progRefs = {
      step: progSec.querySelector('.prim-prop-step'),
      weight: progSec.querySelector('.prim-prop-weight'),
      complete: progSec.querySelector('.prim-prop-complete')
    };

    const frontierSec = makeSection('Current Frontier', 'var(--prim-amber)');
    const frontierTip = document.createElement('div');
    frontierTip.className = 'prim-prop-tooltip';
    frontierTip.textContent = 'Edges with one endpoint in the partial tree T and one outside. The chosen-next edge (heavy outline) is the minimum-weight one.';
    frontierSec.appendChild(frontierTip);
    const frontierList = document.createElement('div');
    frontierList.className = 'prim-frontier-list';
    frontierSec.appendChild(frontierList);
    sidebar.appendChild(frontierSec);

    const treeSec = makeSection('Edges in T (in order added)', 'var(--prim-green)');
    const edgeList = document.createElement('div');
    edgeList.className = 'prim-edge-list';
    treeSec.appendChild(edgeList);
    sidebar.appendChild(treeSec);

    main.appendChild(sidebar);
    root.appendChild(main);

    // ── State (per-instance) ──────────────────────────────────────────────
    let graph = null;          // current preset graph
    let inTree = new Set();    // node ids in T
    let treeEdges = [];        // ordered list of edge ids in T
    let totalWeight = 0;
    let startVertex = null;    // node id of starting vertex
    let runIntervalId = null;

    const ctx = canvas.getContext('2d');

    function loadPreset(key) {
      const p = PRESETS[key];
      if (!p) return;
      graph = deepCloneGraph(p);
      resetAlgorithm();
    }

    function resetAlgorithm() {
      stopRun();
      inTree = new Set();
      treeEdges = [];
      totalWeight = 0;
      startVertex = null;
      render();
      updateSidebar();
      updateStatusBanner();
    }

    function stopRun() {
      if (runIntervalId !== null) {
        clearInterval(runIntervalId);
        runIntervalId = null;
      }
    }

    // Returns true if the step was performed; false if no progress possible.
    function stepOnce() {
      if (!graph || startVertex === null) return false;
      if (inTree.size === 0) {
        inTree.add(startVertex);
        render();
        updateSidebar();
        updateStatusBanner();
        return true;
      }
      const frontier = computeFrontier(graph.edges, inTree);
      if (frontier.length === 0) return false;
      const chosen = frontier[0];
      treeEdges.push(chosen.id);
      totalWeight += chosen.weight;
      inTree.add(inTree.has(chosen.from) ? chosen.to : chosen.from);
      render();
      updateSidebar();
      updateStatusBanner();
      return true;
    }

    function isComplete() {
      if (!graph || startVertex === null) return false;
      // Complete when no frontier remains (all reachable vertices in T).
      if (inTree.size === 0) return false;
      return computeFrontier(graph.edges, inTree).length === 0;
    }

    // ── Resize ─────────────────────────────────────────────────────────────
    function resizeCanvas() {
      const rect = canvasContainer.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      render();
    }
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => resizeCanvas());
      ro.observe(canvasContainer);
    } else {
      window.addEventListener('resize', resizeCanvas);
    }
    requestAnimationFrame(resizeCanvas);

    // ── Container-width responsive classes ──────────────────────────────
    // Toggle classes based on the widget root's own width so the layout
    // adapts to narrow embedding containers (e.g. LXP content columns)
    // regardless of viewport width.
    if (typeof ResizeObserver !== 'undefined') {
      const rootRo = new ResizeObserver((entries) => {
        const w = entries[0].contentRect.width;
        root.classList.toggle('prim-narrow', w < 760);
        root.classList.toggle('prim-extra-narrow', w < 600);
      });
      rootRo.observe(root);
    }

    // ── Hit testing ────────────────────────────────────────────────────────
    function getNodeAt(x, y) {
      if (!graph) return null;
      for (let i = graph.vertices.length - 1; i >= 0; i--) {
        const n = graph.vertices[i];
        const dx = n.x - x, dy = n.y - y;
        if (dx * dx + dy * dy <= NODE_HIT_RADIUS * NODE_HIT_RADIUS) return n;
      }
      return null;
    }

    function getCanvasPos(e) {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    canvas.addEventListener('click', (e) => {
      root.focus({ preventScroll: true });
      if (startVertex !== null) return; // start already chosen
      const pos = getCanvasPos(e);
      const node = getNodeAt(pos.x, pos.y);
      if (!node) return;
      startVertex = node.id;
      inTree = new Set();
      treeEdges = [];
      totalWeight = 0;
      // Add the start vertex to T immediately.
      inTree.add(startVertex);
      render();
      updateSidebar();
      updateStatusBanner();
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!graph || startVertex !== null) {
        canvas.style.cursor = 'default';
        return;
      }
      const pos = getCanvasPos(e);
      const node = getNodeAt(pos.x, pos.y);
      canvas.style.cursor = node ? 'pointer' : 'default';
    });

    // ── Controls ───────────────────────────────────────────────────────────
    presetSelect.addEventListener('change', () => {
      loadPreset(presetSelect.value);
    });
    stepBtn.addEventListener('click', () => {
      stopRun();
      stepOnce();
    });
    runBtn.addEventListener('click', () => {
      if (!graph || startVertex === null) return;
      if (runIntervalId !== null) {
        // Clicking again pauses
        stopRun();
        runBtn.textContent = 'Run all';
        return;
      }
      runBtn.textContent = 'Pause';
      runIntervalId = setInterval(() => {
        const moved = stepOnce();
        if (!moved) {
          stopRun();
          runBtn.textContent = 'Run all';
        }
      }, RUN_INTERVAL_MS);
    });
    resetBtn.addEventListener('click', () => {
      resetAlgorithm();
    });

    // Keyboard: Space / Enter to step, R to reset, Esc to pause run.
    root.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        stopRun();
        stepOnce();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        resetAlgorithm();
      } else if (e.key === 'Escape') {
        if (runIntervalId !== null) {
          stopRun();
          runBtn.textContent = 'Run all';
        }
      }
    });

    // ── Rendering ──────────────────────────────────────────────────────────
    function render() {
      const rect = canvasContainer.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      if (!graph) return;

      // Compute frontier (only meaningful if start chosen).
      const frontier = startVertex !== null ? computeFrontier(graph.edges, inTree) : [];
      const frontierIds = new Set(frontier.map(e => e.id));
      const chosenId = frontier.length > 0 ? frontier[0].id : null;
      const treeEdgeIds = new Set(treeEdges);

      // Draw edges.
      for (const edge of graph.edges) {
        const from = graph.vertices.find(n => n.id === edge.from);
        const to = graph.vertices.find(n => n.id === edge.to);
        if (!from || !to) continue;
        const isTree = treeEdgeIds.has(edge.id);
        const isFrontier = frontierIds.has(edge.id);
        const isChosen = edge.id === chosenId;
        let strokeColor, lineWidth;
        if (isTree) {
          strokeColor = '#2d5a27'; // green
          lineWidth = 4;
        } else if (isChosen) {
          strokeColor = '#b8841d'; // amber, heavy
          lineWidth = 3.5;
        } else if (isFrontier) {
          strokeColor = 'rgba(184, 132, 29, 0.7)'; // amber, lighter
          lineWidth = 2.5;
        } else {
          strokeColor = 'rgba(26, 22, 18, 0.3)';
          lineWidth = 1.5;
        }
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        // Curve around obstacle vertices when the straight segment would
        // pass through (or very near) another vertex. Otherwise stay
        // straight.
        const curveOffset = computeEdgeCurveOffset(from, to, graph.vertices);
        let mx, my;
        if (curveOffset === 0) {
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.stroke();
          mx = (from.x + to.x) / 2;
          my = (from.y + to.y) / 2;
        } else {
          const dxE = to.x - from.x, dyE = to.y - from.y;
          const lenE = Math.hypot(dxE, dyE) || 1;
          const ppx = -dyE / lenE, ppy = dxE / lenE;
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;
          const cpx = midX + ppx * curveOffset;
          const cpy = midY + ppy * curveOffset;
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.quadraticCurveTo(cpx, cpy, to.x, to.y);
          ctx.stroke();
          // Quadratic-bezier midpoint at t=0.5: (a + 2·cp + b) / 4.
          mx = (from.x + 2 * cpx + to.x) / 4;
          my = (from.y + 2 * cpy + to.y) / 4;
        }

        // Weight label at curve midpoint, with a small white background so
        // it's legible over the edge line.
        ctx.font = '600 11px "Fira Code", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const wText = String(edge.weight);
        const padX = 4, padY = 1;
        const metrics = ctx.measureText(wText);
        const w = metrics.width + 2 * padX;
        const h = 14 + 2 * padY;
        ctx.fillStyle = 'rgba(244, 237, 228, 0.9)';
        ctx.fillRect(mx - w / 2, my - h / 2, w, h);
        ctx.strokeStyle = isChosen ? '#b8841d' : (isTree ? '#2d5a27' : 'rgba(26, 22, 18, 0.2)');
        ctx.lineWidth = 1;
        ctx.strokeRect(mx - w / 2, my - h / 2, w, h);
        ctx.fillStyle = isTree ? '#2d5a27' : (isChosen ? '#8a5e10' : '#3d342a');
        ctx.fillText(wText, mx, my);
      }

      // Draw nodes.
      for (const node of graph.vertices) {
        const isInTree = inTree.has(node.id);
        const isStart = node.id === startVertex;
        const isClickableStart = startVertex === null;
        ctx.beginPath();
        ctx.arc(node.x, node.y, NODE_RADIUS, 0, Math.PI * 2);
        if (isInTree) {
          ctx.fillStyle = '#2d5a27';
        } else if (isClickableStart) {
          ctx.fillStyle = '#fafaf6';
        } else {
          ctx.fillStyle = '#e5dfd1';
        }
        ctx.fill();
        ctx.strokeStyle = isStart
          ? '#1a1612'
          : (isInTree ? 'rgba(26, 22, 18, 0.4)' : 'rgba(26, 22, 18, 0.35)');
        ctx.lineWidth = isStart ? 2.5 : 1.5;
        ctx.stroke();

        ctx.font = '600 13px "Fira Code", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isInTree ? '#f4ede4' : '#1a1612';
        ctx.fillText(node.label, node.x, node.y + 0.5);

        // Mark the start vertex.
        if (isStart) {
          ctx.font = '500 9px "Fira Code", monospace';
          ctx.fillStyle = isInTree ? 'rgba(244, 237, 228, 0.85)' : 'rgba(26, 22, 18, 0.55)';
          ctx.fillText('start', node.x, node.y + NODE_RADIUS + 12);
        }
      }
    }

    function updateStatusBanner() {
      statusBanner.classList.remove('prim-state-pick', 'prim-state-done');
      if (!graph) {
        statusBanner.textContent = 'Loading…';
        return;
      }
      if (startVertex === null) {
        statusBanner.textContent = 'Click a vertex to choose a starting point';
        statusBanner.classList.add('prim-state-pick');
        return;
      }
      if (isComplete()) {
        statusBanner.textContent = 'MST complete · total weight ' + totalWeight;
        statusBanner.classList.add('prim-state-done');
        return;
      }
      const frontier = computeFrontier(graph.edges, inTree);
      if (frontier.length === 0) {
        // Empty frontier without complete = unreachable vertices remain.
        statusBanner.textContent = 'No frontier — graph not connected from start';
        return;
      }
      const next = frontier[0];
      const a = graph.vertices.find(n => n.id === next.from);
      const b = graph.vertices.find(n => n.id === next.to);
      const newEnd = inTree.has(next.from) ? b.label : a.label;
      statusBanner.textContent = 'Next: ' + a.label + '–' + b.label + ' (weight ' + next.weight + ') → adds ' + newEnd + ' to T';
    }

    function updateSidebar() {
      if (!graph) return;
      const n = graph.vertices.length;
      const m = graph.edges.length;
      sumRefs.vertices.textContent = String(n);
      sumRefs.edges.textContent = String(m);
      sumRefs.start.textContent = (startVertex === null)
        ? '--'
        : (graph.vertices.find(v => v.id === startVertex).label);

      const subEl = sidebarHeader.querySelector('.prim-sidebar-sub');
      if (startVertex === null) subEl.textContent = 'Pick a start vertex';
      else if (isComplete()) subEl.textContent = 'MST complete';
      else subEl.textContent = 'Step ' + treeEdges.length + ' / ' + (n - 1);

      progRefs.step.textContent = String(treeEdges.length) + ' / ' + (n - 1);
      progRefs.weight.textContent = String(totalWeight);
      const completeText = (startVertex === null)
        ? '--'
        : (isComplete() ? 'Yes' : 'No');
      progRefs.complete.textContent = completeText;
      progRefs.complete.classList.remove('prim-done');
      if (isComplete()) progRefs.complete.classList.add('prim-done');

      // Frontier list.
      frontierList.innerHTML = '';
      if (startVertex === null) {
        const tip = document.createElement('div');
        tip.className = 'prim-prop-tooltip';
        tip.style.margin = '0';
        tip.textContent = '(after you pick a start)';
        frontierList.appendChild(tip);
      } else {
        const frontier = computeFrontier(graph.edges, inTree);
        if (frontier.length === 0) {
          const tip = document.createElement('div');
          tip.className = 'prim-prop-tooltip';
          tip.style.margin = '0';
          tip.textContent = isComplete() ? '(empty — MST complete)' : '(empty)';
          frontierList.appendChild(tip);
        } else {
          frontier.forEach((e, idx) => {
            const a = graph.vertices.find(v => v.id === e.from);
            const b = graph.vertices.find(v => v.id === e.to);
            const tag = document.createElement('span');
            tag.className = 'prim-frontier-tag' + (idx === 0 ? ' prim-chosen' : '');
            tag.textContent = a.label + '–' + b.label + ' (' + e.weight + ')';
            frontierList.appendChild(tag);
          });
        }
      }

      // Tree edges list.
      edgeList.innerHTML = '';
      if (treeEdges.length === 0) {
        const tip = document.createElement('div');
        tip.className = 'prim-prop-tooltip';
        tip.style.margin = '0';
        tip.textContent = '(no edges added yet)';
        edgeList.appendChild(tip);
      } else {
        treeEdges.forEach((eid, idx) => {
          const e = graph.edges.find(x => x.id === eid);
          const a = graph.vertices.find(v => v.id === e.from);
          const b = graph.vertices.find(v => v.id === e.to);
          const item = document.createElement('div');
          item.className = 'prim-edge-item';
          item.innerHTML =
            '<span><span class="prim-edge-step">' + (idx + 1) + '.</span> ' +
            a.label + '–' + b.label + '</span>' +
            '<span>weight ' + e.weight + '</span>';
          edgeList.appendChild(item);
        });
      }

      // Button enabled states.
      const canStep = startVertex !== null && !isComplete();
      stepBtn.disabled = !canStep;
      runBtn.disabled = !canStep;
      resetBtn.disabled = startVertex === null && treeEdges.length === 0;
    }

    // Initial load.
    loadPreset(initialPresetKey);
  }

  function bootAll() {
    document.querySelectorAll('.prim-widget').forEach((root) => {
      if (root.dataset.primMounted === '1') return;
      root.dataset.primMounted = '1';
      mountWidget(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAll);
  } else {
    bootAll();
  }
}());
