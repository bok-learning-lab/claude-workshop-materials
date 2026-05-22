---
layout: default
title: "Tokenization"
section: activities
---

# Tokenization

<div class="page-lead">Before anything else: LLMs don't read. Not the way you do. This activity makes that visible in about five minutes — and once you've seen it, you can't unsee it.</div>

## A strange kind of mind

When you read the sentence *"The cat sat on the mat,"* you perceive words. You know what a cat is. You have a felt sense of sitting, of mats, of the whole small scene.

A language model sees none of that. It sees a sequence of integers.

Everything — every poem, every equation, every medical record, every line of code — enters the model as a list of numbers. Tokens are the bridge: short fragments of text (sometimes whole words, sometimes syllable-pieces, sometimes just a few letters) that have been mapped to integers in the model's vocabulary. The model operates entirely on those integers. It never looks at letters.

This is not a technical footnote. It is the thing about LLMs that explains almost everything else — what they're good at, where they fail, and why those failure modes have the particular shape they do.

---

## Try it

Go to **[tiktokenizer.vercel.app](https://tiktokenizer.vercel.app/)** and paste this:

```
Unsurprisingly, they had to cancel the show. The crowd went home unhappily.
```

Watch the model break the text into colored chunks. Each color is one token — one integer.

**What to notice:**

- Common short words ("the", "to", "they") are single tokens — the model has seen them millions of times, they get their own slot
- "Unsurprisingly" probably splits: the model has seen *parts* of it, not the whole thing
- Punctuation often gets its own token, or fuses to the preceding word
- "Unhappily" may or may not split at the morpheme boundary — interesting either way

Now try the Welsh place name:

```
Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch
```

Watch it fragment. The model has almost certainly never seen this as a unit. It falls back to small sub-word pieces — many more tokens than letters would suggest, many more than a Welsh reader would need.

Now try some code:

```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
```

Notice how cleanly the keywords tokenize. `def`, `return`, `if` — single tokens, no fragmentation. Python keywords are extremely common in training data. The model has a slot for them.

---

## What this tells you

The tokenization is not neutral. It reflects what the model has seen. Common English words: efficient, single tokens. Rare words: fragmented, expensive. Non-English text: often very fragmented — more tokens per idea, more of the context window consumed per sentence. Code in common languages: surprisingly clean.

This has real consequences:

- **Rare words cost more.** Unusual vocabulary, technical jargon, and non-English text use more tokens and fill the context window faster.
- **The model predicts the *next token*, not the next word.** Generation is a sequence of choices over ~50,000 possible next integers. That is a fundamentally different operation from how a person writes.
- **Token count ≠ word count.** A 1,000-word document is probably 1,200–1,500 tokens.

---

## This is a small window into a big subject

We won't go deep on how LLMs actually work in this workshop — that's a course in itself. If you want a comprehensive, general-audience treatment, Andrej Karpathy's [Deep Dive into LLMs like ChatGPT](https://www.youtube.com/watch?v=7xTGNNLPyMI) is the place to start. It covers the full training stack, how to think about the model's "psychology," and how to use these systems well in practice — no prior ML background required.

What matters for our purposes is this: **the model is, at bottom, a very sophisticated function over sequences of integers.** Not words. Not ideas. Integers.

Which raises an obvious question. If it's all numbers — if the model is fundamentally doing arithmetic over a vocabulary of integers — maybe it's actually good at math?

**Spoiler: it isn't. [Try the multiplication activity →]({{ site.baseurl }}/activities/04-multiplication/)**
