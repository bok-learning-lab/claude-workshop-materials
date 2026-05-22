(function () {
  // =========================================================================
  // PROBLEM CONFIGURATION
  // Each widget instance reads its problem from the `data-problem` attribute
  // on its container element. The attribute value is JSON-encoded.
  //
  // Embed shape:
  //   <div class="tt-widget" data-problem='{...}'></div>
  //
  // Multiple widgets can coexist on the same page — each <div class="tt-widget">
  // is mounted independently with its own state. The script can be loaded
  // multiple times safely (idempotent self-tests, idempotent per-element mount).
  //
  //   title         (string, optional)
  //                 Displayed as a bold heading above the table.
  //
  //   instructions  (string, optional)
  //                 Displayed as a paragraph below the title.
  //
  //   variables     (string[])
  //                 Propositional variables shown as auto-filled columns on
  //                 the left. Order determines column order and bit-significance
  //                 (first variable = MSB, so a 2-variable table produces rows
  //                 TT, TF, FT, FF top-to-bottom).
  //
  //   firstColumn   { label: string, formula: string } (optional)
  //                 Left-hand side of the equivalence claim.
  //
  //   lastColumn    { label: string, formula: string } (optional)
  //                 Right-hand side of the equivalence claim.
  //
  //   middleColumns (Array<{ label, formula }>, optional)
  //                 Instructor-provided columns between firstColumn and lastColumn.
  //                 Students fill in T/F values; Check grades them.
  //                 NOT included in the equivalence comparison.
  //
  //   The equivalence check runs only when BOTH firstColumn and lastColumn
  //   are provided. For a plain "fill in the truth table" exercise, omit
  //   firstColumn and lastColumn and put your formula(s) in middleColumns.
  //
  //   Formula syntax accepted in any formula field:
  //     NOT     :  !, ~, ¬, NOT
  //     AND     :  &, &&, ∧, AND
  //     OR      :  |, ||, ∨, OR
  //     IMPLIES :  ->, =>, →
  //     IFF     :  <->, <=>, ↔, IFF
  //     XOR     :  ⊕, XOR
  //     NAND    :  ↑, NAND
  //     NOR     :  ↓, NOR
  //     Parens  :  ( )
  //     Vars    :  any identifier [A-Za-z][A-Za-z0-9_]*
  //                (case-insensitive; stored uppercase internally)
  // =========================================================================

  // -------------------------------------------------------------------------
  // Formula evaluator (pure functions — shared across all widget instances)
  // assignment keys must be uppercase, e.g. { P: true, Q: false }
  // -------------------------------------------------------------------------

  function tokenize(formula) {
    const tokens = [];
    let i = 0;
    while (i < formula.length) {
      if (/\s/.test(formula[i])) { i++; continue; }

      const rest = formula.slice(i);

      // multi-char operators — try longest match first
      if (rest.startsWith('<->') || rest.startsWith('<=>')) { tokens.push({ type: 'IFF'     }); i += 3; continue; }
      if (rest.startsWith('->') || rest.startsWith('=>'))  { tokens.push({ type: 'IMPLIES' }); i += 2; continue; }
      if (rest.startsWith('&&'))                           { tokens.push({ type: 'AND'     }); i += 2; continue; }
      if (rest.startsWith('||'))                           { tokens.push({ type: 'OR'      }); i += 2; continue; }

      const unicodeOp = { '¬':'NOT','∧':'AND','∨':'OR','→':'IMPLIES','↔':'IFF','⊕':'XOR','↑':'NAND','↓':'NOR' }[formula[i]];
      if (unicodeOp) { tokens.push({ type: unicodeOp }); i++; continue; }

      const asciiOp = { '!':'NOT','~':'NOT','&':'AND','|':'OR','(':'LPAREN',')':'RPAREN' }[formula[i]];
      if (asciiOp) { tokens.push({ type: asciiOp }); i++; continue; }

      const wordMatch = rest.match(/^[A-Za-z_][A-Za-z0-9_]*/);
      if (wordMatch) {
        const raw = wordMatch[0];
        const up  = raw.toUpperCase();
        const keyword = { NOT:'NOT', AND:'AND', OR:'OR', NAND:'NAND', NOR:'NOR', XOR:'XOR', IFF:'IFF' }[up];
        tokens.push(keyword ? { type: keyword } : { type: 'VAR', name: up });
        i += raw.length;
        continue;
      }

      throw new Error(`Unexpected character: "${formula[i]}" at position ${i}`);
    }
    return tokens;
  }

  function evaluate(formula, assignment) {
    const tokens = tokenize(formula);
    let pos = 0;

    const peek    = ()  => tokens[pos];
    const consume = ()  => tokens[pos++];
    const expect  = (type) => {
      const t = consume();
      if (!t || t.type !== type) throw new Error(`Expected ${type}`);
      return t;
    };

    // Recursive descent — lowest precedence first (NOR → NAND → IFF/XOR → IMPLIES → OR → AND → NOT → atom)

    function parseNor() {
      let v = parseNand();
      while (peek()?.type === 'NOR') {
        consume();
        const r = parseNand();
        v = !(v || r);
      }
      return v;
    }

    function parseNand() {
      let v = parseIffXor();
      while (peek()?.type === 'NAND') {
        consume();
        const r = parseIffXor();
        v = !(v && r);
      }
      return v;
    }

    function parseIffXor() {
      let v = parseImplies();
      while (peek()?.type === 'IFF' || peek()?.type === 'XOR') {
        const op = consume().type;
        const r = parseImplies();
        v = (op === 'IFF') ? (v === r) : (v !== r);
      }
      return v;
    }

    function parseImplies() {
      const v = parseOr();
      if (peek()?.type === 'IMPLIES') {
        consume();
        const r = parseImplies(); // right-associative
        return !v || r;
      }
      return v;
    }

    function parseOr() {
      let v = parseAnd();
      while (peek()?.type === 'OR') {
        consume();
        const r = parseAnd();
        v = v || r;
      }
      return v;
    }

    function parseAnd() {
      let v = parseNot();
      while (peek()?.type === 'AND') {
        consume();
        const r = parseNot();
        v = v && r;
      }
      return v;
    }

    function parseNot() {
      if (peek()?.type === 'NOT') { consume(); return !parseNot(); }
      return parseAtom();
    }

    function parseAtom() {
      const t = peek();
      if (!t) throw new Error('Unexpected end of formula');
      if (t.type === 'VAR') {
        consume();
        if (!(t.name in assignment)) throw new Error(`Unknown variable: ${t.name}`);
        return assignment[t.name];
      }
      if (t.type === 'LPAREN') {
        consume();
        const v = parseNor();
        expect('RPAREN');
        return v;
      }
      throw new Error(`Unexpected token type: ${t.type}`);
    }

    const result = parseNor();
    if (pos < tokens.length) throw new Error(`Unconsumed tokens from position ${pos}`);
    return result;
  }

  // -------------------------------------------------------------------------
  // Self-test (runs once per page load, results visible in browser console)
  // -------------------------------------------------------------------------
  function runSelfTests() {
    const T = true, F = false;
    const tests = [
      ['!P',            {P:T},              F],
      ['!P',            {P:F},              T],
      ['~~P',           {P:T},              T],
      ['P & Q',         {P:T, Q:T},         T],
      ['P & Q',         {P:T, Q:F},         F],
      ['P | Q',         {P:F, Q:F},         F],
      ['P | Q',         {P:F, Q:T},         T],
      ['P -> Q',        {P:T, Q:F},         F],
      ['P -> Q',        {P:F, Q:F},         T],
      ['P -> Q',        {P:T, Q:T},         T],
      ['P <-> Q',       {P:T, Q:T},         T],
      ['P <-> Q',       {P:T, Q:F},         F],
      ['P XOR Q',       {P:T, Q:T},         F],
      ['P XOR Q',       {P:T, Q:F},         T],
      ['P NAND Q',      {P:T, Q:T},         F],
      ['P NAND Q',      {P:T, Q:F},         T],
      ['P NOR Q',       {P:F, Q:F},         T],
      ['P NOR Q',       {P:T, Q:F},         F],
      ['¬P ∨ Q',        {P:T, Q:F},         F],
      ['P → Q',         {P:T, Q:F},         F],
      ['P ↔ Q',         {P:F, Q:F},         T],
      ['(P & Q) | !P',  {P:T, Q:F},         F],
      ['(P & Q) | !P',  {P:F, Q:F},         T],
      ['!P | Q',        {P:T, Q:F},         F],
      ['P -> Q',        {P:T, Q:F},         F],
    ];

    let passed = 0, failed = 0;
    tests.forEach(([formula, assignment, expected]) => {
      let result;
      try { result = evaluate(formula, assignment); }
      catch (e) { result = `ERROR: ${e.message}`; }
      const ok = result === expected;
      if (ok) { passed++; }
      else {
        failed++;
        console.error(`FAIL  evaluate("${formula}", ${JSON.stringify(assignment)}) → ${result}, expected ${expected}`);
      }
    });
    console.log(`Truth-table evaluator self-test: ${passed}/${passed + failed} passed${failed ? ' — see errors above' : ' ✓'}`);
  }

  // -------------------------------------------------------------------------
  // Per-instance widget mount.
  // Each call to mountWidget(container) creates an isolated widget with its
  // own state (formulaCellRefs, studentColCounter) and DOM (scoped to container).
  // -------------------------------------------------------------------------
  function mountWidget(container) {
    if (container.dataset.ttInit === '1') return;
    container.dataset.ttInit = '1';

    let problem;
    try {
      problem = JSON.parse(container.dataset.problem || '{}');
    } catch (e) {
      console.error('truth-table-widget: invalid data-problem JSON on', container, e);
      container.textContent = 'Truth-table widget: invalid configuration. See browser console.';
      return;
    }

    if (!problem.variables || !Array.isArray(problem.variables) || problem.variables.length === 0) {
      console.error('truth-table-widget: data-problem must include a non-empty `variables` array', container);
      container.textContent = 'Truth-table widget: missing variables in configuration.';
      return;
    }

    // Per-instance state — captured by closure, isolated from sibling widgets.
    const formulaCellRefs = [];   // [rowIndex][fi] → <td>
    let studentColCounter = 0;
    let tableEl = null;
    let verdictEl = null;

    function addStudentColumn() {
      if (!tableEl) return;
      const colId = 's' + (++studentColCounter);

      const headerRow = tableEl.tHead.rows[0];
      const lastTh = headerRow.querySelector('th.col-section-end');

      const th = document.createElement('th');
      th.dataset.student = 'true';
      th.dataset.colid = colId;

      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'Label (e.g. ¬P)';
      input.className = 'col-label-input';
      input.addEventListener('click', e => e.stopPropagation());

      const removeBtn = document.createElement('button');
      removeBtn.textContent = '✕';
      removeBtn.className = 'remove-col-btn';
      removeBtn.addEventListener('click', () => removeStudentColumn(colId));

      th.appendChild(input);
      th.appendChild(removeBtn);
      headerRow.insertBefore(th, lastTh);

      Array.from(tableEl.tBodies[0].rows).forEach((tr, rowIndex) => {
        const lastTd = tr.querySelector('td.col-section-end');
        const td = document.createElement('td');
        td.dataset.colid = colId;
        td.dataset.row = rowIndex;
        td.dataset.value = '';
        td.classList.add('formula-cell');
        tr.insertBefore(td, lastTd);
      });
    }

    function removeStudentColumn(colId) {
      container.querySelectorAll(`[data-colid="${colId}"]`).forEach(el => el.remove());
    }

    function checkTable() {
      const { variables, firstColumn, middleColumns = [], lastColumn } = problem;
      const numVars = variables.length;
      const numRows = Math.pow(2, numVars);
      const formulaCols = [firstColumn, ...middleColumns, lastColumn].filter(Boolean);
      const lastFi = formulaCols.length - 1;
      const checkEquivalence = !!(firstColumn && lastColumn);

      let equivalent = true;
      let formulaError = false;

      for (let row = 0; row < numRows; row++) {
        const assignment = {};
        variables.forEach((v, vi) => {
          const bitPos = numVars - 1 - vi;
          assignment[v.toUpperCase()] = !!((row >> bitPos) & 1);
        });

        const correctValues = new Array(formulaCols.length);

        formulaCols.forEach((col, fi) => {
          const td = formulaCellRefs[row]?.[fi];
          if (!td) return;

          let correct;
          try {
            correct = evaluate(col.formula, assignment);
          } catch (e) {
            console.error(`Error evaluating "${col.formula}" for row ${row}:`, e);
            formulaError = true;
            return;
          }

          correctValues[fi] = correct;
          const expected = correct ? 'T' : 'F';
          const verdict = td.dataset.value === expected ? 'cell-correct' : 'cell-incorrect';
          td.classList.remove('cell-correct', 'cell-incorrect');
          td.classList.add(verdict);
        });

        if (checkEquivalence
            && correctValues[0] !== undefined
            && correctValues[lastFi] !== undefined) {
          if (correctValues[0] !== correctValues[lastFi]) {
            equivalent = false;
            const tr = container.querySelector(`tr[data-row="${row}"]`);
            if (tr) tr.classList.add('row-counterexample');
          }
        }
      }

      container.querySelectorAll('td.formula-cell').forEach(td => {
        td.dataset.locked = 'true';
      });

      if (verdictEl && checkEquivalence && !formulaError) {
        verdictEl.className = 'tt-verdict ' + (equivalent ? 'verdict-equivalent' : 'verdict-not-equivalent');
        verdictEl.textContent = equivalent
          ? '✓ Equivalent'
          : '✗ Not equivalent — see highlighted rows';
      }
    }

    function resetTable() {
      container.querySelectorAll('td.formula-cell').forEach(td => {
        td.dataset.value = '';
        td.textContent = '';
        td.classList.remove('cell-correct', 'cell-incorrect');
        delete td.dataset.locked;
      });

      container.querySelectorAll('tr.row-counterexample').forEach(tr => {
        tr.classList.remove('row-counterexample');
      });

      if (verdictEl) {
        verdictEl.className = 'tt-verdict';
        verdictEl.textContent = '';
      }
    }

    function renderTable() {
      const { variables, firstColumn, middleColumns = [], lastColumn } = problem;
      const numVars = variables.length;
      const numRows = Math.pow(2, numVars);

      const formulaCols = [firstColumn, ...middleColumns, lastColumn].filter(Boolean);

      const table = document.createElement('table');

      const thead = table.createTHead();
      const headerRow = thead.insertRow();

      variables.forEach(v => {
        const th = document.createElement('th');
        th.textContent = v;
        headerRow.appendChild(th);
      });

      formulaCols.forEach((col, i) => {
        const th = document.createElement('th');
        th.textContent = col.label;
        const colIndex = numVars + i;
        th.dataset.col = colIndex;
        th.classList.add('col-fixed');
        if (i === 0)                          th.classList.add('col-section-start');
        if (i === formulaCols.length - 1)     th.classList.add('col-section-end');
        headerRow.appendChild(th);
      });

      const tbody = table.createTBody();

      for (let row = 0; row < numRows; row++) {
        const tr = tbody.insertRow();
        tr.dataset.row = row;

        variables.forEach((_, vi) => {
          const td = tr.insertCell();
          const bitPos = numVars - 1 - vi;
          td.textContent = (row >> bitPos) & 1 ? 'T' : 'F';
          td.classList.add('var-cell');
        });

        formulaCols.forEach((_, fi) => {
          const td = tr.insertCell();
          const colIndex = numVars + fi;
          td.dataset.col = colIndex;
          td.dataset.row = row;
          td.dataset.value = '';
          td.classList.add('formula-cell');
          if (fi === 0) td.classList.add('col-section-start');
          if (fi === formulaCols.length - 1) td.classList.add('col-section-end');
          if (!formulaCellRefs[row]) formulaCellRefs[row] = [];
          formulaCellRefs[row][fi] = td;
        });
      }

      table.addEventListener('click', e => {
        const td = e.target.closest('td.formula-cell');
        if (!td || !table.contains(td) || td.dataset.locked) return;
        const cycle = { '': 'T', 'T': 'F', 'F': '' };
        td.dataset.value = cycle[td.dataset.value];
        td.textContent = td.dataset.value;
      });

      container.innerHTML = '';

      const { title, instructions } = problem;
      if (title || instructions) {
        const header = document.createElement('div');
        header.className = 'tt-problem-header';
        if (title) {
          const h2 = document.createElement('h2');
          h2.textContent = title;
          header.appendChild(h2);
        }
        if (instructions) {
          const p = document.createElement('p');
          p.textContent = instructions;
          header.appendChild(p);
        }
        container.appendChild(header);
      }

      verdictEl = document.createElement('div');
      verdictEl.className = 'tt-verdict';
      container.appendChild(verdictEl);

      tableEl = table;
      container.appendChild(table);

      const controls = document.createElement('div');
      controls.className = 'tt-controls';

      const addBtn = document.createElement('button');
      addBtn.className = 'tt-add-col-btn';
      addBtn.textContent = '+ Add column';
      addBtn.addEventListener('click', addStudentColumn);

      const checkBtn = document.createElement('button');
      checkBtn.className = 'tt-check-btn';
      checkBtn.textContent = 'Check';
      checkBtn.addEventListener('click', checkTable);

      const resetBtn = document.createElement('button');
      resetBtn.className = 'tt-reset-btn';
      resetBtn.textContent = 'Reset';
      resetBtn.addEventListener('click', resetTable);

      controls.appendChild(addBtn);

      const sep1 = document.createElement('span');
      sep1.className = 'controls-sep';
      controls.appendChild(sep1);

      const SYMBOLS = [
        { label: '¬',    sym: '¬'    },
        { label: '∧',    sym: '∧'    },
        { label: '∨',    sym: '∨'    },
        { label: '→',    sym: '→'    },
        { label: '↔',    sym: '↔'    },
        { label: '⊕',    sym: '⊕'    },
        { label: 'NAND', sym: 'NAND' },
        { label: 'NOR',  sym: 'NOR'  },
      ];
      SYMBOLS.forEach(({ label, sym }) => {
        const btn = document.createElement('button');
        btn.className = 'sym-btn';
        btn.textContent = label;
        btn.title = `Insert ${label}`;
        btn.addEventListener('mousedown', e => e.preventDefault());
        btn.addEventListener('click', () => {
          // Only act on a focused label input inside *this* widget.
          const input = container.querySelector('.col-label-input:focus');
          if (!input) return;
          const start = input.selectionStart;
          const end   = input.selectionEnd;
          input.value = input.value.slice(0, start) + sym + input.value.slice(end);
          const newPos = start + sym.length;
          input.setSelectionRange(newPos, newPos);
        });
        controls.appendChild(btn);
      });

      const sep2 = document.createElement('span');
      sep2.className = 'controls-sep';
      controls.appendChild(sep2);

      controls.appendChild(checkBtn);
      controls.appendChild(resetBtn);

      container.appendChild(controls);
    }

    renderTable();
  }

  // -------------------------------------------------------------------------
  // Init: run self-tests once per page, mount every .tt-widget on the page.
  // Safe to call multiple times — self-tests gated on a window flag,
  // per-element mount gated on dataset.ttInit.
  // -------------------------------------------------------------------------
  function init() {
    if (!window.__ttSelfTested) {
      window.__ttSelfTested = true;
      runSelfTests();
    }
    document.querySelectorAll('.tt-widget').forEach(mountWidget);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
