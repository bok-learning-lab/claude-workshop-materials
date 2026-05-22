# Plan — Texts and translation

Initial scaffolding for a workshop project on LLM-assisted work with non-English texts and translation. The corpora are in place; no skills have been built yet. This file sketches candidate skills, identifies an initial parallel-build task or two, and lists open questions.

## Why this project (one paragraph)

Faculty across classics, comparative literature, modern languages, religious studies, and area studies do close textual work daily — translating, comparing translations, building glossaries, identifying rhetorical features, writing commentaries. These tasks are time-intensive and individually small, which makes them excellent targets for LLM-assistance: the scholar still owns the judgment but offloads the cross-referencing and the first-pass surfacing of candidates. This project sets up two demo corpora — one Greek / multi-translation, one Sanskrit / single-edition — and proposes a small set of skills that work across both.

## What's already in place

- [the-odyssey/the_odyssey.txt](the-odyssey/the_odyssey.txt) — Greek (Polylas Modern Greek translation; serves as the "source" text in the corpus).
- [the-odyssey/translations/](the-odyssey/translations/) — 14 translations across Greek, Latin, Spanish, French, Swedish, and 8 English. See the file list for translators and approximate periods.
- [early-modern-sanskrit/inputs/jagannatha-rasagangadhara.htm](early-modern-sanskrit/inputs/jagannatha-rasagangadhara.htm) — Ānana 1 of the *Rasagaṅgādhara* (17th c.), from GRETIL.

## Candidate skills (brainstorm)

Skills that work across both corpora unless noted. None are built yet; the parallel-build section below selects an initial subset to scope.

### Comparative translation

- **`/compare-translations`** — given a passage and N translations, surface side-by-side what each translator chose to preserve, intensify, or let go. Highlight decisions (register, archaism, meter-keeping, theological framing) and quote verbatim. Strong fit for the Odyssey corpus.
- **`/translation-decisions`** — across a longer span, extract the recurring patterns of a single translator's choices. Useful for teaching translation as decision-making.
- **`/translation-draft`** — given a passage, produce a draft translation in a stated style (literal / literary / scholarly) with notes. Explicitly a draft for the scholar to revise; not a finished product.

### Close reading

- **`/passage-analysis`** — close-read a passage from either corpus: grammatical features, rhetorical structure, intertexts, scholarly debates the passage touches.
- **`/identify-figures`** — identify figures of speech (alaṃkāras / σχήματα / tropes). Especially apt for the Sanskrit corpus, because the *Rasagaṅgādhara* is itself an alaṃkāra-śāstra treatise — the skill can be tested against the very text that defines its categories.

### Vocabulary and commentary

- **`/build-glossary`** — extract specialized vocabulary from a corpus (Homeric formulae; rasa-theory terms). Output is a working glossary the scholar can edit.
- **`/commentary-companion`** — generate study notes alongside a passage, modeled on traditional commentaries (for Sanskrit) or modern scholarly editions (for the Odyssey).

### Script and transliteration

- **`/transliterate`** — Devanāgarī ↔ IAST ↔ Harvard-Kyoto for Sanskrit; polytonic Greek ↔ Latin transliteration if a faculty member needs it.

### Teaching artifacts

- **`/teaching-handout`** — given a passage, produce a student-facing handout with vocabulary, grammar notes, and discussion questions.

## Initial parallel-build tasks

Mirrors the pattern from [../interview-coding/PLAN.md](../interview-coding/PLAN.md): each task is self-contained and can be picked up by a separate Claude Code session. Two below; a third can be added once open questions are settled.

### Task A — Build `/compare-translations`

**The move:** given a passage citation (e.g. *Odyssey* 1.1–10) and a set of translation files in the corpus, produce a side-by-side comparison of how each translator handled the passage. Quote verbatim. Surface the decisions each translator made — what they preserved (epithets, syntactic structure, mood), what they substituted (a culturally adjacent figure for a Homeric one), what they let go.

