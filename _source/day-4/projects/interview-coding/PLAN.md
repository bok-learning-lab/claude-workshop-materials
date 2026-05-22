# Plan — Interview coding skills for flexible-coding demo

Three Claude Code skills to build in parallel for the day-4 workshop demo of LLM-assisted flexible coding (Deterding & Waters 2018). Each task below is self-contained — copy a single section into a fresh Claude session to spawn a parallel build.

## Shared context (read first, all three tasks)

**What this project is:** a worked example of LLM-assisted qualitative coding aligned with Mary Waters' "flexible coding" approach. Mary is attending the workshop, so skills must match her methodological view: indexing before analytic coding, theory-aware rather than purely inductive, transparency in methods reporting, no "LLM discovers themes" framing.

**Required reading (in order):**

1. [claude-thoughts.md](claude-thoughts.md) — full brainstorm; especially Section A (testing coding systems), Section H (what to avoid in front of Mary), and Section I (skills catalog).
2. [inputs/README.md](inputs/README.md) — describes the synthetic corpus.
3. [inputs/protocol.md](inputs/protocol.md) — the semistructured interview guide.
4. The four sample transcripts in [inputs/transcripts/](inputs/transcripts/).
5. Optional deeper reference: the source paper at `/Users/mk/Desktop/deterding-waters-2018-flexible-coding-of-in-depth-interviews-a-twenty-first-century-approach.pdf`.

**Output convention:** each skill goes in its own directory under `.claude/skills/<skill-name>/` with at minimum a `SKILL.md`. Supporting files (templates, reference notes, example outputs) belong in the skill's directory. Each skill should include at least one worked example output from running it against the sample corpus, stored in `examples/`.

**Hard constraints (all three skills):**

- No emojis in any output.
- Do not pitch the skill as "discovering themes" — frame as "applying researcher's concepts," "surfacing candidates," or "auditing for X."
- Do not start with line-by-line open coding.
- Respondent IDs (R001…R004) and pseudonyms must be preserved consistently across all outputs.
- Use markdown link syntax for file references, e.g. `[R001](inputs/transcripts/R001-Transcript.md)`.

---

## Task 1 — Build `/index-transcript`

**The move:** Waters' Stage 1. Given a single transcript and the interview protocol, apply broad **index codes** (not analytic codes) that anchor sections of the transcript to the protocol's questions/topics. This is the scaffolding that later analytic coding rides on top of.

**Why it fits Waters:** her p. 726 advice is to start by indexing to the protocol's structure, not by line-by-line coding. The index lets later analytic passes target only the relevant ~20% of transcripts (p. 729).

**Skill behavior:**

- **Input:** a transcript file path (e.g. `inputs/transcripts/R001-Transcript.md`). Optionally a protocol path; default to `inputs/protocol.md`.
- **Output:**
  1. An annotated copy of the transcript with index-code headers inserted at section boundaries (written to `output/indexed/<respondent_id>-Indexed.md`).
  2. A coverage report listing which protocol sections appear, which are missing, and where the conversation drifted away from the protocol (written to `output/indexed/<respondent_id>-Coverage.md`).
- **What good output looks like:** index codes match the protocol's section labels (`background-education`, `kids`, `hopes-after-hs`, `college-meaning`, `sources-of-advice`, `worries-barriers`, `reflections`). Each labeled section cites the line range it covers. Drift is flagged but not "fixed."
- **What to avoid:** do not apply analytic codes (e.g. "instrumental," "expressive") at this stage. Do not chunk smaller than the protocol's natural sections. Do not summarize the content — the index is a navigation layer, not a digest.

**Validation:** run the skill against all four transcripts and verify (a) every protocol section is either indexed or explicitly flagged as missing, (b) the indexed transcripts can be diffed against the originals with only header insertions, no content changes.

**Build location:** `.claude/skills/index-transcript/`.

---

## Task 2 — Build `/find-negative-cases`

**The move:** Waters' Stage 3 validation step (p. 731). Given a working claim and the indexed corpus, identify respondents whose evidence cuts against the claim, with excerpts and reasoning. Implements the Katz / Luker / Blee requirement that negative cases be explicitly treated.

