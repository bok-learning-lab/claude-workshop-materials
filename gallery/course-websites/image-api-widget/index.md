---
layout: default
title: Image API widget — The Virtual Camera
section: activities
---

# Image API widget — The Virtual Camera

<div class="page-lead">A provider-agnostic image-generation widget with a critical framework rendered in the UI itself. The user writes a prompt, optionally brings a source image into the dialog, optionally pins a seed, clicks generate — and gets one Stable Diffusion image back. Right next to the form, a sidebar holds Alexander Kluge's "A Few Preliminary Rules" — paraphrased so the class can work with them. Specific UI controls are *literally* tied to specific rules.</div>

> **Live demo:** <https://stable-diffusion-widget-interface.vercel.app/> — try a generation in your browser. Both Replicate and HuggingFace are supported as providers (one of `REPLICATE_API_TOKEN` or `HF_TOKEN` is set in production).
>
> **Source repo:** <https://github.com/bok-learning-lab/stable-diffusion-widget> — production Next.js app, deployed to Vercel.
>
> **Workshop example:** [`claude-code-20260604/examples/image-API-widget/`](https://github.com/bok-learning-lab/claude-code-20260604/tree/main/examples/image-API-widget) — the Kluge rules input, the generate-operation doc, and the illustrative session outputs as a portable folder.

## What the site does

A single-page Next.js webapp wired around one API endpoint plus a critical-framework sidebar.

**A provider-agnostic generate endpoint** (`/api/generate`) — accepts a prompt and optional source image, picks an inference provider based on which API tokens are set (**Replicate** primary, **HuggingFace** fallback), and returns one image. The same JSON request shape across providers; automatic selection based on which tokens are set; manual override via `INFERENCE_PROVIDER` env var. A class adapting the widget to its own use can swap providers with one environment variable, no code change.

**The Studio component** — a form (prompt textarea, optional source-image upload, strength slider when a source is present, optional seed input, generate button) plus a gallery of "earlier attempts" so the sequence of generations is visible *as a sequence*, not so the student can pick the best one. The component is ~290 lines, holds the gallery in React state, reads source images with `FileReader` into data URLs, POSTs to `/api/generate`, and renders the latest generation in a card with the source-vs-generation side-by-side. No state management library. No animations.

**The Kluge Rules sidebar** — Rule 1 (presence of source information) and Rule 2 (dialogical method), rendered alongside the form. The two rules are minimal on purpose, with a closing line in the sidebar that *more rules emerge through necessary intensifications and counter-rules. Add your own.*

## The pedagogical move — the Kluge Rules sidebar pattern

Most stable-diffusion playgrounds present generation as a frictionless "type prompt, get image" loop. This widget does the opposite: it makes the critical framework structurally present, and **each UI control is tied to a specific rule.**

> **Rule 1 — presence of source information.** Bring the context of the source — the artist, the medium, the period, the institution — into the prompt. The Studio's *placeholder text* is itself a demonstration of the rule: *"a painting by Arcimboldo, fruit and vegetables forming a face, Wunderkammer, 16th century."* And the optional source-image input is labeled *"Source image (optional — Rule 1)"* — the rule is in the label, not in a tooltip or a docs page.
>
> **Rule 2 — dialogical method.** There is dialog between the tool and the author. The experiments make sense only as sequences. The Studio's strength slider has three labeled bands — *"preserve source"* (0–0.4), *"dialog"* (0.4–0.8), *"follow prompt"* (0.8–1.0). The middle band is named after the rule. And the gallery of "earlier attempts" exists so the sequence is legible as a sequence.

Each UI element was audited against "which rule does this surface?" — and where there was no answer, either the rule was extended or the control was reconsidered. This is the design center of the project:

> The optional source-image input is labeled with "Rule 1" explicitly. The strength slider's labels use the literal vocabulary of Rule 2 (*"dialog"* in the middle band). The gallery of earlier attempts is justified by Rule 2 — a sequence, visible as a sequence.

The placeholder text — *"a painting by Arcimboldo, fruit and vegetables forming a face, Wunderkammer, 16th century"* — is itself doing real pedagogical work. It is not a random example; it's a prompt that follows Rule 1 *visibly*. A student who reads the placeholder before typing has already absorbed half the lesson. Generic placeholders ("Enter a prompt…") squander the affordance.

The structural posture matches [`oral-exam-practice-bot`](../../practice-and-assessment/)'s no-grading constitution and the [literature site](../literature-lovesongs/)'s three-failure-modes arc: **make the framework structurally legible in the artifact, not hidden in a footnote.** Here the framework is critical rules; the legibility is in the labels themselves.

## Notes for adapting

The pattern is **a single thin API endpoint with a provider-agnostic abstraction + a critical-framework sidebar with each UI control tied to a specific rule + a sequence-visible gallery**. The substance survives translation:

- **Any course teaching with generative image models.** Replace Kluge's rules with the framework your course uses — Walter Benjamin on aura and mechanical reproduction; Lev Manovich on the database aesthetic; the disciplinary norms of your field (attribution, dataset provenance, fair use). **The conceit only works if the rules do live work on the UI.**
- **Generative text widgets with the same conceit.** Replace the image-generation endpoint with a Claude or OpenAI chat endpoint; the rest of the pattern — rules sidebar, sequence-visible gallery, provider abstraction — ports verbatim.
- **Audio / music / video generation.** Provider abstraction is the most reusable piece; for each medium, the relevant rules and the UI control vocabulary change.
- **Any "rules + control" pedagogical tool outside generative AI.** A writing tool that ships with style rules in the sidebar; a citation manager that surfaces disciplinary citation norms next to the entry form. The general move is *make the pedagogy structurally present, not parallel.*

The hard alignment constraints that survive translation:

- **Rules and UI controls are one artifact.** A control without a rule is decoration; a rule without a control is a handout. Surfacing the framework in the sidebar without tying it to specific controls produces a webapp with a homily attached.
- **Provider abstraction is the substance of "API widget."** Hardcoding to one provider in the UI makes the widget hostile to classroom adaptation. One env var should be enough to swap inference services.
- **No prompt rewriting.** The user's prompt is passed verbatim. Hidden manipulation makes the pedagogy a lie — the student can't see what their prompt is doing if the app is editing it underneath.
- **One generation per call.** No batch parameter, no n=4 grid. Each click is a move in the dialog (Rule 2). The gallery shows the sequence; the sequence is the work.
- **Seed in / seed out.** Reproducibility is part of the contract. A student should be able to ask "what was the seed of that one?" and get an answer. Holding the seed constant across a sequence is the smallest piece of scientific rigor a class can practice.
- **No persistence.** The session lives in browser state; a page reload discards everything. The student owns what they take away.
- **Server-side keys.** API tokens never leave `process.env` on the server. The browser never sees them.
- **No safety classifier in the default.** The widget is for an adult classroom working with named source material. Forks for public use should add moderation explicitly, in `lib/generate.ts`, where the choice is visible — not as a hidden default.

A faculty member lifting this pattern needs (1) a critical framework with two or three rules they can paraphrase aggressively, (2) the discipline to audit every UI control against the framework, and (3) the restraint to ship two providers, not five.

---

*Companions in this category: [Film course concepts website (*Rashomon*)](../film-rashomon/) · [Literature course concept website](../literature-lovesongs/). [Back to Course Websites](../).*
