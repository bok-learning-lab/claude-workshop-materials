# Claude's thoughts: LLMs + Claude Code for flexible coding (Deterding & Waters 2018)

Brainstorm of ways to use LLMs (and Claude Code specifically) for the kind of disciplinary work Deterding & Waters describe — in-depth interview coding at scale, aligned with their "flexible coding" approach rather than grounded theory.

Source: Deterding, N. M., & Waters, M. C. (2018). "Flexible Coding of In-depth Interviews: A Twenty-first-century Approach." *Sociological Methods & Research*, 50(2), 708–739.

## Framing: where LLMs slot into the Waters pipeline

Waters' three stages give us natural seams — and a clear constraint: **the LLM should not do the immersive first read for the human, and it should not do open coding line-by-line.** That's the grounded-theory antipattern she's pushing against. The LLM is most aligned with her view when it operates *after* a researcher has formed concepts, and when it makes the audit trail more transparent rather than less.

## A. Testing new coding systems against ground

1. **LLM-as-second-coder for an analytic code, with disagreement as the signal.** Human develops the code + definition on a subset. LLM applies it to held-out transcripts. Don't report κ as the headline — surface the disagreements as candidates for code refinement. This is what Campbell et al. 2013 (cited in the paper) called for but at human-grad-student cost.

2. **Typology stress-test.** Take Waters' instrumental / expressive / mixed typology (or the African American / ethnic American / immigrant-identified one from *Ethnic Options*). Have the LLM independently assign each respondent and write its evidentiary justification. Surface every case where it disagrees with the human classification — those are the construct-validity warnings she describes at p. 731.

3. **Negative-case hunting at scale.** Once a working theory exists ("low-income mothers with expressive logic pursue X"), point the LLM at the full corpus and ask: *find me respondents whose evidence cuts against this.* This is the Katz/Luker/Blee requirement she names (p. 731) — currently almost impossible to do exhaustively at N=200.

4. **Alternative-explanation probes.** For each main claim in a paper draft, generate the two or three competing explanations the data could support, and surface transcript evidence for each. Forces the researcher to rule them out on the record.

5. **Construct-validity audit.** "Show me every quote you used to classify R047 as instrumental. Now show me the strongest counter-quotes from the same transcript." Mirrors exactly what she did manually for misclassifications.

## B. Scaling up coding systems (Waters' actual workflow, just bigger)

6. **Automated indexing to the interview protocol.** Her Stage 1: every transcript indexed to the protocol's broad chunks (childhood-neighborhood, evacuation-experience, physical-and-mental-health). LLMs do this trivially well; humans verify the edge cases where conversation drifted. This is the "easily distributed among team members" point on p. 723 — the LLM is just an additional team member.

7. **Respondent-level memos as a draft, not a finished product.** After indexing, generate a first-pass memo per respondent that the human edits. The memos are *hers*; the boilerplate is automated. Preserves the "case as case study" framing (Small 2009) without the grind.

8. **Cross-case thematic memos with citations.** Generate cross-case patterns *with respondent IDs and excerpts attached* — the researcher can then collapse, reject, or develop.

9. **Attributes spreadsheet construction from screening sheets + transcripts.** Demographics, site, experimental condition, etc. — extract once, validate, import to NVivo/ATLAS.ti/Dedoose.

10. **"Great quote" / "aha" surfacing.** She singles this out (p. 727). LLM is genuinely good at this — give it the working concepts and let it nominate quotes. Human curates.

11. **Question-by-question coverage matrix.** Her p. 727 trick: NVivo's matrix coding query to spot transcripts missing answers to a given protocol question. LLM can do this on raw text without QDA software at all.

## C. The hybrid move — grounded benefits, Waters epistemology

The interesting territory. Waters explicitly says she's not anti-emergence, she's anti-the-fairytale-that-you-start-with-no-prior-theory. So:

12. **Theory-aware emergence.** Give the LLM both the prior literature and the transcripts and ask: *what is here that the literature does not predict?* This is Timmermans & Tavory's abduction, mechanized. Surprise-detection against a stated theoretical background, not against a blank slate.

13. **Saturation checks.** After every N interviews, ask: *do the last 10 add new conceptual content beyond the first 50, or just more instances?* Helps with Glaser-Strauss saturation in a way the original method never operationalized.

14. **Theoretical sampling assistance.** Given the current indexed corpus and the attribute spreadsheet, *which interviews should I read next to maximize information gain about hypothesis X?* This is grounded theory's theoretical sampling, but tractable on a 200-interview pile.

15. **Multi-codebook exploration.** Generate three candidate codebooks from the same indexed data using different theoretical starting points (e.g., Bourdieu vs. Lareau vs. straight rational-choice). The researcher picks; the rejected ones document the analytic decision.

## D. Transparency and methods-section reporting (her central complaint)

