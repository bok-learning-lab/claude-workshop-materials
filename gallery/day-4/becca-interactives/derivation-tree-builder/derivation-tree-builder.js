(function () {
  'use strict';

  // =========================================================================
  // DERIVATION TREE BUILDER (W25) — embeddable widget
  //
  // Each <div class="dt-widget" data-problem='{...}'></div> is mounted as
  // an independent instance. Multiple instances coexist; no document-wide
  // IDs.
  //
  // Three preset grammars: BP (balanced parentheses), AE (arithmetic
  // expressions), WFF (well-formed propositional formulas). Each has its
  // own parse() function returning either a derivation-tree object
  // {rule, text, children: [...]} or null on failure.
  // =========================================================================

  const SVG_NS = 'http://www.w3.org/2000/svg';

  let widgetSeq = 0;

  function isObject(x) { return x && typeof x === 'object'; }

  function svgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    if (attrs) for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  // ── BP grammar ───────────────────────────────────────────────────────────
  // Base: ε. C1: (x). C2: xy.
  // Disambiguation: prefer C1 only when the outermost paren-pair wraps the
  // whole string. Otherwise use C2, splitting at the first depth-zero
  // boundary (so "(())()" parses as C2[(()), ()]).
  function parseBP(s) {
    if (s === '') return { rule: 'B', text: 'ε', children: [] };
    if (!/^[()]+$/.test(s)) return null;
    // Validate balance + check for early depth-zero return.
    let depth = 0;
    let firstZero = -1;
    for (let i = 0; i < s.length; i++) {
      if (s[i] === '(') depth++; else depth--;
      if (depth < 0) return null;
      if (depth === 0 && firstZero === -1 && i < s.length - 1) firstZero = i;
    }
    if (depth !== 0) return null;
    // If the first depth-zero closes before the end, split there (C2).
    if (firstZero !== -1) {
      const left = parseBP(s.substring(0, firstZero + 1));
      const right = parseBP(s.substring(firstZero + 1));
      if (left && right) return { rule: 'C2', text: s, children: [left, right] };
      return null;
    }
    // Otherwise the entire string is wrapped: C1 of the inside.
    if (s[0] !== '(' || s[s.length - 1] !== ')') return null;
    const inner = parseBP(s.substring(1, s.length - 1));
    if (!inner) return null;
    return { rule: 'C1', text: s, children: [inner] };
  }

  // ── AE grammar ───────────────────────────────────────────────────────────
  // Base: '1'. C1: -e (unary minus). C2: (a+b). C3: (a*b). C4: (e) (parens).
  // Disambiguation for "(...)": find the top-level binary op (+ or *) at
  // depth 1 inside the parens; if found, that's C2/C3. If no such op,
  // treat as C4 (parens-wrap of inner expression).
  function parseAE(s) {
    if (s === '1') return { rule: 'B', text: '1', children: [] };
    if (s.length >= 2 && s[0] === '-') {
      const inner = parseAE(s.substring(1));
      if (inner) return { rule: 'C1', text: s, children: [inner] };
      return null;
    }
    if (s.length >= 3 && s[0] === '(' && s[s.length - 1] === ')') {
      // Verify balance and find top-level operator.
      let depth = 0;
      let opIdx = -1, opChar = null;
      let outerMatchesEnd = true;
      for (let i = 0; i < s.length; i++) {
        if (s[i] === '(') depth++;
        else if (s[i] === ')') depth--;
        else if (depth === 1 && opIdx === -1 && (s[i] === '+' || s[i] === '*')) {
          opIdx = i; opChar = s[i];
        }
        if (depth < 0) return null;
        if (depth === 0 && i < s.length - 1) outerMatchesEnd = false;
      }
      if (depth !== 0 || !outerMatchesEnd) return null;
      if (opIdx !== -1) {
        const left = parseAE(s.substring(1, opIdx));
        const right = parseAE(s.substring(opIdx + 1, s.length - 1));
        if (left && right) {
          const rule = opChar === '+' ? 'C2' : 'C3';
          return { rule: rule, text: s, children: [left, right] };
        }
        return null;
      }
      // No top-level binary op — parens-wrap (C4).
      const inner = parseAE(s.substring(1, s.length - 1));
      if (inner) return { rule: 'C4', text: s, children: [inner] };
      return null;
    }
    return null;
  }

  // ── WFF grammar ──────────────────────────────────────────────────────────
  // Base: a single lowercase letter (variable). C1: !F. C2: (F&G). C3: (F|G).
  function parseWFF(s) {
    if (s.length === 1 && /^[a-z]$/.test(s)) {
      return { rule: 'B', text: s, children: [] };
    }
    if (s.length >= 2 && s[0] === '!') {
      const inner = parseWFF(s.substring(1));
      if (inner) return { rule: 'C1', text: s, children: [inner] };
      return null;
    }
    if (s.length >= 5 && s[0] === '(' && s[s.length - 1] === ')') {
      let depth = 0;
      let opIdx = -1, opChar = null;
      let outerMatchesEnd = true;
      for (let i = 0; i < s.length; i++) {
        if (s[i] === '(') depth++;
        else if (s[i] === ')') depth--;
        else if (depth === 1 && opIdx === -1 && (s[i] === '&' || s[i] === '|')) {
          opIdx = i; opChar = s[i];
        }
        if (depth < 0) return null;
        if (depth === 0 && i < s.length - 1) outerMatchesEnd = false;
      }
      if (depth !== 0 || !outerMatchesEnd || opIdx === -1) return null;
      const left = parseWFF(s.substring(1, opIdx));
      const right = parseWFF(s.substring(opIdx + 1, s.length - 1));
      if (left && right) {
        const rule = opChar === '&' ? 'C2' : 'C3';
        return { rule: rule, text: s, children: [left, right] };
      }
      return null;
    }
    return null;
  }

  // ── Grammar definitions (rules + examples) ───────────────────────────────
  const GRAMMARS = {
    'bp': {
      label: 'Balanced Parentheses (BP)',
      parse: parseBP,
      rules: [
        { key: 'B',  desc: 'ε ∈ BP (the empty string is balanced)' },
        { key: 'C1', desc: 'if x ∈ BP, then (x) ∈ BP' },
        { key: 'C2', desc: 'if x, y ∈ BP, then xy ∈ BP (concatenation)' }
      ],
      examplesGood: ['', '()', '(())', '()()', '(())()'],
      examplesBad: ['(()', ')(', '(())(']
    },
    'ae': {
      label: 'Arithmetic Expressions (A)',
      parse: parseAE,
      rules: [
        { key: 'B',  desc: '1 ∈ A' },
        { key: 'C1', desc: 'if e ∈ A, then -e ∈ A (unary minus)' },
        { key: 'C2', desc: 'if a, b ∈ A, then (a+b) ∈ A' },
        { key: 'C3', desc: 'if a, b ∈ A, then (a*b) ∈ A' },
        { key: 'C4', desc: 'if e ∈ A, then (e) ∈ A (parens-wrap)' }
      ],
      examplesGood: ['1', '(1+1)', '-1', '(-(1)+(1*1))', '(1*(1+-1))'],
      examplesBad: ['1+1', '2', '(1+)', '(*1+1)']
    },
    'wff': {
      label: 'Well-Formed Formulas (WFF)',
      parse: parseWFF,
      rules: [
        { key: 'B',  desc: 'each propositional variable a, b, …, z ∈ WFF' },
        { key: 'C1', desc: 'if F ∈ WFF, then !F ∈ WFF' },
        { key: 'C2', desc: 'if F, G ∈ WFF, then (F&G) ∈ WFF' },
        { key: 'C3', desc: 'if F, G ∈ WFF, then (F|G) ∈ WFF' }
      ],
      examplesGood: ['p', '!p', '(p&q)', '!(p|q)', '((p&q)|!r)'],
      examplesBad: ['pq', '(p&)', '!&p', '(p)']
    }
  };

  // Display labels for rules in the tree (e.g., for AE we show "C2 (+)" so
  // the operator is obvious in the tree).
  function ruleLabel(grammarKey, rule) {
    if (grammarKey === 'ae') {
      switch (rule) {
        case 'C1': return 'C1 (–)';
        case 'C2': return 'C2 (+)';
        case 'C3': return 'C3 (×)';
        case 'C4': return 'C4 ()';
        default: return rule;
      }
    }
    if (grammarKey === 'wff') {
      switch (rule) {
        case 'C1': return 'C1 (!)';
        case 'C2': return 'C2 (&)';
        case 'C3': return 'C3 (|)';
        default: return rule;
      }
    }
    if (grammarKey === 'bp') {
      switch (rule) {
        case 'C1': return 'C1';
        case 'C2': return 'C2';
        default: return rule;
      }
    }
    return rule;
  }

  // ── Tree layout ──────────────────────────────────────────────────────────
  // Top-down: leaves at fixed horizontal spacing; each internal node
  // centered above its children. Returns the leaf count of the subtree.
  function layoutTree(node, leafCounter, depth, leafSpacing, levelSpacing, originX, originY) {
    if (!node.children || node.children.length === 0) {
      node.x = originX + leafCounter.value * leafSpacing;
      node.y = originY + depth * levelSpacing;
      leafCounter.value += 1;
      return 1;
    }
    let leaves = 0;
    for (const c of node.children) {
      leaves += layoutTree(c, leafCounter, depth + 1, leafSpacing, levelSpacing, originX, originY);
    }
    const first = node.children[0];
    const last = node.children[node.children.length - 1];
    node.x = (first.x + last.x) / 2;
    node.y = originY + depth * levelSpacing;
    return leaves;
  }

  function maxDepth(node) {
    if (!node.children || node.children.length === 0) return 1;
    let m = 0;
    for (const c of node.children) m = Math.max(m, maxDepth(c));
    return m + 1;
  }
  function leafCount(node) {
    if (!node.children || node.children.length === 0) return 1;
    let n = 0;
    for (const c of node.children) n += leafCount(c);
    return n;
  }

  // Render the tree into the given SVG. Returns the SVG dimensions used.
  function renderTree(svg, root, grammarKey) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    // Compute label widths to size node rects.
    const NODE_HEIGHT = 38;
    const NODE_PADDING = 10;
    const LEVEL_SPACING = 80;
    const MIN_LEAF_SPACING = 70;
    const MARGIN = 24;

    // We need to know the rendered text widths to size each node's rect.
    // Use a hidden temporary <text> to measure (or just estimate by char count).
    // Simpler: estimate width as max(rule label, string label) * ~7 px + padding.
    function nodeRectWidth(node) {
      const ruleText = ruleLabel(grammarKey, node.rule);
      const strText = node.text === '' ? 'ε' : node.text;
      const charW = 7.2; // empirical mono char width at 11px
      const ruleW = ruleText.length * charW;
      const strW = strText.length * charW;
      return Math.max(ruleW, strW) + 2 * NODE_PADDING;
    }

    // Annotate each node with its rect width.
    function annotateWidths(node) {
      node._rectW = nodeRectWidth(node);
      if (node.children) for (const c of node.children) annotateWidths(c);
    }
    annotateWidths(root);

    // Compute leaf spacing — must be at least max leaf width + small gap.
    let maxLeafW = 0;
    function findMaxLeafW(node) {
      if (!node.children || node.children.length === 0) {
        if (node._rectW > maxLeafW) maxLeafW = node._rectW;
      } else {
        for (const c of node.children) findMaxLeafW(c);
      }
    }
    findMaxLeafW(root);
    const leafSpacing = Math.max(MIN_LEAF_SPACING, maxLeafW + 18);

    // Layout pass: assign x/y to each node.
    const leafCounter = { value: 0 };
    layoutTree(root, leafCounter, 0, leafSpacing, LEVEL_SPACING, MARGIN + leafSpacing / 2, MARGIN);

    // Compute SVG dimensions.
    const totalLeaves = leafCount(root);
    const totalDepth = maxDepth(root);
    const totalW = MARGIN * 2 + totalLeaves * leafSpacing;
    const totalH = MARGIN * 2 + (totalDepth - 1) * LEVEL_SPACING + NODE_HEIGHT;
    svg.setAttribute('viewBox', '0 0 ' + totalW + ' ' + totalH);
    svg.setAttribute('width', totalW);
    svg.setAttribute('height', totalH);

    // Draw edges first so nodes overlay.
    function drawEdges(node) {
      if (!node.children) return;
      for (const c of node.children) {
        const line = svgEl('line', {
          class: 'dt-tree-edge',
          x1: node.x, y1: node.y + NODE_HEIGHT / 2,
          x2: c.x,    y2: c.y - NODE_HEIGHT / 2
        });
        svg.appendChild(line);
        drawEdges(c);
      }
    }
    drawEdges(root);

    // Draw nodes (rect + rule label + string label).
    function drawNode(node) {
      const isBase = node.rule === 'B';
      const w = node._rectW;
      const x = node.x - w / 2;
      const y = node.y - NODE_HEIGHT / 2;
      const rect = svgEl('rect', {
        class: 'dt-node-rect' + (isBase ? ' dt-node-base' : ''),
        x: x, y: y, width: w, height: NODE_HEIGHT, rx: 4
      });
      svg.appendChild(rect);

      const ruleT = svgEl('text', {
        class: 'dt-node-rule' + (isBase ? ' dt-node-base-text' : ''),
        x: node.x, y: node.y - 8
      });
      ruleT.textContent = ruleLabel(grammarKey, node.rule);
      svg.appendChild(ruleT);

      const strT = svgEl('text', {
        class: 'dt-node-string',
        x: node.x, y: node.y + 8
      });
      strT.textContent = node.text === '' ? 'ε' : node.text;
      svg.appendChild(strT);

      if (node.children) for (const c of node.children) drawNode(c);
    }
    drawNode(root);
  }

  // ── Mount ────────────────────────────────────────────────────────────────
  function mountWidget(root) {
    let problem = {};
    try {
      problem = JSON.parse(root.dataset.problem || '{}');
    } catch (e) {
      console.error('derivation-tree-builder: invalid data-problem JSON', e);
      problem = {};
    }
    const titleText = (typeof problem.title === 'string' && problem.title.length)
      ? problem.title : 'Derivation Tree Builder';
    let initialGrammarKey = (typeof problem.defaultGrammar === 'string' && GRAMMARS[problem.defaultGrammar])
      ? problem.defaultGrammar : 'bp';

    widgetSeq++;
    const instanceId = 'dt-' + widgetSeq;

    // ── Build DOM scaffold ─────────────────────────────────────────────────
    root.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'dt-header';
    {
      const h = document.createElement('h2');
      h.appendChild(document.createTextNode(titleText + ' '));
      const sub = document.createElement('span');
      sub.className = 'dt-subtitle';
      sub.textContent = 'enter a candidate string and watch its derivation tree';
      h.appendChild(sub);
      header.appendChild(h);
    }
    const grammarSelect = document.createElement('select');
    grammarSelect.className = 'dt-grammar-select';
    for (const key of Object.keys(GRAMMARS)) {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = GRAMMARS[key].label;
      if (key === initialGrammarKey) opt.selected = true;
      grammarSelect.appendChild(opt);
    }
    header.appendChild(grammarSelect);
    root.appendChild(header);

    const body = document.createElement('div');
    body.className = 'dt-body';

    // Grammar reference card.
    const grammarCard = document.createElement('div');
    grammarCard.className = 'dt-grammar-card';
    body.appendChild(grammarCard);

    // Input row.
    const inputRow = document.createElement('div');
    inputRow.className = 'dt-input-row';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'dt-input';
    input.placeholder = 'Type a candidate string';
    input.spellcheck = false;
    input.autocapitalize = 'none';
    input.autocomplete = 'off';
    inputRow.appendChild(input);
    const parseBtn = document.createElement('button');
    parseBtn.type = 'button';
    parseBtn.className = 'dt-btn dt-btn-primary';
    parseBtn.textContent = 'Parse';
    inputRow.appendChild(parseBtn);
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'dt-btn';
    clearBtn.textContent = 'Clear';
    inputRow.appendChild(clearBtn);
    body.appendChild(inputRow);

    // Examples row.
    const examplesRow = document.createElement('div');
    examplesRow.className = 'dt-examples-row';
    body.appendChild(examplesRow);

    // Status (success/failure message).
    const statusEl = document.createElement('div');
    statusEl.className = 'dt-status';
    body.appendChild(statusEl);

    // Tree host.
    const treeHost = document.createElement('div');
    treeHost.className = 'dt-tree-host';
    body.appendChild(treeHost);

    root.appendChild(body);

    // ── State ──────────────────────────────────────────────────────────────
    let currentGrammarKey = initialGrammarKey;

    function buildGrammarCard() {
      const g = GRAMMARS[currentGrammarKey];
      grammarCard.innerHTML = '';
      const h = document.createElement('h3');
      h.textContent = g.label + ' — recursive definition';
      grammarCard.appendChild(h);
      for (const r of g.rules) {
        const row = document.createElement('div');
        row.className = 'dt-rule-row';
        const k = document.createElement('span');
        k.className = 'dt-rule-key';
        k.textContent = r.key;
        const d = document.createElement('span');
        d.className = 'dt-rule-desc';
        d.textContent = r.desc;
        row.appendChild(k);
        row.appendChild(d);
        grammarCard.appendChild(row);
      }
    }

    function buildExamples() {
      examplesRow.innerHTML = '';
      const g = GRAMMARS[currentGrammarKey];
      const lbl = document.createElement('span');
      lbl.className = 'dt-examples-label';
      lbl.textContent = 'Try:';
      examplesRow.appendChild(lbl);
      for (const ex of g.examplesGood) {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'dt-example-chip';
        chip.textContent = ex === '' ? 'ε' : ex;
        chip.addEventListener('click', () => {
          input.value = ex;
          runParse();
        });
        examplesRow.appendChild(chip);
      }
      // Bad-example chips intentionally omitted — the activity body asks
      // students to discover parse failures by experimenting on their own.
      // The widget still gives a clear failure message when a string fails
      // to parse; students just have to come up with the strings themselves.
    }

    function clearTree() {
      treeHost.innerHTML = '';
      const empty = document.createElement('div');
      empty.className = 'dt-tree-empty';
      empty.textContent = '(no tree yet — type a string and press Parse)';
      treeHost.appendChild(empty);
    }

    function setStatus(text, kind) {
      statusEl.classList.remove('dt-status-ok', 'dt-status-bad');
      if (kind === 'ok') statusEl.classList.add('dt-status-ok');
      else if (kind === 'bad') statusEl.classList.add('dt-status-bad');
      statusEl.textContent = text;
    }

    function setInputClass(kind) {
      input.classList.remove('dt-input-ok', 'dt-input-error');
      if (kind === 'ok') input.classList.add('dt-input-ok');
      else if (kind === 'bad') input.classList.add('dt-input-error');
    }

    // Generate a short, grammar-aware reason for parse failure.
    function diagnose(s, grammarKey) {
      if (grammarKey === 'bp') {
        if (!/^[()]*$/.test(s)) return 'Only “(” and “)” are allowed in BP strings.';
        let depth = 0;
        for (let i = 0; i < s.length; i++) {
          if (s[i] === '(') depth++; else depth--;
          if (depth < 0) return 'Unmatched “)” at position ' + (i + 1) + '.';
        }
        if (depth > 0) return 'Unmatched “(” — ' + depth + ' more “)” needed.';
        return 'String can\'t be derived from these rules.';
      }
      if (grammarKey === 'ae') {
        if (!/^[1+\-*()]*$/.test(s)) return 'Only “1”, “+”, “-”, “*”, “(”, “)” are allowed.';
        let depth = 0;
        for (let i = 0; i < s.length; i++) {
          if (s[i] === '(') depth++;
          else if (s[i] === ')') depth--;
          if (depth < 0) return 'Unmatched “)” at position ' + (i + 1) + '.';
        }
        if (depth > 0) return 'Unmatched “(” — ' + depth + ' more “)” needed.';
        if (!s.includes('(') && s !== '1' && !s.startsWith('-')) {
          return 'Binary operators in AE must be wrapped in parens, e.g. (1+1) not 1+1.';
        }
        return 'String can\'t be derived from these rules.';
      }
      if (grammarKey === 'wff') {
        if (!/^[a-z!&|()]*$/.test(s)) return 'Only lowercase letters, “!”, “&”, “|”, “(”, “)” are allowed.';
        let depth = 0;
        for (let i = 0; i < s.length; i++) {
          if (s[i] === '(') depth++;
          else if (s[i] === ')') depth--;
          if (depth < 0) return 'Unmatched “)” at position ' + (i + 1) + '.';
        }
        if (depth > 0) return 'Unmatched “(” — ' + depth + ' more “)” needed.';
        return 'String can\'t be derived from these rules.';
      }
      return 'Parse failed.';
    }

    function runParse() {
      const g = GRAMMARS[currentGrammarKey];
      const s = input.value;
      const tree = g.parse(s);
      if (tree) {
        setStatus('✓ Valid ' + g.label + '. Derivation tree below.', 'ok');
        setInputClass('ok');
        // Render the tree.
        treeHost.innerHTML = '';
        const svg = svgEl('svg', { class: 'dt-tree-svg' });
        treeHost.appendChild(svg);
        renderTree(svg, tree, currentGrammarKey);
      } else {
        const reason = diagnose(s, currentGrammarKey);
        setStatus('✗ Not a valid ' + g.label + ' string. ' + reason, 'bad');
        setInputClass('bad');
        clearTree();
      }
    }

    function loadGrammar(key) {
      currentGrammarKey = key;
      buildGrammarCard();
      buildExamples();
      input.value = '';
      setInputClass(null);
      setStatus('Pick an example or type a string, then press Parse.', null);
      clearTree();
    }

    // ── Wire controls ─────────────────────────────────────────────────────
    grammarSelect.addEventListener('change', () => {
      loadGrammar(grammarSelect.value);
    });
    parseBtn.addEventListener('click', runParse);
    clearBtn.addEventListener('click', () => {
      input.value = '';
      setInputClass(null);
      setStatus('Pick an example or type a string, then press Parse.', null);
      clearTree();
      input.focus();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        runParse();
      }
    });

    // Initial load.
    loadGrammar(initialGrammarKey);
  }

  function bootAll() {
    document.querySelectorAll('.dt-widget').forEach((root) => {
      if (root.dataset.dtMounted === '1') return;
      root.dataset.dtMounted = '1';
      mountWidget(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAll);
  } else {
    bootAll();
  }
}());
