# Structured output

> **In one line:** Structured output is when you ask Claude to return its answer
> in a fixed shape — a table, a JSON object, a numbered list with specific
> fields — instead of as free-form prose.

## In plain terms

If you ask Claude *"summarize these ten poems,"* you get ten paragraphs that
each look a little different. If you ask Claude *"for each poem, return a JSON
object with `title`, `rhyme_scheme`, `meter`, `year`, `dominant_image`,"* you get
ten records you can chart, sort, filter, or feed into the next operation.

That's structured output: trading the warmth of prose for the leverage of a
shape. A poem becomes a row in a table. A research paper becomes a record with
fields. A scene from a film becomes a JSON object whose keys you can plot. The
analysis you used to do across a stack of papers by hand becomes something you
can chart.

A few moves that recur once you start thinking this way:

- **Spider charts** — score a body of texts on five or six trait dimensions, plot
  the average, then plot a student's draft on the same axes. Calvino's *Memos*
  become a shape; the student writes the sixth.
- **Index codes** — apply broad codes to an interview transcript anchored to a
  protocol's sections, then count, sort, and visualize coverage. The qualitative
  research version.
- **Per-paper records** — read a folder of PDFs, return one JSON record per
  paper with author, year, finding, evidence type — generate an index page from
  the records.

The trick is not the format itself; it is the discipline of *deciding ahead of
time what shape the answer needs* so the output is usable by the next step in
your pipeline.

## Why it matters in this workshop

Structured output is the move that turns Claude from a smart conversationalist
into a research instrument. The moment you can say "give me the answer as a
table," many things that used to be qualitative essays become tractable as
counts, distributions, and side-by-side comparisons.

## See also

- [Prompt](prompt.md) — where you specify the shape
- [Artifact](artifact.md) — the resulting thing
- [Tool Call](tool-call.md) — what Claude can do with structured data once it's
  produced
