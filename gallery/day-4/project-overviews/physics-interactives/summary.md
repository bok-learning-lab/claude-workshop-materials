# Physics interactives with Claude Code: PhET-style simulations a faculty member can author themselves

*One of three day-4 projects in the Bok Center workshop. ← [Project landing page](../index.md). Companion docs: [Tradition](tradition.md) · [Affordance](affordance.md).*

This project is a working demonstration that the kind of interactive teaching simulation pioneered by Carl Wieman's PhET project at Colorado — small, manipulable, conceptually disciplined worlds in which a learning idea becomes visible — is now within reach of an individual faculty member with an afternoon. The skills in this folder do not try to replace PhET. They try to make the PhET *design grammar* available to faculty in disciplines PhET never served, and to the topics PhET never covered.

## What the project ships

Three Claude Code skills live in the project's own `.claude/skills/` directory, so they travel with the folder rather than living globally on a researcher's machine.

- **`/phet-sim`** runs a structured pedagogical interview *before* writing any code: learning goal, target learner, the misconception the simulation should make visible, the variables that should be manipulable, the variables that should be deliberately hidden, the linked representations, the reflection prompts, the model's limitations, the classroom use. Only then does it generate a single-file HTML simulation that opens by double-click in Chrome with no build step. The interview is the skill's main contribution; without it, the skill would be just another "make a slider thing" prompt.
- **`/phet-activity`** takes an existing simulation (or its design record) and a few classroom context inputs and produces a Wieman-style lesson plan organized around the four-phase Predict → Observe → Explain → Synthesize structure. It refuses to ship a plan that does not name at least two expected wrong predictions — the highest-leverage piece of an interactive-engagement lesson, and the move most often skipped.
- **`/phet-accessibility-audit`** audits a generated simulation against an accessibility floor (keyboard operability, label coverage, contrast, color-only information, live-region density, motion handling) and produces a markdown report categorizing findings as Blockers, Warnings, or Notes. A simulation with Blockers is not declared ready to share with students.

The project also ships three single-file HTML templates (SVG, Canvas, and a linked-graph layout), a quality-scoring rubric used by `/phet-sim`'s final QC pass, an accessibility checklist, and a paper-friendly version of the pedagogical interview for faculty who prefer to think through the design before any code is written. Two project-level essays — [essay-phet-tradition.md](../../projects/physics-interactives/essay-phet-tradition.md) and [essay-manipulable-artifact.md](../../projects/physics-interactives/essay-manipulable-artifact.md) — give the historical and learning-sciences context, and a [research-basis.md](../../projects/physics-interactives/research-basis.md) note collects the empirical literature the skills lean on.

## What attendees see in the session

The session opens with the design discipline, not the code. A faculty member states a learning goal in their own discipline — the demo target is the damped-harmonic-oscillator and the misconception that *more damping makes a system settle faster* — and `/phet-sim` interviews them through the eight remaining questions. Only after the design is captured does the skill generate the HTML file, which opens locally with no server and no build step.

The session then runs `/phet-activity` against that simulation to produce a 45-minute in-class lesson plan, with a predicted-wrong-predictions section that the instructor can recognize on the day. Finally `/phet-accessibility-audit` produces a categorized report against the artifact, demonstrating that the audit gates "ready to share with students" against a real floor, not a vibe.

The three skills are deliberate. They line up with the three structural problems the PhET tradition surfaced over twenty years: that pedagogical design must precede code, that an interactive artifact teaches only when wrapped in an active-learning activity, and that accessibility is part of pedagogy rather than a polish item.

## A note on framing

The project is conservative about what it claims. The skills do not author the design; they elicit it. They do not validate against students; they enforce a floor that classroom validation would still extend. They do not replace the PhET corpus; they make the PhET *form* available to the topics no funded team would ever have built. The deeper argument is in two companion documents: [tradition.md](tradition.md) places PhET in the longer history of pedagogical artifacts, and [affordance.md](affordance.md) walks through what LLM-built simulations change about that tradition and what they do not.

---

*Physics interactives overview: [Summary](summary.md) · [Tradition](tradition.md) · [Affordance](affordance.md). Back to the [project landing page](../index.md).*
