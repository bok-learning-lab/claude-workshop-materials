# What LLMs change about flexible coding (and what they do not)

*One of three day-4 projects in the Bok Center workshop. ← [Project landing page](../index.md). Companion docs: [Summary](summary.md) · [Tradition](tradition.md).*

The reason Deterding and Waters' (2018) proposal maps onto LLM affordances with unusual cleanliness is that the moves it proposes are precisely the moves that scale poorly under human-only labor at *N*>50. The mapping is not a happy accident; it follows from what indexing, analytic coding, and validation each ask of the analyst. Each of the three stages has a different relationship to LLMs, and the differences matter.

## Indexing at scale

Indexing is the most LLM-tractable move in the workflow, and the one where the affordance is largest. Assigning one or more of a small set of protocol-anchored topical codes to a passage is precisely what contemporary instruction-tuned language models are reliable at when given a clear codebook. Tai and colleagues (2024) document that LLM analysis can aid qualitative researchers by deductively coding transcripts, testing 160 iterations against human coders.[^tai] Qiao and colleagues (2024) found that deductive coding using ChatGPT was comparable to traditional coding when provided with a clear codebook and context.[^qiao] The empirical question — does an model assign the same index code that a trained human RA would assign, given the same protocol and codebook — is just that, an empirical question, and one recent studies have begun to answer with cautious affirmatives.

In this project the skill `/index-transcript` does this in seconds per transcript and produces both an indexed copy and a coverage report flagging where the conversation drifted away from the protocol. The downstream effects are larger than they first appear. Once a corpus is indexed, later analytic coding can target only the relevant ~20% — the proportion Deterding and Waters argue is the empirically reasonable focus.[^dw-share] Indexing also makes the corpus legible to later analysts: to the team member who joined after fieldwork, the secondary analyst with a different question, the reviewer who wants to verify what was looked at. This matters because qualitative data archiving — through the Qualitative Data Repository at Syracuse, the NIH Data Management and Sharing Policy (2023), NSF Data Management Plans — is steadily becoming a condition of funding.[^archiving] The gap between an archive's existence and the practical accessibility of its contents is, in part, an indexing problem.

## Analytic coding under researcher control

This is the stage where the framing matters most. The verb to refuse, across the workflow, is *discover*. The verb to keep is *apply*. If LLM-assisted analytic coding is sold as "discover the themes in this corpus," everything the field has learned about the limits of induction applies, and applies in a worse form, because the LLM is generating analytical insight in a way the researcher cannot inspect. If it is sold as "apply the researcher's codebook to these indexed sections, surface candidates for human review, and flag passages where the code does not quite fit," then it is the kind of human-augmenting move that framework analysis has defended for thirty years.[^framework-llm] Than and colleagues (2025), updating "The Future of Coding" for the LLM era, examine exactly this — whether instruction-tuned generative LLMs can replicate and augment the iterative qualitative process of alternating between deductive and inductive analysis, citing Deterding and Waters directly.[^than]

The interview-coding project does not yet ship a dedicated `/apply-codebook` skill — the workshop demo runs only the three skills described in [summary.md](summary.md). The design move when one is built will be the same: the researcher provides the codes; the model provides scale; every assigned code is traceable to a passage; disagreements are surfaced rather than hidden.

## Validation through exhaustive negative-case hunting

Stage 3 is the surprise. Deterding and Waters explicitly endorse Blee's standard that "data that diverge from the pattern are not discounted without a clear rationale to do so," a standard the qualitative literature has repeated since Katz (1982) and Luker (2008).[^blee][^katz][^luker] The standard is easy to state and hard to enforce. At *N*=4 a researcher can hold the negative cases in mind. At *N*=200 the exhaustive negative-case audit is honored more in citation than in practice, for the same reason any thorough human procedure honors itself in citation at scale: there are not enough hours. In practice, "engagement with negative cases" has often meant engagement with the cases the analyst happened to notice.

