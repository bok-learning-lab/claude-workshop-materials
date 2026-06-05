---
layout: default
title: Activities & Examples
section: activities
---

# Activities & Examples

<div class="page-lead">Two kinds of material live on this page. <b>Activities</b> are short hands-on exercises for building intuitions about how Claude works — what it's good at, where it stumbles, why. <b>Examples</b> are worked faculty projects grouped by the pattern they demonstrate — with prompts, inputs, and outputs you can read in place and lift for your own course.</div>

---

## Activities

Five short exercises. Each one runs in fifteen minutes or less and is designed to make one core property of the system visible. Start at the top and work down; the order is deliberate.

### [Tokenization]({{ site.baseurl }}/activities/tokenization/)

Paste text into the Tiktokenizer and watch how an LLM actually "reads" — as integers, not words. The fastest way to see what makes these systems strange.

### [Multiplication]({{ site.baseurl }}/activities/multiplication/)

If it's all numbers, is an LLM good at arithmetic? Test it. The answer is illuminating.

### [Close Reading]({{ site.baseurl }}/activities/close-reading/)

Ask Claude about a Shakespeare scene without the text: it hallucinates. Give it the text: it immediately reverses and produces a real reading. The humanities version of the multiplication activity.

### [Population Pyramids]({{ site.baseurl }}/activities/population-pyramids/)

Feed Claude UN population data. Ask it to do arithmetic by hand — it fails. Ask it to write code — it succeeds. The clearest demonstration of why tool use matters.

### [Recipes]({{ site.baseurl }}/activities/recipes/)

A folder of badly-named images becomes a structured recipe website in two prompts. Demonstrates the "messy inputs → structured data" move that transfers to almost every field.

---

## Examples

Real faculty builds, grouped into six pattern families. Each category page introduces the move and links to specific instantiations; each project page embeds the prompt, the inputs, and the move worth noticing so you can read the work in place instead of chasing source repos.

### [Interactive Concept Simulations]({{ site.baseurl }}/gallery/interactive-simulations/)

PhET-style single-file HTML widgets — small, manipulable, conceptually disciplined worlds in which a learning idea becomes visible. The kind of artifact that historically required a development team is now within reach of a faculty member with an afternoon. Includes the physics-interactives skill suite (`/phet-sim`, `/phet-activity`, `/phet-accessibility-audit`, `/phet-rationale`) and Becca Belofsky's library of ~25 discrete-math interactives.

### [Course Websites with Interactive Demos]({{ site.baseurl }}/gallery/course-websites/)

Deployed multi-page Next.js apps anchored to specific course material: a landing page, two or three interactive demos tied to the canonical texts or images of the course, reference content for students. Students explore the course's concepts parametrically rather than just reading about them. Includes the *Rashomon* lighting-diagram site (GENED 1049 East Asian Cinema), the three-failure-modes voice-and-style site (CompLit 126x Love Songs), and the Kluge-rules image-generation studio.

### [Practice & Assessment Tools]({{ site.baseurl }}/gallery/practice-and-assessment/)

Tools faculty use to generate assessments and tools students use to rehearse for them. Designed to *coach* rather than *grade* — the human stays the final judge. Includes the oral-exam practice bot (recording, transcription, follow-up, coach's note) and the exam-makeup generator (a three-mode skill tested on the Harvard CS20 spring-2026 final).

### [Source → Teaching Materials]({{ site.baseurl }}/gallery/source-to-teaching/)

Distillation pipelines that turn primary sources — a paper, a lecture transcript, a folder of papers, a set of lecture notes — into pedagogical artifacts: case studies, top-ten takeaways, illustrated lectures, summary docs with explicit research-agenda twists. Includes the paper-to-teaching workflow (built around Jeff Behrends' AI-ethics paper), the class summarizer that produced this workshop's own handouts, the art-history-lecture MCP example, and the research-helper pattern.

### [Reading at Scale]({{ site.baseurl }}/gallery/reading-at-scale/)

Using an LLM as a *close reader at corpus scale* — refusing grep, refusing keyword matches, instead reading each text fully and surfacing structured findings. Works for song lyrics, dense modernist novels, comparative translation, qualitative interview corpora, and primary-source philology. Includes Dylan-lyrics writer-naming, Joyce's *Finnegans Wake* Fionn-hunting, Calvino's *Memos* by the numbers, Mary Waters' flexible-coding skills, and the *Odyssey* in fourteen translations alongside seventeenth-century Sanskrit poetics.

### [Research & Curriculum Synthesis]({{ site.baseurl }}/gallery/research-and-curriculum/)

Projects whose inputs are institutional, policy, or research-in-progress documents — and whose outputs are concrete recommendations or navigable sites for sharing the work. Includes the ~150-line research-paper-site viewer (drawn from the *Harvest Times* Anglo-Saxon harvest-pharmacology research site) and the Bok Center *Recentering Academics* synthesis pipeline that turns three layers of institutional and empirical material into department-level recommendations.

---

## Workshop project walkthroughs

Older, longer walkthroughs from earlier workshop sessions. Useful if you want to see the same patterns above in their first, more verbose form — full prompts, full inputs, fewer abstractions.

### [Schedule Conflict]({{ site.baseurl }}/activities/schedule-conflict/)

Load a full course schedule and syllabus, then ask Claude to resolve a real guest-speaker conflict. Demonstrates context-loaded, domain-specific reasoning.

### [Makeup Exams]({{ site.baseurl }}/activities/makeup-exams/)

The original makeup-exam workflow built around Harvard's GENED 1104 *Science and Cooking*. Gives Claude past exams and asks for a calibrated new one. (A more developed version of this same move ships as the [exam-makeup generator skill]({{ site.baseurl }}/gallery/practice-and-assessment/exam-makeup-generator/) in the Examples section above.)

### [Research Helper]({{ site.baseurl }}/activities/research-helper/)

The original research-helper workflow with four context-window papers. (The fuller pattern with adapting notes is in the [Source → Teaching Materials]({{ site.baseurl }}/gallery/source-to-teaching/research-helper/) example.)

### [How to Build an MCP]({{ site.baseurl }}/activities/how-to-build-an-mcp/)

A walkthrough for building a Model Context Protocol server — the mechanism that connects Claude Code to external APIs and tools. Wraps the Replicate image-generation API as a worked example.
