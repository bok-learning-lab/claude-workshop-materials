(function () {
  'use strict';

  // =========================================================================
  // MONTY HALL SIMULATOR (W31) — embeddable widget
  //
  // Segment 8.1 Activity 16. Three modes:
  //   • Single-game — pick a door, watch Monty open a goat, decide switch
  //                   or stay; running tally of switch / stay wins.
  //   • Monte Carlo — pick a strategy, run 10–10000 trials, see the
  //                   empirical win rate converge with a running-rate plot.
  //   • N-door      — same as Monte Carlo with a door-count slider (3–20)
  //                   so the (N-1)/N asymmetry becomes visible (the 2026
  //                   lecture's 10-door demo lives here).
  //
  // A "Show the math" toggle reveals the Bayes-formula derivation alongside
  // the simulation, adapted to the current door count.
  //
  // URL params (read once at mount): ?mode=…&doors=…&trials=…&strategy=…
  // Per-instance data-problem.defaultMode overrides URL params.
  // =========================================================================

  const SVG_NS = 'http://www.w3.org/2000/svg';
  let widgetSeq = 0;

  // Inline SVG icons for the graphical reveal. Drawn at viewBox 0 0 60 60
  // and scaled to fill whatever container they're dropped into.
  const GOAT_SVG =
    '<svg class="mhs-icon mhs-icon-goat" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" aria-label="goat">' +
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
    '<svg class="mhs-icon mhs-icon-prize" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" aria-label="prize">' +
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

  const TRIAL_OPTIONS = [10, 100, 500, 1000, 5000, 10000];

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function fmtFraction(v, places) {
    const p = (places == null) ? 4 : places;
    let s = (Number(v) || 0).toFixed(p);
    s = s.replace(/0+$/, '').replace(/\.$/, '');
    if (s === '' || s === '-' || s === '-.') s = '0';
    return s;
  }
  function fmtPercent(v, places) {
    return ((Number(v) || 0) * 100).toFixed(places == null ? 1 : places) + '%';
  }

  function svgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    if (attrs) for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  // Pick which goat door Monty opens for the single-game animation.
  // Monty must open a door that is neither the contestant's pick nor the
  // prize. With 3 doors he has either 1 or 2 such doors; pick uniformly.
  // For N doors, return ALL goat doors he opens (he opens N-2 of them).
  function montyOpens(doors, prize, pick) {
    const opts = [];
    for (let d = 0; d < doors; d++) {
      if (d !== pick && d !== prize) opts.push(d);
    }
    // Shuffle in place.
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = opts[i]; opts[i] = opts[j]; opts[j] = tmp;
    }
    // Monty opens (doors - 2) goat doors. opts.length is either
    // (doors - 1) (when pick === prize, no prize in opts) or (doors - 2)
    // (when pick !== prize). In the first case we take the first
    // (doors - 2); in the second we take all of them.
    return opts.slice(0, doors - 2);
  }

  function simulateMonteCarlo(doors, trials, strategy) {
    let cumWins = 0;
    const cumWinsArr = new Array(trials);
    for (let t = 0; t < trials; t++) {
      const prize = Math.floor(Math.random() * doors);
      const pick = Math.floor(Math.random() * doors);
      const won = (strategy === 'switch') ? (pick !== prize) : (pick === prize);
      if (won) cumWins++;
      cumWinsArr[t] = cumWins;
    }
    return { cumWinsArr: cumWinsArr, finalRate: cumWins / trials };
  }

  function makeSpan(cls, text) {
    const s = document.createElement('span');
    s.className = cls;
    s.textContent = text;
    return s;
  }

  function mountWidget(root) {
    let problem = {};
    try {
      problem = JSON.parse(root.dataset.problem || '{}');
    } catch (e) {
      console.error('monty-hall-simulator: invalid data-problem JSON', e);
    }
    const titleText = (typeof problem.title === 'string' && problem.title.length)
      ? problem.title : 'Monty Hall Simulator';
    const introHtml = (typeof problem.intro === 'string') ? problem.intro : '';

    widgetSeq++;
    const instanceId = 'mhs-' + widgetSeq;

    // ── State ────────────────────────────────────────────────────────────
    let mode = 'single';                       // 'single' | 'sixDoor' | 'monteCarlo' | 'ndoor'
    let nDoors = 10;                           // for ndoor mode
    let trials = 1000;                         // for monteCarlo / ndoor
    let strategy = 'switch';                   // for monteCarlo / ndoor
    let mathOpen = false;                      // show-the-math toggle

    // Single-game state.
    let sgState = 'idle';                      // 'idle' | 'picked' | 'await' | 'revealed'
    let sgPrize = -1;
    let sgPick = -1;
    let sgOpened = [];                         // door indices Monty opened
    let sgRemaining = -1;                      // the one closed door other than pick
    let switchWinsTally = 0, switchPlaysTally = 0;
    let stayWinsTally = 0, stayPlaysTally = 0;

    // Monte Carlo / N-door results.
    let mcResult = null;                       // { cumWinsArr, finalRate, doors, trials, strategy } | null

    // URL-param prefill.
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has('mode')) {
        const v = params.get('mode');
        if (v === 'single' || v === 'sixDoor' || v === 'monteCarlo' || v === 'ndoor') mode = v;
      }
      if (params.has('doors')) nDoors = clamp(Math.floor(Number(params.get('doors'))), 3, 20);
      if (params.has('trials')) {
        const v = Math.floor(Number(params.get('trials')));
        if (TRIAL_OPTIONS.indexOf(v) !== -1) trials = v;
      }
      if (params.has('strategy')) {
        const v = params.get('strategy');
        if (v === 'switch' || v === 'stay') strategy = v;
      }
    } catch (e) { /* no-op */ }

    // Per-instance defaultMode override.
    if (problem.defaultMode === 'single' || problem.defaultMode === 'sixDoor' ||
        problem.defaultMode === 'monteCarlo' || problem.defaultMode === 'ndoor') {
      mode = problem.defaultMode;
    }

    // ── DOM scaffold ─────────────────────────────────────────────────────
    root.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'mhs-header';
    {
      const h = document.createElement('h2');
      h.appendChild(document.createTextNode(titleText + ' '));
      h.appendChild(makeSpan('mhs-subtitle', 'play, simulate, and watch the empirical 2/3 emerge'));
      header.appendChild(h);
    }
    root.appendChild(header);

    if (introHtml) {
      const intro = document.createElement('div');
      intro.className = 'mhs-intro';
      intro.innerHTML = introHtml;
      root.appendChild(intro);
    }

    // Tab strip.
    const tabs = document.createElement('div');
    tabs.className = 'mhs-tabs';
    const tabSingle = document.createElement('button');
    tabSingle.type = 'button'; tabSingle.className = 'mhs-tab';
    tabSingle.textContent = '3-door game';
    const tabSix = document.createElement('button');
    tabSix.type = 'button'; tabSix.className = 'mhs-tab';
    tabSix.textContent = '6-door game';
    const tabMc = document.createElement('button');
    tabMc.type = 'button'; tabMc.className = 'mhs-tab';
    tabMc.textContent = 'Monte Carlo';
    const tabNd = document.createElement('button');
    tabNd.type = 'button'; tabNd.className = 'mhs-tab';
    tabNd.textContent = 'N-door variant';
    tabs.appendChild(tabSingle);
    tabs.appendChild(tabSix);
    tabs.appendChild(tabMc);
    tabs.appendChild(tabNd);
    root.appendChild(tabs);

    // Panel container — re-rendered when the mode changes.
    const panel = document.createElement('div');
    panel.className = 'mhs-panel';
    root.appendChild(panel);

    // Show-the-math card (shared across all modes).
    const mathCard = document.createElement('div');
    mathCard.className = 'mhs-math-card';
    const mathTitleRow = document.createElement('div');
    mathTitleRow.className = 'mhs-math-title-row';
    mathTitleRow.appendChild(makeSpan('mhs-math-title', 'Show the math'));
    const mathToggleBtn = document.createElement('button');
    mathToggleBtn.type = 'button'; mathToggleBtn.className = 'mhs-math-toggle';
    mathToggleBtn.textContent = 'show';
    mathTitleRow.appendChild(mathToggleBtn);
    mathCard.appendChild(mathTitleRow);
    const mathBody = document.createElement('div');
    mathBody.className = 'mhs-math-body';
    mathBody.style.display = 'none';
    mathCard.appendChild(mathBody);
    root.appendChild(mathCard);

    // ── Render ───────────────────────────────────────────────────────────
    function renderTabs() {
      tabSingle.classList.toggle('mhs-tab-active', mode === 'single');
      tabSix.classList.toggle('mhs-tab-active', mode === 'sixDoor');
      tabMc.classList.toggle('mhs-tab-active', mode === 'monteCarlo');
      tabNd.classList.toggle('mhs-tab-active', mode === 'ndoor');
    }

    function currentDoorCount() {
      if (mode === 'sixDoor') return 6;
      if (mode === 'ndoor') return nDoors;
      return 3;
    }

    function renderPanel() {
      panel.innerHTML = '';
      if (mode === 'single') renderSingleGamePanel(3);
      else if (mode === 'sixDoor') renderSingleGamePanel(6);
      else renderMonteCarloPanel();
    }

    // ── Single-game UI ──────────────────────────────────────────────────
    // Used by both the 3-door game and the 6-door variant. Monty opens
    // (doorsCount − 2) goat doors, leaving the contestant's pick + one
    // alternative for the switch / stay decision.
    function renderSingleGamePanel(doorsCount) {
      // Reset the per-game state for this instance.
      sgState = 'idle';
      sgPrize = -1; sgPick = -1; sgOpened = []; sgRemaining = -1;

      const title = document.createElement('div');
      title.className = 'mhs-panel-title';
      title.textContent = (doorsCount === 3)
        ? '3-door game — pick a door, watch Monty open a goat, decide'
        : '6-door game — pick a door, watch Monty open ' + (doorsCount - 2) +
          ' goats, then choose to switch or stay';
      panel.appendChild(title);

      const status = document.createElement('div');
      status.className = 'mhs-status';
      panel.appendChild(status);

      const doorsRow = document.createElement('div');
      doorsRow.className = 'mhs-doors-row' +
        (doorsCount > 3 ? ' mhs-doors-many' : '');
      const doors = [];
      for (let i = 0; i < doorsCount; i++) {
        const d = document.createElement('div');
        d.className = 'mhs-door';
        d.dataset.idx = String(i);
        doorsRow.appendChild(d);
        doors.push(d);
      }
      panel.appendChild(doorsRow);

      const decisionRow = document.createElement('div');
      decisionRow.className = 'mhs-decision-row';
      const switchBtn = document.createElement('button');
      switchBtn.type = 'button'; switchBtn.className = 'mhs-decision-btn';
      switchBtn.textContent = 'Switch';
      const stayBtn = document.createElement('button');
      stayBtn.type = 'button'; stayBtn.className = 'mhs-decision-btn';
      stayBtn.textContent = 'Stay';
      decisionRow.appendChild(switchBtn);
      decisionRow.appendChild(stayBtn);
      decisionRow.style.display = 'none';
      panel.appendChild(decisionRow);

      const playAgainRow = document.createElement('div');
      playAgainRow.className = 'mhs-decision-row';
      const playAgainBtn = document.createElement('button');
      playAgainBtn.type = 'button'; playAgainBtn.className = 'mhs-decision-btn';
      playAgainBtn.textContent = 'Play again';
      playAgainRow.appendChild(playAgainBtn);
      playAgainRow.style.display = 'none';
      panel.appendChild(playAgainRow);

      // Tally cards.
      const tally = document.createElement('div');
      tally.className = 'mhs-tally';
      const switchCard = document.createElement('div');
      switchCard.className = 'mhs-tally-card';
      switchCard.appendChild(makeSpan('mhs-tally-title', 'Switch strategy'));
      const switchRate = document.createElement('div');
      switchRate.className = 'mhs-tally-rate';
      switchRate.textContent = '—';
      switchCard.appendChild(switchRate);
      const switchDetail = document.createElement('div');
      switchDetail.className = 'mhs-tally-detail';
      switchDetail.textContent = 'no plays yet';
      switchCard.appendChild(switchDetail);
      tally.appendChild(switchCard);

      const stayCard = document.createElement('div');
      stayCard.className = 'mhs-tally-card';
      stayCard.appendChild(makeSpan('mhs-tally-title', 'Stay strategy'));
      const stayRate = document.createElement('div');
      stayRate.className = 'mhs-tally-rate';
      stayRate.textContent = '—';
      stayCard.appendChild(stayRate);
      const stayDetail = document.createElement('div');
      stayDetail.className = 'mhs-tally-detail';
      stayDetail.textContent = 'no plays yet';
      stayCard.appendChild(stayDetail);
      tally.appendChild(stayCard);

      // Reset tally button.
      const resetTallyRow = document.createElement('div');
      resetTallyRow.className = 'mhs-controls';
      resetTallyRow.style.justifyContent = 'flex-end';
      resetTallyRow.style.marginTop = '10px';
      const resetTallyBtn = document.createElement('button');
      resetTallyBtn.type = 'button'; resetTallyBtn.className = 'mhs-reset-btn';
      resetTallyBtn.textContent = 'Reset tally';
      resetTallyRow.appendChild(resetTallyBtn);

      panel.appendChild(tally);
      panel.appendChild(resetTallyRow);

      // ── Local renderers ───────────────────────────────────────────────
      function setDoorContent(doorEl, kind, doorNumber) {
        // kind: 'closed' | 'goat' | 'prize'
        if (kind === 'closed') {
          doorEl.innerHTML = '';
          doorEl.textContent = String(doorNumber);
        } else if (kind === 'goat') {
          doorEl.textContent = '';
          doorEl.innerHTML = GOAT_SVG;
        } else if (kind === 'prize') {
          doorEl.textContent = '';
          doorEl.innerHTML = PRIZE_SVG;
        }
      }

      function paintDoors() {
        for (let i = 0; i < doorsCount; i++) {
          let cls = 'mhs-door';
          let kind = 'closed';
          if (sgState === 'idle') {
            cls += ' mhs-door-clickable';
          } else if (sgState === 'picked' || sgState === 'await' || sgState === 'revealed') {
            if (i === sgPick) {
              cls += ' mhs-door-picked';
            } else if (sgOpened.indexOf(i) !== -1) {
              cls += ' mhs-door-opened-goat';
              kind = 'goat';
            }
            cls += ' mhs-door-disabled';
          }
          if (sgState === 'revealed') {
            if (i === sgPrize) {
              cls = cls.replace('mhs-door-picked', '').replace('mhs-door-opened-goat', '');
              cls += ' mhs-door-opened-prize';
              kind = 'prize';
            } else if (sgOpened.indexOf(i) === -1 && i !== sgPick) {
              // The "switch alternative" door, revealed (must be a goat).
              cls = cls.replace('mhs-door-picked', '');
              cls += ' mhs-door-opened-goat';
              kind = 'goat';
            } else if (i === sgPick && sgPick !== sgPrize) {
              // The picked door wasn't the prize.
              cls = cls.replace('mhs-door-picked', '');
              cls += ' mhs-door-opened-goat';
              kind = 'goat';
            }
            cls += ' mhs-door-disabled';
          }
          doors[i].className = cls;
          setDoorContent(doors[i], kind, i + 1);
        }
      }

      function paintStatus() {
        status.classList.remove('mhs-status-win', 'mhs-status-loss');
        const doorsWord = (doorsCount === 3) ? 'three' : (doorsCount === 6 ? 'six' : String(doorsCount));
        const goatPlural = (doorsCount === 3) ? 'a goat door' : (doorsCount - 2) + ' goat doors';
        if (sgState === 'idle') {
          status.innerHTML = 'Pick one of the ' + doorsWord + ' doors. The prize is behind exactly one of them.';
        } else if (sgState === 'picked') {
          status.innerHTML = 'You picked door <strong>' + (sgPick + 1) + '</strong>. Monty is opening ' + goatPlural + '…';
        } else if (sgState === 'await') {
          const openedLabels = sgOpened.map(d => d + 1).join(', ');
          const remainingLabel = (sgRemaining + 1);
          const opensVerb = (sgOpened.length === 1) ? 'opened door' : 'opened doors';
          status.innerHTML = 'Monty ' + opensVerb + ' <strong>' + openedLabels +
            '</strong> (' + (sgOpened.length === 1 ? 'a goat' : 'all goats') + '). ' +
            'Switch to door <strong>' + remainingLabel + '</strong>, or stay with door <strong>' + (sgPick + 1) + '</strong>?';
        } else if (sgState === 'revealed') {
          // Determined by the most recent decision — encoded in the tally bump
          // we've just done. The simplest is to read from the actual outcome:
          // if pick == prize and chose stay → win; if pick != prize and chose switch → win.
          // We've stashed that in `lastDecisionWon` (set in handleDecision).
          if (lastDecisionWon === true) {
            status.innerHTML = 'You won! Prize was behind door <strong>' + (sgPrize + 1) + '</strong>.';
            status.classList.add('mhs-status-win');
          } else {
            status.innerHTML = 'No prize. The prize was behind door <strong>' + (sgPrize + 1) + '</strong>.';
            status.classList.add('mhs-status-loss');
          }
        }
      }

      function paintActions() {
        decisionRow.style.display = (sgState === 'await') ? '' : 'none';
        playAgainRow.style.display = (sgState === 'revealed') ? '' : 'none';
      }

      function paintTally() {
        if (switchPlaysTally === 0) {
          switchRate.textContent = '—';
          switchDetail.textContent = 'no plays yet';
        } else {
          const r = switchWinsTally / switchPlaysTally;
          switchRate.textContent = fmtFraction(r, 3);
          switchDetail.textContent = switchWinsTally + ' / ' + switchPlaysTally + ' plays · ' +
            fmtPercent(r, 1);
        }
        if (stayPlaysTally === 0) {
          stayRate.textContent = '—';
          stayDetail.textContent = 'no plays yet';
        } else {
          const r = stayWinsTally / stayPlaysTally;
          stayRate.textContent = fmtFraction(r, 3);
          stayDetail.textContent = stayWinsTally + ' / ' + stayPlaysTally + ' plays · ' +
            fmtPercent(r, 1);
        }
      }

      let lastDecisionWon = null;

      function startNewGame() {
        sgPrize = Math.floor(Math.random() * doorsCount);
        sgPick = -1;
        sgOpened = [];
        sgRemaining = -1;
        sgState = 'idle';
        lastDecisionWon = null;
        paintDoors(); paintStatus(); paintActions();
      }

      function handleDoorClick(i) {
        if (sgState !== 'idle') return;
        sgPick = i;
        sgState = 'picked';
        paintDoors(); paintStatus(); paintActions();
        setTimeout(() => {
          sgOpened = montyOpens(doorsCount, sgPrize, sgPick);
          // The remaining closed door (the switch alternative) is whichever
          // door is neither pick nor opened.
          for (let d = 0; d < doorsCount; d++) {
            if (d !== sgPick && sgOpened.indexOf(d) === -1) {
              sgRemaining = d;
              break;
            }
          }
          sgState = 'await';
          paintDoors(); paintStatus(); paintActions();
        }, 600);
      }

      function handleDecision(choice) {
        // 'switch' means switch to sgRemaining; 'stay' means keep sgPick.
        const finalPick = (choice === 'switch') ? sgRemaining : sgPick;
        const won = (finalPick === sgPrize);
        if (choice === 'switch') {
          switchPlaysTally++;
          if (won) switchWinsTally++;
        } else {
          stayPlaysTally++;
          if (won) stayWinsTally++;
        }
        lastDecisionWon = won;
        // Update the picked-door reference so the reveal paint shows the
        // contestant's *final* pick highlighted (helpful pedagogically).
        sgPick = finalPick;
        sgState = 'revealed';
        paintDoors(); paintStatus(); paintActions(); paintTally();
      }

      // Wire events.
      for (let i = 0; i < doorsCount; i++) {
        doors[i].addEventListener('click', () => handleDoorClick(i));
      }
      switchBtn.addEventListener('click', () => handleDecision('switch'));
      stayBtn.addEventListener('click', () => handleDecision('stay'));
      playAgainBtn.addEventListener('click', () => startNewGame());
      resetTallyBtn.addEventListener('click', () => {
        switchWinsTally = 0; switchPlaysTally = 0;
        stayWinsTally = 0; stayPlaysTally = 0;
        paintTally();
      });

      // Initial paint.
      startNewGame();
      paintTally();
    }

    // ── Monte Carlo / N-door UI ─────────────────────────────────────────
    function renderMonteCarloPanel() {
      const isNdoor = (mode === 'ndoor');
      const title = document.createElement('div');
      title.className = 'mhs-panel-title';
      title.textContent = isNdoor
        ? 'N-door variant — vary the door count, run trials, watch (N−1)/N emerge'
        : 'Monte Carlo — pick a strategy, run trials, watch the empirical rate converge';
      panel.appendChild(title);

      const controls = document.createElement('div');
      controls.className = 'mhs-controls';

      // (N-door only) doors slider.
      let doorsSlider = null;
      let doorsReadout = null;
      if (isNdoor) {
        const doorsGroup = document.createElement('div');
        doorsGroup.className = 'mhs-doors-slider-row';
        doorsGroup.appendChild(makeSpan('mhs-form-label', 'doors:'));
        doorsSlider = document.createElement('input');
        doorsSlider.type = 'range';
        doorsSlider.min = '3'; doorsSlider.max = '20'; doorsSlider.step = '1';
        doorsSlider.value = String(nDoors);
        doorsGroup.appendChild(doorsSlider);
        doorsReadout = document.createElement('span');
        doorsReadout.className = 'mhs-doors-readout';
        doorsReadout.textContent = String(nDoors);
        doorsGroup.appendChild(doorsReadout);
        controls.appendChild(doorsGroup);
      }

      // Trials select.
      const trialsGroup = document.createElement('div');
      trialsGroup.className = 'mhs-control-group';
      const trialsLabel = document.createElement('label');
      trialsLabel.className = 'mhs-form-label';
      trialsLabel.htmlFor = instanceId + '-trials';
      trialsLabel.textContent = 'trials:';
      const trialsSelect = document.createElement('select');
      trialsSelect.id = instanceId + '-trials';
      trialsSelect.className = 'mhs-select';
      TRIAL_OPTIONS.forEach(v => {
        const opt = document.createElement('option');
        opt.value = String(v);
        opt.textContent = v.toLocaleString();
        if (v === trials) opt.selected = true;
        trialsSelect.appendChild(opt);
      });
      trialsGroup.appendChild(trialsLabel);
      trialsGroup.appendChild(trialsSelect);
      controls.appendChild(trialsGroup);

      // Strategy toggle.
      const stratGroup = document.createElement('div');
      stratGroup.className = 'mhs-control-group';
      stratGroup.appendChild(makeSpan('mhs-form-label', 'strategy:'));
      const stratToggle = document.createElement('div');
      stratToggle.className = 'mhs-strategy-toggle';
      const switchSBtn = document.createElement('button');
      switchSBtn.type = 'button'; switchSBtn.textContent = 'Switch';
      const staySBtn = document.createElement('button');
      staySBtn.type = 'button'; staySBtn.textContent = 'Stay';
      stratToggle.appendChild(switchSBtn);
      stratToggle.appendChild(staySBtn);
      stratGroup.appendChild(stratToggle);
      controls.appendChild(stratGroup);

      // Run button (right-aligned).
      const actionsRight = document.createElement('div');
      actionsRight.className = 'mhs-actions-right';
      const runBtn = document.createElement('button');
      runBtn.type = 'button'; runBtn.className = 'mhs-run-btn';
      runBtn.textContent = 'Run trials';
      const resetBtn = document.createElement('button');
      resetBtn.type = 'button'; resetBtn.className = 'mhs-reset-btn';
      resetBtn.textContent = 'Reset';
      actionsRight.appendChild(runBtn);
      actionsRight.appendChild(resetBtn);
      controls.appendChild(actionsRight);

      panel.appendChild(controls);

      // Result row: card + plot.
      const resultRow = document.createElement('div');
      resultRow.className = 'mhs-result-row';
      const resultCard = document.createElement('div');
      resultCard.className = 'mhs-result-card';
      resultRow.appendChild(resultCard);
      const plotCard = document.createElement('div');
      plotCard.className = 'mhs-plot-card';
      resultRow.appendChild(plotCard);
      panel.appendChild(resultRow);

      function paintStrategyToggle() {
        switchSBtn.classList.toggle('mhs-active', strategy === 'switch');
        staySBtn.classList.toggle('mhs-active', strategy === 'stay');
      }

      function paintResult() {
        const dc = currentDoorCount();
        resultCard.innerHTML = '';
        const theoretical = (strategy === 'switch') ? (dc - 1) / dc : 1 / dc;
        if (!mcResult || mcResult.doors !== dc ||
            mcResult.trials !== trials || mcResult.strategy !== strategy) {
          resultCard.appendChild(makeSpan('mhs-result-card-title', 'No simulation yet'));
          const empty = document.createElement('div');
          empty.className = 'mhs-result-detail';
          empty.textContent = 'Click "Run trials" to simulate ' +
            trials.toLocaleString() + ' games of ' + strategy + ' (' + dc + ' doors).';
          resultCard.appendChild(empty);
          const theo = document.createElement('div');
          theo.className = 'mhs-result-theoretical';
          theo.appendChild(makeSpan('mhs-result-theoretical-label', 'theoretical: '));
          theo.appendChild(document.createTextNode(
            (strategy === 'switch'
              ? '(' + dc + '−1)/' + dc
              : '1/' + dc) +
            ' = ' + fmtFraction(theoretical, 4) + ' (' + fmtPercent(theoretical, 1) + ')'
          ));
          resultCard.appendChild(theo);
          plotCard.innerHTML = '<div class="mhs-plot-empty">Run trials to see the running win-rate plot.</div>';
          return;
        }
        resultCard.appendChild(makeSpan('mhs-result-card-title',
          'Empirical win rate (' + strategy + ', ' +
          mcResult.trials.toLocaleString() + ' trials)'));
        const rate = document.createElement('div');
        rate.className = 'mhs-result-rate';
        rate.textContent = fmtFraction(mcResult.finalRate, 4);
        resultCard.appendChild(rate);
        const detail = document.createElement('div');
        detail.className = 'mhs-result-detail';
        const wins = mcResult.cumWinsArr[mcResult.cumWinsArr.length - 1];
        detail.textContent = wins.toLocaleString() + ' wins / ' +
          mcResult.trials.toLocaleString() + ' (' + fmtPercent(mcResult.finalRate, 1) + ')';
        resultCard.appendChild(detail);
        const theo = document.createElement('div');
        theo.className = 'mhs-result-theoretical';
        theo.appendChild(makeSpan('mhs-result-theoretical-label', 'theoretical: '));
        theo.appendChild(document.createTextNode(
          (strategy === 'switch'
            ? '(' + dc + '−1)/' + dc
            : '1/' + dc) +
          ' = ' + fmtFraction(theoretical, 4) + ' (' + fmtPercent(theoretical, 1) + ')'
        ));
        resultCard.appendChild(theo);
        drawPlot();
      }

      function drawPlot() {
        plotCard.innerHTML = '';
        const W = 400, H = 200;
        const ML = 38, MR = 12, MT = 12, MB = 28;
        const PW = W - ML - MR;
        const PH = H - MT - MB;

        const svg = svgEl('svg', {
          class: 'mhs-plot-svg',
          viewBox: '0 0 ' + W + ' ' + H,
          preserveAspectRatio: 'xMidYMid meet'
        });

        // Y axis (0 to 1).
        const yAxis = svgEl('line', {
          class: 'mhs-axis',
          x1: ML, y1: MT, x2: ML, y2: MT + PH
        });
        svg.appendChild(yAxis);
        // X axis.
        const xAxis = svgEl('line', {
          class: 'mhs-axis',
          x1: ML, y1: MT + PH, x2: ML + PW, y2: MT + PH
        });
        svg.appendChild(xAxis);

        // Y ticks at 0, 0.25, 0.5, 0.75, 1.
        const yTicks = [0, 0.25, 0.5, 0.75, 1];
        yTicks.forEach(t => {
          const y = MT + PH - t * PH;
          const tick = svgEl('line', {
            class: 'mhs-axis-tick',
            x1: ML, y1: y, x2: ML + PW, y2: y
          });
          svg.appendChild(tick);
          const lbl = svgEl('text', {
            class: 'mhs-axis-label',
            x: ML - 4, y: y + 3,
            'text-anchor': 'end'
          });
          lbl.textContent = t.toFixed(2);
          svg.appendChild(lbl);
        });

        // X label (number of trials).
        const xMid = svgEl('text', {
          class: 'mhs-axis-label',
          x: ML + PW / 2, y: H - 6,
          'text-anchor': 'middle'
        });
        xMid.textContent = 'trial number';
        svg.appendChild(xMid);
        const xMin = svgEl('text', {
          class: 'mhs-axis-label',
          x: ML, y: MT + PH + 14,
          'text-anchor': 'middle'
        });
        xMin.textContent = '1';
        svg.appendChild(xMin);
        const xMax = svgEl('text', {
          class: 'mhs-axis-label',
          x: ML + PW, y: MT + PH + 14,
          'text-anchor': 'middle'
        });
        xMax.textContent = mcResult.trials.toLocaleString();
        svg.appendChild(xMax);

        // Theoretical line.
        const theoretical = (mcResult.strategy === 'switch')
          ? (mcResult.doors - 1) / mcResult.doors
          : 1 / mcResult.doors;
        const yTheo = MT + PH - theoretical * PH;
        const theoLine = svgEl('line', {
          class: 'mhs-theo-line',
          x1: ML, y1: yTheo, x2: ML + PW, y2: yTheo
        });
        svg.appendChild(theoLine);
        const theoLabel = svgEl('text', {
          class: 'mhs-theo-label',
          x: ML + PW - 4, y: yTheo - 4,
          'text-anchor': 'end'
        });
        theoLabel.textContent = 'theoretical ' + fmtFraction(theoretical, 3);
        svg.appendChild(theoLabel);

        // Running win-rate line.
        const N = mcResult.cumWinsArr.length;
        const sampleStep = Math.max(1, Math.floor(N / 200));
        const points = [];
        for (let i = 0; i < N; i += sampleStep) {
          const rate = mcResult.cumWinsArr[i] / (i + 1);
          const x = ML + (i / Math.max(1, N - 1)) * PW;
          const y = MT + PH - rate * PH;
          points.push(x.toFixed(1) + ',' + y.toFixed(1));
        }
        // Always include the final point.
        const lastIdx = N - 1;
        if ((lastIdx % sampleStep) !== 0 && lastIdx >= 0) {
          const rate = mcResult.cumWinsArr[lastIdx] / (lastIdx + 1);
          const x = ML + PW;
          const y = MT + PH - rate * PH;
          points.push(x.toFixed(1) + ',' + y.toFixed(1));
        }
        const rateLine = svgEl('polyline', {
          class: 'mhs-rate-line',
          points: points.join(' ')
        });
        svg.appendChild(rateLine);

        plotCard.appendChild(svg);
      }

      function runSimulation() {
        const dc = currentDoorCount();
        runBtn.disabled = true;
        runBtn.textContent = 'Running…';
        // Defer so the disabled state paints before the simulation loop
        // runs (~30ms for 10k trials).
        setTimeout(() => {
          const sim = simulateMonteCarlo(dc, trials, strategy);
          mcResult = {
            cumWinsArr: sim.cumWinsArr,
            finalRate: sim.finalRate,
            doors: dc,
            trials: trials,
            strategy: strategy
          };
          runBtn.disabled = false;
          runBtn.textContent = 'Run trials';
          paintResult();
          renderMath();
        }, 0);
      }

      function reset() {
        mcResult = null;
        paintResult();
      }

      // Wire events.
      if (doorsSlider) {
        doorsSlider.addEventListener('input', () => {
          nDoors = clamp(Math.floor(Number(doorsSlider.value)), 3, 20);
          doorsReadout.textContent = String(nDoors);
          // Door count changed → invalidate the prior simulation.
          if (mcResult && mcResult.doors !== nDoors) mcResult = null;
          // Repaint result card + math without rebuilding the slider.
          paintResult(); renderMath();
        });
      }
      trialsSelect.addEventListener('change', () => {
        trials = Math.floor(Number(trialsSelect.value));
        if (mcResult && mcResult.trials !== trials) mcResult = null;
        paintResult();
      });
      switchSBtn.addEventListener('click', () => {
        strategy = 'switch';
        if (mcResult && mcResult.strategy !== strategy) mcResult = null;
        paintStrategyToggle(); paintResult(); renderMath();
      });
      staySBtn.addEventListener('click', () => {
        strategy = 'stay';
        if (mcResult && mcResult.strategy !== strategy) mcResult = null;
        paintStrategyToggle(); paintResult(); renderMath();
      });
      runBtn.addEventListener('click', runSimulation);
      resetBtn.addEventListener('click', reset);

      paintStrategyToggle();
      paintResult();
    }

    // ── Show-the-math content ───────────────────────────────────────────
    function renderMath() {
      mathBody.innerHTML = '';
      const doorCount = (mode === 'ndoor') ? nDoors : 3;
      const switchTheo = (doorCount - 1) / doorCount;
      const stayTheo = 1 / doorCount;

      if (doorCount === 3) {
        mathBody.innerHTML =
          '<p>The standard 3-door derivation. Without loss of generality, ' +
          'the contestant picks door 1.</p>' +
          '<p>Let <code>A = "prize behind door 1"</code> and <code>B = "Monty opens door 3"</code>. ' +
          'We want <code>P(A | B)</code>.</p>' +
          '<div class="mhs-math-formula">' +
          '<strong>Prior:</strong>  P(A) = 1/3 (the prize is uniformly distributed).<br>' +
          '<strong>Likelihood:</strong>  P(B | A) = 1/2 (given the prize is behind door 1, ' +
          'Monty has a free choice between doors 2 and 3).<br>' +
          '<strong>Evidence:</strong>  P(B) = 1/2 (by symmetry, Monty opens door 3 with probability 1/2).' +
          '</div>' +
          '<p>By Bayes:</p>' +
          '<div class="mhs-math-formula">' +
          'P(A | B) = P(B | A) · P(A) / P(B) = (1/2 · 1/3) / (1/2) = <strong>1/3</strong>.' +
          '</div>' +
          '<p>So <strong>P(stay wins) = 1/3</strong> and ' +
          '<strong>P(switch wins) = 2/3</strong>. Switching wins twice as often.</p>';
      } else {
        mathBody.innerHTML =
          '<p>With <strong>' + doorCount + ' doors</strong>, the contestant picks ' +
          'one. Monty then opens <strong>' + (doorCount - 2) + '</strong> goat doors, ' +
          'leaving the contestant\'s pick and exactly one alternative still closed.</p>' +
          '<div class="mhs-math-formula">' +
          '<strong>P(prize behind original pick) = 1/' + doorCount + '</strong> ≈ ' +
            fmtFraction(stayTheo, 4) + '<br>' +
          '<strong>P(prize behind switch door)   = ' + (doorCount - 1) + '/' + doorCount + '</strong> ≈ ' +
            fmtFraction(switchTheo, 4) +
          '</div>' +
          '<p>Why? The original pick was correct with probability 1/' + doorCount + '. ' +
          'In the remaining ' + (doorCount - 1) + '/' + doorCount + ' of cases, the prize was behind ' +
          'one of the other ' + (doorCount - 1) + ' doors — and Monty\'s rule (he must open ' +
          'goats only) <em>concentrates</em> all of that probability mass onto the single ' +
          'remaining alternative. So <strong>switching wins ' +
          fmtPercent(switchTheo, 1) + '</strong> of the time.</p>' +
          '<p class="mhs-math-formula">As <em>N</em> grows, switching becomes nearly certain: ' +
          'at <em>N</em> = 10 you win 90% of the time; at <em>N</em> = 100, 99%.</p>';
      }
    }

    function renderMathToggle() {
      mathBody.style.display = mathOpen ? '' : 'none';
      mathToggleBtn.textContent = mathOpen ? 'hide' : 'show';
    }

    // Wire tab clicks.
    function setMode(m) {
      if (mode === m) return;
      mode = m;
      // Clear MC result on mode change to avoid stale displays.
      mcResult = null;
      renderTabs(); renderPanel(); renderMath();
    }
    tabSingle.addEventListener('click', () => setMode('single'));
    tabSix.addEventListener('click', () => setMode('sixDoor'));
    tabMc.addEventListener('click', () => setMode('monteCarlo'));
    tabNd.addEventListener('click', () => setMode('ndoor'));

    mathToggleBtn.addEventListener('click', () => {
      mathOpen = !mathOpen;
      renderMathToggle();
    });

    // Initial render.
    renderTabs();
    renderPanel();
    renderMath();
    renderMathToggle();
  }

  function bootAll() {
    document.querySelectorAll('.mhs-widget').forEach(root => {
      if (root.dataset.mhsMounted === '1') return;
      root.dataset.mhsMounted = '1';
      mountWidget(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAll);
  } else {
    bootAll();
  }
}());
