---
layout: default
title: Oral Exam Practice Bot
section: gallery
---

# Oral Exam Practice Bot

*Part of [Practice & Assessment Tools](../index.md).*

A worked example of a **reflective-tutor webapp** — an oral-exam rehearsal bot for *CL 126x / Hum 5: Literature and Artificial Intelligence* at Harvard. The student draws questions, prepares, records spoken answers, gets one pointed Claude-generated follow-up per question, and ends with a structured **coach's note** that is engineered to be useful without ever being a grade.

> **Live demo:** <https://complit126-quizzer-interface.vercel.app/> — click to try a session in your browser; microphone permission required.
>
> **Source repo:** <https://github.com/bok-learning-lab/complit126-quizzer> — the production Next.js app, deployed to Vercel.
>
> **Course:** CL 126x / Hum 5, *Literature and Artificial Intelligence*, taught at Harvard. The course pairs canonical literary texts (Genesis, Homer, Hesiod, Frankenstein, Freud, Benjamin, Rankine) with contemporary questions about AI and machine creativity. The oral exam is the final assessment; this bot is the rehearsal tool. There is a small irony worth noting: the oral exam is about literature on artificial intelligence, and the rehearsal tool is itself built with AI.

This is the Examples section's first project drawn from a **deployed production webapp** rather than from a CLI-style Claude Code session. The pattern it demonstrates ports cleanly to any course where students rehearse spoken assessments and where the teacher wants the rehearsal tool to *coach* rather than to *grade*.

---

## What it is

A single webapp wired around **four operations**:

1. **A question draw** — `inputs/questions.ts` is the source of truth for the course's exam content; the draw logic picks two specific questions from *different* units plus one big question with its AI addendum.
2. **A transcription step** — OpenAI Whisper, server-side. Audio stays on the server; the transcript comes back as plain text.
3. **A mid-session follow-up prompt** — Claude, structured as a **two-stage** call: generate five candidate follow-ups, then a second Claude call judges and returns the single best one.
4. **An end-of-session coach's-note prompt** — Claude, the centerpiece. Structured prose feedback with the **no-grading rule as its constitution**.

The Next.js React UI chains these together. The user sees one screen at a time: intro → drawn → prep → record → follow-up → next question → coach's note. The clock pauses while Claude is thinking and while the user is replaying their own audio, so neither delay eats into their answering time.

---

## The pedagogical commitment: a coach's note engineered to be useful without ever being a grade

The whole project is built around a single tension. Students need feedback before the real exam, but a number coming back from a model — *any* number, even a friendly "you'd be at a B+" — feels weighty in ways that aren't useful for rehearsal and that violate the project's posture toward AI assessment. The coach's-note prompt makes the no-grading rule **unforgeable** by listing every grading-shaped artifact the model is forbidden from producing, by name:

> DO NOT produce numerical scores, marks, point totals, percentages, letter grades, fractions, ranges, or any "X out of Y" estimates. DO NOT compare their performance to a passing threshold or imply where they would "land." DO NOT add up or invent point weights. The student should not be able to reverse-engineer a grade from your reply.

Coupled with that prohibition: **a qualitative vocabulary given by example** ("really clicking", "solid footing", "still finding its shape", "the muscle isn't built yet", "the shape is right but the evidence is thin"). Without those, the model defaults to A/B/C-mappable adjectives that students decode back into grades.

And the **rubric is given to the model in question form** ("Did your evidence support your claims?"), with the numeric weights *deliberately stripped*. The model is *encouraged* to quote those rubric questions back to the student — quoting them is one of the most useful things it can do — but it cannot infer or hint at point weights.

That triad — the named forbidden artifacts, the qualitative vocabulary by example, and the rubric-as-questions-with-weights-stripped — is what turns a generic "reflect on your answer" prompt into a tool a department's exam committee can sign off on.

The second move worth noticing is the **two-stage follow-up** (generator + judge). A single-shot "give me one follow-up question" prompt produces follow-ups that are okay but rarely great. Splitting the move into *brainstorm five → choose the sharpest one* is the cheapest possible quality lift; it's the same generator/judge pattern used in summarization-with-self-critique, applied here to coaching.

---

## How it was built

**Phase 1 — Faculty packet → structured data.** The instructor brought the actual oral-exam packet (`cl126x-oral.docx`). The first move was extracting it into `inputs/questions.ts` as a TypeScript module with three exports: `works[]`, `specificQuestions[]` grouped by unit, `bigQuestions[]` and `bigAddendum`, plus a `rubric` string in prose form (numeric weights deliberately stripped). The decision to use TS rather than JSON or YAML was about editability — a faculty member can edit this file directly in any editor and the app picks up the changes on next build; no schema migrations, no admin UI.

