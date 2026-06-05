---
layout: default
title: "Research helper"
section: activities
---

# Research helper

A small Claude Code project that turns a folder of research papers — mostly arXiv-style PDFs — into a folder of self-contained HTML summaries, each combining a faithful neutral summary of the paper with a pedagogical "twist" that connects its findings to an explicit research agenda. Inputs in `inputs/`. One prompt in `operations/`. One generated HTML per paper plus an `index.html` hub in `outputs/`.

This is the smallest of the day-4 example projects. There is no overview folder, no plan document, no parallel-build pattern. The whole project is one careful prompt applied to a corpus of source papers — and the discipline it enforces about not inflating a paper's relevance to the agenda.

**Also exists as a hands-on activity.** The examples page you are reading documents the full pattern; the hands-on exercise version lives at [/activities/research-helper/](../../../activities/research-helper/) and is the version designed for you to run yourself during the workshop.

Source repo: [github.com/bok-learning-lab/claude-code-20260604/examples/research-helper](https://github.com/bok-learning-lab/claude-code-20260604/tree/main/examples/research-helper)

---

## What it is

The project has one prompt and one expected output shape.

The prompt at `operations/01-generate-research-summary-prompt.md` asks Claude to read each paper fully (all pages, for PDFs) and produce, for each one, a single self-contained HTML file written to `outputs/<NN>_<slug>.html` — with the numeric filename prefix preserved from the input file so source and summary stay traceable. Each summary contains five visually distinct sections:

1. **Header** — title, authors, year, source (arXiv ID/link if known), and a one-sentence plain-language gloss.
2. **Neutral summary** — what the paper claims, the method, the key evidence, and the stated limitations. Faithful to the paper on its own terms. No pedagogy here.
3. **Key findings** — a short bulleted list a busy reader can scan.
4. **The twist: "Implications for teaching, learning & research with LLM harnesses"** — an honest bridge from this paper's actual findings to how Claude Code and similar harnesses should (or should not) be used in education and research. Speculative connections are marked as speculative. If the paper's relevance to the agenda is limited, the summary says so plainly.
5. **Footer** — citation line and a back-link to `index.html`.

The `outputs/index.html` is the hub: it states the research agenda at the top, then lists every article (numeric ID, title, one-line gloss) with links to each summary. HTML files are self-contained — inline CSS, no external assets — so the outputs are portable and stay readable offline or in restrictive browser environments.

The research agenda that anchors the "twist" pass:

> Helping instructors and students understand how to use LLM harnesses like Claude Code for teaching, learning, and research.

The current corpus is four papers on context-length and long-context attention in LLMs — `01_context-rot_hong-troynikov-huber_2025.md`, `02_lost-in-the-middle_liu_2024.pdf`, `03_context-length-alone-hurts_du_2025.pdf`, `14_fully-utilize-context_an_2024.pdf` — each with an HTML summary in `outputs/`. The numeric prefixes (`01`, `02`, `03`, `14`) carry forward from the inputs.

---

## The two-pass discipline

The structural move that makes this project work is the **two-pass structure**: neutral summary first, twist second, visually separated in the final HTML so a reader can consume the summary without the editorial layer.

**Faithfulness over relevance.** The neutral summary is written first, as its own pass, before the pedagogical bridge is written. The framing of the agenda must not distort the factual summary — which means structuring the prompt so the summary and the twist are *separate passes*, not interleaved, and visually distinct sections in the final HTML so a reader can consume the summary without the editorial layer.

**The twist as honest bridge to a research agenda.** The "twist" is not a sales pitch for the paper's relevance. It is an explicit, named bridge from what the paper actually shows to a stated research agenda — with the relationship marked honestly. Where the bridge is solid, say so. Where it is speculative, say so and label it speculative. Where the paper does not support the bridge at all, say *that* — "this does not transfer" is a valid answer the prompt is designed to make available.

**Honest stretches.** A precise "limited but real" connection is more useful than an enthusiastic stretch. The prompt explicitly tells Claude to say "this does not transfer" when that is the truthful reading. The temptation to inflate a paper's relevance to the project's agenda is real and is the primary failure mode the prompt is designed to guard against.

**Mark speculative as speculative.** Where the twist makes a claim the paper does not directly support — a forward-looking conjecture, an analogy to a domain the paper did not study — the prompt requires it to be labeled. The reader can then weigh the speculation as speculation, not as evidence from the source.

### The corpus shape

The corpus is structurally simple and structurally important: a folder of PDFs in, a folder of one HTML per paper plus a single `index.html` hub out. The numeric prefix on each input (`01_...`, `02_...`) is preserved on the corresponding output (`01_....html`, `02_....html`). The hub `index.html` becomes a single navigable list, with the research agenda stated at the top. Regenerating overwrites in place rather than creating parallel copies — so the hub remains the canonical view of the corpus, not a stack of versions.

### Things this approach taught us

The hardest part of this kind of project is not getting the LLM to produce a summary. It is getting the LLM to produce a summary that does not quietly conform every paper to the project's agenda. The two-pass structure — neutral first, twist second, visually separated — is the smallest move that keeps the two readings honest. If the structure collapses into a single pass, the agenda leaks into the summary and the artifact becomes harder to trust.

The other lesson is that the simplest projects are not always the smallest. The discipline this prompt enforces — faithfulness, honest stretches, separated passes — is the same discipline a research synthesist would apply to the same task at much larger scale. The skill is the prompt; the prompt is portable.

---

## Notes for adapting

The pattern is portable to any domain where the substantive work is:

1. **A corpus of documents the practitioner has not yet read carefully** — and a research or design agenda the documents may or may not bear on. The LLM produces structured summaries; the practitioner reads the summaries to decide which documents to read in full.
2. **Two distinct intellectual tasks** that must not contaminate each other — a neutral description of the source and an interpretive layer relating it to a particular agenda. The structural move is to separate them in the prompt and in the output, not to optimize them into a single pass.
3. **A consistent output shape** that makes the artifacts navigable in aggregate — preserved filenames, an index hub, visually distinct sections, portable HTML.

Domains where the same shape applies almost without modification:

- **Course-readings triage.** Drop a folder of candidate readings; get back HTML summaries with an explicit "how this connects to the course's learning outcomes" pass. The neutral summary is what a TA might produce; the twist is the instructor's judgment about fit.
- **Literature review for a grant proposal or dissertation chapter.** The research agenda is the proposal's argument; the twist is the explicit bridge between each cited paper and the argument it is being asked to support. Forces honest accounting of weak citations.
- **Policy briefs against a stated policy goal.** Each source document gets a neutral description and a separate "implications for goal X" pass. Goal-driven distortion is contained because the layers are visually separate.
- **Competitive analysis** of products, papers, or institutions against a strategic agenda. Same two-pass structure; same portability constraints.
- **Source evaluation in journalism or investigation.** The neutral pass describes the document; the editorial pass connects it to the developing story. Reviewers can audit each layer independently.

### Alignment constraints that survive translation

- **Faithfulness over relevance.** Never overstate how much a source supports the active agenda. Mark speculative bridges as speculative. "This does not transfer" is a valid answer.
- **Two passes, visually separate.** The neutral summary and the interpretive layer must be writable and readable independently. A reader who only wants the summary can ignore the editorial layer.
- **Self-contained HTML.** Inline `<style>`, no external assets. Portability is part of the contract.
- **Preserve traceability.** Numeric prefixes from inputs carry to outputs. Overwrite in place when regenerating.
- **Read the whole thing.** For PDFs, all pages. Skimming defeats the project.
