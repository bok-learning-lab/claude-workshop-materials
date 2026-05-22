---
layout: default
title: "Makeup Exams"
section: gallery
---

# Makeup Exams

<div class="page-lead">Give Claude your past exams and ask it to write a new one. Not a paraphrase — a calibrated, independently authored exam that matches your original in difficulty, format, point distribution, and disciplinary style.</div>

## The project

Course: **GENED 1104: Science and Cooking** (Pia Sörensen & Dave Weitz, Harvard). The task: generate a makeup version of Midterm 2, covering Weeks 6–9 — Diffusion, Heat Transfer, Viscosity, Emulsions/Foams.

The inputs are the course syllabus and several years of past Midterm 2 exams with answer keys. Claude reads those before generating anything, using them as calibration material. The CLAUDE.md encodes the logic that distinguishes this from a generic "write me an exam" prompt.

## The prompt

```
I'm teaching GENED 1104: Science and Cooking at Harvard.
I've shared the course syllabus and several years of Midterm 2 exams
and answer keys with you.

Please generate a new makeup version of Midterm 2 that:

1. Covers the same topics as the existing Midterm 2
2. Matches the format of the existing exams — same question types
   (multiple choice, short answer, calculations), same approximate
   number of questions, same point distribution
3. Is comparable in difficulty — not easier, not harder. Use the
   existing exams as your calibration
4. Uses different questions — do not reuse questions from the past exams.
   Write original questions that test the same concepts in new ways
5. Includes all necessary reference material — if the original exams
   included an equation sheet or reference table, generate an equivalent
   one for this new exam

After generating the exam, please also generate a complete answer key with:
- The correct answer for every question
- Brief explanations for each answer explaining the underlying concept
- For calculation questions: the full worked solution

Format the exam as a clean, professional document.
The answer key should be clearly separated from the exam itself.
```

## What this demonstrates

**Calibration from exemplars.** Claude reads past exams *before* generating, not after. This is what produces a makeup exam rather than a generic exam — the output reflects question type distributions, point allocations, mathematical formalism levels, and culinary framing that are specific to this course.

**Separation of passes.** The CLAUDE.md instructs Claude to generate the exam first and the key second, in separate outputs. This prevents the key from influencing question construction (a subtle but real failure mode if you ask for both at once).

**Instructor-facing rubrics.** The answer key includes partial-credit breakdowns, because TFs will do the actual grading. The CLAUDE.md specifies this explicitly.

The same pattern applies to any course with past assessments on file:

- *Generate a makeup for any exam that follows a consistent format*
- *Draft a quiz calibrated to a specific week's readings*
- *Produce problem sets at a target difficulty given a set of prior examples*
- *Write new versions of questions that avoid the exact numbers or scenarios from the original*

The quality of the output is determined by the quality of the exemplars you share.

## The CLAUDE.md

The CLAUDE.md for this project is worth reading as a template. It tells Claude:

- What the course is and what the exam covers
- To read past exams carefully *before* generating, noting question types, point distribution, and culinary framing
- To generate exam first, key second (separate passes)
- To include partial-credit breakdowns in the key
- To flag questions where the correct answer depends on a debatable assumption
- Hard constraints: no reused questions, no simplified difficulty, maintain culinary framing throughout

[Read CLAUDE.md →]({{ site.baseurl }}/gallery/05-makeup-exams/CLAUDE.md)

## Project structure

```
inputs/
  GENED1104_Syllabus.md
  Midterm-2-Practice-Materials/
    [past exams and answer keys as PDFs and DOCX]
operations-tools-commands/
  01-generate-makeup-exam-prompt.md
outputs/
  makeup-exam.md
  answer-key.md
```

## Try it with your own course

1. Gather 2–3 past exams and their answer keys in any readable format (PDF, Word, Markdown)
2. Share them with Claude along with your syllabus
3. Use the prompt above, adapted to your course and exam format
4. Review the output against your original — check for question type distribution, difficulty, and that nothing was reused verbatim

The more exemplars you provide, the tighter the calibration.
