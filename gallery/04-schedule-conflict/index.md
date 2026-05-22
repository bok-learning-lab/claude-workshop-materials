---
layout: default
title: "Class Schedule Conflict"
section: gallery
---

# Class Schedule Conflict

<div class="page-lead">When Claude has a full course schedule as context, you can describe a real scheduling problem in plain language and get back a concrete, pedagogically reasoned solution — not a generic response, but one that knows your specific dates, topics, and guest speakers.</div>

## The project

Course: **GENED 1104: Science and Cooking** (Pia Sörensen & Dave Weitz, Harvard). The problem: Joanne Chang from Flour Bakery needs to reschedule her guest lecture. She can only come on the 30th — but there's already something on the 30th.

The inputs are the full course schedule and syllabus. The operation is a single prompt that hands Claude both files and asks it to identify the conflict, propose options with pedagogical trade-offs, recommend one, and output a revised schedule in the same format as the original.

## The prompt

```
I'm teaching GENED 1104: Science and Cooking at Harvard.
I've shared the course schedule and syllabus with you.

Here's the problem: Joanne Chang from Flour Bakery is scheduled as a guest
lecturer, but she's just let us know she can't make her assigned date.
She can only come on the 30th.

Please help me figure out what to do. Specifically:

1. Identify her current scheduled date in the course schedule
2. Check what's on the 30th — is there already something scheduled that day?
3. Propose 2–3 concrete options for resolving the conflict. For each option, describe:
   - What changes would need to be made to the schedule
   - Any pedagogical trade-offs (does moving her session disrupt a topic sequence?)
   - How much disruption the change causes to the rest of the schedule
4. Recommend one option and explain your reasoning
5. Draft a revised schedule reflecting your recommended solution,
   in the same format as the original schedule

Be specific — use actual dates and topic names from the schedule.
```

## What this demonstrates

The key move here is **context loading**. This is not a generic scheduling assistant — it knows that Joanne Chang's session is tied to Phase Transitions week, that the course has a specific topic sequence, and that Week 3 and Week 4 are adjacent in ways that matter. Claude's response uses actual dates and topic names because it has the full schedule in its context window.

The same pattern applies to any course:

- *A visiting scholar has to move — what's the least disruptive swap?*
- *We need to add a review session — where does it fit?*
- *We're losing a week to a holiday — which session can be compressed or dropped with the least damage to the arc?*

The heavier the context you provide (full schedule, syllabus, learning objectives), the more specific and pedagogically grounded the response.

## Project structure

```
inputs/
  GENED1104_Schedule.md      ← full course schedule with all dates and topics
  GENED1104_Syllabus.md      ← syllabus with learning goals and course structure
operations-tools-commands/
  01-resolve-scheduling-conflict-prompt.md
outputs/
  [revised schedule]
```

## Try it with your own course

1. Copy your course schedule into a text file (Markdown, plain text, or paste directly)
2. Share it with Claude alongside your syllabus
3. Describe the problem in plain language — "X needs to move, Y has a hard constraint"
4. Ask Claude to propose options with trade-offs and produce a revised schedule

The quality of the output scales directly with the quality of the context you provide.
