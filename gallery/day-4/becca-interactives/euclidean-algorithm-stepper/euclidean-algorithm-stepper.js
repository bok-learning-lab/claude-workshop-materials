(function () {
  'use strict';

  // =========================================================================
  // EUCLIDEAN ALGORITHM STEPPER — embeddable widget
  //
  // Each <div class="eas-widget" data-problem='{...}'></div> on the page is
  // mounted as an independent instance. State and DOM refs live in a closure
  // per mount, so multiple widgets coexist without interference. There are
  // no document-wide IDs; everything is scoped via root.querySelector.
  //
  // Per-round model:
  //   rows: Array<{ x, y, r (computed), status, attempts }>
  //   - status in { 'active', 'correct', 'revealed' }
  //   - 'active' is the row the student is currently filling in.
  //   - 'correct' / 'revealed' are completed rows.
  //   The round is finished when a correct row produces y = 0; gcd is then
  //   the x of that final row.
  // =========================================================================

  // Per-instance ID seed (kept for parity with sibling widgets).
  let widgetSeq = 0;

  // ── Pure helpers ─────────────────────────────────────────────────────────
  function isPositiveInt(n) {
    return Number.isInteger(n) && n > 0;
  }

  function escapeText(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Run the Euclidean algorithm on (x, y) and return the full sequence of
  // (x, y, r) triples until y = 0. The final row has y = 0 and r = 0; the
  // x of the final row is the gcd.
  function fullSequence(x, y) {
    const rows = [];
    let cx = x, cy = y;
    // Safety cap so a malformed input cannot infinite-loop the browser.
    let guard = 0;
    while (cy !== 0 && guard < 200) {
      const r = cx % cy;
      rows.push({ x: cx, y: cy, r });
      cx = cy;
      cy = r;
      guard++;
    }
    // Append the final terminal row with y = 0 (so the student can see it).
    rows.push({ x: cx, y: 0, r: 0, terminal: true });
    return rows;
  }

  // ── Mount a single widget instance ───────────────────────────────────────
  function mountWidget(root) {
    let problem;
    try {
      problem = JSON.parse(root.dataset.problem || '{}');
    } catch (e) {
      console.error('euclidean-algorithm-stepper: invalid data-problem JSON', e);
      return;
    }
    const rounds = Array.isArray(problem.rounds) ? problem.rounds : [];
    if (!rounds.length) {
      console.error('euclidean-algorithm-stepper: data-problem must include a non-empty "rounds" array');
      return;
    }

    // Validate / normalize rounds.
    const normalizedRounds = [];
    for (const r of rounds) {
      const x = Math.floor(Number(r.x));
      const y = Math.floor(Number(r.y));
      if (!isPositiveInt(x) || !isPositiveInt(y)) {
        console.error('euclidean-algorithm-stepper: each round needs positive integer x and y', r);
        continue;
      }
      normalizedRounds.push({
        x, y,
        label: typeof r.label === 'string' ? r.label : null,
      });
    }
    if (!normalizedRounds.length) {
      console.error('euclidean-algorithm-stepper: no valid rounds after validation');
      return;
    }

    void (++widgetSeq);

    // ── Per-instance state ────────────────────────────────────────────────
    let roundIdx = 0;
    let rows = [];          // visible rows so far for the current round
    let activeIdx = 0;       // index of the active (pending) row
    let attempts = 0;        // wrong attempts on the active row
    let roundDone = false;   // current round finished (gcd reached)
    const roundResults = []; // { x, y, gcd, perfect }  one per finished round
    let perfectThisRound = true;

    // Pre-compute the full true sequence for each round, so r at every step
    // is decided up-front.
    const roundSequences = normalizedRounds.map(r => fullSequence(r.x, r.y));

    // ── Build outer DOM ───────────────────────────────────────────────────
    const titleHtml = problem.title
      ? `<h1 class="eas-title">${escapeText(problem.title)}</h1>`
      : '';
    const introHtml = problem.intro
      ? `<div class="eas-intro">${problem.intro}</div>`
      : '';

    root.innerHTML = `
      ${titleHtml}
      ${introHtml}
      <div class="eas-round-section">
        <div class="eas-round-header">
          <span class="eas-round-counter"></span>
          <span class="eas-round-label"></span>
        </div>
        <div class="eas-annotation"></div>
        <div class="eas-table-wrap">
          <table class="eas-table">
            <thead>
              <tr><th>x</th><th>y</th><th>r = x mod y</th></tr>
            </thead>
            <tbody class="eas-table-body"></tbody>
          </table>
          <div class="eas-row-actions">
            <button class="eas-btn eas-btn-primary eas-submit-btn" type="button">Check</button>
            <button class="eas-btn eas-reveal-btn hidden" type="button">Show answer</button>
          </div>
          <div class="eas-feedback hidden"></div>
        </div>
        <div class="eas-round-nav">
          <button class="eas-btn eas-next-round-btn hidden" type="button">Next round →</button>
        </div>
      </div>
      <div class="eas-summary hidden">
        <h2>Summary</h2>
        <ul class="eas-summary-list"></ul>
        <button class="eas-btn eas-restart-btn" type="button">Start over</button>
      </div>
    `;

    // ── DOM refs (scoped to root) ─────────────────────────────────────────
    const counterEl    = root.querySelector('.eas-round-counter');
    const labelEl      = root.querySelector('.eas-round-label');
    const annotationEl = root.querySelector('.eas-annotation');
    const tbodyEl      = root.querySelector('.eas-table-body');
    const submitBtn    = root.querySelector('.eas-submit-btn');
    const revealBtn    = root.querySelector('.eas-reveal-btn');
    const feedbackEl   = root.querySelector('.eas-feedback');
    const nextRoundBtn = root.querySelector('.eas-next-round-btn');
    const summaryEl    = root.querySelector('.eas-summary');
    const summaryList  = root.querySelector('.eas-summary-list');
    const restartBtn   = root.querySelector('.eas-restart-btn');
    const roundSection = root.querySelector('.eas-round-section');

    // ── Rendering ─────────────────────────────────────────────────────────
    function renderRoundChrome() {
      const round = normalizedRounds[roundIdx];
      counterEl.textContent = `Round ${roundIdx + 1} of ${normalizedRounds.length}`;
      labelEl.textContent   = round.label
        ? round.label
        : `(x, y) = (${round.x}, ${round.y})`;
    }

    function renderAnnotation() {
      if (roundDone) {
        const last = rows[rows.length - 1];
        // last is the terminal row with y = 0; gcd is last.x.
        annotationEl.innerHTML = `<strong>Done.</strong> When <span class="eas-math">y = 0</span>, the previous <span class="eas-math">y</span> is the gcd. Here, <strong>gcd = ${last.x}</strong>.`;
        return;
      }
      const active = rows[activeIdx];
      if (!active) { annotationEl.textContent = ''; return; }
      annotationEl.innerHTML =
        `<strong>By the lemma:</strong> <span class="eas-math">gcd(x, y) = gcd(y, r)</span>, where <span class="eas-math">r = x mod y</span>. ` +
        `Compute <span class="eas-math">${active.x} mod ${active.y}</span>. After this row, <span class="eas-math">y</span> becomes the new <span class="eas-math">x</span> and <span class="eas-math">r</span> becomes the new <span class="eas-math">y</span>.`;
    }

    function renderRows() {
      tbodyEl.innerHTML = '';

      rows.forEach((row, i) => {
        const tr = document.createElement('tr');
        if (row.terminal) tr.classList.add('eas-final-row');

        const tdX = document.createElement('td');
        tdX.textContent = row.x;
        const tdY = document.createElement('td');
        tdY.textContent = row.y;
        const tdR = document.createElement('td');

        if (row.terminal) {
          // y = 0 row: gcd is highlighted in the x column visually, but here
          // we mark the whole row distinct; r cell shows "—".
          tdR.textContent = '—';
          tdX.classList.add('eas-gcd-cell');
        } else if (row.status === 'correct') {
          tdR.classList.add('eas-r-correct');
          tdR.innerHTML = `<span class="eas-check">✓</span>${row.r}`;
        } else if (row.status === 'revealed') {
          tdR.classList.add('eas-r-revealed');
          tdR.textContent = row.r;
        } else if (row.status === 'active') {
          tdR.classList.add('eas-r-input-cell');
          const input = document.createElement('input');
          input.type = 'text';
          input.inputMode = 'numeric';
          input.autocomplete = 'off';
          input.className = 'eas-r-input';
          input.setAttribute('aria-label', `Remainder of ${row.x} divided by ${row.y}`);
          input.value = row.draftValue != null ? row.draftValue : '';
          input.addEventListener('input', (e) => {
            row.draftValue = e.target.value;
          });
          input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSubmit();
            }
          });
          tdR.appendChild(input);
        } else {
          tdR.classList.add('eas-r-pending');
          tdR.textContent = '?';
        }

        tr.appendChild(tdX);
        tr.appendChild(tdY);
        tr.appendChild(tdR);
        tbodyEl.appendChild(tr);
      });

      // Focus the active row's input if present.
      const activeInput = tbodyEl.querySelector('.eas-r-input');
      if (activeInput) {
        // Defer to allow layout/paint.
        setTimeout(() => { activeInput.focus(); activeInput.select(); }, 0);
      }
    }

    function renderControls() {
      if (roundDone) {
        submitBtn.classList.add('hidden');
        revealBtn.classList.add('hidden');
        nextRoundBtn.classList.remove('hidden');
        nextRoundBtn.textContent = (roundIdx === normalizedRounds.length - 1)
          ? 'See summary →'
          : 'Next round →';
      } else {
        submitBtn.classList.remove('hidden');
        submitBtn.disabled = false;
        // Reveal button only shown when student has 2+ wrong attempts
        // and the current row is still active.
        if (attempts >= 2) {
          revealBtn.classList.remove('hidden');
        } else {
          revealBtn.classList.add('hidden');
        }
        nextRoundBtn.classList.add('hidden');
      }
    }

    function clearFeedback() {
      feedbackEl.classList.add('hidden');
      feedbackEl.classList.remove('eas-feedback-wrong', 'eas-feedback-reveal', 'eas-feedback-done');
      feedbackEl.innerHTML = '';
    }

    function showFeedback(kind, html) {
      feedbackEl.classList.remove('hidden', 'eas-feedback-wrong', 'eas-feedback-reveal', 'eas-feedback-done');
      feedbackEl.classList.add(`eas-feedback-${kind}`);
      feedbackEl.innerHTML = html;
    }

    // ── Round flow ────────────────────────────────────────────────────────
    function startRound() {
      const seq = roundSequences[roundIdx];
      // Begin with a single active row showing (x, y) of the first step.
      // seq[0] is { x, y, r } for the first step (as long as y > 0).
      // If y = 0 from the start (round.y = 0 — disallowed by validation), nothing.
      rows = [];
      if (seq.length === 0) return;

      // First active row is seq[0] (with r hidden).
      const first = seq[0];
      if (first.y === 0) {
        // Degenerate; treat the round as already done.
        rows.push({ x: first.x, y: 0, r: 0, terminal: true });
        roundDone = true;
        roundResults.push({
          x: normalizedRounds[roundIdx].x,
          y: normalizedRounds[roundIdx].y,
          gcd: first.x,
          perfect: true,
        });
      } else {
        rows.push({
          x: first.x,
          y: first.y,
          r: first.r,
          status: 'active',
          draftValue: '',
        });
        activeIdx = 0;
        attempts = 0;
        roundDone = false;
        perfectThisRound = true;
      }

      clearFeedback();
      renderRoundChrome();
      renderAnnotation();
      renderRows();
      renderControls();
    }

    function advanceAfterCorrectOrRevealed() {
      // The active row has just been completed. If its r equals the y of the
      // *next* sequence step's y (i.e. computed r > 0), append a new active
      // row. Otherwise the algorithm has terminated: append the terminal row
      // with y = 0 and the gcd.
      const seq = roundSequences[roundIdx];
      const justCompletedSeqIdx = activeIdx; // since rows[activeIdx] was the active row
      const nextSeqIdx = justCompletedSeqIdx + 1;

      if (nextSeqIdx < seq.length) {
        const next = seq[nextSeqIdx];
        if (next.terminal) {
          // The terminal { x, y:0 } row.
          rows.push({ x: next.x, y: 0, r: 0, terminal: true });
          roundDone = true;
        } else {
          rows.push({
            x: next.x,
            y: next.y,
            r: next.r,
            status: 'active',
            draftValue: '',
          });
          activeIdx = rows.length - 1;
          attempts = 0;
        }
      } else {
        // Should not happen, but as a safety: mark done.
        roundDone = true;
      }

      if (roundDone) {
        const last = rows[rows.length - 1];
        roundResults.push({
          x: normalizedRounds[roundIdx].x,
          y: normalizedRounds[roundIdx].y,
          gcd: last.x,
          perfect: perfectThisRound,
        });
        showFeedback('done',
          `<strong>gcd(${normalizedRounds[roundIdx].x}, ${normalizedRounds[roundIdx].y}) = ${last.x}.</strong> ` +
          `Once <span class="eas-math">y = 0</span>, the previous <span class="eas-math">y</span> (now the <span class="eas-math">x</span> in the final row) is the greatest common divisor.`
        );
      } else {
        clearFeedback();
      }

      renderAnnotation();
      renderRows();
      renderControls();
    }

    function handleSubmit() {
      if (roundDone) return;
      const active = rows[activeIdx];
      if (!active || active.status !== 'active') return;

      const raw = (active.draftValue || '').trim();
      if (raw === '') {
        showFeedback('wrong', 'Enter a number for <span class="eas-math">r</span>.');
        const input = tbodyEl.querySelector('.eas-r-input');
        if (input) {
          input.classList.remove('eas-shake');
          // Force reflow so the animation can replay.
          void input.offsetWidth;
          input.classList.add('eas-shake');
        }
        return;
      }
      const guess = Number(raw);
      if (!Number.isInteger(guess) || guess < 0) {
        attempts++;
        perfectThisRound = false;
        showFeedback('wrong',
          `Not quite — <span class="eas-math">r</span> must be a non-negative integer with <span class="eas-math">0 ≤ r &lt; ${active.y}</span>.`
        );
        const input = tbodyEl.querySelector('.eas-r-input');
        if (input) {
          input.classList.remove('eas-shake');
          void input.offsetWidth;
          input.classList.add('eas-shake');
        }
        renderControls();
        return;
      }

      if (guess === active.r) {
        // Correct! Lock in the row.
        active.status = 'correct';
        delete active.draftValue;
        clearFeedback();
        advanceAfterCorrectOrRevealed();
        return;
      }

      // Wrong.
      attempts++;
      perfectThisRound = false;
      let msg;
      if (guess >= active.y) {
        msg = `Not quite — remember that the remainder must satisfy <span class="eas-math">0 ≤ r &lt; ${active.y}</span>. Try again.`;
      } else if (attempts >= 2) {
        msg = `Still not right. Hint: write <span class="eas-math">${active.x} = q · ${active.y} + r</span> with <span class="eas-math">q</span> chosen so that <span class="eas-math">0 ≤ r &lt; ${active.y}</span>. You can press <em>Show answer</em> to reveal the correct value.`;
      } else {
        msg = `Not quite. Recompute <span class="eas-math">${active.x} mod ${active.y}</span> and try again.`;
      }
      showFeedback('wrong', msg);
      const input = tbodyEl.querySelector('.eas-r-input');
      if (input) {
        input.classList.remove('eas-shake');
        void input.offsetWidth;
        input.classList.add('eas-shake');
      }
      renderControls();
    }

    function handleReveal() {
      if (roundDone) return;
      const active = rows[activeIdx];
      if (!active || active.status !== 'active') return;
      active.status = 'revealed';
      delete active.draftValue;
      perfectThisRound = false;
      const q = Math.floor(active.x / active.y);
      showFeedback('reveal',
        `<strong>The remainder is ${active.r}.</strong> ` +
        `<span class="eas-math">${active.x} = ${q} · ${active.y} + ${active.r}</span>, ` +
        `with <span class="eas-math">0 ≤ ${active.r} &lt; ${active.y}</span>.`
      );
      advanceAfterCorrectOrRevealed();
    }

    function showSummary() {
      summaryList.innerHTML = '';
      roundResults.forEach((r) => {
        const li = document.createElement('li');
        const left = document.createElement('span');
        left.className = 'eas-summary-pair';
        left.textContent = `gcd(${r.x}, ${r.y})`;
        const right = document.createElement('span');
        right.className = 'eas-summary-result';
        right.textContent = `= ${r.gcd}${r.perfect ? '' : ' (with hints)'}`;
        li.appendChild(left);
        li.appendChild(right);
        summaryList.appendChild(li);
      });
      roundSection.classList.add('hidden');
      summaryEl.classList.remove('hidden');
    }

    function nextRoundOrFinish() {
      if (roundIdx < normalizedRounds.length - 1) {
        roundIdx++;
        startRound();
      } else {
        showSummary();
      }
    }

    function restart() {
      roundIdx = 0;
      roundResults.length = 0;
      summaryEl.classList.add('hidden');
      roundSection.classList.remove('hidden');
      startRound();
    }

    // ── Event wiring ──────────────────────────────────────────────────────
    submitBtn.addEventListener('click', handleSubmit);
    revealBtn.addEventListener('click', handleReveal);
    nextRoundBtn.addEventListener('click', nextRoundOrFinish);
    restartBtn.addEventListener('click', restart);

    // ── Initial render ────────────────────────────────────────────────────
    startRound();
  }

  // ── Bootstrap: mount every .eas-widget on the page (idempotent) ──────────
  function bootAll() {
    document.querySelectorAll('.eas-widget').forEach((root) => {
      if (root.dataset.easMounted === '1') return;
      root.dataset.easMounted = '1';
      mountWidget(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAll);
  } else {
    bootAll();
  }
}());
