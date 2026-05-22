---
layout: default
title: "Multiplication"
section: activities
---

# Multiplication

<div class="page-lead">The tokenization activity showed you that a language model processes everything as integers. So: is a system that operates entirely on numbers actually good at arithmetic? Find out.</div>

*If you haven't done the [Tokenization activity]({{ site.baseurl }}/activities/05-tokenization/) yet, start there.*

---

## Step 1 — Ask normally

Open Claude.ai (or any LLM — Gemini, Llama, GPT-4). Ask it:

```
What is 82,345 × 67,890?
```

Notice what it does. Does it reach for a tool? Does it compute? Does it hedge?

---

## Step 2 — Take away the tools

Now ask the same question, but explicitly remove the shortcut:

```
What is 82,345 × 67,890? Solve it without using code or a calculator — work it out step by step.
```

Watch what happens. The model will produce working — often confident, often plausible-looking. The answer will probably be wrong. The correct answer is **5,592,495,050**.

**What to notice:** Is it wrong by a little or a lot? Does it express any uncertainty, or does it state the answer with the same confidence it would give for 2 + 2?

---

## Step 3 — Give it back

Now ask it to use code:

```
Calculate 82,345 × 67,890. Write Python to do this and run it.
```

The model writes `print(82345 * 67890)`, executes it, and returns the exact answer. Same model, same question — the only change was giving it access to a tool.

---

## The point

LLMs don't calculate. They predict the next token based on statistical patterns learned from text. When you constrain them to "no code," they produce a number that *looks like* the answer to a multiplication problem — formatted correctly, with plausible-looking working — but it isn't computed. It's predicted.

When they write and run code, the arithmetic happens in Python, not in the model. The model's job becomes "write correct code," which it's much better at because correct code appears reliably in training data.

The model's relationship to numbers is fundamentally statistical: it has learned what numbers tend to appear near other numbers in text. That is not the same thing as knowing what they mean.

---

## Variations

```
What is 17 × 13?
```
*(Small enough that many models get it right — but for the wrong reason)*

```
What is 99,999 × 99,999? No code.
```
*(Almost certainly fails — and interesting to see how far off)*

```
You just gave me an answer. Write code to check whether it was correct.
```
*(Ask the model to catch its own error)*
