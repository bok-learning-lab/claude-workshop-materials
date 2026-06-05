---
layout: default
title: Interactive Concept Simulations
section: activities
---

# Interactive Concept Simulations

A small, manipulable, conceptually disciplined world in which a learning idea becomes visible. The student moves a slider, watches three linked representations update together, and confronts the gap between their prediction and what the constrained model actually does. The pedagogical move is the simplification — what is *left out* so the concept can become visible — not the realism of the rendering. The lineage is Carl Wieman's PhET project at Colorado, founded 2002: a faithful model, immediate feedback, multiple linked representations, a deliberately simplified world. PhET's evidence base accumulated over decades because each artifact was the product of a multi-year team and hundreds of student interviews.

What LLMs change is the cost of prototyping the artifact, not the cost of the design discipline behind it. The risk is real: a bad AI-generated simulation can be seductive — sliders, particles, color, motion, all responding immediately — with no learning goal at the center. The projects below are organized around that risk. They run a structured pedagogical interview *before* any code is generated, hold a hard output contract that keeps the artifact portable, and gate "ready to share with students" behind an accessibility audit.

## Projects in this category

### [Physics Interactives](physics-interactives/)

A self-contained bundle of four skills — `/phet-sim`, `/phet-activity`, `/phet-accessibility-audit`, `/phet-rationale` — single-file HTML templates, an 8-dimension quality rubric, a sample teaching brief (heat pumps). The interview phase is the contribution. The skill refuses to declare a simulation done if it scores below 12/16 on the rubric or scores 0 on any dimension; refuses to ship a lesson plan that does not name at least two expected wrong predictions.

[Project page](physics-interactives/) · [Day-4 summary]({{ site.baseurl }}/gallery/day-4/project-overviews/physics-interactives/summary/) · [Tradition essay]({{ site.baseurl }}/gallery/day-4/project-overviews/physics-interactives/tradition/) · [Affordance essay]({{ site.baseurl }}/gallery/day-4/project-overviews/physics-interactives/affordance/)

### [Becca Belofsky's Discrete Math Interactives](../day-4/becca-interactives/)

About twenty-five working interactives authored by one faculty member using the `/phet-sim` skill for a discrete-math course: a Monty Hall simulator and a Law-of-Total-Probability variant, a Bayesian update slider, a Euclidean-algorithm stepper, a recursion-tree visualizer, a DFA builder, derivation and proof-step arrangers. Each opens by double-click; none require a build step. The folder is the answer to *what does a faculty member actually produce with this pattern in an afternoon*.