16. **Auto-generated methods paragraph.** Track the indexing decisions, the codebook versions, the coder agreements, and emit the paragraph Deterding & Waters wish more papers had — including "we read X% of the full transcripts for analytic coding" (her Sociology of Education paper used 20%).

17. **Per-claim provenance.** Every claim in a paper draft links to (a) the analytic code, (b) the index sections, (c) the count of respondents whose evidence supports it. Reviewer-readable audit trail.

18. **Coding decision log.** When the codebook changes, capture *why* — the memo trail that's currently the most fragile part of the process.

## E. Secondary analysis & archiving (her funder-mandated concern)

19. **Index-only archives.** Per p. 728 — produce the "attribute + index codes only" version of the project for archive/team distribution, automatically.

20. **Cross-study codebook translation.** Two researchers, two studies, overlapping concepts. LLM proposes mappings between codebooks. Enables the kind of secondary work she points out is "rarely taken advantage of."

21. **Onboarding a secondary analyst.** Generate a guided tour of an archived corpus: what's here, how it was collected, what's already been published, what's untouched.

## F. Team workflows (her RISK reality)

22. **Distributed indexing with LLM tiebreaking.** Two grad students index; LLM adjudicates disagreements with a written rationale; PI reviews adjudications. Cheaper than her three-coder-with-reconciliation setup (Price & Smith 2017).

23. **Disagreement surfacing across coders.** Treat coder disagreements as theoretical signal, not noise. LLM clusters disagreement patterns.

## G. Claude Code–specific affordances

24. **Skills per stage.** `/index-transcripts`, `/respondent-memo`, `/cross-case-memo`, `/find-negative-cases`, `/great-quotes`, `/methods-paragraph`. Each skill encodes Waters' procedure so a non-methodologist student can run it.

25. **Parallel subagents over transcripts.** One subagent per transcript for indexing; results merged. The N=200 problem becomes N=1, 200 times.

26. **Codebook-as-file.** A living `codebook.md` Claude reads on every session. Version-controlled. The codebook becomes the audit trail.

27. **Hooks for data hygiene.** PreToolUse hook blocking writes that contain PII; blocking sharing of raw transcripts outside an `archive/` directory.

