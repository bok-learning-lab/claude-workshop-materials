---
layout: default
title: Film course concepts website — Rashomon / GENED 1049
section: activities
---

# Film course concepts website — *Rashomon* / GENED 1049

<div class="page-lead">A course website that does what most course websites don't: it pairs traditional reference content (a workshop overview, a cinematography glossary, AI-tool resources) with interactive concept demos built around the course's actual canonical material — Kurosawa's *Rashomon* stills, scenes from films on the syllabus — rendered as parametrically explorable artifacts.</div>

Drawn from the production site for **GENED 1049 *East Asian Cinema*** at Harvard. The first content-rich gallery example with **no LLM call anywhere** — the site's intelligence is in the *content* and the *interactive design*, not in an inference call. The AI-resources curriculum *teaches* about using AI tools; the site itself doesn't call any model.

> **Live site:** <https://gened-1049.vercel.app/> — black/orange cinematic landing page with two interactive demo cards and the two book-style documentation hubs.
>
> **Source repo:** <https://github.com/bok-learning-lab/gened-1049> — production Next.js app, deployed to Vercel.
>
> **Full project summary:** [`examples/film-course-concepts-website/summary.md`](https://github.com/bok-learning-lab/claude-code-20260604/blob/main/examples/film-course-concepts-website/summary.md)

## What the site does

A single Next.js app serving three distinct functions.

**Landing page.** Cinematic styling — black background, gradient orange/amber title, editorial crop-marks behind the header — to signal that the site is *about cinema*, not about software. Three cards: one to each interactive demo, one to the workshop docs.

**Two interactive concept demos.**

- **Three-point lighting.** A top-down lighting diagram showing Miyagawa's key/fill/back configuration for each of three *Rashomon* stills, with angles, elevations, intensities, and colors all encoded as data the student can read at a glance. Each still is presented in sequence with the cinematographer's reading of *why* he chose that setup — key light at 4 o'clock, hard, high, warm sunlight bounced off mirrors; minimal fill; soft warm back light through the canopy.
- **Scroll-synced video essay.** A course scene that plays as the student scrolls, with editing overlays (title, summary, three or four staggered notes per shot) that fade in and out tied to scroll position. Built around a shared `ScrollVideo` component that ties video playback to scroll position, and per-page `EditingOverlay` instances that drive the fade timings.

**Dynamic content engine.** Any folder under `_content/` becomes a sidebar-navigated documentation site through a single dynamic route at `app/[folder]/[[...slug]]/page.tsx`. Two books ship: `gened-1049/` (workshop overview, a nine-term cinematography glossary, an AI-resources curriculum for media production) and `why-vibes-first/` (a pedagogical manifesto plus seven analytical sections). Drop a folder of markdown in; Next.js serves it as a sidebar-navigated docs site. No code change. No CMS. No admin UI.

## The pedagogical move

Most "interactive cinema education" tools teach concepts against generic illustrations: a diagram of a generic three-point lighting setup on a generic mannequin face. The student sees the abstract concept and is then asked to imagine how it would apply to a real film. **The transfer is the student's problem.**

This site does the opposite. The three-point-lighting demo teaches the concept on three *Rashomon* stills — the *same stills the student watched in section*. Miyagawa's actual choices are encoded as numbers, rendered as a top-down diagram, and paired with the cinematographer's prose reading of why. The student doesn't have to do the transfer — the demo *is* the transfer, performed for them on material they already know.

That requires three commitments, quoted from the project's own operations doc:

> **The data file is the source of truth.** `stills.ts` encodes the lighting setup of each *Rashomon* still as numeric fields (angle, elevation, intensity, color) plus prose fields (label, description, shot description). A new still — from a different film, from a student's own footage — is a data edit, not a code edit.
>
> **The rendering component reads from the data, not from the page.** `LightingDiagram` is reusable across stills. The page composes it; the component doesn't know which still it's rendering.
>
> **The page is a narrative sequence.** Three stills, presented in order, with deliberate transitions. The teaching arc lives in the sequence. The page is not a gallery.

A subsidiary move: the AI-resources curriculum draws an explicit line — *"AI as Lab Partner, Not Ghostwriter."* Use AI to accelerate mechanical tasks (`yt-dlp`, `ffmpeg`, debugging TypeScript, scaffolding Next.js code). Keep creative control: film analysis, interpretive lens, argumentative voice are not AI's job. The commitment lives at the curriculum layer, not the prompt layer — but the structural posture is the same as the other gallery examples: **separate what AI is allowed to do from what stays human.**

## Notes for adapting

The pattern is **a flat-file content engine for the syllabus material + one or two interactive concept demos anchored to the course's canonical examples + a pedagogical commitment about what stays human**. The substance survives translation:

- **Music theory.** Replace `stills.ts` with `passages.ts` — each passage encodes the harmonic move, the meter, the orchestrational choice, with an audio snippet for the canonical example.
- **Architecture / design history.** Replace film stills with floor plans; replace lighting angles with structural loads, programmatic adjacencies, circulation paths.
- **Dance / movement studies.** Frame-by-frame breakdowns of a sequence; encode the choreographic vocabulary as data (weight transfers, musical accent alignment, spatial pathways).
- **Art history / connoisseurship.** Replace stills with painting details; encode the brushwork, the underpainting layer, the pigment palette as data alongside the high-resolution image.

The hard alignment constraints that survive translation:

- **Anchor concept demos to canonical course material.** Generic illustrations leave the student to do the transfer.
- **Data file = source of truth.** A new example is a data edit. Resist building admin UIs or per-demo styling systems.
- **Pair the diagram with the instructor's reading.** A diagram alone is a chart; the instructor's prose argument about the cinematographer's choice is what makes it a lesson.
- **The engine is general; the content is specific.** Course-specific logic does not belong in the routing layer.
- **Sequence matters.** The order of stills and glossary entries are curriculum choices. Don't shuffle.
- **Restraint is part of the voice.** The site is cinematic in *typography and palette*, not in motion. No animations-for-animations'-sake.

The site does *not* need an LLM, and the absence is worth naming: there are course-website moves where adding AI would be additive (chat with a glossary, generate per-student feedback) and others where AI is a distraction. This is the latter.

---

*Companions in this category: [Literature course concept website](../literature-lovesongs/) · [Image API widget](../image-api-widget/). [Back to Course Websites](../).*
