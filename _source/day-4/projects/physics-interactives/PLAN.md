# Plan — PhET-style interactive simulations for faculty

A workshop project that pairs a short historical essay with a Claude Code skill (and supporting resources) that helps faculty build PhET-inspired interactive diagrams as single, locally-runnable HTML files.

## Why this project (one paragraph)

Faculty in the workshop have all seen PhET simulations in their own teaching, but most assume "interactives like that" are out of reach without a software team. They are not, anymore. The collapse in cost between idea and prototype is the central pedagogical point of this project — and it only lands if the artifacts Claude produces are genuinely good, not just shiny. The essay justifies the skill; the skill is the payoff.

Background reading before doing any step below:

1. [essay-phet-tradition.md](essay-phet-tradition.md) — historical context and the design tradition we are inheriting.
2. [skill-draft/SKILL.md](skill-draft/SKILL.md) — the current draft of the flagship skill, including the hard output contract and the pedagogical interview.

## Output contract (read once, apply forever)

Every artifact this skill produces must satisfy these properties. Most of the plan below exists to enforce them.

- Single `.html` file, opens by double-click in Chrome from `file://`.
- No React, Next.js, Vite, npm install, or build step.
- No runtime data fetches (`fetch`, `XMLHttpRequest`, asset loads).
- External CSS via `<link>` allowed. External JS via CDN allowed but discouraged and must be marked.
- No emojis anywhere.
- Header comment captures the pedagogical design record (learning goal, learner, misconception, manipulables, hidden variables, representations, prompts, limitations, classroom use).

## Phase 1 — Foundations

The skill's quality depends entirely on the rubric and worksheet documents that back it. Build those before building examples.

### Step 1.1 — Finalize the essay

- [x] First draft written ([essay-phet-tradition.md](essay-phet-tradition.md)).
- [x] Spurious "160 hours design / 500+ dev / 40 testing" figure removed; footnote replaced with the verifiable PhET Simulation Design Process source.
- [ ] Marlon read-through pass for voice and length. Target ~1,200–1,500 words for workshop attendees.
- [ ] Decide whether to add a closing paragraph explicitly cross-referencing the skill, or keep the essay standalone and link from the project README.

### Step 1.2 — Draft `rubrics/simulation-quality-rubric.md`

The scoring rubric used by the final QC pass of `/phet-sim` and by the future `/phet-critique` skill. Should score along eight dimensions, each with concrete observable criteria (not vibes):

- Conceptual clarity — is the learning goal recoverable from the artifact alone?
- Interactivity — is every visible value traceable to a control?
- Visual legibility — projector-readable, labelled, no decorative motion.
- Feedback quality — immediate, reversible, linked representations update together.
- Accessibility — keyboard, labels, contrast (subset checklist lives separately).
- Local portability — runs from `file://`, no fetches, no console errors.
- Code maintainability — readable to another instructor six months from now.
- Disciplinary honesty — model limitations stated in the artifact.

Each dimension gets a 0/1/2 scoring rule and at least one example of what each level looks like.

### Step 1.3 — Draft `rubrics/accessibility-checklist.md`

The accessibility floor — a focused checklist invoked by the skill's QC pass and exposed to faculty as a separate doc they can apply manually.

- Every control has a `<label for="...">` or `aria-label`.
- Sliders operable by keyboard (arrow keys, page up/down, home/end).
- Color is never the only carrier of information.
- Body text minimum 16px; viewport labels larger.
- Contrast ratios meet WCAG AA for body text against background.
- No reliance on hover-only affordances (mobile + projector parity).
- Resize behavior at 1024px width; no horizontal scroll required.

### Step 1.4 — Draft `rubrics/pedagogical-design-worksheet.md`

The long-form, paper-friendly version of the pedagogical interview from [skill-draft/SKILL.md](skill-draft/SKILL.md). Same ten questions, but with prompts, examples, and space for faculty to think on paper before invoking the skill. Doubles as a handout for the workshop session itself.

**Phase 1 done when:** all three rubric/worksheet docs exist, the essay has had a voice pass, and the four documents read as a coherent set.

## Phase 2 — Templates

Three minimal HTML starters that the skill can use as scaffolds. Each must satisfy the output contract on its own, before any topic-specific code is added.

### Step 2.1 — `templates/single-file-svg-sim.html`

The default starter. SVG viewport for the model, DOM panel for controls and "Try this" / "Model limitations" prompts. Includes:

- One slider with live numeric readout.
- One draggable SVG element.
- Reset button.
- Header comment with placeholders for the pedagogical design record.
- Embedded `<style>` and `<script>` blocks, no external dependencies.

### Step 2.2 — `templates/single-file-canvas-sim.html`

