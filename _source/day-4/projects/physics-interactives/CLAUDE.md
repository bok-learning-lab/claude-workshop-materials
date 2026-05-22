# CLAUDE.md

This file gives Claude Code project-specific instructions when working inside this folder.

## What this project is

A self-contained bundle for making **PhET-style interactive simulations** — single-file HTML pages that a faculty member can build with Claude Code, double-click to open in Chrome, and share with students without any setup. The project ships with:

- An essay explaining why this kind of artifact was historically out of reach for individual faculty, and why it isn't anymore: [essay-phet-tradition.md](essay-phet-tradition.md).
- A companion essay placing PhET-style manipulable artifacts in the broader learning-sciences tradition (constructionism, conceptual change, embodied cognition, design-based research) and naming the adjacent disciplines the LLM inflection now opens up: [essay-manipulable-artifact.md](essay-manipulable-artifact.md).
- A research-basis note summarizing the empirical literature (PhET design studies, Wieman/active-learning evidence) the skills are built on: [research-basis.md](research-basis.md).
- A skill (`/phet-sim`) that runs a structured pedagogical interview before generating each simulation, plus rubrics and templates that keep quality high.
- Worked examples a faculty member can adapt for their own course.

The full project plan is in [PLAN.md](PLAN.md).

This folder is designed to be **grabbable**. A physics faculty member can take just this directory, open Claude Code inside it, and start making teaching interactives without needing the rest of the workshop repo. Skills live in the *project's own* `.claude/skills/` directory, not at the repo root.

## Audience modes

Two kinds of people open Claude Code here:

- **Faculty making their own interactive.** They may never have touched a code editor before. Default to plain-English explanations and don't assume CLI or git fluency. Their natural first move is to invoke the `/phet-sim` skill and answer its questions — or to fill out [skill-draft/rubrics/pedagogical-design-worksheet.md](skill-draft/rubrics/pedagogical-design-worksheet.md) on paper first if they want to think through the design before any code is written.
- **Marlon (or another collaborator) iterating on the skill itself or its examples.** Terse responses, no hand-holding. They're working from [PLAN.md](PLAN.md).

If it's unclear which mode applies, ask one question to disambiguate.

## Output contract (hard rules)

Every simulation produced by this project must satisfy these properties. They are the whole point of the project — they make the resulting file portable, emailable, Canvas-uploadable, and viewable on any laptop without setup.

