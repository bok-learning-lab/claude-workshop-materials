---
layout: default
title: "05 · Makeup Exams"
section: gallery
---

# 05 · Makeup Exams

<div class="page-lead">Generate a makeup version of a Harvard exam that is indistinguishable in difficulty, style, and culinary framing from the original — including a separate answer key with grading rubrics.</div>

## The project

Course: **GENED 1104: Science and Cooking** (Pia Sörensen & Dave Weitz, Harvard). The project generates a makeup version of Midterm 2, covering Weeks 6–9: Diffusion, Heat Transfer, Viscosity, Emulsions/Foams.

The CLAUDE.md for this project is worth reading before anything else — it encodes the calibration logic that makes this more than a generic "write an exam" prompt:

[Read CLAUDE.md →]({{ site.baseurl }}/gallery/05-makeup-exams/CLAUDE.md)

## What this demonstrates

- **Calibration from exemplars.** Claude reads past exams *before* generating, not after — so the output matches question types, point distributions, and mathematical formalism.
- **Separation of exam and key.** The CLAUDE.md instructs Claude to generate the exam first, key second, in separate passes — preventing key-bleeds into question construction.
- **Instructor-facing rubrics.** The answer key includes partial-credit grading rubrics, because TFs will do the actual grading.
- **Constraint satisfaction.** No reused questions, maintained culinary framing, difficulty matched to the original exam's grade distribution.

## Project structure

```
inputs/
  GENED1104_Syllabus.md
  GENED1104_Schedule.md
  Midterm-2-Practice-Materials/
    [past exams and answer keys]
outputs/
  [generated exam]
  [generated answer key]
```
