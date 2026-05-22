---
layout: default
title: "Close Reading"
section: activities
---

# Close Reading

<div class="page-lead">Use Claude to analyze Shakespeare scenes, then reflect on what it catches, what it misses, and how to prompt for more useful literary observations.</div>

## The activity

Open a Shakespeare scene in Claude.ai and ask for a close reading. Then push: ask it to explain a specific image, trace a theme across the scene, or disagree with its own reading. The goal isn't getting a good essay — it's understanding *how Claude reads* and what kind of prompt produces more interesting output.

**Try:** Ask Claude why a character says something, then ask "what's the strongest counter-reading of that?" The disagreement prompt often produces more interesting output than the initial reading.

**Try:** Paste in just a single speech, ask for a close reading, then ask "what do you notice that a first-year student would likely miss?" Compare the two responses.

## On the corpus

The full Shakespeare corpus used in the workshop is the MIT Electronic Text Center edition — 37 plays in HTML, organized by play type. A few representative scenes are included here; the full corpus is available in the `claude-cowork-20260518/literature/` folder.

## Sample scenes

These scenes work well for first attempts:

### Hamlet, Act I Scene 1 — the ghost's first appearance

<span class="tag">tragedy</span> <span class="tag">ambiguity</span> <span class="tag">dramatic irony</span>

[View scene →]({{ site.baseurl }}/activities/01-close-reading/excerpts/hamlet-1-1.html)

A short scene, but dense. Good prompts: *What is Horatio's function here?* / *How does Shakespeare establish uncertainty about the ghost's nature in the language itself?*

### Hamlet, Act III Scene 1 — "To be or not to be"

<span class="tag">tragedy</span> <span class="tag">soliloquy</span> <span class="tag">close reading</span>

[View scene →]({{ site.baseurl }}/activities/01-close-reading/excerpts/hamlet-3-1.html)

Familiar enough that most participants have a prior reading, which makes Claude's version easier to evaluate critically.

### A Midsummer Night's Dream, Act II Scene 1 — Titania and Oberon

<span class="tag">comedy</span> <span class="tag">power</span> <span class="tag">language</span>

[View scene →]({{ site.baseurl }}/activities/01-close-reading/excerpts/msnd-2-1.html)

Less-cited than Hamlet scenes; participants arrive with fewer fixed readings and notice more.

---

## Prompting variations to try

```
Close read this passage for me.
```
```
What's the single most interesting thing happening in this scene that a reader might overlook?
```
```
Read this as if you were arguing that [character] is sympathetic. Now read it as if you were arguing the opposite.
```
```
What would a new historicist notice here that a formalist might miss?
```

---

*Source: MIT Electronic Text Center edition. Full corpus at `claude-cowork-20260518/literature/shakespeare-complete-works/`.*