**Why this is a good demo:** the Odyssey corpus has 14 translations — exactly the situation where a scholar cannot easily hold all the comparisons in mind at once. The skill scales a move that a translation seminar already makes: line up the translators and look at where they diverge.

**Candidate demo passages:**

- Book 1, lines 1–10 (the proem — every translator's most labored opening).
- Book 9, lines 105–115 (the Cyclopes' land — culture-loaded vocabulary).
- Book 12, lines 184–192 (the Sirens — meter and music are at stake).

**Build location:** `.claude/skills/compare-translations/` inside this project folder.

### Task B — Build `/identify-figures`

**The move:** given a passage of poetry (Sanskrit verse or Greek hexameter), identify the figures of speech operating in it — alaṃkāra by name (anuprāsa, yamaka, śleṣa, utprekṣā, rūpaka…) for Sanskrit, or the Greek equivalents for Homer. For each figure, quote the relevant text, name the figure, and explain what it is doing rhetorically.

**Why this is a good demo:** the *Rasagaṅgādhara* is itself an alaṃkāra-śāstra treatise. Jagannātha defines each figure rigorously and supplies illustrative verses. The skill can be tested against the same text that defines its categories — a closed system for validating output.

**Demo plan:** test on an illustrative verse from the *Rasagaṅgādhara* where Jagannātha himself names the figure, and check whether the skill arrives at the same identification.

**Build location:** `.claude/skills/identify-figures/` inside this project folder.

## Hard constraints (apply to every skill built here)

- **Quote verbatim.** Source text in any skill output must match the source file character-for-character, including diacritics and stage marks. Paraphrase is the scholar's job.
- **Cite by edition and primary coordinate** (*Odyssey* 1.1, *Rasagaṅgādhara* Ān. 1 §17), not by file line number. The file path is secondary.
- **Preserve script.** Do not silently transliterate or romanize source text. If transliteration is needed, produce a separate file and label it.
- **Frame as candidates, not verdicts.** "This passage exhibits anuprāsa" → "Candidate alaṃkāra: anuprāsa (alliteration of velar stops at L34, L36); verify against Jagannātha's definition at §X."
- **Be honest about the model's limits.** Sanskrit philology and Homeric Greek prosody are technical fields. The LLM produces first-pass surfacing for a trained scholar to evaluate, not finished philological judgments.
- **No emojis.** Markdown link syntax for file references.

## Open questions

- **Homeric Greek source.** The corpus currently has Polylas's Modern Greek as the "Greek" source. Should the Homeric original (Murray Loeb, Project Gutenberg #1727) be added? Useful for comparative-translation work that includes the original.
- **More of the Rasagaṅgādhara.** Only Ānana 1 is downloaded. GRETIL has more sections. Worth downloading the rest if the Sanskrit demos prove useful.
- **Published English translations of the Rasagaṅgādhara.** Gerow, Pollock-led projects, Patwardhan-Athavale. Useful if `/compare-translations` is to be applied to a Sanskrit primary.
- **Skill audience framing.** Faculty in classics may not want any LLM-mediated philology at all. Skills should probably default to "show me what's in the text" rather than "tell me what it means." Confirm during workshop testing.
- **Workshop demo target.** Which two of the candidate skills ship in the live demo? Best initial bet: `/compare-translations` on the Odyssey (concrete, immediately legible) plus `/identify-figures` on the *Rasagaṅgādhara* (closed-system validation against Jagannātha's own definitions).

## File map (target state, end of initial scaffolding phase)

```text
_context/day-4/projects/texts-and-translation/
  CLAUDE.md
  PLAN.md
  the-odyssey/
    the_odyssey.txt                 (Polylas Modern Greek)
    translations/
      ...14 files across 6 languages...
  early-modern-sanskrit/
    inputs/
      jagannatha-rasagangadhara.htm (Ānana 1, from GRETIL)
  .claude/
    skills/                         (populated once parallel-build tasks above run)
      compare-translations/
      identify-figures/
  output/                           (lazily created on first skill output)
```
