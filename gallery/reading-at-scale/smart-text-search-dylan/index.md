---
layout: default
title: "Smart text search — Bob Dylan"
section: gallery
---

# Smart text search — writers named in Bob Dylan's lyrics

*One of five projects in [Reading at Scale](../). A worked example of using Claude as a close reader at corpus scale.*

A worked example of using Claude as a **close reader at scale**. The project hands Claude 538 Bob Dylan songs and asks: name every writer mentioned in any lyric — poets, novelists, playwrights, philosophers — quoting the line each name appears in. The pass turned up **14 named writers across 10 songs**, ranging from Woody Guthrie and Tom Paine to Ezra Pound, T.S. Eliot, F. Scott Fitzgerald, Nietzsche and Wilhelm Reich, Verlaine and Rimbaud. The output is one aggregated JSON file and a prose writeup that pairs each writer with the surrounding verse and a brief gloss on why the writer is being named.

The point of the project is not the Dylan corpus specifically. It is the move: **close reading, at corpus scale, by an LLM that has been told to read like a close reader and refuse to grep.**

## What it is

One prompt, one corpus, two outputs.

- **The corpus**:
  - `bob_dylan_lyrics.json` — all songs, including variant takes and duplicates.
  - `bob_dylan_lyrics_unique.json` — the deduplicated list (one record per song), each carrying `name`, `first_album`, `first_album_year`, `text`.

- **The prompt** at `operations/find-writers-prompt.md` — designed to be invoked in batches across the 538-song list. It tells Claude to read each song's full lyric *like a close reader*, never to grep or regex, to catch obscure writers as well as famous ones, to list **every** writer when a line names two or more (the **"Verlaine's and Rimbaud's" rule**), and to refuse to invent matches. Writers only — exclude actors, athletes, politicians (unless cited as authors), saints, fictional characters, place names, and common words that merely coincide with a surname ("frost," "pound," "swift"). Writes findings as JSON to `outputs/batch_NN.json`.

- **The outputs**:
  - `_aggregated.json` — every match across the corpus, song-by-song, with the exact line each writer was named in.
  - `writers-in-dylan.md` — the prose writeup. For each writer: the song, the surrounding verse, and a stab at *why* the writer is being named in that song. Ordered by release year.

The prose writeup is the artifact the project is really after. The JSON is the substrate; the markdown is the reading.

## The move worth noticing

The instruction *"carefully READ (do not grep or use regex) these Bob Dylan lyrics"* is the whole skill. A literal-string search across the corpus would miss:

- **Possessives** — "Fitzgerald's books" doesn't match a search for "Fitzgerald" delimited by whitespace.
- **Title-only references** — *Bound for Glory* names Woody Guthrie without using his name.
- **Enjambed pairs** — "Nietzsche and Wilhelm Reich" is one line containing two writers; the prompt's "Verlaine's and Rimbaud's" rule makes sure both get logged.
- **Obliquely named writers** — Tom Paine appears as both historical figure and author of *Common Sense*.

It would also surface false positives — Robert Frost the writer vs. "frost" the weather, Robert Lowell vs. "lowell" as a place name. Telling the LLM to read like a close reader, with explicit exclusions and verbatim quoting, is what produces a list a literary scholar can actually use.

The corollary discipline: **every writer named has to come with the exact line they appear in. The quote is the receipt.** A reader can audit the output without re-reading 538 songs.

## The exclusion rules

Half the work of the prompt is naming what *not* to count:

- No actors, no athletes, no politicians (unless cited as authors).
- No saints, no fictional characters.
- No place names (Lowell, Massachusetts is not Robert Lowell).
- No surname-coincidence words: "frost," "pound," "swift," etc. used as common nouns or verbs do not count.
- No invented matches. Every finding must include the verbatim line that names the writer; a fabricated writer cannot have a real line to quote.

Without these, the noise would swamp the signal. The exclusions are what make the output usable.

## How it was built

The build is a single careful prompt applied to the corpus in batches. The discipline is in the prompt's hedges, not in any external scaffolding:

- **One pass per song, fully read.** The prompt forbids grep and regex explicitly — the LLM is doing the work an undergraduate research assistant would do.
- **Batched.** The prompt takes `{START}` and `{END}` indices so the 538-song corpus can be split into batches a single Claude session can handle comfortably. Each batch writes one `batch_NN.json` file. A separate aggregation step concatenates them into `_aggregated.json`.
- **Strict shape.** Each finding is `{"song", "index", "writers": [{"name", "quote"}]}` — the song-by-song nesting preserves provenance, and the verbatim quote on every entry makes spot-checking trivial.
- **Post-pass prose.** After the JSON exists, a second pass produces `outputs/writers-in-dylan.md` — each writer gets a song, a quote, and a gloss on *why* they're being named. The JSON is the index; the prose is the interpretation.

## What this approach taught us

LLMs are good at close reading when you make it clear that close reading is what you want. The single instruction *"do not grep or use regex"* changes the kind of work the model does. Without it, the model tends to fall back to pattern-matching at the surface; with it, the model reads the line for sense.

Verbatim quoting is the audit trail. A reader who suspects an LLM has hallucinated a citation can verify by control-F on the corpus. If the quote is there, the writer is there. If the quote is not, the writer is not — no further argument needed.

The strict exclusion list matters. Without explicit rules about actors, place names, and common words, the model produces a long list that looks impressive and is half junk.

## Notes for adapting

The pattern is **a corpus of natural-language documents + a close-reading instruction + a strict output schema with verbatim receipts**. It applies to any domain where:

1. The thing you want surfaced is named, quoted, or referenced in the source — not implied or derived.
2. A literal-string search would miss too much — possessives, enjambments, paraphrases, oblique references.
3. The exclusion list is half the work.

Domains where the same shape applies almost without modification:

- **Citation surfacing in an unstructured corpus** — find every named work referenced in a folder of essays, interview transcripts, or syllabi.
- **Quote-and-cite extraction from primary sources** — every place a particular concept ("legitimate authority," "rasa," "intentionality") is named or invoked, with the exact line and a brief gloss.
- **Mention detection in oral-history transcripts** — every person named across a corpus of interviews, with the verbatim line, for prosopography or social-network construction.
- **Symbol or motif tracking across a literary corpus** — every appearance of "wine," "river," "wing" across a poet's collected works.
- **Compliance / disclosure auditing** — every place a named individual, organization, or competitor is mentioned in a folder of memos.

The pattern in all of these is the same: a corpus, a close-reading instruction (with an explicit no-grep clause), an exclusion list that does the noise-suppression work, and a verbatim-quote requirement that makes every finding auditable.
