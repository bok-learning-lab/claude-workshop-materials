# Markdown Review

**Markdown** is a lightweight text-formatting syntax — a way of writing plain text that renders as structured documents. You write `**bold**` and it becomes **bold**; you write `# Heading` and it becomes a heading. But the deeper point is that markdown is just text: no proprietary format, no hidden structure. That makes it a "language" AI handles extremely well. Because large language models like Claude are trained on vast amounts of text from the internet — and markdown dominates how structured writing lives on the internet — it has become the de facto input/output format for text-based AI work. When you prompt Claude in markdown, it responds in markdown. When it generates a document, it writes markdown. Many people working with LLMs use markdown as their primary format for both input and output, for everything from quick notes to full drafts.

If you want a syntax refresher, there is a full markdown cheatsheet from Day 3 at `_context/day-3/markdown-cheatsheet.md`.

---

## Markdown File Types

Any markdown file can be used effectively as context in Claude Code — as input, as an operations guide, as a reference document, as a set of tools or instructions. As long as you point the agent to the markdown file by name or with a path, it will read it. This means you can reuse files across sessions and projects, or generate new ones on the fly. We did this on Day 3, when you created a `PLAN.md` to help structure your project: that file became a living document Claude could consult and update as the work evolved. You could also make an `about-me.md` or ask Claude to generate a `handoff.md` to help keep a project oragnized across chats. 

As you continue developing markdown files that support your work — style guides, past syllabi, information on the project, schemas that exist in your head about your discipline — and start pointing Claude to dozens of them in a single session, alongside chat transcripts, book chapters, articles, documentation, and anything the AI itself generates, you start to burn through your context window.

### The Context Window Problem

Claude's context window holds 200,000 tokens — roughly the length of a novel. That sounds like a lot. But the space is already spoken for before you type a single word, and it fills up quickly once you start loading files.

```
Your 200,000-token context window — start of session

┌──────────────────────────────────────────────────────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓│                                                          │
│  system   │                      (available)                         │
│  prompt   │                                                          │
│  ~10K     │                                                          │
└──────────────────────────────────────────────────────────────────────┘

After "read all my files" — a few prompts in

┌──────────────────────────────────────────────────────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│▒▒▒▒▒▒▒▒▒▒▒▒▒▒│    │
│  system   │  your files: syllabi, style guides,  │  responses   │    │
│  prompt   │  plans, PDFs, code, transcripts ...  │  1, 2, 3...  │    │
└──────────────────────────────────────────────────────────────────────┘
  ▓ system prompt   ░ your documents   ▒ AI-generated text
```

Context is basically full after only a few prompts — if you load everything at once. Claude then has to start "compacting" (a very intense summarization) or dropping older content, and the model loses access to things it has already read. The solution is not to load less — it is to be smarter about *when* and *how* each document enters the window.

---

## Special Markdown Files

Claude has addressed this by making "special" types of markdown files that are read at different points in the project lifecycle, and read with different levels of granularity. These special documents all use **YAML frontmatter** — a block of structured metadata between `---` markers at the very top of the file:

```yaml
---
name: My Style Guide
description: Prose style rules for this project — voice, citation format, sentence length
type: reference
---
```

YAML (Yet Another Markup Language) is a simple key-value format. Claude reads these headers at the beginning of every session, so it knows what is in your project — but it does not load the full body of the document into the context window until you (or Claude) explicitly need it for a specific task. **Metadata is cheap; full content is expensive.**

These special types include: CLAUDE.md files, skills, MCP tools, rules, file/path-scoped rules, output style guides, and more. Some are also accessed via slash commands — `/compact`, for instance, triggers both a markdown summary template and some scripts that package the result back into context in structured form.

---

## CLAUDE.md and Skills

These are the two you will use most.

**CLAUDE.md** is always read in full at the start of every session — automatically, before your first message. Because everything in it costs tokens every time, keep it focused on facts and standing rules rather than long narratives: project conventions, commands Claude should know, constraints, anything you would otherwise have to repeat every session.

**Skills** are for specific processes. A skill is a markdown file with a YAML header (read at session start) and a body (read only when triggered). You can attach scripts to a skill, so running `/my-skill` can both give Claude detailed step-by-step instructions and execute supporting code. Claude reads the headers at the start — it knows the skill exists and what it does — but only pulls the full document in when you call it, or when Claude decides the skill is the right tool for what you are doing.

```
Session start — what Claude loads automatically

┌─────────────────────────────────────────────────────────────────────┐
│  CLAUDE.md (full)  │  skill headers only  │  rule headers only  │   │
└─────────────────────────────────────────────────────────────────────┘

You run /my-skill — or Claude decides it is relevant

┌─────────────────────────────────────────────────────────────────────┐
│  CLAUDE.md (full)  │  skill: FULL BODY now loaded  │  ...           │
└─────────────────────────────────────────────────────────────────────┘
```

The result: a project folder full of rich, specialized documents — none of them flooding the window until they are actually needed.

---

## All Special Markdown Types

| Type | When Claude reads it | Use when |
|------|---------------------|----------|
| **CLAUDE.md** | In full, every session, automatically | Standing facts, rules, and project conventions. Everything here is always in context, so keep it tight. |
| **Skill** (`SKILL.md`) | YAML header at session start; full body when triggered by `/skill-name` or Claude | Repeatable workflows and processes — generating a report, scaffolding a component, running a deploy checklist. Can have scripts attached. |
| **Rules** | Loaded as constraints before tool use | Hard limits on what Claude can or cannot do in this project (e.g., "never write to `_context/read_only/`"). |
| **File/path-scoped rules** | Loaded only when Claude works in the matching files or directories | Directory-specific conventions — different rules for `src/` vs. `docs/`, for instance. |
| **Output style** | Pulled in when generating a document of that type | Formatting and voice conventions for a specific deliverable: a syllabus, a lab report, a dataset description. |
| **MCP tool manifest** | Read at connection time | Defines an external tool (GitHub, a database, an API) Claude can call as if it were a built-in. Not prose — a schema. |
| **`append-system-prompt`** | Injected before the session starts, at the settings level | Adding instructions at the highest priority level — above even CLAUDE.md. Text you add here is appended to Claude's system prompt itself, so it is present before any session begins. Use for rules that must always apply across all projects: formatting defaults, persona constraints, absolute prohibitions. |
