# Interview coding with Claude Code: a worked example of flexible coding

*One of three day-4 projects in the Bok Center workshop. ← [Project landing page](../index.md). Companion docs: [Tradition](tradition.md) · [Affordance](affordance.md).*

This project is a worked example of LLM-assisted qualitative interview coding, built to align with Mary Waters' "flexible coding" approach as set out in Deterding & Waters (2018, *Sociological Methods & Research*). It is not a generic "AI for qualitative research" pitch. The skills demonstrated here implement, one by one, the moves the paper proposes — indexing before analytic coding, theory-aware rather than purely inductive, transparency in methods reporting, no LLM-as-theme-discoverer framing.

## What the project ships

Three Claude Code skills live in the project's own `.claude/skills/` directory, so they travel with the folder rather than living globally on a researcher's machine.

- **`/index-transcript`** applies broad index codes to a single transcript, anchored to the interview protocol's sections. It produces an indexed copy of the transcript and a coverage report flagging where the conversation drifted away from the protocol. This is Waters' Stage 1 — scaffolding, not analysis.
- **`/find-negative-cases`** takes a claim and the indexed corpus and returns respondents whose evidence cuts against the claim, with verbatim excerpts, line references, and reasoning. It closes with an "implications for the theory" recommendation: narrow, abandon, or keep-but-report. This is Waters' Stage 3 validation move, drawing on Katz, Luker, and Blee.
- **`/methods-paragraph`** reads the project's actual state — what indexing was done, which claims were audited, what was *not* done — and writes a 250–500 word methods paragraph suitable for a journal article. It refuses to fabricate procedure that the project state does not support.

Each skill includes a small worked example output, run against a synthetic four-respondent corpus modeled on Deterding's (2015) study of low-income mothers planning their children's college paths. The corpus is designed to surface a specific demo move: a clear instrumental case, a clear expressive case, a mixed case, and a construct-validity stress test where surface vocabulary and underlying reasoning point in different directions.

## What attendees see in the session

The workshop demo runs the three skills end-to-end on the sample corpus. Indexing produces a navigable scaffold across all four transcripts. The negative-case audit, run against the claim "instrumental mothers reject family/emotional framing of college," surfaces the stress-test case — a respondent whose reasoning is instrumental but whose vocabulary is heavily emotional and family-centered — and writes the reasoning paragraph that explains the distinction. The methods paragraph then reports the work that was done, honestly, including what was not done (no inter-coder reliability was computed; the corpus is synthetic; the analysis is illustrative).

The three acts are deliberate. They line up with the three structural complaints Deterding & Waters make about the field: that coding does not scale, that negative cases are honored more in citation than in practice, and that methods sections are opaque. Each skill is a direct response to one of those complaints.

## A note on framing

The project is built for a specific audience reality: Mary Waters is herself a workshop attendee. The skills are therefore conservative about what they claim. They do not "discover themes." They do not replace the immersive first read of the transcripts. They do not propose that LLMs change what qualitative analysis is — only that the moves Deterding & Waters argue the field should be making become tractable at scales where, until now, they were possible only in citation.

The deeper argument is laid out in two companion documents: [tradition.md](tradition.md) situates flexible coding in the longer history of qualitative methods debates, and [affordance.md](affordance.md) walks through what LLMs change about that history and what they do not.

---

*Interview coding overview: [Summary](summary.md) · [Tradition](tradition.md) · [Affordance](affordance.md). Back to the [project landing page](../index.md).*
