# Plan — Day-4 project overviews

Printable, interlinked overview docs for the three day-4 projects, situating each in (a) its academic tradition, (b) the higher-ed-in-the-age-of-AI moment, and (c) the position it occupies in this workshop. Source is markdown; output is the Deep-thoughts-styled HTML produced by the [`/md-to-deepthoughts-html`](../../../.claude/skills/md-to-deepthoughts-html) skill, suitable for printing or sharing as a self-contained file.

## What this directory is

Workshop attendees and their colleagues — deans, department chairs, fellow faculty — should be able to open one folder, see the three day-4 projects laid out clearly, and understand what each project is *for* without having to read the source code of the skills. The overviews are the artifact you hand to a colleague who couldn't attend the workshop but wants to understand what was being demonstrated, or to a faculty member considering whether to adopt the workshop's approach in their own teaching.

The three day-4 projects:

1. **[interview-coding](../projects/interview-coding/)** — Mary Waters' "flexible coding" approach applied with Claude Code. Skills for indexing transcripts, surfacing negative cases, and generating transparent methods paragraphs. *Fully built out.*
2. **[physics-interactives](../projects/physics-interactives/)** — building PhET-style single-file interactive simulations with Claude Code (`/phet-sim`), plus a companion skill for Wieman-style classroom activities around those sims (`/phet-activity`). *Fully built out; has its own essay [essay-phet-tradition.md](../projects/physics-interactives/essay-phet-tradition.md) we'll reuse.*
3. **[texts-and-translation](../projects/texts-and-translation/)** — LLM-assisted close textual work across languages. Two corpora in place (Homer's *Odyssey* in 14 translations; Jagannātha's *Rasagaṅgādhara* in 17th-c. Sanskrit). *Scaffolded; candidate skills sketched in [its PLAN.md](../projects/texts-and-translation/PLAN.md) but not yet built.*

## Audience and use cases

- **Workshop attendees**, before or after their session, who want to read about a project at their own pace rather than scrolling through code.
- **Colleagues of attendees** who didn't attend — deans, department chairs, fellow faculty — who need to understand what was being demonstrated and why it matters *in their discipline*. The overviews are written so that a sociologist reading the physics overview, or a physicist reading the Sanskrit-poetics overview, still gets the point.
- **Marlon and other facilitators** sharing the workshop's work externally: conference talks, blog posts, grant reports, print packets for visitors.

The docs are **reflective, not just descriptive**. They make an argument about what each project shows; they do not just summarize what it is. The PhET essay at [essay-phet-tradition.md](../projects/physics-interactives/essay-phet-tradition.md) is the model — voice, length, and the move of grounding the AI claim in the discipline's own history.

## Structure: three docs per project + a shared landing page

```text
project-overviews/
  PLAN.md                          (this file)
  index.md                         (landing page: 1 paragraph intro, links to each project's three docs)
  index.html

  interview-coding/
    summary.md                     (~500 words: what the project is, what attendees see in the session)
    summary.html
    tradition.md                   (~1,000 words: flexible coding, Deterding & Waters, Waters' methodology,
                                     where this fits in qualitative-methods debates of the last 30 years)
    tradition.html
    affordance.md                  (~1,000 words: what LLMs open up for qualitative coding; what Claude Code
                                     in particular adds — skills, transparency, methods reporting; what we
                                     should NOT claim — "discovering themes")
    affordance.html

  physics-interactives/
    summary.md
    summary.html
    tradition.md                   (re-cut of essay-phet-tradition.md for the project-overviews audience —
                                     same argument, perhaps tighter)
    tradition.html
    affordance.md                  (what changes when faculty can author simulations themselves; the design
                                     discipline that has to come along; how /phet-sim and /phet-activity bake it in)
    affordance.html

  texts-and-translation/
    summary.md                     (the two-corpus setup; what the skills will demonstrate once built)
    summary.html
    tradition.md                   (close textual work across languages: translation studies, philology,
                                     śāstric commentary; the Bok Center's place in Harvard's foreign-language teaching)
    tradition.html
    affordance.md                  (what LLMs open up for non-English close work; what they cannot do at
                                     the level of trained philologists; the "first-pass collaborator" framing
                                     already in the project's CLAUDE.md)
    affordance.html
```

Each project's three docs are deliberately parallel so a reader can compare across disciplines.

- **`summary.md`** — what this project is, what it produces, what a workshop attendee sees. ~400–600 words. The elevator pitch, plus enough concreteness that a colleague can imagine using the project's skills.
- **`tradition.md`** — the academic, pedagogical, or research lineage this project sits inside. ~800–1,200 words. Does not assume AI as a starting point; treats the field's own questions on their own terms. Cites real work where possible.
- **`affordance.md`** — what AI changes about that lineage; what it does *not* change; what we should not over-claim. ~800–1,200 words. The "this is genuinely new — and here's the discipline that has to come with it" essay.

## What does NOT live here

- The workshop's overall description and per-day overview — those already live at [../../about-this-workshop/](../../about-this-workshop/). The overviews link to that material rather than duplicating it.
- The skills, templates, and corpora themselves. They live in each project's own folder under [../projects/](../projects/). The overviews link to specific artifacts when they want a reader to see them, but don't re-host them.
- Generated examples (rendered simulations, sample coding outputs). Same principle — link rather than re-host.

## Interlinking conventions

