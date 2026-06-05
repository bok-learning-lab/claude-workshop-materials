---
layout: default
title: "Smart text search — Finnegans Wake"
section: activities
---

# Finding Finn in *Finnegans Wake*

*One of five projects in [Reading at Scale](../). Built to support Prof. Natasha Sumner's research on the Fenian tradition.*

## The research question behind the demo

Prof. Natasha Sumner's *Heroes of the Gael: A History of Fionn and the Fianna* (Harvard, Feb. 2026) traces stories of **Fionn mac Cumhaill** — Finn McCool — and his warrior band the Fianna across 1,400 years of Gaelic oral and written tradition. One late, strange, and very dense node in that tradition is James Joyce's *Finnegans Wake* (1939), a book whose very title puns on **Finn-again** — the hero who falls and rises.

So here is a concrete research task in Sumner's territory: **Where does Fionn actually appear in *Finnegans Wake*?**

That turns out to be a surprisingly hard question, and the reason it's hard is exactly what makes it a good teaching example.

## Why you can't just search for "Finn"

If you load the 28,000-line text into a word processor and search for `Finn`, you will find a few dozen hits and miss most of the book. Joyce almost never names his hero plainly. Fionn arrives instead as:

- **Misspellings and foreign-language puns** — `Fjorgn Camhelsson` (Fjorgn ≈ Fionn, Camhelsson ≈ mac Cumhaill), `Tulko MacHooley`, `Finnfannfawners`.
- **Avatars and epithets** — the hod-carrier Tim Finnegan of the ballad, the giant `Bygmester`, "the flawhoolagh, the grasping one, the kindler of paschal fire."
- **The body-as-landscape** — Finn lies asleep under Dublin: his head is the Hill of Howth ("the Head where he sat in state as the Rump"), his body the terrain measured "in carucates," the Liffey running past him.
- **Mythic attributes with no letters in common with his name** — the Salmon of Knowledge, the thumb of wisdom ("his first lapapple"), the phoenix fall-and-rise ("the phoenix be his pyre, the cineres his sire").

A keyword search — a *concordance* — can only find strings you already know to type. It is blind to the pun, the misspelling, the metaphor, and the structural allusion. But those are **where Fionn actually lives in this book.** Finding them is an act of *reading and interpretation*, not string-matching.

That is the pedagogical pivot of this example: **the task requires literary judgment, and that is precisely what a language model can bring to it that `grep` cannot.**

## The method: many close readers, each judging, then pooled

Rather than one search pass, the project runs the text past **dozens of independent close readers** — Claude subagents — and has each one *read every word* of a small slice and decide, using its knowledge of Joyce and of the Fenian tradition, whether a passage gestures at Fionn. The design went through three deliberate refinements, and the refinements are part of the lesson:

1. **First instinct — split and grep.** Eight large chunks, each agent using keyword search as a first net. *Problem:* this only resurfaces strings containing the seed letters. It misses the puns. Search alone defeats the purpose.

2. **Read, don't just match.** Re-emphasize that each agent should *judge* candidates with its Joyce knowledge, using search only as a starting hint.

3. **Drop search entirely; shrink the chunks.** Re-split into ~600-line pieces — **48 chunks** — small enough that a single agent can genuinely read the whole slice closely, word by word, the way a scholar would. No keyword filter stands between the reader and the text.

Each agent writes its findings to **its own JSON file** (`outputs/finn_chunk_NN.json`). Because the files are independent, the agents run in parallel and nothing collides. The 48 files are then **aggregated** into one master list.

```
inputs/finnegans_wake.md          the OCR'd full text (~28,500 lines)
operations/chunks/chunk_NN        48 ~600-line slices, each with a known line offset
outputs/finn_chunk_NN.json        one reader's annotated findings per slice
```

### What each finding records

Every hit is a small structured judgment, not just a location — and that structure is what makes the output *researchable*:

```json
{
  "global_line": 4991,
  "matched_text": "the phoenix be his pyre, the cineres his sire",
  "snippet": "...",
  "variant_type": "fall-resurrection",
  "reasoning": "Phoenix mythology directly parallels Finnegan's fall and
                resurrection; 'pyre' evokes the whiskey/fire that revives
                the corpse in the ballad",
  "confidence": "high"
}
```

Three fields do the scholarly work:

- **`variant_type`** — *how* Fionn appears: `direct-spelling`, `avatar-epithet`, `giant-landscape`, `mythic-attribute`, `fall-resurrection`. This is a coding scheme a literary scholar can argue with, refine, and build on.
- **`reasoning`** — the agent's *case* for the reading, in plain language. A researcher can read it and agree, disagree, or follow it up. The interpretation is on the table, not hidden.
- **`confidence`** — `high` / `medium` / `low`, so you can separate the obvious from the speculative and decide where to spend your own attention.

## What it found — 277 references

