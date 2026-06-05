---
layout: default
title: Course Websites with Interactive Demos
section: gallery
---

# Course Websites with Interactive Demos

<div class="page-lead">Deployed Next.js apps anchored to a specific course's canonical material — its stills, its sonnets, its source images — paired with two or three interactive demos that let students explore the course's concepts parametrically rather than just read about them.</div>

Most course websites are syllabus + readings + a Canvas link. The pattern catalogued here is different. The site is a real piece of software with a landing page, dynamic markdown-driven content routes, and **interactive concept demos built around the course's own canonical material**: the *Rashomon* stills the students watched in section, the Shakespeare sonnets the unit has been close-reading, the artists named in a course's critical framework. The demos let the student manipulate parameters — a lighting angle, a trait rubric, a strength slider — and watch a concept that would otherwise be abstract become legible on material the course has already taught.

The architectural common ground is small and stable: Next.js, deployed to Vercel, a flat-file `_content/` directory whose markdown becomes a sidebar-navigated docs site through a single dynamic `[folder]/[[...slug]]` route, and one or two demo pages whose data file is the source of truth. The pedagogical common ground is sharper: **anchor the demo to canonical course material**, **show the student what the model sees** (no obscured prompts, no rewriting), and **make the framework's limits structurally legible** rather than hidden in a footnote. The three projects below instantiate the pattern in three quite different registers — a cinema workshop with no LLM call anywhere, a literature unit whose three demos each *fail* in an instructive way, and a generative-image widget whose critical rules live in the sidebar with UI controls literally tied to specific rules.

## Projects in this category

- **[Film course concepts website — *Rashomon* / GENED 1049](film-rashomon/)** — Prof. Alex Csiszar's East Asian Cinema workshop, with a top-down three-point-lighting diagram of Miyagawa's choices on three *Rashomon* stills and a scroll-synced video essay overlay.
- **[Literature course concept website — Love Songs / CompLit 126x](literature-lovesongs/)** — Prof. Moira Weigel's Unit II on voice, built as a three-demo arc (Spider Chart → Stuffing → Voice Cloning) where each demo fails differently and the contrast is the lesson.
- **[Image API widget — The Virtual Camera](image-api-widget/)** — a provider-agnostic Stable Diffusion widget with Alexander Kluge's "A Few Preliminary Rules" rendered in the UI sidebar, each rule tied to a specific control.

## When to use this pattern

A course website with interactive demos is the right move when the course has *parametric or spatial* concepts — three-point lighting, harmonic motion, the 180-degree rule, the rubric structure of trait scoring — whose abstract form a student can understand from prose but whose *operation on the course's canonical material* is the actual lesson. If the concept is fully expressible as a single manipulable widget (mass on a spring, the unit circle, a probability tree), the [single-file interactive simulation](../interactive-simulations/) is cheaper and more portable. If the goal is to drill students on a body of content for an exam, the [practice tool](../practice-and-assessment/) pattern is closer. The course website pays its keep when you want a *durable, linkable, scrollable artifact* that pairs a flat-file content engine (glossary entries, workshop notes, manifestos) with one or two demos that are the centerpiece of an actual class meeting.

## What it costs

This is the most infrastructure-heavy pattern in the gallery. A deployed Vercel + Next.js app is real frontend work: a routing layer, a layout, a data-file convention per demo, deployment configuration, and (for the LLM-driven examples) server-side API key handling. This is not a single-file HTML artifact you can email. The good news is that the *engine* — the dynamic content route, the demo data-file pattern — is general across courses; only the content and the demo data change. The film site notes that the hard thing is not the technology but *deciding what to put in it*: the engine made the second hard thing (per-page styling, navigation) cheap, which forced the first hard thing (what's worth writing) into the foreground.

---

*See also: [Interactive Concept Simulations]({{ site.baseurl }}/gallery/interactive-simulations/) for the single-file widget pattern, and [Practice & Assessment Tools]({{ site.baseurl }}/gallery/practice-and-assessment/) for the deployed-app pattern oriented toward drill rather than exploration.*
