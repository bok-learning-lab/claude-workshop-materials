(function () {
  'use strict';

  // =========================================================================
  // PROOF-STEP ARRANGER — embeddable widget
  //
  // Each <div class="psa-widget" data-problem='{...}'></div> on the page is
  // mounted as an independent instance. State and DOM refs live in a closure
  // per mount, so multiple widgets coexist without interference. There are
  // no document-wide IDs; everything is scoped via root.querySelector.
  //
  // Cards (steps + distractors) are rendered as <li class="psa-card"> with
  // draggable=true. Two zones — Bench and Proof — host the cards. Cards are
  // moved between zones (and within the Proof) via native HTML5 DnD. On
  // Check, each card in the Proof is validated:
  //   - Distractors are flagged with their `reason`.
  //   - Steps fail if any of their `dependsOn` ids are absent from the
  //     Proof or appear after the step itself.
  //   - Steps with all dependencies satisfied are marked correct.
  // When the Proof matches the canonical correct order (and contains no
  // distractors), the cards are recoloured by `role` and a banner appears.
  // =========================================================================

  // Per-page sequence so each widget gets a unique drag namespace. Used
  // (alongside an "instanceId" stamped on every card) to reject drops from
  // other widgets on the same page.
  let widgetSeq = 0;

  // ── Pure helpers ─────────────────────────────────────────────────────────

  // Deterministic shuffle (Fowler–Noll–Vo-ish hash → seeded LCG → Fisher–Yates).
  // We hash the concatenated card ids so reloading the page produces the same
  // initial scramble. Different problems get different scrambles automatically
  // because their id strings differ.
  function hashString(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function seededShuffle(arr, seed) {
    const out = arr.slice();
    let state = seed || 1;
    for (let i = out.length - 1; i > 0; i--) {
      // 32-bit LCG (Numerical Recipes).
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      const j = state % (i + 1);
      const tmp = out[i]; out[i] = out[j]; out[j] = tmp;
    }
    return out;
  }

  function isString(x) { return typeof x === 'string' && x.length > 0; }

  // ── Mount a single widget instance ───────────────────────────────────────
  function mountWidget(root) {
    let problem;
    try {
      problem = JSON.parse(root.dataset.problem || '{}');
    } catch (e) {
      console.error('proof-step-arranger: invalid data-problem JSON', e);
      return;
    }

    const steps = Array.isArray(problem.steps) ? problem.steps : [];
    const distractors = Array.isArray(problem.distractors) ? problem.distractors : [];

    if (!steps.length) {
      console.error('proof-step-arranger: data-problem must include a non-empty "steps" array');
      return;
    }

    // Validate steps + build lookup tables.
    const validRoles = { claim: 1, assumption: 1, derivation: 1, contradiction: 1 };
    const stepsById = Object.create(null);
    const correctOrder = [];
    for (const s of steps) {
      if (!isString(s.id) || !isString(s.html) || !validRoles[s.role]) {
        console.error('proof-step-arranger: each step needs id, html, and role in {assumption,derivation,contradiction}', s);
        return;
      }
      if (stepsById[s.id]) {
        console.error('proof-step-arranger: duplicate step id', s.id);
        return;
      }
      stepsById[s.id] = {
        id: s.id,
        html: s.html,
        role: s.role,
        dependsOn: Array.isArray(s.dependsOn) ? s.dependsOn.slice() : [],
        kind: 'step'
      };
      correctOrder.push(s.id);
    }

    // Validate distractor ids don't collide with steps.
    const distractorsById = Object.create(null);
    for (const d of distractors) {
      if (!isString(d.id) || !isString(d.html)) {
        console.error('proof-step-arranger: each distractor needs id and html', d);
        return;
      }
      if (stepsById[d.id] || distractorsById[d.id]) {
        console.error('proof-step-arranger: distractor id collides with another card', d.id);
        return;
      }
      distractorsById[d.id] = {
        id: d.id,
        html: d.html,
        reason: isString(d.reason) ? d.reason : null,
        kind: 'distractor'
      };
    }

    // Verify dependsOn references resolve.
    for (const s of Object.values(stepsById)) {
      for (const dep of s.dependsOn) {
        if (!stepsById[dep]) {
          console.error('proof-step-arranger: step "' + s.id + '" depends on unknown id "' + dep + '"');
          return;
        }
      }
    }

    // Per-instance namespace.
    widgetSeq++;
    const instanceId = 'psa-' + widgetSeq;

    // ── Build DOM scaffold ─────────────────────────────────────────────────
    root.innerHTML = '';

    if (isString(problem.title)) {
      const h = document.createElement('h1');
      h.className = 'psa-title';
      h.textContent = problem.title;
      root.appendChild(h);
    }

    if (isString(problem.intro)) {
      const introCard = document.createElement('div');
      introCard.className = 'psa-intro';
      introCard.innerHTML = problem.intro;
      root.appendChild(introCard);
    }

    // Success banner (hidden until correct). Legend lists only the roles
    // that actually appear in this problem's steps, so direct/induction
    // proofs (no `contradiction` role) won't surface a misleading swatch.
    const roleLabels = {
      claim: 'Claim — the statement being proved',
      assumption: 'Assumption (set up for contradiction)',
      derivation: 'Derivation (work forward)',
      contradiction: 'Contradiction &amp; conclusion'
    };
    const rolesInUse = new Set();
    for (const s of Object.values(stepsById)) rolesInUse.add(s.role);
    const legendItems = [];
    for (const role of ['claim', 'assumption', 'derivation', 'contradiction']) {
      if (!rolesInUse.has(role)) continue;
      legendItems.push(
        '<span class="psa-role-legend-item">' +
          '<span class="psa-role-legend-swatch psa-role-' + role + '"></span>' +
          roleLabels[role] +
        '</span>'
      );
    }
    const successBanner = document.createElement('div');
    successBanner.className = 'psa-success-banner psa-hidden';
    successBanner.innerHTML =
      '<strong>Nicely done.</strong> The proof is in the right order. ' +
      'The cards below are now coloured by their structural role:' +
      '<div class="psa-role-legend">' + legendItems.join('') + '</div>';
    root.appendChild(successBanner);

    // Bench zone.
    const benchZone = makeZone('bench', 'Bench', 'Drag cards from here into the Proof.');
    root.appendChild(benchZone.zoneEl);

    // Proof zone.
    const proofZone = makeZone('proof', 'Proof', 'Drop cards here, in order.');
    root.appendChild(proofZone.zoneEl);

    // Controls.
    const controls = document.createElement('div');
    controls.className = 'psa-controls';
    const checkBtn = document.createElement('button');
    checkBtn.type = 'button';
    checkBtn.className = 'psa-btn psa-btn-primary';
    checkBtn.textContent = 'Check';
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'psa-btn';
    resetBtn.textContent = 'Reset';
    controls.appendChild(checkBtn);
    controls.appendChild(resetBtn);
    root.appendChild(controls);

    const statusLine = document.createElement('div');
    statusLine.className = 'psa-status-line';
    statusLine.setAttribute('role', 'status');
    statusLine.setAttribute('aria-live', 'polite');
    root.appendChild(statusLine);

    // ── State & rendering ─────────────────────────────────────────────────

    // Build the initial scrambled order over all card ids (steps + distractors).
    const allIds = correctOrder.concat(Object.keys(distractorsById));
    const initialBenchOrder = seededShuffle(allIds, hashString(allIds.join('|')));

    // Mutable arrays of card ids per zone — these are the source of truth.
    let benchIds = initialBenchOrder.slice();
    let proofIds = [];

    function getCardData(id) {
      return stepsById[id] || distractorsById[id];
    }

    // Render both zones from `benchIds` / `proofIds`. We rebuild from scratch
    // because the data sets are tiny; this avoids tracking which DOM nodes
    // need to move and keeps the render path obvious.
    function renderAll() {
      renderZone(benchZone, benchIds);
      renderZone(proofZone, proofIds);
    }

    function renderZone(zone, ids) {
      const list = zone.listEl;
      list.innerHTML = '';
      if (!ids.length) {
        const empty = document.createElement('li');
        empty.className = 'psa-list-empty-message';
        empty.textContent = zone.kind === 'proof'
          ? 'Drop cards here in proof order.'
          : 'All cards have been moved to the proof.';
        list.appendChild(empty);
        return;
      }
      for (const id of ids) {
        list.appendChild(renderCard(id));
      }
    }

    function renderCard(id) {
      const data = getCardData(id);
      const li = document.createElement('li');
      li.className = 'psa-card';
      li.draggable = true;
      li.dataset.cardId = id;
      li.dataset.psaInstance = instanceId;

      const grip = document.createElement('span');
      grip.className = 'psa-card-grip';
      grip.setAttribute('aria-hidden', 'true');
      grip.textContent = '⋮⋮';

      const body = document.createElement('span');
      body.className = 'psa-card-body';
      body.innerHTML = data.html;

      li.appendChild(grip);
      li.appendChild(body);

      // ── Drag source events ─────────────────────────────────────────────
      li.addEventListener('dragstart', (ev) => {
        // Stamp the dataTransfer so we can reject drops from other widget
        // instances on the same page.
        if (ev.dataTransfer) {
          ev.dataTransfer.effectAllowed = 'move';
          ev.dataTransfer.setData('text/plain', id);
          // Some browsers require a non-empty payload to honor the drag.
          // text/plain (above) suffices.
        }
        draggingCardId = id;
        draggingFromInstance = instanceId;
        li.classList.add('psa-dragging');
      });
      li.addEventListener('dragend', () => {
        li.classList.remove('psa-dragging');
        clearDropIndicator();
        draggingCardId = null;
        draggingFromInstance = null;
      });

      return li;
    }

    function makeZone(kind, titleText, hintText) {
      const zoneEl = document.createElement('div');
      zoneEl.className = 'psa-zone';
      zoneEl.dataset.zone = kind;

      const header = document.createElement('div');
      header.className = 'psa-zone-header';
      const title = document.createElement('span');
      title.className = 'psa-zone-title';
      title.textContent = titleText;
      const hint = document.createElement('span');
      hint.className = 'psa-zone-hint';
      hint.textContent = hintText;
      header.appendChild(title);
      header.appendChild(hint);
      zoneEl.appendChild(header);

      const listEl = document.createElement('ul');
      listEl.className = 'psa-list';
      zoneEl.appendChild(listEl);

      return { kind: kind, zoneEl: zoneEl, listEl: listEl };
    }

    // ── Drag-and-drop wiring ──────────────────────────────────────────────
    //
    // We track drag state at the instance level so that drops from other
    // widgets on the page are silently ignored. When a drag enters a zone,
    // we compute the insertion index from the cursor's Y position, render
    // a thin horizontal indicator at that slot, and on `drop` we splice
    // the card id into the target zone at that index.

    let draggingCardId = null;
    let draggingFromInstance = null;
    let currentDropTargetZone = null; // 'bench' | 'proof' | null
    let currentDropIndex = -1;
    let currentDropIndicator = null;

    function clearDropIndicator() {
      if (currentDropIndicator && currentDropIndicator.parentNode) {
        currentDropIndicator.parentNode.removeChild(currentDropIndicator);
      }
      currentDropIndicator = null;
      currentDropTargetZone = null;
      currentDropIndex = -1;
      benchZone.zoneEl.classList.remove('psa-drop-active');
      proofZone.zoneEl.classList.remove('psa-drop-active');
    }

    // Compute the index in `ids` where a drop at clientY would land.
    function computeDropIndex(listEl, clientY) {
      const cards = listEl.querySelectorAll('.psa-card');
      for (let i = 0; i < cards.length; i++) {
        const rect = cards[i].getBoundingClientRect();
        if (clientY < rect.top + rect.height / 2) return i;
      }
      return cards.length;
    }

    // Show/move the drop indicator inside `listEl` at index `index`.
    function showDropIndicator(zone, index) {
      const listEl = zone.listEl;
      // Remove any old one first.
      if (currentDropIndicator && currentDropIndicator.parentNode) {
        currentDropIndicator.parentNode.removeChild(currentDropIndicator);
      }
      const indicator = document.createElement('li');
      indicator.className = 'psa-drop-indicator';
      const cards = listEl.querySelectorAll('.psa-card');
      if (index >= cards.length) {
        // Append at end. If the list is currently empty, we need to drop
        // the empty-state placeholder out of the way for visibility.
        const emptyMsg = listEl.querySelector('.psa-list-empty-message');
        if (emptyMsg) listEl.removeChild(emptyMsg);
        listEl.appendChild(indicator);
      } else {
        listEl.insertBefore(indicator, cards[index]);
      }
      currentDropIndicator = indicator;
      currentDropTargetZone = zone.kind;
      currentDropIndex = index;
    }

    function attachZoneDnD(zone) {
      const zoneEl = zone.zoneEl;

      zoneEl.addEventListener('dragenter', (ev) => {
        if (draggingFromInstance !== instanceId) return;
        ev.preventDefault();
        zoneEl.classList.add('psa-drop-active');
      });

      zoneEl.addEventListener('dragover', (ev) => {
        if (draggingFromInstance !== instanceId) return;
        ev.preventDefault();
        if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'move';
        const idx = computeDropIndex(zone.listEl, ev.clientY);
        if (idx !== currentDropIndex || currentDropTargetZone !== zone.kind) {
          showDropIndicator(zone, idx);
        }
      });

      zoneEl.addEventListener('dragleave', (ev) => {
        if (draggingFromInstance !== instanceId) return;
        // Only clear active highlight if we've left the zone entirely.
        // dragleave fires for inner elements too; check relatedTarget.
        if (!zoneEl.contains(ev.relatedTarget)) {
          zoneEl.classList.remove('psa-drop-active');
          if (currentDropTargetZone === zone.kind) {
            if (currentDropIndicator && currentDropIndicator.parentNode) {
              currentDropIndicator.parentNode.removeChild(currentDropIndicator);
            }
            currentDropIndicator = null;
            currentDropTargetZone = null;
            currentDropIndex = -1;
          }
        }
      });

      zoneEl.addEventListener('drop', (ev) => {
        if (draggingFromInstance !== instanceId) return;
        ev.preventDefault();
        const cardId = draggingCardId;
        const targetIndex = (currentDropTargetZone === zone.kind && currentDropIndex >= 0)
          ? currentDropIndex
          : computeDropIndex(zone.listEl, ev.clientY);
        clearDropIndicator();
        if (!cardId) return;
        moveCardTo(cardId, zone.kind, targetIndex);
      });
    }

    // Splice cardId out of whichever zone holds it, then insert it into
    // `targetZoneKind` at `targetIndex`. Re-render afterward.
    function moveCardTo(cardId, targetZoneKind, targetIndex) {
      // Find the source.
      let sourceArr, sourceKind;
      let sourceIndex = benchIds.indexOf(cardId);
      if (sourceIndex !== -1) { sourceArr = benchIds; sourceKind = 'bench'; }
      else {
        sourceIndex = proofIds.indexOf(cardId);
        if (sourceIndex !== -1) { sourceArr = proofIds; sourceKind = 'proof'; }
      }
      if (!sourceArr) return; // unknown card; ignore.

      sourceArr.splice(sourceIndex, 1);

      // If we're moving within the same zone and removing reduced the
      // index of where we want to insert, adjust.
      let insertIndex = targetIndex;
      if (sourceKind === targetZoneKind && sourceIndex < targetIndex) {
        insertIndex = targetIndex - 1;
      }
      const targetArr = (targetZoneKind === 'proof') ? proofIds : benchIds;
      if (insertIndex < 0) insertIndex = 0;
      if (insertIndex > targetArr.length) insertIndex = targetArr.length;
      targetArr.splice(insertIndex, 0, cardId);

      // Any move invalidates prior feedback / success state.
      clearFeedbackState();
      renderAll();
    }

    attachZoneDnD(benchZone);
    attachZoneDnD(proofZone);

    // ── Check / Reset ─────────────────────────────────────────────────────

    function clearFeedbackState() {
      successBanner.classList.add('psa-hidden');
      statusLine.textContent = '';
      statusLine.classList.remove('psa-status-error');
    }

    function setStatus(text, isError) {
      statusLine.textContent = text || '';
      statusLine.classList.toggle('psa-status-error', !!isError);
    }

    // Run validation on the current `proofIds`. Returns:
    //   { allCorrect: bool, perCardFeedback: { id: { ok: bool, message?: string } } }
    function validate() {
      const result = { allCorrect: true, perCardFeedback: Object.create(null) };
      const positionInProof = Object.create(null);
      proofIds.forEach((id, idx) => { positionInProof[id] = idx; });

      // Empty proof: not correct, but no per-card feedback.
      if (proofIds.length === 0) {
        result.allCorrect = false;
        return result;
      }

      // Pass 1: per-card validation.
      for (let idx = 0; idx < proofIds.length; idx++) {
        const id = proofIds[idx];
        const data = getCardData(id);
        if (!data) continue;

        if (data.kind === 'distractor') {
          result.allCorrect = false;
          result.perCardFeedback[id] = {
            ok: false,
            message: data.reason || 'This card isn’t a step of the proof — leave it on the Bench.'
          };
          continue;
        }

        // Step. Check dependencies.
        const missing = [];
        const outOfOrder = [];
        for (const depId of data.dependsOn) {
          const depPos = positionInProof[depId];
          if (depPos === undefined) {
            missing.push(depId);
          } else if (depPos > idx) {
            outOfOrder.push(depId);
          }
        }
        if (missing.length === 0 && outOfOrder.length === 0) {
          result.perCardFeedback[id] = { ok: true };
          continue;
        }

        result.allCorrect = false;
        const parts = [];
        if (missing.length) {
          const names = missing.map(formatDepRef).join(' and ');
          parts.push('this step depends on ' + names + ', which ' +
            (missing.length > 1 ? 'aren’t' : 'isn’t') + ' in the proof yet.');
        }
        if (outOfOrder.length) {
          const names = outOfOrder.map(formatDepRef).join(' and ');
          parts.push((parts.length ? 'Also, ' : '') + names + ' should come earlier than this step.');
        }
        result.perCardFeedback[id] = {
          ok: false,
          message: parts.join(' ').replace(/^./, (c) => c.toUpperCase())
        };
      }

      // Pass 2: also-not-correct if the proof is missing required steps.
      // The contradiction pass needs the *entire* canonical chain.
      for (const stepId of correctOrder) {
        if (positionInProof[stepId] === undefined) {
          result.allCorrect = false;
          // No per-card message here — the missing card is on the Bench;
          // we'll surface this in the status line below.
        }
      }

      return result;
    }

    // Render a short reference to a step by id, for use in feedback prose.
    // We use a truncated form of the step's HTML stripped of tags.
    function formatDepRef(id) {
      const data = getCardData(id);
      if (!data) return '“' + id + '”';
      const text = stripTags(data.html);
      const shortened = text.length > 60 ? text.slice(0, 57) + '…' : text;
      return '“' + shortened + '”';
    }

    function stripTags(html) {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
    }

    function applyFeedback(result) {
      // First, strip prior feedback classes/messages from all cards.
      proofZone.listEl.querySelectorAll('.psa-card').forEach((card) => {
        card.classList.remove('psa-feedback-ok', 'psa-feedback-bad');
        card.classList.remove('psa-role-assumption', 'psa-role-derivation', 'psa-role-contradiction');
        const oldMsg = card.querySelector('.psa-feedback-message');
        if (oldMsg) oldMsg.remove();
      });

      if (result.allCorrect) {
        // Recolour by role; show success banner.
        proofZone.listEl.querySelectorAll('.psa-card').forEach((card) => {
          const id = card.dataset.cardId;
          const data = getCardData(id);
          if (data && data.kind === 'step') {
            card.classList.add('psa-role-' + data.role);
          }
        });
        successBanner.classList.remove('psa-hidden');
        setStatus('Proof complete.', false);
        return;
      }

      // Apply per-card feedback.
      proofZone.listEl.querySelectorAll('.psa-card').forEach((card) => {
        const id = card.dataset.cardId;
        const fb = result.perCardFeedback[id];
        if (!fb) return;
        if (fb.ok) {
          card.classList.add('psa-feedback-ok');
        } else {
          card.classList.add('psa-feedback-bad');
          if (fb.message) {
            const msg = document.createElement('span');
            msg.className = 'psa-feedback-message';
            msg.textContent = fb.message;
            card.appendChild(msg);
          }
        }
      });

      // Status line summary.
      const inProof = new Set(proofIds);
      const missingSteps = correctOrder.filter((sid) => !inProof.has(sid));
      const distractorsInProof = proofIds.filter((cid) => distractorsById[cid]);

      const summaryParts = [];
      if (proofIds.length === 0) {
        summaryParts.push('The proof is empty — drag cards from the Bench into the Proof.');
      } else {
        if (distractorsInProof.length) {
          summaryParts.push(distractorsInProof.length + ' card' +
            (distractorsInProof.length > 1 ? 's don’t' : ' doesn’t') +
            ' belong in the proof.');
        }
        if (missingSteps.length) {
          summaryParts.push(missingSteps.length + ' step' +
            (missingSteps.length > 1 ? 's are' : ' is') +
            ' still missing from the proof.');
        }
        // If neither of the above and we still failed, then ordering is the
        // issue — per-card feedback covers the specifics.
        if (!summaryParts.length) {
          summaryParts.push('Some steps are out of order. See the messages on the red cards.');
        }
      }
      setStatus(summaryParts.join(' '), true);
    }

    function handleCheck() {
      // Always re-render first to ensure DOM matches state (cheap).
      renderAll();
      const result = validate();
      applyFeedback(result);
    }

    function handleReset() {
      benchIds = initialBenchOrder.slice();
      proofIds = [];
      clearFeedbackState();
      renderAll();
    }

    checkBtn.addEventListener('click', handleCheck);
    resetBtn.addEventListener('click', handleReset);

    // ── Initial render ────────────────────────────────────────────────────
    renderAll();
  }

  // ── Bootstrap: mount every .psa-widget on the page (idempotent) ──────────
  function bootAll() {
    document.querySelectorAll('.psa-widget').forEach((root) => {
      if (root.dataset.psaMounted === '1') return;
      root.dataset.psaMounted = '1';
      mountWidget(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAll);
  } else {
    bootAll();
  }
}());
