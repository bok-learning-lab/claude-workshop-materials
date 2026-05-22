# Deep Research Prompt — Contextualizing flexible coding and its LLM successors

Use this as the prompt for an LLM Deep Research tool (Claude Deep Research, ChatGPT Deep Research, Perplexity Deep Research). The output is a contextualizing essay for workshop participants who have just seen a live demo of LLM-assisted qualitative coding built around Deterding & Waters' (2018) flexible-coding paper.

---

## Prompt

Produce a contextualizing essay of **2,500–3,500 words** for an audience of social science and humanities faculty who have just attended a workshop demonstration of LLM-assisted qualitative interview coding. The demo was built around **Deterding, N. M., & Waters, M. C. (2018). "Flexible Coding of In-depth Interviews: A Twenty-first-century Approach." *Sociological Methods & Research* 50(2): 708–739.**

The essay should be defensible to a senior qualitative methodologist (Mary Waters herself is in the audience). Do not oversell LLMs. Frame LLM affordances as augmenting researcher judgment, not replacing it. Take grounded theory's critics seriously *and* acknowledge that grounded theory — especially Charmaz's constructivist variant — remains a vital tradition. The point is not that grounded theory is wrong but that its prescriptions for *coding* were shaped by 1960s technology and no longer fit the empirical realities of contemporary interview research (large N, teams, mixed methods, data archiving, secondary analysis).

The essay must accomplish three things, in this order.

### Part 1 — The methodological tradition Deterding & Waters are addressing (~1,000 words)

Trace the intellectual history of qualitative coding in social science. At minimum, cover:

- **Grounded theory's origins.** Glaser and Strauss (1967), *The Discovery of Grounded Theory*. Why it became influential in the late 20th century: a systematic response to what mid-century positivists dismissed as "biased, impressionistic, and anecdotal" qualitative work.
- **The internal split inside grounded theory.** Glaser's continued emphasis on pure induction (1992, 1998, 2005); Strauss & Corbin's (1990) more systematic and validation-oriented procedure; Charmaz's (2000, 2006) "constructivist grounded theory."
- **The line-by-line / open–axial–selective coding pipeline** as actually taught in graduate qualitative methods seminars, and what it produces in practice.
- **The technological substrate.** Coloured pens, scissors, index cards on the dining-room table; the move to word processing in the 1980s; the rise of QDA software (NVivo, ATLAS.ti, Dedoose) in the 1990s–2000s; the path-dependence that locked QDA software into reproducing 1960s workflows in electronic form.
- **The "epistemological fairytale."** Loïc Wacquant's (2002) phrase, picked up by Deterding & Waters: the claim that researchers can or should enter the field with no theoretical commitments and let theory emerge purely from data. Why this claim is honored more in citation than in actual practice — Deterding & Waters' analysis of 98 ASA-sponsored articles found 55% used phrases like "inductive" or "emergent" without specifying methodology.
- **Adjacent and successor traditions.** Thematic analysis (Braun & Clarke 2006); framework analysis (Ritchie & Spencer 1994; widely used in UK health services research); abductive analysis (Timmermans & Tavory 2012); interpretive phenomenological analysis (Smith 1996); narrative analysis (Riessman 2008); the constant comparative method; Miles & Huberman's (1994) display-matrix approach.

Make the lineage legible to readers who are not sociologists. Concrete examples of what each tradition actually *does on a transcript* (what gets marked, on what basis, at what level of granularity) would help.

### Part 2 — What Deterding & Waters propose, and why now (~700 words)

Summarize their core argument with specifics:

- **The diagnosis.** Three structural mismatches between grounded theory's prescriptions and contemporary practice: large interview samples (often N > 100; median 55 in their journal sample, max 208), team-based coding, mixed-methods integration. Their Table 1 (p. 718) is the empirical anchor.
- **Flexible coding's three stages.** Indexing (Stage 1) before analytic coding (Stage 2) before validation (Stage 3). Why starting *big* — broad index codes anchored to the interview protocol's sections — rather than line-by-line is more compatible with QDA software's actual affordances and with team workflows.
- **Three distinct kinds of codes.** Attributes (respondent-level demographic and contextual variables), index codes (broad protocol-anchored topics), analytic codes (concepts that drive the eventual argument). The distinction matters because each plays a different role and, as the essay will argue in Part 3, admits a different level of LLM involvement.
- **The validity machinery.** Construct validity through typology refinement (Deterding 2015's instrumental/expressive/mixed example); theoretical validity through engagement with negative cases (Katz 1982; Luker 2008; Blee 2009 — Deterding & Waters explicitly endorse Blee's standard that "data that diverge from the pattern are not discounted without a clear rationale to do so").
- **What flexible coding asks of the researcher.** Theoretical engagement before fieldwork — not in defiance of induction but as honest accounting of what interview researchers actually do.
- **Limits.** Deterding & Waters explicitly note that flexible coding is not appropriate for very small samples (N < 30), purely phenomenological work, or projects where the data are mainly illustrative supplements to a quantitative argument. Quote their explicit caveats on p. 734.

### Part 3 — Where LLMs extend the tradition, and into which adjacent fields (~1,200 words)

The methodological frame Deterding & Waters propose maps unusually well onto LLM affordances, *because the moves they propose are exactly the moves that scale poorly under human-only labor at large N*. Walk through the connections, by stage:

