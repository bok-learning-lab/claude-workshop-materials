# RAG (Retrieval-Augmented Generation)

> **In one line:** RAG is the trick of *not* putting a whole document in
> Claude's context — instead, breaking it into chunks, searching for the
> relevant ones, and showing Claude only those.

## In plain terms

If you have a 400-page PDF and you want to ask Claude questions about it, you
have two options. **Option A** is to dump the whole PDF into the
[context window](context-window.md) and let Claude read everything. That works,
up to a point, but it's slow, expensive, and the answer quality degrades as
the context fills up ([context rot](context-rot.md)).

**Option B** is RAG. Before you ask the question, an external system breaks the
PDF into chunks (usually at the paragraph level), turns each chunk into a
numerical fingerprint (an *embedding*), and stores them. When you ask
*"what does this document say about the harvest-time monasteries?"*, the system
quickly searches for the chunks most similar to your question, retrieves the
top handful, and shows *only those* to Claude. Claude reads ten paragraphs
instead of four hundred.

The trade-off is honesty: with RAG, Claude is answering based on what the
retrieval system *thought* was relevant. If your question's answer is in a
chunk the retrieval missed, Claude won't know to look. With full-context
reading, Claude sees everything but pays the context-rot cost.

The Claude.ai sandbox uses RAG when you upload large PDFs; that's why it can
answer about a long document instantly without seeming to "read" it all.
Claude Code, by contrast, can read whole files at full fidelity when you tell
it to — at the cost of context window space.

## Why it matters in this workshop

The choice between *give Claude the whole document* and *give Claude the
retrieved chunks* is one of the cleanest design decisions in Claude Code work.
For close reading (Shakespeare, a single research paper), put the whole thing
in context. For a 500-document corpus you'll be asking many questions about,
RAG is the only way.

## See also

- [Context Window](context-window.md) — the constraint RAG is dodging
- [Context Rot](context-rot.md) — what happens to full-context reading at scale
- [Reading at Scale gallery]({{ site.baseurl }}/gallery/reading-at-scale/) —
  projects that work *with* the corpus, not against it
