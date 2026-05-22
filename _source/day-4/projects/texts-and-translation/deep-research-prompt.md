# Deep Research Prompt — Contextualizing humanistic text work and its LLM successors

Use this as the prompt for an LLM Deep Research tool (Claude Deep Research, ChatGPT Deep Research, Perplexity Deep Research). The output is a contextualizing essay for workshop participants who have just seen a live demo of LLM-assisted work with non-English primary texts and translation — built around two corpora: Homer's *Odyssey* in 14 translations across six languages, and Jagannātha Paṇḍitarāja's *Rasagaṅgādhara* (17th-c. Sanskrit poetics).

---

## Prompt

Produce a contextualizing essay of **2,500–3,500 words** for an audience of faculty in classics, comparative literature, modern languages, religious studies, area studies, and adjacent humanistic fields who have just attended a workshop demonstration of LLM-assisted work with non-English primary texts. The demo was built around two corpora: **Homer's *Odyssey* in fourteen translations spanning Greek, Latin, Spanish, French, Swedish, and English**, and **Jagannātha Paṇḍitarāja's *Rasagaṅgādhara*** (17th-century Sanskrit poetics, alaṃkāra-śāstra).

The essay should be defensible to a senior philologist or translation scholar. The humanities have a justifiably skeptical relationship to LLMs — both because the field's epistemic culture privileges close reading and individual judgment in ways the social sciences do not, and because the political stakes of automated text work are different (questions of authorship, of translation as cultural labor, of the colonial history of philological work on non-European traditions). Do not oversell LLMs. Frame them as augmenting scholarly judgment for specific kinds of *labor-intensive but conceptually well-defined* work (collation, comparison, glossary-building, candidate-identification) without claiming that they perform the *interpretive* work that is the discipline's core.

The essay must accomplish three things, in this order.

### Part 1 — The methodological tradition of humanistic text work (~1,000 words)

Trace the intellectual history of close textual work in the humanities — from philology through translation studies through the recent computational turn. At minimum, cover:

- **The philological tradition.** Lachmann's stemmatic method (early 19th-c. German classical philology); the editing of fragmentary and multi-witness texts; the development of critical editions; the formation of philology as the discipline that *makes* texts available for reading.
- **The history of translation studies.** Schleiermacher's distinction (1813) between bringing the reader to the author and bringing the author to the reader; Walter Benjamin's "The Task of the Translator" (1923); Lawrence Venuti's *The Translator's Invisibility* (1995) on foreignization vs. domestication; translation as cultural labor and translation as text-production.
- **Close reading.** New Criticism (Brooks, Wimsatt); Auerbach's *Mimesis*; the deconstructive close reading of de Man and Hartman; the post-1960s consolidation of close reading as the discipline's signature method.
- **The Sanskrit and South Asian philological tradition.** Pāṇinian grammar; the commentary tradition (Nāgeśa Bhaṭṭa, Mathurā Nāth Śāstrī on the *Rasagaṅgādhara*); the formation of European Indology in the 19th century and Sheldon Pollock's reframing of it in the 21st (the *Murty Classical Library of India*, *Literary Cultures in History*). Pollock's notion of "philology of the future" as a critical practice that knows its own history.
- **The classical reception tradition.** Comparative readings of multiple translations of the same source text as a research practice; the journals (*Translation and Literature*, *Classical Receptions Journal*); programs like Stanford's *Classics in the Public Sphere*.
- **The computational turn.** Franco Moretti's "distant reading" (2000, 2013); Matthew Jockers' *Macroanalysis* (2013); Ted Underwood's *Distant Horizons* (2019); the Stanford Literary Lab; the debate over what is gained and lost when text work moves from the line to the corpus.
- **Digital humanities and its critics.** The Alan Liu / Adeline Koh / Roopika Risam debates over what counts as DH; the question of whose texts get digitized and on what terms; the politics of access for non-Latin scripts (Unicode adoption, OCR for Devanāgarī, ligature handling for Greek polytonic).
- **Critical editions and the politics of digital text.** GRETIL at Göttingen; the Perseus Project; the *Thesaurus Linguae Graecae*; the Sanskrit Library; the Digital Corpus of Sanskrit. Each project's editorial decisions and the scholarship that depends on them.

Make this accessible to faculty in adjacent fields (modern languages, religious studies) who may not have engaged with the philological tradition directly. The point is to set up the methodological commitments that LLM-assisted text work must reckon with — not catalog every contribution.

### Part 2 — What close textual work actually involves, day by day (~700 words)

