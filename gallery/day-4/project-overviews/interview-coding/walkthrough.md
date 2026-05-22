# How we built it — a five-prompt walkthrough

*A record of the conversation steps that produced the interview-coding project. For workshop participants and colleagues who want to see the process of using Claude Code for this kind of project, not just the final outputs.*

The whole sequence took one conversation, about an hour of back-and-forth, five prompts.

---

## Step 1 — Brief Claude on the domain

> Can you read this PDF and keep it in context: `/Users/mk/Desktop/deterding-waters-2018-flexible-coding-of-in-depth-interviews-a-twenty-first-century-approach.pdf`. Then help me think of a whole bunch of ways to make use of LLMs and Claude Code in particular for disciplinary work of this sort — either testing new coding systems against grounded, or scaling up new coding systems, maybe even getting to something that has some of the supposed benefits of grounded while aligning with Waters. Mary is at our workshop so we want to think of things that really align with her views and approach.

**What happened:** Claude read all 32 pages of the Deterding & Waters paper, then produced a brainstorm of ~30 LLM use cases organized around Waters' three-stage workflow (indexing → analytic coding → validation). The brainstorm explicitly flagged moves to *avoid* in front of Mary — for instance, never pitch LLMs as "discovering themes," because that's the "epistemological fairytale" the paper argues against.

**The move worth noticing:** giving Claude a single dense methodological source — *and* naming the human in the room whose views matter — produces far more aligned output than a generic "help me think about qualitative coding." The paper acts as a constraint; Mary's presence acts as a second constraint.

---

## Step 2 — Capture the thinking in a document

> Can you put all of these in a claude-thoughts doc so I can read more easily?

**What happened:** Claude wrote [claude-thoughts.md](../../projects/interview-coding/claude-thoughts.md) with the full brainstorm, organized into sections A through H — covering testing coding systems against ground, scaling up coding, hybrid grounded-but-Waters-epistemology moves, transparency and methods reporting, secondary analysis, team workflows, Claude Code–specific affordances, and a section H listing things to flag *against* in front of Mary.

**The move worth noticing:** brainstorming in chat is fast, but chat scrolls away. Asking Claude to commit the thinking to a markdown file turns it into a durable artifact that future Claude sessions can read — and that you can share with collaborators.

---

## Step 3 — Drill into a specific affordance (skills)

> Can you also think of Claude SKILL.md files that would be useful? Today we are talking about skills and MCPs, so I'm wondering what could help someone like Mary do her research.

**What happened:** Claude added Sections I (skills catalog) and J (MCP candidates) to the same doc. About twenty candidate skills, each tied back to a specific page or move in the paper — `/index-transcript` for Stage 1, `/find-negative-cases` for the Katz/Luker/Blee rigor requirement on p. 731, `/methods-paragraph` to address the opaque-methods complaint on p. 718, and so on. Closed with a recommended three-skill demo trio.

**The move worth noticing:** once you have a brainstorm, ask Claude to *zoom in* on a specific category and reapply the same alignment constraints. Each skill ties back to a citation, which makes the recommendations defensible rather than vibes.

---

## Step 4 — Build a sample corpus

> Can you also generate some sample transcripts, or find some online?

**What happened:** Claude explained why generating is better than finding (real transcripts are IRB-restricted or in gated archives, and the public ones are stripped of conversational texture), then produced four synthetic transcripts modeled on Deterding's actual published study of low-income mothers planning their kids' college paths. Each transcript was designed to showcase a specific demo move:

- [R001 Tasha](../../projects/interview-coding/inputs/transcripts/R001-Transcript.md) — textbook instrumental
- [R002 Marisol](../../projects/interview-coding/inputs/transcripts/R002-Transcript.md) — textbook expressive
- [R003 Carla](../../projects/interview-coding/inputs/transcripts/R003-Transcript.md) — mixed, self-aware about the tension
- [R004 Denise](../../projects/interview-coding/inputs/transcripts/R004-Transcript.md) — instrumental reasoning dressed in emotional/family language. Designed to trip up a naive coder — the construct-validity stress test

Plus [protocol.md](../../projects/interview-coding/inputs/protocol.md) (the interview guide), [attributes.csv](../../projects/interview-coding/inputs/attributes.csv) (the demographic spreadsheet), and a [README](../../projects/interview-coding/inputs/README.md) documenting design choices.

**The move worth noticing:** for a methods demo, synthetic data designed to surface specific challenges is more useful than real data. Claude can generate transcripts at the right length for live workshop reading and engineer specific edge cases — like Denise — that let you show what a skill is actually doing.

---

## Step 5 — Convert the brainstorm into a parallelizable plan

> Also add the three skill ideas to PLAN.md so I can get different Claudes working in parallel.

