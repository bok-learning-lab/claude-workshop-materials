(function () {
  'use strict';

  // =========================================================================
  // Monty Hall LoTP Partition Visualizer — single-file widget logic.
  //
  // Each <div class="mhl-widget" data-problem='{...}'> on the page is mounted
  // as an independent instance. State and DOM refs are scoped per-instance.
  // Script is idempotent — safe to load multiple times.
  //
  // data-problem JSON keys (all optional):
  //   title    (string)
  //   intro    (HTML string)
  //   defaultG (int 2..9) — initial number of goats
  //   defaultP (int 1..5) — initial number of prizes
  //
  // Pedagogy: visualize the LoTP decomposition of P(win | switch) for
  // generalized Monty Hall. Always-on side-by-side layout: branch A = "you
  // initially chose a prize"; branch B = "you initially chose a goat".
  // Each branch shows the door row with your pick + Monty's reveal marked,
  // plus the per-branch conditional probabilities. The footer combines via
  // LoTP and surfaces the closed-form answer.
  // =========================================================================

  const G_MIN = 2, G_MAX = 9;
  const P_MIN = 1, P_MAX = 5;

  // ----- icons (reused from W31's vocabulary so the two Monty Hall widgets
  //              read visually consistent across the course) ----------------
  const GOAT_SVG =
    '<svg class="mhl-icon mhl-icon-goat" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" aria-label="goat">' +
      '<path d="M21 18 L17 5 Q20 12 24 17 Z" fill="#5a4a3a" stroke="#3d342a" stroke-width="0.5"/>' +
      '<path d="M39 18 L43 5 Q40 12 36 17 Z" fill="#5a4a3a" stroke="#3d342a" stroke-width="0.5"/>' +
      '<ellipse cx="30" cy="34" rx="14" ry="16" fill="#cdbda7" stroke="#5a4a3a" stroke-width="0.8"/>' +
      '<ellipse cx="30" cy="42" rx="6.5" ry="5" fill="#a89580" opacity="0.55"/>' +
      '<ellipse cx="25" cy="31" rx="2" ry="2.5" fill="#1a1612"/>' +
      '<ellipse cx="35" cy="31" rx="2" ry="2.5" fill="#1a1612"/>' +
      '<ellipse cx="25.5" cy="30.5" rx="0.6" ry="0.8" fill="#fff"/>' +
      '<ellipse cx="35.5" cy="30.5" rx="0.6" ry="0.8" fill="#fff"/>' +
      '<ellipse cx="27.2" cy="42.5" rx="0.9" ry="1.1" fill="#3d342a"/>' +
      '<ellipse cx="32.8" cy="42.5" rx="0.9" ry="1.1" fill="#3d342a"/>' +
      '<path d="M27 49 Q30 55 33 49 Q33 52 30 54 Q27 52 27 49 Z" fill="#cdbda7" stroke="#5a4a3a" stroke-width="0.5"/>' +
    '</svg>';

  const PRIZE_SVG =
    '<svg class="mhl-icon mhl-icon-prize" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" aria-label="prize">' +
      '<rect x="10" y="26" width="40" height="28" fill="#c4506e" stroke="#8b3550" stroke-width="1"/>' +
      '<rect x="27" y="26" width="6" height="28" fill="#f4ede4"/>' +
      '<rect x="10" y="36" width="40" height="6" fill="#f4ede4"/>' +
      '<rect x="8" y="22" width="44" height="5" fill="#a64058" stroke="#8b3550" stroke-width="1"/>' +
      '<ellipse cx="21" cy="20" rx="6.5" ry="4.5" fill="#f4ede4" stroke="#b8841d" stroke-width="0.8"/>' +
      '<ellipse cx="39" cy="20" rx="6.5" ry="4.5" fill="#f4ede4" stroke="#b8841d" stroke-width="0.8"/>' +
      '<circle cx="30" cy="20" r="3.2" fill="#b8841d" stroke="#8b6914" stroke-width="0.6"/>' +
      '<path d="M28 4 Q32 4 30 18 Q31 14 33 13" fill="none" stroke="#b8841d" stroke-width="1"/>' +
      '<path d="M32 4 Q28 4 30 18 Q29 14 27 13" fill="none" stroke="#b8841d" stroke-width="1"/>' +
    '</svg>';

  // ----- number formatting helpers ----------------------------------------
  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { const t = b; b = a % b; a = t; }
    return a || 1;
  }

  // Format an integer ratio a/b. Reduces if reducible; if the reduced form
  // equals 0 or 1, returns those directly. Returns both the reduced form
  // and the decimal in parens.
  function fmtRatio(a, b) {
    if (b === 0) return '—';
    if (a === 0) return '0';
    if (a === b) return '1';
    const g = gcd(a, b);
    const an = a / g, bn = b / g;
    return an + '/' + bn;
  }

  function fmtDecimal(v, places) {
    if (!isFinite(v)) return '–';
    const p = places == null ? 4 : places;
    let s = Number(v).toFixed(p);
    s = s.replace(/0+$/, '').replace(/\.$/, '');
    return s;
  }

  // ----- DOM build helpers ------------------------------------------------
  function el(tag, opts) {
    const node = document.createElement(tag);
    if (!opts) return node;
    if (opts.cls)  node.className = opts.cls;
    if (opts.text != null) node.textContent = opts.text;
    if (opts.html != null) node.innerHTML = opts.html;
    if (opts.attrs) {
      for (const k in opts.attrs) {
        if (Object.prototype.hasOwnProperty.call(opts.attrs, k)) {
          node.setAttribute(k, opts.attrs[k]);
        }
      }
    }
    return node;
  }

  // ----- per-instance mount -----------------------------------------------
  function mount(root) {
    if (root.__mhlMounted) return;
    root.__mhlMounted = true;

    let cfg = {};
    const raw = root.getAttribute('data-problem');
    if (raw) {
      try { cfg = JSON.parse(raw) || {}; }
      catch (e) { console.warn('[mhl-widget] invalid data-problem JSON', e); }
    }

    const state = {
      G: clamp(int(cfg.defaultG, 2), G_MIN, G_MAX),
      P: clamp(int(cfg.defaultP, 1), P_MIN, P_MAX)
    };

    function int(v, fallback) {
      const n = Math.floor(Number(v));
      return isFinite(n) ? n : fallback;
    }
    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

    // ----- top-level scaffold ---------------------------------------------
    root.innerHTML = '';

    if (cfg.title) root.appendChild(el('div', { cls: 'mhl-title', text: cfg.title }));
    if (cfg.intro) root.appendChild(el('div', { cls: 'mhl-intro', html: cfg.intro }));

    // controls
    const controls = el('div', { cls: 'mhl-controls' });

    // Prizes slider
    const prizeGrp = el('div', { cls: 'mhl-control-group' });
    prizeGrp.appendChild(el('label', { text: 'Prizes (P)' }));
    const prizeRow = el('div', { cls: 'mhl-slider-row' });
    const prizeRange = el('input', { attrs: { type: 'range', min: String(P_MIN), max: String(P_MAX), step: '1' } });
    prizeRange.value = String(state.P);
    const prizeReadout = el('span', { cls: 'mhl-num-readout mhl-prize-readout', text: String(state.P) });
    prizeRow.appendChild(prizeRange);
    prizeRow.appendChild(prizeReadout);
    prizeGrp.appendChild(prizeRow);
    controls.appendChild(prizeGrp);

    // Goats slider
    const goatGrp = el('div', { cls: 'mhl-control-group' });
    goatGrp.appendChild(el('label', { text: 'Goats (G)' }));
    const goatRow = el('div', { cls: 'mhl-slider-row' });
    const goatRange = el('input', { attrs: { type: 'range', min: String(G_MIN), max: String(G_MAX), step: '1' } });
    goatRange.value = String(state.G);
    const goatReadout = el('span', { cls: 'mhl-num-readout mhl-goat-readout', text: String(state.G) });
    goatRow.appendChild(goatRange);
    goatRow.appendChild(goatReadout);
    goatGrp.appendChild(goatRow);
    controls.appendChild(goatGrp);

    // Reset button — restore the classic 3-door defaults (G=2, P=1).
    const resetBtn = el('button', { text: 'Classic (G=2, P=1)' });
    controls.appendChild(resetBtn);

    root.appendChild(controls);

    // setup summary
    const setup = el('div', { cls: 'mhl-setup' });
    root.appendChild(setup);

    // branches container
    const branchesWrap = el('div', { cls: 'mhl-branches' });
    const branchA = el('div', { cls: 'mhl-branch mhl-branch-prize' });
    const branchB = el('div', { cls: 'mhl-branch mhl-branch-goat' });
    branchesWrap.appendChild(branchA);
    branchesWrap.appendChild(branchB);
    root.appendChild(branchesWrap);

    // LoTP combination card
    const lotpCard = el('div', { cls: 'mhl-lotp' });
    root.appendChild(lotpCard);

    // legend
    const legend = el('div', { cls: 'mhl-legend' });
    legend.appendChild(legendItem('mhl-legend-prize', 'prize door'));
    legend.appendChild(legendItem('mhl-legend-goat',  'goat door'));
    legend.appendChild(legendItem('mhl-legend-pick',  'your initial pick'));
    legend.appendChild(legendItem('mhl-legend-reveal','Monty’s reveal'));
    legend.appendChild(legendItem('mhl-legend-switch','switch target'));
    root.appendChild(legend);

    function legendItem(cls, label) {
      const item = el('span', { cls: 'mhl-legend-item' });
      item.appendChild(el('span', { cls: 'mhl-legend-swatch ' + cls }));
      item.appendChild(document.createTextNode(label));
      return item;
    }

    // ----- door rendering --------------------------------------------------
    // A door is described by:
    //   kind   : 'prize' | 'goat'
    //   role   : null | 'pick' | 'revealed' | 'switch'
    //   label  : short text under the door
    function renderDoor(kind, role, label) {
      const door = el('div', { cls: 'mhl-door ' + (kind === 'prize' ? 'mhl-prize-door' : 'mhl-goat-door') });
      door.innerHTML = (kind === 'prize') ? PRIZE_SVG : GOAT_SVG;
      if (role === 'pick')     door.classList.add('mhl-door-pick');
      if (role === 'revealed') door.classList.add('mhl-door-revealed');
      if (role === 'switch')   door.classList.add('mhl-door-switch-target');
      if (label) {
        const role_el = el('span', { cls: 'mhl-door-role', text: label });
        door.appendChild(role_el);
      }
      return door;
    }

    // ----- branch builders -------------------------------------------------
    //
    // Door indexing convention:
    //   indices 0 .. P-1     = prize doors
    //   indices P .. P+G-1   = goat doors
    //
    // Branch A: "You initially chose a prize."
    //   pick = door 0 (the first prize).
    //   Monty reveals: door P (the first goat — symmetric).
    //   Remaining switch targets: doors 1..P-1 (prizes) + P+1..P+G-1 (goats).
    //
    // Branch B: "You initially chose a goat."
    //   pick = door P (the first goat).
    //   Monty reveals: door P+1 (the next goat — needs G ≥ 2, which holds).
    //   Remaining switch targets: doors 0..P-1 (prizes) + P+2..P+G-1 (goats).

    function describeDoorsBranchA(G, P) {
      const out = [];
      for (let i = 0; i < P; i++) {
        out.push({ kind: 'prize', role: (i === 0) ? 'pick' : 'switch', label: (i === 0) ? 'your pick' : 'switch?' });
      }
      for (let j = 0; j < G; j++) {
        const idx = P + j;
        const role = (j === 0) ? 'revealed' : 'switch';
        const label = (j === 0) ? 'Monty' : 'switch?';
        out.push({ kind: 'goat', role: role, label: label });
      }
      return out;
    }

    function describeDoorsBranchB(G, P) {
      const out = [];
      for (let i = 0; i < P; i++) {
        out.push({ kind: 'prize', role: 'switch', label: 'switch?' });
      }
      // first goat = your pick; second goat = Monty's reveal; remaining = switch
      for (let j = 0; j < G; j++) {
        let role, label;
        if (j === 0)       { role = 'pick';     label = 'your pick'; }
        else if (j === 1)  { role = 'revealed'; label = 'Monty';     }
        else               { role = 'switch';   label = 'switch?';   }
        out.push({ kind: 'goat', role: role, label: label });
      }
      return out;
    }

    function renderDoorsRow(doors) {
      const wrap = el('div', { cls: 'mhl-doors-wrap' });
      const row = el('div', { cls: 'mhl-doors' });
      doors.forEach(function (d) {
        row.appendChild(renderDoor(d.kind, d.role, d.label));
      });
      wrap.appendChild(row);
      return wrap;
    }

    // ----- setup row -------------------------------------------------------
    function renderSetup() {
      setup.innerHTML = '';
      const G = state.G, P = state.P;
      const N = G + P;

      const line1 = el('div', { cls: 'mhl-setup-line' });
      line1.innerHTML =
        'Sample space: <span class="mhl-prize-text">' + P + ' prize ' + (P === 1 ? 'door' : 'doors') + '</span> + ' +
        '<span class="mhl-goat-text">' + G + ' goat ' + (G === 1 ? 'door' : 'doors') + '</span> = <strong>' + N + ' doors</strong>. ' +
        'You pick one uniformly at random.';
      setup.appendChild(line1);

      const line2 = el('div', { cls: 'mhl-setup-line' });
      line2.innerHTML =
        '<em>Partition on your initial pick:</em>' +
        '   P(initial pick is a prize) = ' +
        '<span class="mhl-prize-text">' + P + '/' + N + ' = ' + fmtDecimal(P / N, 4) + '</span>;' +
        '   P(initial pick is a goat) = ' +
        '<span class="mhl-goat-text">' + G + '/' + N + ' = ' + fmtDecimal(G / N, 4) + '</span>.';
      setup.appendChild(line2);

      // door display row (no roles assigned — just the sample space)
      const allDoors = [];
      for (let i = 0; i < P; i++) allDoors.push({ kind: 'prize', role: null, label: null });
      for (let j = 0; j < G; j++) allDoors.push({ kind: 'goat',  role: null, label: null });
      setup.appendChild(renderDoorsRow(allDoors));
    }

    // ----- branch rendering -----------------------------------------------
    function renderBranch(panel, kind, doors, math) {
      panel.innerHTML = '';
      const title = el('div', { cls: 'mhl-branch-title' });
      if (kind === 'prize') {
        title.innerHTML = 'Branch A — you initially chose a <span class="mhl-prize-text">prize</span>';
      } else {
        title.innerHTML = 'Branch B — you initially chose a <span class="mhl-goat-text">goat</span>';
      }
      panel.appendChild(title);

      const probLine = el('div', { cls: 'mhl-branch-prob' });
      probLine.innerHTML =
        'P(this branch) = ' +
        '<span class="mhl-value">' + math.branchProbStr + '</span> = ' +
        fmtDecimal(math.branchProb, 4);
      panel.appendChild(probLine);

      panel.appendChild(renderDoorsRow(doors));

      // post-Monty math summary
      const mathBlock = el('div', { cls: 'mhl-branch-math' });
      const line1 = el('div', { cls: 'mhl-math-line' });
      line1.innerHTML =
        '<span class="mhl-math-label">After Monty’s reveal:</span>' +
        '<span class="mhl-math-rhs">' + math.remainingDoorsStr + ' doors remain (not your pick)</span>';
      mathBlock.appendChild(line1);

      const line2 = el('div', { cls: 'mhl-math-line' });
      line2.innerHTML =
        '<span class="mhl-math-label">… of which <span class="mhl-prize-text">prizes</span> = ' + math.remainingPrizes + ', <span class="mhl-goat-text">goats</span> = ' + math.remainingGoats + ':</span>' +
        '<span class="mhl-math-rhs"></span>';
      mathBlock.appendChild(line2);

      const stayLine = el('div', { cls: 'mhl-math-line mhl-math-result' });
      stayLine.innerHTML =
        '<span class="mhl-math-label"><span class="mhl-stay-tag">STAY</span>P(win | stay, this branch)</span>' +
        '<span class="mhl-math-rhs">= ' + math.stayCondStr + '</span>';
      mathBlock.appendChild(stayLine);

      const switchLine = el('div', { cls: 'mhl-math-line mhl-math-result' });
      switchLine.innerHTML =
        '<span class="mhl-math-label"><span class="mhl-switch-tag">SWITCH</span>P(win | switch, this branch)</span>' +
        '<span class="mhl-math-rhs">= ' + math.switchCondStr + ' = ' + fmtDecimal(math.switchCond, 4) + '</span>';
      mathBlock.appendChild(switchLine);

      panel.appendChild(mathBlock);
    }

    function computeMathA(G, P) {
      // Branch A: initial pick is a prize.
      const N = G + P;
      const branchProb = P / N;
      const branchProbStr = P + '/' + N;
      // Switch target set = (P - 1) remaining prizes + (G - 1) remaining goats
      // = P + G - 2 = N - 2.
      const remainingDoors = N - 2;
      const remainingPrizes = P - 1;
      const remainingGoats  = G - 1;
      // P(win | stay, A) = 1   (your pick is a prize)
      const stayCondStr = '1';
      // P(win | switch, A) = (P-1) / (P+G-2)
      const switchCond = (remainingDoors > 0) ? remainingPrizes / remainingDoors : 0;
      const switchCondStr = (remainingDoors === 0)
        ? '—'
        : remainingPrizes + '/' + remainingDoors;
      return {
        branchProb: branchProb,
        branchProbStr: branchProbStr,
        remainingDoors: remainingDoors,
        remainingDoorsStr: String(remainingDoors),
        remainingPrizes: remainingPrizes,
        remainingGoats: remainingGoats,
        stayCondStr: stayCondStr,
        switchCond: switchCond,
        switchCondStr: switchCondStr
      };
    }

    function computeMathB(G, P) {
      // Branch B: initial pick is a goat.
      const N = G + P;
      const branchProb = G / N;
      const branchProbStr = G + '/' + N;
      const remainingDoors = N - 2;
      const remainingPrizes = P;
      const remainingGoats  = G - 2;
      // P(win | stay, B) = 0
      const stayCondStr = '0';
      const switchCond = (remainingDoors > 0) ? remainingPrizes / remainingDoors : 0;
      const switchCondStr = (remainingDoors === 0)
        ? '—'
        : remainingPrizes + '/' + remainingDoors;
      return {
        branchProb: branchProb,
        branchProbStr: branchProbStr,
        remainingDoors: remainingDoors,
        remainingDoorsStr: String(remainingDoors),
        remainingPrizes: remainingPrizes,
        remainingGoats: remainingGoats,
        stayCondStr: stayCondStr,
        switchCond: switchCond,
        switchCondStr: switchCondStr
      };
    }

    // ----- LoTP combination card ------------------------------------------
    function renderLotp(mathA, mathB) {
      const G = state.G, P = state.P;
      const N = G + P;
      lotpCard.innerHTML = '';
      lotpCard.appendChild(el('div', { cls: 'mhl-lotp-title', text: 'LoTP combination' }));

      const formulas = el('div', { cls: 'mhl-lotp-formula-block' });
      // SWITCH formula
      const ln1 = el('div', { cls: 'mhl-lotp-formula-line' });
      ln1.innerHTML =
        'P(win | switch) = P(A) · P(win | switch, A) + P(B) · P(win | switch, B)';
      formulas.appendChild(ln1);

      const ln2 = el('div', { cls: 'mhl-lotp-formula-line' });
      ln2.innerHTML =
        '&nbsp;&nbsp;= (' + mathA.branchProbStr + ') · (' + mathA.switchCondStr + ')' +
        ' + (' + mathB.branchProbStr + ') · (' + mathB.switchCondStr + ')';
      formulas.appendChild(ln2);

      // numerator-style combined fraction
      const switchTotalNum = (mathA.remainingPrizes * mathB.remainingDoors + mathB.remainingPrizes * mathA.remainingDoors === 0)
        ? '0'
        : null;
      // closed form: P × (P+G-1) / [N × (N-2)]
      const closedNum = P * (N - 1);
      const closedDen = N * (N - 2);
      const switchTotalDecimal = (closedDen > 0) ? closedNum / closedDen : 0;
      const closedRatio = (closedDen > 0)
        ? fmtRatio(closedNum, closedDen)
        : '—';

      const ln3 = el('div', { cls: 'mhl-lotp-formula-line' });
      ln3.innerHTML =
        '&nbsp;&nbsp;= P · (P + G − 1) / [N · (N − 2)]' +
        ' = ' + closedNum + '/' + closedDen +
        ' = <strong>' + closedRatio + '</strong>' +
        ' ≈ ' + fmtDecimal(switchTotalDecimal, 4);
      formulas.appendChild(ln3);

      // STAY formula
      const ln4 = el('div', { cls: 'mhl-lotp-formula-line', attrs: { style: 'margin-top: 8px;' } });
      ln4.innerHTML =
        'P(win | stay) = P(A) · 1 + P(B) · 0 = ' + P + '/' + N +
        ' = <strong>' + fmtRatio(P, N) + '</strong>' +
        ' ≈ ' + fmtDecimal(P / N, 4);
      formulas.appendChild(ln4);

      lotpCard.appendChild(formulas);

      // final two cards (switch / stay)
      const final = el('div', { cls: 'mhl-lotp-final' });

      const stayCard = el('div', { cls: 'mhl-final-card' });
      stayCard.appendChild(el('div', { cls: 'mhl-final-label', text: 'P(win | STAY)' }));
      stayCard.appendChild(el('div', { cls: 'mhl-final-value', text: fmtRatio(P, N) + '  ≈ ' + fmtDecimal(P / N, 4) }));
      stayCard.appendChild(el('div', { cls: 'mhl-final-detail', text: 'just the prior probability of picking a prize' }));
      final.appendChild(stayCard);

      const switchCard = el('div', { cls: 'mhl-final-card mhl-final-switch' });
      switchCard.appendChild(el('div', { cls: 'mhl-final-label', text: 'P(win | SWITCH)' }));
      switchCard.appendChild(el('div', { cls: 'mhl-final-value', text: closedRatio + '  ≈ ' + fmtDecimal(switchTotalDecimal, 4) }));
      // friendly description
      let detail;
      if (switchTotalDecimal > P / N + 1e-9) {
        detail = 'switching wins more often than staying';
      } else if (Math.abs(switchTotalDecimal - P / N) < 1e-9) {
        detail = 'switching and staying are equally likely to win';
      } else {
        detail = 'staying wins more often than switching';
      }
      switchCard.appendChild(el('div', { cls: 'mhl-final-detail', text: detail }));
      final.appendChild(switchCard);

      lotpCard.appendChild(final);
    }

    // ----- main render -----------------------------------------------------
    function renderAll() {
      renderSetup();
      const G = state.G, P = state.P;
      const doorsA = describeDoorsBranchA(G, P);
      const doorsB = describeDoorsBranchB(G, P);
      const mathA  = computeMathA(G, P);
      const mathB  = computeMathB(G, P);
      renderBranch(branchA, 'prize', doorsA, mathA);
      renderBranch(branchB, 'goat',  doorsB, mathB);
      renderLotp(mathA, mathB);
    }

    // ----- wire controls ---------------------------------------------------
    prizeRange.addEventListener('input', function () {
      state.P = clamp(int(prizeRange.value, 1), P_MIN, P_MAX);
      prizeReadout.textContent = String(state.P);
      renderAll();
    });
    goatRange.addEventListener('input', function () {
      state.G = clamp(int(goatRange.value, 2), G_MIN, G_MAX);
      goatReadout.textContent = String(state.G);
      renderAll();
    });
    resetBtn.addEventListener('click', function () {
      state.G = 2;
      state.P = 1;
      prizeRange.value = '1';
      goatRange.value = '2';
      prizeReadout.textContent = '1';
      goatReadout.textContent = '2';
      renderAll();
    });

    renderAll();
  }

  // ----- bootstrapping ----------------------------------------------------
  function mountAll() {
    const nodes = document.querySelectorAll('.mhl-widget');
    Array.prototype.forEach.call(nodes, function (n) {
      try { mount(n); }
      catch (e) { console.error('[mhl-widget] mount failed', e); }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountAll);
  } else {
    mountAll();
  }

  // ----- self-tests (run once per script load) ---------------------------
  if (!window.__mhlSelfTested) {
    window.__mhlSelfTested = true;
    (function selfTest() {
      function assert(cond, msg) {
        if (!cond) console.error('[mhl-widget self-test] FAIL:', msg);
      }
      function lotpSwitch(G, P) {
        const N = G + P;
        // P(win | switch) = (P/N) * ((P-1)/(N-2)) + (G/N) * (P/(N-2))
        if (N - 2 <= 0) return 0;
        return (P / N) * ((P - 1) / (N - 2)) + (G / N) * (P / (N - 2));
      }
      function closedSwitch(G, P) {
        const N = G + P;
        if (N - 2 <= 0 || N <= 0) return 0;
        return P * (N - 1) / (N * (N - 2));
      }
      // Classic 3-door: 2/3
      assert(Math.abs(lotpSwitch(2, 1) - 2/3)    < 1e-12, 'classic 3-door: 2/3');
      assert(Math.abs(closedSwitch(2, 1) - 2/3)  < 1e-12, 'closed-form classic: 2/3');
      // 5-door 1-prize 4-goat: 4/15
      assert(Math.abs(lotpSwitch(4, 1) - 4/15)   < 1e-12, '5-door 1-prize: 4/15');
      assert(Math.abs(closedSwitch(4, 1) - 4/15) < 1e-12, 'closed-form 5-door 1-prize: 4/15');
      // 4 goats + 2 prizes: P=2, G=4, N=6 → P(win|switch) = 2·5 / (6·4) = 10/24 = 5/12
      assert(Math.abs(lotpSwitch(4, 2) - 5/12)   < 1e-12, '6-door 2-prize: 5/12');
      assert(Math.abs(closedSwitch(4, 2) - 5/12) < 1e-12, 'closed-form 6-door 2-prize: 5/12');
      // 9 goats + 1 prize: 1 · 9 / (10 · 8) = 9/80
      assert(Math.abs(lotpSwitch(9, 1) - 9/80)   < 1e-12, '10-door 1-prize: 9/80');
      assert(Math.abs(closedSwitch(9, 1) - 9/80) < 1e-12, 'closed-form 10-door 1-prize: 9/80');
    })();
  }
})();
