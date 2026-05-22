# Two centuries of close textual work

*One of three day-4 projects in the Bok Center workshop. ← [Project landing page](../index.md). Companion docs: [Summary](summary.md) · [Affordance](affordance.md).*

The humanities have built, over two centuries, a methodological apparatus for close textual work that is among the discipline's most distinctive achievements. Any responsible account of what LLMs do to that apparatus has to start by describing it carefully on its own terms. This document sketches the lineage the workshop's [texts and translation](../../projects/texts-and-translation/) project is operating inside, without yet introducing the AI question. The [affordance](affordance.md) companion takes that question up.

## The philological revolution

Close textual work in the modern humanities has its origins in the philological revolution of the early nineteenth century. Karl Lachmann's edition of the Greek New Testament (1831) is the conventional milestone, though the procedures he codified — comparing surviving manuscript witnesses, identifying shared errors, reconstructing a hypothetical archetype via the *stemma codicum* — were already present in the work of Bentley, Bengel, and Wolf.[^lachmann] What Lachmann did was assemble them into a method robust enough to be taught and extended. By the end of the nineteenth century the stemmatic method had become the default discipline for editing classical and medieval texts, and the critical edition — the printed source text with its *apparatus criticus* of variants — had become the form in which philological labor reached the rest of the field. The genealogical methods Lachmann inherited were already being supplemented by computational stemmatology in the 1950s, and the application of phylogenetic software from evolutionary biology to manuscript traditions is now an established sub-field.[^trovato]

## Translation theory's parallel history

Alongside the philological tradition runs the parallel history of translation theory. Friedrich Schleiermacher's 1813 address to the Royal Academy of Sciences in Berlin, "On the Different Methods of Translating," articulated a distinction that has organized the field ever since: the translator must either move the reader toward the author, preserving the foreignness of the source, or move the author toward the reader, naturalizing the source into the target language's idiom.[^schleiermacher] Walter Benjamin's "The Task of the Translator" (1923), the introduction to his German Baudelaire, pushed the question into more difficult territory: translation, for Benjamin, is not a procedure for transmitting information but a "mode" through which the afterlife of the original is realized.[^benjamin] Lawrence Venuti's *The Translator's Invisibility* (1995; revised 2008) returned to Schleiermacher and refigured the distinction in political terms — domestication conceals the labor of the translator and the foreignness of the source under a fluent, transparent English; foreignization makes both visible.[^venuti] The point is not bibliographic completeness — Antoine Berman, Gayatri Chakravorty Spivak, and Maria Tymoczko all warrant treatment in a longer piece — but to register that translation studies has had, for two centuries, a sophisticated apparatus for thinking about what translation does and what it is for.

A side-by-side comparison of fourteen Odyssey translations is not, then, a neutral data display. It is a comparison of fourteen positions on the Schleiermacher–Venuti axis, each shaped by what its translator took translation to be. Whatever a comparative-translation skill produces, it produces *into* that two-century conversation.

## The close-reading tradition

The close-reading tradition descends from a different lineage. New Criticism — Brooks, Wimsatt, Ransom — consolidated in mid-twentieth-century American departments a procedure for reading the literary text as a self-sufficient verbal artifact, attending to ambiguity, paradox, and structure. Erich Auerbach's *Mimesis* (1946), written in Istanbul exile without his German libraries, demonstrated what close reading could achieve when wedded to philological erudition and ranging across Greek, Latin, Old French, Italian, Spanish, German, and English — twenty chapters, each opening from a single passage.[^auerbach] Auerbach's first chapter, "Odysseus' Scar," reading Homer against the *aqedah* in Genesis 22, remains a paradigmatic demonstration of what close reading does.

## The Sanskrit philological tradition

The Sanskrit philological tradition has its own deep history, predating European philology by more than two millennia. Pāṇini's *Aṣṭādhyāyī* (c. 5th–4th century BCE) is itself an astonishing achievement in linguistic analysis, and the commentarial tradition — *bhāṣya*, *vārttika*, *ṭīkā* — constitutes a model of textual scholarship as elaborate as anything in Europe. Nāgeśa Bhaṭṭa's commentary on Pāṇini and Mathurā Nāth Śāstrī's *Gurumarmaprakāśikā* on the *Rasagaṅgādhara* are not external aids to reading; they are integral to how the text is read. European Indology in the nineteenth century — Müller, Weber, Aufrecht, Oldenberg — built its work on this indigenous tradition, often without acknowledging what it borrowed and frequently subordinating the indigenous commentaries to its own racial and theological priors.[^adluri-bagchee] Sheldon Pollock's body of work, including his framework essay "Future Philology? The Fate of a Soft Science in a Hard World" (2009), has been the most sustained recent effort to reckon with that inheritance: to make philology critical of its own history while preserving what it knows how to do.[^pollock-future] Pollock's editorial work on the Clay Sanskrit Library and the Murty Classical Library of India — projected at 500 volumes over a century, published by Harvard University Press in bilingual format — is its institutional expression.

## Distant reading and its limits

