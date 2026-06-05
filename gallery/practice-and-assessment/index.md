---
layout: default
title: Practice & Assessment Tools
section: activities
---

# Practice & Assessment Tools

This category collects two projects that sit on either side of the same assessment moment. The **oral exam practice bot** is a tool *students* use to rehearse for a high-stakes spoken exam — it draws questions, records their answer, generates one pointed follow-up, and ends with a structured coach's note. The **exam make-up generator** is a tool *faculty* use to author replacement assessments — it reads an existing exam, interviews the instructor about per-slot topic scope, generates candidate replacement problems, and assembles the chosen candidates back into the original's format. One faces the student; one faces the instructor; both treat the artifact under construction as a curation object, not a verdict.

The common thread is a pedagogical commitment: each project is designed to **coach rather than to grade**, and the human stays the final judge. The oral exam bot makes this commitment unforgeable through what its prompt calls a "no-grading constitution" — an enumerated list of every grading-shaped artifact the model is forbidden from producing. In the language of the source summary, the coach's note is "engineered to be useful without ever being a grade." The make-up generator embodies the same stance from the instructor side: the skill *proposes*; the instructor *curates*; nothing is finalized without a `Keep` box checked by a human.

The two projects are also useful as a contrast in **shape**. The oral exam bot ships as a deployed Vercel webapp with a Next.js front-end, a Whisper transcription step, and two Claude calls per session — a tool the student opens in a browser. The make-up generator ships as a **standalone Claude Code skill** — no webapp, no API endpoint, no inference provider beyond the Claude Code session you already have open. Same pedagogical commitment, very different deployment surfaces. Faculty considering whether to lift either pattern should look at which shape fits the workflow they already run.

---

## Projects in this category

- **[Oral Exam Practice Bot](oral-exam-bot/index.md)** — a reflective-tutor webapp where students rehearse the spoken final for *CL 126x / Hum 5: Literature and Artificial Intelligence*, ending each session with a structured coach's note engineered to be useful without ever being a grade.
- **[Exam Make-up Generator](exam-makeup-generator/index.md)** — a standalone Claude Code skill that turns make-up exam authoring into a three-mode state machine (Generation → Iteration → Assembly) driven by a single editable markdown file, with a worked CS20 final-exam trace included.

---

## When to use this pattern

Reach for this pattern when the assessment you care about benefits from **rehearsal or replacement at scale**, but you don't want the model to *replace your judgment* about what's strong work. Both projects are built on the assumption that the human at the other end of the artifact (the student rehearsing, the instructor curating) is the one whose evaluative authority matters. The model's job is to surface what the human should look at next: which question to draw, which moment in the spoken answer needs more pressure, which candidate problem preserves the original's structure without leaking its answers. If your use case is "auto-grade this," neither project is your reference. If your use case is "give a student something to push against before the real thing" or "give a faculty member a curation surface instead of a blank page," both projects are squarely in your lane.

---

## Two shapes, same commitment

These projects are demonstrated as different deployment forms:

- The **oral exam bot** is a *deployed webapp* — a Next.js app on Vercel, microphone permission, server-side Whisper, server-side Claude. The student visits a URL and works through a state machine of cards.
- The **exam make-up generator** is a *standalone Claude Code skill* — drop two files into `.claude/skills/exam-makeup/`, invoke the skill in any Claude Code session, edit one markdown file as the curation log. No webapp, no hosted infrastructure.

Different shapes, same pedagogical commitment: the model *coaches* and *proposes*; the human *evaluates* and *decides*.
