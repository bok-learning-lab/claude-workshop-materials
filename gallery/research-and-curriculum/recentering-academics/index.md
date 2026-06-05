---
layout: default
title: Recentering Academics
section: gallery
---

# Recentering Academics — source-grounded curricular recommendations

A worked example of using Claude Code to turn three layers of source material — the Bok Center's published guidance, Harvard's own institutional case for change, and external empirical research on grading — into **concrete, source-grounded curricular recommendations** for a department or an individual instructor.

Built around the Bok Center's *Recentering Academics* initiative: centering students' academic experience through (1) meaningful, engaged classroom sessions and (2) rigorous assessment and feedback that grades the full range of student achievement and is resilient to generative AI.

The project ships two operations (one for a whole concentration, one for a single course syllabus) and worked examples for both, using Linguistics as the demo target. Generation discipline: **every recommendation must trace back to a specific source principle and a specific feature of the target** — generic best-practice boilerplate is the failure mode.

## What it is

Two operations, three layers of inputs, and worked outputs for the Linguistics demo.

### The two operations

| Operation | Input | Output |
|---|---|---|
| Concentration-level recommendations | One Fields-of-Concentration profile | `outputs/<slug>-concentration-recommendations.md` |
| Syllabus-level redesign | One course syllabus | `outputs/<course>-syllabus-redesign.md` |

The two are **independent** — they share the same three source layers but answer different questions and can be run separately. A department chair can run the concentration operation against their field's profile; an individual instructor can run the syllabus operation against their own course without touching the concentration question at all.

### Three source layers

Each layer plays a distinct role; the prompts read all three in this order.

