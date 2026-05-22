---
name: show-passage
description: Given a passage citation (e.g. Od. 1.1-10), display the original Homeric Greek at the top followed by each chosen translation below it, verbatim. The primary comparison skill for the Odyssey corpus. Trigger when the user runs /show-passage, asks to "show a passage," asks to "compare translations of [passage]," or names a book and line range.
---

You are the primary passage-display skill for the Odyssey corpus. Given a passage citation and a set of translations, you produce a single document: the original Homeric Greek at the top, then each translation in turn, verbatim and attributed. The scholar reads; you surface. You do not interpret, summarize, or evaluate the translations — that is the scholar's work.

## What this skill does and does not do

**This skill displays text.** It extracts the requested passage from the Greek XML and from each translation file and lays them out side by side in a single output document. It quotes verbatim, attributes each translator with name and date, and notes where line-for-line correspondence cannot be guaranteed (prose translations in particular). It does not analyze, paraphrase, or rank the translations.

## Inputs

- **Passage citation** (required): standard format `Od. [book].[line start]-[line end]`, e.g. `Od. 1.1-10`, `Od. 9.105-115`, `Od. 12.184-192`. If the user gives a book and a brief description instead ("the proem," "the Sirens passage"), make one reasonable identification and state it.
- **Translation list** (optional): names or slugs of translators to include. Default if omitted: Pope, Butler, Cowper, Calbet (French), Segala Estalella (Spanish), Latin. Pass `all` to include the full corpus of 14.

All paths are relative to the project root (the folder containing `.claude/`).

## Required source file

This skill requires the Homeric Greek TEI-XML source at `the-odyssey/inputs/odyssey_homeric_greek.xml`. If that file is not present, stop and say so: "The Homeric Greek source is not yet in the corpus. Download the PerseusDL text (tlg0012.tlg002.perseus-grc2.xml) and save it as `the-odyssey/inputs/odyssey_homeric_greek.xml`."

Do not proceed without the Greek source. The whole point of this skill is that the original stands at the top.

## Translation file map

| Slug | File | Translator | Language | Date |
|---|---|---|---|---|
| `pope` | `the-odyssey/inputs/translations/odyssey_pope.txt` | Alexander Pope | English | 1725 |
| `butler` | `the-odyssey/inputs/translations/Odyssey_translated_by_Samuel_Butler.txt` | Samuel Butler | English | 1900 |
| `cowper` | `the-odyssey/inputs/translations/The-Odyssey-William_Cowper_J_Johnson.txt` | William Cowper | English | 1791 |
| `calbet` | `the-odyssey/inputs/translations/lodyssee_french_calbet.txt` | Antoine Calbet | French | 1897 |
| `segala-estalella` | `the-odyssey/inputs/translations/la_odisea_spanish_Segala_Estalella.txt` | José Segala y Estalella | Spanish | 1927 |
| `latin` | `the-odyssey/inputs/translations/odyssea-latin.txt` | Latin | Latin | — |
| `butcher-lang` | `the-odyssey/inputs/translations/Odyssey_Butcher_Lang.txt` | Butcher & Lang | English | 1879 |
| `cotterill` | `the-odyssey/inputs/translations/odyssey_cotterill.txt` | Cotterill | English | — |
| `monro` | `the-odyssey/inputs/translations/Odyssey_David_Monro.txt` | David Monro | English | — |
| `polylas` | `the-odyssey/inputs/translations/odyssey_greek_Iakovos_Polylas.txt` | Iakovos Polylas | Modern Greek | 1875 |
| `alford` | `the-odyssey/inputs/translations/Odyssey_hendecasyllable_alford.txt` | Alford | English (hendecasyllable) | — |
| `merry-riddell` | `the-odyssey/inputs/translations/Odyssey_Merry_Riddell.txt` | Merry & Riddell | English | — |
| `sjostrom` | `the-odyssey/inputs/translations/Odysseia_swedish_sjostrom.txt` | Sjöström | Swedish | — |
| `bryant-book1` | `the-odyssey/inputs/translations/odyssey_bryant_book1.txt` | Bryant | English | — (Book 1 only) |

## Procedure

### Step 1 — Parse the citation

Extract: book number (integer), line start (integer), line end (integer). Convert Roman numerals if the user wrote them. Store as `book`, `line_start`, `line_end`.

If the range spans more than 50 lines, note that the output will be long and ask the user to confirm before proceeding.

### Step 2 — Extract the Greek passage

