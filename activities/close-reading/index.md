---
layout: default
title: "Close Reading"
section: activities
---

# Close Reading

<div class="page-lead">The humanities version of the multiplication activity. Without grounding, the LLM will confidently get things wrong — or refuse entirely. Give it the text and redirect it, and you may be surprised by what it can do.</div>

## The pattern

Ask Claude about a specific scene without giving it the text. It may hallucinate that the scene doesn't exist, mis-attribute lines, or confabulate plot details. Here's an example — asked about a specific act and scene, Claude asserts it doesn't exist:

<figure style="margin: 1rem 0 1.5rem;">
  <img src="https://files.slack.com/files-pri/T0HTW3H0V-F0B4ZA85TT2/screenshot_2026-05-15_at_1.55.00___pm.png?pub_secret=818607e758" alt="Claude hallucinating that a Shakespeare act doesn't exist" style="max-width:100%; border-radius:4px; border: 1px solid rgba(0,0,0,0.12);">
  <figcaption style="font-size:0.85rem; color: rgba(31,30,29,0.55); margin-top:0.5rem;">Asked about a specific scene without context, Claude confidently says it doesn't exist.</figcaption>
</figure>

Now paste in the actual text. Claude immediately walks it back:

<figure style="margin: 1rem 0 1.5rem;">
  <img src="https://files.slack.com/files-pri/T0HTW3H0V-F0B48L21ZHA/screenshot_2026-05-15_at_1.56.21___pm.png?pub_secret=83b79de412" alt="Claude immediately reversing itself when given the text" style="max-width:100%; border-radius:4px; border: 1px solid rgba(0,0,0,0.12);">
  <figcaption style="font-size:0.85rem; color: rgba(31,30,29,0.55); margin-top:0.5rem;">The same model, shown the actual text, immediately reverses — and produces a real reading.</figcaption>
</figure>

This is the classic "Claude gives in immediately" pattern. It's also a demonstration of what context does: the model isn't broken, it was just ungrounded. The quality of what it produces *with the text in front of it* can be genuinely surprising. The point of this activity is to experience that gap directly.

---

## The activity

**Step 1 — Ask without context.** Pick a scene from below. Ask Claude about it by name, without pasting the text. Note what it says — confident claims, errors, refusals.

**Step 2 — Paste the text and redirect.** Now give it the scene and ask for a close reading. Compare. Push further: ask it to explain a specific image, trace a theme, or take the opposite position from whatever it just argued.

The goal isn't a good essay — it's understanding what grounding does, and what kind of prompt gets the most interesting output.

---

## Sample scenes

### Hamlet, Act I Scene 1 — the ghost's first appearance

<span class="tag">tragedy</span> <span class="tag">ambiguity</span> <span class="tag">dramatic irony</span>

[View scene →]({{ site.baseurl }}/activities/close-reading/excerpts/hamlet-1-1.html)

Short but dense. Good prompts: *What is Horatio's function here?* / *How does Shakespeare establish uncertainty about the ghost's nature in the language itself?*

### Hamlet, Act III Scene 1 — "To be or not to be"

<span class="tag">tragedy</span> <span class="tag">soliloquy</span> <span class="tag">close reading</span>

[View scene →]({{ site.baseurl }}/activities/close-reading/excerpts/hamlet-3-1.html)

Familiar enough that most participants have a prior reading — which makes Claude's version easier to evaluate critically.

### A Midsummer Night's Dream, Act II Scene 1 — Titania and Oberon

<span class="tag">comedy</span> <span class="tag">power</span> <span class="tag">language</span>

[View scene →]({{ site.baseurl }}/activities/close-reading/excerpts/msnd-2-1.html)

Less-cited than the Hamlet scenes; participants arrive with fewer fixed readings and tend to notice more.

---

## Prompting variations

```
Close read this passage for me.
```
```
What's the single most interesting thing happening in this scene that a reader might overlook?
```
```
Read this as if you were arguing that [character] is sympathetic. Now argue the opposite.
```
```
What would a new historicist notice here that a formalist might miss?
```
```
What's the strongest counter-reading of the interpretation you just gave?
```

---

*Source: MIT Electronic Text Center edition. Full corpus at `claude-cowork-20260518/literature/shakespeare-complete-works/`.*
