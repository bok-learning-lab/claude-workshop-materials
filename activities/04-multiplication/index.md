---
layout: default
title: "Multiplication"
section: activities
---

# Multiplication

<div class="page-lead">The fastest way to understand what an LLM actually is: ask it to multiply two large numbers without using code, watch it fail, then ask it to write Python and watch it succeed.</div>

*In the [Tokenization activity]({{ site.baseurl }}/activities/05-tokenization/), you saw that a language model processes text as a sequence of integers — tokens. No words, no concepts: numbers all the way down. That raises a natural question: is a model that operates entirely on numbers actually good at arithmetic? This activity answers that.*

## Step 1 — Ask for raw multiplication

Open Claude.ai (or try with Gemini Flash, Llama, or any older model). Use this exact prompt — the "without using code" constraint is what forces the LLM to rely on pattern prediction rather than calculation:

```
82,345 × 67,890. Give me an immediate answer without using code.
```

Try it yourself first — notice how hard it is to do in your head. Then see what the model says.

**What to look for:** Is the answer completely wrong, or plausibly wrong? Off by a small amount, or off by an order of magnitude? Did it show confident working, even if the answer was wrong?

---

## Step 2 — Ask it to use code

Now ask the same model:

```
Calculate 82,345 × 67,890. Write Python code to do this and run it.
```

The model will write `print(82345 * 67890)` and execute it. The answer will be exact: **5,592,495,050**.

**Notice the difference:** same model, same question — but one answer is unreliable, the other is exact. The only change was giving it access to a tool.

---

## The takeaway

LLMs don't calculate. They predict the next token (roughly: the next piece of a word or number) based on statistical patterns learned from text. When you ask for multiplication "in their head," they're producing a number that *looks like* the answer to a multiplication problem, not one that *is* the answer.

When they write and run code, the calculation happens in Python, not in the model. The model's job becomes "write correct code" — which it's much better at than mental arithmetic, because correct code appears reliably in its training data.

This is the core reason tool use matters. The model's job shifts from *produce the answer* to *use the right tool for the job*.

---

## Variations to try

```
What is 17 × 13? Answer immediately, no code.
```
*(Small enough that many models get it right — compare to the larger example)*

```
What is 99,999 × 99,999? No code.
```
*(Very likely to fail — and interesting to see how far off)*

```
Now write code to check your answer.
```
*(Asking the model to catch its own error)*