**What happened:** Claude wrote [PLAN.md](../../projects/interview-coding/PLAN.md) as three self-contained task sections, each copy-pasteable into a fresh Claude session. Shared context up top (required reading, hard constraints, output conventions). Each task spells out the skill's behavior, what good output looks like, what to avoid, where to build, and how to validate.

**The move worth noticing:** the hand-off from "Claude brainstorms" to "Claude builds" benefits from explicit constraints and validation steps. Without them, each parallel session would drift in a different direction. With them, three Claudes building three skills in parallel will produce work that fits together.

---

## Step 6 — Run three Claudes in parallel

> Now give me the prompts I should run in parallel in different Claudes to get the skills built.

**What happened:** Claude produced three self-contained prompts, one per skill, each ~200 words. The prompts assume a fresh Claude Code session started in this folder and tell each parallel session what to read, where to build, how to validate, and what to report back.

**The move worth noticing:** the prompts deliberately do *not* repeat what's already in PLAN.md. They point at it. The plan is the durable artifact; the prompts are the trigger. If the plan changes, the prompts still work.

### How to run

Open three terminal windows. In each one, `cd` into `_context/day-4/projects/interview-coding/` and start a fresh Claude Code session. Paste one of the prompts below as the first message in each session.

The three are independent — no shared writes — so they can all run at once. Task 3 (`/methods-paragraph`) doesn't depend on the others' outputs existing during its own build; it just needs to gracefully report what *is* and *isn't* there.

### Session 1 — build `/index-transcript`

```text
You're going to build a Claude Code skill called /index-transcript for a workshop demo of LLM-assisted qualitative coding.

1. Read PLAN.md in this folder. Read the "Shared context" section AND "Task 1 — Build /index-transcript". Follow the required-reading list in the shared context before writing any code.

2. Build the skill at .claude/skills/index-transcript/ — at minimum a SKILL.md, plus whatever supporting files you need.

3. Validate it by running it against all four transcripts in inputs/transcripts/. Save the worked outputs to .claude/skills/index-transcript/examples/.

4. When you're done, give me a short report: what's in SKILL.md, what examples you produced, and any decisions you made that PLAN.md didn't fully specify.

Stay aligned with the constraints in PLAN.md — especially: no analytic codes at this stage, no summarizing, no emojis. This is Waters' Stage 1: navigation layer, not digest.
```

### Session 2 — build `/find-negative-cases`

```text
You're going to build a Claude Code skill called /find-negative-cases for a workshop demo of LLM-assisted qualitative coding.

1. Read PLAN.md in this folder. Read the "Shared context" section AND "Task 2 — Build /find-negative-cases". Follow the required-reading list in the shared context before writing any code.

2. Build the skill at .claude/skills/find-negative-cases/ — at minimum a SKILL.md, plus whatever supporting files you need.

3. Validate it on both demo claims listed in PLAN.md's Task 2. Save the worked memos to .claude/skills/find-negative-cases/examples/. For the first claim — "instrumental mothers reject family/emotional framing of college" — confirm that R004 (Denise) surfaces as the negative case with verbatim excerpts and a clear reasoning paragraph.

4. When you're done, give me a short report: what's in SKILL.md, what examples you produced, and any decisions you made.

Stay aligned with the constraints in PLAN.md — especially: verbatim quotes only, don't dismiss negative cases, don't stop after one.
```

### Session 3 — build `/methods-paragraph`

```text
You're going to build a Claude Code skill called /methods-paragraph for a workshop demo of LLM-assisted qualitative coding.

1. Read PLAN.md in this folder. Read the "Shared context" section AND "Task 3 — Build /methods-paragraph". Follow the required-reading list in the shared context before writing any code.

2. Build the skill at .claude/skills/methods-paragraph/ — at minimum a SKILL.md, plus whatever supporting files you need.

3. Validate it. The other two skills are being built in parallel sessions, so their outputs may not exist yet when you validate. Design the skill to inspect the project state and accurately report what's there — including reporting "no indexing done yet" or "no negative-case analysis run yet" if those outputs are absent. Save examples/methods-paragraph-empty.md showing the empty-project behavior. If the other skills' outputs exist by the time you validate, also produce examples/methods-paragraph-full.md.

4. When you're done, give me a short report: what's in SKILL.md, what examples you produced, and any decisions you made.

Stay aligned with the constraints in PLAN.md — especially: don't invent details the project state doesn't support, don't gesture at grounded theory, be specific about what was and wasn't done.
```

### After all three return

Run the demo sequence on the corpus: `/index-transcript` across all four transcripts, then `/find-negative-cases` on the demo claim about instrumental mothers, then `/methods-paragraph` against the project state. That order — scaling, rigor, transparency — is a direct response to the three main complaints in Deterding & Waters' paper.

---

## Step 7 — Make this folder a project with its own CLAUDE.md