- **Single `.html` file**, opens by double-click in Chrome from `file://`.
- **No React, Vue, Vite, Next.js, `npm install`, or any build step.**
- **No runtime data fetches.** No `fetch`, no `XMLHttpRequest`, no loading of JSON/CSV/images/audio at runtime. Everything the simulation needs is embedded inline or generated in code.
- **External CSS via `<link>` is allowed.** External JS via CDN is allowed but discouraged; if used, mark it in the file's header comment.
- **No emojis** anywhere in any file (matches the workshop repo's convention).
- **Header comment captures the design record** — learning goal, target learner, core misconception, manipulables, hidden variables, representations, prompts, limitations, classroom use, date.

If a user explicitly overrides one of these rules (e.g. "I'm fine with a CDN dependency for this one"), proceed but mark the deviation in the file's header.

## Layout

```text
physics-interactives/
  CLAUDE.md                                — this file
  PLAN.md                                  — project plan; read first if iterating on the skill
  essay-phet-tradition.md                  — historical context for the design tradition
  essay-manipulable-artifact.md            — companion essay: learning sciences + adjacent fields
  research-basis.md                        — empirical research basis (PhET + Wieman/active learning)

  skill-draft/                             — working copy; promoted to .claude/skills/ in Phase 4
    SKILL.md                               — the /phet-sim skill (draft)
    rubrics/
      simulation-quality-rubric.md         — 8 dimensions, 0/1/2 scoring; QC pass uses this
      accessibility-checklist.md           — keyboard, labels, contrast, sizing floor
      pedagogical-design-worksheet.md      — paper-friendly version of the 10-question interview
    templates/
      single-file-svg-sim.html             — minimal SVG starter (default choice)
      single-file-canvas-sim.html          — Canvas starter (particle systems, fields)
      single-file-linked-graph-sim.html    — canonical PhET layout: model + live graph
    examples/                              — worked examples (to be added in PLAN Phase 3)

  .claude/skills/                          — promoted skills land here
    phet-sim/                              — author a new simulation (live)
    phet-activity/                         — author classroom lesson plan around a sim (live)
    phet-accessibility-audit/              — audit a sim against the accessibility floor (live)
    phet-rationale/                        — department-facing rationale for a sim/activity (live)
    phet-critique/                         — review an existing .html (planned)
    phet-port/                             — convert a static figure to an interactive (planned)

  output/                                  — generated simulations land here when this project
                                             is opened standalone
```

## The skills

- **`/phet-sim`** — author a new simulation from a learning goal. Runs a structured pedagogical interview (10 questions covering goal, learner, misconception, manipulables, hidden variables, representations, feedback, prompts, limitations, classroom use) *before* writing any code. Produces a single-file HTML that satisfies the output contract above. Self-scores against [.claude/skills/phet-sim/rubrics/simulation-quality-rubric.md](.claude/skills/phet-sim/rubrics/simulation-quality-rubric.md) and reports the score; refuses to declare a simulation done if it scores below 12/16 or scores 0 on any dimension.

  *Status:* live at [.claude/skills/phet-sim/SKILL.md](.claude/skills/phet-sim/SKILL.md). Reference baseline still in `skill-draft/` until verified end-to-end.

- **`/phet-activity`** — build a complete classroom lesson plan around an existing PhET-style sim, grounded in Carl Wieman's research on interactive engagement. Reads the sim's design record, gathers course context (level, modality, time budget, position in the course, assessment), then produces a single markdown lesson plan with the four-phase **Predict → Observe → Explain → Synthesize** structure, pre-class prep, follow-up assessment, and instructor facilitation notes (including expected wrong predictions). Refuses to ship a plan that fails any non-negotiable item on its [lesson-quality checklist](.claude/skills/phet-activity/rubrics/lesson-quality-checklist.md).

  *Status:* live at [.claude/skills/phet-activity/SKILL.md](.claude/skills/phet-activity/SKILL.md). See also the research anchor at [.claude/skills/phet-activity/reference/wieman-pedagogy.md](.claude/skills/phet-activity/reference/wieman-pedagogy.md).

  *Pairing:* `/phet-activity` is the natural pair to `/phet-sim`. A sim built without an activity is a screenshot; an activity without a sim is a worksheet. The two skills together produce the artifact + the scaffolding that turns the artifact into teaching.

- **`/phet-accessibility-audit`** — audit a single-file simulation against the project's accessibility floor (keyboard operability, label coverage, contrast, color-only information, live-region density, motion handling). Produces a categorized markdown report with Blockers, Warnings, and Notes; gates "ready to share with students" on real measurements rather than instructor confidence. Replaces the v1 eyeball QC pass in `/phet-sim`'s final step.

  *Status:* live at [.claude/skills/phet-accessibility-audit/SKILL.md](.claude/skills/phet-accessibility-audit/SKILL.md). Bundles its own [accessibility checklist](.claude/skills/phet-accessibility-audit/rubrics/accessibility-checklist.md); v2 ideas live in [skill-draft/accessibility-v2-ideas.md](skill-draft/accessibility-v2-ideas.md).

- **`/phet-rationale`** — produce a 600–1,000-word department-facing rationale for a specific simulation and (optionally) its `/phet-activity` lesson plan. Reads the artifact's design record, draws on the project's Wieman/PhET research anchor and the project-level [research-basis.md](research-basis.md), and produces a markdown document suitable for a department chair, curriculum committee, dean, accreditation reviewer, or skeptical colleague. Refuses to fabricate citations; refuses to omit the "what we are not claiming" section.

  *Status:* live at [.claude/skills/phet-rationale/SKILL.md](.claude/skills/phet-rationale/SKILL.md). Draws on `/phet-activity`'s [wieman-pedagogy reference](.claude/skills/phet-activity/reference/wieman-pedagogy.md) rather than duplicating it.

- **`/phet-critique`** *(planned)* — score an existing `.html` against the rubric and accessibility checklist; produce a critique memo with a prioritized list of improvements.

- **`/phet-port`** *(planned)* — take a static figure, description, or equation and propose the manipulable / fixed / linked-representation decomposition, then build the interactive. The on-ramp skill for faculty who arrive with a textbook diagram in mind.

## Generated outputs

- **When this folder is opened standalone** (faculty workflow): generated `.html` files go in this project's own `output/` directory.
- **When opened from inside the larger workshop repo:** generated `.html` files go in the repo-root `output/physics-interactives/` directory instead, matching the workshop's overall convention.

In both cases, the design record stays embedded as a header comment inside the `.html` file. Do not write a separate metadata file alongside.

## Session-start checks

On session start, in this order:

1. Check whether `.claude/skills/phet-sim/SKILL.md` exists.
   - If it does, the skill is invokable as `/phet-sim`. Silence is correct.
   - If it does not, the skill is still in draft form. Mention this to the user once, point to [skill-draft/SKILL.md](skill-draft/SKILL.md), and offer to invoke the workflow from the draft.
2. Make sure an `output/` directory exists (project-local if running standalone, repo-root `output/physics-interactives/` if running from the workshop repo). Create it lazily when the first generation is requested.

If both are in place and the user hasn't asked a question, say nothing — silence is the right behavior.
