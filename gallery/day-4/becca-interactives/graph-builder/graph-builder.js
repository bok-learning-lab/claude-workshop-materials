(function () {
  'use strict';

  // =========================================================================
  // GRAPH BUILDER (W6) — embeddable widget
  //
  // Refactored from the single-file Interactives/graph-builder.html.
  // Each <div class="gb-widget" data-problem='{...}'></div> on the page is
  // mounted as an independent instance with its own state, canvas, toolbar,
  // and sidebar. Multiple instances coexist without interference; there are
  // no document-wide IDs and no shared globals.
  //
  // Phase 1 (this file): refactor existing functionality. Phases 2 and 3
  // will add bridges/articulation overlays (segment 4.5) and tree-equivalence
  // indicators (segment 5.0) via additional `mode` values.
  // =========================================================================

  // ── Constants ────────────────────────────────────────────────────────────
  const NODE_RADIUS = 18;
  const NODE_HIT_RADIUS = 22;
  const EDGE_HIT_DISTANCE = 8;
  const CHROMATIC_COLORS = [
    '#2d5a27', // botanical green
    '#c4506e', // herbarium rose
    '#3a7d6e', // oxidized copper
    '#8b6914', // sepia
    '#7b4daa', // violet
    '#c17817', // amber
    '#2a6496', // steel blue
    '#b5452a', // burnt sienna
    '#5a8a3c', // sage
    '#9c4568'  // dusty mauve
  ];
  const CHROMATIC_COLOR_NAMES = [
    'Botanical Green', 'Herbarium Rose', 'Oxidized Copper', 'Sepia',
    'Pressed Violet', 'Amber', 'Steel Blue', 'Burnt Sienna', 'Sage', 'Dusty Mauve'
  ];

  // Property sections, in display order. Each entry: { key, title,
  // markerColor, tooltip, render(graph, host) }.
  // Section visibility is controlled by problem.viz.sections[key].
  // (render functions are wired up inside mountWidget where state lives.)

  let widgetSeq = 0;

  // ── Pure helpers ─────────────────────────────────────────────────────────
  function isObject(x) { return x && typeof x === 'object'; }

  // Build adjacency list { nodeId: [neighborId, ...] } for an undirected graph.
  function adjList(nodes, edges) {
    const adj = {};
    for (const n of nodes) adj[n.id] = [];
    for (const e of edges) {
      adj[e.from].push(e.to);
      adj[e.to].push(e.from);
    }
    return adj;
  }

  function bfsReach(adj, start) {
    const visited = new Set([start]);
    const queue = [start];
    while (queue.length) {
      const cur = queue.shift();
      for (const nb of (adj[cur] || [])) {
        if (!visited.has(nb)) { visited.add(nb); queue.push(nb); }
      }
    }
    return visited;
  }

  function getComponents(nodes, edges) {
    const adj = adjList(nodes, edges);
    const visited = new Set();
    const comps = [];
    for (const n of nodes) {
      if (visited.has(n.id)) continue;
      const c = bfsReach(adj, n.id);
      c.forEach(id => visited.add(id));
      comps.push(c);
    }
    return comps;
  }

  function isConnected(nodes, edges) {
    if (nodes.length <= 1) return nodes.length === 1;
    return getComponents(nodes, edges).length === 1;
  }

  function hasCycles(nodes, edges) {
    if (nodes.length === 0) return false;
    const adj = adjList(nodes, edges);
    const visited = new Set();
    let cycleFound = false;
    function dfs(id, parent) {
      visited.add(id);
      for (const nb of adj[id]) {
        if (!visited.has(nb)) {
          dfs(nb, id);
          if (cycleFound) return;
        } else if (nb !== parent) {
          cycleFound = true; return;
        }
      }
    }
    for (const n of nodes) {
      if (!visited.has(n.id)) {
        dfs(n.id, -1);
        if (cycleFound) return true;
      }
    }
    return false;
  }

  function checkBipartite(nodes, edges) {
    if (nodes.length === 0) return { isBipartite: true, partition: {} };
    const adj = adjList(nodes, edges);
    const color = {};
    let bip = true;
    for (const n of nodes) {
      if (color[n.id] !== undefined) continue;
      const queue = [n.id];
      color[n.id] = 0;
      while (queue.length && bip) {
        const cur = queue.shift();
        for (const nb of adj[cur]) {
          if (color[nb] === undefined) {
            color[nb] = 1 - color[cur];
            queue.push(nb);
          } else if (color[nb] === color[cur]) {
            bip = false;
          }
        }
      }
    }
    return { isBipartite: bip, partition: color };
  }

  function getDegrees(nodes, edges) {
    const deg = {};
    for (const n of nodes) deg[n.id] = 0;
    for (const e of edges) { deg[e.from]++; deg[e.to]++; }
    return deg;
  }

  // Welsh-Powell-style greedy coloring (largest-degree-first).
  function computeColoring(nodes, edges) {
    if (nodes.length === 0) return { coloring: {}, k: 0 };
    const adj = adjList(nodes, edges);
    const deg = getDegrees(nodes, edges);
    const ordered = nodes.slice().sort((a, b) => deg[b.id] - deg[a.id]);
    const coloring = {};
    let maxColor = 0;
    for (const n of ordered) {
      const used = new Set();
      for (const nb of adj[n.id]) {
        if (coloring[nb] !== undefined) used.add(coloring[nb]);
      }
      let c = 0;
      while (used.has(c)) c++;
      coloring[n.id] = c;
      maxColor = Math.max(maxColor, c);
    }
    return { coloring, k: maxColor + 1 };
  }

  // ── Bridges and articulation points (Phase 2) ──────────────────────────
  // A bridge is an edge whose removal increases the number of connected
  // components. Implementation: O(E · (V + E)) by remove-and-check, fine
  // for student-sized graphs (≤ 30 vertices, ≤ 60 edges).
  function computeBridges(nodes, edges) {
    if (edges.length === 0) return [];
    const baseCount = getComponents(nodes, edges).length;
    const bridges = [];
    for (const e of edges) {
      const others = edges.filter(x => x !== e);
      if (getComponents(nodes, others).length > baseCount) bridges.push(e);
    }
    return bridges;
  }

  // A vertex v is a cut vertex (articulation point) if removing v (and its
  // incident edges) splits the component containing v into multiple
  // components. Vertices in components of size ≤ 2 are never articulation
  // points (removing them just yields an empty or singleton subgraph).
  function computeArticulationPoints(nodes, edges) {
    if (nodes.length === 0) return [];
    const articulations = [];
    const origComps = getComponents(nodes, edges);
    for (const node of nodes) {
      const myComp = origComps.find(c => c.has(node.id));
      if (!myComp || myComp.size <= 2) continue;
      const subNodes = nodes.filter(n => n.id !== node.id && myComp.has(n.id));
      const subEdges = edges.filter(e =>
        e.from !== node.id && e.to !== node.id &&
        myComp.has(e.from) && myComp.has(e.to)
      );
      if (subNodes.length === 0) continue;
      if (getComponents(subNodes, subEdges).length > 1) articulations.push(node);
    }
    return articulations;
  }

  function minDegree(nodes, edges) {
    if (nodes.length === 0) return 0;
    const deg = getDegrees(nodes, edges);
    let m = Infinity;
    for (const n of nodes) m = Math.min(m, deg[n.id]);
    return m === Infinity ? 0 : m;
  }

  // ── Tree-equivalence properties (Phase 3) ──────────────────────────────
  // Five definitions of a tree (plus connectedness as a "logically distinct"
  // companion check), per segment 5.0 Activity 8.
  // For a graph G on n vertices:
  //   1. connected
  //   2. acyclic
  //   3. every edge is a cut edge ⟺ acyclic
  //   4. unique path between every pair of vertices ⟺ connected ∧ acyclic
  //   5. |E| = |V| − 1
  //   6. edge-maximal acyclic ⟺ acyclic ∧ (n = 0 ∨ exactly 1 component)
  // All six green ⟺ G is a tree.
  function hasUniquePathBetweenAllPairs(nodes, edges) {
    if (nodes.length <= 1) return true;
    return isConnected(nodes, edges) && !hasCycles(nodes, edges);
  }
  function isEdgeMaximalAcyclic(nodes, edges) {
    if (hasCycles(nodes, edges)) return false;
    if (nodes.length === 0) return true;
    return getComponents(nodes, edges).length === 1;
  }

  // Display order for tree-equivalence lights.
  const TREE_EQ_PROPS = [
    { key: 'connected',     label: 'Connected' },
    { key: 'acyclic',       label: 'Acyclic (no cycles)' },
    { key: 'everyEdgeCut',  label: 'Every edge is a cut edge' },
    { key: 'uniquePath',    label: 'Unique path between every pair' },
    { key: 'edgeCount',     label: '|E| = |V| − 1' },
    { key: 'edgeMaxAcyclic', label: 'Edge-maximal acyclic' }
  ];

  function pointToSegmentDist(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - ax, py - ay);
    let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const projX = ax + t * dx;
    const projY = ay + t * dy;
    return Math.hypot(px - projX, py - projY);
  }

  // ── Mount a single widget instance ───────────────────────────────────────
  function mountWidget(root) {
    let problem = {};
    try {
      problem = JSON.parse(root.dataset.problem || '{}');
    } catch (e) {
      console.error('graph-builder: invalid data-problem JSON', e);
      problem = {};
    }
    const vizCfg = isObject(problem.viz) ? problem.viz : {};
    const sectionsCfg = isObject(vizCfg.sections) ? vizCfg.sections : {};
    const toolsCfg = isObject(vizCfg.tools) ? vizCfg.tools : {};
    function sectionOn(key) {
      // Default true unless explicitly false.
      return sectionsCfg[key] !== false;
    }
    function toolOn(key) {
      return toolsCfg[key] !== false;
    }
    const titleText = (typeof problem.title === 'string' && problem.title.length)
      ? problem.title : 'Graph Builder';
    const mode_kind = (typeof vizCfg.mode === 'string') ? vizCfg.mode : 'explore';
    const isBridgesMode = mode_kind === 'bridges';
    const isTreeMode = mode_kind === 'tree-eq';

    widgetSeq++;
    const instanceId = 'gb-' + widgetSeq;

    // Ensure the widget root is focusable so keyboard shortcuts can target it.
    if (!root.hasAttribute('tabindex')) root.setAttribute('tabindex', '0');

    // ── Build DOM scaffold ─────────────────────────────────────────────────
    root.innerHTML = '';

    // Header.
    const header = document.createElement('div');
    header.className = 'gb-header';
    {
      const h = document.createElement('h2');
      h.innerHTML = '';
      const titleSpan = document.createTextNode(titleText + ' ');
      h.appendChild(titleSpan);
      const sub = document.createElement('span');
      sub.className = 'gb-subtitle';
      sub.textContent = 'an interactive field notebook for graph theory';
      h.appendChild(sub);
      header.appendChild(h);
    }

    const tools = document.createElement('div');
    tools.className = 'gb-header-tools';

    function makeToolBtn(extraClass, label, keyHint, title) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'gb-tool-btn ' + extraClass;
      if (title) b.title = title;
      b.appendChild(document.createTextNode(label + ' '));
      if (keyHint) {
        const k = document.createElement('span');
        k.className = 'gb-key-hint';
        k.textContent = keyHint;
        b.appendChild(k);
      }
      return b;
    }
    function makeDivider() {
      const d = document.createElement('div');
      d.className = 'gb-tool-divider';
      return d;
    }

    const btnNode = makeToolBtn('gb-active gb-btn-node', '+ Vertex', 'V',
      'Add Vertex mode — click canvas to place vertices');
    const btnEdge = makeToolBtn('gb-btn-edge', '+ Edge', 'E',
      'Add Edge mode — click two vertices to connect them');
    tools.appendChild(btnNode);
    tools.appendChild(btnEdge);

    let btnLabel = null, btnDelete = null, btnColor = null;
    if (toolOn('label') || toolOn('delete') !== false /* always on */) {
      tools.appendChild(makeDivider());
    }
    if (toolOn('label')) {
      btnLabel = makeToolBtn('gb-btn-label', 'Label', 'L',
        'Label mode — click a vertex to rename it');
      tools.appendChild(btnLabel);
    }
    btnDelete = makeToolBtn('gb-btn-delete', 'Delete', 'D',
      'Delete mode — click a vertex or edge to remove it');
    tools.appendChild(btnDelete);

    if (toolOn('color')) {
      tools.appendChild(makeDivider());
      btnColor = makeToolBtn('gb-btn-color', 'Color', 'C',
        'Toggle chromatic coloring visualization');
      tools.appendChild(btnColor);
    }

    tools.appendChild(makeDivider());
    const btnReset = makeToolBtn('gb-danger gb-btn-reset', 'Reset', '',
      'Clear entire graph');
    tools.appendChild(btnReset);

    header.appendChild(tools);
    root.appendChild(header);

    // Main area.
    const main = document.createElement('div');
    main.className = 'gb-main';

    const canvasContainer = document.createElement('div');
    canvasContainer.className = 'gb-canvas-container';

    const canvas = document.createElement('canvas');
    canvas.className = 'gb-canvas';
    canvasContainer.appendChild(canvas);

    const modeIndicator = document.createElement('div');
    modeIndicator.className = 'gb-mode-indicator';
    modeIndicator.textContent = 'Add Vertex';
    canvasContainer.appendChild(modeIndicator);

    const canvasHint = document.createElement('div');
    canvasHint.className = 'gb-canvas-hint';
    canvasHint.textContent = 'Click anywhere on the canvas to place your first vertex';
    canvasContainer.appendChild(canvasHint);

    main.appendChild(canvasContainer);

    // Sidebar.
    const sidebar = document.createElement('div');
    sidebar.className = 'gb-sidebar';

    const sidebarHeader = document.createElement('div');
    sidebarHeader.className = 'gb-sidebar-header';
    {
      const h = document.createElement('h3');
      h.textContent = 'Field Observations';
      sidebarHeader.appendChild(h);
      const cnt = document.createElement('div');
      cnt.className = 'gb-specimen-count';
      cnt.textContent = 'No specimens collected';
      sidebarHeader.appendChild(cnt);
    }
    sidebar.appendChild(sidebarHeader);

    // Build property sections per config. Each is built lazily here; the
    // refs are captured for updateProperties() to populate.
    const sectionRefs = {};

    function makeSection(key, titleText, markerColor, rowsHtml) {
      const sec = document.createElement('div');
      sec.className = 'gb-prop-section';
      sec.dataset.section = key;
      const title = document.createElement('div');
      title.className = 'gb-prop-section-title';
      const marker = document.createElement('span');
      marker.className = 'gb-section-marker';
      if (markerColor) marker.style.color = markerColor;
      title.appendChild(marker);
      title.appendChild(document.createTextNode(' ' + titleText));
      sec.appendChild(title);
      if (rowsHtml) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = rowsHtml;
        while (wrapper.firstChild) sec.appendChild(wrapper.firstChild);
      }
      return sec;
    }

    if (sectionOn('summary')) {
      // In bridges mode, expose min-degree δ(G) alongside the basic counts —
      // students cross-check the chain κ(G) ≤ λ(G) ≤ δ(G) with actual numbers.
      const minDegRow = isBridgesMode
        ? '<div class="gb-prop-row"><span class="gb-prop-label">Min degree δ(G)</span><span class="gb-prop-value gb-info gb-prop-mindeg">--</span></div>'
        : '';
      const sec = makeSection('summary', 'Summary', null,
        '<div class="gb-prop-row"><span class="gb-prop-label">Vertices</span><span class="gb-prop-value gb-info gb-prop-vertices">0</span></div>' +
        '<div class="gb-prop-row"><span class="gb-prop-label">Edges</span><span class="gb-prop-value gb-info gb-prop-edges">0</span></div>' +
        '<div class="gb-prop-row"><span class="gb-prop-label">Components</span><span class="gb-prop-value gb-info gb-prop-components">0</span></div>' +
        minDegRow
      );
      sidebar.appendChild(sec);
      sectionRefs.summary = {
        vertices: sec.querySelector('.gb-prop-vertices'),
        edges: sec.querySelector('.gb-prop-edges'),
        components: sec.querySelector('.gb-prop-components'),
        mindeg: sec.querySelector('.gb-prop-mindeg')
      };
    }

    if (sectionOn('connectivity')) {
      const sec = makeSection('connectivity', 'Connectivity', 'var(--gb-copper)',
        '<div class="gb-prop-row"><span class="gb-prop-label">Connected</span><span class="gb-prop-value gb-prop-connected">--</span></div>' +
        '<div class="gb-prop-tooltip">All vertices reachable from any other vertex</div>'
      );
      sidebar.appendChild(sec);
      sectionRefs.connectivity = { connected: sec.querySelector('.gb-prop-connected') };
    }

    if (sectionOn('cycles')) {
      const sec = makeSection('cycles', 'Cycles', 'var(--gb-rose)',
        '<div class="gb-prop-row"><span class="gb-prop-label">Contains Cycles</span><span class="gb-prop-value gb-prop-cycles">--</span></div>' +
        '<div class="gb-prop-tooltip">A closed path visiting distinct edges</div>'
      );
      sidebar.appendChild(sec);
      sectionRefs.cycles = { cycles: sec.querySelector('.gb-prop-cycles') };
    }

    if (sectionOn('tree')) {
      const sec = makeSection('tree', 'Tree Classification', 'var(--gb-sepia)',
        '<div class="gb-prop-row"><span class="gb-prop-label">Is a Tree</span><span class="gb-prop-value gb-prop-tree">--</span></div>' +
        '<div class="gb-prop-row"><span class="gb-prop-label">Is a Forest</span><span class="gb-prop-value gb-prop-forest">--</span></div>' +
        '<div class="gb-prop-tooltip">Connected + acyclic + (n−1) edges = tree</div>'
      );
      sidebar.appendChild(sec);
      sectionRefs.tree = {
        tree: sec.querySelector('.gb-prop-tree'),
        forest: sec.querySelector('.gb-prop-forest')
      };
    }

    if (sectionOn('bipartite')) {
      const sec = makeSection('bipartite', 'Bipartiteness', 'var(--gb-violet)',
        '<div class="gb-prop-row"><span class="gb-prop-label">Bipartite</span><span class="gb-prop-value gb-prop-bipartite">--</span></div>' +
        '<div class="gb-prop-tooltip">Two-colorable; no odd cycles</div>'
      );
      sidebar.appendChild(sec);
      sectionRefs.bipartite = { bipartite: sec.querySelector('.gb-prop-bipartite') };
    }

    if (sectionOn('chromatic')) {
      const sec = makeSection('chromatic', 'Chromatic Number', 'var(--gb-green)',
        '<div class="gb-prop-row"><span class="gb-prop-label">Chromatic # (greedy)</span><span class="gb-prop-value gb-info gb-prop-chromatic">--</span></div>' +
        '<div class="gb-prop-tooltip">Min colors so no adjacent vertices share a color</div>' +
        '<div class="gb-color-legend"></div>'
      );
      sidebar.appendChild(sec);
      sectionRefs.chromatic = {
        chromatic: sec.querySelector('.gb-prop-chromatic'),
        legend: sec.querySelector('.gb-color-legend')
      };
    }

    if (sectionOn('degrees')) {
      const sec = makeSection('degrees', 'Vertex Degrees', 'var(--gb-sepia)',
        '<div class="gb-degree-list"></div>'
      );
      sidebar.appendChild(sec);
      sectionRefs.degrees = { list: sec.querySelector('.gb-degree-list') };
    }

    // Tree-property lights section — shown when mode === 'tree-eq' or
    // when sectionsCfg.treeEq is explicitly enabled. Six rows, one per
    // tree-equivalent property; all six green ⇒ the graph is a tree.
    if (isTreeMode || sectionsCfg.treeEq === true) {
      const sec = makeSection('treeEq', 'Tree-Property Lights', 'var(--gb-sepia)', '');
      const lightsHost = document.createElement('div');
      lightsHost.className = 'gb-prop-lights';
      const lightRefs = {};
      for (const p of TREE_EQ_PROPS) {
        const row = document.createElement('div');
        row.className = 'gb-light-row';
        row.dataset.prop = p.key;
        const dot = document.createElement('span');
        dot.className = 'gb-light-dot';
        const lbl = document.createElement('span');
        lbl.className = 'gb-light-label';
        lbl.textContent = p.label;
        const val = document.createElement('span');
        val.className = 'gb-light-value';
        val.textContent = '--';
        row.appendChild(dot);
        row.appendChild(lbl);
        row.appendChild(val);
        lightsHost.appendChild(row);
        lightRefs[p.key] = { dot, val };
      }
      sec.appendChild(lightsHost);
      const tip = document.createElement('div');
      tip.className = 'gb-prop-tooltip';
      tip.textContent = 'All six green ⇒ the graph is a tree.';
      sec.appendChild(tip);
      sidebar.appendChild(sec);
      sectionRefs.treeEq = lightRefs;
    }

    // Bridges & cut vertices section — shown when mode === 'bridges' or
    // when sectionsCfg.bridges is explicitly enabled.
    if (isBridgesMode || sectionsCfg.bridges === true) {
      const sec = makeSection('bridges', 'Bridges & Cut Vertices', 'var(--gb-rose)',
        '<div class="gb-prop-row"><span class="gb-prop-label">Bridges</span><span class="gb-prop-value gb-info gb-prop-bridge-count">--</span></div>' +
        '<div class="gb-prop-row"><span class="gb-prop-label">Cut vertices</span><span class="gb-prop-value gb-info gb-prop-articulation-count">--</span></div>' +
        '<div class="gb-prop-tooltip">A bridge is an edge whose removal disconnects the component. A cut vertex is a vertex whose removal does the same.</div>' +
        '<div class="gb-bridge-list"></div>' +
        '<div class="gb-articulation-list"></div>'
      );
      sidebar.appendChild(sec);
      sectionRefs.bridges = {
        bridgeCount: sec.querySelector('.gb-prop-bridge-count'),
        articulationCount: sec.querySelector('.gb-prop-articulation-count'),
        bridgeList: sec.querySelector('.gb-bridge-list'),
        articulationList: sec.querySelector('.gb-articulation-list')
      };
    }

    main.appendChild(sidebar);
    root.appendChild(main);

    // ── State (per-instance) ──────────────────────────────────────────────
    let nodes = [];     // { id, x, y, label }
    let edges = [];     // { id, from, to }
    let nextNodeId = 1;
    let nextEdgeId = 1;
    let mode = 'node';
    let edgeStart = null;
    let showColoring = false;
    let nodeColoring = {};
    let draggingNode = null;
    let dragOffset = { x: 0, y: 0 };
    let hoveredNode = null;
    let hoveredEdge = null;
    let mousePos = { x: 0, y: 0 };
    // Bridges/articulations cache — recomputed on each topology mutation
    // (not on every render or mouse move). Empty when isBridgesMode is false.
    let bridgeIdSet = new Set();
    let articulationIdSet = new Set();

    const ctx = canvas.getContext('2d');

    // Pre-load initial graph if specified.
    if (isObject(vizCfg.initialGraph)) {
      const ig = vizCfg.initialGraph;
      if (Array.isArray(ig.vertices)) {
        for (const v of ig.vertices) {
          if (typeof v.x !== 'number' || typeof v.y !== 'number') continue;
          const id = (typeof v.id === 'number') ? v.id : nextNodeId;
          nodes.push({
            id: id,
            x: v.x, y: v.y,
            label: typeof v.label === 'string' ? v.label : ('v' + id)
          });
          if (id >= nextNodeId) nextNodeId = id + 1;
        }
      }
      if (Array.isArray(ig.edges)) {
        for (const e of ig.edges) {
          if (typeof e.from !== 'number' || typeof e.to !== 'number') continue;
          if (!nodes.find(n => n.id === e.from) || !nodes.find(n => n.id === e.to)) continue;
          const exists = edges.some(x =>
            (x.from === e.from && x.to === e.to) ||
            (x.from === e.to && x.to === e.from)
          );
          if (exists) continue;
          edges.push({ id: nextEdgeId++, from: e.from, to: e.to });
        }
      }
    }

    // ── Canvas sizing (ResizeObserver per instance) ──────────────────────
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
    // Initial size — schedule via rAF to ensure layout is complete.
    requestAnimationFrame(resizeCanvas);

    // ── Container-width responsive classes ──────────────────────────────
    // Toggle classes based on the widget root's own width so the layout
    // adapts to narrow embedding containers (e.g. LXP content columns)
    // regardless of viewport width.
    if (typeof ResizeObserver !== 'undefined') {
      const rootRo = new ResizeObserver((entries) => {
        const w = entries[0].contentRect.width;
        root.classList.toggle('gb-narrow', w < 760);
        root.classList.toggle('gb-extra-narrow', w < 600);
      });
      rootRo.observe(root);
    }

    // ── Mode switching ──────────────────────────────────────────────────
    function setMode(newMode) {
      mode = newMode;
      edgeStart = null;
      [btnNode, btnEdge, btnDelete, btnLabel].forEach(b => {
        if (b) b.classList.remove('gb-active');
      });
      modeIndicator.className = 'gb-mode-indicator';
      switch (mode) {
        case 'node':
          btnNode.classList.add('gb-active');
          modeIndicator.textContent = 'Add Vertex';
          break;
        case 'edge':
          btnEdge.classList.add('gb-active');
          modeIndicator.textContent = 'Add Edge';
          modeIndicator.classList.add('gb-edge-mode');
          break;
        case 'delete':
          btnDelete.classList.add('gb-active');
          modeIndicator.textContent = 'Delete';
          modeIndicator.classList.add('gb-delete-mode');
          break;
        case 'label':
          if (btnLabel) btnLabel.classList.add('gb-active');
          modeIndicator.textContent = 'Label Vertex';
          modeIndicator.classList.add('gb-label-mode');
          break;
      }
      render();
    }

    btnNode.addEventListener('click', () => setMode('node'));
    btnEdge.addEventListener('click', () => setMode('edge'));
    btnDelete.addEventListener('click', () => setMode('delete'));
    if (btnLabel) btnLabel.addEventListener('click', () => setMode('label'));

    if (btnColor) {
      btnColor.addEventListener('click', () => {
        showColoring = !showColoring;
        btnColor.classList.toggle('gb-active', showColoring);
        if (showColoring) recomputeColoring();
        render();
        updateProperties();
      });
    }

    btnReset.addEventListener('click', () => {
      if (nodes.length === 0 && edges.length === 0) return;
      nodes = []; edges = [];
      nextNodeId = 1; nextEdgeId = 1;
      edgeStart = null;
      nodeColoring = {};
      draggingNode = null;
      hoveredNode = null;
      hoveredEdge = null;
      render();
      updateProperties();
    });

    // Keyboard shortcuts — scoped to widget focus.
    root.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      let handled = true;
      switch (e.key.toLowerCase()) {
        case 'v': setMode('node'); break;
        case 'e': setMode('edge'); break;
        case 'd': setMode('delete'); break;
        case 'l': if (btnLabel) setMode('label'); break;
        case 'c':
          if (btnColor) {
            showColoring = !showColoring;
            btnColor.classList.toggle('gb-active', showColoring);
            if (showColoring) recomputeColoring();
            render();
            updateProperties();
          }
          break;
        case 'escape':
          edgeStart = null;
          setMode('node');
          break;
        default:
          handled = false;
      }
      if (handled) e.preventDefault();
    });

    // ── Hit testing ─────────────────────────────────────────────────────
    function getNodeAt(x, y) {
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        const dx = n.x - x, dy = n.y - y;
        if (dx * dx + dy * dy <= NODE_HIT_RADIUS * NODE_HIT_RADIUS) return n;
      }
      return null;
    }
    function getEdgeAt(x, y) {
      for (let i = edges.length - 1; i >= 0; i--) {
        const e = edges[i];
        const a = nodes.find(n => n.id === e.from);
        const b = nodes.find(n => n.id === e.to);
        if (!a || !b) continue;
        const d = pointToSegmentDist(x, y, a.x, a.y, b.x, b.y);
        if (d <= EDGE_HIT_DISTANCE) return e;
      }
      return null;
    }

    function getCanvasPos(e) {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    // ── Canvas interaction ──────────────────────────────────────────────
    canvas.addEventListener('mousedown', (e) => {
      // Focus the widget so keyboard shortcuts work.
      root.focus({ preventScroll: true });
      const pos = getCanvasPos(e);
      const node = getNodeAt(pos.x, pos.y);
      if (mode === 'node') {
        if (node) {
          draggingNode = node;
          dragOffset.x = pos.x - node.x;
          dragOffset.y = pos.y - node.y;
          canvas.style.cursor = 'grabbing';
        }
      } else if (mode === 'edge') {
        if (node) {
          if (edgeStart === null) {
            edgeStart = node.id;
            render();
          } else if (edgeStart !== node.id) {
            const exists = edges.some(x =>
              (x.from === edgeStart && x.to === node.id) ||
              (x.from === node.id && x.to === edgeStart)
            );
            if (!exists) {
              edges.push({ id: nextEdgeId++, from: edgeStart, to: node.id });
              if (showColoring) recomputeColoring();
              updateProperties();
            }
            edgeStart = null;
            render();
          } else {
            edgeStart = null;
            render();
          }
        } else {
          edgeStart = null;
          render();
        }
      } else if (mode === 'delete') {
        if (node) deleteNode(node.id);
        else {
          const edge = getEdgeAt(pos.x, pos.y);
          if (edge) deleteEdge(edge.id);
        }
      } else if (mode === 'label') {
        if (node) showLabelInput(node);
      }
    });

    canvas.addEventListener('mouseup', () => {
      if (draggingNode) {
        draggingNode = null;
        canvas.style.cursor = '';
        if (showColoring) recomputeColoring();
        render();
      }
    });

    canvas.addEventListener('mousemove', (e) => {
      const pos = getCanvasPos(e);
      mousePos = pos;
      if (draggingNode) {
        draggingNode.x = pos.x - dragOffset.x;
        draggingNode.y = pos.y - dragOffset.y;
        render();
        return;
      }
      const node = getNodeAt(pos.x, pos.y);
      const edge = node ? null : getEdgeAt(pos.x, pos.y);
      const oldHN = hoveredNode, oldHE = hoveredEdge;
      hoveredNode = node;
      hoveredEdge = edge;
      if (hoveredNode !== oldHN || hoveredEdge !== oldHE) render();

      if (mode === 'node')      canvas.style.cursor = node ? 'grab' : 'crosshair';
      else if (mode === 'edge') canvas.style.cursor = node ? 'pointer' : 'default';
      else if (mode === 'delete') canvas.style.cursor = (node || edge) ? 'pointer' : 'default';
      else if (mode === 'label') canvas.style.cursor = node ? 'text' : 'default';
    });

    canvas.addEventListener('click', (e) => {
      if (mode !== 'node') return;
      if (draggingNode) return;
      const pos = getCanvasPos(e);
      if (getNodeAt(pos.x, pos.y)) return;
      const label = 'v' + nextNodeId;
      nodes.push({ id: nextNodeId++, x: pos.x, y: pos.y, label });
      if (showColoring) recomputeColoring();
      render();
      updateProperties();
    });

    canvas.addEventListener('mouseleave', () => {
      hoveredNode = null;
      hoveredEdge = null;
      render();
    });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // ── Delete operations ──────────────────────────────────────────────
    function deleteNode(id) {
      nodes = nodes.filter(n => n.id !== id);
      edges = edges.filter(e => e.from !== id && e.to !== id);
      if (edgeStart === id) edgeStart = null;
      hoveredNode = null;
      if (showColoring) recomputeColoring();
      render(); updateProperties();
    }
    function deleteEdge(id) {
      edges = edges.filter(e => e.id !== id);
      hoveredEdge = null;
      if (showColoring) recomputeColoring();
      render(); updateProperties();
    }

    // ── Label input — appended to canvas-container (per-instance scope) ──
    function showLabelInput(node) {
      const existing = root.querySelector('.gb-node-label-input');
      if (existing) existing.remove();
      const input = document.createElement('input');
      input.className = 'gb-node-label-input';
      input.type = 'text';
      input.value = node.label;
      input.maxLength = 8;
      // Position relative to the canvas-container (which is position: relative).
      input.style.left = (node.x - 40) + 'px';
      input.style.top = (node.y - 14) + 'px';
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          node.label = input.value || node.label;
          input.remove();
          render(); updateProperties();
        } else if (e.key === 'Escape') {
          input.remove();
        }
        e.stopPropagation();
      });
      input.addEventListener('blur', () => {
        node.label = input.value || node.label;
        input.remove();
        render(); updateProperties();
      });
      canvasContainer.appendChild(input);
      input.focus();
      input.select();
    }

    // ── Coloring helper (state-aware wrapper around computeColoring) ────
    function recomputeColoring() {
      const r = computeColoring(nodes, edges);
      nodeColoring = r.coloring;
    }

    // ── Rendering ──────────────────────────────────────────────────────
    function render() {
      const rect = canvasContainer.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Draw edges.
      for (const edge of edges) {
        const from = nodes.find(n => n.id === edge.from);
        const to   = nodes.find(n => n.id === edge.to);
        if (!from || !to) continue;
        const isHovered = hoveredEdge && hoveredEdge.id === edge.id;
        const isDelMode = mode === 'delete';
        const isBridge = isBridgesMode && bridgeIdSet.has(edge.id);
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        if (isHovered && isDelMode) {
          ctx.strokeStyle = '#c4506e';
          ctx.lineWidth = 3;
          ctx.setLineDash([6, 4]);
        } else if (isBridge) {
          // Bridges drawn in rose, slightly thicker than default. Hover
          // bumps the alpha; non-hover stays vivid enough to read.
          ctx.strokeStyle = isHovered ? 'rgba(196, 80, 110, 1)' : 'rgba(196, 80, 110, 0.85)';
          ctx.lineWidth = isHovered ? 3 : 2.6;
          ctx.setLineDash([]);
        } else if (isHovered) {
          ctx.strokeStyle = 'rgba(26, 22, 18, 0.5)';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([]);
        } else {
          ctx.strokeStyle = 'rgba(26, 22, 18, 0.35)';
          ctx.lineWidth = 1.8;
          ctx.setLineDash([]);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Edge-in-progress.
      if (edgeStart !== null && mode === 'edge') {
        const startNode = nodes.find(n => n.id === edgeStart);
        if (startNode) {
          ctx.beginPath();
          ctx.moveTo(startNode.x, startNode.y);
          ctx.lineTo(mousePos.x, mousePos.y);
          ctx.strokeStyle = 'rgba(58, 125, 110, 0.5)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Nodes.
      const degrees = getDegrees(nodes, edges);
      for (const node of nodes) {
        const isHovered = hoveredNode && hoveredNode.id === node.id;
        const isEdgeStart = edgeStart === node.id;
        const isDelMode = mode === 'delete';
        const isArticulation = isBridgesMode && articulationIdSet.has(node.id);
        const colorIdx = showColoring ? nodeColoring[node.id] : undefined;

        // Articulation-point ring — drawn outside the node circle so it
        // is visible regardless of fill (including chromatic colors).
        if (isArticulation) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, NODE_RADIUS + 4, 0, Math.PI * 2);
          ctx.strokeStyle = '#c4506e';
          ctx.lineWidth = 2;
          ctx.setLineDash([2, 2]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Registration crosshair marks.
        const crossSize = NODE_RADIUS + 6;
        ctx.beginPath();
        ctx.strokeStyle = isHovered
          ? 'rgba(26, 22, 18, 0.25)'
          : 'rgba(26, 22, 18, 0.1)';
        ctx.lineWidth = 0.5;
        ctx.moveTo(node.x - crossSize, node.y);
        ctx.lineTo(node.x - crossSize + 5, node.y);
        ctx.moveTo(node.x + crossSize, node.y);
        ctx.lineTo(node.x + crossSize - 5, node.y);
        ctx.moveTo(node.x, node.y - crossSize);
        ctx.lineTo(node.x, node.y - crossSize + 5);
        ctx.moveTo(node.x, node.y + crossSize);
        ctx.lineTo(node.x, node.y + crossSize - 5);
        ctx.stroke();

        // Node circle.
        ctx.beginPath();
        ctx.arc(node.x, node.y, NODE_RADIUS, 0, Math.PI * 2);
        if (showColoring && colorIdx !== undefined) {
          ctx.fillStyle = CHROMATIC_COLORS[colorIdx % CHROMATIC_COLORS.length];
        } else if (isHovered && isDelMode) {
          ctx.fillStyle = '#c4506e';
        } else if (isEdgeStart) {
          ctx.fillStyle = '#3a7d6e';
        } else {
          ctx.fillStyle = '#2d5a27';
        }
        ctx.fill();
        ctx.strokeStyle = isHovered
          ? 'rgba(26, 22, 18, 0.6)'
          : 'rgba(26, 22, 18, 0.3)';
        ctx.lineWidth = isHovered ? 2 : 1.5;
        ctx.stroke();
        // Inner highlight.
        ctx.beginPath();
        ctx.arc(node.x, node.y, NODE_RADIUS - 3, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        // Label.
        ctx.fillStyle = '#f4ede4';
        ctx.font = '500 12px "Fira Code", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.label, node.x, node.y + 0.5);
        // Degree indicator.
        const deg = degrees[node.id] || 0;
        ctx.fillStyle = 'rgba(26, 22, 18, 0.4)';
        ctx.font = '400 10px "Fira Code", monospace';
        ctx.fillText('d=' + deg, node.x, node.y + NODE_RADIUS + 14);
      }

      canvasHint.classList.toggle('gb-hidden', nodes.length > 0);
    }

    // ── Properties panel update ────────────────────────────────────────
    function setVal(el, text, cls) {
      if (!el) return;
      el.textContent = text;
      // Reset to base classes (gb-prop-value plus any *-flag classes from
      // the element's data; we only manage gb-yes / gb-no / gb-info here).
      el.classList.remove('gb-yes', 'gb-no');
      if (cls === 'yes') el.classList.add('gb-yes');
      if (cls === 'no')  el.classList.add('gb-no');
    }

    function updateProperties() {
      const n = nodes.length;
      const m = edges.length;
      const comps = getComponents(nodes, edges);
      const numComps = comps.length;
      const connected = n <= 1 ? (n === 1) : numComps === 1;
      const cycles = hasCycles(nodes, edges);
      const tree = n > 0 && connected && !cycles && m === n - 1;
      const forest = n > 0 && !cycles;
      const bipart = checkBipartite(nodes, edges);
      const colorRes = computeColoring(nodes, edges);
      // Update the cached `nodeColoring` so render() shows colors when
      // toggled (we don't recompute when the toggle is off).
      if (showColoring) nodeColoring = colorRes.coloring;
      const degrees = getDegrees(nodes, edges);

      // Summary.
      if (sectionRefs.summary) {
        setVal(sectionRefs.summary.vertices, String(n));
        setVal(sectionRefs.summary.edges, String(m));
        setVal(sectionRefs.summary.components, n === 0 ? '0' : String(numComps));
        if (sectionRefs.summary.mindeg) {
          setVal(sectionRefs.summary.mindeg, n === 0 ? '--' : String(minDegree(nodes, edges)));
        }
      }

      // Specimen count line.
      const cntEl = sidebarHeader.querySelector('.gb-specimen-count');
      if (n === 0) {
        cntEl.textContent = 'No specimens collected';
      } else {
        cntEl.textContent = n + ' ' + (n === 1 ? 'vertex' : 'vertices') + ', ' +
          m + ' ' + (m === 1 ? 'edge' : 'edges') + ' observed';
      }

      // Connectivity.
      if (sectionRefs.connectivity) {
        if (n === 0) setVal(sectionRefs.connectivity.connected, '--');
        else setVal(sectionRefs.connectivity.connected, connected ? 'Yes' : 'No', connected ? 'yes' : 'no');
      }

      // Cycles.
      if (sectionRefs.cycles) {
        if (n === 0) setVal(sectionRefs.cycles.cycles, '--');
        else setVal(sectionRefs.cycles.cycles, cycles ? 'Yes' : 'No', cycles ? 'no' : 'yes');
      }

      // Tree.
      if (sectionRefs.tree) {
        if (n === 0) {
          setVal(sectionRefs.tree.tree, '--');
          setVal(sectionRefs.tree.forest, '--');
        } else {
          setVal(sectionRefs.tree.tree, tree ? 'Yes' : 'No', tree ? 'yes' : 'no');
          setVal(sectionRefs.tree.forest, forest ? 'Yes' : 'No', forest ? 'yes' : 'no');
        }
      }

      // Bipartite.
      if (sectionRefs.bipartite) {
        if (n === 0) setVal(sectionRefs.bipartite.bipartite, '--');
        else setVal(sectionRefs.bipartite.bipartite, bipart.isBipartite ? 'Yes' : 'No', bipart.isBipartite ? 'yes' : 'no');
      }

      // Chromatic.
      if (sectionRefs.chromatic) {
        if (n === 0) {
          setVal(sectionRefs.chromatic.chromatic, '--');
          sectionRefs.chromatic.legend.innerHTML = '';
        } else {
          setVal(sectionRefs.chromatic.chromatic, String(colorRes.k));
          // Legend.
          const legend = sectionRefs.chromatic.legend;
          legend.innerHTML = '';
          for (let i = 0; i < colorRes.k; i++) {
            const swatch = document.createElement('div');
            swatch.className = 'gb-color-swatch';
            swatch.innerHTML =
              '<span class="gb-swatch" style="background:' +
              CHROMATIC_COLORS[i % CHROMATIC_COLORS.length] +
              '"></span>' +
              CHROMATIC_COLOR_NAMES[i % CHROMATIC_COLOR_NAMES.length];
            legend.appendChild(swatch);
          }
        }
      }

      // Tree-property lights — six booleans, one per tree-equivalent property.
      if (sectionRefs.treeEq) {
        function setLight(key, val) {
          const ref = sectionRefs.treeEq[key];
          if (!ref) return;
          ref.dot.classList.remove('gb-light-on', 'gb-light-off');
          ref.val.classList.remove('gb-yes', 'gb-no');
          if (val === null) {
            ref.val.textContent = '--';
            return;
          }
          ref.dot.classList.add(val ? 'gb-light-on' : 'gb-light-off');
          ref.val.textContent = val ? 'Yes' : 'No';
          ref.val.classList.add(val ? 'gb-yes' : 'gb-no');
        }
        if (n === 0) {
          for (const p of TREE_EQ_PROPS) setLight(p.key, null);
        } else {
          setLight('connected', connected);
          setLight('acyclic', !cycles);
          setLight('everyEdgeCut', !cycles);
          setLight('uniquePath', hasUniquePathBetweenAllPairs(nodes, edges));
          setLight('edgeCount', m === n - 1);
          setLight('edgeMaxAcyclic', isEdgeMaximalAcyclic(nodes, edges));
        }
      }

      // Bridges & cut vertices (recompute caches; populate counts and lists).
      if (isBridgesMode || sectionsCfg.bridges === true) {
        const br = computeBridges(nodes, edges);
        const ap = computeArticulationPoints(nodes, edges);
        bridgeIdSet = new Set(br.map(e => e.id));
        articulationIdSet = new Set(ap.map(node => node.id));
        if (sectionRefs.bridges) {
          setVal(sectionRefs.bridges.bridgeCount, n === 0 ? '--' : String(br.length));
          setVal(sectionRefs.bridges.articulationCount, n === 0 ? '--' : String(ap.length));
          // Lists of bridge labels (e.g., "a-b") and articulation labels.
          const bl = sectionRefs.bridges.bridgeList;
          bl.innerHTML = '';
          if (br.length > 0) {
            const labels = br.map(e => {
              const a = nodes.find(x => x.id === e.from);
              const b = nodes.find(x => x.id === e.to);
              return (a ? a.label : e.from) + '–' + (b ? b.label : e.to);
            });
            for (const lbl of labels) {
              const badge = document.createElement('span');
              badge.className = 'gb-degree-badge';
              badge.style.background = 'rgba(196, 80, 110, 0.12)';
              badge.style.color = '#a04060';
              badge.style.borderColor = 'rgba(196, 80, 110, 0.3)';
              badge.textContent = lbl;
              bl.appendChild(badge);
            }
          }
          const al = sectionRefs.bridges.articulationList;
          al.innerHTML = '';
          if (ap.length > 0) {
            for (const node of ap) {
              const badge = document.createElement('span');
              badge.className = 'gb-degree-badge';
              badge.style.background = 'rgba(196, 80, 110, 0.12)';
              badge.style.color = '#a04060';
              badge.style.borderColor = 'rgba(196, 80, 110, 0.3)';
              badge.textContent = node.label;
              al.appendChild(badge);
            }
          }
        }
      }

      // Degrees list.
      if (sectionRefs.degrees) {
        const list = sectionRefs.degrees.list;
        list.innerHTML = '';
        if (n === 0) {
          list.innerHTML = '<span class="gb-prop-tooltip" style="margin: 0;">No vertices yet</span>';
        } else {
          const sorted = nodes.slice().sort((a, b) =>
            a.label.localeCompare(b.label, undefined, { numeric: true }));
          for (const node of sorted) {
            const badge = document.createElement('span');
            badge.className = 'gb-degree-badge';
            badge.textContent = node.label + ': ' + (degrees[node.id] || 0);
            list.appendChild(badge);
          }
        }
      }

      if (showColoring) render();
    }

    // ── Initial render ─────────────────────────────────────────────────
    if (showColoring) recomputeColoring();
    updateProperties();
    render();
  }

  // ── Bootstrap ───────────────────────────────────────────────────────────
  function bootAll() {
    document.querySelectorAll('.gb-widget').forEach((root) => {
      if (root.dataset.gbMounted === '1') return;
      root.dataset.gbMounted = '1';
      mountWidget(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAll);
  } else {
    bootAll();
  }
}());