- **All cross-doc links are relative.**
- **Markdown files link to other markdown files** (`.md` extensions). HTML files link to other HTML files (`.html` extensions). When rendering with `/md-to-deepthoughts-html`, `.md` links need to be rewritten to `.html` — either by extending the skill or by a one-line post-processing step. Address in Phase 4.
- **The landing `index.md` is the navigational hub.** Every project doc links back to it at the top and bottom.
- **Each project's three docs link to each other** in a small "more from this project" footer (summary ↔ tradition ↔ affordance).
- **Cross-project links** are fine where genuinely useful — e.g. the affordance docs all touch the "what does the human still have to do?" theme and can reference each other.
- **Links to project source artifacts** (skills, essays, corpora) use the project's own folder under `../projects/<project>/`.

## Style and voice

- No emojis.
- Discipline-respectful: treat each project's field on its own terms before introducing the AI argument. The reader from inside the field should not feel handled.
- Honest about limits: every `affordance.md` includes a "what we are NOT claiming" passage. Over-claiming AI affordances is the single biggest credibility risk with this audience.
- Sentence-level prose, not bullet-heavy outline. Bullets are fine for lists of artifacts or summaries; the body of the essay should read as prose.
- ~1,000-word target for `tradition.md` and `affordance.md`. `summary.md` shorter. Long enough to be reflective; short enough that a busy reader prints it and reads it on the train.

## Print considerations

The [`/md-to-deepthoughts-html`](../../../.claude/skills/md-to-deepthoughts-html) skill produces standalone HTML files with cream/serif Newsreader styling, a Print button, and a Copy MD button. Each `.html` should be printable as a self-contained handout (Letter or A4). Three cases to handle:

- **Per-doc printing** — a colleague prints `summary.html` for a project they're interested in. Most common case.
- **Per-project printing** (all three docs for one project) — a ~6–10-page packet for a department conversation.
- **Whole-collection printing** is rare but should still work — print each html sequentially.

Verify after first conversion that section headings don't strand mid-page and that footnotes (where used) print cleanly.

## Phases of work

### Phase 1 — Landing + interview-coding (the most-built project)

1. Draft [index.md](index.md). One landing paragraph plus links to each project's three docs.
2. Draft the three interview-coding docs. Lean on the project's existing [PLAN.md](../projects/interview-coding/PLAN.md), [claude-thoughts.md](../projects/interview-coding/claude-thoughts.md), and the Deterding & Waters 2018 paper Marlon already has on file.
3. Convert all four md files to html via `/md-to-deepthoughts-html`.
4. Verify links; print one to PDF to sanity-check the styling.

### Phase 2 — Physics-interactives

1. **`tradition.md`** — re-cut of [essay-phet-tradition.md](../projects/physics-interactives/essay-phet-tradition.md). The argument is already in place; the cut is mostly about length and audience.
2. **`summary.md`** — what attendees see in the session, with reference to the two live skills (`/phet-sim` and `/phet-activity`) and the worked example (`damped-harmonic-oscillator.html`).
3. **`affordance.md`** — the section of the existing essay on "what does not change" expanded into a standalone piece. Bring in the Wieman-pedagogy thread from [phet-activity's research anchor](../projects/physics-interactives/.claude/skills/phet-activity/reference/wieman-pedagogy.md).
4. Convert to html.

### Phase 3 — Texts-and-translation (scaffolded project)

1. **`summary.md`** — the two-corpus setup. Concrete: 14 *Odyssey* translations; the *Rasagaṅgādhara* Ānana 1.
2. **`tradition.md`** — close textual work across languages. Translation studies, philology, śāstric commentary, the Bok Center's role in Harvard's foreign-language teaching. This is the doc most worth writing carefully — the field is older and richer than the AI conversation around it.
3. **`affordance.md`** — what LLMs open up for non-English close work; the candidate skills sketched in the project's PLAN; the "first-pass collaborator" framing already articulated in [the project's CLAUDE.md](../projects/texts-and-translation/CLAUDE.md). Be honest that no skills are built yet — the affordance is potential, not demonstrated.
4. Convert to html.

### Phase 4 — Render, link-check, print-check

1. Final conversion of every `.md` to `.html` via `/md-to-deepthoughts-html`.
2. Verify all relative links work in both md and html versions.
3. Print at least one full project (three docs) to PDF; check page breaks and footnote handling.
4. Decide whether to extend `/md-to-deepthoughts-html` to auto-rewrite `.md` links to `.html`, or add a one-line post-processing step (e.g. a small shell command using `sed`).

## Open questions to resolve along the way

- **Three docs per project — too many or too few?** Three lets the academic / AI-moment / workshop framing each get its own piece. Two (combine summary and workshop position) would tighten things. Resolve after the first project is drafted.
- **Shared "AI moment" doc?** The affordance docs will share themes (commitment-then-confrontation; the human still doing the judgment; over-claiming as the credibility risk). We could pull common material into a single shared doc and have each project's affordance doc link to it. The cost is fragmentation; the gain is non-duplication. Recommend: write each affordance doc inline first, then check for genuine overlap before extracting.
- **Link rewriting (`.md` → `.html`).** Does the `/md-to-deepthoughts-html` skill rewrite internal links? If not, do we extend it or post-process? Verify in Phase 1 when we run the first conversion.
- **Workshop-context recap.** Should each `summary.md` briefly recap the workshop, or just link to the existing workshop description at [../../about-this-workshop/](../../about-this-workshop/)? Recommend: a one-sentence link only ("This is one of three day-4 projects in the [workshop](../../about-this-workshop/series-overview.md)"), since duplication is the bigger risk.
- **Citations.** `tradition.md` and `affordance.md` will reference real scholarship. Citation style — footnotes (as in the PhET essay) or inline parenthetical? Recommend: footnotes, matching the PhET essay precedent.