**Phase 2 — The two-stage follow-up prompt.** First implemented as a single-shot prompt; the outputs were okay but generic ("Could you say more about that?"). Splitting it into a generator that brainstorms five candidates and a judge that picks one is the smallest change that produces meaningfully better follow-ups. The generator is told to be warm and curious, like a teacher in office hours; the judge is told to pick the candidate that pushes hardest on what the student actually said. Both stages are told, explicitly, not to score.

**Phase 3 — The coach's-note prompt as the project's design center.** Most of the project's iteration went into this prompt. The first draft produced a numeric score; the second produced a "letter grade equivalent"; the third produced a soft "you'd be in the strong range"; each iteration found a softer adjacent way to grade. The fix was not a softer instruction but an *enumerated* prohibition — every grading-shaped artifact named explicitly, paired with a qualitative vocabulary the model can reach for instead. Later additions: the rubric-as-questions move, the prep-packet injection (grounds feedback in specific course texts the student should revisit), and the fixed plain-text structure with literal section headings (prevents the model from drifting into bulleted assessment prose).

**Phase 4 — UI as state machine.** The whole React UI is one component (`apps/interface/app/page.tsx`) that walks through stages: intro → drawn → prep → exam → done|timeup. Each stage is a rendered card. The clock-pause-while-Claude-is-thinking detail matters: it tells the student that the system is on their side about the time budget. The rest of the UI is shadcn/ui primitives; no animations, no flourishes — the rehearsal tool should feel like a tool, not a toy.

**Phase 5 — Deploy and forget.** Vercel deployment with the workspace root at `apps/interface/`. Environment variables for the Anthropic and OpenAI keys. No login, no analytics, no persistence — a session is gone when the page reloads. That stance is part of the no-grading commitment: nothing about a session can be retrieved, compared, or used to build a profile.

---

## Notes for adapting to other courses

The pattern is **a single source-of-truth content file + two Claude prompts (mid-task coaching, end-of-session reflection) + a transcription step + a tiny state machine that chains them**. The substance is in the prompts; the substance survives translation. Specifically:

- **Any oral-exam-style assessment in any discipline.** Foreign-language oral exams, philosophy viva voce, medical case presentations, music theory ear-training defenses. The "no-grading constitution" generalizes; the works list and rubric change.
- **Pitch and presentation rehearsal.** Business-school pitch practice, dissertation-proposal defenses, conference talk run-throughs. The transcription + follow-up + coach's-note loop is the same; the rubric questions are different.
- **Interview practice tools.** Med-school MMI, residency interviews, internal-job-interview rehearsal. The follow-up step is doing roughly what a good interview coach does mid-question.
- **Clinical case practice for health-professions education.** A medical or nursing student talks through a case; the follow-up surfaces the differential diagnosis they didn't reach for; the coach's note flags what they missed *without* mapping to a CCNA-style score.
- **Foreign-language conversation practice.** Replace Whisper with a language-specific transcription model (or use Whisper's multilingual capability) and tune the coach's-note prompt for the language's conventions. The no-grading move generalizes to L2 conversation feedback.
- **Reading group / book-club discussion practice.** A solo reader records their answer to a reading question; the bot generates one follow-up and an end-of-session reflection on what they noticed and what they missed.

### Alignment constraints worth preserving

These come from the production project and survive translation to any reflective-tutor tool:

- **No grading, ever.** Forbid each grading-shaped artifact by name — scores, marks, point totals, percentages, letter grades, fractions, ranges, "X out of Y" estimates, pass/fail implications. A blanket "don't grade" is too permissive.
- **Qualitative vocabulary by example.** Give the model the words for strength that aren't numeric. Without examples it defaults to grade-mappable adjectives.
- **Rubric in question form, weights stripped.** Quoting rubric questions back to the student is one of the most useful things the model can do. Reproducing or hinting at weights enables backdoor grading.
- **Course content as active context, not as a footnote.** Tell the model to name specific texts, point to sister questions, invoke motivating questions. "May quote" is not enough; "use the packet actively" is.
- **Plain text, fixed section headings.** Free-form output drifts into assessment prose. The shape of the artifact is part of the artifact.
- **No persistence.** A rehearsal tool that stores transcripts becomes, over time, a profile-building tool. Discard the session on page reload; let the student own what they take away from it.
- **Server-side keys, no analytics.** API keys never leave the server; nothing about a session is logged. Part of the no-grading posture — and part of the trust that makes students use the tool.

---

*Back to [Practice & Assessment Tools](../index.md).*
