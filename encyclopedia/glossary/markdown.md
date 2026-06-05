# Markdown

> **In one line:** Markdown is a way of writing plain text so that simple symbols
> turn into formatting — without a toolbar, and readable even before it's rendered.

## In plain terms

You've used formatted documents your whole career (Word, Google Docs). Markdown is
the same idea with a different trick: instead of clicking a "bold" button, you type
a couple of symbols, and the text *becomes* formatted when displayed.

A few examples — left is what you type, right is what you get:

- `# Big heading` → a large heading
- `**important**` → **important**
- `- a list item` → a bullet point
- `[Bok Center](https://bokcenter.harvard.edu)` → a clickable link

The point: a Markdown file is just a text file. It opens anywhere, never breaks,
and is perfectly readable even *without* the formatting applied. That makes it ideal
for materials Claude reads and writes — including every doc in this glossary and the
[CLAUDE.md](claude-md.md) file.

**One distinction worth pinning down early:** when the workshop says *"give Claude
the markdown,"* it means *give Claude the text*, as opposed to giving it a PDF or
a Word document or a screenshot. PDFs are more like images of text than strings of
text; the model has to OCR them, sometimes badly. A markdown (or plain `.txt`)
version of the same content is what Claude actually wants to read. If your source
is a PDF, the first move is often: convert it to markdown.

You don't have to memorize the symbols. You can ask Claude to write Markdown for
you; the goal here is just to **recognize it** and not be thrown by the `#` and `*`.

## Why it matters in this workshop

Almost everything Claude produces and reads in [Claude Code](claude-code.md) is
Markdown. Knowing "oh, those symbols are just formatting" removes a common early
source of confusion.

## See also

- [CLAUDE.md](claude-md.md) · [SKILL.md](skill-md.md) — Markdown files you'll meet
- [Artifact](artifact.md) — other things Claude can produce
