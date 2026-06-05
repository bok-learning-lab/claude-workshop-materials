---
layout: default
title: Physics Interactives
section: gallery
---

# Physics Interactives

<div class="page-lead">A working demonstration that the kind of interactive teaching simulation pioneered by Carl Wieman's PhET project at Colorado — small, manipulable, conceptually disciplined worlds in which a learning idea becomes visible — is now within reach of an individual faculty member with an afternoon.</div>

The project ships four Claude Code skills, single-file HTML templates a faculty member can adapt, a quality rubric and accessibility checklist that gate "ready to share with students," and a sample teaching brief (the heat-pump lecture in `inputs/`) the skills can be exercised against. Skills live under the project's own `operations/skills/` directory so that a faculty member who clones just this folder gets the corpus, the templates, the rubrics, and the skills as a self-contained bundle.

## What the project ships

Four Claude Code skills, each implementing one move in the PhET design grammar.

### `/phet-sim`

Runs a structured pedagogical interview *before* writing any code: learning goal, target learner, the misconception the simulation should make visible, the variables that should be manipulable, the variables that should be deliberately hidden, the linked representations, the reflection prompts, the model's limitations, the classroom use. Only then does it generate a single-file HTML simulation that opens by double-click in Chrome with no build step. The interview is the skill's main contribution; without it, the skill would be just another "make a slider thing" prompt. Self-scores against an 8-dimension quality rubric (conceptual clarity, interactivity, visual legibility, feedback quality, accessibility, local portability, code maintainability, disciplinary honesty) and refuses to declare a simulation done if it scores below 12/16 or scores 0 on any dimension.

### `/phet-activity`

Takes an existing simulation (or its design record) plus a few classroom context inputs and produces a Wieman-style lesson plan organized around the four-phase **Predict → Observe → Explain → Synthesize** structure. Refuses to ship a plan that does not name at least two expected wrong predictions — the highest-leverage piece of an interactive-engagement lesson, and the one most often skipped by faculty new to the approach. The skill exists because Wieman's group has been clear in print for years that PhET sims produce conceptual gains *only when wrapped in interactive engagement activities*; a sim in a tab open beside a textbook is a tool waiting for a lesson, not a lesson.

### `/phet-accessibility-audit`

Audits a generated simulation against an accessibility floor — keyboard operability, label coverage, contrast, color-only information, live-region density, motion handling — and produces a markdown report categorizing findings as **Blockers, Warnings, or Notes**. A simulation with Blockers is not declared ready to share with students. Accessibility belongs in the audit step, not the QC vibe-check; without a measurable floor, "accessible" becomes a marketing word.

### `/phet-rationale`

Produces a 600–1,000-word department-facing rationale for a specific simulation and (optionally) its `/phet-activity` lesson plan, suitable for a department chair, curriculum committee, dean, accreditation reviewer, or skeptical colleague. Refuses to fabricate citations; refuses to omit the "what we are not claiming" section. The methods-paragraph equivalent in this project's design grammar: every artifact has one.

## The hard output contract

Every simulation produced by this project must satisfy these properties:

- **Single `.html` file**, opens by double-click in Chrome from `file://`.
- **No React, Vue, Vite, Next.js, `npm install`, or any build step.**
- **No runtime data fetches.** No `fetch`, no `XMLHttpRequest`, no loading of JSON/CSV/images/audio at runtime. Everything embedded inline or generated in code.
- **External CSS via `<link>` is allowed.** External JS via CDN is allowed but discouraged; if used, marked in the file's header comment.
- **No emojis** anywhere in any file.
- **Header comment captures the full design record** — learning goal, target learner, core misconception, manipulables, hidden variables, representations, prompts, limitations, classroom use, date.

If a user explicitly overrides one of these rules, the deviation is marked in the file's header. The output contract is what makes the artifact portable in the way faculty actually need — emailable, Canvas-uploadable, viewable on any laptop without setup.

## The pedagogical interview

The interview is the contribution. Before `/phet-sim` writes a single line of HTML, it walks the faculty member through a ten-question structured design pass:

1. **Learning goal.** One sentence — what should the student understand after using this?
2. **Target learner.** Who is in the room? What have they already seen?
3. **The misconception.** What specific wrong intuition should this simulation make visible? (If you cannot name one, the simulation does not have a pedagogical purpose yet.)
4. **Manipulables.** Which variables does the learner control? Sliders, toggles, drag targets — name each one and its range.
5. **Hidden variables.** Which variables are deliberately *not* exposed? What is the simulation choosing to leave out, and why? (This is the most consequential design decision and is invisible in the finished product.)
6. **Linked representations.** Physical model, graph, equation, table — what updates together, and how does the linkage make the concept legible?
7. **Reflection prompts.** What two or three questions sit beside the simulation to direct the learner's attention?
8. **Model limitations.** Where does the simplification break? What should the learner *not* infer from this artifact?
9. **Classroom use.** Pre-class warm-up? In-class think-pair-share? Post-lecture homework? The activity wraps the artifact.
10. **Accessibility commitments.** Keyboard path, label coverage, contrast — set the floor before the audit measures against it.

The interview surfaces, in plain language, the design moves that took the PhET team a year per simulation to get right. Optimizing for fewer questions defeats the purpose. The skill's value is making the design discipline cheap enough that a faculty member actually does it.

## Example simulations

Concrete artifacts authored by a single faculty member using `/phet-sim` for a discrete mathematics and probability course — the answer to "what does this actually produce?"

- [Monty Hall Simulator](../../day-4/becca-interactives/monty-hall-simulator/test-multi.html) — the canonical conditional-probability misconception, made manipulable.
- [Bayesian Update Slider Explorer](../../day-4/becca-interactives/bayesian-update-slider-explorer/test-multi.html) — prior, likelihood, and posterior moving together as linked representations.
- [Euclidean Algorithm Stepper](../../day-4/becca-interactives/euclidean-algorithm-stepper/test-multi.html) — a procedural concept exposed as a stepped, inspectable trace.

The [full set of ~25 interactives](../../day-4/becca-interactives/) is the most direct evidence that the pattern travels: the same skill that targets projectile motion in the planned physics examples produces working artifacts in probability, combinatorics, number theory, logic, and proof — without re-authoring the skill.

## Source repo and live examples

- **Project repo (self-contained, grabbable):** [`claude-code-20260604/examples/physics-interactives/`](https://github.com/bok-learning-lab/claude-code-20260604/tree/main/examples/physics-interactives)
- **Day-4 overview essays (tradition, affordance, summary):** [`gallery/day-4/project-overviews/physics-interactives/`](https://github.com/bok-learning-lab/claude-workshop-materials/tree/main/gallery/day-4/project-overviews/physics-interactives)
- **Live faculty-authored examples:** [Becca Belofsky's discrete-math interactives](../../day-4/becca-interactives/)
