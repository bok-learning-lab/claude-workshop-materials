# Prompt: Source Existing Close Readings as Context

Use this prompt *before* generating your close reading. It asks Claude to search for published scholarly close readings and use them as context, so the generated reading can engage with existing critical conversation.

---

## Step 1 — Find existing close readings

```
I want to write a close reading of [PASSAGE/SCENE] from Shakespeare's [PLAY TITLE].

Before I do, please search the web for:
1. Published academic close readings of this specific passage or scene (journal articles, book chapters, dissertations)
2. Notable critical interpretations of this passage — who has written about it, and what are their main claims?
3. Any well-known critical controversies or cruxes in this passage (e.g., disputed readings, textual variants, famous critical disagreements)

Summarize what you find. For each source, note: author, publication, year, and the core argument. Flag anything that would be especially useful context for a new close reading.
```

---

## Step 2 — Generate a contextually informed close reading

Once Claude has returned a summary of existing readings, follow up with:

```
Thank you. Now, drawing on those sources as context and critical backdrop, please write your own original close reading of this passage. Your reading should:

- Acknowledge where it agrees or disagrees with the scholars you found
- Identify what those readings may have missed or underweighted
- Make its own original argument, grounded in the text

Do not simply summarize the existing scholarship — use it as a foil for your own interpretation.
```

---

## Why this two-step approach?

Sourcing existing readings first gives Claude (and you) a richer critical frame. The generated close reading becomes a contribution to a conversation rather than a reading in a vacuum. This mirrors how academic close readings are actually written.

---

## Notes

- Works best with well-studied passages (Hamlet's "To be or not to be," Macbeth's dagger soliloquy, etc.)
- For less-studied passages, Step 1 may return fewer results — that's useful information too
- Save Step 1 output in `outputs/` alongside the final close reading for your records
