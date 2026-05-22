(function () {
  'use strict';

  // =========================================================================
  // PRIME FACTOR DIVISIBILITY CHECKER — embeddable widget (Mode 1)
  //
  // Each <div class="pfd-widget" data-problem='{...}'></div> on the page is
  // mounted as an independent instance. State and DOM refs live in a closure
  // per mount, so multiple widgets coexist without interference. SVG/HTML
  // IDs are not used for cross-element wiring; everything is scoped via
  // root.querySelector. A module-level counter is reserved for future use
  // (e.g. SVG markers); we do not currently emit any url(#...) references.
  // =========================================================================

  const NS = 'http://www.w3.org/2000/svg';

  // Per-instance ID seed. Reserved for future SVG marker use; not needed
  // for the current Mode 1 visualization (no url(#...) references are
  // emitted), but kept so the bootstrap matches the bubble-diagram pattern.
  let widgetSeq = 0;

  // Deterministic prime → color map. Primes outside this list fall back
  // to gray. Authors who need more primes can extend this map.
  const PRIME_COLORS = {
    2:  '#4a7fc1', // blue
    3:  '#3a9a6a', // green
    5:  '#e07a3a', // orange
    7:  '#8a4f9b', // purple
    11: '#c0392b', // crimson
    13: '#2aa1a8', // teal
    17: '#a89a2a', // ochre
    19: '#c5559b', // pink
    23: '#3d3a9a', // indigo
    29: '#5a7a2a', // olive
  };
  const FALLBACK_COLOR = '#888';

  // SVG layout constants (a single round's visualization).
  const COL_WIDTH       = 56;
  const COL_GAP         = 14;
  const BLOCK_HEIGHT    = 22;
  const BLOCK_GAP       = 3;
  const ROW_LABEL_X     = 8;
  const COLS_X_START    = 90;   // left edge of first prime column
  const ROW_VALUE_Y_OFF = 18;   // value text offset below row label
  const N_ROW_BASE_Y    = 150;  // baseline (bottom) of n's stack
  const M_ROW_BASE_Y    = 320;  // baseline (bottom) of m's stack
  const AXIS_Y          = 340;  // horizontal axis line
  const PRIME_LABEL_Y   = 360;
  const SVG_HEIGHT      = 380;

  // ── Pure helpers ───────────────────────────────────────────────────────
  function primeFactorize(n) {
    // Returns { primes: [p, ...], exps: { p: e, ... } } via trial division.
    n = Math.floor(Number(n));
    if (!Number.isFinite(n) || n < 1) return { primes: [], exps: {} };
    if (n === 1) return { primes: [], exps: {} };
    const exps = {};
    let cur = n;
    let p = 2;
    while (p * p <= cur) {
      while (cur % p === 0) {
        exps[p] = (exps[p] || 0) + 1;
        cur = cur / p;
      }
      p = (p === 2) ? 3 : p + 2;
    }
    if (cur > 1) {
      exps[cur] = (exps[cur] || 0) + 1;
    }
    const primes = Object.keys(exps).map(Number).sort((a, b) => a - b);
    return { primes, exps };
  }

  function dividesByExps(nExps, mExps) {
    // n divides m iff every prime exponent in n is <= the corresponding
    // exponent in m. Returns { divides, failingPrime } where failingPrime
    // is the smallest prime where n's exponent exceeds m's (or null).
    const primes = Object.keys(nExps).map(Number).sort((a, b) => a - b);
    for (const p of primes) {
      const ne = nExps[p] || 0;
      const me = mExps[p] || 0;
      if (ne > me) return { divides: false, failingPrime: p };
    }
    return { divides: true, failingPrime: null };
  }

  function colorForPrime(p) {
    return PRIME_COLORS[p] || FALLBACK_COLOR;
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

  function factorizationString(primes, exps) {
    if (!primes.length) return '1';
    return primes.map(p => {
      const e = exps[p];
      if (e === 1) return String(p);
      // Use Unicode superscripts for small exponents; otherwise use ^k.
      const SUP = ['⁰','¹','²','³','⁴','⁵','⁶','⁷','⁸','⁹'];
      if (e >= 0 && e <= 9) return String(p) + SUP[e];
      return String(p) + '^' + e;
    }).join(' · ');
  }

  // ── Mount a single widget instance ─────────────────────────────────────
  function mountWidget(root) {
    let problem;
    try {
      problem = JSON.parse(root.dataset.problem || '{}');
    } catch (e) {
      console.error('prime-factor-divisibility: invalid data-problem JSON', e);
      return;
    }
    const rounds = Array.isArray(problem.rounds) ? problem.rounds : [];
    if (!rounds.length) {
      console.error('prime-factor-divisibility: data-problem must include a non-empty "rounds" array');
      return;
    }

    // Reserved per-instance ID seed (unused today, kept for parity).
    void (++widgetSeq);

    let roundIdx   = 0;
    let answered   = false;        // has the student answered the current round?
    let correctCnt = 0;
    let totalAnswered = 0;

    // Pre-compute factorizations and correctness once per round so render
    // is cheap and we never re-evaluate mid-round.
    const roundData = rounds.map((r) => {
      const n = Math.floor(Number(r.n));
      const m = Math.floor(Number(r.m));
      const nFact = primeFactorize(n);
      const mFact = primeFactorize(m);
      const verdict = dividesByExps(nFact.exps, mFact.exps);
      return { n, m, nFact, mFact, verdict };
    });

    // ── Build outer DOM ───────────────────────────────────────────────
    const titleHtml = problem.title
      ? `<h1 class="pfd-title">${escapeText(problem.title)}</h1>`
      : '';
    const introHtml = problem.intro
      ? `<div class="pfd-intro">${problem.intro}</div>`
      : '';

    root.innerHTML = `
      ${titleHtml}
      ${introHtml}
      <div class="pfd-round-header">
        <span class="pfd-round-counter"></span>
        <span class="pfd-score"></span>
      </div>
      <div class="pfd-prompt">
        Does <span class="pfd-num pfd-prompt-n"></span> divide <span class="pfd-num pfd-prompt-m"></span>?
      </div>
      <div class="pfd-viz">
        <svg class="pfd-svg" xmlns="${NS}"></svg>
      </div>
      <div class="pfd-answers">
        <button class="pfd-btn pfd-yes-btn" type="button">Yes, n divides m</button>
        <button class="pfd-btn pfd-no-btn" type="button">No, n does not divide m</button>
      </div>
      <div class="pfd-feedback hidden"></div>
      <div class="pfd-summary hidden">
        <div class="pfd-summary-headline"></div>
        <div class="pfd-summary-detail"></div>
        <button class="pfd-restart-btn" type="button">Start over</button>
      </div>
      <div class="pfd-nav">
        <button class="pfd-next-btn hidden" type="button">Next round &rarr;</button>
      </div>
    `;

    // ── DOM refs (scoped to root) ─────────────────────────────────────
    const counterEl   = root.querySelector('.pfd-round-counter');
    const scoreEl     = root.querySelector('.pfd-score');
    const promptNEl   = root.querySelector('.pfd-prompt-n');
    const promptMEl   = root.querySelector('.pfd-prompt-m');
    const svg         = root.querySelector('.pfd-svg');
    const yesBtn      = root.querySelector('.pfd-yes-btn');
    const noBtn       = root.querySelector('.pfd-no-btn');
    const feedbackEl  = root.querySelector('.pfd-feedback');
    const summaryEl   = root.querySelector('.pfd-summary');
    const summaryHead = root.querySelector('.pfd-summary-headline');
    const summaryDet  = root.querySelector('.pfd-summary-detail');
    const restartBtn  = root.querySelector('.pfd-restart-btn');
    const nextBtn     = root.querySelector('.pfd-next-btn');

    // ── Render: visualization for the current round ───────────────────
    function renderViz(round, highlightSpec) {
      // highlightSpec is either null (pre-answer view), or:
      //   { type: 'all-n' }      — highlight every block in n's row
      //   { type: 'fail', prime } — highlight the failing prime column on n
      const { n, m, nFact, mFact } = round;

      // Union of primes from n and m, sorted ascending. Each prime gets
      // a fixed-width column so the two stacks align.
      const allPrimes = Array.from(
        new Set([...nFact.primes, ...mFact.primes])
      ).sort((a, b) => a - b);

      // Compute SVG width based on column count.
      const numCols = Math.max(1, allPrimes.length);
      const innerWidth = numCols * COL_WIDTH + (numCols - 1) * COL_GAP;
      const svgWidth = COLS_X_START + innerWidth + 24;

      svg.setAttribute('viewBox', `0 0 ${svgWidth} ${SVG_HEIGHT}`);
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      // Reasonable cap so the SVG doesn't grow unbounded for many primes.
      svg.style.maxWidth = svgWidth + 'px';
      svg.innerHTML = '';

      // Row labels and numeric values on the left.
      const rowLabelN = svgEl('text', {
        x: ROW_LABEL_X,
        y: N_ROW_BASE_Y - BLOCK_HEIGHT * 0.5,
        class: 'pfd-row-label',
      });
      rowLabelN.textContent = 'n';
      svg.appendChild(rowLabelN);

      const rowValueN = svgEl('text', {
        x: ROW_LABEL_X,
        y: N_ROW_BASE_Y - BLOCK_HEIGHT * 0.5 + ROW_VALUE_Y_OFF,
        class: 'pfd-row-value',
      });
      rowValueN.textContent = `= ${n}`;
      svg.appendChild(rowValueN);

      const rowLabelM = svgEl('text', {
        x: ROW_LABEL_X,
        y: M_ROW_BASE_Y - BLOCK_HEIGHT * 0.5,
        class: 'pfd-row-label',
      });
      rowLabelM.textContent = 'm';
      svg.appendChild(rowLabelM);

      const rowValueM = svgEl('text', {
        x: ROW_LABEL_X,
        y: M_ROW_BASE_Y - BLOCK_HEIGHT * 0.5 + ROW_VALUE_Y_OFF,
        class: 'pfd-row-value',
      });
      rowValueM.textContent = `= ${m}`;
      svg.appendChild(rowValueM);

      // Horizontal axis between n and m rows.
      svg.appendChild(svgEl('line', {
        x1: COLS_X_START - 8,
        x2: COLS_X_START + innerWidth + 8,
        y1: AXIS_Y,
        y2: AXIS_Y,
        class: 'pfd-axis-line',
      }));

      // Failing-column backdrop: drawn first so blocks render on top.
      if (highlightSpec && highlightSpec.type === 'fail') {
        const colIdx = allPrimes.indexOf(highlightSpec.prime);
        if (colIdx >= 0) {
          const x = COLS_X_START + colIdx * (COL_WIDTH + COL_GAP);
          // Span both rows plus a little padding above/below.
          const yTop    = 16;
          const yBottom = AXIS_Y + 4;
          svg.appendChild(svgEl('rect', {
            x: x - 4,
            y: yTop,
            width:  COL_WIDTH + 8,
            height: yBottom - yTop,
            rx: 4,
            class: 'pfd-column-rect fail',
          }));
        }
      }

      // Per-column rendering: blocks for n above the axis, blocks for m
      // below it. Empty stacks (when only one number has the prime) get
      // a small dashed placeholder so the alignment is legible.
      allPrimes.forEach((p, colIdx) => {
        const x = COLS_X_START + colIdx * (COL_WIDTH + COL_GAP);
        const color = colorForPrime(p);
        const nE = nFact.exps[p] || 0;
        const mE = mFact.exps[p] || 0;

        // n row — stack upward from N_ROW_BASE_Y.
        if (nE === 0) {
          // Empty placeholder for n in this column.
          svg.appendChild(svgEl('rect', {
            x,
            y: N_ROW_BASE_Y - BLOCK_HEIGHT,
            width:  COL_WIDTH,
            height: BLOCK_HEIGHT,
            rx: 3,
            class: 'pfd-empty-slot',
          }));
        } else {
          for (let k = 0; k < nE; k++) {
            const blockY = N_ROW_BASE_Y - BLOCK_HEIGHT - k * (BLOCK_HEIGHT + BLOCK_GAP);
            const rect = svgEl('rect', {
              x,
              y: blockY,
              width:  COL_WIDTH,
              height: BLOCK_HEIGHT,
              rx: 3,
              fill: color,
              class: 'pfd-block',
            });
            if (highlightSpec && highlightSpec.type === 'all-n') {
              rect.classList.add('highlight');
            }
            if (highlightSpec && highlightSpec.type === 'fail' && p === highlightSpec.prime) {
              // The blocks above mE in this column are the offending ones.
              if (k >= mE) rect.classList.add('highlight');
              else rect.classList.add('dim');
            }
            svg.appendChild(rect);
          }
        }

        // m row — stack upward from M_ROW_BASE_Y.
        if (mE === 0) {
          svg.appendChild(svgEl('rect', {
            x,
            y: M_ROW_BASE_Y - BLOCK_HEIGHT,
            width:  COL_WIDTH,
            height: BLOCK_HEIGHT,
            rx: 3,
            class: 'pfd-empty-slot',
          }));
        } else {
          for (let k = 0; k < mE; k++) {
            const blockY = M_ROW_BASE_Y - BLOCK_HEIGHT - k * (BLOCK_HEIGHT + BLOCK_GAP);
            const rect = svgEl('rect', {
              x,
              y: blockY,
              width:  COL_WIDTH,
              height: BLOCK_HEIGHT,
              rx: 3,
              fill: color,
              class: 'pfd-block',
            });
            // For the all-n highlight, the matching first nE blocks of m
            // visually receive the same highlight, showing that n's
            // factors "find a home" inside m.
            if (highlightSpec && highlightSpec.type === 'all-n' && k < nE) {
              rect.classList.add('highlight');
            }
            svg.appendChild(rect);
          }
        }

        // Prime label below the axis.
        const lbl = svgEl('text', {
          x: x + COL_WIDTH / 2,
          y: PRIME_LABEL_Y,
          class: 'pfd-prime-label',
          fill: color,
        });
        lbl.textContent = String(p);
        svg.appendChild(lbl);
      });

      // Edge case: both numbers are 1 (no primes). Show a friendly note.
      if (!allPrimes.length) {
        const note = svgEl('text', {
          x: svgWidth / 2,
          y: (N_ROW_BASE_Y + M_ROW_BASE_Y) / 2,
          'text-anchor': 'middle',
          class: 'pfd-row-value',
        });
        note.textContent = 'Both numbers equal 1 (empty prime factorization).';
        svg.appendChild(note);
      }
    }

    // ── Render: round header, prompt, and reset button states ─────────
    function renderRoundChrome(round) {
      counterEl.textContent = `Round ${roundIdx + 1} of ${rounds.length}`;
      scoreEl.textContent   = totalAnswered > 0
        ? `Score: ${correctCnt} / ${totalAnswered}`
        : '';
      promptNEl.textContent = round.n;
      promptMEl.textContent = round.m;

      yesBtn.disabled = false;
      noBtn.disabled  = false;
      yesBtn.classList.remove('chosen-correct', 'chosen-wrong', 'show-correct');
      noBtn.classList.remove('chosen-correct', 'chosen-wrong', 'show-correct');

      feedbackEl.classList.add('hidden');
      feedbackEl.classList.remove('correct', 'wrong');
      feedbackEl.innerHTML = '';

      nextBtn.classList.add('hidden');
      nextBtn.disabled = false;
      nextBtn.textContent = (roundIdx === rounds.length - 1)
        ? 'See summary →'
        : 'Next round →';
    }

    function renderRound() {
      summaryEl.classList.add('hidden');
      const round = roundData[roundIdx];
      renderRoundChrome(round);
      answered = false;
      renderViz(round, null);
    }

    // ── Answer handling ───────────────────────────────────────────────
    function handleAnswer(saidYes) {
      if (answered) return;
      answered = true;
      totalAnswered++;

      const round = roundData[roundIdx];
      const truth = round.verdict.divides;
      const isCorrect = (saidYes === truth);
      if (isCorrect) correctCnt++;

      // Mark buttons.
      yesBtn.disabled = true;
      noBtn.disabled  = true;
      const chosenBtn = saidYes ? yesBtn : noBtn;
      const otherBtn  = saidYes ? noBtn : yesBtn;
      chosenBtn.classList.add(isCorrect ? 'chosen-correct' : 'chosen-wrong');
      if (!isCorrect) {
        // Mark the actual correct button so the student sees it.
        otherBtn.classList.add('show-correct');
      }

      // Update score badge.
      scoreEl.textContent = `Score: ${correctCnt} / ${totalAnswered}`;

      // Highlight: same visual whether the student was right or wrong, so
      // a wrong answer still gets the explanation.
      const highlightSpec = truth
        ? { type: 'all-n' }
        : { type: 'fail', prime: round.verdict.failingPrime };
      renderViz(round, highlightSpec);

      // Feedback text.
      const nFactStr = factorizationString(round.nFact.primes, round.nFact.exps);
      const mFactStr = factorizationString(round.mFact.primes, round.mFact.exps);
      let body;
      if (truth) {
        body = `<strong>Correct answer: yes, ${round.n} divides ${round.m}.</strong> `
             + `Every prime in <em>n</em> appears at least as many times in <em>m</em>: `
             + `<em>n</em> = ${nFactStr}, <em>m</em> = ${mFactStr}.`;
      } else {
        const p = round.verdict.failingPrime;
        const ne = round.nFact.exps[p] || 0;
        const me = round.mFact.exps[p] || 0;
        const surplus = ne - me;
        body = `<strong>Correct answer: no, ${round.n} does not divide ${round.m}.</strong> `
             + `In the prime ${p} column, <em>n</em> has ${ne} factor${ne === 1 ? '' : 's'} of ${p} `
             + `but <em>m</em> has only ${me}, so ${surplus === 1 ? `one extra ${p}` : `${surplus} extra ${p}'s`} in <em>n</em> ${surplus === 1 ? 'has' : 'have'} nowhere to go. `
             + `(<em>n</em> = ${nFactStr}, <em>m</em> = ${mFactStr}.)`;
      }
      const lead = isCorrect
        ? '<strong>You got it.</strong> '
        : '<strong>Not quite.</strong> ';
      feedbackEl.innerHTML = lead + body;
      feedbackEl.classList.toggle('correct', isCorrect);
      feedbackEl.classList.toggle('wrong',  !isCorrect);
      feedbackEl.classList.remove('hidden');

      // Reveal next/finish.
      nextBtn.classList.remove('hidden');
    }

    function showSummary() {
      summaryHead.textContent = `You got ${correctCnt} of ${rounds.length} correct.`;
      let detail;
      if (correctCnt === rounds.length) {
        detail = 'Nice work — every round answered correctly.';
      } else if (correctCnt === 0) {
        detail = 'Try again — review the highlighted columns from each round.';
      } else {
        detail = 'Review any rounds you missed by restarting below.';
      }
      summaryDet.textContent = detail;
      summaryEl.classList.remove('hidden');
      // Tidy up: hide the answer/feedback/next chrome under the summary.
      feedbackEl.classList.add('hidden');
      nextBtn.classList.add('hidden');
      yesBtn.disabled = true;
      noBtn.disabled  = true;
    }

    // ── Event wiring ──────────────────────────────────────────────────
    yesBtn.addEventListener('click', () => handleAnswer(true));
    noBtn.addEventListener('click',  () => handleAnswer(false));

    nextBtn.addEventListener('click', () => {
      if (roundIdx < rounds.length - 1) {
        roundIdx++;
        renderRound();
      } else {
        showSummary();
      }
    });

    restartBtn.addEventListener('click', () => {
      roundIdx     = 0;
      correctCnt   = 0;
      totalAnswered = 0;
      renderRound();
    });

    // ── Initial render ────────────────────────────────────────────────
    renderRound();
  }

  // ── Bootstrap: mount every .pfd-widget on the page (idempotent) ────────
  function bootAll() {
    document.querySelectorAll('.pfd-widget').forEach((root) => {
      if (root.dataset.pfdMounted === '1') return;
      root.dataset.pfdMounted = '1';
      mountWidget(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAll);
  } else {
    bootAll();
  }
}());
