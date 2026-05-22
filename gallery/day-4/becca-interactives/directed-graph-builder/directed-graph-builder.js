(function () {
  'use strict';

  // =========================================================================
  // DIRECTED GRAPH BUILDER (W7) — embeddable widget
  //
  // Refactored from the single-file Interactives/directed-graph-builder.html.
  // Each <div class="dgb-widget" data-problem='{...}'></div> on the page is
  // mounted as an independent instance with its own state, canvas, toolbar,
  // and sidebar. Multiple instances coexist without interference; there are
  // no document-wide IDs and no shared globals.
  //
  // Algorithms preserved from the original:
  //   - Tarjan's strongly-connected-components algorithm
  //   - Kahn's topological-sort algorithm
  //   - 3-color DFS directed-cycle detection
  // =========================================================================

  // ── Constants ────────────────────────────────────────────────────────────
  const NODE_RADIUS = 18;
  const NODE_HIT_RADIUS = 22;
  const EDGE_HIT_DISTANCE = 10;
  const ARROWHEAD_SIZE = 10;
  const SCC_COLORS = [
    '#2d5a27', '#c4506e', '#3a7d6e', '#8b6914', '#7b4daa',
    '#c17817', '#2a6496', '#b5452a', '#5a8a3c', '#9c4568'
  ];
  const SCC_COLOR_NAMES = [
    'Botanical Green', 'Herbarium Rose', 'Oxidized Copper', 'Sepia',
    'Pressed Violet', 'Amber', 'Steel Blue', 'Burnt Sienna', 'Sage', 'Dusty Mauve'
  ];

  let widgetSeq = 0;

  function isObject(x) { return x && typeof x === 'object'; }

  // ── Pure graph algorithms (state-free) ───────────────────────────────────

  function getOutAdj(nodes, edges) {
    const adj = {};
    for (const n of nodes) adj[n.id] = [];
    for (const e of edges) adj[e.from].push(e.to);
    return adj;
  }

  function getUndirectedAdj(nodes, edges) {
    const adj = {};
    for (const n of nodes) adj[n.id] = [];
    for (const e of edges) {
      adj[e.from].push(e.to);
      adj[e.to].push(e.from);
    }
    return adj;
  }

  function getDegrees(nodes, edges) {
    const inDeg = {};
    const outDeg = {};
    for (const n of nodes) { inDeg[n.id] = 0; outDeg[n.id] = 0; }
    for (const e of edges) { outDeg[e.from]++; inDeg[e.to]++; }
    return { inDeg, outDeg };
  }

  function bfsUndirected(adj, startId) {
    const visited = new Set([startId]);
    const queue = [startId];
    while (queue.length) {
      const cur = queue.shift();
      for (const nb of (adj[cur] || [])) {
        if (!visited.has(nb)) { visited.add(nb); queue.push(nb); }
      }
    }
    return visited;
  }

  function getWeakComponents(nodes, edges) {
    const adj = getUndirectedAdj(nodes, edges);
    const visited = new Set();
    const comps = [];
    for (const n of nodes) {
      if (visited.has(n.id)) continue;
      const c = bfsUndirected(adj, n.id);
      c.forEach(id => visited.add(id));
      comps.push(c);
    }
    return comps;
  }

  // Tarjan's SCC: returns array of SCCs (each is an array of node ids).
  function tarjanSCC(nodes, edges) {
    const outAdj = getOutAdj(nodes, edges);
    let index = 0;
    const stack = [];
    const onStack = new Set();
    const indices = {};
    const lowlinks = {};
    const sccs = [];

    function strongconnect(v) {
      indices[v] = index;
      lowlinks[v] = index;
      index++;
      stack.push(v);
      onStack.add(v);
      for (const w of (outAdj[v] || [])) {
        if (indices[w] === undefined) {
          strongconnect(w);
          lowlinks[v] = Math.min(lowlinks[v], lowlinks[w]);
        } else if (onStack.has(w)) {
          lowlinks[v] = Math.min(lowlinks[v], indices[w]);
        }
      }
      if (lowlinks[v] === indices[v]) {
        const scc = [];
        let w;
        do { w = stack.pop(); onStack.delete(w); scc.push(w); } while (w !== v);
        sccs.push(scc);
      }
    }

    for (const n of nodes) {
      if (indices[n.id] === undefined) strongconnect(n.id);
    }
    return sccs;
  }

  // 3-color DFS for directed cycle detection.
  function hasDirectedCycle(nodes, edges) {
    if (nodes.length === 0) return false;
    const outAdj = getOutAdj(nodes, edges);
    const WHITE = 0, GRAY = 1, BLACK = 2;
    const color = {};
    for (const n of nodes) color[n.id] = WHITE;

    function dfs(u) {
      color[u] = GRAY;
      for (const v of (outAdj[u] || [])) {
        if (color[v] === GRAY) return true;
        if (color[v] === WHITE && dfs(v)) return true;
      }
      color[u] = BLACK;
      return false;
    }
    for (const n of nodes) {
      if (color[n.id] === WHITE && dfs(n.id)) return true;
    }
    return false;
  }

  // Kahn's algorithm. Returns the topological order (array of node ids), or
  // null if the graph contains a cycle. Sorts ties by label for determinism.
  function topologicalSort(nodes, edges) {
    if (nodes.length === 0) return null;
    const outAdj = getOutAdj(nodes, edges);
    const inDegree = {};
    for (const n of nodes) inDegree[n.id] = 0;
    for (const e of edges) inDegree[e.to]++;

    const queue = [];
    for (const n of nodes) if (inDegree[n.id] === 0) queue.push(n.id);

    const order = [];
    while (queue.length) {
      queue.sort((a, b) => {
        const la = nodes.find(n => n.id === a).label;
        const lb = nodes.find(n => n.id === b).label;
        return la.localeCompare(lb, undefined, { numeric: true });
      });
      const u = queue.shift();
      order.push(u);
      for (const v of (outAdj[u] || [])) {
        inDegree[v]--;
        if (inDegree[v] === 0) queue.push(v);
      }
    }
    if (order.length !== nodes.length) return null;
    return order;
  }

  function pointToSegmentDist(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - ax, py - ay);
    let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  }

  function getCurveOffset(fromNode, toNode) {
    const dx = toNode.x - fromNode.x;
    const dy = toNode.y - fromNode.y;
    const len = Math.hypot(dx, dy) || 1;
    return Math.min(30, len * 0.2);
  }

  function pointToCurveDist(px, py, ax, ay, bx, by, curveOffset) {
    const mx = (ax + bx) / 2;
    const my = (ay + by) / 2;
    const dx = bx - ax, dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const cpx = mx + nx * curveOffset;
    const cpy = my + ny * curveOffset;
    let minDist = Infinity;
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const it = 1 - t;
      const sx = it * it * ax + 2 * it * t * cpx + t * t * bx;
      const sy = it * it * ay + 2 * it * t * cpy + t * t * by;
      const d = Math.hypot(px - sx, py - sy);
      if (d < minDist) minDist = d;
    }
    return minDist;
  }

  // ── Mount a single widget instance ───────────────────────────────────────
  function mountWidget(root) {
    let problem = {};
    try {
      problem = JSON.parse(root.dataset.problem || '{}');
    } catch (e) {
      console.error('directed-graph-builder: invalid data-problem JSON', e);
      problem = {};
    }
    const vizCfg = isObject(problem.viz) ? problem.viz : {};
    const sectionsCfg = isObject(vizCfg.sections) ? vizCfg.sections : {};
    const toolsCfg = isObject(vizCfg.tools) ? vizCfg.tools : {};
    function sectionOn(key) { return sectionsCfg[key] !== false; }
    function toolOn(key) { return toolsCfg[key] !== false; }
    const titleText = (typeof problem.title === 'string' && problem.title.length)
      ? problem.title : 'Directed Graph Builder';

    widgetSeq++;
    const instanceId = 'dgb-' + widgetSeq;

    if (!root.hasAttribute('tabindex')) root.setAttribute('tabindex', '0');

    // ── Build DOM scaffold ─────────────────────────────────────────────────
    root.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'dgb-header';
    {
      const h = document.createElement('h2');
      h.appendChild(document.createTextNode(titleText + ' '));
      const sub = document.createElement('span');
      sub.className = 'dgb-subtitle';
      sub.textContent = 'an interactive field notebook for directed graph theory';
      h.appendChild(sub);
      header.appendChild(h);
    }

    const tools = document.createElement('div');
    tools.className = 'dgb-header-tools';

    function makeToolBtn(extraClass, label, keyHint, title) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'dgb-tool-btn ' + extraClass;
      if (title) b.title = title;
      b.appendChild(document.createTextNode(label + ' '));
      if (keyHint) {
        const k = document.createElement('span');
        k.className = 'dgb-key-hint';
        k.textContent = keyHint;
        b.appendChild(k);
      }
      return b;
    }
    function makeDivider() {
      const d = document.createElement('div');
      d.className = 'dgb-tool-divider';
      return d;
    }

    const btnNode = makeToolBtn('dgb-active dgb-btn-node', '+ Vertex', 'V',
      'Add Vertex mode — click canvas to place vertices');
    const btnEdge = makeToolBtn('dgb-btn-edge', '+ Edge', 'E',
      'Add Directed Edge mode — click source then target vertex');
    tools.appendChild(btnNode);
    tools.appendChild(btnEdge);
    tools.appendChild(makeDivider());

    let btnLabel = null, btnSCCColor = null;
    if (toolOn('label')) {
      btnLabel = makeToolBtn('dgb-btn-label', 'Label', 'L',
        'Label mode — click a vertex to rename it');
      tools.appendChild(btnLabel);
    }
    const btnDelete = makeToolBtn('dgb-btn-delete', 'Delete', 'D',
      'Delete mode — click a vertex or edge to remove it');
    tools.appendChild(btnDelete);

    if (toolOn('sccColor')) {
      tools.appendChild(makeDivider());
      btnSCCColor = makeToolBtn('dgb-btn-scc-color', 'SCC Color', 'S',
        'Toggle SCC coloring visualization');
      tools.appendChild(btnSCCColor);
    }

    tools.appendChild(makeDivider());
    const btnReset = makeToolBtn('dgb-danger dgb-btn-reset', 'Reset', '',
      'Clear entire graph');
    tools.appendChild(btnReset);

    header.appendChild(tools);
    root.appendChild(header);

    const main = document.createElement('div');
    main.className = 'dgb-main';

    const canvasContainer = document.createElement('div');
    canvasContainer.className = 'dgb-canvas-container';
    const canvas = document.createElement('canvas');
    canvas.className = 'dgb-canvas';
    canvasContainer.appendChild(canvas);
    const modeIndicator = document.createElement('div');
    modeIndicator.className = 'dgb-mode-indicator';
    modeIndicator.textContent = 'Add Vertex';
    canvasContainer.appendChild(modeIndicator);
    const canvasHint = document.createElement('div');
    canvasHint.className = 'dgb-canvas-hint';
    canvasHint.textContent = 'Click anywhere on the canvas to place your first vertex';
    canvasContainer.appendChild(canvasHint);
    main.appendChild(canvasContainer);

    const sidebar = document.createElement('div');
    sidebar.className = 'dgb-sidebar';
    const sidebarHeader = document.createElement('div');
    sidebarHeader.className = 'dgb-sidebar-header';
    {
      const h = document.createElement('h3');
      h.textContent = 'Field Observations';
      sidebarHeader.appendChild(h);
      const cnt = document.createElement('div');
      cnt.className = 'dgb-specimen-count';
      cnt.textContent = 'No specimens collected';
      sidebarHeader.appendChild(cnt);
    }
    sidebar.appendChild(sidebarHeader);

    const sectionRefs = {};

    function makeSection(key, titleText, markerColor, rowsHtml) {
      const sec = document.createElement('div');
      sec.className = 'dgb-prop-section';
      sec.dataset.section = key;
      const title = document.createElement('div');
      title.className = 'dgb-prop-section-title';
      const marker = document.createElement('span');
      marker.className = 'dgb-section-marker';
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
      const sec = makeSection('summary', 'Summary', null,
        '<div class="dgb-prop-row"><span class="dgb-prop-label">Vertices</span><span class="dgb-prop-value dgb-info dgb-prop-vertices">0</span></div>' +
        '<div class="dgb-prop-row"><span class="dgb-prop-label">Directed Edges</span><span class="dgb-prop-value dgb-info dgb-prop-edges">0</span></div>'
      );
      sidebar.appendChild(sec);
      sectionRefs.summary = {
        vertices: sec.querySelector('.dgb-prop-vertices'),
        edges: sec.querySelector('.dgb-prop-edges')
      };
    }

    if (sectionOn('strong')) {
      const sec = makeSection('strong', 'Strong Connectivity', 'var(--dgb-copper)',
        '<div class="dgb-prop-row"><span class="dgb-prop-label">Strongly Connected</span><span class="dgb-prop-value dgb-prop-strongly">--</span></div>' +
        '<div class="dgb-prop-tooltip">Every vertex reachable from every other via directed paths</div>' +
        '<div class="dgb-prop-row"><span class="dgb-prop-label">SCCs</span><span class="dgb-prop-value dgb-info dgb-prop-scc-count">--</span></div>' +
        '<div class="dgb-scc-list"></div>'
      );
      sidebar.appendChild(sec);
      sectionRefs.strong = {
        strongly: sec.querySelector('.dgb-prop-strongly'),
        sccCount: sec.querySelector('.dgb-prop-scc-count'),
        sccList: sec.querySelector('.dgb-scc-list')
      };
    }

    if (sectionOn('weak')) {
      const sec = makeSection('weak', 'Weak Connectivity', 'var(--dgb-green)',
        '<div class="dgb-prop-row"><span class="dgb-prop-label">Weakly Connected</span><span class="dgb-prop-value dgb-prop-weakly">--</span></div>' +
        '<div class="dgb-prop-row"><span class="dgb-prop-label">Weak Components</span><span class="dgb-prop-value dgb-info dgb-prop-weak-comps">--</span></div>' +
        '<div class="dgb-prop-tooltip">Connectivity ignoring edge direction</div>'
      );
      sidebar.appendChild(sec);
      sectionRefs.weak = {
        weakly: sec.querySelector('.dgb-prop-weakly'),
        weakComps: sec.querySelector('.dgb-prop-weak-comps')
      };
    }

    if (sectionOn('dag')) {
      const sec = makeSection('dag', 'Cycles & DAG', 'var(--dgb-rose)',
        '<div class="dgb-prop-row"><span class="dgb-prop-label">Contains Directed Cycles</span><span class="dgb-prop-value dgb-prop-cycles">--</span></div>' +
        '<div class="dgb-prop-row"><span class="dgb-prop-label">Is a DAG</span><span class="dgb-prop-value dgb-prop-dag">--</span></div>' +
        '<div class="dgb-prop-tooltip">DAG = directed acyclic graph; admits topological order</div>'
      );
      sidebar.appendChild(sec);
      sectionRefs.dag = {
        cycles: sec.querySelector('.dgb-prop-cycles'),
        dag: sec.querySelector('.dgb-prop-dag')
      };
    }

    if (sectionOn('topo')) {
      const sec = makeSection('topo', 'Topological Order', 'var(--dgb-sepia)',
        '<div class="dgb-topo-order"></div>'
      );
      sidebar.appendChild(sec);
      sectionRefs.topo = { topo: sec.querySelector('.dgb-topo-order') };
    }

    if (sectionOn('sourcesSinks')) {
      const sec = makeSection('sourcesSinks', 'Sources & Sinks', 'var(--dgb-copper)',
        '<div class="dgb-prop-row"><span class="dgb-prop-label">Sources (in-degree 0)</span><span class="dgb-prop-value dgb-info dgb-prop-source-count">--</span></div>' +
        '<div class="dgb-vertex-tag-list dgb-source-list"></div>' +
        '<div class="dgb-prop-row" style="margin-top: 6px;"><span class="dgb-prop-label">Sinks (out-degree 0)</span><span class="dgb-prop-value dgb-info dgb-prop-sink-count">--</span></div>' +
        '<div class="dgb-vertex-tag-list dgb-sink-list"></div>'
      );
      sidebar.appendChild(sec);
      sectionRefs.sourcesSinks = {
        sourceCount: sec.querySelector('.dgb-prop-source-count'),
        sourceList: sec.querySelector('.dgb-source-list'),
        sinkCount: sec.querySelector('.dgb-prop-sink-count'),
        sinkList: sec.querySelector('.dgb-sink-list')
      };
    }

    if (sectionOn('degrees')) {
      const sec = makeSection('degrees', 'Vertex Degrees', 'var(--dgb-sepia)',
        '<div class="dgb-degree-list"></div>'
      );
      sidebar.appendChild(sec);
      sectionRefs.degrees = { list: sec.querySelector('.dgb-degree-list') };
    }

    // SCC color legend (only shown when coloring is on).
    const sccLegendSection = makeSection('sccLegend', 'SCC Coloring Legend', 'var(--dgb-violet)',
      '<div class="dgb-color-legend"></div>'
    );
    sccLegendSection.style.display = 'none';
    sidebar.appendChild(sccLegendSection);
    sectionRefs.sccLegend = {
      section: sccLegendSection,
      legend: sccLegendSection.querySelector('.dgb-color-legend')
    };

    main.appendChild(sidebar);
    root.appendChild(main);

    // ── State (per-instance) ──────────────────────────────────────────────
    let nodes = [];
    let edges = [];
    let nextNodeId = 1;
    let nextEdgeId = 1;
    let mode = 'node';
    let edgeStart = null;
    let showSCCColoring = false;
    let sccAssignment = {};
    let sccList = [];
    let draggingNode = null;
    let dragOffset = { x: 0, y: 0 };
    let hoveredNode = null;
    let hoveredEdge = null;
    let mousePos = { x: 0, y: 0 };
    let didDrag = false;

    const ctx = canvas.getContext('2d');

    if (isObject(vizCfg.initialGraph)) {
      const ig = vizCfg.initialGraph;
      if (Array.isArray(ig.vertices)) {
        for (const v of ig.vertices) {
          if (typeof v.x !== 'number' || typeof v.y !== 'number') continue;
          const id = (typeof v.id === 'number') ? v.id : nextNodeId;
          nodes.push({ id: id, x: v.x, y: v.y, label: typeof v.label === 'string' ? v.label : ('v' + id) });
          if (id >= nextNodeId) nextNodeId = id + 1;
        }
      }
      if (Array.isArray(ig.edges)) {
        for (const e of ig.edges) {
          if (typeof e.from !== 'number' || typeof e.to !== 'number') continue;
          if (!nodes.find(n => n.id === e.from) || !nodes.find(n => n.id === e.to)) continue;
          const exists = edges.some(x => x.from === e.from && x.to === e.to);
          if (exists) continue;
          edges.push({ id: nextEdgeId++, from: e.from, to: e.to });
        }
      }
    }

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

    // ── Mode switching ──────────────────────────────────────────────────
    function setMode(newMode) {
      mode = newMode;
      edgeStart = null;
      [btnNode, btnEdge, btnDelete, btnLabel].forEach(b => { if (b) b.classList.remove('dgb-active'); });
      modeIndicator.className = 'dgb-mode-indicator';
      switch (mode) {
        case 'node':
          btnNode.classList.add('dgb-active');
          modeIndicator.textContent = 'Add Vertex';
          break;
        case 'edge':
          btnEdge.classList.add('dgb-active');
          modeIndicator.textContent = 'Add Directed Edge';
          modeIndicator.classList.add('dgb-edge-mode');
          break;
        case 'delete':
          btnDelete.classList.add('dgb-active');
          modeIndicator.textContent = 'Delete';
          modeIndicator.classList.add('dgb-delete-mode');
          break;
        case 'label':
          if (btnLabel) btnLabel.classList.add('dgb-active');
          modeIndicator.textContent = 'Label Vertex';
          modeIndicator.classList.add('dgb-label-mode');
          break;
      }
      render();
    }

    btnNode.addEventListener('click', () => setMode('node'));
    btnEdge.addEventListener('click', () => setMode('edge'));
    btnDelete.addEventListener('click', () => setMode('delete'));
    if (btnLabel) btnLabel.addEventListener('click', () => setMode('label'));
    if (btnSCCColor) {
      btnSCCColor.addEventListener('click', () => {
        showSCCColoring = !showSCCColoring;
        btnSCCColor.classList.toggle('dgb-active', showSCCColoring);
        if (showSCCColoring) recomputeSCCs();
        render();
        updateProperties();
      });
    }
    btnReset.addEventListener('click', () => {
      if (nodes.length === 0 && edges.length === 0) return;
      nodes = []; edges = [];
      nextNodeId = 1; nextEdgeId = 1;
      edgeStart = null;
      sccAssignment = {}; sccList = [];
      draggingNode = null;
      hoveredNode = null;
      hoveredEdge = null;
      render();
      updateProperties();
    });

    root.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      let handled = true;
      switch (e.key.toLowerCase()) {
        case 'v': setMode('node'); break;
        case 'e': setMode('edge'); break;
        case 'd': setMode('delete'); break;
        case 'l': if (btnLabel) setMode('label'); break;
        case 's':
          if (btnSCCColor) {
            showSCCColoring = !showSCCColoring;
            btnSCCColor.classList.toggle('dgb-active', showSCCColoring);
            if (showSCCColoring) recomputeSCCs();
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
        const hasReverse = edges.some(oe => oe.from === e.to && oe.to === e.from);
        const d = hasReverse
          ? pointToCurveDist(x, y, a.x, a.y, b.x, b.y, getCurveOffset(a, b))
          : pointToSegmentDist(x, y, a.x, a.y, b.x, b.y);
        if (d <= EDGE_HIT_DISTANCE) return e;
      }
      return null;
    }

    function getCanvasPos(e) {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    canvas.addEventListener('mousedown', (e) => {
      root.focus({ preventScroll: true });
      const pos = getCanvasPos(e);
      const node = getNodeAt(pos.x, pos.y);
      didDrag = false;
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
            edgeStart = node.id; render();
          } else if (edgeStart !== node.id) {
            const exists = edges.some(x => x.from === edgeStart && x.to === node.id);
            if (!exists) {
              edges.push({ id: nextEdgeId++, from: edgeStart, to: node.id });
              if (showSCCColoring) recomputeSCCs();
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
        if (showSCCColoring) recomputeSCCs();
        render();
      }
    });

    canvas.addEventListener('mousemove', (e) => {
      const pos = getCanvasPos(e);
      mousePos = pos;
      if (draggingNode) {
        draggingNode.x = pos.x - dragOffset.x;
        draggingNode.y = pos.y - dragOffset.y;
        didDrag = true;
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
      if (didDrag) return;
      const pos = getCanvasPos(e);
      if (getNodeAt(pos.x, pos.y)) return;
      const label = 'v' + nextNodeId;
      nodes.push({ id: nextNodeId++, x: pos.x, y: pos.y, label });
      if (showSCCColoring) recomputeSCCs();
      render();
      updateProperties();
    });

    canvas.addEventListener('mouseleave', () => {
      hoveredNode = null;
      hoveredEdge = null;
      render();
    });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    function deleteNode(id) {
      nodes = nodes.filter(n => n.id !== id);
      edges = edges.filter(e => e.from !== id && e.to !== id);
      if (edgeStart === id) edgeStart = null;
      hoveredNode = null;
      if (showSCCColoring) recomputeSCCs();
      render(); updateProperties();
    }
    function deleteEdge(id) {
      edges = edges.filter(e => e.id !== id);
      hoveredEdge = null;
      if (showSCCColoring) recomputeSCCs();
      render(); updateProperties();
    }

    function showLabelInput(node) {
      const existing = root.querySelector('.dgb-node-label-input');
      if (existing) existing.remove();
      const input = document.createElement('input');
      input.className = 'dgb-node-label-input';
      input.type = 'text';
      input.value = node.label;
      input.maxLength = 8;
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

    function recomputeSCCs() {
      sccList = tarjanSCC(nodes, edges);
      sccAssignment = {};
      sccList.forEach((scc, idx) => {
        scc.forEach(id => { sccAssignment[id] = idx; });
      });
    }

    // ── Rendering ──────────────────────────────────────────────────────
    function drawArrowhead(toX, toY, angle, size) {
      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(
        toX - size * Math.cos(angle - Math.PI / 7),
        toY - size * Math.sin(angle - Math.PI / 7)
      );
      ctx.lineTo(
        toX - size * Math.cos(angle + Math.PI / 7),
        toY - size * Math.sin(angle + Math.PI / 7)
      );
      ctx.closePath();
      ctx.fill();
    }

    function render() {
      const rect = canvasContainer.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      for (const edge of edges) {
        const from = nodes.find(n => n.id === edge.from);
        const to = nodes.find(n => n.id === edge.to);
        if (!from || !to) continue;
        const isHovered = hoveredEdge && hoveredEdge.id === edge.id;
        const isDelMode = mode === 'delete';
        const hasReverse = edges.some(e => e.from === edge.to && e.to === edge.from);
        let strokeColor, lineWidth;
        if (isHovered && isDelMode) { strokeColor = '#c4506e'; lineWidth = 3; }
        else if (isHovered) { strokeColor = 'rgba(26, 22, 18, 0.5)'; lineWidth = 2.5; }
        else { strokeColor = 'rgba(26, 22, 18, 0.35)'; lineWidth = 1.8; }
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.fillStyle = strokeColor;

        if (hasReverse) {
          const dx = to.x - from.x, dy = to.y - from.y;
          const len = Math.hypot(dx, dy) || 1;
          const offset = getCurveOffset(from, to);
          const nx = -dy / len, ny = dx / len;
          const mx = (from.x + to.x) / 2, my = (from.y + to.y) / 2;
          const cpx = mx + nx * offset, cpy = my + ny * offset;
          const tangentX = 2 * (to.x - cpx);
          const tangentY = 2 * (to.y - cpy);
          const tangentLen = Math.hypot(tangentX, tangentY) || 1;
          const arrowEndX = to.x - (tangentX / tangentLen) * NODE_RADIUS;
          const arrowEndY = to.y - (tangentY / tangentLen) * NODE_RADIUS;
          if (isHovered && isDelMode) ctx.setLineDash([6, 4]);
          else ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.quadraticCurveTo(cpx, cpy, arrowEndX, arrowEndY);
          ctx.stroke();
          ctx.setLineDash([]);
          drawArrowhead(arrowEndX, arrowEndY, Math.atan2(tangentY, tangentX), ARROWHEAD_SIZE);
        } else {
          const dx = to.x - from.x, dy = to.y - from.y;
          const len = Math.hypot(dx, dy) || 1;
          const arrowEndX = to.x - (dx / len) * NODE_RADIUS;
          const arrowEndY = to.y - (dy / len) * NODE_RADIUS;
          if (isHovered && isDelMode) ctx.setLineDash([6, 4]);
          else ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(arrowEndX, arrowEndY);
          ctx.stroke();
          ctx.setLineDash([]);
          drawArrowhead(arrowEndX, arrowEndY, Math.atan2(dy, dx), ARROWHEAD_SIZE);
        }
      }

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
          const dx = mousePos.x - startNode.x, dy = mousePos.y - startNode.y;
          if (Math.hypot(dx, dy) > 10) {
            ctx.fillStyle = 'rgba(58, 125, 110, 0.5)';
            drawArrowhead(mousePos.x, mousePos.y, Math.atan2(dy, dx), 8);
          }
        }
      }

      const degrees = getDegrees(nodes, edges);
      for (const node of nodes) {
        const isHovered = hoveredNode && hoveredNode.id === node.id;
        const isEdgeStart = edgeStart === node.id;
        const isDelMode = mode === 'delete';
        const sccIdx = showSCCColoring ? sccAssignment[node.id] : undefined;

        const crossSize = NODE_RADIUS + 6;
        ctx.beginPath();
        ctx.strokeStyle = isHovered ? 'rgba(26, 22, 18, 0.25)' : 'rgba(26, 22, 18, 0.1)';
        ctx.lineWidth = 0.5;
        ctx.moveTo(node.x - crossSize, node.y); ctx.lineTo(node.x - crossSize + 5, node.y);
        ctx.moveTo(node.x + crossSize, node.y); ctx.lineTo(node.x + crossSize - 5, node.y);
        ctx.moveTo(node.x, node.y - crossSize); ctx.lineTo(node.x, node.y - crossSize + 5);
        ctx.moveTo(node.x, node.y + crossSize); ctx.lineTo(node.x, node.y + crossSize - 5);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(node.x, node.y, NODE_RADIUS, 0, Math.PI * 2);
        if (showSCCColoring && sccIdx !== undefined) {
          ctx.fillStyle = SCC_COLORS[sccIdx % SCC_COLORS.length];
        } else if (isHovered && isDelMode) {
          ctx.fillStyle = '#c4506e';
        } else if (isEdgeStart) {
          ctx.fillStyle = '#3a7d6e';
        } else {
          ctx.fillStyle = '#2d5a27';
        }
        ctx.fill();
        ctx.strokeStyle = isHovered ? 'rgba(26, 22, 18, 0.6)' : 'rgba(26, 22, 18, 0.3)';
        ctx.lineWidth = isHovered ? 2 : 1.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(node.x, node.y, NODE_RADIUS - 3, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.fillStyle = '#f4ede4';
        ctx.font = '500 12px "Fira Code", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.label, node.x, node.y + 0.5);
        const inD = degrees.inDeg[node.id] || 0;
        const outD = degrees.outDeg[node.id] || 0;
        ctx.fillStyle = 'rgba(26, 22, 18, 0.4)';
        ctx.font = '400 10px "Fira Code", monospace';
        ctx.fillText('in:' + inD + ' out:' + outD, node.x, node.y + NODE_RADIUS + 14);
      }

      canvasHint.classList.toggle('dgb-hidden', nodes.length > 0);
    }

    // ── Properties panel update ────────────────────────────────────────
    function setVal(el, text, cls) {
      if (!el) return;
      el.textContent = text;
      el.classList.remove('dgb-yes', 'dgb-no');
      if (cls === 'yes') el.classList.add('dgb-yes');
      if (cls === 'no')  el.classList.add('dgb-no');
    }

    function updateProperties() {
      const n = nodes.length;
      const m = edges.length;
      const degrees = getDegrees(nodes, edges);
      const sccs = tarjanSCC(nodes, edges);
      const weakComps = getWeakComponents(nodes, edges);
      const hasCycle = hasDirectedCycle(nodes, edges);
      const isDAG = n > 0 && !hasCycle;
      const topoOrder = isDAG ? topologicalSort(nodes, edges) : null;
      const stronglyConnected = n > 0 && sccs.length === 1;
      const weaklyConnected = n > 0 && weakComps.length === 1;

      // Cache SCC assignment for rendering.
      sccList = sccs;
      sccAssignment = {};
      sccs.forEach((scc, idx) => scc.forEach(id => { sccAssignment[id] = idx; }));

      if (sectionRefs.summary) {
        setVal(sectionRefs.summary.vertices, String(n));
        setVal(sectionRefs.summary.edges, String(m));
      }

      const cntEl = sidebarHeader.querySelector('.dgb-specimen-count');
      if (n === 0) cntEl.textContent = 'No specimens collected';
      else cntEl.textContent = n + ' ' + (n === 1 ? 'vertex' : 'vertices') + ', ' +
        m + ' directed ' + (m === 1 ? 'edge' : 'edges') + ' observed';

      if (sectionRefs.strong) {
        if (n === 0) setVal(sectionRefs.strong.strongly, '--');
        else setVal(sectionRefs.strong.strongly, stronglyConnected ? 'Yes' : 'No', stronglyConnected ? 'yes' : 'no');
        setVal(sectionRefs.strong.sccCount, n === 0 ? '--' : String(sccs.length));
        const sl = sectionRefs.strong.sccList;
        sl.innerHTML = '';
        if (n === 0) {
          sl.innerHTML = '<span class="dgb-prop-tooltip" style="margin: 0;">No vertices yet</span>';
        } else {
          sccs.forEach((scc, idx) => {
            const item = document.createElement('div');
            item.className = 'dgb-scc-item';
            const color = SCC_COLORS[idx % SCC_COLORS.length];
            const labels = scc
              .map(id => nodes.find(nd => nd.id === id))
              .filter(Boolean)
              .map(nd => nd.label)
              .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
              .join(', ');
            item.innerHTML = '<span class="dgb-scc-swatch" style="background:' + color + '"></span>{ ' + labels + ' }';
            sl.appendChild(item);
          });
        }
      }

      if (sectionRefs.weak) {
        if (n === 0) setVal(sectionRefs.weak.weakly, '--');
        else setVal(sectionRefs.weak.weakly, weaklyConnected ? 'Yes' : 'No', weaklyConnected ? 'yes' : 'no');
        setVal(sectionRefs.weak.weakComps, n === 0 ? '--' : String(weakComps.length));
      }

      if (sectionRefs.dag) {
        if (n === 0) {
          setVal(sectionRefs.dag.cycles, '--');
          setVal(sectionRefs.dag.dag, '--');
        } else {
          setVal(sectionRefs.dag.cycles, hasCycle ? 'Yes' : 'No', hasCycle ? 'no' : 'yes');
          setVal(sectionRefs.dag.dag, isDAG ? 'Yes' : 'No', isDAG ? 'yes' : 'no');
        }
      }

      if (sectionRefs.topo) {
        const t = sectionRefs.topo.topo;
        t.innerHTML = '';
        if (n === 0) {
          t.innerHTML = '<span class="dgb-prop-tooltip" style="margin: 0;">No vertices yet</span>';
        } else if (!isDAG) {
          t.innerHTML = '<span class="dgb-prop-tooltip" style="margin: 0;">N/A (contains cycles)</span>';
        } else if (topoOrder) {
          const labels = topoOrder.map(id => {
            const nd = nodes.find(nn => nn.id === id);
            return nd ? nd.label : '?';
          });
          t.innerHTML = labels.join('<span class="dgb-arrow"> &rarr; </span>');
        }
      }

      if (sectionRefs.sourcesSinks) {
        const sources = nodes.filter(nd => degrees.inDeg[nd.id] === 0);
        const sinks   = nodes.filter(nd => degrees.outDeg[nd.id] === 0);
        sectionRefs.sourcesSinks.sourceCount.textContent = n === 0 ? '--' : String(sources.length);
        sectionRefs.sourcesSinks.sinkCount.textContent = n === 0 ? '--' : String(sinks.length);
        const sl = sectionRefs.sourcesSinks.sourceList;
        sl.innerHTML = '';
        if (n > 0) {
          sources.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }))
            .forEach(nd => {
              const tag = document.createElement('span');
              tag.className = 'dgb-vertex-tag dgb-source-tag';
              tag.textContent = nd.label;
              sl.appendChild(tag);
            });
          if (sources.length === 0) sl.innerHTML = '<span class="dgb-prop-tooltip" style="margin: 0;">None</span>';
        }
        const skl = sectionRefs.sourcesSinks.sinkList;
        skl.innerHTML = '';
        if (n > 0) {
          sinks.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }))
            .forEach(nd => {
              const tag = document.createElement('span');
              tag.className = 'dgb-vertex-tag dgb-sink-tag';
              tag.textContent = nd.label;
              skl.appendChild(tag);
            });
          if (sinks.length === 0) skl.innerHTML = '<span class="dgb-prop-tooltip" style="margin: 0;">None</span>';
        }
      }

      if (sectionRefs.degrees) {
        const list = sectionRefs.degrees.list;
        list.innerHTML = '';
        if (n === 0) {
          list.innerHTML = '<span class="dgb-prop-tooltip" style="margin: 0;">No vertices yet</span>';
        } else {
          const sorted = nodes.slice().sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
          for (const node of sorted) {
            const inD = degrees.inDeg[node.id] || 0;
            const outD = degrees.outDeg[node.id] || 0;
            const isSource = inD === 0 && edges.length > 0;
            const isSink = outD === 0 && edges.length > 0;
            const badge = document.createElement('span');
            badge.className = 'dgb-degree-badge' + (isSource ? ' dgb-source' : '') + (isSink ? ' dgb-sink' : '');
            badge.textContent = node.label + ': in=' + inD + ' out=' + outD;
            list.appendChild(badge);
          }
        }
      }

      // SCC legend.
      const leg = sectionRefs.sccLegend;
      if (showSCCColoring && n > 0 && sccs.length > 0) {
        leg.section.style.display = '';
        leg.legend.innerHTML = '';
        sccs.forEach((scc, idx) => {
          const swatch = document.createElement('div');
          swatch.className = 'dgb-color-swatch';
          const color = SCC_COLORS[idx % SCC_COLORS.length];
          const name = SCC_COLOR_NAMES[idx % SCC_COLOR_NAMES.length];
          swatch.innerHTML = '<span class="dgb-swatch" style="background:' + color + '"></span>SCC ' + (idx + 1) + ': ' + name;
          leg.legend.appendChild(swatch);
        });
      } else {
        leg.section.style.display = 'none';
        leg.legend.innerHTML = '';
      }

      if (showSCCColoring) render();
    }

    if (showSCCColoring) recomputeSCCs();
    updateProperties();
    render();
  }

  // ── Bootstrap ───────────────────────────────────────────────────────────
  function bootAll() {
    document.querySelectorAll('.dgb-widget').forEach((root) => {
      if (root.dataset.dgbMounted === '1') return;
      root.dataset.dgbMounted = '1';
      mountWidget(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAll);
  } else {
    bootAll();
  }
}());