LLMs make it tractable. The skill `/find-negative-cases` takes a claim and the indexed corpus, returns respondents whose evidence cuts against the claim with verbatim excerpts and reasoning, and offers an implications-for-the-theory recommendation — narrow the claim, abandon it, or keep it but report the negative case in the eventual write-up. The reliability question shifts in a way worth noting: from "did the researcher think hard enough" to "given the typology and the corpus, what did the search return" — an answerable empirical question rather than a methodological article of faith. This is the move where LLM assistance most clearly augments rather than substitutes.

## Transparency and methods reporting

Deterding and Waters' single most-cited finding is that 17.3% of articles in their journal sample described no coding procedure at all, and only 39.7% mentioned which QDA software they used.[^dw-table2] The methodological literature has been calling for better methods reporting for two decades against a body of practice that has not noticeably improved. The reason it has not improved is that writing a defensible methods paragraph requires reconstructing a process from memory, weeks or months after the analysis was done, and the reconstruction has all the limits of unaided memory.

LLM-assisted coding pipelines leave a trace. Every code applied, every excerpt selected, every claim audited produces an artifact. The skill `/methods-paragraph` reads those artifacts and produces a 250–500 word methods paragraph that is honest about what was done and — equally important — about what was not. (If no inter-coder reliability was computed, the paragraph says so.) The methods paragraph Deterding and Waters wish more articles had is now writable, not because the researcher is more conscientious, but because the project state can report itself.

## What we are not claiming

The temptation in talking about LLM-assisted qualitative work is to over-describe what is happening. Three things are worth being explicit about, before any conversation with a senior methodologist.

LLMs do not "discover themes." The themes are what the researcher brings to the work — the prior reading, the theoretical commitments, the construct under analysis. The model applies and validates them at scale; the analysis remains the researcher's. The framing matters because the alternative framing — "the LLM found themes I missed" — is empirically false and would not survive contact with a senior methodologist for thirty seconds.

LLMs do not replace the immersive first read. Deterding and Waters are clear that flexible coding presupposes the researcher knows the corpus. So is anyone who has supervised an interview-based dissertation. The first pass — the slow, attentive, occasionally bewildered first reading of the transcripts — is irreducible. What the model does is what the researcher could not do alone afterward, at scale.

Quantification is not validation. Eight respondents using the word "stability" does not mean stability is a finding; it means eight respondents used that word. LLMs make counting easy; counting is still not analysis. Validity claims have to be made the way they have always been made — through engagement with the data and with the negative cases.

## The hard problems

The credibility of any LLM-assisted-coding proposal depends on naming the difficulties honestly. Five are worth raising in any conversation with a senior methodologist.

**IRB and the data-transfer question.** As Davison and colleagues (2024) note, entering participant data into a commercial LLM is itself a data transfer, and consent should reflect this; IRB guidance remains uneven.[^davison] Most interview studies were consented under language that did not anticipate transmission of transcript text to third-party model APIs. For corpora collected under earlier consent regimes — including most archived data — the question of whether secondary analysts can use LLM-assisted methods is genuinely open, and currently being worked out in IRB offices on a case-by-case basis. Locally hosted open-source models, increasingly viable, are one path through this; explicit consent language is another; institutional enterprise agreements with model vendors are a third.

**Reproducibility and version stability.** Models change. The same prompt run against the same transcript on the same model name, six months later, can produce different coding. Pinning model versions, archiving prompts and codebooks alongside data, and treating the model as a versioned dependency are partial answers.

**Researcher trust.** How does one convince a peer reviewer that what the LLM did is what a careful human would have done? Honestly: by reporting reliability metrics calibrated against a subset of human-coded transcripts, and by showing that analytic insights are reviewable on inspection. The field will need to develop shared vocabulary for this kind of reporting, and several recent papers are beginning to do that work.[^than][^tai][^misra]

