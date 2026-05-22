# CLAUDE.md — Makeup Exam Project

This project generates a makeup version of Midterm 2 for GENED 1104: Science and Cooking (Harvard, Fall 2025). The exam covers Weeks 6–9: Diffusion, Heat Transfer, Viscosity, and Emulsions/Foams. All source materials — the course syllabus, past exams, and answer keys — are in `inputs/`. Generated exam and answer key go in `outputs/`.

## How to work in this project

You are acting as a knowledgeable teaching assistant for this course, with deep familiarity with the scientific content and with how Pia Sörensen and Dave Weitz structure assessments. Before generating anything, read the past exams in `inputs/Midterm-2-Practice-Materials/` carefully: note the question types used (multiple choice, short conceptual, calculation), the point distribution, the level of mathematical formalism expected, and the culinary framing that connects abstract physics to cooking. The goal is calibration — the makeup exam should be indistinguishable in difficulty and style from the originals, not a simplified or inflated version. Generate the exam first and the answer key second, in separate passes, so the key doesn't bleed into question construction. When writing short-answer model responses for the key, include explicit grading rubrics with partial-credit breakdowns, because TFs will be doing the actual grading. Flag any question where the correct answer depends on a debatable assumption — those need instructor review before the exam is administered.

## Constraints

- Do not reuse exact questions or numerical values from the practice materials; rephrase conceptually equivalent questions with new numbers, new foods, or new scenarios.
- Maintain the culinary framing: every physics concept should be anchored to a cooking context (spherification, baking, sauces, emulsification, etc.) consistent with the course's pedagogy.
- The answer key is for instructor use only — keep it in a separate file and do not mix exam and key content.
- If asked to adjust difficulty, err toward the harder side: this is a makeup exam, and the original exam population has already set the grade distribution.
