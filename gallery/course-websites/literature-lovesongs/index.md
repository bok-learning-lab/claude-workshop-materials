---
layout: default
title: Literature course concept website — Love Songs / CompLit 126x
section: activities
---

# Literature course concept website — Love Songs / CompLit 126x

<div class="page-lead">A course-concept website built around a three-demo pedagogical arc: each demo tries to capture *voice* by a different mechanism (trait scoring, full-source stuffing, voice cloning), and each fails in a precise, instructive way. The contrast between them is the lesson.</div>

Drawn from the pre-workshop site for **CompLit 126x: *Love Songs at the Learning Lab* — Unit II: Voice, Style, and Form** at Harvard, taught by **Prof. Moira Weigel**. Structurally different from the [*Rashomon* / GENED 1049 site](../film-rashomon/): where that site's center of gravity is *interactive concept demos anchored to canonical course material*, this site's center of gravity is **a deliberate sequence of three demos that each fail differently**.

> **Live site:** <https://complit126x-lovesongs.vercel.app/> — work through the three demos in order.
> Demo 1: [`/analyzer`](https://complit126x-lovesongs.vercel.app/analyzer) · Demo 2: [`/demo-sonnet`](https://complit126x-lovesongs.vercel.app/demo-sonnet) · Demo 3: [`/demo-voice`](https://complit126x-lovesongs.vercel.app/demo-voice)
>
> **Source repo:** <https://github.com/bok-learning-lab/complit126x-lovesongs-draft> — production Next.js app, deployed to Vercel.
>
> **Workshop example:** [`claude-code-20260604/examples/literature-course-concept-website/`](https://github.com/bok-learning-lab/claude-code-20260604/tree/main/examples/literature-course-concept-website) — the three-demo arc operations (analyze prompt, generate-from-scores prompt, stuffing-the-prompt, voice-cloning step) and the illustrative outputs as a portable folder.

## What the site does

A single Next.js app with three top-level demo routes plus a documentation layer. The three demos form a single pedagogical sequence: students work through them in order, and the reading order is fixed.

### Demo 1 — The Spider Chart (`/analyzer`)

Student-defined trait rubrics + LLM scoring + radar visualization (via `recharts`) + sonnet generated *from averaged scores alone, no poem text*. The five default rubrics: Melancholy, Romanticism, Nature Imagery, Mortality, Optimism. Worked-example inputs: Shakespeare's Sonnets 18, 29, 55.

The pedagogical centerpiece is the generate-from-scores prompt at the bottom of the page — deliberately minimal, deliberately *just the numbers*. The radar chart's aesthetic is not the pedagogical point. The point is the prompt: *"Write a sonnet with the following trait scores… [no other context]."* The output is meant to be **almost good**, which is the worst possible kind of output for pedagogy — because *almost good* is what the student has to learn to recognize and name.

### Demo 2 — Stuffing the Prompt (`/demo-sonnet`)

The opposite mechanism. Three actual Shakespeare sonnets pasted into the model's context, asked for a fourth in his style. No system prompt — the demo is supposed to be a stripped-down "give the model the source, ask for imitation" baseline. The instruction *"Do not copy lines"* was added after early outputs lifted lines verbatim; even with the instruction, the source-bias of the context is heavy and pastiche persists in a way the demo deliberately surfaces.

### Demo 3 — Is Voice Textual — or Multimodal? (`/demo-voice`)

Demo 1's pipeline run on a 2006 *Harvard Crimson* article by **Prof. Weigel herself**; the resulting sonnet is then read aloud in her cloned voice via ElevenLabs. The cloned voice ID is server-side configuration; the deployed UI cannot be repurposed to clone other voices. The generated sonnet was captured from one representative run and hardcoded into the page so the artifact is stable for the workshop's discussion.

### Reading layer

`/reading/[[...slug]]` is a dynamic content engine for supporting workshop documentation (intro to context engineering, prompt-chaining guide, etc.), using the same flat-file `_content/` routing pattern as the [*Rashomon* site](../film-rashomon/).

## The pedagogical move — the three-failure-modes arc

The unit asks *what is voice?* — and the answer the unit's readings (Whitman, Dickinson, Lerner) suggest is *it cannot be fully operationalized*. Rather than *asserting* that, the site **builds three operationalizations and shows the student each one failing in a different way.** The differences between the failures *are* the lesson.

From the project's own pedagogical-arc operation:

> - Demo 1 (trait scores) loses the specifics.
> - Demo 2 (stuffed source) loses the originality.
> - Demo 3 (voice clone on synthesized text) keeps the acoustic correct but the words are alien.
>
> No demo is presented as *the* answer. The student leaves the workshop able to articulate the question more precisely — and able to name what each mechanism cannot capture.

Two structural moves reinforce the arc:

**The "complete prompt" transparency.** Every demo shows the student exactly what the model sees. Demo 1's UI renders the averaged-scores prompt verbatim in a monospace code block under the heading *"The complete prompt sent to the model"* — *and the trait rubrics are deliberately not in the prompt*, even though they were used to compute the scores upstream. The student can see what's been hidden from the model. **If the prompts were obscured behind a polished UI, the demos would teach the wrong lesson — that AI does a creditable job of replicating voice.** With the prompts visible, the failures are legible, and the legibility is the point.

**The recursive instructor in Demo 3.** Prof. Weigel clones *her own voice*, scores *her own published article*, and lets the LLM generate a sonnet from her own trait scores — *which is then read aloud in her cloned voice.* Every layer of the apparatus points back to her. The pedagogical justification: **the instructor goes first**, with the full apparatus turned on her, before students are asked to subject themselves to the same procedure. The risk of voice-cloning as a pedagogical tool is borne by the teacher, with her consent, in service of the lesson the workshop will then ask students to encounter.

This is the kind of move that requires the right instructor and the right course context. It does not generalize *as a default*.

## Notes for adapting

The pattern is **a course-content website built around a three-demo sequence where each demo tries to operationalize the unit's question by a different mechanism, and each fails in a different instructive way**. Adjacent applications:

- **History-of-science courses on what a "fact" is.** Three attempts to operationalize *what counts as evidence* — one by counting citations, one by examining experimental conditions in detail, one by replicating an experiment.
- **Philosophy courses on ethical concepts.** Three attempts to operationalize justice / autonomy / dignity — utilitarian counting, Kantian reasoning analysis, virtue-ethics role inhabitation.
- **Composition / writing courses.** Three attempts to capture good writing — rubric scoring, example-stuffing, listening to the writer read aloud.

The hard alignment constraints that survive translation:

- **The pedagogical move is the *contrast* between demos.** Build at least three; arrange them in a fixed sequence; don't ship one in isolation. Workshops that shipped *one* of the three got far weaker discussion than the full triad.
- **Show the complete prompt** for every LLM-driven demo. Transparency about what the model sees is what enables the student's analytical work.
- **No combined "best-of" demo.** Resist the temptation to engineer around the limit by stacking mechanisms — it would suggest the limit can be engineered around. It can't.
- **The instructor goes first** in the riskiest demo. The pedagogical risk is borne by the teacher before being asked of students.
- **Voice cloning is curatorial, not user-driven.** Server-side env-var configuration only. Don't expose runtime cloning to students through the deployed UI.
- **Failure modes are part of the artifact.** Don't post-process. Don't retry. Don't paper over with refinement passes.
- **AI as foil, not instrument.** The model is being used to *make the question more precise*, not to *answer it*.

Server-side API keys: both `OPENAI_API_KEY` and `ELEVENLABS_API_KEY` stay in `process.env`. Never client-side.

A faculty member lifting this pattern needs to identify a unit-level question whose answer the readings suggest *resists single-mechanism operationalization*, then design three demos whose failures *differ*. The temptation to add a fourth, combined demo is the failure mode to avoid; the temptation to retry or post-process the generations is the second.

---

*Companions in this category: [Film course concepts website (*Rashomon*)](../film-rashomon/) · [Image API widget](../image-api-widget/). [Back to Course Websites](../).*