**The construct-validity feedback loop.** This is the most interesting hard problem. Deterding and Waters' validity machinery assumes the researcher is reading enough of the corpus, with enough care, that they can *feel* when a typology stops fitting. If indexing is LLM-mediated, does the researcher still develop that tacit feel? Probably only if the workflow is designed to preserve it — if the researcher reads fully and codes by hand some calibration subset before the model extends their work, and if validation forces them back into close reading of cases the typology fails on. A workflow that simply hands transcripts to a model and accepts the output undermines the judgment that gives flexible coding its warrant. This will not solve itself; it has to be designed for.

**False fluency.** LLMs can produce plausible-sounding methods text and plausible-sounding analytic memos not supported by the underlying data. This is the failure mode that should worry qualitative researchers most, because the social cues that usually catch sloppy coding — a graduate student who cannot defend their choices in lab meeting, a methods section that reads as evasive — do not apply to model output. The mitigation is structural: every model-produced claim should be traceable to a specific passage, every analytic code reviewable against the corpus, every methods paragraph auditable against the log of coding decisions. The skills in this project enforce that discipline; not every LLM-assisted workflow will.

---

These problems are not arguments against the move. They are the methodological work that has to happen alongside it, in the same way the validity machinery of grounded theory had to be built up over decades after Glaser and Strauss's first proposal. Deterding and Waters wrote their paper to liberate a generation of interview researchers from a methodological inheritance that no longer fit the work they were actually doing. The LLM extension is, at its best, more of the same liberation: relieving the parts of the workflow that scale poorly, preserving the parts where researcher judgment is the whole point, and making transparent what was previously buried. The line between what the researcher does and what the tools do is movable. It has moved before. Where it moves next depends less on what the models can do than on what the methodological community decides counts as good work.

---

*Interview coding overview: [Summary](summary.md) · [Tradition](tradition.md) · [Affordance](affordance.md). Back to the [project landing page](../index.md).*

[^tai]: Tai, R. H., Bentley, L. R., Xia, X., Sitt, J. M., Fankhauser, S. C., Chicas-Mosier, A. M., & Monteith, B. G. (2024). "An Examination of the Use of Large Language Models to Aid Analysis of Textual Data." *International Journal of Qualitative Methods* 23.
[^qiao]: Qiao, S., et al. (2024). "Comparing ChatGPT and Trained Human Coders in Qualitative Deductive Analysis." *Qualitative Health Research*, advance online publication.
[^dw-share]: Deterding & Waters (2018), p. 729, on the analytic-coding stage targeting only the indexed-relevant fraction of the corpus.
[^archiving]: Qualitative Data Repository at Syracuse (qdr.syr.edu); NIH Data Management and Sharing Policy (effective January 2023); NSF Data Management Plan requirements.
[^framework-llm]: Framework analysis (Ritchie & Spencer 1994) has long performed a structurally similar move — indexing transcripts to a thematic framework before analytic coding — and its workflows port to LLM assistance with relatively little adjustment.
[^than]: Than, N., Fan, L., Law, T., Nelson, L. K., & McCall, L. (2025). "Updating 'The Future of Coding': Qualitative Coding with Generative Large Language Models." *Sociological Methods & Research*.
[^blee]: Blee, K. M. (2009). "Access and Methods in Research on Hidden Communities." Quoted in Deterding & Waters (2018), p. 731.
[^katz]: Katz, J. (1982). *Poor People's Lawyers in Transition*. Rutgers University Press.
[^luker]: Luker, K. (2008). *Salsa Dancing into the Social Sciences*. Harvard University Press.
[^dw-table2]: Deterding, N. M., & Waters, M. C. (2018). "Flexible Coding of In-depth Interviews: A Twenty-first-century Approach." *Sociological Methods & Research* 50(2): 708–739. Table 2, p. 719.
[^davison]: Davison, R. M., et al. (2024). "The Ethics of Using Generative AI for Qualitative Data Analysis." *Information Systems Journal* 34(5): 1433–1439.
[^misra]: Misra, R., et al. (2026). "Large Language Models in Qualitative Analysis: Comparing Traditional and Researcher-interpreted Approaches." *International Journal of Qualitative Methods*.
