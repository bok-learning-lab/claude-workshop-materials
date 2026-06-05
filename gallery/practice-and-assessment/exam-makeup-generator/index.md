---
layout: default
title: Exam Make-up Generator
section: gallery
---

# Exam Make-up Generator — a standalone Claude Code skill

*Part of [Practice & Assessment Tools](../index.md).*

A worked example of a **Claude Code skill** that turns the laborious task of writing a make-up exam into a curated multi-round flow: read the original exam, run an interview about per-slot topic scope, generate candidate replacement problems (2–3 per slot), iterate on instructor feedback, then assemble the chosen candidates into a finished make-up exam in the original's format. **CS20-tested** — the worked run in this gallery is the real Round-1 + Round-2 + Assembly trace on the Harvard CS20 (discrete math) spring-2026 final exam.

> **Installation — no Vercel URL, no API, no webapp. This ships only as a skill.**
>
> Drop `operations/skill.md` and `operations/skill.json` into your project's `.claude/skills/exam-makeup/` (or your user-level `~/.claude/skills/exam-makeup/`). Rename `skill.md` → `SKILL.md` if your Claude Code version expects the uppercase filename. Then invoke the skill in any Claude Code session with `Use exam-makeup to ...` or pass an exam path directly.
>
> **No external service required.** The skill operates entirely through Claude Code's file tools — `Read` for the exam, `Write` for the candidate file, `Edit` for iteration. There is no API endpoint, no inference provider beyond the model Claude Code is already using.

This is the gallery's first **standalone-skill** example. Where the oral exam bot ships a deployed Vercel page and other projects ship CLI-style Claude Code folders with skills nested inside, this one ships **only the skill** plus a worked run. It's the cleanest demonstration in the gallery of what a project-scoped or user-scoped skill can look like at substantial scale (~400 lines, three modes, an interview phase, dated audit trail, format-agnostic I/O).

---

## What it is

A self-contained skill consisting of:

- **`operations/skill.md`** — the skill itself, ~400 lines. Defines three modes (Generation, Iteration, Assembly) auto-detected from a single state-driving markdown file. Specifies the interview phase, the generation rules (parity, distinctness, partial-credit, format match), the iteration semantics (preserving consumed feedback as a quoted block), the assembly sanity checks (balanced environments, typo'd-tag regex, problem/subpart counts), and the format-agnostic read strategies.
- **`operations/skill.json`** — the one-line manifest (name, description, version, author).
- **`operations/three-mode-state-machine.md`** — a reader's entry point. The shape of the skill before its substance.

Plus a worked run on the **CS20 spring-2026 final**:

- `inputs/final_s.tex` — the original exam (LaTeX source, 10 problems, with solutions). The structural anchor for the run.
- `inputs/final_s.pdf` — the same exam, rendered, for visual reference.
- `outputs/final_s_makeup_candidates.md` — the real Generation + Iteration output. **1,741 lines, 10 slots, 37 candidates total across two rounds**, complete LaTeX solutions per candidate, instructor's 10 Keep boxes pre-checked.
- `outputs/final_s_makeup.tex` — the real Assembly output. A complete make-up exam in the same LaTeX format as the original.

---

## The three-mode state machine — one editable markdown file IS the state

The skill's entire architecture is a state machine driven by a **single editable markdown file**. No database, no JSON state-store, no separate metadata. The candidates file is the curation log, the work-in-progress artifact, the audit trail, and the input-for-the-next-mode — all the same file. The instructor edits it directly (in VS Code, Cursor, GitHub web, anywhere that renders GitHub-Flavored-Markdown task-list checkboxes); the skill auto-detects what to do next from the file's state.

Three modes, one file:

| Mode | Trigger | Edit |
|---|---|---|
| **Generation** | File doesn't exist | Skill creates it |
| **Iteration** | `**Feedback for next round**` block is non-empty | Skill appends new candidates; preserves consumed feedback as a quoted block |
| **Assembly** | At least one `- [x] **Keep**` is checked; no pending feedback | Skill assembles into final exam |

The instructor never has to remember which mode they're in. They edit the file (or don't), re-invoke the skill, and the skill figures out what to do.

This is the **opposite** of the workflows-with-state typically described in agent-engineering literature, which lean toward separate state-stores, separate metadata, separate "configuration" surfaces. The exam-makeup skill commits to: *if the artifact you're producing is a markdown file the instructor reads anyway, then the file IS the state. Edit the artifact, re-invoke the skill, observe the new state.*

---

## The interview phase, before any generation happens

The second move worth noticing is the **interview phase with three named topic-scope tiers** (narrow / broader / broadest), plus two cross-cutting modifiers (*lateral broadening* and *broader still*). Without the interview, the skill infers topic scope from the original's surface form alone — and inferred topics are usually too narrow, producing candidate clones with weak security. The interview is the single moment of human-driven scope-choice in the whole run; it's the difference between *"three near-duplicates of the original disease-test Bayes problem"* and *"a Bayes problem on spam filtering, a Bayes problem on medical screening with two conditionally-independent tests, and a Bayes problem on cyber-intrusion detection."*

The third move is the **security-vs-parity foundational commitment**, made structurally legible in every candidate via the *Suitability* sentence:

> *"Tests the same three-skill build (mutual-inclusion identity → derived cardinality → characterizing condition) on a three-set distributivity rather than symmetric difference; the operation, the cardinality formula, and the characterizing condition are all unrelated to the original."*

The Suitability sentence names what was preserved (technique, structure, difficulty) and what was changed (domain, scenario, numbers). The instructor decides at-a-glance whether the candidate makes the security/parity trade-off the way they want. The decision surface is **one sentence**.

