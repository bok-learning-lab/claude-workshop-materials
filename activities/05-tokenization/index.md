---
layout: default
title: "Tokenization"
section: activities
---

# Tokenization

<div class="page-lead">Paste text into a tokenizer and watch how an LLM "reads." This is the fastest way to make the gap between human reading and machine reading visible.</div>

## The activity

Go to **[tiktokenizer.vercel.app](https://tiktokenizer.vercel.app/)** and paste in this sentence:

```
Unsurprisingly, they had to cancel the show. The crowd went home unhappily.
```

Watch how the model breaks the text into colored chunks — tokens.

**What to notice:**
- "Unsurprisingly" is probably split across multiple tokens
- Common short words ("the", "to", "they") are likely single tokens
- Punctuation often gets its own token, or attaches to the word before it
- The word "unhappily" may split at a morpheme boundary — or may not

Try changing the model in the dropdown (GPT-4, GPT-2, etc.) and notice how the tokenization differs.

---

## Things to try

**Rare or long words:**
```
Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch
```
*(A Welsh place name — watch it fragment)*

**Whitespace:**
```
hello    hello  hello
```
*(Leading spaces often become part of the following token)*

**Code vs. prose:**
```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
```
*(Programming keywords often tokenize very cleanly — they're extremely common in training data)*

**Non-English text:**
```
Привет мир
```
*(Cyrillic and other non-Latin scripts often tokenize less efficiently — more tokens per word)*

---

## The takeaway

LLMs don't read words. They read tokens — integers that represent fragments of text. The model's "vocabulary" is typically 50,000–100,000 tokens, and every piece of text you send is first converted into a sequence of these integers.

This has real consequences:
- **Token count ≠ word count.** A 1,000-word document might be 1,200–1,500 tokens depending on vocabulary.
- **Rare words cost more.** Unusual words, technical jargon, and non-English text fragment into more tokens and use more of the context window.
- **The model predicts the next token, not the next word.** When it generates text, it's choosing from a distribution over ~50,000 possible next tokens. That's fundamentally different from how humans produce language.

The multiplication activity showed you what the model *can't* do (calculate). This one shows you the *unit of processing* it's actually working with.
