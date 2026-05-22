# Close textual work across languages, with Claude Code as first-pass collaborator

*One of three day-4 projects in the Bok Center workshop. ← [Project landing page](../index.md). Companion docs: [Tradition](tradition.md) · [Affordance](affordance.md).*

This project is a scaffolded demonstration of how LLM-assisted close work might look in disciplines whose primary sources are not in English: classics, comparative literature, religious studies, modern languages, and the area-studies fields that maintain serious philological traditions of their own. Unlike the workshop's [interview-coding](../interview-coding/summary.md) and [physics-interactives](../physics-interactives/summary.md) projects, the skills here are not yet built. Two corpora are in place; the workshop demonstrates what the candidate skills would do against those corpora and reflects on the larger question of what LLMs can and cannot be asked to contribute to philological labor.

## What the project ships

Two demo corpora, each set up as a standalone target so a faculty member can grab the folder and work with either independently.

- **Homer's *Odyssey* in fourteen translations** at [the-odyssey/](../../projects/texts-and-translation/the-odyssey/), spanning Greek, Latin, Spanish, French, Swedish, and eight English versions (Bryant, Butcher/Lang, Butler, Cotterill, Cowper, Merry/Riddell, Monro, Pope). Polylas's nineteenth-century Modern Greek translation serves as the corpus "source" text; the Homeric original is left as a separate-sourcing question. The corpus is set up for *comparative translation* — line up five or fourteen versions of the proem, of the Cyclops episode, of the Sirens, and look at where the translators diverge.
- **Jagannātha Paṇḍitarāja's *Rasagaṅgādhara*** (17th-c. Sanskrit) at [early-modern-sanskrit/](../../projects/texts-and-translation/early-modern-sanskrit/), in Devanāgarī from the GRETIL archive at Göttingen, edited by Timothy C. Cahill from four printed editions. Only Ānana 1 is currently downloaded. The *Rasagaṅgādhara* is one of the last great works of classical Sanskrit poetics; it is itself an *alaṃkāra-śāstra* — a treatise on figures of speech — which makes it an unusually apt target for a skill that identifies figures, since the same text that defines the categories can also audit the skill's calls.

The project's [PLAN.md](../../projects/texts-and-translation/PLAN.md) sketches a small set of candidate skills — `/compare-translations`, `/identify-figures`, `/build-glossary`, `/commentary-companion`, `/transliterate`, `/teaching-handout` — and selects two for initial parallel build: comparative translation against the Odyssey and figure identification against the Rasagaṅgādhara. Neither is built yet.

## What attendees see in the session

The workshop session for this project is reflective rather than demonstrative. Attendees see the two corpora laid out, walk through what `/compare-translations` would do against *Odyssey* 1.1–10 (the proem — every translator's most labored opening, where Wilson's "complicated man" sits next to Lattimore's "man of many ways" and Pope's "man for wisdom's various arts renown'd"), and what `/identify-figures` would do against an illustrative verse from the *Rasagaṅgādhara* whose alaṃkāra Jagannātha himself names. The session then steps back to the broader question — what *should* the discipline ask of an LLM, and what should it keep firmly with the trained scholar?

The honest framing matters. Faculty who do close philological work daily are, with reason, the most skeptical audience for AI tools in the university. This project is built so they can find their own answer rather than be sold one.

## A note on framing

The skills sketched here treat the LLM as a first-pass collaborator, never a final arbiter. The scholar reads the primary source; the LLM surfaces candidates the scholar evaluates. Source text is quoted verbatim, never paraphrased. Citations use primary coordinates (*Odyssey* 1.1, *Rasagaṅgādhara* Ān. 1 §17), not file paths. The model's confidence is treated as a hypothesis to be checked, not as expertise.

The deeper argument is laid out in two companion documents: [tradition.md](tradition.md) situates the project in two centuries of philological and translation-theoretic work, and [affordance.md](affordance.md) walks through what LLMs change about that work and — at greater length — what they do not.

---

*Texts and translation overview: [Summary](summary.md) · [Tradition](tradition.md) · [Affordance](affordance.md). Back to the [project landing page](../index.md).*
