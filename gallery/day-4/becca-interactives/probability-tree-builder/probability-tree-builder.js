(function () {
  'use strict';

  // =========================================================================
  // PROBABILITY TREE BUILDER (W29) — embeddable widget
  //
  // A canvas with a multi-level probability tree. Students:
  //   - Set tree structure (1–3 levels; 2–5 branches per level).
  //   - Edit each branch's probability inline. The widget auto-normalizes
  //     siblings under any node so they always sum to 1.
  //   - Click any leaf to mark it as part of the event of interest.
  //   - See branch probabilities, joint probabilities at each leaf, the
  //     total event probability, and a sample-space sanity check.
  //
  // Modes (header toggle):
  //   "fixed"        — branch probabilities at each level are SHARED across
  //                    all sibling-sets at that level (so any edit at level
  //                    L propagates to every parent at level L). This is
  //                    the Module 7 default — second-stage probabilities
  //                    are independent of the first stage.
  //   "conditional"  — each parent has its OWN set of children-probabilities
  //                    (Module 8). Edits at a parent stay local; sibling
  //                    parents at the same level keep their own values.
  //
  // Internal data layout:
  //   `branchProbs` is ALWAYS a parent-keyed map
  //       { [parentPathKey: string]: number[] }
  //   where parentPathKey is the dot-joined parent path ("" for root, "0"
  //   for the first first-level node, "0-1" for the second-level node
  //   under the first first-level branch, etc.). In fixed mode every
  //   parent key at level L has identical values; in conditional mode
  //   they may differ.
  //
  // Presets: blank, twoCoins, threeBiasedCoins, dice (the 2026 wager); plus
  // Module 8 conditional presets — mammogram, covidTest, nathaniel.
  // =========================================================================

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const EPS = 1e-9;
  let widgetSeq = 0;

  // Subscript digits 0..9 for generic outcome labels.
  const SUB = ['₀','₁','₂','₃','₄','₅','₆','₇','₈','₉'];
  function genericLabel(i) {
    const n = i + 1;
    if (n < 10) return 'Out' + SUB[n];
    return 'Out' + n;
  }

  // ── Presets ─────────────────────────────────────────────────────────────
  // Each preset specifies probabilities EITHER as a fixed level-indexed
  // array (probs[level][branchIdx], replicated to every parent at that
  // level on load) OR as a parent-keyed conditional map (condProbs[key]).
  // Conditional presets unlock the asymmetric-tree workflow that Module 8
  // exercises (mammogram, COVID test, Nathaniel siblings).
  const PRESETS = {
    blank: {
      label: 'Blank (2 levels × 2 branches)',
      levels: 2,
      branches: [2, 2],
      probs: [[0.5, 0.5], [0.5, 0.5]],
      labels: [['Out₁', 'Out₂'], ['Out₁', 'Out₂']],
      mode: 'fixed'
    },
    twoCoins: {
      label: 'Two coin flips',
      levels: 2,
      branches: [2, 2],
      probs: [[0.5, 0.5], [0.5, 0.5]],
      labels: [['H', 'T'], ['H', 'T']],
      mode: 'fixed'
    },
    threeBiasedCoins: {
      label: 'Three biased coins (P(H) = 0.6)',
      levels: 3,
      branches: [2, 2, 2],
      probs: [[0.6, 0.4], [0.6, 0.4], [0.6, 0.4]],
      labels: [['H', 'T'], ['H', 'T'], ['H', 'T']],
      mode: 'fixed'
    },
    dice: {
      label: 'Dice: A vs C (the 2026 wager)',
      levels: 2,
      branches: [3, 3],
      probs: [[1/3, 1/3, 1/3], [1/3, 1/3, 1/3]],
      labels: [['2', '4', '9'], ['3', '5', '7']],
      mode: 'fixed'
    },
    // ── Module 8 conditional presets ─────────────────────────────────────
    mammogram: {
      label: 'Mammogram (1% prior, 90% TPR, 5% FPR)',
      levels: 2,
      branches: [2, 2],
      labels: [['cancer', 'no cancer'], ['+', '−']],
      condProbs: {
        '':  [0.01, 0.99],   // prior at root
        '0': [0.90, 0.10],   // sensitivity branch (test | cancer)
        '1': [0.05, 0.95]    // FPR branch (test | no cancer)
      },
      mode: 'conditional'
    },
    covidTest: {
      label: 'COVID test (3% prior, 99% TPR, 1% FPR)',
      levels: 2,
      branches: [2, 2],
      labels: [['COVID', 'no COVID'], ['+', '−']],
      condProbs: {
        '':  [0.03, 0.97],
        '0': [0.99, 0.01],
        '1': [0.01, 0.99]
      },
      mode: 'conditional'
    },
    nathaniel: {
      label: 'Nathaniel siblings (boy-girl paradox)',
      levels: 2,
      branches: [4, 2],
      labels: [['BB', 'BS', 'SB', 'SS'], ['brother', 'sister']],
      condProbs: {
        '':  [0.25, 0.25, 0.25, 0.25],
        '0': [1, 0],         // BB → must pick brother
        '1': [0.5, 0.5],     // BS → coin flip
        '2': [0.5, 0.5],     // SB → coin flip
        '3': [0, 1]          // SS → must pick sister
      },
      mode: 'conditional'
    },
    // ── Module 9 expectation presets ─────────────────────────────────────
    // Each carries a `leafValues` map keyed by leafKey(path) and turns on
    // the Expectation overlay panel by default. Module 9 presets verify
    // hand-computed expected values from segment 9.1.
    montanaHill: {
      label: 'Montana Hill 6-door (E = $275)',
      levels: 1,
      branches: [3],
      probs: [[14/24, 5/24, 5/24]],
      // Display the original Montana Hill denominator (/24) verbatim
      // instead of letting fmtProb simplify 14/24 to 7/12.
      probLabels: [['14/24', '5/24', '5/24']],
      labels: [['lose', '$120', '$1200']],
      mode: 'fixed',
      leafValues: { '0': 0, '1': 120, '2': 1200 },
      expectationActive: true
    },
    coldX: {
      label: 'ColdX call option (E = $7.50)',
      levels: 1,
      branches: [2],
      probs: [[0.75, 0.25]],
      labels: [['FDA No', 'FDA Yes']],
      mode: 'fixed',
      leafValues: { '0': 0, '1': 30 },
      expectationActive: true
    },
    laundryBusy: {
      label: 'Laundry busy student (E[B] = 4)',
      levels: 3,
      branches: [2, 2, 2],
      probs: [[2/3, 1/3], [2/3, 1/3], [2/3, 1/3]],
      labels: [['1 day', '2 days'], ['1 day', '2 days'], ['1 day', '2 days']],
      mode: 'fixed',
      // Leaf value = total pset days; idx 0 → 1 day, idx 1 → 2 days.
      // sum_along_path(idx + 1).
      leafValues: {
        '0-0-0': 3, '0-0-1': 4, '0-1-0': 4, '0-1-1': 5,
        '1-0-0': 4, '1-0-1': 5, '1-1-0': 5, '1-1-1': 6
      },
      expectationActive: true
    }
  };

  // ── Guided-build problems (Module 8 extension) ──────────────────────────
  // Each entry pairs a written prompt with the expected branch probabilities
  // (parent-keyed) and a per-branch hint that fires when the student's
  // answer is wrong. Tolerance is ±0.001.
  const GUIDED_PROBLEMS = {
    blank: {
      label: 'Blank (custom problem)',
      statement: 'Enter your own problem. The tree starts blank; once you are in guided-build mode, fill in branch probabilities one at a time.',
      structure: { levels: 2, branches: [2, 2], labels: [['Out₁', 'Out₂'], ['Out₁', 'Out₂']] },
      expected: null,
      hints: null
    },
    mammogram: {
      label: 'Mammogram',
      statement: 'A mammogram is 90% sensitive (it fires positive on 90% of cancer cases) and has a 5% false-positive rate (it fires positive on 5% of the cancer-free cases). The prior probability that a randomly selected patient has cancer is 1%.',
      structure: { levels: 2, branches: [2, 2], labels: [['cancer', 'no cancer'], ['+', '−']] },
      expected: { '':  [0.01, 0.99], '0': [0.90, 0.10], '1': [0.05, 0.95] },
      hints: {
        '':  [
          'The prior — the probability of cancer in the unrestricted sample space. The problem states it directly.',
          'Complement of the prior: 1 − P(cancer).'
        ],
        '0': [
          'Sensitivity (true-positive rate): the chance the test fires positive given the patient has cancer.',
          'False-negative rate: 1 − sensitivity.'
        ],
        '1': [
          'False-positive rate: the chance the test fires positive given the patient does NOT have cancer.',
          'Specificity: 1 − false-positive rate.'
        ]
      }
    },
    covidTest: {
      label: 'COVID test',
      statement: 'A COVID test is 99% accurate for both positive and negative results (sensitivity = 99%, specificity = 99%). The prior probability that a randomly selected person has COVID is 3%.',
      structure: { levels: 2, branches: [2, 2], labels: [['COVID', 'no COVID'], ['+', '−']] },
      expected: { '':  [0.03, 0.97], '0': [0.99, 0.01], '1': [0.01, 0.99] },
      hints: {
        '':  [
          'The prior — 3% of the population has COVID.',
          'Complement of the prior: 1 − P(COVID).'
        ],
        '0': [
          'Sensitivity: the chance of a positive given COVID. The problem says the test is 99% accurate.',
          'False-negative rate: 1 − sensitivity.'
        ],
        '1': [
          'False-positive rate: the chance of a positive given no COVID. Specificity is 99%, so FPR = 1%.',
          'Specificity: 99%.'
        ]
      }
    },
    nathaniel: {
      label: 'Nathaniel siblings',
      statement: 'Nathaniel has two siblings. We assume each sibling is independently a brother (B) or sister (S) with probability 1/2, in age order. So the four equally-likely family compositions are BB, BS, SB, SS. Nathaniel picks one sibling uniformly at random and brings them along — what is P(brother) given each family?',
      structure: { levels: 2, branches: [4, 2], labels: [['BB', 'BS', 'SB', 'SS'], ['brother', 'sister']] },
      expected: {
        '':  [0.25, 0.25, 0.25, 0.25],
        '0': [1, 0],
        '1': [0.5, 0.5],
        '2': [0.5, 0.5],
        '3': [0, 1]
      },
      hints: {
        '':  [
          'Each family has equal prior probability — there are four equally-likely compositions.',
          'Same as branch 1: equal priors.',
          'Same: equal priors.',
          'Same: equal priors.'
        ],
        '0': [
          'BB has two brothers — every random pick is a brother.',
          'BB has no sisters.'
        ],
        '1': [
          'BS has one brother and one sister — each is picked with probability 1/2.',
          'BS has one sister — also 1/2.'
        ],
        '2': [
          'SB has one brother and one sister — each is picked with probability 1/2.',
          'SB has one sister — also 1/2.'
        ],
        '3': [
          'SS has no brothers — a random pick is never a brother.',
          'SS has two sisters — every random pick is a sister.'
        ]
      }
    }
  };

  // Format a probability as a short string. Prefer unicode shortcuts for
  // common fractions, then a/b for small denominators (≤ 12), then a 3-digit
  // decimal stripped of trailing zeros.
  function fmtProb(v) {
    if (!Number.isFinite(v)) return '?';
    if (Math.abs(v - 1) < EPS) return '1';
    if (Math.abs(v) < EPS) return '0';
    const unicodeFracs = [
      [1, 2, '½'], [1, 3, '⅓'], [2, 3, '⅔'],
      [1, 4, '¼'], [3, 4, '¾'], [1, 5, '⅕'], [2, 5, '⅖'], [3, 5, '⅗'], [4, 5, '⅘'],
      [1, 6, '⅙'], [5, 6, '⅚'], [1, 8, '⅛'], [3, 8, '⅜'], [5, 8, '⅝'], [7, 8, '⅞']
    ];
    for (const [num, den, sym] of unicodeFracs) {
      if (Math.abs(v - num / den) < 1e-3) return sym;
    }
    for (let b = 2; b <= 12; b++) {
      const a = Math.round(v * b);
      if (a > 0 && a < b && Math.abs(v - a / b) < 1e-3) {
        return a + '/' + b;
      }
    }
    let s = v.toFixed(3);
    s = s.replace(/0+$/, '').replace(/\.$/, '');
    return s;
  }

  // Plain decimal formatter (fixed precision) for places where a/b would
  // be confusing (e.g., the Bayes-overlay numerator/denominator readouts).
  function fmtDecimal(v, places) {
    if (!Number.isFinite(v)) return '?';
    const p = (places == null) ? 4 : places;
    let s = v.toFixed(p);
    s = s.replace(/0+$/, '').replace(/\.$/, '');
    return s;
  }

  function svgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    if (attrs) for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  // ── Path-key helpers ────────────────────────────────────────────────────
  function pathKey(path) { return path.join('-'); }

  // Enumerate parent path keys for parents whose children are at `level`.
  // Level 0's parent is the root (one parent, key ""); level 1's parents
  // are the level-1 nodes (`branches[0]` of them); etc.
  function parentKeysAtLevel(level, branches) {
    if (level === 0) return [''];
    const keys = [];
    (function recurse(depth, prefix) {
      if (depth === level) { keys.push(prefix); return; }
      for (let i = 0; i < branches[depth]; i++) {
        recurse(depth + 1, prefix === '' ? String(i) : prefix + '-' + i);
      }
    })(0, '');
    return keys;
  }

  function uniformProbs(n) {
    const arr = new Array(n);
    for (let i = 0; i < n; i++) arr[i] = 1 / n;
    return arr;
  }

  // Expand a fixed-form level-indexed probability array into a parent-keyed
  // map by replicating each level's array to every parent at that level.
  function expandFixed(probsLevel, levels, branches) {
    const map = {};
    for (let lvl = 0; lvl < levels; lvl++) {
      const src = (probsLevel && probsLevel[lvl])
        ? probsLevel[lvl].slice()
        : uniformProbs(branches[lvl]);
      for (const k of parentKeysAtLevel(lvl, branches)) {
        map[k] = src.slice();
      }
    }
    return map;
  }

  // Take a representative level-indexed array from a parent-keyed map.
  // Used when collapsing conditional → fixed.
  function canonicalLevelArray(branchProbs, level, branches) {
    const parents = parentKeysAtLevel(level, branches);
    const k = parents[0];
    return (branchProbs[k] ? branchProbs[k].slice() : uniformProbs(branches[level]));
  }

  // Collapse: take first-parent values at each level and re-expand so that
  // every parent at that level has the same array.
  function collapseToFixed(branchProbs, levels, branches) {
    const probs = [];
    for (let lvl = 0; lvl < levels; lvl++) {
      probs.push(canonicalLevelArray(branchProbs, lvl, branches));
    }
    return expandFixed(probs, levels, branches);
  }

  // Build the parent-keyed probability map from a preset definition.
  function presetToBranchProbs(preset) {
    if (preset.condProbs) {
      // Deep-copy each entry.
      const map = {};
      for (const k of Object.keys(preset.condProbs)) {
        map[k] = preset.condProbs[k].slice();
      }
      // Fill in any missing parent keys with uniform values (defensive).
      for (let lvl = 0; lvl < preset.levels; lvl++) {
        for (const k of parentKeysAtLevel(lvl, preset.branches)) {
          if (!map[k]) map[k] = uniformProbs(preset.branches[lvl]);
        }
      }
      return map;
    }
    return expandFixed(preset.probs, preset.levels, preset.branches);
  }

  // Expand level-indexed probability-label strings into a parent-keyed map,
  // mirroring expandFixed but for strings (so authors can pin a display
  // form like "5/24" that survives until the user edits a branch).
  function expandFixedLabels(probLabelsLevel, levels, branches) {
    if (!probLabelsLevel) return {};
    const map = {};
    for (let lvl = 0; lvl < levels; lvl++) {
      const src = probLabelsLevel[lvl] ? probLabelsLevel[lvl].slice() : null;
      for (const k of parentKeysAtLevel(lvl, branches)) {
        map[k] = src ? src.slice() : null;
      }
    }
    return map;
  }

  function clonePreset(preset) {
    const out = {
      levels: preset.levels,
      branches: preset.branches.slice(),
      labels: preset.labels.map(arr => arr.slice()),
      branchProbs: presetToBranchProbs(preset),
      branchProbLabels: expandFixedLabels(preset.probLabels, preset.levels, preset.branches),
      mode: preset.mode || 'fixed',
      leafValues: {},
      expectationActive: !!preset.expectationActive
    };
    if (preset.leafValues) {
      for (const k in preset.leafValues) {
        if (Object.prototype.hasOwnProperty.call(preset.leafValues, k)) {
          out.leafValues[k] = preset.leafValues[k];
        }
      }
    }
    return out;
  }

  // Parse a "a/b" or decimal string. Returns NaN on failure.
  function parseFracOrNumStr(raw) {
    if (raw == null) return NaN;
    const s = String(raw).trim();
    if (s === '') return NaN;
    if (s.indexOf('/') !== -1) {
      const parts = s.split('/');
      const a = Number(parts[0]);
      const b = Number(parts[1]);
      if (Number.isFinite(a) && Number.isFinite(b) && b !== 0) return a / b;
      return NaN;
    }
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  }

  // ── Build tree from structure ────────────────────────────────────────────
  // `branchProbs` is a parent-keyed map (see top of file). Returns the
  // root node. Each node has { type, depth, x, y, path, joint?, children?,
  // parentBranchIdx? }.
  function buildTree(levels, branches, branchProbs) {
    const LEAF_SPACING = 64;
    const LEVEL_SPACING = 170;
    const TOP_MARGIN = 40;
    const LEFT_MARGIN = 50;
    let leafCounter = 0;

    function build(depth, pathSoFar, jointSoFar) {
      const x = LEFT_MARGIN + depth * LEVEL_SPACING;
      if (depth === levels) {
        const y = TOP_MARGIN + leafCounter * LEAF_SPACING;
        leafCounter++;
        return {
          type: 'leaf',
          depth,
          x, y,
          path: pathSoFar.slice(),
          joint: jointSoFar
        };
      }
      const children = [];
      const parentKey = pathKey(pathSoFar);
      const probs = branchProbs[parentKey] || uniformProbs(branches[depth]);
      for (let i = 0; i < branches[depth]; i++) {
        pathSoFar.push(i);
        children.push(build(depth + 1, pathSoFar, jointSoFar * probs[i]));
        pathSoFar.pop();
      }
      const yMid = (children[0].y + children[children.length - 1].y) / 2;
      return {
        type: 'node',
        depth, x,
        y: yMid,
        children,
        path: pathSoFar.slice()
      };
    }

    const root = build(0, [], 1);
    const totalLeaves = leafCounter;
    return { root, totalLeaves, LEAF_SPACING, LEVEL_SPACING, TOP_MARGIN, LEFT_MARGIN };
  }

  function walkTree(root, fn) {
    fn(root);
    if (root.children) for (const c of root.children) walkTree(c, fn);
  }
  function walkBranches(root, fn) {
    if (!root.children) return;
    for (const c of root.children) {
      fn(root, c);
      walkBranches(c, fn);
    }
  }
  function leafKey(path) { return path.join('-'); }

  // Auto-normalize a probability set so it sums to 1 after one entry has
  // been edited. Other entries are scaled proportionally to absorb the
  // difference; if all others were zero, distribute equally.
  function normalizeAfterEdit(probs, changedIdx, newValue) {
    const n = probs.length;
    const result = probs.slice();
    const v = Math.max(0, Math.min(1, newValue));
    result[changedIdx] = v;
    let sumOthers = 0;
    for (let i = 0; i < n; i++) if (i !== changedIdx) sumOthers += result[i];
    const want = 1 - v;
    if (n === 1) { result[0] = 1; return result; }
    if (sumOthers > EPS) {
      const scale = want / sumOthers;
      for (let i = 0; i < n; i++) {
        if (i !== changedIdx) result[i] = result[i] * scale;
      }
    } else {
      const each = want / (n - 1);
      for (let i = 0; i < n; i++) {
        if (i !== changedIdx) result[i] = each;
      }
    }
    return result;
  }

  // ── Mount ────────────────────────────────────────────────────────────────
  function mountWidget(root) {
    let problem = {};
    try {
      problem = JSON.parse(root.dataset.problem || '{}');
    } catch (e) {
      console.error('probability-tree-builder: invalid data-problem JSON', e);
    }

    const titleText = (typeof problem.title === 'string' && problem.title.length)
      ? problem.title : 'Probability Tree Builder';
    const introHtml = (typeof problem.intro === 'string') ? problem.intro : '';
    const initialPresetKey = (typeof problem.defaultPreset === 'string'
      && PRESETS[problem.defaultPreset]) ? problem.defaultPreset : 'blank';

    widgetSeq++;
    const instanceId = 'pt-' + widgetSeq;

    // ── State ──────────────────────────────────────────────────────────────
    const initial = clonePreset(PRESETS[initialPresetKey]);
    let levels = initial.levels;
    let branches = initial.branches;
    let branchProbs = initial.branchProbs;   // { parentKey: [probs] }
    // Optional display-form hints, parent-keyed; if a hint at (parentKey, idx)
    // parses to the same numeric value as branchProbs[parentKey][idx] within
    // EPS, the renderer uses it verbatim — otherwise falls back to fmtProb.
    // Cleared by the user editing a branch (since the value diverges).
    let branchProbLabels = initial.branchProbLabels || {};
    let branchLabels = initial.labels;       // [level][branchIdx]
    let probMode = initial.mode;             // 'fixed' | 'conditional'
    let eventLeaves = new Set();             // Set of leafKey strings — the "marked event" (= Event A)
    let conditioningLeaves = new Set();      // Set of leafKey strings — the conditioning event B
    let condProbActive = false;              // P(A|B) panel toggle (M8 extension)
    let condProbTarget = 'A';                // 'A' | 'B' — which set tree-clicks toggle
    let bayesOverlayActive = false;          // Bayes-overlay panel toggle (M8 extension)
    let bayesHypIdx = 0;                     // Index of the level-1 branch that is the hypothesis
    let guidedActive = false;                // Guided-build mode toggle (M8 extension)
    let guidedProblemKey = 'mammogram';      // Selected guided-build problem
    let guidedFeedback = {};                 // { parentKey: [ 'pending'|'correct'|'wrong', ... ] }
    let expectationActive = !!initial.expectationActive;  // Expectation-overlay panel toggle (M9 extension)
    let leafValues = Object.assign({}, initial.leafValues || {});  // { leafKey: number }
    let expectationShowContrib = false;      // "show contribution per leaf" toggle
    let preset = initialPresetKey;

    // ── Build DOM scaffold ─────────────────────────────────────────────────
    root.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'pt-header';
    {
      const h = document.createElement('h2');
      h.appendChild(document.createTextNode(titleText + ' '));
      const sub = document.createElement('span');
      sub.className = 'pt-subtitle';
      sub.textContent = 'edit branches · mark events · read off totals';
      h.appendChild(sub);
      header.appendChild(h);
    }
    root.appendChild(header);

    if (introHtml) {
      const intro = document.createElement('div');
      intro.className = 'pt-intro';
      intro.innerHTML = introHtml;
      root.appendChild(intro);
    }

    // Mode banner — visible only in conditional mode.
    const modeBanner = document.createElement('div');
    modeBanner.className = 'pt-mode-banner';
    modeBanner.textContent = 'Conditional mode is on. Branch probabilities can vary by parent.';
    modeBanner.style.display = 'none';
    root.appendChild(modeBanner);

    // ── Controls panel ────────────────────────────────────────────────────
    const controls = document.createElement('div');
    controls.className = 'pt-controls';

    // Row 1: preset selector + mode toggle.
    const row1 = document.createElement('div');
    row1.className = 'pt-controls-row';

    const presetGroup = document.createElement('div');
    presetGroup.className = 'pt-preset-group';
    const presetLabel = document.createElement('label');
    presetLabel.className = 'pt-form-label';
    presetLabel.htmlFor = instanceId + '-preset';
    presetLabel.textContent = 'preset:';
    const presetSelect = document.createElement('select');
    presetSelect.id = instanceId + '-preset';
    presetSelect.className = 'pt-preset-select';
    Object.keys(PRESETS).forEach(key => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = PRESETS[key].label;
      if (key === preset) opt.selected = true;
      presetSelect.appendChild(opt);
    });
    presetGroup.appendChild(presetLabel);
    presetGroup.appendChild(presetSelect);
    row1.appendChild(presetGroup);

    const modeGroup = document.createElement('div');
    modeGroup.className = 'pt-mode-group';
    const modeLabel = document.createElement('span');
    modeLabel.className = 'pt-form-label';
    modeLabel.textContent = 'branch probs:';
    const modeToggle = document.createElement('div');
    modeToggle.className = 'pt-mode-toggle';
    const fixedBtn = document.createElement('button');
    fixedBtn.type = 'button';
    fixedBtn.textContent = 'Fixed';
    fixedBtn.title = 'Branch probabilities at each level are shared across siblings (Module 7).';
    const condBtn = document.createElement('button');
    condBtn.type = 'button';
    condBtn.textContent = 'Conditional';
    condBtn.title = 'Each parent has its own probability set (Module 8).';
    modeToggle.appendChild(fixedBtn);
    modeToggle.appendChild(condBtn);
    modeGroup.appendChild(modeLabel);
    modeGroup.appendChild(modeToggle);
    row1.appendChild(modeGroup);

    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'pt-reset-btn';
    resetBtn.textContent = 'Reset event';
    row1.appendChild(resetBtn);

    // Watch / Practice pill — prominent header-level toggle that mirrors
    // the W27/W28 pattern: Watch is the default exploration UI, Practice
    // hides distractions and walks the student through a problem. This
    // is the rightmost element in the row so it reads as a primary action.
    const learnGroup = document.createElement('div');
    learnGroup.className = 'pt-learn-group';
    const learnLabel = document.createElement('span');
    learnLabel.className = 'pt-form-label';
    learnLabel.textContent = 'mode:';
    const learnToggle = document.createElement('div');
    learnToggle.className = 'pt-learn-toggle';
    const watchBtn = document.createElement('button');
    watchBtn.type = 'button';
    watchBtn.className = 'pt-learn-watch';
    watchBtn.textContent = 'Watch';
    watchBtn.title = 'Explore the tree freely — edit branches, mark events, run conditional and Bayes computations.';
    const practiceBtn = document.createElement('button');
    practiceBtn.type = 'button';
    practiceBtn.className = 'pt-learn-practice';
    practiceBtn.textContent = 'Practice';
    practiceBtn.title = 'Pick a worked problem and fill in each branch yourself, with per-branch validation.';
    learnToggle.appendChild(watchBtn);
    learnToggle.appendChild(practiceBtn);
    learnGroup.appendChild(learnLabel);
    learnGroup.appendChild(learnToggle);
    row1.appendChild(learnGroup);

    controls.appendChild(row1);

    // Row 2: structure controls (levels, branches per level).
    const row2 = document.createElement('div');
    row2.className = 'pt-controls-row pt-structure-row';
    const levelsGroup = document.createElement('div');
    levelsGroup.className = 'pt-structure-group';
    const levelsLabel = document.createElement('label');
    levelsLabel.className = 'pt-form-label';
    levelsLabel.htmlFor = instanceId + '-levels';
    levelsLabel.textContent = 'levels:';
    const levelsSelect = document.createElement('select');
    levelsSelect.id = instanceId + '-levels';
    [1, 2, 3].forEach(v => {
      const o = document.createElement('option');
      o.value = String(v); o.textContent = String(v);
      levelsSelect.appendChild(o);
    });
    levelsGroup.appendChild(levelsLabel);
    levelsGroup.appendChild(levelsSelect);
    row2.appendChild(levelsGroup);

    const branchesContainer = document.createElement('div');
    branchesContainer.className = 'pt-branches-container';
    row2.appendChild(branchesContainer);

    controls.appendChild(row2);
    root.appendChild(controls);

    // ── Tree canvas + sidebar ─────────────────────────────────────────────
    const main = document.createElement('div');
    main.className = 'pt-main';

    const canvasHost = document.createElement('div');
    canvasHost.className = 'pt-canvas-host';
    main.appendChild(canvasHost);

    const sidebar = document.createElement('div');
    sidebar.className = 'pt-sidebar';

    const eventCard = document.createElement('div');
    eventCard.className = 'pt-event-card';
    eventCard.innerHTML =
      '<div class="pt-event-card-title">Event probability</div>' +
      '<div class="pt-event-card-value">—</div>' +
      '<div class="pt-event-card-detail">Click any leaf to mark it.</div>';
    sidebar.appendChild(eventCard);

    // Conditional-probability panel (Module 8 extension). Off by default;
    // when active, students pick an Event A and a Conditioning Event B
    // and the widget reports P(A | B) = P(A∩B)/P(B).
    const condCard = document.createElement('div');
    condCard.className = 'pt-condprob-card';
    const condTitleRow = document.createElement('div');
    condTitleRow.className = 'pt-condprob-title-row';
    const condTitle = document.createElement('span');
    condTitle.className = 'pt-condprob-title';
    condTitle.textContent = 'Conditional probability';
    const condToggleBtn = document.createElement('button');
    condToggleBtn.type = 'button';
    condToggleBtn.className = 'pt-condprob-toggle-btn';
    condToggleBtn.textContent = 'show';
    condTitleRow.appendChild(condTitle);
    condTitleRow.appendChild(condToggleBtn);
    condCard.appendChild(condTitleRow);
    const condBody = document.createElement('div');
    condBody.className = 'pt-condprob-body';
    condBody.style.display = 'none';
    // Target selector — determines which set tree clicks toggle.
    const condTargetRow = document.createElement('div');
    condTargetRow.className = 'pt-target-row';
    const condTargetLabel = document.createElement('span');
    condTargetLabel.className = 'pt-form-label';
    condTargetLabel.textContent = 'tree clicks toggle:';
    const condTargetToggle = document.createElement('div');
    condTargetToggle.className = 'pt-target-toggle';
    const condTargetA = document.createElement('button');
    condTargetA.type = 'button';
    condTargetA.textContent = 'Event A';
    condTargetA.className = 'pt-target-A';
    const condTargetB = document.createElement('button');
    condTargetB.type = 'button';
    condTargetB.textContent = 'Conditioning B';
    condTargetB.className = 'pt-target-B';
    condTargetToggle.appendChild(condTargetA);
    condTargetToggle.appendChild(condTargetB);
    condTargetRow.appendChild(condTargetLabel);
    condTargetRow.appendChild(condTargetToggle);
    condBody.appendChild(condTargetRow);
    // Readout area.
    const condReadout = document.createElement('div');
    condReadout.className = 'pt-condprob-readout';
    condBody.appendChild(condReadout);
    // Reset-B link (small, since A reset is the existing "Reset event" btn).
    const condResetRow = document.createElement('div');
    condResetRow.className = 'pt-condprob-reset-row';
    const condResetBBtn = document.createElement('button');
    condResetBBtn.type = 'button';
    condResetBBtn.className = 'pt-link-btn';
    condResetBBtn.textContent = 'clear B';
    const condResetABtn = document.createElement('button');
    condResetABtn.type = 'button';
    condResetABtn.className = 'pt-link-btn';
    condResetABtn.textContent = 'clear A';
    condResetRow.appendChild(condResetABtn);
    condResetRow.appendChild(condResetBBtn);
    condBody.appendChild(condResetRow);
    condCard.appendChild(condBody);
    sidebar.appendChild(condCard);

    // Bayes-overlay panel (Module 8 extension; pre-load for Segment 8.1).
    // Shows the same posterior computed three ways: tree traversal, Bayes
    // formula, and the N=10000 frequentist reframing. Hypothesis is one
    // of the level-1 branches (chosen via dropdown). Evidence is the
    // conditioning set B from the panel above.
    const bayesCard = document.createElement('div');
    bayesCard.className = 'pt-bayes-card';
    const bayesTitleRow = document.createElement('div');
    bayesTitleRow.className = 'pt-bayes-title-row';
    const bayesTitle = document.createElement('span');
    bayesTitle.className = 'pt-bayes-title';
    bayesTitle.textContent = 'Bayes overlay';
    const bayesToggleBtn = document.createElement('button');
    bayesToggleBtn.type = 'button';
    bayesToggleBtn.className = 'pt-condprob-toggle-btn';
    bayesToggleBtn.textContent = 'show';
    bayesTitleRow.appendChild(bayesTitle);
    bayesTitleRow.appendChild(bayesToggleBtn);
    bayesCard.appendChild(bayesTitleRow);
    const bayesBody = document.createElement('div');
    bayesBody.className = 'pt-bayes-body';
    bayesBody.style.display = 'none';
    const bayesHypRow = document.createElement('div');
    bayesHypRow.className = 'pt-bayes-hyp-row';
    const bayesHypLabel = document.createElement('span');
    bayesHypLabel.className = 'pt-form-label';
    bayesHypLabel.textContent = 'hypothesis (first-level branch):';
    const bayesHypSelect = document.createElement('select');
    bayesHypSelect.className = 'pt-bayes-hyp-select';
    bayesHypRow.appendChild(bayesHypLabel);
    bayesHypRow.appendChild(bayesHypSelect);
    bayesBody.appendChild(bayesHypRow);
    const bayesHint = document.createElement('div');
    bayesHint.className = 'pt-bayes-hint';
    bayesHint.textContent = 'Evidence is whatever you mark as B in the panel above.';
    bayesBody.appendChild(bayesHint);
    const bayesForms = document.createElement('div');
    bayesForms.className = 'pt-bayes-forms';
    bayesBody.appendChild(bayesForms);
    bayesCard.appendChild(bayesBody);
    sidebar.appendChild(bayesCard);

    // Practice-mode panel (Module 8 extension). Activated via the
    // header Watch / Practice pill. Loads a problem prompt; tree
    // skeleton + labels are fixed, all branch probabilities start blank,
    // and per-branch validation against the expected answer fires a
    // green ✓ or a red ✗ + hint after each entry.
    const guidedCard = document.createElement('div');
    guidedCard.className = 'pt-guided-card';
    const guidedTitleRow = document.createElement('div');
    guidedTitleRow.className = 'pt-guided-title-row';
    const guidedTitle = document.createElement('span');
    guidedTitle.className = 'pt-guided-title';
    guidedTitle.textContent = 'Practice mode';
    guidedTitleRow.appendChild(guidedTitle);
    guidedCard.appendChild(guidedTitleRow);
    const guidedBody = document.createElement('div');
    guidedBody.className = 'pt-guided-body';
    guidedBody.style.display = 'none';
    const guidedProblemRow = document.createElement('div');
    guidedProblemRow.className = 'pt-guided-problem-row';
    const guidedProblemLabel = document.createElement('span');
    guidedProblemLabel.className = 'pt-form-label';
    guidedProblemLabel.textContent = 'problem:';
    const guidedProblemSelect = document.createElement('select');
    guidedProblemSelect.className = 'pt-guided-problem-select';
    Object.keys(GUIDED_PROBLEMS).forEach(key => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = GUIDED_PROBLEMS[key].label;
      if (key === guidedProblemKey) opt.selected = true;
      guidedProblemSelect.appendChild(opt);
    });
    guidedProblemRow.appendChild(guidedProblemLabel);
    guidedProblemRow.appendChild(guidedProblemSelect);
    guidedBody.appendChild(guidedProblemRow);
    const guidedStatement = document.createElement('div');
    guidedStatement.className = 'pt-guided-statement';
    guidedBody.appendChild(guidedStatement);
    const guidedProgress = document.createElement('div');
    guidedProgress.className = 'pt-guided-progress';
    guidedBody.appendChild(guidedProgress);
    const guidedHintBox = document.createElement('div');
    guidedHintBox.className = 'pt-guided-hint';
    guidedBody.appendChild(guidedHintBox);
    guidedCard.appendChild(guidedBody);
    sidebar.appendChild(guidedCard);

    // Expectation-overlay panel (Module 9 extension). Off by default in
    // M7/M8 presets; on by default in the M9 expectation presets
    // (montanaHill, coldX, laundryBusy). When active, each leaf gets a
    // numeric-value input and the panel displays
    //     E = Σ (leaf value) × (leaf probability)
    // live as the student edits values or branches.
    const expectCard = document.createElement('div');
    expectCard.className = 'pt-expect-card';
    const expectTitleRow = document.createElement('div');
    expectTitleRow.className = 'pt-expect-title-row';
    const expectTitle = document.createElement('span');
    expectTitle.className = 'pt-expect-title';
    expectTitle.textContent = 'Expectation';
    const expectToggleBtn = document.createElement('button');
    expectToggleBtn.type = 'button';
    expectToggleBtn.className = 'pt-condprob-toggle-btn';
    expectToggleBtn.textContent = 'show';
    expectTitleRow.appendChild(expectTitle);
    expectTitleRow.appendChild(expectToggleBtn);
    expectCard.appendChild(expectTitleRow);
    const expectBody = document.createElement('div');
    expectBody.className = 'pt-expect-body';
    expectBody.style.display = 'none';
    const expectHint = document.createElement('div');
    expectHint.className = 'pt-bayes-hint';
    expectHint.textContent = 'Each leaf takes a numeric value. The widget multiplies value × probability at each leaf and sums over all leaves.';
    expectBody.appendChild(expectHint);
    const expectContribRow = document.createElement('label');
    expectContribRow.className = 'pt-expect-contrib-row';
    const expectContribCheck = document.createElement('input');
    expectContribCheck.type = 'checkbox';
    expectContribRow.appendChild(expectContribCheck);
    const expectContribTxt = document.createElement('span');
    expectContribTxt.textContent = ' show value × prob next to each leaf';
    expectContribRow.appendChild(expectContribTxt);
    expectBody.appendChild(expectContribRow);
    const expectReadout = document.createElement('div');
    expectReadout.className = 'pt-expect-readout';
    expectBody.appendChild(expectReadout);
    const expectBreakdown = document.createElement('div');
    expectBreakdown.className = 'pt-expect-breakdown';
    expectBody.appendChild(expectBreakdown);
    const expectResetRow = document.createElement('div');
    expectResetRow.className = 'pt-condprob-reset-row';
    const expectClearBtn = document.createElement('button');
    expectClearBtn.type = 'button';
    expectClearBtn.className = 'pt-link-btn';
    expectClearBtn.textContent = 'clear values';
    expectResetRow.appendChild(expectClearBtn);
    expectBody.appendChild(expectResetRow);
    expectCard.appendChild(expectBody);
    sidebar.appendChild(expectCard);

    const sampleCard = document.createElement('div');
    sampleCard.className = 'pt-sample-card';
    sampleCard.innerHTML =
      '<div class="pt-sample-card-title">Sample-space check</div>' +
      '<div class="pt-sample-card-value">Σ leaves = —</div>' +
      '<div class="pt-sample-card-detail">should equal 1</div>';
    sidebar.appendChild(sampleCard);

    const tipsCard = document.createElement('div');
    tipsCard.className = 'pt-tips-card';
    tipsCard.innerHTML =
      '<div class="pt-tips-title">How to use</div>' +
      '<ul class="pt-tips-list">' +
      '<li>Click any branch probability to edit it. Siblings auto-normalize to sum to 1.</li>' +
      '<li>Click any leaf circle to mark it as part of your event.</li>' +
      '<li>Joint probability at each leaf = product along the path from the root.</li>' +
      '<li>Total event probability = sum across marked leaves.</li>' +
      '</ul>';
    sidebar.appendChild(tipsCard);

    main.appendChild(sidebar);
    root.appendChild(main);

    // ── Helpers (state-aware) ──────────────────────────────────────────────
    // In Practice mode, derived probabilities (leaf joints, sample-space
    // sum, event probability, conditional/Bayes readouts) should only
    // appear after the student has typed values for the contributing
    // branches. A branch with feedback === 'pending' has no entered
    // value yet; any leaf descended from such a branch has an undefined
    // joint until the branch is filled in.
    function isLeafJointVisible(leafPath) {
      if (!guidedActive) return true;
      for (let lvl = 0; lvl < leafPath.length; lvl++) {
        const parentKey = pathKey(leafPath.slice(0, lvl));
        const branchIdx = leafPath[lvl];
        const fb = guidedFeedback[parentKey];
        if (!fb || fb[branchIdx] === 'pending') return false;
      }
      return true;
    }

    // True when every leaf has a fully-entered ancestor chain (so global
    // sums like Σ leaves are meaningful).
    function allLeafJointsVisible() {
      if (!guidedActive) return true;
      const layout = buildTree(levels, branches, branchProbs);
      let ok = true;
      walkTree(layout.root, (n) => {
        if (n.type === 'leaf' && !isLeafJointVisible(n.path)) ok = false;
      });
      return ok;
    }

    function siblingsSumAt(parentKey, level) {
      const arr = branchProbs[parentKey] || uniformProbs(branches[level]);
      let s = 0;
      for (let i = 0; i < arr.length; i++) s += arr[i];
      return s;
    }

    function sampleSpaceSum() {
      let total = 0;
      const layout = buildTree(levels, branches, branchProbs);
      walkTree(layout.root, (n) => { if (n.type === 'leaf') total += n.joint; });
      return total;
    }

    // ── Render ─────────────────────────────────────────────────────────────
    function renderAll() {
      renderStructureControls();
      renderModeUI();
      renderTree();
      renderSidebar();
      renderCondProbCard();
      renderBayesCard();
      renderExpectationCard();
      renderGuidedCard();
    }

    function loadGuidedProblem(key) {
      const prob = GUIDED_PROBLEMS[key];
      if (!prob) return;
      guidedProblemKey = key;
      // Initialize structure from the problem's spec.
      levels = prob.structure.levels;
      branches = prob.structure.branches.slice();
      branchLabels = prob.structure.labels.map(arr => arr.slice());
      // Start branch probabilities at uniform (= "blank" — students fill them in).
      const blankFixed = [];
      for (let l = 0; l < levels; l++) blankFixed.push(uniformProbs(branches[l]));
      branchProbs = expandFixed(blankFixed, levels, branches);
      // Conditional mode is implicit in guided-build (so per-parent edits
      // don't propagate); the spec says structure is read-only here.
      probMode = (prob.expected) ? 'conditional' : probMode;
      // Reset feedback markers — every branch starts pending.
      guidedFeedback = {};
      for (let lvl = 0; lvl < levels; lvl++) {
        for (const k of parentKeysAtLevel(lvl, branches)) {
          guidedFeedback[k] = [];
          for (let i = 0; i < branches[lvl]; i++) guidedFeedback[k].push('pending');
        }
      }
      eventLeaves.clear();
      conditioningLeaves.clear();
      preset = '__custom__';
      presetSelect.value = '';
    }

    function renderStructureControls() {
      levelsSelect.value = String(levels);
      // Lock structure controls when guided-build is active — the
      // problem statement determines the structure.
      levelsSelect.disabled = guidedActive;
      presetSelect.disabled = guidedActive;
      branchesContainer.innerHTML = '';
      for (let lvl = 0; lvl < levels; lvl++) {
        const grp = document.createElement('div');
        grp.className = 'pt-structure-group';
        const lbl = document.createElement('label');
        lbl.className = 'pt-form-label';
        lbl.htmlFor = instanceId + '-branches-' + lvl;
        lbl.textContent = 'level ' + (lvl + 1) + ' branches:';
        const sel = document.createElement('select');
        sel.id = instanceId + '-branches-' + lvl;
        if (guidedActive) sel.disabled = true;
        [2, 3, 4, 5].forEach(v => {
          const o = document.createElement('option');
          o.value = String(v); o.textContent = String(v);
          if (v === branches[lvl]) o.selected = true;
          sel.appendChild(o);
        });
        sel.addEventListener('change', () => {
          const newVal = Math.floor(Number(sel.value));
          if (newVal === branches[lvl]) return;
          branches = branches.slice();
          branches[lvl] = newVal;
          // Reset this level's labels to generic.
          branchLabels[lvl] = [];
          for (let i = 0; i < newVal; i++) branchLabels[lvl].push(genericLabel(i));
          // Rebuild branchProbs from a fresh canonical set: keep the
          // first-parent values at each unaffected level and drop the
          // changed level + downstream levels back to uniform.
          const canonical = [];
          for (let l = 0; l < levels; l++) {
            if (l < lvl) {
              canonical.push(canonicalLevelArray(branchProbs, l, branches));
            } else {
              canonical.push(uniformProbs(branches[l]));
            }
          }
          branchProbs = expandFixed(canonical, levels, branches);
          eventLeaves.clear();
          preset = '__custom__';
          presetSelect.value = '';
          renderAll();
        });
        grp.appendChild(lbl);
        grp.appendChild(sel);
        branchesContainer.appendChild(grp);
      }
    }

    function renderModeUI() {
      fixedBtn.classList.toggle('pt-active', probMode === 'fixed');
      condBtn.classList.toggle('pt-active', probMode === 'conditional');
      modeBanner.style.display = (probMode === 'conditional') ? '' : 'none';
    }

    function renderTree() {
      canvasHost.innerHTML = '';
      const layout = buildTree(levels, branches, branchProbs);
      const treeRoot = layout.root;
      const tot = layout.totalLeaves;

      const SVG_HEIGHT = layout.TOP_MARGIN + (tot - 1) * layout.LEAF_SPACING + 50;
      // Per-leaf box width is larger when the expectation overlay is on
      // (path · joint · v=[input] · contrib) — pad the right margin so the
      // leaf-boxes don't clip into the sidebar.
      const RIGHT_PAD = expectationActive ? 360 : 220;
      const SVG_WIDTH = layout.LEFT_MARGIN + levels * layout.LEVEL_SPACING + RIGHT_PAD;

      const canvas = document.createElement('div');
      canvas.className = 'pt-canvas';
      canvas.style.position = 'relative';
      canvas.style.width = SVG_WIDTH + 'px';
      canvas.style.height = SVG_HEIGHT + 'px';

      const svg = svgEl('svg', {
        class: 'pt-tree-svg',
        width: SVG_WIDTH, height: SVG_HEIGHT,
        viewBox: '0 0 ' + SVG_WIDTH + ' ' + SVG_HEIGHT
      });

      // Determine, for each leaf, the color class its leaf-branch should
      // take so the line picks up the same style. Higher-level branches
      // remain default since they are typically shared across multiple
      // leaves with mixed A/B membership.
      function leafBranchClass(leafNode) {
        if (!condProbActive) {
          return eventLeaves.has(leafKey(leafNode.path))
            ? 'pt-branch-line pt-branch-event'
            : 'pt-branch-line';
        }
        const k = leafKey(leafNode.path);
        const inA = eventLeaves.has(k);
        const inB = conditioningLeaves.has(k);
        if (inA && inB) return 'pt-branch-line pt-branch-AB';
        if (inB) return 'pt-branch-line pt-branch-B';
        if (inA) return 'pt-branch-line pt-branch-event';
        return 'pt-branch-line pt-branch-faded';
      }
      walkBranches(treeRoot, (parent, child) => {
        const cls = (child.type === 'leaf')
          ? leafBranchClass(child)
          : 'pt-branch-line';
        const ln = svgEl('line', {
          class: cls,
          x1: parent.x, y1: parent.y,
          x2: child.x, y2: child.y
        });
        svg.appendChild(ln);
      });

      walkTree(treeRoot, (n) => {
        if (n.type === 'leaf') {
          const k = leafKey(n.path);
          const inA = eventLeaves.has(k);
          const inB = conditioningLeaves.has(k);
          let cls = 'pt-leaf-circle';
          if (condProbActive) {
            // M8 conditional-prob visualization: A∩B purple, B-only blue,
            // A-only amber (matching the existing event style), neither
            // gray. Whatever style is set here is also reflected on the
            // leaf's parent-branch line below.
            if (inA && inB) cls += ' pt-leaf-AB';
            else if (inB) cls += ' pt-leaf-B';
            else if (inA) cls += ' pt-leaf-event';
            else cls += ' pt-leaf-faded';
          } else if (inA) {
            cls += ' pt-leaf-event';
          }
          const c = svgEl('circle', {
            class: cls,
            cx: n.x, cy: n.y, r: 14,
            'data-leafkey': k
          });
          svg.appendChild(c);
        } else {
          const c = svgEl('circle', {
            class: 'pt-internal-dot',
            cx: n.x, cy: n.y, r: n.depth === 0 ? 6 : 4
          });
          svg.appendChild(c);
        }
      });

      canvas.appendChild(svg);

      // HTML overlays: branch editors at each branch midpoint.
      walkBranches(treeRoot, (parent, child) => {
        const lvl = parent.depth;
        const branchIdx = child.path[lvl];
        const parentKey = pathKey(parent.path);
        const midX = (parent.x + child.x) / 2;
        const midY = (parent.y + child.y) / 2;
        const EDITOR_W = 100;
        const EDITOR_H = 22;
        const branchEditor = document.createElement('div');
        branchEditor.className = 'pt-branch-editor';
        branchEditor.style.position = 'absolute';
        branchEditor.style.left = (midX - EDITOR_W / 2) + 'px';
        branchEditor.style.top = (midY - EDITOR_H / 2) + 'px';
        branchEditor.style.width = EDITOR_W + 'px';

        const lblSpan = document.createElement('span');
        lblSpan.className = 'pt-branch-label';
        lblSpan.textContent = branchLabels[lvl][branchIdx] || '';

        const inp = document.createElement('input');
        inp.type = 'text';
        inp.className = 'pt-branch-prob';
        const arr = branchProbs[parentKey] || uniformProbs(branches[lvl]);
        // In guided mode, a "pending" branch reads as blank so students
        // can fill it in. Once they enter a value, the cell shows the
        // typed value (correct or wrong).
        const fb = (guidedActive && guidedFeedback[parentKey])
          ? guidedFeedback[parentKey][branchIdx] : null;
        if (guidedActive && fb === 'pending') {
          inp.value = '';
          inp.placeholder = '?';
        } else {
          // Prefer the per-preset display hint when it's still numerically
          // accurate (i.e., the user hasn't edited this parent's values).
          const hintArr = branchProbLabels[parentKey];
          const hintStr = hintArr ? hintArr[branchIdx] : null;
          let displayValue = null;
          if (hintStr) {
            const hintVal = parseFracOrNumStr(hintStr);
            if (Number.isFinite(hintVal) && Math.abs(hintVal - arr[branchIdx]) < EPS) {
              displayValue = hintStr;
            }
          }
          inp.value = (displayValue != null) ? displayValue : fmtProb(arr[branchIdx]);
        }
        if (guidedActive) {
          if (fb === 'correct') branchEditor.classList.add('pt-branch-correct');
          else if (fb === 'wrong') branchEditor.classList.add('pt-branch-wrong');
          else branchEditor.classList.add('pt-branch-pending');
        }
        inp.dataset.level = String(lvl);
        inp.dataset.branchIdx = String(branchIdx);
        inp.dataset.parentKey = parentKey;
        inp.size = 4;
        inp.setAttribute('aria-label',
          'probability for ' + (branchLabels[lvl][branchIdx] || ('branch ' + (branchIdx + 1))) +
          ' at level ' + (lvl + 1) +
          (probMode === 'conditional' ? ' under parent ' + (parentKey || 'root') : ''));
        inp.addEventListener('focus', () => { inp.select(); });
        inp.addEventListener('blur', () => commitBranchEdit(inp));
        inp.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') { e.preventDefault(); inp.blur(); }
          else if (e.key === 'Escape') {
            const cur = branchProbs[parentKey] || uniformProbs(branches[lvl]);
            inp.value = fmtProb(cur[branchIdx]);
            inp.blur();
          }
        });
        branchEditor.appendChild(lblSpan);
        branchEditor.appendChild(inp);
        canvas.appendChild(branchEditor);
      });

      // HTML overlays: leaf rows (path + joint prob, click toggles event).
      walkTree(treeRoot, (n) => {
        if (n.type !== 'leaf') return;
        const k = leafKey(n.path);
        const isEvent = eventLeaves.has(k);
        const leafBox = document.createElement('div');
        leafBox.className = 'pt-leaf-box' + (isEvent ? ' pt-leaf-box-event' : '');
        leafBox.style.position = 'absolute';
        leafBox.style.left = (n.x + 20) + 'px';
        leafBox.style.top = (n.y - 16) + 'px';
        leafBox.dataset.leafkey = k;

        const pathStr = document.createElement('span');
        pathStr.className = 'pt-leaf-path';
        const labelsAlongPath = n.path.map((bi, lvl) => branchLabels[lvl][bi]).join(', ');
        pathStr.textContent = labelsAlongPath;

        const jointStr = document.createElement('span');
        jointStr.className = 'pt-leaf-joint';
        const jointVisible = isLeafJointVisible(n.path);
        if (jointVisible) {
          jointStr.textContent = ' = ' + fmtProb(n.joint);
        } else {
          jointStr.textContent = '';
          leafBox.classList.add('pt-leaf-box-pending');
        }

        leafBox.appendChild(pathStr);
        leafBox.appendChild(jointStr);

        // Expectation overlay: per-leaf numeric value input + contribution.
        if (expectationActive) {
          const valWrap = document.createElement('span');
          valWrap.className = 'pt-leaf-value-wrap';

          const valLbl = document.createElement('span');
          valLbl.className = 'pt-leaf-value-label';
          valLbl.textContent = ' · v=';
          valWrap.appendChild(valLbl);

          const valInp = document.createElement('input');
          valInp.type = 'text';
          valInp.className = 'pt-leaf-value-input';
          valInp.size = 5;
          const stored = leafValues[k];
          valInp.value = (stored == null || !Number.isFinite(stored)) ? '' : fmtLeafValue(stored);
          valInp.placeholder = '?';
          valInp.dataset.leafkey = k;
          valInp.setAttribute('aria-label',
            'numeric value for leaf ' + labelsAlongPath);
          valInp.addEventListener('focus', (ev) => {
            ev.stopPropagation();
            valInp.select();
          });
          valInp.addEventListener('click', (ev) => { ev.stopPropagation(); });
          valInp.addEventListener('input', () => onLeafValueInput(k, valInp));
          valInp.addEventListener('blur', () => onLeafValueCommit(k, valInp));
          valInp.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); valInp.blur(); }
            else if (e.key === 'Escape') {
              const cur = leafValues[k];
              valInp.value = (cur == null || !Number.isFinite(cur)) ? '' : fmtLeafValue(cur);
              valInp.blur();
            }
          });
          valWrap.appendChild(valInp);

          if (expectationShowContrib && jointVisible
              && stored != null && Number.isFinite(stored)) {
            const contrib = document.createElement('span');
            contrib.className = 'pt-leaf-contrib';
            contrib.dataset.leafkey = k;
            contrib.textContent = ' → ' + fmtLeafValue(stored * n.joint);
            valWrap.appendChild(contrib);
          }
          leafBox.appendChild(valWrap);
        }

        leafBox.addEventListener('click', () => toggleLeafEvent(k));
        canvas.appendChild(leafBox);
      });

      svg.querySelectorAll('.pt-leaf-circle').forEach(circle => {
        circle.addEventListener('click', () => toggleLeafEvent(circle.getAttribute('data-leafkey')));
      });

      canvasHost.appendChild(canvas);
    }

    function commitBranchEdit(inp) {
      const lvl = Number(inp.dataset.level);
      const idx = Number(inp.dataset.branchIdx);
      const parentKey = inp.dataset.parentKey;
      let raw = inp.value.trim();
      let v = NaN;
      if (raw.indexOf('/') !== -1) {
        const parts = raw.split('/');
        const a = Number(parts[0]);
        const b = Number(parts[1]);
        if (Number.isFinite(a) && Number.isFinite(b) && b !== 0) v = a / b;
      } else {
        v = Number(raw);
      }
      if (!Number.isFinite(v)) {
        const cur = branchProbs[parentKey] || uniformProbs(branches[lvl]);
        inp.value = fmtProb(cur[idx]);
        return;
      }
      v = Math.max(0, Math.min(1, v));

      if (guidedActive) {
        // Guided-build: validate against the expected answer for this
        // specific branch. The "blank" guided problem has no expected
        // answers, so we accept anything in that case. Editing a single
        // branch in guided mode does NOT auto-normalize siblings —
        // students enter each value as the problem specifies.
        const prob = GUIDED_PROBLEMS[guidedProblemKey];
        const arr = (branchProbs[parentKey] || uniformProbs(branches[lvl])).slice();
        arr[idx] = v;
        branchProbs[parentKey] = arr;
        if (!guidedFeedback[parentKey]) {
          guidedFeedback[parentKey] = [];
          for (let i = 0; i < branches[lvl]; i++) guidedFeedback[parentKey].push('pending');
        }
        if (prob && prob.expected && prob.expected[parentKey]) {
          const expected = prob.expected[parentKey][idx];
          guidedFeedback[parentKey][idx] = (Math.abs(v - expected) < 1e-3) ? 'correct' : 'wrong';
        } else {
          // Blank custom problem — no validation, just record the value.
          guidedFeedback[parentKey][idx] = 'correct';
        }
        renderAll();
        return;
      }

      const oldArr = (branchProbs[parentKey] || uniformProbs(branches[lvl])).slice();
      const newArr = normalizeAfterEdit(oldArr, idx, v);

      if (probMode === 'fixed') {
        // Propagate the new array to every parent at the same level,
        // keeping the second-stage independent of the first stage.
        for (const k of parentKeysAtLevel(lvl, branches)) {
          branchProbs[k] = newArr.slice();
        }
      } else {
        branchProbs[parentKey] = newArr;
      }
      preset = '__custom__';
      presetSelect.value = '';
      renderAll();
    }

    function toggleLeafEvent(key) {
      // Route the click to whichever set is the active target. When the
      // P(A|B) panel is hidden, target is always 'A' (so the existing
      // single-event workflow is preserved).
      const set = (condProbActive && condProbTarget === 'B')
        ? conditioningLeaves
        : eventLeaves;
      if (set.has(key)) set.delete(key);
      else set.add(key);
      renderAll();
    }

    function renderSidebar() {
      const layout = buildTree(levels, branches, branchProbs);
      // Only contribute to derived sums when the leaf's full ancestor
      // chain has been entered (in Practice mode); in Watch mode every
      // leaf is always visible.
      let pA = 0;
      let pB = 0;
      let pAB = 0;
      let sampleSum = 0;
      let anyHidden = false;
      walkTree(layout.root, (n) => {
        if (n.type !== 'leaf') return;
        if (!isLeafJointVisible(n.path)) { anyHidden = true; return; }
        sampleSum += n.joint;
        const k = leafKey(n.path);
        const inA = eventLeaves.has(k);
        const inB = conditioningLeaves.has(k);
        if (inA) pA += n.joint;
        if (inB) pB += n.joint;
        if (inA && inB) pAB += n.joint;
      });
      const evtCardValue = eventCard.querySelector('.pt-event-card-value');
      const evtCardDetail = eventCard.querySelector('.pt-event-card-detail');
      if (eventLeaves.size === 0) {
        evtCardValue.textContent = '—';
        evtCardDetail.textContent = 'Click any leaf to mark it.';
      } else if (anyHidden) {
        evtCardValue.textContent = '—';
        evtCardDetail.textContent = 'Fill in the branches to compute P(A).';
      } else {
        const labelLetter = condProbActive ? 'A' : 'E';
        evtCardValue.textContent = 'P(' + labelLetter + ') = ' + fmtProb(pA);
        evtCardDetail.textContent = eventLeaves.size + ' ' +
          (eventLeaves.size === 1 ? 'leaf' : 'leaves') + ' marked';
      }
      const sampleCardValue = sampleCard.querySelector('.pt-sample-card-value');
      const sampleCardDetail = sampleCard.querySelector('.pt-sample-card-detail');
      if (anyHidden) {
        sampleCardValue.textContent = 'Σ leaves = —';
        sampleCard.classList.remove('pt-sample-ok');
        sampleCard.classList.remove('pt-sample-bad');
        sampleCardDetail.textContent = 'fill in the branches to check the sum';
      } else {
        sampleCardValue.textContent = 'Σ leaves = ' + fmtProb(sampleSum);
        const ok = Math.abs(sampleSum - 1) < 1e-3;
        sampleCard.classList.toggle('pt-sample-ok', ok);
        sampleCard.classList.toggle('pt-sample-bad', !ok);
        sampleCardDetail.textContent = ok ? '✓ valid sample space' : '⚠ probabilities don\'t sum to 1';
      }
      // Stash the joint sums + visibility so renderCondProbCard / Bayes
      // can reuse them without rewalking the tree.
      sidebar.dataset.pA = String(pA);
      sidebar.dataset.pB = String(pB);
      sidebar.dataset.pAB = String(pAB);
      sidebar.dataset.anyHidden = anyHidden ? '1' : '0';
    }

    function renderCondProbCard() {
      condTitleRow.classList.toggle('pt-cond-active', condProbActive);
      condBody.style.display = condProbActive ? '' : 'none';
      condToggleBtn.textContent = condProbActive ? 'hide' : 'show';
      condTargetA.classList.toggle('pt-active', condProbTarget === 'A');
      condTargetB.classList.toggle('pt-active', condProbTarget === 'B');
      if (!condProbActive) return;
      const pA = Number(sidebar.dataset.pA || '0');
      const pB = Number(sidebar.dataset.pB || '0');
      const pAB = Number(sidebar.dataset.pAB || '0');
      const anyHidden = sidebar.dataset.anyHidden === '1';
      condReadout.innerHTML = '';
      if (anyHidden) {
        const stub = document.createElement('div');
        stub.className = 'pt-readout-empty';
        stub.textContent = 'Fill in the branches to compute conditional probabilities.';
        condReadout.appendChild(stub);
        return;
      }
      const aLine = document.createElement('div');
      aLine.className = 'pt-condprob-line';
      aLine.innerHTML = '<span class="pt-readout-label">A:</span> ' +
        (eventLeaves.size === 0
          ? '<span class="pt-readout-empty">no leaves marked</span>'
          : eventLeaves.size + ' ' + (eventLeaves.size === 1 ? 'leaf' : 'leaves') +
            '  ·  P(A) = ' + fmtProb(pA));
      condReadout.appendChild(aLine);
      const bLine = document.createElement('div');
      bLine.className = 'pt-condprob-line';
      bLine.innerHTML = '<span class="pt-readout-label">B:</span> ' +
        (conditioningLeaves.size === 0
          ? '<span class="pt-readout-empty">no leaves marked</span>'
          : conditioningLeaves.size + ' ' +
            (conditioningLeaves.size === 1 ? 'leaf' : 'leaves') +
            '  ·  P(B) = ' + fmtProb(pB));
      condReadout.appendChild(bLine);
      const abLine = document.createElement('div');
      abLine.className = 'pt-condprob-line';
      abLine.innerHTML = '<span class="pt-readout-label">A∩B:</span> P(A∩B) = ' + fmtProb(pAB);
      condReadout.appendChild(abLine);
      const result = document.createElement('div');
      result.className = 'pt-condprob-result';
      if (conditioningLeaves.size === 0) {
        result.innerHTML =
          '<span class="pt-readout-empty">Mark at least one leaf for B to compute P(A | B).</span>';
      } else if (pB <= EPS) {
        result.innerHTML =
          '<span class="pt-readout-empty">P(B) = 0, so P(A | B) is undefined.</span>';
      } else {
        const ratio = pAB / pB;
        result.innerHTML =
          'P(A | B) = P(A∩B) / P(B) = ' + fmtProb(pAB) + ' / ' + fmtProb(pB) +
          ' = <span class="pt-condprob-answer">' + fmtProb(ratio) + '</span>' +
          ' <span class="pt-readout-aux">(' + fmtDecimal(ratio, 4) + ')</span>';
      }
      condReadout.appendChild(result);
    }

    function renderGuidedCard() {
      // Card is shown only in Practice mode — the header pill is the
      // entry point in Watch mode, so an empty card would be wasted space.
      guidedCard.style.display = guidedActive ? '' : 'none';
      guidedBody.style.display = guidedActive ? '' : 'none';
      guidedTitleRow.classList.toggle('pt-cond-active', guidedActive);
      guidedCard.classList.toggle('pt-guided-active', guidedActive);
      watchBtn.classList.toggle('pt-active', !guidedActive);
      practiceBtn.classList.toggle('pt-active', guidedActive);
      guidedProblemSelect.value = guidedProblemKey;
      const prob = GUIDED_PROBLEMS[guidedProblemKey];
      if (!prob) return;
      guidedStatement.innerHTML = '';
      if (guidedActive) {
        const stmt = document.createElement('div');
        stmt.className = 'pt-guided-statement-text';
        stmt.textContent = prob.statement;
        guidedStatement.appendChild(stmt);
      }
      // Progress + hint readouts.
      guidedProgress.innerHTML = '';
      guidedHintBox.innerHTML = '';
      if (!guidedActive) return;
      let totalSlots = 0;
      let correctSlots = 0;
      let firstWrongHint = null;
      let firstPendingMsg = null;
      for (let lvl = 0; lvl < levels; lvl++) {
        for (const k of parentKeysAtLevel(lvl, branches)) {
          const fbArr = guidedFeedback[k] || [];
          for (let i = 0; i < branches[lvl]; i++) {
            totalSlots++;
            if (fbArr[i] === 'correct') correctSlots++;
            else if (fbArr[i] === 'wrong' && !firstWrongHint && prob.hints && prob.hints[k]) {
              firstWrongHint = prob.hints[k][i];
            } else if (fbArr[i] === 'pending' && !firstPendingMsg) {
              const lbl = (branchLabels[lvl] && branchLabels[lvl][i]) || ('branch ' + (i + 1));
              firstPendingMsg = 'Next: enter the probability for the ' +
                (k === '' ? 'level-1 ' : 'level-' + (lvl + 1) + ' ') +
                '"' + lbl + '" branch' +
                (k === '' ? '.' : ' under parent "' + parentLabelFromKey(k) + '".');
            }
          }
        }
      }
      const allCorrect = (correctSlots === totalSlots && totalSlots > 0);
      const progress = document.createElement('div');
      progress.className = 'pt-guided-progress-line' + (allCorrect ? ' pt-guided-done' : '');
      progress.textContent = correctSlots + ' / ' + totalSlots + ' branches correct' +
        (allCorrect ? '  ✓ all done' : '');
      guidedProgress.appendChild(progress);
      if (firstWrongHint) {
        const h = document.createElement('div');
        h.className = 'pt-guided-hint-line pt-guided-hint-wrong';
        h.innerHTML = '<span class="pt-readout-label">Hint:</span> ' + firstWrongHint;
        guidedHintBox.appendChild(h);
      } else if (firstPendingMsg) {
        const h = document.createElement('div');
        h.className = 'pt-guided-hint-line';
        h.textContent = firstPendingMsg;
        guidedHintBox.appendChild(h);
      } else if (allCorrect) {
        const h = document.createElement('div');
        h.className = 'pt-guided-hint-line pt-guided-hint-done';
        h.textContent = 'Tree built. Use the panels above to explore conditional and Bayes computations.';
        guidedHintBox.appendChild(h);
      }
    }

    function parentLabelFromKey(k) {
      // Translate "0-1" to e.g. "branch1, branch2" using branchLabels.
      if (!k) return 'root';
      const parts = k.split('-').map(Number);
      const labels = parts.map((idx, lvl) =>
        (branchLabels[lvl] && branchLabels[lvl][idx]) ? branchLabels[lvl][idx] : ('branch ' + (idx + 1)));
      return labels.join(' → ');
    }

    // ── Expectation overlay (M9) ──────────────────────────────────────────
    function parseLeafValue(raw) {
      if (raw == null) return NaN;
      const s = String(raw).trim();
      if (s === '') return NaN;
      // Fraction "a/b"
      const m = s.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
      if (m) {
        const a = Number(m[1]);
        const b = Number(m[2]);
        if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return NaN;
        return a / b;
      }
      const n = Number(s);
      return Number.isFinite(n) ? n : NaN;
    }

    // Format a leaf value for display. Integers stay clean ("275"); decimals
    // get up to 4 places but trailing zeros stripped.
    function fmtLeafValue(v) {
      if (!Number.isFinite(v)) return '';
      if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v));
      let s = v.toFixed(4);
      s = s.replace(/0+$/, '').replace(/\.$/, '');
      return s;
    }

    // Cheap path: update the readout + this leaf's contribution span without
    // re-rendering the SVG (which would steal focus from the input the
    // student is still typing into).
    function onLeafValueInput(key, inp) {
      const parsed = parseLeafValue(inp.value);
      if (inp.value.trim() === '') {
        delete leafValues[key];
      } else if (Number.isFinite(parsed)) {
        leafValues[key] = parsed;
      } else {
        // unparseable input: don't update leafValues, just skip readout
        // refresh until they enter a valid value.
        return;
      }
      // refresh the readout panel + this leaf's contribution annotation
      updateExpectationReadout();
      // Update this single contribution span if visible
      const span = canvasHost.querySelector(
        '.pt-leaf-contrib[data-leafkey="' + key.replace(/"/g, '\\"') + '"]'
      );
      if (span) {
        // Recompute joint for this leaf (we already have it; rebuild lite).
        const layout = buildTree(levels, branches, branchProbs);
        let joint = NaN;
        walkTree(layout.root, (n) => {
          if (n.type === 'leaf' && leafKey(n.path) === key) joint = n.joint;
        });
        const v = leafValues[key];
        if (Number.isFinite(v) && Number.isFinite(joint)) {
          span.textContent = ' → ' + fmtLeafValue(v * joint);
        } else {
          span.textContent = '';
        }
      }
    }

    function onLeafValueCommit(key, inp) {
      const parsed = parseLeafValue(inp.value);
      if (inp.value.trim() === '') {
        delete leafValues[key];
      } else if (Number.isFinite(parsed)) {
        leafValues[key] = parsed;
      } else {
        // Invalid: revert to stored value.
        const cur = leafValues[key];
        inp.value = (cur == null || !Number.isFinite(cur)) ? '' : fmtLeafValue(cur);
      }
      preset = '__custom__';
      presetSelect.value = '';
      renderAll();
    }

    // Compute E (weighted sum) + per-leaf summary table.
    function computeExpectation() {
      const layout = buildTree(levels, branches, branchProbs);
      const rows = [];
      let E = 0;
      let allFilled = true;
      let anyFilled = false;
      let anyHidden = false;
      walkTree(layout.root, (n) => {
        if (n.type !== 'leaf') return;
        const k = leafKey(n.path);
        const visible = isLeafJointVisible(n.path);
        if (!visible) anyHidden = true;
        const v = leafValues[k];
        const has = Number.isFinite(v);
        if (has) anyFilled = true;
        else allFilled = false;
        const labelsAlongPath = n.path.map((bi, lvl) => branchLabels[lvl][bi]).join(', ');
        const contrib = (has && visible) ? v * n.joint : NaN;
        if (has && visible) E += contrib;
        rows.push({
          key: k,
          path: labelsAlongPath,
          joint: n.joint,
          visible: visible,
          value: has ? v : null,
          contrib: contrib
        });
      });
      return {
        rows: rows,
        E: E,
        allFilled: allFilled,
        anyFilled: anyFilled,
        anyHidden: anyHidden
      };
    }

    function updateExpectationReadout() {
      // Light-weight refresh of the panel readout + breakdown after every
      // keystroke. The full renderExpectationCard rebuilds DOM on commit.
      if (!expectationActive) return;
      const data = computeExpectation();
      renderExpectationContent(data);
    }

    function renderExpectationContent(data) {
      expectReadout.innerHTML = '';
      expectBreakdown.innerHTML = '';
      if (!data.anyFilled) {
        const stub = document.createElement('div');
        stub.className = 'pt-readout-empty';
        stub.textContent = 'Enter a numeric value at each leaf, or load an M9 preset above.';
        expectReadout.appendChild(stub);
        return;
      }
      const headLine = document.createElement('div');
      headLine.className = 'pt-expect-head-line';
      const eLabel = document.createElement('span');
      eLabel.className = 'pt-expect-e-label';
      eLabel.textContent = 'E[X]';
      headLine.appendChild(eLabel);
      const eEq = document.createElement('span');
      eEq.textContent = ' = ';
      headLine.appendChild(eEq);
      const eVal = document.createElement('span');
      eVal.className = 'pt-expect-e-val';
      if (data.allFilled && !data.anyHidden) {
        eVal.textContent = fmtLeafValue(data.E);
      } else {
        eVal.textContent = data.allFilled
          ? '— (fill in branches)'
          : '— (fill in all leaf values)';
      }
      headLine.appendChild(eVal);
      expectReadout.appendChild(headLine);

      const formula = document.createElement('div');
      formula.className = 'pt-expect-formula-line';
      formula.textContent = 'E[X] = Σ (leaf value) × (leaf probability)';
      expectReadout.appendChild(formula);

      // Breakdown: show contributions for each filled leaf.
      const tbl = document.createElement('table');
      tbl.className = 'pt-expect-breakdown-table';
      const thead = document.createElement('thead');
      thead.innerHTML = '<tr><th>leaf</th><th>v</th><th>P</th><th>v · P</th></tr>';
      tbl.appendChild(thead);
      const tbody = document.createElement('tbody');
      data.rows.forEach((r) => {
        const tr = document.createElement('tr');
        const tdL = document.createElement('td');
        tdL.className = 'pt-expect-row-path';
        tdL.textContent = r.path;
        tr.appendChild(tdL);
        const tdV = document.createElement('td');
        tdV.className = 'pt-expect-row-num';
        tdV.textContent = (r.value == null) ? '—' : fmtLeafValue(r.value);
        tr.appendChild(tdV);
        const tdP = document.createElement('td');
        tdP.className = 'pt-expect-row-num';
        tdP.textContent = r.visible ? fmtProb(r.joint) : '—';
        tr.appendChild(tdP);
        const tdC = document.createElement('td');
        tdC.className = 'pt-expect-row-num pt-expect-row-contrib';
        tdC.textContent = (Number.isFinite(r.contrib))
          ? fmtLeafValue(r.contrib) : '—';
        tr.appendChild(tdC);
        tbody.appendChild(tr);
      });
      // Totals row
      const trTot = document.createElement('tr');
      trTot.className = 'pt-expect-total-row';
      trTot.innerHTML =
        '<td colspan="3" class="pt-expect-row-path">total</td>' +
        '<td class="pt-expect-row-num pt-expect-row-contrib">' +
          ((data.allFilled && !data.anyHidden) ? fmtLeafValue(data.E) : '—') +
        '</td>';
      tbody.appendChild(trTot);
      tbl.appendChild(tbody);
      expectBreakdown.appendChild(tbl);
    }

    function renderExpectationCard() {
      expectBody.style.display = expectationActive ? '' : 'none';
      expectToggleBtn.textContent = expectationActive ? 'hide' : 'show';
      expectTitleRow.classList.toggle('pt-cond-active', expectationActive);
      expectContribCheck.checked = expectationShowContrib;
      if (!expectationActive) return;
      const data = computeExpectation();
      renderExpectationContent(data);
    }

    function renderBayesCard() {
      bayesBody.style.display = bayesOverlayActive ? '' : 'none';
      bayesToggleBtn.textContent = bayesOverlayActive ? 'hide' : 'show';
      bayesTitleRow.classList.toggle('pt-cond-active', bayesOverlayActive);
      // Refresh the hypothesis dropdown to reflect the current level-1
      // branches (labels can change with preset switches).
      const prevVal = bayesHypIdx;
      bayesHypSelect.innerHTML = '';
      const lvl1Count = branches[0];
      for (let i = 0; i < lvl1Count; i++) {
        const opt = document.createElement('option');
        opt.value = String(i);
        opt.textContent = (branchLabels[0] && branchLabels[0][i]) || ('branch ' + (i + 1));
        bayesHypSelect.appendChild(opt);
      }
      if (bayesHypIdx >= lvl1Count) bayesHypIdx = 0;
      bayesHypSelect.value = String(bayesHypIdx);

      bayesForms.innerHTML = '';
      if (!bayesOverlayActive) return;
      if (sidebar.dataset.anyHidden === '1') {
        const stub = document.createElement('div');
        stub.className = 'pt-readout-empty';
        stub.textContent = 'Fill in the branches to compute the posterior.';
        bayesForms.appendChild(stub);
        return;
      }

      // Compute the three forms.
      const layout = buildTree(levels, branches, branchProbs);
      const hyp = bayesHypIdx;
      // P(A) — prior of the hypothesis branch (= root branch probability).
      const rootProbs = branchProbs[''] || uniformProbs(branches[0]);
      const pHyp = rootProbs[hyp] || 0;
      // Walk leaves: collect P(evidence ∩ hyp), P(evidence ∩ ¬hyp), P(evidence).
      let pEvidAndHyp = 0;
      let pEvidAndNotHyp = 0;
      let pEvid = 0;
      walkTree(layout.root, (n) => {
        if (n.type !== 'leaf') return;
        const k = leafKey(n.path);
        const inB = conditioningLeaves.has(k);
        if (!inB) return;
        pEvid += n.joint;
        if (n.path[0] === hyp) pEvidAndHyp += n.joint;
        else pEvidAndNotHyp += n.joint;
      });
      const pNotHyp = 1 - pHyp;
      // Likelihood P(B | A) = P(B ∩ A) / P(A); P(B | ¬A) = P(B ∩ ¬A) / P(¬A)
      const likelihoodHyp    = (pHyp    > EPS) ? pEvidAndHyp    / pHyp    : 0;
      const likelihoodNotHyp = (pNotHyp > EPS) ? pEvidAndNotHyp / pNotHyp : 0;
      const posterior = (pEvid > EPS) ? pEvidAndHyp / pEvid : NaN;

      const hypLabel = (branchLabels[0] && branchLabels[0][hyp]) || ('hyp ' + (hyp + 1));

      // Form 1: tree traversal.
      const form1 = document.createElement('div');
      form1.className = 'pt-bayes-form';
      form1.innerHTML =
        '<div class="pt-bayes-form-title">Tree traversal</div>' +
        (conditioningLeaves.size === 0
          ? '<div class="pt-readout-empty">Mark evidence leaves (B) above.</div>'
          : '<div class="pt-bayes-form-line">P(' + hypLabel + ' ∩ B) = ' + fmtDecimal(pEvidAndHyp, 4) + '</div>' +
            '<div class="pt-bayes-form-line">P(B) = ' + fmtDecimal(pEvid, 4) + '</div>' +
            '<div class="pt-bayes-form-line pt-bayes-form-result">posterior = ' + fmtDecimal(pEvidAndHyp, 4) + ' / ' + fmtDecimal(pEvid, 4) +
              ' ≈ <span class="pt-bayes-answer">' + fmtDecimal(posterior, 4) + '</span></div>'
        );
      bayesForms.appendChild(form1);

      // Form 2: Bayes formula with the partition denominator.
      const form2 = document.createElement('div');
      form2.className = 'pt-bayes-form';
      const denom = likelihoodHyp * pHyp + likelihoodNotHyp * pNotHyp;
      form2.innerHTML =
        '<div class="pt-bayes-form-title">Bayes formula</div>' +
        (conditioningLeaves.size === 0
          ? '<div class="pt-readout-empty">Mark evidence leaves (B) above.</div>'
          : '<div class="pt-bayes-form-line">P(B|' + hypLabel + ') · P(' + hypLabel + ')</div>' +
            '<div class="pt-bayes-form-line">' + ' = ' + fmtDecimal(likelihoodHyp, 4) + ' · ' + fmtDecimal(pHyp, 4) +
              ' = ' + fmtDecimal(likelihoodHyp * pHyp, 4) + '</div>' +
            '<div class="pt-bayes-form-line">P(B) = P(B|' + hypLabel + ')·P(' + hypLabel + ') + P(B|¬' + hypLabel + ')·P(¬' + hypLabel + ')</div>' +
            '<div class="pt-bayes-form-line">' + ' = ' + fmtDecimal(likelihoodHyp, 4) + ' · ' + fmtDecimal(pHyp, 4) +
              ' + ' + fmtDecimal(likelihoodNotHyp, 4) + ' · ' + fmtDecimal(pNotHyp, 4) +
              ' = ' + fmtDecimal(denom, 4) + '</div>' +
            '<div class="pt-bayes-form-line pt-bayes-form-result">posterior ≈ <span class="pt-bayes-answer">' +
              fmtDecimal(posterior, 4) + '</span></div>'
        );
      bayesForms.appendChild(form2);

      // Form 3: Frequentist N = 10000.
      const N = 10000;
      const nHyp = Math.round(N * pHyp);
      const nNotHyp = N - nHyp;
      const nEvidAndHyp = Math.round(nHyp * likelihoodHyp);
      const nEvidAndNotHyp = Math.round(nNotHyp * likelihoodNotHyp);
      const nEvid = nEvidAndHyp + nEvidAndNotHyp;
      const freqPost = (nEvid > 0) ? nEvidAndHyp / nEvid : NaN;
      const form3 = document.createElement('div');
      form3.className = 'pt-bayes-form';
      form3.innerHTML =
        '<div class="pt-bayes-form-title">Frequentist (N = 10,000)</div>' +
        (conditioningLeaves.size === 0
          ? '<div class="pt-readout-empty">Mark evidence leaves (B) above.</div>'
          : '<div class="pt-bayes-form-line">~' + nHyp + ' are ' + hypLabel + '</div>' +
            '<div class="pt-bayes-form-line">~' + nEvidAndHyp + ' are ' + hypLabel + ' ∩ B</div>' +
            '<div class="pt-bayes-form-line">~' + nEvidAndNotHyp + ' are ¬' + hypLabel + ' ∩ B</div>' +
            '<div class="pt-bayes-form-line">total B: ~' + nEvid + '</div>' +
            '<div class="pt-bayes-form-line pt-bayes-form-result">posterior ≈ ' + nEvidAndHyp + ' / ' + nEvid +
              ' ≈ <span class="pt-bayes-answer">' + (Number.isFinite(freqPost) ? fmtDecimal(freqPost, 4) : '—') + '</span></div>'
        );
      bayesForms.appendChild(form3);
    }

    // ── Wire control events ───────────────────────────────────────────────
    presetSelect.addEventListener('change', () => {
      const key = presetSelect.value;
      if (!PRESETS[key]) return;
      preset = key;
      const p = clonePreset(PRESETS[key]);
      levels = p.levels;
      branches = p.branches;
      branchProbs = p.branchProbs;
      branchProbLabels = p.branchProbLabels;
      branchLabels = p.labels;
      probMode = p.mode;
      eventLeaves.clear();
      conditioningLeaves.clear();
      // M9 expectation presets carry leaf values + activate the overlay.
      // Other presets reset the leaf-value map (since values keyed to a
      // different leaf-set become meaningless) but leave the overlay flag
      // alone — students who turned it on can keep it on.
      leafValues = Object.assign({}, p.leafValues || {});
      if (p.expectationActive) expectationActive = true;
      renderAll();
    });
    levelsSelect.addEventListener('change', () => {
      const newLevels = Math.max(1, Math.min(3, Math.floor(Number(levelsSelect.value))));
      if (newLevels === levels) return;
      const oldLevels = levels;
      // Build a canonical level-indexed array preserving values for shared levels.
      const canonical = [];
      for (let l = 0; l < newLevels; l++) {
        if (l < oldLevels) {
          canonical.push(canonicalLevelArray(branchProbs, l, branches));
        } else {
          canonical.push(uniformProbs(2));
        }
      }
      // Adjust branches array.
      while (branches.length < newLevels) {
        branches.push(2);
        const lbls = [];
        for (let i = 0; i < 2; i++) lbls.push(genericLabel(i));
        branchLabels.push(lbls);
      }
      while (branches.length > newLevels) {
        branches.pop();
        branchLabels.pop();
      }
      levels = newLevels;
      branchProbs = expandFixed(canonical, levels, branches);
      eventLeaves.clear();
      preset = '__custom__';
      presetSelect.value = '';
      renderAll();
    });
    fixedBtn.addEventListener('click', () => {
      if (probMode === 'fixed') return;
      // Collapse: take the first-parent values at each level and propagate.
      branchProbs = collapseToFixed(branchProbs, levels, branches);
      probMode = 'fixed';
      renderAll();
    });
    condBtn.addEventListener('click', () => {
      if (probMode === 'conditional') return;
      // Already stored as parent-keyed map; just flip the flag.
      probMode = 'conditional';
      renderAll();
    });
    resetBtn.addEventListener('click', () => {
      eventLeaves.clear();
      renderAll();
    });

    // Conditional-probability panel events.
    condToggleBtn.addEventListener('click', () => {
      condProbActive = !condProbActive;
      renderAll();
    });
    condTargetA.addEventListener('click', () => {
      condProbTarget = 'A';
      renderAll();
    });
    condTargetB.addEventListener('click', () => {
      condProbTarget = 'B';
      renderAll();
    });
    condResetABtn.addEventListener('click', () => {
      eventLeaves.clear();
      renderAll();
    });
    condResetBBtn.addEventListener('click', () => {
      conditioningLeaves.clear();
      renderAll();
    });

    // Bayes-overlay panel events.
    bayesToggleBtn.addEventListener('click', () => {
      bayesOverlayActive = !bayesOverlayActive;
      renderAll();
    });
    bayesHypSelect.addEventListener('change', () => {
      bayesHypIdx = Math.max(0, Math.floor(Number(bayesHypSelect.value)));
      renderAll();
    });

    // Expectation-overlay panel events.
    expectToggleBtn.addEventListener('click', () => {
      expectationActive = !expectationActive;
      renderAll();
    });
    expectContribCheck.addEventListener('change', () => {
      expectationShowContrib = expectContribCheck.checked;
      renderAll();
    });
    expectClearBtn.addEventListener('click', () => {
      leafValues = {};
      preset = '__custom__';
      presetSelect.value = '';
      renderAll();
    });

    // Watch / Practice header pill — top-level mode toggle.
    watchBtn.addEventListener('click', () => {
      if (!guidedActive) return;
      guidedActive = false;
      renderAll();
    });
    practiceBtn.addEventListener('click', () => {
      if (guidedActive) return;
      guidedActive = true;
      loadGuidedProblem(guidedProblemKey);
      renderAll();
    });
    guidedProblemSelect.addEventListener('change', () => {
      guidedProblemKey = guidedProblemSelect.value;
      if (guidedActive) loadGuidedProblem(guidedProblemKey);
      renderAll();
    });

    renderAll();
  }

  function bootAll() {
    document.querySelectorAll('.pt-widget').forEach(root => {
      if (root.dataset.ptMounted === '1') return;
      root.dataset.ptMounted = '1';
      mountWidget(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAll);
  } else {
    bootAll();
  }
}());