---

## Format-agnostic I/O

The skill reads and writes in the original artifact's format. The supported formats:

`.tex` · `.pdf` · `.docx` · `.md` · `.html` · `.txt` · `.rtf` · `.doc`

The conversion path is documented inside the skill (`pandoc`, `textutil`, fallback strategies). Scanned/image PDFs that resist text extraction are handled by stopping and asking the user — *better than guessing*. The CS20 worked run uses LaTeX end-to-end, but the same skill would, on a Word original, write back a `.docx`.

---

## How it was built

**Phase 1 — The security-vs-parity problem statement.** Make-up exams are *hard* because the two constraints pull in opposite directions. "Different from the original" can mean *different topic* (easy, but breaks parity), *different framing* (might not be enough), or *different concrete domain holding everything else constant* (the right kind of different, hard to do well). The skill is designed entirely around this last move.

**Phase 2 — The state-machine.** Three modes, one file. The auto-detect logic is dense but surgical: file-doesn't-exist ⟶ generation; non-empty feedback block ⟶ iteration; checked Keep box + no pending feedback ⟶ assembly. The instructor's mental model is *edit the file, re-invoke the skill*, nothing more.

**Phase 3 — The interview phase.** Initial drafts of the skill went straight from analysis to generation. The candidates were *technically correct* (same skill, similar difficulty) but very clone-y — the topic was always inferred from the original's surface domain, which forced the variations to be in the *same neighborhood*. Adding the narrow/broader/broadest interview let the instructor say "actually I want any problem from the *combinatorics unit*, not just lattice paths." Candidate variety improved sharply.

**Phase 4 — Iteration as the curation log.** Early versions overwrote candidates in iteration. The instructor lost the history. The current design *appends* — new candidates go under existing ones with a dated separator; consumed feedback is preserved as a quoted block; the file accumulates rounds. Future readers (including the instructor weeks later) can see exactly what each round of feedback addressed.

**Phase 5 — Assembly sanity checks.** The first version of assembly produced LaTeX that occasionally didn't compile — a typo'd closing tag, an unbalanced environment, a missing `\end{solution}`. The current version runs format-specific sanity checks (counts of `\begin` vs. `\end`, regex for typo'd closing tags, problem-count and subpart-count verification against the test plan) before reporting success. If checks fail, the skill fixes what's safe to auto-fix and surfaces the rest.

**Phase 6 — Format-agnostic I/O.** The skill was originally LaTeX-only. The current version reads `.tex`, `.pdf`, `.docx`, `.md`, `.html`, `.txt`, `.rtf`, `.doc` and writes back in the original's format.

---

## Notes for adapting to other courses and other artifacts

The pattern is **a multi-mode skill where a single editable markdown file is both the curation surface and the state**. The make-up-exam use case is one application; the underlying shape generalizes to any task where:

- The skill produces something an expert would otherwise hand-curate.
- The expert wants to review, iterate, and choose — not autonomously regenerate.
- The chosen items need to be assembled into a final artifact at the end.

Specifically, the pattern ports cleanly to:

- **Reading-list curation for a course.** Skill reads a syllabus's existing reading list, generates 2–3 replacement readings per topic week (same theme, different author / scope / register), iterates on instructor feedback, assembles a finished alternative syllabus.
- **Slide-deck refresh.** Skill reads an existing slide deck, generates 2–3 replacement slides per slot (same content, different visual approach), iterates, assembles.
- **Problem-set generation for a course.** Same as make-up exam, applied to weekly problem sets. The security concern is lower (recall isn't a threat) but the parity concern is identical (same difficulty, same skills, same coverage).
- **Patient-case bank generation for health-professions education.** Same shape: generate clinical cases that test the same diagnostic skills as existing reference cases, with different presentations.
- **Code-review test suite refresh.** Same shape: regenerate test cases that probe the same code paths as existing ones, with different inputs.
- **Interview-question bank rotation.** Generate replacement interview questions that test the same competencies as existing ones, with sufficient distinctness that candidates who've heard the originals gain no advantage.

The constants across all of these:

1. A single source-of-truth artifact (the existing exam, syllabus, deck, case bank).
2. A multi-round candidate-curation loop driven by file-state, not chat-state.
3. An interview-phase calibration step before bulk generation.
4. A *Suitability* commitment per candidate — what's preserved, what's changed, in one sentence.
5. An audit-trail preservation rule (consumed feedback as quoted blocks).
6. A sanity-checked assembly step that matches the original's format.

### Alignment constraints worth preserving

These come from the skill itself and survive translation to any curation-style skill:

- **Never modify the original.** Read-only access to the source artifact.
- **The instructor curates; the skill proposes.** Multi-round candidate loops, not autonomous regeneration.
- **A single file drives state.** Don't add a JSON state-store or a separate metadata file. The editable artifact IS the state.
- **The interview phase happens once, before generation.** Bulk-generating without calibration produces clone-y candidates.
- **Suitability is one sentence per candidate.** Longer rationales encourage reading instead of deciding.
- **Preserve consumed feedback as a quoted block** across iteration rounds. The file is the curation log.
- **Concrete, gradable subparts only.** No vague "explain why this matters" subparts.
- **Sanity-check assembly before reporting success.** Format-specific checks (balanced environments, typo'd-tag regex, problem-count verification).
- **One artifact per invocation.** Don't batch across multiple exams / syllabi / decks.
- **Trust contract: read the artifact, surface uncertainty, ask before guessing.** If the source's structure is ambiguous, stop and ask. A make-up exam built on a misread test plan is worse than no draft.

---

*Back to [Practice & Assessment Tools](../index.md).*
