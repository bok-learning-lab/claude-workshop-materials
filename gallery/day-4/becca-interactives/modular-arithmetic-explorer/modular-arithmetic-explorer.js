(function () {
  'use strict';

  // =========================================================================
  // MODULAR ARITHMETIC EXPLORER — embeddable widget
  //
  // Each <div class="mae-widget" data-problem='{...}'></div> on the page is
  // mounted as an independent instance. State and DOM refs are kept in a
  // closure per mount, so multiple widgets can coexist without interference.
  // No document-wide IDs are used.
  // =========================================================================

  const MIN_N = 2;
  const MAX_N = 20;

  // ── Pure helpers (shared across instances) ─────────────────────────────
  function gcd(a, b) {
    a = Math.abs(a | 0);
    b = Math.abs(b | 0);
    while (b !== 0) { const t = b; b = a % b; a = t; }
    return a;
  }

  function isPrime(n) {
    n = n | 0;
    if (n < 2) return false;
    if (n < 4) return true;
    if (n % 2 === 0) return false;
    for (let i = 3; i * i <= n; i += 2) {
      if (n % i === 0) return false;
    }
    return true;
  }

  // Steps of the Euclidean algorithm computing gcd(a, n).
  // Returns array of {a, b, q, r} with a = q*b + r, until r === 0.
  function gcdSteps(a, n) {
    const steps = [];
    let x = Math.abs(a | 0), y = Math.abs(n | 0);
    // We always present gcd(a, n) so we want the bigger value first when
    // a < n; the Euclidean algorithm naturally swaps on the first step.
    if (x < y) { const t = x; x = y; y = t; }
    let safety = 50;
    while (y !== 0 && safety-- > 0) {
      const q = Math.floor(x / y);
      const r = x - q * y;
      steps.push({ a: x, b: y, q, r });
      x = y;
      y = r;
    }
    return { steps, gcd: x };
  }

  // Classify each row of the multiplication table for ℤ_n.
  // Returns array of length n; entry i is one of:
  //   'invertible' — row contains 1 in some non-zero column
  //   'zerodiv'    — row contains 0 in a non-zero column AND is not [0]
  //   'trivial'    — i === 0 (the [0] row)
  function classifyMultRows(n) {
    const out = new Array(n);
    for (let a = 0; a < n; a++) {
      if (a === 0) { out[a] = 'trivial'; continue; }
      let hasOne = false, hasZeroNonTriv = false;
      for (let b = 0; b < n; b++) {
        const v = (a * b) % n;
        if (b !== 0 && v === 1) hasOne = true;
        if (b !== 0 && v === 0) hasZeroNonTriv = true;
      }
      if (hasOne) out[a] = 'invertible';
      else if (hasZeroNonTriv) out[a] = 'zerodiv';
      else out[a] = 'trivial';
    }
    return out;
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
      console.error('modular-arithmetic-explorer: invalid data-problem JSON', e);
      return;
    }

    // Validate moduli list.
    const moduliRaw = Array.isArray(problem.moduli) ? problem.moduli : [];
    const moduli = [];
    for (const m of moduliRaw) {
      const mi = Math.floor(Number(m));
      if (Number.isFinite(mi) && mi >= MIN_N && mi <= MAX_N && !moduli.includes(mi)) {
        moduli.push(mi);
      }
    }
    if (moduli.length === 0) {
      console.error('modular-arithmetic-explorer: data-problem.moduli must include at least one integer in [' + MIN_N + ', ' + MAX_N + ']');
      return;
    }

    // Resolve initial modulus.
    let initialN = moduli[0];
    if (problem.defaultModulus != null) {
      const d = Math.floor(Number(problem.defaultModulus));
      if (moduli.includes(d)) initialN = d;
    }

    // Resolve initial operation.
    let initialOp = 'mult';
    if (problem.defaultOp === 'add' || problem.defaultOp === 'mult') {
      initialOp = problem.defaultOp;
    }

    // Per-instance state.
    let n = initialN;
    let op = initialOp;            // 'mult' | 'add'
    let selectedRow = null;        // null or 0..n-1
    let answerRevealed = false;

    // ── Build inner DOM ────────────────────────────────────────────────
    const titleHtml = problem.title
      ? `<h1 class="mae-title">${escapeText(problem.title)}</h1>`
      : '';

    const introHtml = problem.intro
      ? `<div class="mae-intro">${problem.intro}</div>`
      : '';

    const modulusOptionsHtml = moduli.map(m =>
      `<option value="${m}"${m === n ? ' selected' : ''}>${m}</option>`
    ).join('');

    root.innerHTML = `
      ${titleHtml}
      ${introHtml}
      <div class="mae-controls">
        <div class="mae-control-group">
          <span class="mae-control-label">Modulus n =</span>
          <select class="mae-modulus-select">${modulusOptionsHtml}</select>
        </div>
        <div class="mae-control-group">
          <span class="mae-control-label">Operation:</span>
          <span class="mae-op-toggle">
            <button class="mae-op-btn${op === 'mult' ? ' active' : ''}" data-op="mult" type="button">Multiplication</button>
            <button class="mae-op-btn${op === 'add' ? ' active' : ''}" data-op="add" type="button">Addition</button>
          </span>
        </div>
      </div>
      <div class="mae-table-panel">
        <p class="mae-table-caption"></p>
        <table class="mae-table"><thead></thead><tbody></tbody></table>
      </div>
      <div class="mae-add-note hidden">
        Under addition, every element of ℤ_n has an additive inverse — every row contains a 0. The interesting structural distinctions (invertibility, zero divisors) appear under <em>multiplication</em>.
      </div>
      <div class="mae-summary">
        <h2>Row classification (multiplication)</h2>
        <div class="mae-summary-content"></div>
        <div class="mae-summary-detail mae-detail-empty">
          Hover or click a row label to see gcd(a, n) and what it tells you.
        </div>
      </div>
      <div class="mae-prompt">
        <div class="mae-prompt-question">When does <em>every</em> nonzero element of ℤ_n have a multiplicative inverse?</div>
        <button class="mae-reveal-btn" type="button">Reveal answer</button>
        <div class="mae-reveal-answer hidden">When n is prime — then ℤ_n is a field and every nonzero element is invertible.</div>
      </div>
    `;

    // ── DOM refs (scoped to root) ──────────────────────────────────────
    const modulusSelect    = root.querySelector('.mae-modulus-select');
    const opToggle         = root.querySelector('.mae-op-toggle');
    const tableEl          = root.querySelector('.mae-table');
    const theadEl          = tableEl.querySelector('thead');
    const tbodyEl          = tableEl.querySelector('tbody');
    const captionEl        = root.querySelector('.mae-table-caption');
    const summaryContentEl = root.querySelector('.mae-summary-content');
    const summaryHeaderEl  = root.querySelector('.mae-summary h2');
    const summaryDetailEl  = root.querySelector('.mae-summary-detail');
    const addNoteEl        = root.querySelector('.mae-add-note');
    const revealBtn        = root.querySelector('.mae-reveal-btn');
    const revealAnswerEl   = root.querySelector('.mae-reveal-answer');

    // ── Render the table ───────────────────────────────────────────────
    function renderTable() {
      const opSym = op === 'mult' ? '·' : '+';
      captionEl.innerHTML =
        op === 'mult'
          ? `Multiplication table for ℤ<sub>${n}</sub> &nbsp;·&nbsp; entry [a]·[b] mod ${n}`
          : `Addition table for ℤ<sub>${n}</sub> &nbsp;·&nbsp; entry [a]+[b] mod ${n}`;

      // Header row.
      let theadHtml = `<tr><th class="mae-corner">${opSym}</th>`;
      for (let b = 0; b < n; b++) {
        theadHtml += `<th data-col="${b}">${b}</th>`;
      }
      theadHtml += '</tr>';
      theadEl.innerHTML = theadHtml;

      // Body rows.
      const classes = op === 'mult' ? classifyMultRows(n) : null;
      let tbodyHtml = '';
      for (let a = 0; a < n; a++) {
        let rowClass = '';
        let labelClass = '';
        if (op === 'mult') {
          const cls = classes[a];
          labelClass = cls === 'invertible' ? 'mae-row-invertible'
                     : cls === 'zerodiv'    ? 'mae-row-zerodiv'
                                            : 'mae-row-trivial';
        } else {
          labelClass = 'mae-row-trivial';
        }
        if (selectedRow === a) rowClass = 'mae-row-selected';
        tbodyHtml += `<tr class="${rowClass}" data-row="${a}">`;
        tbodyHtml += `<th class="mae-row-label ${labelClass}${selectedRow === a ? ' selected' : ''}" data-row="${a}">${a}</th>`;
        for (let b = 0; b < n; b++) {
          const v = op === 'mult' ? (a * b) % n : (a + b) % n;
          let cellClass = '';
          if (op === 'mult') {
            // Highlight the cell containing 1 when both a,b are nonzero.
            if (v === 1 && a !== 0 && b !== 0) cellClass = 'mae-cell-one';
            // Highlight zero in a non-trivial column (a,b both nonzero).
            else if (v === 0 && a !== 0 && b !== 0) cellClass = 'mae-cell-zero-bad';
          }
          tbodyHtml += `<td class="${cellClass}" data-row="${a}" data-col="${b}">${v}</td>`;
        }
        tbodyHtml += '</tr>';
      }
      tbodyEl.innerHTML = tbodyHtml;
    }

    // ── Render the summary panel ───────────────────────────────────────
    function renderSummary() {
      if (op === 'add') {
        summaryHeaderEl.textContent = 'Row classification (addition)';
        summaryContentEl.innerHTML =
          '<div class="mae-summary-line">In the addition table, every row contains a 0 — every element has an additive inverse. There are no zero divisors to find here. Switch to <em>Multiplication</em> for the interesting classification.</div>';
        addNoteEl.classList.remove('hidden');
        return;
      }
      addNoteEl.classList.add('hidden');
      summaryHeaderEl.textContent = 'Row classification (multiplication)';
      const classes = classifyMultRows(n);
      const invertible = [];
      const zerodiv    = [];
      for (let a = 0; a < n; a++) {
        if (classes[a] === 'invertible') invertible.push(a);
        else if (classes[a] === 'zerodiv') zerodiv.push(a);
      }
      const fmtList = arr => arr.length === 0 ? '∅' : arr.map(x => `[${x}]`).join(', ');
      const primeBadge = isPrime(n)
        ? ' <em>(n = ' + n + ' is prime — every nonzero element is invertible.)</em>'
        : '';
      summaryContentEl.innerHTML =
        `<div class="mae-summary-line"><span class="mae-summary-invertible-label">Invertible</span> (rows containing 1): <span class="mae-class-list">${fmtList(invertible)}</span></div>` +
        `<div class="mae-summary-line"><span class="mae-summary-zerodiv-label">Zero divisors</span> (rows with 0 in a non-trivial column): <span class="mae-class-list">${fmtList(zerodiv)}</span></div>` +
        `<div class="mae-summary-line">Theorem: [a] has a multiplicative inverse mod n if and only if gcd(a, n) = 1.${primeBadge}</div>`;
    }

    // ── Render the gcd-detail panel for a hovered/selected row ─────────
    function renderDetail(a) {
      if (op === 'add') {
        summaryDetailEl.classList.add('mae-detail-empty');
        summaryDetailEl.innerHTML = 'Switch to multiplication mode to see gcd(a, n) details for a row.';
        return;
      }
      if (a == null) {
        summaryDetailEl.classList.add('mae-detail-empty');
        summaryDetailEl.innerHTML = 'Hover or click a row label to see gcd(a, n) and what it tells you.';
        return;
      }
      summaryDetailEl.classList.remove('mae-detail-empty');
      if (a === 0) {
        summaryDetailEl.innerHTML =
          `<div><span class="mae-math">[0]</span> is the trivial row: 0 · b = 0 for every b. It has no multiplicative inverse and is not usually called a zero divisor.</div>`;
        return;
      }
      const { steps, gcd: g } = gcdSteps(a, n);
      let stepsHtml = '';
      if (steps.length === 0) {
        stepsHtml = `<div class="mae-math">gcd(${a}, ${n}) = ${g}</div>`;
      } else {
        stepsHtml = steps.map(s =>
          `<div class="mae-math">${s.a} = ${s.q} · ${s.b} + ${s.r}</div>`
        ).join('');
        stepsHtml += `<div class="mae-math">gcd(${a}, ${n}) = ${g}</div>`;
      }
      const conclusion = g === 1
        ? `Because gcd(${a}, ${n}) = 1, [${a}] has a multiplicative inverse in ℤ<sub>${n}</sub>.`
        : `Because gcd(${a}, ${n}) = ${g} ≠ 1, [${a}] has no multiplicative inverse — it is a zero divisor in ℤ<sub>${n}</sub>.`;
      summaryDetailEl.innerHTML =
        `<div><strong>Euclidean algorithm for gcd(${a}, ${n}):</strong></div>` +
        stepsHtml +
        `<div class="mae-detail-conclusion">${conclusion}</div>`;
    }

    // ── Hover handlers ─────────────────────────────────────────────────
    function clearHoverHighlight() {
      tbodyEl.querySelectorAll('.mae-hover-row, .mae-hover-col').forEach(el => {
        el.classList.remove('mae-hover-row', 'mae-hover-col');
      });
      theadEl.querySelectorAll('.mae-hover-col').forEach(el => {
        el.classList.remove('mae-hover-col');
      });
    }

    function applyHoverHighlight(rowIdx, colIdx) {
      clearHoverHighlight();
      if (rowIdx != null) {
        tbodyEl.querySelectorAll(`[data-row="${rowIdx}"]`).forEach(el => {
          el.classList.add('mae-hover-row');
        });
      }
      if (colIdx != null) {
        tbodyEl.querySelectorAll(`td[data-col="${colIdx}"]`).forEach(el => {
          el.classList.add('mae-hover-col');
        });
        const headCell = theadEl.querySelector(`th[data-col="${colIdx}"]`);
        if (headCell) headCell.classList.add('mae-hover-col');
      }
    }

    tableEl.addEventListener('mouseover', (e) => {
      const cell = e.target.closest('td[data-row][data-col]');
      if (cell) {
        applyHoverHighlight(+cell.dataset.row, +cell.dataset.col);
        if (selectedRow == null) renderDetail(+cell.dataset.row);
        return;
      }
      const rowLabel = e.target.closest('th.mae-row-label');
      if (rowLabel) {
        applyHoverHighlight(+rowLabel.dataset.row, null);
        if (selectedRow == null) renderDetail(+rowLabel.dataset.row);
        return;
      }
    });

    tableEl.addEventListener('mouseleave', () => {
      clearHoverHighlight();
      if (selectedRow == null) renderDetail(null);
      else renderDetail(selectedRow);
    });

    // ── Click on row label: toggle selection (sticky highlight) ────────
    tableEl.addEventListener('click', (e) => {
      const rowLabel = e.target.closest('th.mae-row-label');
      if (!rowLabel) return;
      const a = +rowLabel.dataset.row;
      if (selectedRow === a) {
        selectedRow = null;
      } else {
        selectedRow = a;
      }
      // Update selected styling on row labels and tr.mae-row-selected.
      tbodyEl.querySelectorAll('tr').forEach(tr => {
        tr.classList.toggle('mae-row-selected', selectedRow != null && +tr.dataset.row === selectedRow);
      });
      tbodyEl.querySelectorAll('th.mae-row-label').forEach(th => {
        th.classList.toggle('selected', selectedRow != null && +th.dataset.row === selectedRow);
      });
      renderDetail(selectedRow);
    });

    // ── Modulus selector ───────────────────────────────────────────────
    modulusSelect.addEventListener('change', () => {
      const newN = Math.floor(Number(modulusSelect.value));
      if (!moduli.includes(newN)) return;
      n = newN;
      selectedRow = null;
      renderAll();
    });

    // ── Operation toggle ───────────────────────────────────────────────
    opToggle.addEventListener('click', (e) => {
      const btn = e.target.closest('.mae-op-btn');
      if (!btn) return;
      const newOp = btn.dataset.op;
      if (newOp !== 'mult' && newOp !== 'add') return;
      if (newOp === op) return;
      op = newOp;
      selectedRow = null;
      root.querySelectorAll('.mae-op-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.op === op);
      });
      renderAll();
    });

    // ── Reveal-answer button ───────────────────────────────────────────
    revealBtn.addEventListener('click', () => {
      answerRevealed = !answerRevealed;
      revealAnswerEl.classList.toggle('hidden', !answerRevealed);
      revealBtn.textContent = answerRevealed ? 'Hide answer' : 'Reveal answer';
    });

    // ── Master render ──────────────────────────────────────────────────
    function renderAll() {
      renderTable();
      renderSummary();
      renderDetail(selectedRow);
    }

    renderAll();
  }

  // ── Bootstrap: mount every .mae-widget on the page (idempotent) ────────
  function bootAll() {
    document.querySelectorAll('.mae-widget').forEach((root) => {
      if (root.dataset.maeMounted === '1') return;
      root.dataset.maeMounted = '1';
      mountWidget(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAll);
  } else {
    bootAll();
  }
}());
