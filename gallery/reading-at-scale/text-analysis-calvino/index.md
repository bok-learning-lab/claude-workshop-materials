---
layout: default
title: "Text analysis — Calvino's Memos"
section: activities
---

# The Memos, by the numbers — Calvino's *Six Memos for the Next Millennium*

*One of five projects in [Reading at Scale](../). Deterministic textual analysis + semantic-embedding visualization + a live draft composer for a student writing the unwritten sixth memo.*

A worked example of **deterministic textual analysis** + **2D semantic-embedding visualization** of a literary corpus, paired with a **draft composer** that runs the same analyses on a student's prose in real time. The corpus is Italo Calvino's five *Six Memos for the Next Millennium* — **Lightness, Quickness, Exactitude, Visibility, Multiplicity** — and the pedagogical hook is that *there is no sixth*.

> **Live page:** <https://a-project-on-calvino-interface-3kqu.vercel.app/memos> — paste a draft into the composer at the bottom and watch the dashed bars appear in every chart, and the black dots populate the embedding map.
>
> **Source repo:** <https://github.com/bok-learning-lab/a-project-on-calvino>
>
> **Workshop example:** [`claude-code-20260604/examples/text-analysis-and-datavis/`](https://github.com/bok-learning-lab/claude-code-20260604/tree/main/examples/text-analysis-and-datavis) — the deterministic-analysis operations, the OCR pipeline, and the embedding-map approach as a portable folder.
>
> **The unwritten sixth memo.** Calvino died in September 1985 while drafting the lecture on **Consistency**. The page treats this as a pedagogical opportunity — the student writes the sixth memo themselves, and the same measurements that characterize Calvino's five extant lectures characterize the student's draft, side by side.

## What it is

A single page (a Vite + React app, despite the rest of the repo being Next.js) that does three distinct things in parallel:

- **Eight hand-rolled SVG bar charts** computed live in the browser from the cleaned memo markdown. Word count, oral delivery time, lexical density, quoted-material ratio, title-word frequency, first-person density, average sentence length, plus a small-multiples view of sentence-length histograms. No chart library.
- **A 2D embedding map** — every paragraph of all five memos was embedded with `gemini-embedding-001` and UMAP-projected to 2D *offline*. The browser renders that as an SVG scatter. When the student writes paragraphs in the composer, their paragraphs are embedded *live* (via a server-side `/api/embed` Gemini proxy) and projected into the same 2D space via k-NN weighted centroid.
- **A draft composer** — a textarea, plus a "load sample" link, plus live stats, plus three reader panels (top keywords, top "I + verb" phrases, title-word echoes). The student writes their own sixth memo; the page measures it the same way it measures Calvino's.

Plus, upstream of all that: an **LLM-mediated OCR pipeline** that produced the cleaned per-memo markdown from a scanned 2-up PDF of the Mondadori edition.

## The three moves

### Move 1 — Two complementary analyses, side by side

The page runs *both* deterministic stats *and* semantic embedding on the same corpus. These answer different questions:

- The **deterministic stats** answer *do you sound like the genre Calvino was writing in?* Numerical, reproducible, length-sensitive. Word count, oral time, sentence length, lexical density, quoted-material ratio, first-person density. A student can verify any of these by hand.
- The **embedding map** answers *do you engage Calvino's actual themes?* Semantic, geometric, approximate. A draft about *crystals and clocks* lands in the *Exactitude* cluster; a draft about *transformations and many simultaneous stories* lands in *Multiplicity*. The map doesn't tell you *why* — it places a dot.

Either alone would be misleading. The deterministic stats can be gamed (write 8,000 words of slop with the right sentence-length distribution); the embedding map can be gamed (write a paragraph that sounds *like* Calvino-Exactitude but is incoherent). Both together is the discipline — a draft has to *sound right and mean something*. The student looks at both. **No combined score.**

### Move 2 — Offline corpus embedding, live student-draft projection

The architecturally interesting bit. Embedding Calvino's ~600 paragraphs at request time would burn 600 API calls per page load. Embedding *only* the student's paragraphs live is the asymmetry that makes the page possible:

- The Calvino corpus is embedded **once, offline**, by `build-embeddings.py`. The output (`embeddings.json`, ~5 MB) ships in the JS bundle. Both 2D coordinates *and* the original 256-dim vectors travel along — the vectors are needed for the live k-NN.
- The student's paragraphs are embedded **live, server-side**, one at a time, via a Vercel serverless function (`embed-api-proxy.js`). The API key stays in `process.env`; the browser never sees it.
- The student's vector is projected into the 2D space via **k-NN weighted centroid** over the Calvino points. UMAP doesn't have a deterministic `transform(new_point)`; k-NN is the right approximation. Ships in the browser. Fast.

The k-NN projection is honest about itself: a user dot lands roughly where UMAP would have placed it, weighted toward semantic neighbors. The map doesn't promise more than it can deliver.

### Move 3 — An LLM-mediated OCR pipeline as a first-class part of the substance

The cleaned markdown of Calvino's memos is not a found object — it was produced by a substantial pipeline. *Three* OCR engines run on each scanned page:

- **Tesseract** for the baseline.
- **Claude vision** for Italian typography.
- **Gemini vision** for footnotes and headers.

A reconciler aligns the three transcripts token by token; for every token where the engines disagree, **a Claude-vision judge gets the image crop plus the three candidates and picks the right answer** (or proposes a different one). A Gemini sweep flags suspect passages for human review.

This is the **cheap-vote-where-possible, expensive-judge-where-needed** pattern. The pipeline is **idempotent per page**: re-running skips pages already done. The OCR's outputs are reviewed by a human (`review-needed.md`) before final acceptance — the model is advisory, not authoritative.

This matters for the example because it shows that the *clean inputs* to a literary tool are not free. Getting from a scanned book to "the cleaned markdown of Calvino's five memos" is itself a substantial LLM-mediated operation — and it has its own pattern that ports to other scanned books.

## How it was built

**Phase 1 — The OCR pipeline.** The Mondadori edition of *Lezioni americane* (Italian title; English: *Six Memos for the Next Millennium*) was scanned in 2-up form. 134 page-spreads. The first instinct was a single OCR pass; the output had ~98% accuracy, which sounds good until you notice that the 2% errors were systematically the italicized book titles, the accented Italian, the long dashes that mark interpolations, the footnote markers. All the editorially-important stuff. So the pipeline grew to three independent OCR passes plus a vote, plus a Claude judge for disagreements, plus a Gemini sweep for QA.

**Phase 2 — The measurements.** With the cleaned corpus in hand, the question became: *what is worth measuring about Calvino's lectures?* The first measurement was word count — obvious, useful as a calibration tool for student drafts. Then oral delivery time (because these are lectures, not paragraphs — Calvino was preparing the Norton Lectures at Harvard). Then sentence-length distribution (because that's the *shape* of Calvino's prose at a glance). Each measurement was chosen because *it would teach the student something specific about the genre when they saw their own bar next to Calvino's*.

**Phase 3 — The embedding map.** The first attempt rendered the embedding map at request time, which was unacceptable. The second attempt embedded offline but tried to run UMAP in the browser for new points — UMAP doesn't support that. The third attempt — embed offline, project user points via k-NN weighted centroid client-side — is what shipped.

**Phase 4 — The hand-rolled SVG charts.** No chart library. Each chart is ~30 lines of JSX rendering `<rect>` for bars + `<text>` for labels. The decision to skip libraries was about *visual consistency with the embedding map* — the same SVG aesthetic carries through the page, the same dashed-black convention marks the student in every visualization.

**Phase 5 — The composer + the live re-analysis.** The textarea hooks into `useState`; every keystroke recomputes the analysis (debounced for the embedding API call only). The four-stat strip below the textarea (words, sentences, avg sentence, read-aloud time) gives instant feedback as the student types.

**Phase 6 — Deploy.** Vercel, project root at `apps/mw-project-002/`. `GEMINI_API_KEY` in the project's environment variables.

## What this approach taught us

The two analyses are stronger together than either alone. A student who passes one but fails the other has learned something specific: *my prose has Calvino-shaped surface features but lands in the wrong corner of the semantic map* (or vice versa). The deterministic stats are reproducible by hand; the embedding map is approximate but semantic; the page invites the student to triangulate.

Hand-rolled SVG is the right call when the visual aesthetic is part of the artifact. The page reads as a piece of academic-print typography (stone-50 background, serif headings, narrow column width, no chrome). A chart library would have produced charts that *looked like a chart library*. Hand-rolling let the charts inherit the page's visual language.

The k-NN projection's *approximate* nature is itself pedagogical. The map doesn't say *"you are precisely here"* — it says *"here, approximately, based on these eight neighbors."* A student who treats the dot as gospel has misunderstood; a student who reads the placement as *one signal among several* has the right relationship.

## Notes for adapting

The pattern is **a literary corpus + deterministic-stats analysis + offline-embedding 2D map + live-student-draft projection through both**, plus the upstream **LLM-mediated OCR pipeline** as a first-class part of the substance. Each piece is independently reusable; together they're a full "by-the-numbers" page for an author's corpus.

The pattern is particularly apt for **authors with finite canonical corpora** — bodies of work small enough to embed exhaustively, and stylistically distinctive enough that deterministic stats reveal voice. Domains where it ports almost verbatim:

- **Any single-author corpus a course teaches deeply.** Joyce, Woolf, Borges, Sebald — corpora rich enough to embed meaningfully and stylistically distinctive enough that deterministic stats reveal voice. Replace `inputs/memos/` with the author's texts; run `build-embeddings.py`; update the deterministic-text-analysis formulas as needed.
- **A philosophical school's primary texts.** Wittgenstein's *Investigations* by remark, Heidegger's *Being and Time* by section, the Pre-Socratic fragments. Students write their own remark / section / fragment; the map shows where they land.
- **A journal or magazine's writing register.** *n+1*'s essays, the *London Review*, *Critical Inquiry*. Each periodical has measurable house-style features; students writing a submission can calibrate against the corpus.
- **A working scholar's own corpus.** A graduate student building their voice can embed their own published papers and see where their drafts land.
- **A historical author's complete works for digital-humanities study.** Combined with the OCR pipeline, this is also a viable approach to corpora that exist only as scans (older critical editions, out-of-print books, pre-Unicode source texts in non-Roman scripts).

## Alignment constraints (the hard ones)

- **No grade, no overall score.** Every chart shows one dimension. The map shows another. The student looks at them all.
- **Two analyses, both necessary.** Either alone is gameable. Both together is the discipline.
- **Embed the canonical corpus offline; embed user inputs live.** The asymmetry is the architecture.
- **Same embedding model on both sides.** Same model, same task type, same dimensionality, same normalization. Without this, cosine distances are meaningless.
- **k-NN weighted centroid for live projection.** UMAP doesn't have a deterministic transform; running it per request is wrong.
- **Hand-rolled SVG.** No chart library. The visual aesthetic of the page is part of the page.
- **The OCR pipeline's review queue is the trust contract.** Re-OCR'd suspect passages get human review before acceptance. The model is advisory, not authoritative.
- **Three engines, one judge.** For OCR (and other reconciliation problems): cheap-vote-where-possible, expensive-judge-where-needed.
- **Server-side API keys.** `GEMINI_API_KEY` in `process.env`. The browser never sees it.
- **One dimension per chart.** Resist combining metrics. The student should leave the page able to name what each measurement counted.