28. **MCP to NVivo / ATLAS.ti / Dedoose.** Round-trip — apply codes in Claude, sync to the QDA tool the team actually uses. (Doesn't exist yet, but is a buildable project.)

29. **Plan mode for analytic decisions.** Before any coding pass, Claude proposes the plan; researcher approves. Documents the analytic choice.

## H. Things to flag *against* in front of Mary

To stay credible with her view:

- Don't pitch "the LLM discovers themes" — she'll (correctly) call that the epistemological fairytale again. Pitch it as "the LLM applies a researcher's concepts at scale" or "surfaces candidates the researcher evaluates."
- Don't replace the immersive first read. The respondent-level memos are *generated* by the analyst sitting with the transcript. The LLM augments cross-case memos and the second-pass analytic coding.
- Don't oversell quantification. She explicitly cautions against it on p. 734.
- Don't use line-by-line open coding as the entry point. Index first, analytic-code second — same as her.

---

## I. Candidate skills (SKILL.md files)

Waters' workflow is unusually well-suited to skills because it's an explicit multi-stage procedure with named artifacts at each stage. A skill encodes "the Deterding-Waters way of doing X" so a grad student (or Mary herself, six months into a project) can invoke it consistently. Organized by her stages.

### Setup / corpus prep

- **`/new-interview-study`** — Scaffolds a project: `transcripts/`, `attributes.csv`, `codebook.md`, `memos/respondent/`, `memos/cross-case/`, `output/`, plus a starter `protocol.md`. Normalizes filenames to `R001-Transcript.md` so attributes import cleanly (her p. 723 advice). *Why it fits:* her opening move in any new project, currently done by hand or by lab convention.

- **`/import-transcripts`** — Takes a folder of raw transcripts (Word/PDF/txt), normalizes to her naming convention, extracts speaker tags, optionally adds timestamps for outsourced transcripts (her p. 724 tip).

- **`/build-attributes`** — Extracts demographic/contextual attributes from screening sheets, transcripts, or survey exports into a single `attributes.csv` ready to import to NVivo/ATLAS.ti. *Why it fits:* the attribute spreadsheet is the spine of her cross-case analysis (p. 725).

### Stage 1 — Indexing & memos

- **`/index-transcript`** — Given an interview protocol and a transcript, apply broad index codes to chunks of text. Flags drift (places where the conversation wandered from the protocol). Output: a structured map plus the indexed transcript.

- **`/index-coverage`** — Run across the corpus: produce a matrix of "which transcripts seem to be missing answers to which protocol questions" — her p. 727 NVivo trick, but on raw markdown.

- **`/respondent-memo`** — First-draft respondent-level memo for the analyst to revise. *Important:* framed as draft, not finished memo. Memo template based on her p. 727 description (case as case study, Small 2011).

- **`/cross-case-memo`** — On a given index code (e.g., "evacuation experiences"), produce a cross-case thematic memo with respondent IDs and excerpts attached for every claim.

### Stage 2 — Analytic coding

- **`/codebook`** — Maintains a versioned `codebook.md` (code name, definition, examples, exclusions, when it changed and why). The audit trail Deterding-Waters say should be public.

- **`/apply-code`** — Apply a single analytic code (with definition) to indexed sections of all transcripts. Output: excerpts with respondent ID and section reference. Limits itself to indexed sections — preserves her "20% of the full transcripts" efficiency (p. 729).

- **`/typology-assign`** — Assigns each respondent to a typology category with evidentiary justification, mirroring her instrumental/expressive/mixed move (p. 730). Adds the classification to `attributes.csv` so it becomes queryable.

- **`/code-reliability`** — Two coders, one code: surface disagreements with side-by-side excerpts. Disagreements as theoretical signal, not noise.

### Stage 3 — Validation, testing, refining

- **`/find-negative-cases`** — Given a working claim, find respondents whose evidence cuts against it. The Katz / Luker / Blee requirement (p. 731), at corpus scale. **Strongest demo candidate for Mary.**

- **`/alternative-explanations`** — For a claim in a draft, propose two or three competing explanations and surface transcript evidence for each.

- **`/construct-validity-check`** — For a typology, surface boundary cases that might be misclassified. Mirrors her revision step on p. 731.

- **`/saturation-check`** — At current N, do the last 10 interviews add new conceptual content or only new instances? Operationalizes Glaser-Strauss saturation in a way the original never did.

### Reporting / transparency

- **`/methods-paragraph`** — Generates a methods-section paragraph from the actual coding pipeline (versions of codebook, indexing decisions, % of transcripts read for analytic coding, coder agreement). Directly addresses her central complaint that methods sections are opaque (p. 718, Table 2).

- **`/claim-provenance`** — For each claim in a draft, link to (a) the analytic code, (b) the index sections it draws on, (c) the count of respondents whose evidence supports it. Reviewer-readable audit trail.

- **`/great-quotes`** — Surface concise, articulate, poignant quotes for a given concept. Her p. 727 "great quote / aha" code, automated. Easy demo, hard to argue against.

### Archiving / secondary analysis

- **`/prepare-archive`** — Produce the "attributes + index codes only" version of the project for archive or team distribution (her p. 728 recommendation). Strips analyst-specific analytic codes.

- **`/secondary-analyst-tour`** — For a colleague joining the project or accessing an archived corpus: guided summary of what's here, how it was collected, what's already published, what's untouched.

- **`/codebook-translate`** — Given two studies' codebooks, propose mappings. Enables the secondary analysis she says is "rarely taken advantage of" (p. 710).

### Mixed methods (the RISK pattern)

- **`/link-survey-to-interview`** — Connect quantitative survey responses to interview transcripts by respondent ID, producing the NVivo-style "classification sheet" view (her p. 725 Morris & Deterding move).

### Teaching

- **`/explain-flexible-coding`** — Walks a beginner through Deterding-Waters on a sample transcript. Useful for the workshop itself, and for Mary's own grad students.

## J. MCP servers that would amplify these skills

Skills work on local files; MCPs reach into the tools researchers already use. The high-value MCP targets:

- **NVivo / ATLAS.ti / Dedoose MCP** — Read/write codes, attributes, and run queries from Claude. Round-trip from local skill output into the team's QDA tool. Doesn't exist yet, but Dedoose has the most plausible API surface.
- **Zotero MCP** *(exists)* — Critical for her workflow. The literature side of an abductive analysis lives in Zotero; Claude should be able to read her library and pull citations directly into memos.
- **Harvard Dataverse / ICPSR / Qualitative Data Repository MCPs** — For discovery and archiving of qualitative datasets. Would make secondary analysis dramatically more tractable.
- **Whisper / Rev / Otter MCP** — Audio-to-transcript pipeline. Her p. 724 note about transcribing inside NVivo points at the value of integrated audio handling.
- **REDCap MCP** — Survey instrument and response data, for mixed-methods projects of the RISK type.
- **IRB / institutional compliance MCP** — Probably doesn't exist; would handle protocol-aware redaction and consent tracking. Big unmet need.

---

**Suggested next step:** pick 2–3 of these to actually demo with a sample transcript or two during the workshop — Mary will believe a working `/find-negative-cases` she can poke at far more than a slide deck. Strongest demo trio: `/index-transcript` (shows scale), `/find-negative-cases` (shows rigor), `/methods-paragraph` (shows transparency).