The computational turn in literary studies emerged from a different direction. Franco Moretti's "Conjectures on World Literature" (2000) and the essays gathered in *Distant Reading* (2013) made the case for studying literature at scales close reading could not reach.[^moretti] Matthew Jockers' *Macroanalysis* (2013) and Ted Underwood's *Distant Horizons* (2019) developed the procedures.[^jockers][^underwood] Reception has been mixed. Critics from Katherine Bode through Nan Z. Da have pressed on assumptions about evidence and corpus; the political stakes — articulated by Roopika Risam in *New Digital Worlds* (2018) and by Alan Liu in his recurring intervention on digital humanities and cultural critique — sharpen as the tools become more powerful.[^da][^risam][^liu] The Anglophone bias of distant reading has been a persistent limit; the work has been overwhelmingly on English-language corpora, and the methods that gained traction in English departments did not extend easily to non-Latin scripts, polytonic Greek, or the morphological complexity of Sanskrit.

The infrastructure that made non-English computational work possible has come instead from philological projects: the Perseus Digital Library at Tufts (founded 1987, now hosting tens of millions of words of Greek, Latin, and English translation through the Scaife Viewer); the Thesaurus Linguae Graecae at UC Irvine; the Göttingen Register of Electronic Texts in Indian Languages (GRETIL), a machine-readable corpus of Sanskrit, Pali, Prakrit, Tibetan, and other South Asian languages; SARIT at the NEH; the Digital Corpus of Sanskrit at Heidelberg; Sefaria's open digital library of Jewish texts. Each represents enormous editorial labor and contains editorial decisions that subsequent computational work then inherits, often invisibly. The *Rasagaṅgādhara* file used in this project descends from one such substrate.

## What this tradition takes itself to be doing

A few features of the inheritance bear emphasizing before any AI conversation begins.

First, the tradition takes *textual labor* seriously — treats editing, collating, glossing, and translating as scholarship in their own right, not as preparatory work that real research begins after. The critical edition, the commentary, the bilingual edition, the philological glossary: these are not throat-clearing but the discipline's primary outputs.

Second, the tradition has a sophisticated and self-critical understanding of what reading and translating are *for*. The Schleiermacher–Venuti axis, the Pollock critique of European Indology's editorial inheritance, the long debate over what philology owes to texts written under conditions European philology was not built to understand — these are live arguments, not settled doctrine.

Third, the tradition is institutionally embedded. The graduate programs that train classicists, Sanskritists, Sinologists, Arabists, and Hebraists socialize their students into specific methodological standards. The published critical editions, the journal apparatus, the Loeb and Murty and Clay and Sefaria series, the field's own debates about the limits of computational philology — together these constitute an audience that any new tool has to answer to.

The question for the [affordance](affordance.md) companion is not whether the LLM can do philology — it cannot — but what it can do for the philologist, and on what terms a discipline this self-aware should be willing to accept the offer.

---

*Texts and translation overview: [Summary](summary.md) · [Tradition](tradition.md) · [Affordance](affordance.md). Back to the [project landing page](../index.md).*

[^lachmann]: Lachmann, K. (1842–1850). *Novum Testamentum Graece et Latine*. Berlin: Reimer. The 1831 New Testament is the earlier milestone; the two-volume Reimer is the developed form.
[^trovato]: Trovato, P. (2014). *Everything You Always Wanted to Know about Lachmann's Method*. Padua: libreriauniversitaria.it edizioni.
[^schleiermacher]: Schleiermacher, F. (1813/2012). "On the Different Methods of Translating," trans. Susan Bernofsky, in L. Venuti (ed.), *The Translation Studies Reader* (3rd ed.), Routledge, pp. 43–63.
[^benjamin]: Benjamin, W. (1923/1968). "The Task of the Translator," trans. Harry Zohn, in *Illuminations*, ed. Hannah Arendt, Schocken, pp. 69–82.
[^venuti]: Venuti, L. (2008). *The Translator's Invisibility: A History of Translation* (2nd ed.). London: Routledge.
[^auerbach]: Auerbach, E. (1946/2003). *Mimesis: The Representation of Reality in Western Literature*, trans. Willard R. Trask, intro. Edward W. Said. Princeton: Princeton University Press.
[^adluri-bagchee]: Adluri, V., & Bagchee, J. (2018). *Philology and Criticism: A Guide to Mahābhārata Textual Criticism*. London: Anthem Press.
[^pollock-future]: Pollock, S. (2009). "Future Philology? The Fate of a Soft Science in a Hard World." *Critical Inquiry* 35(4): 931–961.
[^moretti]: Moretti, F. (2013). *Distant Reading*. London: Verso. See also "Conjectures on World Literature," *New Left Review* 1 (2000): 54–68.
[^jockers]: Jockers, M. L. (2013). *Macroanalysis: Digital Methods and Literary History*. Urbana: University of Illinois Press.
[^underwood]: Underwood, T. (2019). *Distant Horizons: Digital Evidence and Literary Change*. Chicago: University of Chicago Press.
[^da]: Da, N. Z. (2019). "The Computational Case against Computational Literary Studies." *Critical Inquiry* 45(3): 601–639.
[^risam]: Risam, R. (2018). *New Digital Worlds: Postcolonial Digital Humanities in Theory, Praxis, and Pedagogy*. Evanston: Northwestern University Press.
[^liu]: Liu, A. (2012). "Where Is Cultural Criticism in the Digital Humanities?" In M. K. Gold (ed.), *Debates in the Digital Humanities*, Minneapolis: University of Minnesota Press, pp. 490–509.