Across the 48 chunks the readers surfaced **277 references**, sorted into the coding scheme:

| variant_type | count |
| --- | --- |
| `direct-spelling` | 116 |
| `pun` | 40 |
| `giant-landscape` | 38 |
| `mythic-attribute` (salmon, Fianna, Diarmuid…) | 34 |
| `avatar-epithet` | 25 |
| `fall-resurrection` | 24 |

By confidence: **157 high · 82 medium · 38 low.**

A few representative hits the close reading caught — the kind a keyword search for "Finn" would never assemble together:

- *"Mister Finn, you're going to be Mister Finnagain!"* (L169) — the resurrection pun stated outright.
- *"Macool, Macool, orra whyi deed ye diie?"* (L214) — the wake-lament over the fallen hero.
- **Foon MacCrawl** / **Fing him aging** — garbled MacCool plus a buried "Finn again" in the closing pages.
- **salmonkelt** — the spent Salmon of Knowledge transferred onto Shem.
- the final cyclical *"Finn, again!"* (L28491), just before the book loops back to `riverrun`.

**A caveat worth stating plainly:** the per-chunk readers here were a smaller, faster model (Haiku) reading independently, so coverage of the most oblique puns is uneven. The high- and medium-confidence direct and avatar references are solid; the `low` puns are suggestive, not authoritative. A natural follow-up is a second pass with stronger models over the densest sections — the opening, the wake scene, and the closing loop — which is exactly the kind of targeted deepening the structured output makes easy.

## Why this is better than a word search

| Plain keyword search | This approach |
| --- | --- |
| Finds only strings you can spell in advance | Finds puns, misspellings, foreign cognates, metaphors |
| One hit = one location, no interpretation | Each hit carries a *reading*, a *category*, and a *confidence* |
| Blind to "Howth = Finn's head" | Catches structural/landscape allusions a reader would |
| Misses what it doesn't know to look for | Brings literary and mythological knowledge to bear |
| Fast but shallow | Parallelized across many readers, yet genuinely close |

The output is not a final answer. It is a **first-pass scholarly apparatus** — a categorized, reasoned, confidence-rated inventory that a researcher like Prof. Sumner can verify, prune, and extend. Claude does the exhausting part (reading all 28,500 lines closely and proposing readings); the scholar does the part that matters (judging which readings hold).

That division of labor — **machine does the tireless close reading at scale, human does the authoritative judgment** — is the model this example is meant to teach.

## How you'd run it yourself

The whole thing is a sequence of plain-English instructions to Claude Code:

1. *"The text is in `inputs/`. Split it into ~600-line chunks under `operations/chunks/`, and record each chunk's starting line number so we can map findings back to the original."*
2. *"Spawn one subagent per chunk. Each one reads every word — no keyword search — and judges whether each passage references Fionn / Finn MacCool / Finnegan, including puns, misspellings, avatars, and landscape allusions. Write findings to `outputs/finn_chunk_NN.json` with `variant_type`, `reasoning`, and `confidence`."*
3. *"When all chunks are done, aggregate the JSON files into one master list, sorted by line number."*

No coding required from the faculty member — just a clear research question and a clear sense of what counts as a "find."

## Notes for adapting

This pattern is the right shape any time the research target is **a concept or figure that resists literal matching** — where the thing you are tracking is named differently across the corpus, hidden inside puns or metaphors, or built out of attributes rather than letters. The close-reading-at-corpus-scale move generalizes to:

- **Mythic or folkloric figures across a literary corpus** — any hero, motif, or story-pattern with variant names. Arthur across the Welsh, French, English, and Italian traditions. The trickster across West African and African-American folklore. The figure of the Wandering Jew across nineteenth-century European literature.
- **A concept or argument across a body of philosophical work** — every place "the gift," "supplement," or "différance" is invoked across Derrida, in their many surface forms, with the scholar evaluating which invocations are load-bearing.
- **A character or theme across an author's complete works** — for an author whose work loops back on itself (Sebald, Pynchon, Joyce, Borges), the same figure appears under different names; close reading catches what a concordance cannot.
- **Allusions to a precursor across a successor's work** — every place Milton echoes Virgil, every place Bob Dylan invokes Woody Guthrie, every place Toni Morrison reworks the Book of Ruth.
- **The reception history of a specific event** — every place a particular historical moment (the fall of Constantinople, the Haitian Revolution, the Great Migration) is named, alluded to, or rewritten across a century of imaginative literature.

The pattern: a corpus large enough that no single human can read it cover-to-cover for one research question, a target figure or concept whose surface forms resist enumeration in advance, a coding scheme the scholar can argue with, and a verbatim-quote-plus-reasoning audit trail. The scholar provides the question and the judgment; Claude provides the tireless reading.

---

*Built to accompany Prof. Natasha Sumner's *Heroes of the Gael: A History of Fionn and the Fianna* (Harvard University Press, 2026).*
