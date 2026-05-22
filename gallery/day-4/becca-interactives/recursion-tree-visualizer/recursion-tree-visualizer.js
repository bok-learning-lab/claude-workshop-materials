(function () {
  'use strict';

  // =========================================================================
  // RECURSION TREE VISUALIZER (W27) — embeddable widget
  //
  // Builds the recursion tree for one of two recurrence forms:
  //   D&C:  T(n) = a · T(n/b) + f(n)
  //   n−1:  T(n) = a · T(n−1) + f(n)
  //
  // For each depth d, displays:
  //   count_d × work_d = total_d
  // with the per-depth running totals and a grand total at the bottom.
  // Step controls highlight one depth at a time.
  // =========================================================================

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const RUN_INTERVAL_MS = 800;

  let widgetSeq = 0;

  // f(n) presets. `eval(n)` returns the integer cost; `display` is the
  // symbolic label used in the recurrence display.
  const F_PRESETS = {
    'one':  { label: '1',  display: '1',  eval: () => 1 },
    'n':    { label: 'n',  display: 'n',  eval: (n) => n },
    'n2':   { label: 'n²', display: 'n²', eval: (n) => n * n }
  };

  function isObject(x) { return x && typeof x === 'object'; }
  function svgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    if (attrs) for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  // Compute the largest power of `b` that is ≤ `n`. Returns at least b
  // (or 1 if n < b).
  function largestPowerOfBleq(n, b) {
    let p = 1;
    while (p * b <= n) p *= b;
    return p;
  }

  // ── Build recursion tree ────────────────────────────────────────────────
  // Returns a tree of nodes { size, depth, work, isBase, children } where
  // `work` is the cost of the non-recursive work at THIS node (or T(1) at
  // base). Total work of the tree is the sum of `work` across all nodes.
  function buildTree(form, a, b, fKey, t1, n) {
    const f = F_PRESETS[fKey].eval;
    function makeNode(size, depth) {
      // Base case: size === 1 (or, for D&C, size <= 1).
      if (form === 'dnc') {
        if (size <= 1) {
          return { size: 1, depth, work: t1, isBase: true, children: [] };
        }
        const children = [];
        const childSize = size / b;
        for (let i = 0; i < a; i++) {
          children.push(makeNode(childSize, depth + 1));
        }
        return { size, depth, work: f(size), isBase: false, children };
      } else {
        // n−1 form.
        if (size <= 1) {
          return { size: 1, depth, work: t1, isBase: true, children: [] };
        }
        const children = [];
        for (let i = 0; i < a; i++) {
          children.push(makeNode(size - 1, depth + 1));
        }
        return { size, depth, work: f(size), isBase: false, children };
      }
    }
    return makeNode(n, 0);
  }

  // Per-depth aggregates. Returns array of { depth, count, perNodeWork,
  // sizeAt, isBase, total }.
  function computeDepthSummaries(root) {
    const layers = [];
    const queue = [root];
    while (queue.length) {
      const node = queue.shift();
      if (!layers[node.depth]) {
        layers[node.depth] = {
          depth: node.depth,
          count: 0,
          perNodeWork: node.work,
          sizeAt: node.size,
          isBase: node.isBase,
          total: 0
        };
      }
      layers[node.depth].count += 1;
      layers[node.depth].total += node.work;
      for (const c of node.children) queue.push(c);
    }
    return layers;
  }

  function maxDepth(node) {
    if (!node.children || node.children.length === 0) return node.depth;
    let m = node.depth;
    for (const c of node.children) m = Math.max(m, maxDepth(c));
    return m;
  }
  function leafCount(node) {
    if (!node.children || node.children.length === 0) return 1;
    let s = 0;
    for (const c of node.children) s += leafCount(c);
    return s;
  }

  // ── Tree layout ──────────────────────────────────────────────────────────
  // Top-down: each leaf gets a fixed x-position; internal nodes are
  // centered above their children. Returns the leaf count of the subtree.
  function layoutTree(node, leafCounter, originX, originY, leafSpacing, levelSpacing) {
    if (!node.children || node.children.length === 0) {
      node._x = originX + leafCounter.value * leafSpacing;
      node._y = originY + node.depth * levelSpacing;
      leafCounter.value += 1;
      return 1;
    }
    let leaves = 0;
    for (const c of node.children) {
      leaves += layoutTree(c, leafCounter, originX, originY, leafSpacing, levelSpacing);
    }
    const first = node.children[0];
    const last = node.children[node.children.length - 1];
    node._x = (first._x + last._x) / 2;
    node._y = originY + node.depth * levelSpacing;
    return leaves;
  }

  // ── Mount ────────────────────────────────────────────────────────────────
  function mountWidget(root) {
    let problem = {};
    try {
      problem = JSON.parse(root.dataset.problem || '{}');
    } catch (e) {
      console.error('recursion-tree-visualizer: invalid data-problem JSON', e);
      problem = {};
    }
    const titleText = (typeof problem.title === 'string' && problem.title.length)
      ? problem.title : 'Recursion Tree Visualizer';
    let initialForm = (problem.defaultForm === 'nminus1') ? 'nminus1' : 'dnc';
    let initialMode = (problem.defaultMode === 'practice') ? 'practice' : 'watch';

    widgetSeq++;
    const instanceId = 'rt-' + widgetSeq;
    if (!root.hasAttribute('tabindex')) root.setAttribute('tabindex', '0');

    // ── Build DOM scaffold ─────────────────────────────────────────────────
    root.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'rt-header';
    {
      const h = document.createElement('h2');
      h.appendChild(document.createTextNode(titleText + ' '));
      const sub = document.createElement('span');
      sub.className = 'rt-subtitle';
      sub.textContent = 'see the per-depth work geometric-sum view';
      h.appendChild(sub);
      header.appendChild(h);
    }
    root.appendChild(header);

    // ── Input panel ──────────────────────────────────────────────────────
    const inputPanel = document.createElement('div');
    inputPanel.className = 'rt-input-panel';

    // Row 1: form toggle.
    const formRow = document.createElement('div');
    formRow.className = 'rt-form-row';
    const formLabel = document.createElement('span');
    formLabel.className = 'rt-form-label';
    formLabel.textContent = 'recurrence form:';
    formRow.appendChild(formLabel);
    const formToggle = document.createElement('div');
    formToggle.className = 'rt-form-toggle';
    const dncBtn = document.createElement('button');
    dncBtn.type = 'button';
    dncBtn.textContent = 'Divide & conquer (n/b)';
    const nminus1Btn = document.createElement('button');
    nminus1Btn.type = 'button';
    nminus1Btn.textContent = 'n − 1 form';
    formToggle.appendChild(dncBtn);
    formToggle.appendChild(nminus1Btn);
    formRow.appendChild(formToggle);

    // Row 1b: mode toggle (Watch / Practice).
    const modeLabel = document.createElement('span');
    modeLabel.className = 'rt-form-label';
    modeLabel.textContent = 'mode:';
    modeLabel.style.marginLeft = '14px';
    formRow.appendChild(modeLabel);
    const modeToggle = document.createElement('div');
    modeToggle.className = 'rt-form-toggle';
    const watchBtn = document.createElement('button');
    watchBtn.type = 'button';
    watchBtn.textContent = 'Watch';
    watchBtn.title = 'Auto-build the tree with sizes and work filled in.';
    const practiceBtn = document.createElement('button');
    practiceBtn.type = 'button';
    practiceBtn.textContent = 'Practice';
    practiceBtn.title = 'Build skeleton; you fill in each size and work.';
    modeToggle.appendChild(watchBtn);
    modeToggle.appendChild(practiceBtn);
    formRow.appendChild(modeToggle);

    inputPanel.appendChild(formRow);

    // Row 2: numeric inputs + Build.
    const inputRow = document.createElement('div');
    inputRow.className = 'rt-input-row';
    function makeInputGroup(labelText, idSuffix, type, defaultValue) {
      const grp = document.createElement('div');
      grp.className = 'rt-input-group';
      const lbl = document.createElement('label');
      lbl.htmlFor = instanceId + '-' + idSuffix;
      lbl.innerHTML = labelText;
      const inp = document.createElement('input');
      inp.id = instanceId + '-' + idSuffix;
      inp.type = type;
      inp.value = String(defaultValue);
      grp.appendChild(lbl);
      grp.appendChild(inp);
      return { group: grp, input: inp };
    }
    function makeSelectGroup(labelText, idSuffix, options, defaultValue) {
      const grp = document.createElement('div');
      grp.className = 'rt-input-group';
      const lbl = document.createElement('label');
      lbl.htmlFor = instanceId + '-' + idSuffix;
      lbl.innerHTML = labelText;
      const sel = document.createElement('select');
      sel.id = instanceId + '-' + idSuffix;
      for (const opt of options) {
        const o = document.createElement('option');
        o.value = opt.value;
        o.textContent = opt.label;
        if (opt.value === defaultValue) o.selected = true;
        sel.appendChild(o);
      }
      grp.appendChild(lbl);
      grp.appendChild(sel);
      return { group: grp, select: sel };
    }

    const aGrp = makeInputGroup('a =', 'a', 'number', 2);
    const bGrp = makeInputGroup('b =', 'b', 'number', 2);
    const fGrp = makeSelectGroup('f(n) =', 'f',
      [{ value: 'one', label: '1' }, { value: 'n', label: 'n' }, { value: 'n2', label: 'n²' }],
      'n');
    const t1Grp = makeInputGroup('T(1) =', 't1', 'number', 1);
    const nGrp = makeInputGroup('n =', 'n', 'number', 8);

    aGrp.input.min = '1'; aGrp.input.max = '5'; aGrp.input.step = '1';
    bGrp.input.min = '2'; bGrp.input.max = '5'; bGrp.input.step = '1';
    t1Grp.input.min = '0'; t1Grp.input.step = '1'; t1Grp.input.style.width = '52px';
    nGrp.input.min = '1'; nGrp.input.max = '64'; nGrp.input.step = '1';

    inputRow.appendChild(aGrp.group);
    inputRow.appendChild(bGrp.group);
    inputRow.appendChild(fGrp.group);
    inputRow.appendChild(t1Grp.group);
    inputRow.appendChild(nGrp.group);

    const buildBtn = document.createElement('button');
    buildBtn.type = 'button';
    buildBtn.className = 'rt-build-btn';
    buildBtn.textContent = 'Build tree';
    inputRow.appendChild(buildBtn);
    inputPanel.appendChild(inputRow);

    // Recurrence display + validation message.
    const recurrenceDisplay = document.createElement('div');
    recurrenceDisplay.className = 'rt-recurrence-display';
    inputPanel.appendChild(recurrenceDisplay);
    const validation = document.createElement('div');
    validation.className = 'rt-validation';
    inputPanel.appendChild(validation);

    root.appendChild(inputPanel);

    // ── Main: tree + depth panel ────────────────────────────────────────
    const main = document.createElement('div');
    main.className = 'rt-main';

    const treeHost = document.createElement('div');
    treeHost.className = 'rt-tree-host';
    main.appendChild(treeHost);

    const depthPanel = document.createElement('div');
    depthPanel.className = 'rt-depth-panel';
    const depthHeader = document.createElement('div');
    depthHeader.className = 'rt-depth-header';
    const depthH3 = document.createElement('h3');
    depthH3.textContent = 'Per-depth work';
    depthHeader.appendChild(depthH3);
    const depthSummary = document.createElement('div');
    depthSummary.className = 'rt-depth-summary';
    depthSummary.textContent = 'Build a tree to see the breakdown';
    depthHeader.appendChild(depthSummary);
    depthPanel.appendChild(depthHeader);

    const depthRows = document.createElement('div');
    depthRows.className = 'rt-depth-rows';
    depthPanel.appendChild(depthRows);

    const totals = document.createElement('div');
    totals.className = 'rt-depth-totals';
    totals.innerHTML =
      '<div class="rt-total-row"><span class="rt-total-label">Height</span><span class="rt-total-value rt-total-height">--</span></div>' +
      '<div class="rt-total-row"><span class="rt-total-label">Leaves</span><span class="rt-total-value rt-total-leaves">--</span></div>' +
      '<div class="rt-total-row rt-grand-total"><span class="rt-total-label">Total work T(n)</span><span class="rt-total-value rt-total-grand">--</span></div>';
    depthPanel.appendChild(totals);
    const totalRefs = {
      height: totals.querySelector('.rt-total-height'),
      leaves: totals.querySelector('.rt-total-leaves'),
      grand: totals.querySelector('.rt-total-grand')
    };

    const stepControls = document.createElement('div');
    stepControls.className = 'rt-step-controls';
    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'rt-step-btn';
    prevBtn.textContent = '← Prev depth';
    const runBtn = document.createElement('button');
    runBtn.type = 'button';
    runBtn.className = 'rt-step-btn rt-step-primary';
    runBtn.textContent = 'Run all';
    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'rt-step-btn';
    nextBtn.textContent = 'Next depth →';
    stepControls.appendChild(prevBtn);
    stepControls.appendChild(runBtn);
    stepControls.appendChild(nextBtn);
    depthPanel.appendChild(stepControls);

    // Practice controls (shown only in Practice mode).
    const practiceControls = document.createElement('div');
    practiceControls.className = 'rt-step-controls rt-practice-controls';
    const resetBlanksBtn = document.createElement('button');
    resetBlanksBtn.type = 'button';
    resetBlanksBtn.className = 'rt-step-btn';
    resetBlanksBtn.textContent = 'Reset blanks';
    const revealBtn = document.createElement('button');
    revealBtn.type = 'button';
    revealBtn.className = 'rt-step-btn rt-step-primary';
    revealBtn.textContent = 'Reveal answers';
    practiceControls.appendChild(resetBlanksBtn);
    practiceControls.appendChild(revealBtn);
    depthPanel.appendChild(practiceControls);

    main.appendChild(depthPanel);
    root.appendChild(main);

    // ── State ──────────────────────────────────────────────────────────────
    let form = initialForm;
    let mode = initialMode;     // 'watch' | 'practice'
    let tree = null;
    let layers = null;          // computed depth summaries
    let highlightedDepth = -1;  // -1 = no highlight
    let runIntervalId = null;
    // Practice-mode bookkeeping:
    //   nodesByDepth[d] = array of nodes at depth d
    //   each node carries _sizeInput, _workInput, _sizeCorrect, _workCorrect
    let nodesByDepth = null;
    let revealed = false;       // true after Reveal answers in Practice mode

    function updateFormToggle() {
      dncBtn.classList.toggle('rt-active', form === 'dnc');
      nminus1Btn.classList.toggle('rt-active', form === 'nminus1');
      bGrp.group.style.display = (form === 'dnc') ? '' : 'none';
    }
    function updateModeToggle() {
      watchBtn.classList.toggle('rt-active', mode === 'watch');
      practiceBtn.classList.toggle('rt-active', mode === 'practice');
      stepControls.style.display = (mode === 'watch') ? '' : 'none';
      practiceControls.style.display = (mode === 'practice') ? '' : 'none';
      buildBtn.textContent = (mode === 'watch') ? 'Build tree' : 'Build skeleton';
    }

    function readInputs() {
      const a = Math.floor(Number(aGrp.input.value));
      const b = Math.floor(Number(bGrp.input.value));
      const fKey = fGrp.select.value;
      const t1 = Math.floor(Number(t1Grp.input.value));
      let n = Math.floor(Number(nGrp.input.value));
      return { a, b, fKey, t1, n };
    }

    function clearInputErrors() {
      aGrp.input.classList.remove('rt-input-error');
      bGrp.input.classList.remove('rt-input-error');
      t1Grp.input.classList.remove('rt-input-error');
      nGrp.input.classList.remove('rt-input-error');
    }

    function setValidationMsg(text, kind) {
      validation.textContent = text || '';
      validation.classList.remove('rt-validation-info');
      if (kind === 'info') validation.classList.add('rt-validation-info');
    }

    function updateRecurrenceDisplay() {
      const { a, b, fKey, t1, n } = readInputs();
      const fDisplay = F_PRESETS[fKey] ? F_PRESETS[fKey].display : 'f(n)';
      const aPart = (a === 1) ? 'T(' : a + '·T(';
      let recurrence;
      if (form === 'dnc') {
        const inner = (b === 1) ? 'n' : 'n/' + b;
        recurrence = 'T(n) = ' + aPart + inner + ') + ' + fDisplay;
      } else {
        recurrence = 'T(n) = ' + aPart + 'n − 1) + ' + fDisplay;
      }
      const base = 'T(1) = ' + (Number.isFinite(t1) ? t1 : '?');
      recurrenceDisplay.innerHTML =
        recurrence + '<span class="rt-recurrence-base">[' + base + ']</span>';
    }

    function validate(inputs) {
      const { a, b, fKey, t1, n } = inputs;
      clearInputErrors();
      let warning = null;

      if (!Number.isFinite(a) || a < 1 || a > 5) {
        aGrp.input.classList.add('rt-input-error');
        return { ok: false, msg: 'a must be an integer between 1 and 5.' };
      }
      if (form === 'dnc') {
        if (!Number.isFinite(b) || b < 2 || b > 5) {
          bGrp.input.classList.add('rt-input-error');
          return { ok: false, msg: 'b must be an integer between 2 and 5.' };
        }
      }
      if (!Number.isFinite(t1) || t1 < 0) {
        t1Grp.input.classList.add('rt-input-error');
        return { ok: false, msg: 'T(1) must be a non-negative integer.' };
      }
      if (!Number.isFinite(n) || n < 1) {
        nGrp.input.classList.add('rt-input-error');
        return { ok: false, msg: 'n must be a positive integer.' };
      }

      // Compute effective n + leaf cap.
      let effN = n;
      let depth;
      let leaves;
      if (form === 'dnc') {
        // Snap n to a power of b (largest ≤ n).
        const snapped = largestPowerOfBleq(n, b);
        if (snapped !== n) {
          effN = snapped;
          warning = 'Snapped n = ' + n + ' to n = ' + snapped + ' (nearest power of b = ' + b + ').';
        }
        depth = Math.round(Math.log(effN) / Math.log(b));
        leaves = Math.pow(a, depth);
      } else {
        effN = n;
        depth = effN - 1;
        if (depth < 0) depth = 0;
        leaves = Math.pow(a, depth);
      }
      if (leaves > 128) {
        nGrp.input.classList.add('rt-input-error');
        return { ok: false,
          msg: 'Too many leaves (' + leaves + '). Reduce a or n so that a^depth ≤ 128.' };
      }
      return { ok: true, msg: warning, kind: warning ? 'info' : null,
        a, b, fKey, t1, n: effN };
    }

    // ── Build + render ─────────────────────────────────────────────────────
    function build() {
      stopRun();
      const inputs = readInputs();
      const v = validate(inputs);
      if (!v.ok) {
        setValidationMsg(v.msg, 'error');
        tree = null; layers = null; nodesByDepth = null;
        renderTree(); renderDepthRows();
        updateTotals();
        return;
      }
      setValidationMsg(v.msg || '', v.kind);
      // Reflect snapped n back into the input.
      if (v.n !== inputs.n) nGrp.input.value = String(v.n);
      tree = buildTree(form, v.a, v.b, v.fKey, v.t1, v.n);
      layers = computeDepthSummaries(tree);
      highlightedDepth = -1;
      revealed = false;
      // Index nodes by depth for Practice-mode bookkeeping.
      nodesByDepth = [];
      (function walk(node) {
        if (!nodesByDepth[node.depth]) nodesByDepth[node.depth] = [];
        nodesByDepth[node.depth].push(node);
        node._sizeCorrect = null;
        node._workCorrect = null;
        node._sizeInput = null;
        node._workInput = null;
        if (node.children) for (const c of node.children) walk(c);
      })(tree);
      updateRecurrenceDisplay();
      renderTree();
      renderDepthRows();
      updateTotals();
    }

    function renderTree() {
      treeHost.innerHTML = '';
      if (!tree) {
        const empty = document.createElement('div');
        empty.className = 'rt-tree-empty';
        empty.textContent = (mode === 'practice')
          ? '(set parameters and press Build skeleton)'
          : '(set parameters and press Build tree)';
        treeHost.appendChild(empty);
        return;
      }
      const isPractice = (mode === 'practice') && !revealed;
      const NODE_W = isPractice ? 86 : 64;
      const NODE_H = isPractice ? 50 : 36;
      const LEVEL_SPACING = isPractice ? 90 : 76;
      const MARGIN = 28;
      const totalLeaves = leafCount(tree);
      const totalDepth = maxDepth(tree);
      // Leaf spacing: keep tree readable but don't go overboard.
      const minLeafSpacing = isPractice ? 96 : 70;
      const leafSpacing = Math.max(minLeafSpacing, NODE_W + 8);
      const leafCounter = { value: 0 };
      layoutTree(tree, leafCounter, MARGIN + leafSpacing / 2, MARGIN, leafSpacing, LEVEL_SPACING);
      const totalW = MARGIN * 2 + totalLeaves * leafSpacing;
      const totalH = MARGIN * 2 + totalDepth * LEVEL_SPACING + NODE_H;

      // Wrap SVG in a positioned canvas so we can overlay HTML editors.
      const canvas = document.createElement('div');
      canvas.className = 'rt-tree-canvas';
      canvas.style.position = 'relative';
      canvas.style.width = totalW + 'px';
      canvas.style.height = totalH + 'px';
      canvas.style.margin = '16px auto';

      const svg = svgEl('svg', {
        class: 'rt-tree-svg',
        width: totalW, height: totalH,
        viewBox: '0 0 ' + totalW + ' ' + totalH
      });
      svg.style.display = 'block';
      svg.style.margin = '0';

      // Edges first, then nodes (so nodes overlay edges).
      function drawEdges(node) {
        if (!node.children) return;
        for (const c of node.children) {
          const cls = (highlightedDepth >= 0 && c.depth === highlightedDepth)
            ? 'rt-tree-edge rt-edge-highlight' : 'rt-tree-edge';
          svg.appendChild(svgEl('line', {
            class: cls,
            x1: node._x, y1: node._y + NODE_H / 2,
            x2: c._x, y2: c._y - NODE_H / 2
          }));
          drawEdges(c);
        }
      }
      drawEdges(tree);

      function drawNodes(node) {
        const isHL = (highlightedDepth >= 0 && node.depth === highlightedDepth);
        const cls = 'rt-node-rect' +
          (node.isBase ? ' rt-node-base' : '') +
          (isPractice ? ' rt-node-blank' : '') +
          (isHL ? ' rt-node-highlight' : '');
        const x = node._x - NODE_W / 2;
        const y = node._y - NODE_H / 2;
        svg.appendChild(svgEl('rect', {
          class: cls, x: x, y: y, width: NODE_W, height: NODE_H, rx: 4
        }));
        if (!isPractice) {
          const sizeT = svgEl('text', {
            class: 'rt-node-size',
            x: node._x, y: node._y - 6
          });
          sizeT.textContent = 'T(' + node.size + ')';
          svg.appendChild(sizeT);
          const workT = svgEl('text', {
            class: 'rt-node-work',
            x: node._x, y: node._y + 8
          });
          workT.textContent = node.isBase
            ? 'T(1) = ' + node.work
            : 'work: ' + node.work;
          svg.appendChild(workT);
        }
        if (node.children) for (const c of node.children) drawNodes(c);
      }
      drawNodes(tree);

      canvas.appendChild(svg);

      // In Practice mode, layer HTML edit cells on top of each node rect.
      if (isPractice) {
        function drawEditors(node) {
          const cell = document.createElement('div');
          cell.className = 'rt-edit-cell' + (node.isBase ? ' rt-edit-base' : '');
          cell.style.position = 'absolute';
          cell.style.left = (node._x - NODE_W / 2) + 'px';
          cell.style.top = (node._y - NODE_H / 2) + 'px';
          cell.style.width = NODE_W + 'px';
          cell.style.height = NODE_H + 'px';

          const sizeRow = document.createElement('div');
          sizeRow.className = 'rt-edit-row';
          const sizeLbl = document.createElement('span');
          sizeLbl.className = 'rt-edit-lbl';
          sizeLbl.textContent = 'T(';
          const sizeIn = document.createElement('input');
          sizeIn.type = 'text';
          sizeIn.inputMode = 'numeric';
          sizeIn.className = 'rt-edit-in rt-edit-size';
          sizeIn.maxLength = 4;
          sizeIn.placeholder = '?';
          sizeIn.setAttribute('aria-label', 'subproblem size at this node');
          const sizeClose = document.createElement('span');
          sizeClose.className = 'rt-edit-lbl';
          sizeClose.textContent = ')';
          sizeRow.appendChild(sizeLbl);
          sizeRow.appendChild(sizeIn);
          sizeRow.appendChild(sizeClose);

          const workRow = document.createElement('div');
          workRow.className = 'rt-edit-row';
          const workLbl = document.createElement('span');
          workLbl.className = 'rt-edit-lbl';
          workLbl.textContent = node.isBase ? 'T(1)=' : 'work=';
          const workIn = document.createElement('input');
          workIn.type = 'text';
          workIn.inputMode = 'numeric';
          workIn.className = 'rt-edit-in rt-edit-work';
          workIn.maxLength = 5;
          workIn.placeholder = '?';
          workIn.setAttribute('aria-label', 'work at this node');
          workRow.appendChild(workLbl);
          workRow.appendChild(workIn);

          cell.appendChild(sizeRow);
          cell.appendChild(workRow);
          canvas.appendChild(cell);

          node._sizeInput = sizeIn;
          node._workInput = workIn;

          function validateSize() {
            const s = sizeIn.value.trim();
            if (s === '') {
              node._sizeCorrect = null;
              sizeIn.classList.remove('rt-correct', 'rt-wrong');
            } else {
              const num = Number(s);
              const ok = Number.isFinite(num) && Math.floor(num) === node.size;
              node._sizeCorrect = ok;
              sizeIn.classList.toggle('rt-correct', ok);
              sizeIn.classList.toggle('rt-wrong', !ok);
            }
            refreshDepthPanelPractice();
          }
          function validateWork() {
            const s = workIn.value.trim();
            if (s === '') {
              node._workCorrect = null;
              workIn.classList.remove('rt-correct', 'rt-wrong');
            } else {
              const num = Number(s);
              const ok = Number.isFinite(num) && Math.floor(num) === node.work;
              node._workCorrect = ok;
              workIn.classList.toggle('rt-correct', ok);
              workIn.classList.toggle('rt-wrong', !ok);
            }
            refreshDepthPanelPractice();
          }
          sizeIn.addEventListener('input', validateSize);
          sizeIn.addEventListener('blur', validateSize);
          workIn.addEventListener('input', validateWork);
          workIn.addEventListener('blur', validateWork);
          // Tab/Enter advance: Enter on size focuses work; Enter on work moves to next node's size.
          sizeIn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); workIn.focus(); workIn.select(); }
          });
          workIn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); focusNextNode(node); }
          });

          if (node.children) for (const c of node.children) drawEditors(c);
        }
        drawEditors(tree);
      }

      treeHost.appendChild(canvas);
    }

    // Move focus from current node to the next node (depth-first traversal order).
    function focusNextNode(currentNode) {
      if (!nodesByDepth) return;
      const all = [];
      (function flat(n) {
        all.push(n);
        if (n.children) for (const c of n.children) flat(c);
      })(tree);
      const i = all.indexOf(currentNode);
      const next = (i >= 0 && i < all.length - 1) ? all[i + 1] : null;
      if (next && next._sizeInput) {
        next._sizeInput.focus();
        next._sizeInput.select();
      }
    }

    function renderDepthRows() {
      depthRows.innerHTML = '';
      if (!layers) {
        const empty = document.createElement('div');
        empty.className = 'rt-tree-empty';
        empty.style.padding = '20px 8px';
        empty.style.textAlign = 'left';
        empty.textContent = '—';
        depthRows.appendChild(empty);
        depthSummary.textContent = (mode === 'practice')
          ? 'Build a skeleton, then fill in each node'
          : 'Build a tree to see the breakdown';
        return;
      }
      const isPractice = (mode === 'practice') && !revealed;
      depthSummary.textContent = isPractice
        ? (layers.length + ' depths · fill in sizes and work at each node')
        : (layers.length + ' depths · click rows or Step');
      for (const layer of layers) {
        const row = document.createElement('div');
        row.className = 'rt-depth-row' +
          (layer.isBase ? ' rt-row-base' : '') +
          (!isPractice && layer.depth === highlightedDepth ? ' rt-row-highlight' : '') +
          (isPractice ? ' rt-row-practice' : '');
        const label = document.createElement('span');
        label.className = 'rt-row-label';
        label.textContent = 'd = ' + layer.depth;
        const formula = document.createElement('span');
        formula.className = 'rt-row-formula';
        const total = document.createElement('span');
        total.className = 'rt-row-total';

        if (isPractice) {
          // Show ?·?=? until ALL nodes at this depth are correct.
          const nodes = nodesByDepth[layer.depth] || [];
          const allCorrect = nodes.length > 0 &&
            nodes.every(n => n._sizeCorrect === true && n._workCorrect === true);
          const correctCount = nodes.filter(n => n._sizeCorrect === true && n._workCorrect === true).length;
          if (allCorrect) {
            const workText = layer.isBase
              ? 'T(1)' : (layer.perNodeWork === 1 ? '1' : String(layer.perNodeWork));
            formula.textContent = layer.count + ' × ' + workText;
            total.textContent = String(layer.total);
            row.classList.add('rt-row-complete');
          } else {
            formula.textContent = '? × ?';
            total.textContent = '?';
            const badge = document.createElement('span');
            badge.className = 'rt-row-progress';
            badge.textContent = '(' + correctCount + '/' + nodes.length + ')';
            label.appendChild(document.createTextNode(' '));
            label.appendChild(badge);
          }
        } else {
          const workText = layer.isBase
            ? 'T(1)'
            : (layer.perNodeWork === 1 ? '1' : String(layer.perNodeWork));
          formula.textContent = layer.count + ' × ' + workText;
          total.textContent = String(layer.total);
        }

        row.appendChild(label);
        row.appendChild(formula);
        row.appendChild(total);
        if (!isPractice) {
          row.addEventListener('click', () => {
            stopRun();
            highlightedDepth = (highlightedDepth === layer.depth) ? -1 : layer.depth;
            renderTree();
            renderDepthRows();
          });
        }
        depthRows.appendChild(row);
      }
    }

    // Lightweight refresh after a single cell edit in Practice mode: just
    // re-render the depth-rows + totals. Tree DOM stays put so input focus
    // is preserved.
    function refreshDepthPanelPractice() {
      renderDepthRows();
      updateTotals();
    }

    function updateTotals() {
      if (!layers) {
        totalRefs.height.textContent = '--';
        totalRefs.leaves.textContent = '--';
        totalRefs.grand.textContent = '--';
        return;
      }
      const isPractice = (mode === 'practice') && !revealed;
      const grand = layers.reduce((s, l) => s + l.total, 0);
      const leafLayer = layers[layers.length - 1];
      if (isPractice) {
        // Reveal totals progressively: height is structural (always known
        // once skeleton is built); leaves is also structural; grand total
        // only reveals when every node is correctly filled.
        totalRefs.height.textContent = String(layers.length);
        totalRefs.leaves.textContent = leafLayer ? String(leafLayer.count) : '--';
        const allCorrect = nodesByDepth && nodesByDepth.every(arr =>
          arr.every(n => n._sizeCorrect === true && n._workCorrect === true));
        totalRefs.grand.textContent = allCorrect ? String(grand) : '?';
      } else {
        totalRefs.height.textContent = String(layers.length);
        totalRefs.leaves.textContent = leafLayer ? String(leafLayer.count) : '--';
        totalRefs.grand.textContent = String(grand);
      }
    }

    // ── Step controls ─────────────────────────────────────────────────────
    function stepTo(d) {
      if (!layers) return;
      if (d < 0 || d >= layers.length) return;
      highlightedDepth = d;
      renderTree();
      renderDepthRows();
    }
    function stopRun() {
      if (runIntervalId !== null) {
        clearInterval(runIntervalId);
        runIntervalId = null;
        runBtn.textContent = 'Run all';
      }
    }
    prevBtn.addEventListener('click', () => {
      stopRun();
      if (!layers) return;
      const d = (highlightedDepth < 0) ? layers.length - 1 : Math.max(0, highlightedDepth - 1);
      stepTo(d);
    });
    nextBtn.addEventListener('click', () => {
      stopRun();
      if (!layers) return;
      const d = (highlightedDepth < 0) ? 0 : Math.min(layers.length - 1, highlightedDepth + 1);
      stepTo(d);
    });
    runBtn.addEventListener('click', () => {
      if (runIntervalId !== null) {
        stopRun();
        return;
      }
      if (!layers) return;
      runBtn.textContent = 'Pause';
      highlightedDepth = -1;
      renderTree();
      renderDepthRows();
      let d = 0;
      runIntervalId = setInterval(() => {
        if (d >= layers.length) {
          stopRun();
          return;
        }
        stepTo(d);
        d += 1;
      }, RUN_INTERVAL_MS);
    });

    // ── Wire form toggle + inputs ─────────────────────────────────────────
    dncBtn.addEventListener('click', () => {
      form = 'dnc';
      updateFormToggle();
      updateRecurrenceDisplay();
    });
    nminus1Btn.addEventListener('click', () => {
      form = 'nminus1';
      updateFormToggle();
      updateRecurrenceDisplay();
    });
    function setMode(newMode) {
      if (mode === newMode) return;
      stopRun();
      mode = newMode;
      // Switching modes resets the current build — student state would be
      // out of sync with a watch-mode tree and vice versa.
      tree = null; layers = null; nodesByDepth = null;
      revealed = false;
      highlightedDepth = -1;
      updateModeToggle();
      renderTree();
      renderDepthRows();
      updateTotals();
    }
    watchBtn.addEventListener('click', () => setMode('watch'));
    practiceBtn.addEventListener('click', () => setMode('practice'));
    // Reset blanks: keep tree, clear all student inputs, re-render.
    resetBlanksBtn.addEventListener('click', () => {
      if (!tree || mode !== 'practice') return;
      revealed = false;
      (function clear(node) {
        node._sizeCorrect = null;
        node._workCorrect = null;
        node._sizeInput = null;
        node._workInput = null;
        if (node.children) for (const c of node.children) clear(c);
      })(tree);
      renderTree();
      renderDepthRows();
      updateTotals();
    });
    // Reveal answers: flip into the watch-mode visualization for this build.
    revealBtn.addEventListener('click', () => {
      if (!tree || mode !== 'practice') return;
      revealed = true;
      renderTree();
      renderDepthRows();
      updateTotals();
    });
    [aGrp.input, bGrp.input, fGrp.select, t1Grp.input, nGrp.input].forEach(el => {
      el.addEventListener('input', updateRecurrenceDisplay);
    });
    buildBtn.addEventListener('click', build);
    [aGrp.input, bGrp.input, t1Grp.input, nGrp.input].forEach(el => {
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); build(); }
      });
    });

    // Initial state.
    updateFormToggle();
    updateModeToggle();
    updateRecurrenceDisplay();
    renderDepthRows();
    updateTotals();
    const emptyHint = (mode === 'practice')
      ? '(set parameters and press Build skeleton)'
      : '(set parameters and press Build tree)';
    treeHost.innerHTML = '<div class="rt-tree-empty">' + emptyHint + '</div>';
  }

  function bootAll() {
    document.querySelectorAll('.rt-widget').forEach((root) => {
      if (root.dataset.rtMounted === '1') return;
      root.dataset.rtMounted = '1';
      mountWidget(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAll);
  } else {
    bootAll();
  }
}());
