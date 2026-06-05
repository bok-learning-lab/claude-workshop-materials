---
layout: default
title: "Reading at Scale"
section: gallery
---

# Reading at Scale

These projects share one move: they ask Claude to be a *close reader at corpus scale*. The corpus is too large to read by hand — 538 Bob Dylan songs, the 28,500 lines of *Finnegans Wake*, fourteen translations of the *Odyssey*, a stack of qualitative interview transcripts, Calvino's five completed *Memos*. A literal-string search misses too much: it finds possessives but not enjambed pairs, direct spellings but not puns and avatars, the surface vocabulary but not the underlying reasoning. The instruction at the heart of each project is the same: **close reading, at corpus scale, by an LLM that has been told to read like a close reader and refuse to grep.**

The pattern is a corpus of natural-language documents + a close-reading instruction + a strict output schema with verbatim receipts. The single instruction *"do not grep or use regex"* changes the kind of work the model does. Without it, the model falls back to pattern-matching at the surface; with it, the model reads each line for sense. Every finding is paired with the exact line it appears in — the quote is the receipt. A scholar can audit the output without re-reading the corpus.

The discipline these projects enforce is that **half the work is naming what *not* to count**. Bob Dylan's lyrics contain dozens of words ("frost," "pound," "swift") that coincide with writers' surnames; the exclusion list is what separates a usable list from an impressive-looking pile of junk. *Finnegans Wake* hides Fionn mac Cumhaill in puns and landscape metaphors that any keyword filter would dismiss; dropping search entirely and shrinking the chunks until one agent can read every word is what surfaces the references. Mary Waters' flexible coding refuses the "LLM discovers themes" framing — the LLM applies the researcher's concepts at scale, surfacing candidates for human review. Across all of these, the model produces structured output (JSON, markdown, line references) that downstream tools and human readers can use.

## Projects in this category

- **[Smart text search — Bob Dylan](smart-text-search-dylan/)** — one prompt, 538 songs, asked to name every writer mentioned in any lyric. Surfaced 14 named writers across 10 songs (Woody Guthrie, Tom Paine, Ezra Pound, T.S. Eliot, Verlaine and Rimbaud, Nietzsche, Wilhelm Reich, F. Scott Fitzgerald) with the verbatim line each appears in.
- **[Smart text search — *Finnegans Wake*](smart-text-search-joyce/)** — built for Prof. Natasha Sumner's *Heroes of the Gael: A History of Fionn and the Fianna* (Harvard, Feb. 2026). 48 close readers, each judging a ~600-line slice, surfaced 277 references to Fionn mac Cumhaill across the puns, misspellings, avatars, and landscape allusions that defeat keyword search.
- **[Text analysis — Calvino's *Memos*](text-analysis-calvino/)** — Italo Calvino's *Six Memos for the Next Millennium*, by the numbers: eight hand-rolled SVG bar charts, a 2D semantic-embedding map, and a draft composer that runs the same analyses on a student's prose live. The student writes the unwritten sixth memo (Consistency, the one Calvino died before drafting) and sees their prose plotted in Calvino's space.
- **[Interview coding (Mary Waters' flexible coding)]({{ site.baseurl }}/gallery/day-4/project-overviews/interview-coding/summary/)** — three Claude Code skills (`/index-transcript`, `/find-negative-cases`, `/methods-paragraph`) implementing Deterding & Waters' three-stage workflow. Built so a senior methodologist could see what the LLM is and is not doing.
- **[Texts and translation]({{ site.baseurl }}/gallery/day-4/project-overviews/texts-and-translation-v0/summary/)** — the *Odyssey* in fourteen translations (Greek, Latin, Spanish, French, Swedish, eight English) plus Jagannātha Paṇḍitarāja's seventeenth-century Sanskrit *Rasagaṅgādhara*, with skills for comparative-translation views and candidate-identification of *alaṃkāras*.

## When to use this pattern

Use this pattern when the corpus is too large for one human read but the move you need is genuinely a reading — not a count, not a regex, but a judgment about what each passage says. The skill applies any time the thing you want surfaced is named, quoted, paraphrased, or alluded to in the source, but where a literal-string search would miss too much (because of possessives, enjambments, puns, misspellings, foreign-language cognates, or oblique reference). It applies whenever the exclusion list is half the work — naming what *not* to count — and whenever a verbatim-quote requirement is the right audit trail.

## A note on what this pattern produces

The output of each project is **structured**: JSON with named fields per finding (line reference, matched text, reasoning, confidence, variant type), plus a prose writeup that does the interpretive work the JSON indexes. The structure is what makes the work auditable (every finding has a quote a human can verify) and what makes it composable (downstream tools — a second-pass deeper read, a visualization, a methods paragraph — can read the JSON without re-running the close reading). The prose is where the reading happens; the JSON is the substrate.
