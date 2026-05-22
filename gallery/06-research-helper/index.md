---
layout: default
title: "06 · Research Helper"
section: gallery
---

# 06 · Research Helper

<div class="page-lead">Summarize, cross-link, and synthesize a set of research papers — with Claude doing the reading loop and you directing the synthesis.</div>

## The project

A Claude Code project for working through a reading list: ingesting PDFs or markdown documents, summarizing each, identifying connections across sources, and producing a synthesis document.

The CLAUDE.md for this project defines the reading and synthesis workflow:

[Read CLAUDE.md →]({{ site.baseurl }}/gallery/06-research-helper/CLAUDE.md)

## What this demonstrates

- **Long-document processing.** Reading full papers, not just abstracts — using Claude Code's file-reading tools to ingest PDFs.
- **Structured output.** Producing per-paper summaries in a consistent format that can be re-ingested in later passes.
- **Cross-document reasoning.** Asking Claude to identify where papers agree, contradict, or extend each other — work that benefits from having all the summaries in context at once.
- **Iterative refinement.** Running multiple passes: first summaries, then connections, then synthesis — rather than asking for everything at once.

## Project structure

```
inputs/
  [research papers as PDFs or markdown]
operations-tools-commands/
  [the prompts and sessions used]
outputs/
  [per-paper summaries]
  [synthesis document]
```