> I think we should build the skills in a `.claude/skills` folder inside `interview-coding`, and we'll get people to open that up as a project. So let's also create a CLAUDE.md file for that project that sketches out what it's about.

**What happened:** Claude wrote a project-level [CLAUDE.md](../../projects/interview-coding/CLAUDE.md) that loads automatically when Claude Code is started with this folder as the working directory. It points new participants at the right reading order, names the hard constraints (no "discovering themes," no line-by-line open coding, don't replace the immersive first read), and clarifies that skills built in `.claude/skills/<skill-name>/` resolve under this folder — so the skills travel with the project when shared.

**The move worth noticing:** project-scoped `CLAUDE.md` and project-scoped `.claude/skills/` together turn this folder into a portable, self-explaining workshop unit. A participant who clones just this folder gets the corpus, the brainstorm, the plan, the skills, and the alignment constraints all in one bundle — no need to ship the rest of the workshop repo with them. The CLAUDE.md is what makes the project *self-introducing* to any Claude session that opens it.

---

## Step 8 — Audit each Claude's return, clean up, run the demo end-to-end

> Session 3 is done — can you check the work?
> ...also from session 2 — still waiting on 1
> ...Session 1 completed for this project. Can you now do final cleanup?

**What happened:** the parallel sessions returned out of order — Session 3 first, then Session 2, then Session 1. For each return, the orchestrating Claude audited the work: read the SKILL.md, verified the examples against the source corpus, and spot-checked verbatim quotes and line numbers. Notable findings:

- **Session 3 (`/methods-paragraph`):** clean. The SKILL.md's inspection pipeline correctly refuses to fabricate. The `examples/methods-paragraph-empty.md` was the right call given the other two sessions had not yet produced their outputs.
- **Session 2 (`/find-negative-cases`):** mostly clean, with one verbatim issue. The R004 L34 quote in `examples/instrumental-mothers-emotional-framing.md` silently dropped the opening "It changes everything." sentence. Fixed by including the full opening. All other line references verified. The session's choice to add an explicit *scope-condition* step beyond what PLAN.md specified was a real improvement — without it, out-of-scope respondents would have inflated the negative-case count.
- **Session 1 (`/index-transcript`):** clean. All four indexed transcripts pass the diff-cleanliness check (headers added, zero deletions). R003's `hopes-after-hs` recurrence correctly produces 8 headers; the other three transcripts have 7 each.

After the audits, the orchestrating Claude promoted the skills' validated example outputs into the project's shared `output/` tree:

- [output/indexed/](../../projects/interview-coding/output/indexed/) — four indexed transcripts and four coverage reports
- [output/negative-cases/](../../projects/interview-coding/output/negative-cases/) — two audit memos for the two demo claims
- [output/methods/methods-paragraph.md](../../projects/interview-coding/output/methods/methods-paragraph.md) — generated against the now-populated state, replacing the empty-project version

Relative paths inside the promoted files were rewritten because `output/<subdir>/` sits at a different depth than `.claude/skills/<name>/examples/`. The deferred `examples/methods-paragraph-full.md` — which Session 3 correctly declined to fabricate without real Stage 1 and 3 outputs — was generated against the populated state for the skill's own documentation.

**The move worth noticing:** the audit step is not optional. The most common failure mode for parallel-built skills is plausible-looking output with small honesty bugs — paraphrase-as-quote, slightly wrong line numbers, fabricated detail. A short audit pass catches those before they reach a real reader. Session 3's refusal to fabricate without supporting inputs was the right call and saved the methods-paragraph from carrying invented detail. Trust but verify is the operating principle for parallel work.

### What the project looks like after this step

The interview-coding folder now contains the artifacts of a complete flexible-coding pipeline at small scale:

- The corpus and protocol in [inputs/](../../projects/interview-coding/inputs/).
- Three working skills under [.claude/skills/](../../projects/interview-coding/.claude/skills/) with their SKILL.md, supporting references, and worked examples.
- A populated [output/](../../projects/interview-coding/output/) tree showing the actual end-to-end run.
- Project-level [CLAUDE.md](../../projects/interview-coding/CLAUDE.md), [PLAN.md](../../projects/interview-coding/PLAN.md), [claude-thoughts.md](../../projects/interview-coding/claude-thoughts.md), and a project-internal [walkthrough.md](../../projects/interview-coding/walkthrough.md).

That sequence — index, audit, document — is the three-act demo: scaling, rigor, transparency. Each act is a direct response to one of Deterding & Waters' three main complaints about the field.

---

## A note on prompting

Each of the five prompts above is short. None of them tells Claude exactly what to write. They give it a goal, one or two alignment constraints (align with Mary's view; put it in a doc; make it parallelizable), and trust it to produce the artifact.

That delegation is the part that's hard to demonstrate in a slide. The way you learn it is by trying it, looking at what Claude produces, and adjusting the next prompt. Today's session is that loop.