For particle systems, fields, fluids — anything where rendering many moving objects per frame matters. Same scaffolding as 2.1 but with a `<canvas>` viewport and a basic requestAnimationFrame render loop.

### Step 2.3 — `templates/single-file-linked-graph-sim.html`

The canonical PhET layout: model viewport on the left, live graph on the right, both wired to the same state. This is the most common shape; building it once as a template saves work on every example.

**Phase 2 done when:** all three templates open from `file://`, pass the accessibility checklist for their scaffolding (not their content), and serve as drop-in starters for Phase 3.

## Phase 3 — Worked examples + skill iteration

This is where the skill gets tested against itself. Each example is built by *invoking the skill draft* on a learning goal, not by writing the HTML directly. The point is to find the skill's failure modes early.

### Step 3.1 — Example 1: projectile motion (STEM, canonical lineage)

The canonical PhET topic. Establishes that the skill can produce a recognizably PhET-tradition artifact. Targets an intro physics audience. Manipulables: launch angle, initial velocity, gravity. Linked representations: physical trajectory + height-vs-time graph + range readout. Hidden by design: air resistance.

Acceptance: a physics-teaching colleague (not Marlon) opens the file, recognizes the lineage, and would consider using it in a lecture.

### Step 3.2 — Example 2: SIR epidemiology (STEM, current relevance)

S/I/R compartmental model with sliders for transmission rate, recovery rate, and initial infected count. Linked: agent-grid view + S/I/R curves over time + R0 readout. Hidden: demographic structure, vaccination, behavior change. Limitations panel explicitly names what this model can and cannot say about real epidemics.

Acceptance: an instructor in public health or biostatistics finds the limitations panel honest.

### Step 3.3 — Example 3: rhetorical feedback loop (humanities, new affordance)

A small model of how a rhetorical move (e.g. a concession, an appeal, a hedge) shifts audience uptake, which feeds back into the speaker's next move. Manipulables: speaker stance, hedging level, audience prior. Linked: dialogue panel + uptake meter + cumulative-trust line. Hidden by design: identity, register, prior history beyond the simulation window.

Acceptance: a writing or rhetoric colleague finds it pedagogically useful for a single class session on audience modeling.

### Step 3.4 — Example 4: attention-window visualizer (CS / AI explainer)

Visualizes how a transformer-style attention window over a sequence of tokens shifts as the window grows or shrinks. Manipulables: context length, attention temperature, position of cursor. Linked: token grid + attention-weights heatmap + "what the model 'sees'" readout. Hidden: actual model weights — this is a pedagogical model of attention, not a working LLM.

Acceptance: a non-CS faculty member who has heard "context window" but never seen one comes away with an accurate mental model.

### Step 3.5 — Iterate the skill against the examples

After each example, log what the skill did badly. Common predicted failure modes:

- Skipped the pedagogical interview or asked the questions too superficially.
- Used a CDN library when it didn't need to.
- Generated `fetch()` calls.
- Forgot to wire reset.
- Forgot the "Model limitations" panel.
- Put accessibility labels in inline comments instead of `aria-label` attributes.

Each failure mode discovered → an explicit line added to the skill's QC checklist or pedagogical contract.

**Phase 3 done when:** all four examples exist under `skill-draft/examples/`, each opens from `file://` with zero console errors, and the skill draft has been revised at least once based on what the examples surfaced.

## Phase 4 — Promotion + sibling skills

**Skill location convention:** all three skills live under this project's own `.claude/skills/` directory — i.e. `_context/day-4/projects/physics-interactives/.claude/skills/<name>/`. The reason is that for the workshop demo, Claude Code is opened *inside* the `physics-interactives/` folder, and the project needs to be a standalone bundle a physics faculty member can grab and run on their own machine without dragging the rest of the repo along. Once each skill is working, it can also be copied to the repo-root `.claude/skills/` so it's available across the whole workshop — but the project-local copy is the source of truth.

### Step 4.1 — Promote `/phet-sim` to the project's `.claude/skills/`

- [x] Copied `skill-draft/SKILL.md`, `rubrics/`, and `templates/` to `.claude/skills/phet-sim/`. Essay link inside SKILL.md re-pointed from `../essay-phet-tradition.md` to `../../../essay-phet-tradition.md`.
- [ ] Verify the skill is invokable from a fresh Claude Code session opened directly in `physics-interactives/` and that the frontmatter description triggers correctly on relevant prompts ("help me make an interactive diagram about X").
- [ ] Once verified, delete `skill-draft/` and update PLAN.md / CLAUDE.md references in a single cleanup pass.
- [ ] Optionally copy the verified skill to the repo-root `.claude/skills/phet-sim/` so other workshop projects can invoke it too.

### Step 4.2 — Build `/phet-activity` (companion skill for classroom use)