- **Bok advice** — the Bok Center's *Recentering Academics* framework: an overview plus three guidance pages on course policies, designing assignments, and facilitating class sessions. This layer is the **normative basis** — what good practice looks like.
- **Harvard context** — Harvard's own institutional case for change. The anchors are Dean Claybaugh's October 2025 grade report (A's rose from 24% in 2005 to 60.2% in 2025; the argument that grading has stopped performing its functions of motivation, information, and distinction) and the February 2026 Subcommittee on Grading proposal (the 20%+4 cap on A grades; the average-percentile-rank internal metric). Crimson, Gazette, and Inside Higher Ed pieces supply the supporting coverage. This layer is the **why now** — the stakes specific to Harvard.
- **Research** — the external empirical evidence base on grading across the full range and curbing inflation. Backed by four collected papers: Sadler 2005 on criterion- vs norm-referenced grading; Jonsson & Svingby 2007 on analytic rubrics, exemplars, and rater training; Butcher et al. 2014 on the Wellesley mean cap; Bar et al. 2009 on the Cornell median-posting experiment. This layer is the **what works** — the validated practices a recommendation should rest on.

Plus the **targets** the operations are applied against: Harvard College Fields of Concentration profiles (the Linguistics file is the worked example), and a representative course syllabus (LING 5312, Language & Politics, used as the worked syllabus example).

### Worked outputs

- **`linguistics-concentration-recommendations.md`** — recommendations for the Linguistics concentration, anchored in the discipline's actual tutorial structure, methods courses, and thesis option.
- **`sample-syllabus-redesign.md`** — redesign of LING 5312 (Language & Politics) against the same framework, working at the assignment and policy level rather than the curriculum level.

## How the prompts work

The build is one careful prompt per operation, applied in two passes, against three source layers and a target.

**Step 1 — Assemble the three source layers.** The Bok guidance is captured from the Center's published pages. The Harvard context is captured from Dean Claybaugh's report (the data source) and the Subcommittee proposal (the policy source), with the Crimson / Gazette / Inside Higher Ed pieces as supporting coverage. The external research is gathered as four papers plus a synthesis overview. The order matters: **Bok is normative, Harvard is the urgency, research is validation.**

**Step 2 — Capture the target.** For the concentration operation, the target is a Fields-of-Concentration profile (one markdown file per discipline, with self-description, learning objectives, requirements, and enrollment data). For the syllabus operation, the target is a single course syllabus.

**Step 3 — Two-pass generation.** The prompts enforce a specific order — **read and diagnose first, recommend second** — so the framing does not distort the diagnosis. Read all three source layers and the target fully. Note where the target already centers academics and where it has gaps. Then recommend, organizing the output around the two Recentering pillars (engaged classroom experience; rigorous assessment & feedback), tying each recommendation to a specific feature of the discipline or course.

**Step 4 — Tie every recommendation to source and target.** Every recommendation must trace back to two things: a source principle (from Bok, Harvard, or the research) and a specific feature of the target (a tutorial, a course requirement, an assignment, a policy). Generic recommendations that would read identically for any discipline are the failure mode the prompts are designed to prevent — sharpen them or cut them.

**Step 5 — Apply to Linguistics for the demo.** Both operations were run with Linguistics as the target — the concentration recommendation against the official Linguistics field-of-concentration profile, the syllabus redesign against LING 5312 (Language & Politics). The two outputs sit side by side as the demo of what the toolkit produces.

## Things this approach taught us

**The two-pass structure (diagnose first, recommend second) is the smallest move that keeps the framing from distorting the diagnosis.** If both happen in a single pass, the model tends to manufacture problems to justify recommendations it had already decided to make. Splitting them — "what does this concentration already do well? what are the gaps? *then* what should it do?" — keeps the diagnostic layer honest.

**The three-layer input structure does real work.** Bok alone produces normative recommendations divorced from the institution. Harvard alone produces urgency without practice. Research alone produces validated practices that aren't tailored to the moment. Together they produce recommendations that have a normative basis, an institutional rationale, and an evidence base — and that can survive a department chair asking "why is this what you're proposing for *us*."

**For grading recommendations specifically, the research layer matters most.** The Cornell median-posting experiment (Bar et al. 2009) showed that publishing grade data to students can backfire — students used it to find easier courses. The Wellesley mean cap (Butcher et al. 2014) worked but was costly. The Sadler (2005) distinction between criterion-referenced and norm-referenced grading is the conceptual move that makes the rest legible. A recommendation that proposes "publish more grade data" or "cap A's" without invoking the research that documented those experiments' failure modes is doing harm.

## Notes for adapting

The pattern is **three layers of source (normative + institutional + research) + a target (a department or a course) + a two-pass diagnose-then-recommend prompt + a discipline-specific output**. It applies to any consulting-style operation where:

1. **The recommendation must be specific to the target**, not generic. Generic boilerplate is the failure mode.
2. **The recommendation must be defensible to a skeptical stakeholder** — a department chair, a dean, an accreditation reviewer, a funder. Every recommendation traces back to a source and a target feature.
3. **The recommendation must be evidence-based.** The research layer is what separates serious advice from vibes.

This pattern ports to any institutional initiative — **accessibility policy, anti-cheating policy, generative-AI policy, departmental review, accreditation self-study** — where you have written guidance and want it operationalized at the syllabus or program level. Domains where the same shape applies almost without modification:

- **Curriculum review against accreditation standards.** Accreditation criteria as the normative layer; institutional self-study as the urgency layer; research on the practice area as evidence. Target: a program self-study. Output: a redesign recommendation.
- **Departmental review reports** for any kind of formal review. Same three-layer structure, different normative and evidence layers.
- **Policy development against published guidelines** — federal regulations as normative, institutional reality as urgency, evidence base as validation. Target: a draft policy. Output: revised draft with sourcing.
- **Clinical guideline application** to a specific department or institution — published guidelines (normative), local case data (urgency), randomized-trial evidence (validation). Target: a clinic's current protocol. Output: a redesign recommendation with sourcing.
- **Editorial guidance against journal standards** — house style guide (normative), recent feedback (urgency), genre evidence (validation). Target: a manuscript. Output: a revision plan.
- **Grant proposal coaching** — funder guidelines (normative), institutional success rates (urgency), funded-proposal patterns (validation). Target: a draft proposal. Output: a revision memo.

### Alignment constraints that survive translation

- **Discipline-specific over generic.** Anchor recommendations in the target's actual structure (tutorials, tracks, thesis options; or assignments, policies, course design). If a recommendation would read identically for any field, sharpen it or cut it.
- **Faithful to the source.** Quote the normative documents, the institutional reports, the research findings, and the target accurately. Do not invent requirements, courses, policies, or findings.
- **Respect the research's cautions.** Validated practices come with documented failure modes. Cite the failure modes, not just the headline result.
- **Honest diagnosis.** Name what the target already does well, not only its gaps. Don't manufacture problems to justify recommendations.
- **Two operations, two outputs.** Keep concentration-level and syllabus-level work in separate output files. Don't merge them.
