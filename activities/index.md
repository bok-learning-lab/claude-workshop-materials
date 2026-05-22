---
layout: default
title: Activities & Moves
section: activities
---

# Moves & Activities

<div class="page-lead">Short exercises for building intuitions about how AI works — what it's good at, where it stumbles, and why. Most take 15–30 minutes and work in Claude.ai or Claude Code.</div>

---

## [Tokenization]({{ site.baseurl }}/activities/05-tokenization/)

Paste text into the Tiktokenizer and watch how an LLM actually "reads" — as a sequence of integers, not words. Rare words fragment, code stays clean, non-English text gets expensive. And if it's all numbers, maybe LLMs are good at math?

<span class="tag">Claude.ai</span> <span class="tag">tokens</span> <span class="tag">how LLMs work</span>

---

## [Multiplication]({{ site.baseurl }}/activities/04-multiplication/)

Spoiler from the tokenization activity: they aren't. Ask Claude to multiply two large numbers without code — watch it fail. Then ask it to write Python. The fastest demonstration of why tool use matters.

<span class="tag">Claude.ai</span> <span class="tag">tool use</span> <span class="tag">failure modes</span>

---

## [Close Reading]({{ site.baseurl }}/activities/01-close-reading/)

Use Claude to analyze Shakespeare scenes — then compare its reading with your own. What does it catch? What does it flatten?

<span class="tag">Claude.ai</span> <span class="tag">literary analysis</span>

---

## [Population Pyramids]({{ site.baseurl }}/activities/02-population-pyramids/)

Feed Claude UN population data. Ask it to do arithmetic by hand — notice it fails. Ask it to write code — notice it succeeds. The clearest demonstration of why tool use matters.

<span class="tag">Claude Code</span> <span class="tag">data visualization</span> <span class="tag">tool use</span>

---

## [Recipes]({{ site.baseurl }}/activities/03-recipes/)

Give Claude a photo, a partial recipe, or a list of ingredients and see how it builds from context. A gentle introduction to multimodal prompting.

<span class="tag">Claude.ai</span> <span class="tag">multimodal</span> <span class="tag">prompting</span>

---

> **On failure modes:** Multiplication and Population Pyramids are deliberately designed around moments where Claude *doesn't* do well. These aren't bugs to avoid — they're the most useful things in the curriculum.