The natural pair to `/phet-sim`. Wieman's research is clear that PhET sims produce conceptual gains *only when wrapped in interactive engagement activities* — surfacing prior beliefs, committing to a prediction, peer discussion, instructor synthesis. `/phet-activity` takes an existing sim (or its design record) and a few classroom context inputs (course, modality, time budget) and produces a single markdown lesson plan that bakes in the Predict-Observe-Explain-Synthesize structure.

- [x] Built directly at `.claude/skills/phet-activity/` (no skill-draft intermediate stage — the convention from Step 4.1 is established).
- [x] Ships with [reference/wieman-pedagogy.md](.claude/skills/phet-activity/reference/wieman-pedagogy.md) (research anchor), [templates/lesson-plan-template.md](.claude/skills/phet-activity/templates/lesson-plan-template.md), and [rubrics/lesson-quality-checklist.md](.claude/skills/phet-activity/rubrics/lesson-quality-checklist.md).
- [ ] Test against the damped-harmonic-oscillator sim built in Step 3 — does the generated lesson plan name plausible wrong predictions for the "more damping = faster settling" misconception?
- [ ] Once verified, add at least one worked example (a generated lesson plan) under `.claude/skills/phet-activity/examples/`.

### Step 4.3 — Draft `/phet-critique`

Sibling skill that takes an existing `.html` file and scores it against [rubrics/simulation-quality-rubric.md](skill-draft/rubrics/simulation-quality-rubric.md). Output is a critique memo plus a prioritized list of improvements. Lives at `.claude/skills/phet-critique/` (project-local).

### Step 4.4 — Draft `/phet-port`

Sibling skill that takes a static figure, description, or equation and proposes the manipulable/fixed/linked-representation decomposition, then builds the interactive. The on-ramp skill for faculty who arrive with a textbook diagram in mind. Lives at `.claude/skills/phet-port/` (project-local).

### Step 4.5 — Workshop session prep

- Pick which two of the four examples ship visibly in the workshop demo (probably one STEM + one humanities, to make the lineage point and the new-affordance point in the same session).
- Write a short workshop facilitator note for this project (where it lives in the day-4 arc, what the demo flow is, what faculty leave with).
- Decide whether `pedagogical-design-worksheet.md` should be a printed handout for the in-person session.

## Open questions to resolve before workshop

These were noted in the previous draft of this PLAN. They are still open and should be settled by the end of Phase 1 or early Phase 3, not before:

- **Which examples ship with the skill?** STEM legitimizes the lineage; humanities/social science sells the new possibility. Probably two of each. The Phase 3 examples are sized so we can pick two finalists later.
- **How aggressive should the pedagogical interview be?** Real tension between "produces something in 90 seconds" (workshop gratification) and "produces something good" (skill's purpose). Phase 3 testing will give us a defensible default.
- **Accessibility floor — minimum we enforce vs. recommend.** Keyboard-operable sliders are non-negotiable; full ARIA labeling on dynamic SVG is harder to guarantee in a single-file artifact. Set the line in Step 1.3.
- **Offline-first vs. CDN-allowed default.** Workshop wifi is fine; classroom wifi often is not. Lean toward fully self-contained as the default and CDN as opt-in. Confirm in Step 1.2 / Step 2.1.

## File map (target state at end of Phase 4)

The whole project is self-contained under `physics-interactives/` so a physics faculty member can grab the folder and run it on their own machine. The skills live in the project's *own* `.claude/skills/` directory — not the repo root.

```text
_context/day-4/projects/physics-interactives/
  PLAN.md                                 (this file)
  essay-phet-tradition.md
  skill-draft/                            (working copy; promoted to .claude/skills/ in Step 4.1)
    SKILL.md
    rubrics/
      simulation-quality-rubric.md
      accessibility-checklist.md
      pedagogical-design-worksheet.md
    templates/
      single-file-svg-sim.html
      single-file-canvas-sim.html
      single-file-linked-graph-sim.html
    examples/
      projectile-motion.html
      sir-epidemiology.html
      rhetorical-feedback-loop.html
      attention-window.html
  .claude/
    skills/
      phet-sim/                           (promoted from skill-draft/ in Step 4.1)
      phet-activity/                      (built in Step 4.2 — classroom lesson plans around sims)
        SKILL.md
        reference/wieman-pedagogy.md
        templates/lesson-plan-template.md
        rubrics/lesson-quality-checklist.md
      phet-critique/                      (drafted in Step 4.3)
      phet-port/                          (drafted in Step 4.4)
```

Optionally, after the skills are verified working in the project-local `.claude/`, they can also be copied up to the repo-root `.claude/skills/` so they're invokable from any session opened anywhere in the workshop repo. The project-local copy remains the source of truth.
