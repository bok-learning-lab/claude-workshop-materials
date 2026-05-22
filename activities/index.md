---
layout: default
title: Activities & Moves
section: activities
---

# Moves & Activities

<div class="page-lead">Short exercises and longer projects for building intuitions about how AI works — what it's good at, where it stumbles, and why.</div>

---

## Quick activities

Fast exercises (15–30 minutes) that work in Claude.ai or the browser.

**[Tokenization]({{ site.baseurl }}/activities/tokenization/)** — Paste text into the Tiktokenizer and watch how an LLM actually "reads" — as integers, not words. The fastest way to see what makes these systems strange.

<span class="tag">Claude.ai</span> <span class="tag">tokens</span> <span class="tag">how LLMs work</span>

**[Multiplication]({{ site.baseurl }}/activities/multiplication/)** — If it's all numbers, is an LLM good at arithmetic? Test it. The answer is illuminating.

<span class="tag">Claude.ai</span> <span class="tag">tool use</span> <span class="tag">failure modes</span>

**[Close Reading]({{ site.baseurl }}/activities/close-reading/)** — Use Claude to analyze Shakespeare scenes — then compare its reading with your own. What does it catch? What does it flatten?

<span class="tag">Claude.ai</span> <span class="tag">literary analysis</span>

**[Population Pyramids]({{ site.baseurl }}/activities/population-pyramids/)** — Feed Claude UN population data. Ask it to do arithmetic by hand — it fails. Ask it to write code — it succeeds. The clearest demonstration of why tool use matters.

<span class="tag">Claude Code</span> <span class="tag">data visualization</span> <span class="tag">tool use</span>

**[Recipes]({{ site.baseurl }}/activities/recipes/)** — Give Claude a photo, a partial recipe, or a list of ingredients and see how it builds from context. A gentle introduction to multimodal prompting.

<span class="tag">Claude.ai</span> <span class="tag">multimodal</span> <span class="tag">prompting</span>

---

## Longer projects

Worked examples — with full inputs, operations, and outputs — that you can run yourself or adapt to your own course materials.

**[Class Schedule Conflict]({{ site.baseurl }}/activities/schedule-conflict/)** — Load a full course schedule and syllabus, then ask Claude to resolve a real guest-speaker conflict. Demonstrates context-loaded, domain-specific reasoning.

<span class="tag">Claude Code</span> <span class="tag">document processing</span>

**[Makeup Exams]({{ site.baseurl }}/activities/makeup-exams/)** — Give Claude past exams and ask it to generate a calibrated new one. Demonstrates exemplar-based generation and structured output.

<span class="tag">Claude Code</span> <span class="tag">assessment</span>

**[Research Helper]({{ site.baseurl }}/activities/research-helper/)** — Ingest a set of research papers, summarize each, cross-link them, and produce a synthesis document. Demonstrates long-document processing and iterative refinement.

<span class="tag">Claude Code</span> <span class="tag">research synthesis</span>

**[How to Build an MCP]({{ site.baseurl }}/activities/how-to-build-an-mcp/)** — A walkthrough for building a Model Context Protocol server — the mechanism that connects Claude Code to external APIs and tools.

<span class="tag">Claude Code</span> <span class="tag">MCP</span> <span class="tag">tool building</span>
