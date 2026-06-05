# Prompt chaining

> **In one line:** Prompt chaining is when the output of one prompt becomes the
> input to the next — you build a pipeline of small, focused prompts instead of
> trying to do everything in one big one.

## In plain terms

The temptation, when you have something complicated to do, is to write one
enormous prompt that asks for everything: *"read these papers, summarize each
one, find the common themes, draft a literature review section, suggest three
discussion questions."* The output is usually mediocre at every step, because
the model is dividing its attention across too many goals.

**Prompt chaining** is the opposite move. You decompose the work into stages:

1. *Read each paper and produce a structured summary record.* (Save outputs.)
2. *Given these summary records, identify recurring themes.* (Save themes.)
3. *Given these themes and the original papers, draft a 400-word lit review
   section.* (Save draft.)
4. *Given this draft, propose three discussion questions a class could open
   with.* (Save questions.)

Each step has one job, one prompt, and an output you can inspect before moving
on. If step 2 is wrong, you fix it without re-running step 1. The shape of the
work — what the inputs were, what was produced at each stage, what's left — is
visible the whole time.

This is the same discipline as breaking a big task into functions in
programming, or breaking a long argument into linked paragraphs in writing. The
move predates LLMs; LLMs just make it cheap.

## Why it matters in this workshop

Most of the worked-example projects in the Examples section use this pattern. The
research-helper does *neutral summary first, pedagogical twist second*. The
exam-makeup generator does *read original → interview about scope → generate
candidates → assemble*. Once you see the pattern, you can spot it everywhere.

## See also

- [Structured Output](structured-output.md) — what each chain step usually produces
- [Skill (SKILL.md)](skill-md.md) — packaged prompt chains
- [Context Engineering](context-engineering.md) — the parent move
