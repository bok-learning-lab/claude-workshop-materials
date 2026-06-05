---
layout: default
title: "Source → Teaching Materials"
section: activities
---

# Source → Teaching Materials

Distillation pipelines: the input is a primary source — a single dense paper, a long-form transcript, a lecturer's plain-text notes, a folder of candidate readings — and the output is something an instructor uses in class or sends to students. Cases and discussion plans, a Top-10 takeaways doc, an illustrated lecture page with verified catalogue facts, a navigable hub of paper summaries. The artifacts differ; the pipeline shape is the same.

The discipline these projects enforce is what makes them worth lifting. The model *augments* the instructor's reasoning rather than replacing it. Speculative pedagogical connections are marked as speculative. Factual claims about real-world objects are fetched from the institution that owns them, not improvised from the model's memory. The human stays the moral agent — the decider, the rememberer of what landed in the room, the one who knows which paper is actually load-bearing for next week's seminar. The model does the work that scales poorly: drafting a case that isolates one move in an argument, ranking ten things out of a ninety-minute conversation, resolving twelve `SHOW:` markers against a museum's catalogue, reading a stack of PDFs end-to-end so the instructor can decide which to read in full.

The discipline that recurs across these projects is **two-pass**: write the neutral summary first, the pedagogical twist second, and keep them visually separate in the artifact so a reader can consume the summary without the editorial layer. This is most explicit in **research-helper** — the prompt is structured so the faithful summary and the agenda-bridging "twist" are separate passes, with the explicit instruction to say "this does not transfer" when that is the truthful reading. It is the same move in **paper-to-teaching**: a `/teaching-case` writes a student-facing case first, then a separate set of instructor notes ties each move to a section of the source paper. In both projects the structural separation is what keeps the agenda from leaking into the description.

## Projects in this category

- **[Paper to teaching materials](paper-to-teaching/)** — turns Grant, Behrends & Basl's 2025 *Philosophical Studies* paper into a four-skill toolkit (`/teaching-case`, `/discussion-plan`, `/objection-audit`, `/quiz`) for a graduate seminar on automated decision-making.
- **[Class summarizer](class-summarizer/)** — the meta-project: this is the pipeline used to make the daily Top-10 takeaways docs *for this very workshop*. Forced count of ten, bold-headline format, portable HTML companion.
- **[Art history lecture](art-history-lecture/)** — the MCP example. A lecturer's plain-text notes become a single illustrated web page where every image and catalogue fact is pulled live from the Harvard Art Museums.
- **[Research helper](research-helper/)** — turns a folder of arXiv-style PDFs into one HTML summary per paper plus a hub `index.html`, with a two-pass neutral-summary / honest-twist structure.

## When to use this pattern

Use this pattern when there is a defined source (one paper, one transcript, one folder, one set of notes), a clear downstream audience (your seminar, a colleague who missed the session, students who will read it on Canvas), and a teaching point you can name. The pipeline pays off when the source is dense enough that distillation is real work, the audience needs the substance more than the process, and the failure mode of a generic LLM summary — accurate-but-inert prose that does not re-create the room — would be costly. If you can name the *mantra* you want the artifact to carry, this category fits.
