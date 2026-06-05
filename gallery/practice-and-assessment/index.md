---
layout: default
title: Practice & Assessment Tools
section: activities
---

# Practice & Assessment Tools

Two projects sitting on either side of the same assessment moment. The **oral exam practice bot** is the tool *students* use to rehearse — it draws questions, records the answer, generates one pointed follow-up, ends with a structured coach's note. The **exam make-up generator** is the tool *faculty* use to author replacement assessments — it reads the original exam, interviews the instructor about per-slot topic scope, generates candidate replacement problems, assembles the chosen candidates back into the original's format. One faces the student; one faces the instructor. Both treat the artifact under construction as a curation object, not a verdict.

The pedagogical commitment is the same: the model **coaches and proposes**; the human **evaluates and decides**. The oral exam bot makes this commitment unforgeable through what the prompt calls a *no-grading constitution* — an enumerated list of every grading-shaped artifact the model is forbidden from producing. *DO NOT produce numerical scores, marks, point totals, percentages, letter grades, fractions, ranges, or any "X out of Y" estimates.* Coupled with a qualitative vocabulary given by example (*"really clicking", "solid footing", "the muscle isn't built yet"*), the constitution makes the model useful for rehearsal without ever becoming a grade the student could decode. The make-up generator embodies the same stance from the instructor side: the skill proposes candidate problems; the instructor checks `Keep` boxes; nothing is finalized without a human-checked box.

## Projects in this category

- **[Oral Exam Practice Bot](oral-exam-bot/)** — a reflective-tutor webapp where students rehearse the spoken final for *CL 126x / Hum 5: Literature and Artificial Intelligence*. Question draw, Whisper transcription, a two-stage Claude follow-up (generator + judge), and a coach's note engineered to be useful without ever being a grade.
- **[Exam Make-up Generator](exam-makeup-generator/)** — a standalone Claude Code skill. Three modes (Generation, Iteration, Assembly) auto-detected from a single editable markdown file that is the curation log and the audit trail at once. CS20-tested on the Harvard discrete-math spring-2026 final: 1,741 lines, 10 slots, 37 candidates across two rounds.
