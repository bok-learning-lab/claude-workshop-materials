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

Everything — every poem, every equation, every medical record, every line of code — enters the model as a list of numbers. Tokens are the bridge: short fragments of text mapped to integers in the model's vocabulary. The model operates entirely on those integers. It never looks at letters.

---

## Try it

Go to **[tiktokenizer.vercel.app](https://tiktokenizer.vercel.app/)** and paste this sentence:

```
Unsurprisingly, they had to cancel the show. The crowd went home unhappily.
```

Watch the model break the text into colored chunks. Each color is one token — one integer.

Notice how the text fragments. Common short words ("the", "to", "they") get their own slot because the model has seen them millions of times. Longer or rarer words split at boundaries that have nothing to do with meaning — just with what patterns appear together in training data.

Now try the Welsh place name:

```
Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch
```

Watch it shatter into pieces. The model has almost certainly never encountered this as a unit. It falls back to small sub-word fragments — many more tokens than a Welsh reader would need.

Now try some Python:

```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
```

Notice how cleanly the keywords tokenize. `def`, `return`, `if` — single tokens, no fragmentation. Python keywords appear millions of times in training data. The model has a dedicated slot for them. Code in common languages is, in a specific sense, *more native* to these models than most human language.

---

## What you're looking at

The tokenization is not neutral. It reflects what the model has seen. It has an implicit map of what's common and what's rare, what's central to its training data and what's at the margins.

Non-English text: often very fragmented — more tokens per idea, more of the context window consumed per sentence. A sentence in Tamil or Welsh costs more than the same thought in English. This isn't a design decision. It's a fossil record of what the internet looked like when these models were trained.

The model predicts the *next token*, not the next word. Generation is a sequence of choices over roughly 50,000 possible next integers. That is a fundamentally different operation from how a person writes or reads. There is no comprehension at any step. There is pattern completion over a learned distribution of integer sequences.

This is what makes these systems strange — not that they're too human, but that they're not human at all, and yet produce outputs that pattern-match so closely to human language that the difference is easy to miss.

---

If you want to go deeper on how this all works — the full training stack, how to think about these models' "psychology," what the integers actually mean — Andrej Karpathy's [Deep Dive into LLMs like ChatGPT](https://www.youtube.com/watch?v=7xTGNNLPyMI) is the place to start. General audience, comprehensive, no hand-waving.

**Now: [if it's all integers, maybe LLMs are good at math? →]({{ site.baseurl }}/activities/multiplication/)**
