---
name: split-into-books
description: Split one or more Odyssey translation files into 24 per-book files stored under the-odyssey/skill_output/books/. One-time corpus-preparation step that makes /show-passage fast by reducing 700KB files to ~30KB per book. Trigger when the user runs /split-into-books, asks to "split the translations," or asks to "prepare the corpus for passage queries."
---

You are a corpus-preparation utility for the Odyssey translation project. Your job is to take one or more translation files and split them into 24 per-book files — one for each book of the *Odyssey* — stored in a structured `books/` directory. This is a one-time setup step; once run, `/show-passage` can work against fast per-book files rather than searching full 700KB texts.

## What this skill does and does not do

**This skill splits files only.** It does not translate, summarize, annotate, or compare. Every byte of every output file comes verbatim from the input. If a book boundary is uncertain, the skill marks it explicitly and reports the uncertainty — it never silently guesses or omits content.

## Inputs

The user passes one of:

- A single file path: `/split-into-books the-odyssey/inputs/translations/odyssey_pope.txt`
- The keyword `all` to process every file in `the-odyssey/inputs/translations/`
- A language tag: `english`, `french`, `spanish`, `latin`, `greek`, `swedish`

All paths are relative to the project root (the folder containing `.claude/`).

If no argument is given, ask once: "Which translation should I split? Pass a file path, `all`, or a language tag (e.g. `english`)."

## Output location

For each input file, write 24 output files (or fewer if the source has fewer books):

```
the-odyssey/skill_output/books/<slug>/book-01.txt
the-odyssey/skill_output/books/<slug>/book-02.txt
...
the-odyssey/skill_output/books/<slug>/book-24.txt
```

Derive `<slug>` from the filename: strip directory and extension, lowercase, collapse non-alphanumerics to single hyphens. Examples:

| Input filename | Slug |
|---|---|
| `odyssey_pope.txt` | `pope` |
| `Odyssey_translated_by_Samuel_Butler.txt` | `samuel-butler` |
| `la_odisea_spanish_Segala_Estalella.txt` | `segala-estalella` |
| `odyssea-latin.txt` | `latin` |
| `Odysseia_swedish_sjostrom.txt` | `sjostrom` |

Create the directory if it does not exist.

## Procedure

### Step 1 — Detect the book-heading pattern

Read the first 300 lines. Identify which pattern marks the start of a new book. The files in this corpus use different conventions — detecting the right one is the first real task:

| Pattern | Example | Language | Notes |
|---|---|---|---|
| All-caps `BOOK` + Roman numeral + period | `BOOK I.` | English (Pope) | TOC near line 47 uses same pattern; skip it |
| Title-case `Book` + Roman numeral | `Book I` | English (Butler, Cowper) | Running headers like `Book I \| 11` appear on many lines; use only bare `Book [Roman]` at line start |
| `CANTO` + ordinal or Roman numeral | `CANTO PRIMERO`, `CANTO II` | Spanish (Segala Estalella) | Book 1 uses the word `PRIMERO`; Books 2–24 use Roman numerals |
| `Chant` + ordinal word or Roman numeral | `Chant Premier`, `Chant II` | French (Calbet) | Book 1 uses the word `Premier`; Books 2–24 use Roman numerals |
| `Odysseæ` + Roman numeral + em-dash | `Odysseæ I.—` | Latin (Firmin-Didot) | Each heading continues with a Latin description; the delimiter is the `Odysseæ [N].—` prefix |
| Swedish ordinal word + `Sången.` | `Första Sången.`, `Andra Sången.` | Swedish (Sjöström) | No Roman numerals — uses Swedish ordinal words throughout. Reference list: Första (1), Andra (2), Tredje (3), Fjerde (4), Femte (5), Sjette (6), Sjunde (7), Åttonde (8), Nionde (9), Tionde (10), Elfte (11), Tolfte (12), Trettonde (13), Fjortonde (14), Femtonde (15), Sextonde (16), Sjuttonde (17), Adertonde (18), Nittonde (19), Tjugonde (20), Tjugondeförsta (21), Tjugondeandra (22), Tjugondtredje (23), Tjugondefjerde (24) |
| Other | varies | any future addition | Derive from the file; do not assume |

This variability is not an accident — it reflects the source format of each edition (Project Gutenberg, LibreTexts, Pressbooks, etc.). The skill must derive the pattern from the file rather than assuming one.

Many files contain a **table of contents** near the top listing all 24 books. These TOC entries use the same heading text but are not the actual boundaries. Skip the TOC (typically a compact block in the first 200 lines) and locate the first heading that is followed by actual verse or prose.

State the detected pattern in one line before proceeding, e.g.: "Pattern detected: `BOOK [Roman numeral].` on its own line, skipping TOC at lines 47–70."

### Step 2 — Locate all 24 book boundaries

Walk the file from the first genuine book heading and record the line number of each. Most translations contain exactly 24 books. If you find fewer, report the count and stop — do not fabricate missing books.

Exception: `odyssey_bryant_book1.txt` contains only Book 1. Extract that one book as `book-01.txt` and note the limitation in the summary.

### Step 3 — Extract and write each book

For book N: extract from the heading line of book N through the line before the heading of book N+1 (inclusive). For Book 24: extract from its heading through end of file.

Write each book file verbatim. No modifications, no stripped headers, no added annotations.

### Step 4 — Verify completeness

After writing all files:

1. Sum the line counts of the 24 output files.
2. Count the lines in the source from the first genuine book heading through end of file.
3. The totals should match (±1 for a trailing newline). If they diverge, report the discrepancy before finishing.

### Step 5 — Report back

In 4–8 lines:

- Which file(s) were split and where the outputs landed (markdown links).
- What heading pattern was detected, and whether a TOC had to be skipped.
- Whether all 24 books were found or any were missing.
- Any ambiguous boundaries flagged.

## Hard constraints

- **Verbatim content.** No word in any output file may differ from the source. No corrections, no normalization, no added line numbers.
- **No invented content.** If a boundary is ambiguous, insert a single-line comment `<!-- BOUNDARY UNCERTAIN: [what you saw] -->` at the split point and report it. Do not guess silently.
- **Preserve encoding.** Files contain diacritics, polytonic Greek, and special characters. Write them exactly as they appear.
- **No emojis** anywhere.
- **Markdown links** for all file references in the report.

## Note on the Greek XML source

The Homeric Greek source (`the-odyssey/inputs/odyssey_homeric_greek.xml`) is in TEI/XML format — the encoding standard underlying Perseus, GRETIL, and most digital text archives in classics and area studies. Its book structure is encoded as `<div type="book" n="1">` rather than as a text delimiter, and line numbers are explicit attributes (`<l n="1">`). This skill does not split the XML file; `/show-passage` reads it natively by navigating those structural tags. The TEI format is what digital humanities infrastructure actually looks like. If you want plain text from it, you can strip the tags with:

```
python -c "import re, sys; print(re.sub('<[^>]+>', '', sys.stdin.read()))" \
  < the-odyssey/inputs/odyssey_homeric_greek.xml \
  > the-odyssey/skill_output/odyssey_homeric_greek_plain.txt
```

Stripping the tags discards the line-number encoding that makes accurate citation possible — which is exactly why the XML is kept as-is.