Articulate the *labor* of close textual work — the specific tasks that consume the most time and the specific tasks where scholarly judgment is irreducible. Distinguish between them. The Deep Research piece's whole credibility depends on getting this distinction right.

- **Labor-intensive but conceptually well-defined.** Collating witnesses; building a glossary of specialized terminology (Homeric formulae, rasa-theory vocabulary); transcribing manuscripts; aligning translations to source passages; indexing a corpus by topic, character, theme, motif; cross-referencing commentaries; producing first-pass translations of routine passages. These are the tasks that have always been carried out by graduate students, research assistants, and faculty in the parts of a project where judgment is not yet required.
- **Interpretively irreducible.** Deciding what a contested passage means; weighing competing readings; assessing a translator's solution to an untranslatable phrase; identifying which figure of speech is operating in a Sanskrit verse where multiple alaṃkāras could be defended; situating a passage in a literary tradition; understanding what register, irony, voicing, or allusion is doing in a specific moment. These tasks *are* the discipline.
- **The slippery middle.** Tasks that look mechanical but contain interpretive moves — for instance, transliterating an ambiguous Sanskrit sandhi, or rendering a Homeric epithet that has no English equivalent. These middle cases are where LLM use is most fraught and where the field's anxieties about LLM-assisted work concentrate.

Anchor this section in concrete examples drawn from the workshop's two corpora — what does an Odyssey translator have to decide when handling the opening word *ándra*? What does Jagannātha's analysis of an illustrative verse require a contemporary Sanskrit scholar to track? Use real examples, not generic ones.

### Part 3 — Where LLMs assist humanistic text work, and into which adjacent fields (~1,200 words)

Map LLM affordances onto the labor distinctions established in Part 2. Be specific about *what kind of task* the LLM is helping with, in each case. The audience will tune out generalities and respond to specifics.

- **Comparative translation at scale.** When a scholar wants to know what fourteen translators did with *Odyssey* 1.1–10, the LLM can produce the side-by-side reliably, with citations to which translator did what. The judgment about *what those choices mean* remains with the scholar. Reference Emily Wilson's translation of the *Odyssey* (2017) as a recent case where translation choices became public scholarly debate.
- **Glossary construction.** Building a working glossary of Homeric epithets or rasa-theory technical vocabulary is mechanical labor at production scale. The LLM produces a first pass; the scholar edits. The result is a teaching tool or a research-aid that previously required a research assistant or did not get built at all.
- **Identifying figures of speech in alaṃkāra-rich texts.** The Sanskrit poetics tradition supplies its own taxonomy — Jagannātha's *Rasagaṅgādhara* defines each figure and gives illustrative verses. An LLM can apply that taxonomy to other passages and produce candidate identifications. The validation is built in: the same text that defines the categories can audit the LLM's calls.
- **Indexing across long corpora.** A 24-book *Odyssey* with multiple translation versions; the eight ānanas of the *Rasagaṅgādhara*. Building per-passage indexes — by character, by theme, by figure, by intertext — is precisely the labor LLMs are good at.
- **Non-Latin script handling.** A meaningful affordance the older computational-humanities tradition often lacked. LLMs can work in Devanāgarī, polytonic Greek, classical Chinese, Arabic, Hebrew, Tibetan, and Pali natively, without OCR or transliteration loss.
- **Pedagogical handout generation.** First-draft student-facing handouts — vocabulary, grammar notes, discussion questions — for any passage in any of the corpora. Faculty edit; the boilerplate is automated.
- **Translation-assisted ethnography and area studies.** A meaningful extension beyond classics — interview transcripts in non-English languages can now be indexed and analyzed in the source language rather than only after translation loss.

Then extend across adjacent fields with disciplinary specificity:

