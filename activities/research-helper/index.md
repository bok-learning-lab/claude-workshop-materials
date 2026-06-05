---
layout: default
title: "Research Helper"
section: activities
---

# Research Helper

<div class="page-lead">Ingest a set of research papers, produce one structured HTML summary per paper, then generate an index that links them all. The move: give Claude a reading list and a research agenda, and have it do the first-pass synthesis — faithfully, with an explicit "pedagogical twist" section kept separate from the neutral summary.</div>

## The project

The workshop version of this project was built around a specific research question: *how should instructors and students use LLM harnesses like Claude Code for teaching, learning, and research?* Four papers on context window behavior were chosen as the corpus — a topic where the findings bear directly on how Claude Code itself should be used.

The [`CLAUDE.md`]({{ site.baseurl }}/activities/research-helper/CLAUDE.md) for this project defines the entire workflow: how to summarize faithfully, how to write the pedagogical bridge as a second pass (so the agenda doesn't distort the neutral summary), and what constraints the output HTML must meet.

> **A note on the move.** The instinct this activity sharpens has a long pedigree in literary studies: Franco Moretti's *distant reading* asked what we learn when we treat a corpus as a measurable shape rather than reading each text in full. The research helper is hybrid — it does *close* read each paper (faithfully, on its own terms), and *then* reports back as a body. The two-pass discipline (neutral summary → pedagogical twist) is what keeps the hybrid honest. For the full pattern with prompts, source repos, and adapting notes, see the gallery entry: [Source → Teaching Materials · Research helper]({{ site.baseurl }}/gallery/source-to-teaching/research-helper/).

## The corpus

Four papers on how LLMs handle long contexts — directly relevant to anyone using Claude Code for document-heavy work:

| # | Paper | Input |
|---|---|---|
| 01 | Hong, Troynikov & Huber (2025) — *Context rot and what causes it* | [`01_context-rot...`](https://github.com/bok-learning-lab/claude-code-20260519/blob/main/projects/06_research_helper/inputs/01_context-rot_hong-troynikov-huber_2025.md) |
| 02 | Liu et al. (2024) — *Lost in the middle* | [`02_lost-in-the-middle...`](https://github.com/bok-learning-lab/claude-code-20260519/blob/main/projects/06_research_helper/inputs/02_lost-in-the-middle_liu_2024.pdf) |
| 03 | Du et al. (2025) — *Context length alone hurts* | [`03_context-length-alone-hurts...`](https://github.com/bok-learning-lab/claude-code-20260519/blob/main/projects/06_research_helper/inputs/03_context-length-alone-hurts_du_2025.pdf) |
| 14 | An et al. (2024) — *Fully utilize context* | [`14_fully-utilize-context...`](https://github.com/bok-learning-lab/claude-code-20260519/blob/main/projects/06_research_helper/inputs/14_fully-utilize-context_an_2024.pdf) |

[Browse all inputs →](https://github.com/bok-learning-lab/claude-code-20260519/tree/main/projects/06_research_helper/inputs)

## The prompt

One prompt drives the whole operation — [`01-generate-research-summary-prompt.md`](https://github.com/bok-learning-lab/claude-code-20260519/blob/main/projects/06_research_helper/operations-tools-commands/01-generate-research-summary-prompt.md). It instructs Claude to:

1. Read each paper fully (all pages for PDFs)
2. Write a **neutral summary** — claims, method, evidence, limitations — faithful to the paper on its own terms
3. Write **"the twist"** as a separate second pass — an honest bridge to the research agenda. Mark speculative connections as speculative; say "limited but real" when that's the truthful reading

The two-pass structure is the key design decision. Writing the neutral summary first prevents the research agenda from contaminating the factual account.

## The outputs

The project generated one self-contained HTML file per paper plus a hub index — all with inline CSS, no external dependencies:

- **[Output index]({{ site.baseurl }}/activities/research-helper/outputs/index.html)** — the hub, with the research agenda stated at top and one-line glosses linking to each summary
- [Context rot summary]({{ site.baseurl }}/activities/research-helper/outputs/01_context-rot_hong-troynikov-huber_2025.html)
- [Lost in the middle summary]({{ site.baseurl }}/activities/research-helper/outputs/02_lost-in-the-middle_liu_2024.html)
- [Context length alone hurts summary]({{ site.baseurl }}/activities/research-helper/outputs/03_context-length-alone-hurts_du_2025.html)
- [Fully utilize context summary]({{ site.baseurl }}/activities/research-helper/outputs/14_fully-utilize-context_an_2024.html)

## To run it yourself

1. Clone or copy the project folder. Add your own papers to `inputs/` — PDFs or markdown, with numeric prefixes (`01_`, `02_`, …).
2. Open Claude Code in the project. The `CLAUDE.md` loads automatically and sets the agenda.
3. Paste the prompt from `operations-tools-commands/` and send. Claude reads every file in `inputs/` and writes to `outputs/`.
4. Replace the research agenda in `CLAUDE.md` with your own question. The structure works for any domain.