- **Indexing at scale.** Why this is the most LLM-tractable stage and why doing it well opens up secondary analysis and team workflows that are currently prohibitive. Connect this to data archiving mandates from NSF, NIH, and the Qualitative Data Repository at Syracuse.
- **Analytic coding under researcher control.** How LLM-assisted analytic coding can preserve researcher judgment if framed as "apply the researcher's codes to indexed sections" rather than "discover themes." Cite recent commentary on the difference (e.g., Bail 2016 on computational social science; Chakrabarti & Frye 2017 on mixed-methods computational text analysis).
- **Validation through exhaustive negative-case hunting.** A move that the methodological literature requires (Katz, Luker, Blee) but that is practically impossible to do exhaustively at N = 200. LLMs make it tractable. The reliability question becomes "did the LLM find what a human would have found, given enough time" — an empirically testable claim rather than a methodological article of faith.
- **Transparency and methods-section reporting.** Deterding & Waters' central complaint — 17.3% of articles in their sample described no coding procedure at all (Table 2, p. 719); only 39.7% mentioned QDA software — becomes an LLM-tractable problem. Tracked decisions during the coding pipeline can be auto-summarized into reportable form.

Then extend the argument *beyond sociology* to related fields that do interview-based or transcript-based work and would benefit from the same affordances. For each field, identify (a) what kind of coding work is most common, (b) which Deterding-Waters move is most relevant, and (c) which LLM affordance maps onto it.

- **Anthropology** — ethnographic fieldnotes, semi-structured interview corpora; tension between thick description and systematic coding; substantial overlap with sociology in methodological commitments.
- **Education research** — teacher interviews, classroom observations, student focus groups; growing pressure from mixed-methods policy work for systematic coding.
- **Public health, nursing research, and qualitative health services research** — among the largest qualitative literatures globally; heavy use of NVivo and Dedoose; strong existing tradition of framework analysis that already does many of the moves Deterding & Waters propose.
- **Communication and media studies** — audience reception research, message analysis, organizational communication.
- **HCI and UX research** — qualitative user research is a core practice; the field is already pragmatic about coding and would absorb LLM affordances quickly.
- **Marketing and consumer research** — closely related methodological practices, different audience and publication venues; "qualitative consumer insight" overlaps substantially with academic interview research.
- **Political science** — interpretive policy analysis, elite interviews, expert interviews, oral histories.
- **Organizational studies and management research** — long tradition of qualitative case-study work (Eisenhardt 1989; Yin 2014).
- **Religious studies, area studies, and language-community ethnography** — interview-based ethnographic work in non-English-speaking communities; LLMs additionally enable translation-assisted coding for non-English transcripts (this is a meaningful affordance the original Deterding & Waters paper does not address).
- **Digital humanities-adjacent fields** — where the move from close to distant reading already runs in parallel to the move from line-by-line to indexed coding, and where the conceptual machinery for LLM-assisted scholarship is already partly worked out.

Close with the **hard problems** that the field still needs to work through — these are the questions a senior methodologist will press on, and the essay's credibility depends on naming them:

- IRB and consent issues with sending interview data to model APIs.
- Reproducibility and version stability — different model versions producing different codings.
- Researcher trust: how to convince a reviewer that what the LLM did is what a human would have done.
- The data-protection question for archived corpora: secondary analysts running LLM-assisted analyses on data collected under earlier consent regimes.
- The risk of false fluency: LLMs producing plausible-sounding methods text without supporting evidence.

## Formal requirements

- **Length:** 2,500–3,500 words, divided into the three parts above with explicit subheadings.
- **Citations:** academic citation style (APA or Chicago author-date). Include full bibliographic information for at least 20 sources spanning (a) classical methodological texts, (b) exemplar empirical interview studies in multiple fields, and (c) recent methodological commentary on LLM-assisted qualitative work (2022–2026).
- **Tone:** scholarly but accessible. The audience is faculty across disciplines, some of whom have never done qualitative coding and others who have published in it for decades. Do not assume technical methodological vocabulary; gloss specialized terms on first use.
- **Honesty about LLMs.** Do not oversell. The contextualizing piece should be defensible to Mary Waters specifically. Frame LLM affordances as augmenting researcher judgment, not replacing it. Never use "discovering themes" or similar language that implies the LLM is generating analytical insight independent of the researcher.

## What NOT to produce

- A how-to guide for LLM-assisted coding (the audience already saw the demo).
- A polemic for or against grounded theory.
- Generic boosterism about "AI for research" or productivity claims.
- Anything that frames LLMs as discovering themes or substituting for researcher judgment.
- An exhaustive literature review — this is a contextualizing piece, not a methods review article.

## What to actively surface that is non-obvious

- Methodological work *outside sociology* that already performs the moves Deterding & Waters propose (e.g., framework analysis in UK health services research has done indexing-before-coding since the early 1990s; the essay should engage with this).
- Specific examples of large-N interview studies in adjacent fields where the indexing-first approach would have made a substantive empirical difference.
- Any published methodological commentary (2022–2026) on LLMs in qualitative research that the audience should know about — empirical studies of LLM coding reliability, position papers from major qualitative associations, IRB guidance, etc.
- The genuinely hard problems for LLM-assisted qualitative work, not just the easy wins.

---

## Notes for Marlon before sending

- Replace "Mary Waters herself is in the audience" with another framing if the prompt is being shared more widely than this workshop.
- Consider adding a specific named field or sub-discipline the recipient is most interested in, so the Part 3 extensions can be more targeted.
- The 20-citation minimum is deliberately demanding — Deep Research tools will produce shallower output if not pushed.
