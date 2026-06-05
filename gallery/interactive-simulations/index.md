---
layout: default
title: Interactive Concept Simulations
section: activities
---

# Interactive Concept Simulations

<div class="page-lead">A pattern for using Claude Code to author small, manipulable, conceptually disciplined worlds in which a learning idea becomes visible — the kind of artifact that historically required a development team, now within reach of a single faculty member in an afternoon.</div>

## The pattern

An interactive concept simulation is a single-file HTML page built around one teaching idea: a learner manipulates a constrained model, observes immediate feedback through linked representations (a diagram, a graph, a number, an equation, all updating together), and confronts the gap between what they predicted and what the model actually does. The pedagogical move is *the simplification* — what gets left out so the concept can become visible — not the realism of the rendering.

This category sits inside a well-developed tradition. PhET Interactive Simulations at the University of Colorado Boulder, founded in 2002 by Nobel laureate Carl Wieman, established the design grammar these projects translate into Claude Code skills: a faithful model, a manipulable interface, immediate feedback, multiple linked representations, and a deliberately simplified world. PhET sims accumulated their evidence base — Hake's 1998 study of ~6,000 students, Freeman et al.'s 2014 PNAS meta-analysis (active learning raises exam scores 0.47 SDs, cuts failure rates 55%), Banda & Nzabahimana's 2021 review of PhET specifically — because each artifact was the product of a multi-year team and hundreds of student interviews.

What LLMs change is the cost of *prototyping* the artifact, not the cost of the design discipline behind it. The risk is real: a bad AI-generated simulation can be seductive — sliders, particles, color, motion, all responding immediately — with no learning goal at the center. The projects in this category are organized around that risk. They ship a pedagogical interview that runs *before* any code is generated, a hard output contract that keeps the artifact portable, and an accessibility floor that gates "ready to share with students."

## Projects in this category

### [Physics Interactives](physics-interactives/)

A self-contained bundle of four Claude Code skills — `/phet-sim`, `/phet-activity`, `/phet-accessibility-audit`, `/phet-rationale` — single-file HTML templates, an 8-dimension quality rubric, and a sample teaching brief (heat pumps). The skills enforce the PhET design grammar by running a structured pedagogical interview before any code is generated, then refuse to declare a simulation done until it passes the rubric and an accessibility audit. The natural reference implementation of the pattern.

[Project page](physics-interactives/) · [Tradition essay](https://github.com/bok-learning-lab/claude-workshop-materials/blob/main/gallery/day-4/project-overviews/physics-interactives/tradition.md) · [Affordance essay](https://github.com/bok-learning-lab/claude-workshop-materials/blob/main/gallery/day-4/project-overviews/physics-interactives/affordance.md) · [Day-4 summary](https://github.com/bok-learning-lab/claude-workshop-materials/blob/main/gallery/day-4/project-overviews/physics-interactives/summary.md)

### [Becca Belofsky's Discrete Math Interactives](../day-4/becca-interactives/)

A concrete instantiation of the pattern: roughly twenty-five working interactives authored by a single faculty member using the `/phet-sim` skill for a discrete mathematics and probability course. The set includes a Monty Hall simulator and a Law-of-Total-Probability variant, a PMF/CDF builder, a Bayesian update slider, a Euclidean-algorithm stepper, modular-arithmetic and pigeonhole explorers, a DFA builder, derivation and proof-step arrangers, and a recursion-tree visualizer. Each opens by double-click; none require a build step. The directory is the answer to "what does a faculty member actually produce with this pattern in an afternoon?"

[Browse the full set](../day-4/becca-interactives/)

## When to use this pattern

Reach for interactive concept simulations when the substantive teaching obstacle is a specific misconception that a static diagram, a worked example, or a paragraph of prose has not been able to dislodge — when the gap between what students can *state* and what they can *do* widens despite good lectures and good problem sets. The Force Concept Inventory's signature finding (nearly 80% of students completing introductory physics could state Newton's Third Law; fewer than 15% understood it) is the canonical example, but the pattern travels: any conceptual system where a learner's prediction can be made explicit, then run against a constrained model, then revised, is a candidate. The pattern is overkill when the goal is information delivery or procedural fluency. It is undersized when the goal requires a genuine scientific instrument or a high-fidelity professional simulator. It is exactly the right size for the long middle: the topics where a textbook diagram is not quite enough and a laboratory is not quite available, in any discipline.