Read `the-odyssey/inputs/odyssey_homeric_greek.xml`. The file is TEI/XML: book structure is encoded as `<div type="book" n="[N]">` and individual lines as `<l n="[N]">text</l>`.

Navigate to the correct `<div>` for the requested book. Extract each `<l>` element whose `n` attribute falls within `[line_start, line_end]`. Preserve the Greek text exactly — every character, every diacritic, every breathing mark. Do not strip, normalize, or romanize.

If a line number is not present in the XML (some editions have gaps or variant numbering), note it and extract the nearest available range.

### Step 3 — Locate each translation passage

For each translation in the list:

**If pre-split book files exist** (i.e., `the-odyssey/skill_output/books/<slug>/book-[NN].txt` is present from a prior `/split-into-books` run): use the per-book file. This is much faster than searching the full translation file.

**If pre-split files do not exist**: read the full translation file, locate the correct book heading, and work within that section.

**Line correspondence:** verse translations (Pope, Cowper, Alford, Butcher & Lang) do not preserve Homeric line numbers. Extract the passage that corresponds to the cited range based on content and position within the book, not by matching line numbers. Note explicitly in the output that line correspondence is approximate for verse translations.

**Prose translations** (Butler): prose does not map to Homeric lines at all. Extract the paragraph(s) that correspond to the cited passage by content. Note this in the output.

### Step 4 — Assemble the output document

Write to `the-odyssey/skill_output/passages/od-[book]-[line_start]-[line_end].md`. Create the directory if it does not exist.

Use this structure:

```markdown
# *Odyssey* [book].[line_start]–[line_end]

## Original Greek

Source: PerseusDL TEI-XML (tlg0012.tlg002.perseus-grc2)
[Note: The XML preserves scholarly line-number encoding. To produce plain text:
`python -c "import re, sys; print(re.sub('<[^>]+>', '', sys.stdin.read()))" < odyssey_homeric_greek.xml`
Stripping the tags discards the encoding that makes accurate citation possible.]

[Greek text, line by line, preserving diacritics]

---

## [Translator last name] ([date]) — [brief register note: heroic couplets / blank verse / prose / etc.]

[Verbatim text of the passage]

---

## [Next translator] ...

[etc.]
```

The register note after the date is a single phrase — "heroic couplets," "blank verse," "prose," "hendecasyllable," "scholarly prose," "prose (French)." It orients the scholar without editorializing.

### Step 4b — Write the NB section

At the end of the output document, before the final newline, append an `## NB` section. This is a brief scholarly note for the faculty member reading the output — observations about the translations themselves that are visible in the passage but easy to miss. Write only what is actually true of the extracted text; do not invent observations.

Include any of the following that apply:

- **Line correspondence.** Which translations preserve Homeric line numbering (the Latin Firmin-Didot edition does, printing numbers inline), which are verse translations where correspondence is approximate (Pope, Cowper), and which are prose where no line mapping exists (Butler, Calbet, Segala Estalella). Naming this explicitly helps a faculty member know what to trust when they cite a "line."
- **Edition format notes.** Anything structurally unusual about one of the editions — e.g., that the Firmin-Didot Latin is a word-for-word interlinear crib designed to follow the Greek closely, that Pope includes an Argument prose summary before the verse, that Butler's source file uses a LibreTexts section-numbering scheme (`1.6: Book VI`) rather than a bare `Book VI` heading.
- **Expansion or compression.** If one translator notably expands or compresses the passage relative to the Greek line count, note it. (Pope often expands; prose translators compress; blank verse tends to be roughly parallel.)
- **Missing translations.** If a translation in the requested list was unavailable for this passage (e.g., Bryant's file contains only Book 1), note it here, not inline.

Keep the NB section short: one sentence per observation, no more than five bullets. Do not editorialize about which translation is "better."

### Step 5 — Report back

In 3–5 lines:
- Where the output file is (markdown link).
- Which translations were included.
- Any passages where line correspondence was approximate or unavailable (e.g., a book that Bryant's text does not contain).

## Hard constraints

- **Verbatim only.** Every word in the translation sections must be copied character-for-character from the source file. No paraphrase, no correction, no normalization.
- **No invented passages.** If a passage cannot be located in a translation file, say so. Do not fabricate text.
- **Preserve script and diacritics.** Greek text must reproduce every breathing mark and accent. Do not silently romanize.
- **Cite by primary coordinate.** The citation header is `Od. 1.1–10`, not a file line number.
- **No emojis** anywhere.
- **Markdown links** for the output file reference.
- **Do not proceed without the Greek XML.** The original is the anchor.
