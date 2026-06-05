---
layout: default
title: Glossary
section: encyclopedia
---

# AI Glossary

Plain-language definitions for every key term in the workshop. Each entry is a standalone page — use them as reference while working through activities, or read them in the suggested order below to build a mental model of how Claude works.

---

## The basics — who and what

| Term | One-line gist |
|---|---|
| [Claude]({{ site.baseurl }}/encyclopedia/glossary/claude/) | The AI assistant you're talking to. |
| [Anthropic]({{ site.baseurl }}/encyclopedia/glossary/anthropic/) | The company that makes Claude. |
| [Claude Code]({{ site.baseurl }}/encyclopedia/glossary/claude-code/) | A version of Claude that can work with the files on your computer. |
| [Cowork]({{ site.baseurl }}/encyclopedia/glossary/claude-cowork/) | The shared session format for group Claude Code work. |
| [Model (Opus / Sonnet / Haiku)]({{ site.baseurl }}/encyclopedia/glossary/model/) | Which version of Claude is doing the thinking — depth vs. speed. |
| [API]({{ site.baseurl }}/encyclopedia/glossary/api/) | Using Claude from software instead of a chat window. |
| [Hallucination]({{ site.baseurl }}/encyclopedia/glossary/hallucination/) | When Claude states something false with full confidence. |
| [Data Classification]({{ site.baseurl }}/encyclopedia/glossary/data-classification/) | Harvard's sensitivity levels and what's safe to paste into Claude. |

## How Claude "thinks"

| Term | One-line gist |
|---|---|
| [Large Language Model (LLM)]({{ site.baseurl }}/encyclopedia/glossary/llm/) | What Claude is: a next-text predictor. |
| [Token / Tokenization]({{ site.baseurl }}/encyclopedia/glossary/token/) | The chunks of text Claude reads and writes in. |
| [Tool Call]({{ site.baseurl }}/encyclopedia/glossary/tool-call/) | When Claude *does* something (runs code, reads a file) instead of just talking. |
| [Agent]({{ site.baseurl }}/encyclopedia/glossary/agent/) | Claude pursuing a goal over multiple steps. |
| [Sub-agents]({{ site.baseurl }}/encyclopedia/glossary/sub-agents/) | Helper Claudes spawned to handle parts of a task in parallel. |
| [Harness]({{ site.baseurl }}/encyclopedia/glossary/harness/) | The program around Claude that runs the loop and its tools. |
| [RAG]({{ site.baseurl }}/encyclopedia/glossary/rag/) | Showing Claude only the relevant chunks of a large document instead of the whole thing. |

## How Claude remembers — the context story

Read these as a chain; each builds on the last.

| Term | One-line gist |
|---|---|
| [Context]({{ site.baseurl }}/encyclopedia/glossary/context/) | Everything Claude can "see" right now — the basis for every reply. |
| [Context Window]({{ site.baseurl }}/encyclopedia/glossary/context-window/) | The fixed amount of context Claude can hold at once. |
| [Context Rot]({{ site.baseurl }}/encyclopedia/glossary/context-rot/) | How answers degrade as the window fills with clutter. |
| [Primacy Effect]({{ site.baseurl }}/encyclopedia/glossary/primacy-effect/) | Why what's at the *start* of the context pulls hardest on the answer. |
| [Context Engineering]({{ site.baseurl }}/encyclopedia/glossary/context-engineering/) | Deliberately choosing what goes into the context. |
| [Memory]({{ site.baseurl }}/encyclopedia/glossary/memory/) | Optional saved notes re-read at the start of new conversations. |
| [Hand-off doc]({{ site.baseurl }}/encyclopedia/glossary/hand-off-doc/) | A written record so the next session — yours or another Claude's — can pick up. |

## Talking to Claude

| Term | One-line gist |
|---|---|
| [Prompt]({{ site.baseurl }}/encyclopedia/glossary/prompt/) | What you send to Claude. |
| [System Prompt]({{ site.baseurl }}/encyclopedia/glossary/system-prompt/) | Background instructions Claude has before you start typing. |
| [Prompt Chaining]({{ site.baseurl }}/encyclopedia/glossary/prompt-chaining/) | Making the output of one prompt the input to the next. |
| [Structured Output]({{ site.baseurl }}/encyclopedia/glossary/structured-output/) | Asking Claude to return its answer in a fixed shape (table, JSON, fields). |
| [Prompt Injection]({{ site.baseurl }}/encyclopedia/glossary/prompt-injection/) | When text Claude reads contains hidden instructions trying to hijack it. |

## Files, formats, and outputs

| Term | One-line gist |
|---|---|
| [Markdown]({{ site.baseurl }}/encyclopedia/glossary/markdown/) | Plain text where simple symbols become formatting. |
| [HTML]({{ site.baseurl }}/encyclopedia/glossary/html/) | The language web pages are written in — Claude can produce it. |
| [CLAUDE.md]({{ site.baseurl }}/encyclopedia/glossary/claude-md/) | A notes file Claude reads first, so it knows your project. |
| [plan.md]({{ site.baseurl }}/encyclopedia/glossary/plan-md/) | A markdown plan for the project, written before any real work begins. |
| [SKILL.md]({{ site.baseurl }}/encyclopedia/glossary/skill-md/) | A reusable instruction packet for a specific task. |
| [Artifact]({{ site.baseurl }}/encyclopedia/glossary/artifact/) | A finished thing Claude produces — a doc, chart, or web page. |
| [Project]({{ site.baseurl }}/encyclopedia/glossary/project/) | A long-running Claude.ai workspace with shared instructions and files. |
| [Compact]({{ site.baseurl }}/encyclopedia/glossary/compact/) | Claude Code's command to summarize and compress the current conversation. |

---

## Suggested reading order

1. [Claude]({{ site.baseurl }}/encyclopedia/glossary/claude/) → [Anthropic]({{ site.baseurl }}/encyclopedia/glossary/anthropic/) → [Markdown]({{ site.baseurl }}/encyclopedia/glossary/markdown/)
2. [LLM]({{ site.baseurl }}/encyclopedia/glossary/llm/) → [Token]({{ site.baseurl }}/encyclopedia/glossary/token/) → [Context]({{ site.baseurl }}/encyclopedia/glossary/context/) → [Context Window]({{ site.baseurl }}/encyclopedia/glossary/context-window/) → [Context Rot]({{ site.baseurl }}/encyclopedia/glossary/context-rot/)
3. [Prompt]({{ site.baseurl }}/encyclopedia/glossary/prompt/) → [System Prompt]({{ site.baseurl }}/encyclopedia/glossary/system-prompt/) → [Memory]({{ site.baseurl }}/encyclopedia/glossary/memory/)
4. [Artifact]({{ site.baseurl }}/encyclopedia/glossary/artifact/) → [Tool Call]({{ site.baseurl }}/encyclopedia/glossary/tool-call/) → [Claude Code]({{ site.baseurl }}/encyclopedia/glossary/claude-code/) → [CLAUDE.md]({{ site.baseurl }}/encyclopedia/glossary/claude-md/)
5. [Agent]({{ site.baseurl }}/encyclopedia/glossary/agent/) → [Harness]({{ site.baseurl }}/encyclopedia/glossary/harness/) → [Model]({{ site.baseurl }}/encyclopedia/glossary/model/) → [API]({{ site.baseurl }}/encyclopedia/glossary/api/)