- **Classics and ancient languages.** The Perseus tradition; reader-aids for classical Greek and Latin; LLM affordances for the parts of philological work that are labor-bound rather than judgment-bound.
- **Sanskrit and South Asian studies.** GRETIL's machine-readable corpus; commentary-aware reading; the *Murty Classical Library* and its translation-pedagogy implications.
- **East Asian classical traditions.** Classical Chinese; *kanbun* reading; the *Daozang* and the Buddhist canon corpora; the field's specific concerns about LLM training on poorly-edited digital editions.
- **Arabic and Persian classical traditions.** The challenges of unvocalized Arabic text; the *Shahnameh* translation tradition; the ALECSO digital corpora.
- **Hebrew Bible studies and Rabbinics.** Sefaria as an existing platform; the BHS critical apparatus; the question of who controls the editing of a religiously authoritative text in digital form.
- **Comparative literature.** Cross-language thematic indexing; reception studies across translations; computational-stylistics work (in the lineage of Underwood, Jockers) that has been hard outside English-language corpora.
- **Modern languages and literature pedagogy.** Reading-aid generation for L2 learners; passage difficulty calibration; close-reading worksheet construction.
- **Religious studies and theology.** Cross-traditional indexing; commentary-aware reading; non-English source-text work in fields that have often had to rely on English translations.
- **Translation studies as a discipline.** What changes when the *labor* of translation comparison drops to near zero. The journals, the graduate programs, the methodological self-understanding of the field.
- **Manuscript studies and paleography.** LLM-assisted catalog generation; metadata extraction from finding aids; transcription review (not transcription itself, which remains a hand-and-eye craft).
- **Lexicography and historical linguistics.** Corpus-wide citation collection for new dictionary entries; first-pass etymological tracing; cross-language cognate identification.

Close with the **hard problems** the humanities specifically face with LLM-assisted text work. These are not the same hard problems as the social sciences and the essay's credibility depends on naming them correctly:

- **The politics of training data.** LLMs trained on existing translations, commentaries, and scholarly editions reproduce — and may launder — the editorial and ideological choices in those sources. The colonial-era European editions of South Asian texts, for instance, are baked into the models' priors in ways that are hard to audit.
- **The hallucination problem in citation.** LLMs invent plausible-sounding citations. For philologically careful work, this is disqualifying without verification protocols.
- **The "good enough translation" risk.** LLM-produced translations of canonical texts are often *good enough* for casual reading and *not nearly good enough* for scholarly use. The boundary between the two is easy to lose track of, especially in pedagogical settings.
- **What counts as scholarship.** If an LLM-assisted comparative translation note can be produced in an afternoon, what does that mean for the academic-credit economy that built the field? The publication tempo, the assessment criteria, the question of authorship.
- **The colonial inheritance.** Philological work on non-European traditions has a history. Automating the work without engaging that history risks reproducing it at scale. Sheldon Pollock's "philology of the future" is one articulation of what reflective practice might look like.
- **Access and corpus politics.** Whose digital editions get used? Whose stay locked behind paywalls? Who pays for the API calls when faculty in well-resourced institutions can run LLM-assisted comparative work that faculty elsewhere cannot?

## Formal requirements

- **Length:** 2,500–3,500 words, divided into the three parts above with explicit subheadings.
- **Citations:** academic citation style (MLA or Chicago author-date). Include full bibliographic information for at least 20 sources spanning (a) foundational philological and translation-studies texts, (b) exemplar comparative-translation and computational-humanities studies, and (c) recent commentary (2022–2026) on LLM use in humanistic text scholarship.
- **Tone:** scholarly, accessible across humanistic sub-disciplines, alert to the field's anxieties. Do not assume technical philological vocabulary; gloss specialized terms on first use.
- **Honesty about LLMs.** Do not oversell. The contextualizing piece should be defensible to a senior philologist who will press on every claim. Frame LLM affordances as augmenting *labor-bound* scholarly work, not the *judgment-bound* work that constitutes the discipline.

## What NOT to produce

- A how-to guide for LLM-assisted text work (the audience already saw the demo).
- Boosterism about AI in the humanities.
- A polemic about whether LLMs belong in humanistic scholarship.
- An uncritical celebration of the computational turn.
- Anything that frames LLMs as performing close reading, making interpretive judgments, or producing scholarship independent of the scholar.

## What to actively surface that is non-obvious

- Methodological work in *translation studies* (Venuti, Berman, Pym) that bears on what LLM-assisted comparative-translation skills can and cannot do.
- Specific examples of computational humanities projects that have engaged with non-English, non-Latin-script traditions — the field is dominated by Anglophone work, which limits what generalist commentary captures.
- Sheldon Pollock's "philology of the future" and its implications for LLM-era scholarly practice.
- Published research (2022–2026) on LLM performance in non-English classical languages — including the failure cases.
- The colonial-philology history that any responsible piece on this topic must engage with.

---

## Notes for Marlon before sending

- The audience is broader and more disciplinarily varied than the Mary prompt's. Consider tightening if a specific sub-discipline (classics, Sanskrit, modern languages) dominates the room.
- The "hard problems" section is the most important and the most often skipped by Deep Research tools. Push back if the draft soft-pedals it.
- If the recipient is a Sanskritist specifically, consider expanding Part 1's treatment of the South Asian philological tradition; if a classicist, expand the philological-method discussion. The current draft tries to balance.