**Why it fits Waters:** her central rigor claim — "data that diverge from the pattern are not discounted without a clear rationale to do so" (Blee 2009, quoted p. 731). Currently almost impossible to do exhaustively at N=200; very tractable at N=4 for demo purposes.

**Skill behavior:**

- **Input:** a claim/hypothesis (string), and a corpus directory. Default corpus: `inputs/transcripts/`.
- **Output:** a memo at `output/negative-cases/<short-claim-slug>.md` containing:
  1. The claim as stated.
  2. For each respondent whose evidence cuts against the claim: the respondent ID, the excerpts with line references, and a 2–4 sentence reasoning paragraph explaining *how* the evidence cuts against the claim.
  3. A closing "implications for the theory" section: should the claim be (a) abandoned, (b) narrowed in scope, (c) kept but with explicit treatment of the negative case in the eventual write-up?
- **What good output looks like:** the demo claim "instrumental mothers reject family/emotional framing of college" should surface **R004 (Denise)** as a negative case — her reasoning is instrumental but her vocabulary is heavily emotional/family-centered. The reasoning paragraph should explain that distinction. Quotes must be verbatim from the transcript.
- **What to avoid:** do not invent quotes or paraphrase them as if they were verbatim. Do not dismiss negative cases ("only one respondent…") — Waters explicitly cautions against this. Do not stop after finding one negative case if more exist.

**Validation:** test the skill on at least two claims:

1. "Instrumental mothers reject family/emotional framing of college" (expected negative case: R004).
2. "Mothers who attended community college themselves push their children toward four-year schools" (expected: should find evidence on both sides, since R001 attended community college and pushes trade; R003 attended community college and pushes four-year).

**Build location:** `.claude/skills/find-negative-cases/`.

---

## Task 3 — Build `/methods-paragraph`

**The move:** generate a methods-section paragraph from the actual coding pipeline that's been run on a project. Directly addresses Deterding & Waters' central complaint that methods sections are opaque (p. 718, Table 2: 17.3% of articles described no coding procedure at all).

**Why it fits Waters:** the paper's core argument is that twenty-first-century qualitative research needs to communicate the logical steps of data analysis transparently (p. 721). This skill is the artifact that pays off all the other skills' record-keeping.

**Skill behavior:**

- **Input:** a project directory (default: current working directory). The skill inspects `inputs/`, `output/indexed/`, `output/negative-cases/`, and any `codebook.md` to learn what was actually done.
- **Output:** a methods paragraph at `output/methods/methods-paragraph.md`, 250–500 words, suitable for pasting into a journal article's Methods section. Includes:
  - N respondents, sampling frame, attribute coverage.
  - Indexing procedure (per Waters' Stage 1) — which protocol sections, what software/tool, how coverage was verified.
  - Analytic coding procedure — what codes were applied, on what fraction of the transcripts, by what process.
  - Validation steps taken — negative-case analysis, typology refinement, etc.
  - Anything that was *not* done (be honest — if no inter-coder reliability was computed, say so).
- **What good output looks like:** the paragraph reads like the methods section Deterding & Waters wish more papers had. It is specific ("we read approximately 23% of the full transcripts during the analytic coding stage, focusing on sections indexed under `hopes-after-hs` and `college-meaning`") rather than vague ("we coded the data thematically").
- **What to avoid:** do not invent details the project state doesn't actually support. Do not claim reliability metrics that weren't measured. Do not gesture at "grounded theory" — the entire point of this approach is to stop doing that.

**Validation:** run the skill on the project as-it-stands (after Tasks 1 and 2 have produced their outputs) and verify the generated paragraph accurately describes what was done. Run it again on an empty project to confirm it correctly reports the absence of analysis rather than fabricating one.

**Build location:** `.claude/skills/methods-paragraph/`.

---

## After all three are built

Build a `/demo` companion skill (or just a top-level `DEMO.md` in this project) that runs the three skills end-to-end on the sample corpus for live workshop use:

1. `/index-transcript` on all four transcripts → produces `output/indexed/`.
2. `/find-negative-cases` on the demo claim about instrumental mothers and emotional framing → produces the memo that catches R004.
3. `/methods-paragraph` against the project state → produces the transparency artifact.

That sequence is the three-act demo: scaling, rigor, transparency. Each act is a direct response to one of Deterding & Waters' three main complaints about the field.
