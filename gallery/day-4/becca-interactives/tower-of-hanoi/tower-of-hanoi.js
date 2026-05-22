(function () {
  'use strict';

  // =========================================================================
  // TOWER OF HANOI PLAYER (W26) — embeddable widget
  //
  // Each <div class="hanoi-widget" data-problem='{...}'></div> is mounted
  // as an independent instance.
  //
  // Click-pick-up, click-place interaction. Three pegs (left/middle/right);
  // n disks of decreasing size start stacked on the left peg; goal is to
  // move them all to the right peg following the rules:
  //   - Move only one disk at a time (the top of a stack).
  //   - A disk may never sit on top of a smaller disk.
  // =========================================================================

  const SVG_NS = 'http://www.w3.org/2000/svg';

  let widgetSeq = 0;

  function isObject(x) { return x && typeof x === 'object'; }

  function svgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    if (attrs) for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  // Color per disk size (1 = smallest). Cycles through a small palette;
  // looks nice up to ~9 disks.
  const DISK_COLORS = [
    '#c4506e', // rose (smallest)
    '#b8841d', // amber
    '#3a7d6e', // copper
    '#4a78c2', // blue
    '#7b4daa', // violet
    '#2d5a27', // botanical green
    '#8b6914', // sepia
    '#c17817', // amber-orange
    '#5a8a3c'  // sage
  ];

  // ── Mount ────────────────────────────────────────────────────────────────
  function mountWidget(root) {
    let problem = {};
    try {
      problem = JSON.parse(root.dataset.problem || '{}');
    } catch (e) {
      console.error('tower-of-hanoi: invalid data-problem JSON', e);
      problem = {};
    }
    const titleText = (typeof problem.title === 'string' && problem.title.length)
      ? problem.title : 'Tower of Hanoi';
    const introHtml = (typeof problem.intro === 'string') ? problem.intro : null;
    const minN = Math.max(1, Math.min(9, Math.floor(problem.minN || 3)));
    const maxN = Math.max(minN, Math.min(9, Math.floor(problem.maxN || 8)));
    let n = Math.max(minN, Math.min(maxN, Math.floor(problem.defaultN || 4)));

    widgetSeq++;
    const instanceId = 'hanoi-' + widgetSeq;
    if (!root.hasAttribute('tabindex')) root.setAttribute('tabindex', '0');

    // ── Build DOM scaffold ─────────────────────────────────────────────────
    root.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'hanoi-header';
    {
      const h = document.createElement('h2');
      h.appendChild(document.createTextNode(titleText + ' '));
      const sub = document.createElement('span');
      sub.className = 'hanoi-subtitle';
      sub.textContent = 'click a peg to pick up, click another to place';
      h.appendChild(sub);
      header.appendChild(h);
    }

    const tools = document.createElement('div');
    tools.className = 'hanoi-header-tools';

    const diskCtl = document.createElement('div');
    diskCtl.className = 'hanoi-disk-control';
    const diskLabel = document.createElement('label');
    diskLabel.textContent = 'disks';
    diskLabel.htmlFor = instanceId + '-disks';
    const diskSelect = document.createElement('select');
    diskSelect.id = instanceId + '-disks';
    for (let v = minN; v <= maxN; v++) {
      const opt = document.createElement('option');
      opt.value = String(v);
      opt.textContent = String(v);
      if (v === n) opt.selected = true;
      diskSelect.appendChild(opt);
    }
    diskCtl.appendChild(diskLabel);
    diskCtl.appendChild(diskSelect);
    tools.appendChild(diskCtl);

    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'hanoi-tool-btn hanoi-danger';
    resetBtn.textContent = 'Reset';
    tools.appendChild(resetBtn);

    header.appendChild(tools);
    root.appendChild(header);

    const main = document.createElement('div');
    main.className = 'hanoi-main';

    const boardHost = document.createElement('div');
    boardHost.className = 'hanoi-board-host';
    const svg = svgEl('svg', { class: 'hanoi-board-svg', preserveAspectRatio: 'xMidYMax meet' });
    boardHost.appendChild(svg);
    main.appendChild(boardHost);

    const sidebar = document.createElement('div');
    sidebar.className = 'hanoi-sidebar';
    const sidebarHeader = document.createElement('div');
    sidebarHeader.className = 'hanoi-sidebar-header';
    const sidebarH3 = document.createElement('h3');
    sidebarH3.textContent = 'Status';
    sidebarHeader.appendChild(sidebarH3);
    sidebar.appendChild(sidebarHeader);

    function makeSection(title) {
      const sec = document.createElement('div');
      sec.className = 'hanoi-prop-section';
      const t = document.createElement('div');
      t.className = 'hanoi-prop-title';
      t.textContent = title;
      sec.appendChild(t);
      return sec;
    }

    const summarySec = makeSection('Summary');
    summarySec.innerHTML +=
      '<div class="hanoi-prop-row"><span class="hanoi-prop-label">Disks</span><span class="hanoi-prop-value hanoi-info hanoi-prop-disks">--</span></div>' +
      '<div class="hanoi-prop-row"><span class="hanoi-prop-label">Optimal moves</span><span class="hanoi-prop-value hanoi-info hanoi-prop-optimal">--</span></div>' +
      '<div class="hanoi-prop-tooltip">2<sup>n</sup>−1 — the minimum number of moves it takes.</div>';
    sidebar.appendChild(summarySec);
    const sumRefs = {
      disks: summarySec.querySelector('.hanoi-prop-disks'),
      optimal: summarySec.querySelector('.hanoi-prop-optimal')
    };

    const progSec = makeSection('Progress');
    progSec.innerHTML +=
      '<div class="hanoi-prop-row"><span class="hanoi-prop-label">Your moves</span><span class="hanoi-prop-value hanoi-prop-moves">0</span></div>' +
      '<div class="hanoi-prop-row"><span class="hanoi-prop-label">Held disk</span><span class="hanoi-prop-value hanoi-prop-held">--</span></div>' +
      '<div class="hanoi-prop-row"><span class="hanoi-prop-label">Solved?</span><span class="hanoi-prop-value hanoi-prop-solved">--</span></div>';
    sidebar.appendChild(progSec);
    const progRefs = {
      moves: progSec.querySelector('.hanoi-prop-moves'),
      held: progSec.querySelector('.hanoi-prop-held'),
      solved: progSec.querySelector('.hanoi-prop-solved')
    };

    const banner = document.createElement('div');
    banner.className = 'hanoi-status-banner';
    sidebar.appendChild(banner);

    main.appendChild(sidebar);
    root.appendChild(main);

    // ── State ──────────────────────────────────────────────────────────────
    // pegs[i] = array of disk sizes from bottom to top (so .pop() = top).
    let pegs = [[], [], []];
    let selectedPeg = null;        // 0/1/2 if a peg is "picked up"
    let moves = 0;
    let shakeTimers = [null, null, null];

    function reset() {
      pegs = [[], [], []];
      // Largest disk (size n) at bottom, smallest (size 1) on top.
      for (let s = n; s >= 1; s--) pegs[0].push(s);
      selectedPeg = null;
      moves = 0;
      banner.classList.remove('hanoi-visible');
      banner.innerHTML = '';
      render();
      updateSidebar();
    }

    function isSolved() {
      if (pegs[2].length !== n) return false;
      // Check pegs[2] is [n, n-1, ..., 1] from bottom to top.
      for (let i = 0; i < n; i++) {
        if (pegs[2][i] !== n - i) return false;
      }
      return true;
    }

    function attemptMove(targetPeg) {
      if (selectedPeg === null) return;
      if (targetPeg === selectedPeg) {
        // Click same peg → cancel the pick-up.
        selectedPeg = null;
        render();
        updateSidebar();
        return;
      }
      const fromStack = pegs[selectedPeg];
      const toStack = pegs[targetPeg];
      if (fromStack.length === 0) {
        selectedPeg = null;
        render();
        updateSidebar();
        return;
      }
      const top = fromStack[fromStack.length - 1];
      if (toStack.length > 0 && toStack[toStack.length - 1] < top) {
        // Illegal: can't put a larger disk on a smaller one.
        shakePeg(targetPeg);
        return;
      }
      // Legal — perform the move.
      fromStack.pop();
      toStack.push(top);
      moves++;
      selectedPeg = null;
      render();
      updateSidebar();
      if (isSolved()) showWinBanner();
    }

    function selectPeg(i) {
      if (selectedPeg !== null) {
        attemptMove(i);
        return;
      }
      if (pegs[i].length === 0) {
        // Nothing to pick up.
        return;
      }
      selectedPeg = i;
      render();
      updateSidebar();
    }

    function shakePeg(i) {
      if (shakeTimers[i]) {
        clearTimeout(shakeTimers[i]);
        shakeTimers[i] = null;
      }
      // Shake animation runs via class; remove after a short delay.
      const hits = svg.querySelectorAll('.hanoi-peg-hit');
      if (hits[i]) {
        hits[i].classList.add('hanoi-peg-shake');
        shakeTimers[i] = setTimeout(() => {
          if (hits[i]) hits[i].classList.remove('hanoi-peg-shake');
          shakeTimers[i] = null;
        }, 320);
      }
    }

    function showWinBanner() {
      const optimal = (1 << n) - 1;
      let msg = '<strong>Solved in ' + moves + ' move' + (moves === 1 ? '' : 's') + '!</strong> ';
      if (moves === optimal) {
        msg += 'That&#39;s the minimum (2<sup>' + n + '</sup>−1 = ' + optimal + ').';
      } else {
        msg += 'The minimum is 2<sup>' + n + '</sup>−1 = ' + optimal + ' moves.';
      }
      banner.innerHTML = msg;
      banner.classList.add('hanoi-visible');
    }

    // ── Rendering ──────────────────────────────────────────────────────────
    // SVG canvas: viewBox 600 × 320. Three pegs at x=120, 300, 480.
    // Disks centered on their peg. Bigger disks lower; max disk width 130.
    const VB_W = 600, VB_H = 320;
    const PEG_X = [120, 300, 480];
    const BASE_Y = 280;            // top of the base / bottom of pegs
    const BASE_HEIGHT = 16;
    const PEG_HEIGHT = 200;
    const PEG_TOP_Y = BASE_Y - PEG_HEIGHT;
    const ROD_WIDTH = 8;
    const DISK_HEIGHT = 18;
    const DISK_GAP = 1;
    const DISK_MIN_W = 36;
    const DISK_MAX_W = 130;
    const PEG_HIT_W = 130;        // width of clickable area around each peg

    function render() {
      svg.setAttribute('viewBox', '0 0 ' + VB_W + ' ' + VB_H);
      while (svg.firstChild) svg.removeChild(svg.firstChild);

      // Base.
      svg.appendChild(svgEl('rect', {
        x: 30, y: BASE_Y, width: VB_W - 60, height: BASE_HEIGHT,
        rx: 3, class: 'hanoi-base'
      }));

      // Pegs.
      for (let i = 0; i < 3; i++) {
        const x = PEG_X[i] - ROD_WIDTH / 2;
        svg.appendChild(svgEl('rect', {
          x: x, y: PEG_TOP_Y, width: ROD_WIDTH, height: PEG_HEIGHT,
          rx: 2, class: 'hanoi-peg-rod'
        }));
        // Peg label below.
        const lbl = svgEl('text', {
          x: PEG_X[i], y: BASE_Y + BASE_HEIGHT + 8,
          class: 'hanoi-peg-label'
        });
        lbl.textContent = ['Left', 'Middle', 'Right'][i];
        svg.appendChild(lbl);
      }

      // Disks.
      const widthStep = (DISK_MAX_W - DISK_MIN_W) / Math.max(1, n - 1);
      for (let i = 0; i < 3; i++) {
        const stack = pegs[i];
        for (let k = 0; k < stack.length; k++) {
          const size = stack[k];
          const w = DISK_MIN_W + (size - 1) * widthStep;
          const isTop = (k === stack.length - 1);
          const isHeld = isTop && selectedPeg === i;
          const y = BASE_Y - (k + 1) * (DISK_HEIGHT + DISK_GAP);
          const x = PEG_X[i] - w / 2;
          const colorIdx = (size - 1) % DISK_COLORS.length;
          const liftY = isHeld ? -28 : 0;   // visual: lift held top disk
          const r = svgEl('rect', {
            x: x, y: y + liftY, width: w, height: DISK_HEIGHT,
            rx: 4, fill: DISK_COLORS[colorIdx],
            class: 'hanoi-disk' + (isHeld ? ' hanoi-disk-held' : '')
          });
          svg.appendChild(r);
          const t = svgEl('text', {
            x: PEG_X[i], y: y + liftY + DISK_HEIGHT / 2,
            class: 'hanoi-disk-text'
          });
          t.textContent = String(size);
          svg.appendChild(t);
        }
      }

      // Peg hit-targets (drawn last so they capture clicks above disks).
      // Cover the full vertical area of each peg + a bit above for clicks
      // around a held disk. Use semi-transparent fill that lights up when
      // selected.
      for (let i = 0; i < 3; i++) {
        const hit = svgEl('rect', {
          x: PEG_X[i] - PEG_HIT_W / 2,
          y: PEG_TOP_Y - 30,
          width: PEG_HIT_W,
          height: PEG_HEIGHT + BASE_HEIGHT + 30,
          rx: 4,
          class: 'hanoi-peg-hit' + (selectedPeg === i ? ' hanoi-peg-selected' : '')
        });
        hit.addEventListener('click', () => {
          root.focus({ preventScroll: true });
          selectPeg(i);
        });
        svg.appendChild(hit);
      }
    }

    function updateSidebar() {
      sumRefs.disks.textContent = String(n);
      sumRefs.optimal.textContent = String((1 << n) - 1);
      progRefs.moves.textContent = String(moves);
      if (selectedPeg !== null && pegs[selectedPeg].length > 0) {
        const top = pegs[selectedPeg][pegs[selectedPeg].length - 1];
        progRefs.held.textContent = 'disk ' + top + ' from ' + ['left', 'middle', 'right'][selectedPeg];
      } else {
        progRefs.held.textContent = '--';
      }
      const solved = isSolved();
      progRefs.solved.classList.remove('hanoi-good');
      if (solved) {
        progRefs.solved.textContent = 'Yes';
        progRefs.solved.classList.add('hanoi-good');
      } else {
        progRefs.solved.textContent = 'No';
      }
    }

    // ── Wire controls ─────────────────────────────────────────────────────
    diskSelect.addEventListener('change', () => {
      n = Math.max(minN, Math.min(maxN, Math.floor(Number(diskSelect.value) || 4)));
      reset();
    });
    resetBtn.addEventListener('click', () => {
      reset();
    });

    root.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.key === '1' || e.key.toLowerCase() === 'l') { selectPeg(0); e.preventDefault(); }
      else if (e.key === '2' || e.key.toLowerCase() === 'm') { selectPeg(1); e.preventDefault(); }
      else if (e.key === '3' || e.key.toLowerCase() === 'r') { selectPeg(2); e.preventDefault(); }
      else if (e.key === 'Escape') { selectedPeg = null; render(); updateSidebar(); }
    });

    // Initial state.
    reset();
  }

  function bootAll() {
    document.querySelectorAll('.hanoi-widget').forEach((root) => {
      if (root.dataset.hanoiMounted === '1') return;
      root.dataset.hanoiMounted = '1';
      mountWidget(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAll);
  } else {
    bootAll();
  }
}());
