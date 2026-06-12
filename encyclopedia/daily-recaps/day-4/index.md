---
layout: default
title: Day 4 — Recap
section: encyclopedia
---

# Day 4 — MCPs, security, and what's next

<div class="page-lead">The closing session. Faculty connect Claude Code to external services through the Model Context Protocol — Harvard Art Museums, arXiv, Replicate — and meet the security implications head-on. The day's central tension is responsibility: once Claude can take actions on your behalf, "yes yes yes" through permission prompts becomes a real attack surface. Two MCP handouts plus a security-concerns handout faculty are encouraged to keep next to their first MCP install — joined, after the June 8–11 run, by the UI/API/MCP conceptual frame and the closing "what you can make" gallery handout.</div>

## Handouts

Print-ready tabloid handouts in the Learning Lab house style. Each ships as a self-contained HTML page (open in any browser) and a vector PDF (print on letter or tabloid).

### MCP for faculty — overview

The one-page version. What MCP is (a convention for wrapping APIs so Claude can call them), what changes when Claude gets a new "sense," and the three MCPs from the workshop session: Harvard Art Museums, arXiv, Replicate.

**[View HTML](mcp-for-faculty-overview.html){:target="_blank"}** · **[Download PDF](mcp-for-faculty-overview.pdf)** · [Source markdown](mcp-for-faculty-overview.md)

### MCP for faculty — deep dive

The longer companion. Includes `.mcp.json` examples, the API-key-storage discussion, the difference between project-scoped and user-scoped MCPs, and a walkthrough of what changes between Claude Code (where MCPs are natively supported) and the desktop app (where setup is friskier).

**[View HTML](mcp-for-faculty.html){:target="_blank"}** · **[Download PDF](mcp-for-faculty.pdf)** · [Source markdown](mcp-for-faculty.md)

### Security concerns — read this before your first MCP

The handout faculty should keep next to their first MCP install. Covers prompt injection (overt and covert), the case for read-only permissions, the case against "always allow," and the everyday hygiene of `.gitignore`-ing API keys. The cost of pausing to confirm a destructive action is low; the cost of a misfired one can be high.

**[View HTML](security-concerns.html){:target="_blank"}** · **[Download PDF](security-concerns.pdf)** · [Source markdown](security-concerns.md)

### UI, API, MCP

The conceptual frame underneath the whole day, from the June 8–11 run: every digital service has three doors — the UI built for humans, the API where the bulk power has always been, and MCP as the standard adapter that walks you through the API doors without becoming a developer first. The "Costco move." (Source: [`claude-code-20260611`](https://github.com/bok-learning-lab/claude-code-20260611/tree/main/resources/day-4-handouts/ui-api-mcp).)

**[View HTML](ui-api-mcp.html){:target="_blank"}** · **[Download PDF](ui-api-mcp.pdf)** · [Source markdown](ui-api-mcp.md)

### What you can make with Claude — a gallery

The closing handout from the June 8–11 run: six genres of faculty project on one axis, from the writing you already command (reports, letters, grant pages) down through reference pages, web apps, connected tools, data visualizations, and agentic pipelines — each with quick examples and one project unpacked as inputs → operations → outputs. A one-page map of the same territory this site's [Activities &amp; Examples]({{ site.baseurl }}/activities/) section covers in depth. (Source: [`claude-code-20260611`](https://github.com/bok-learning-lab/claude-code-20260611/tree/main/resources/day-4-handouts/what-you-can-make).)

**[View HTML](what-you-can-make.html){:target="_blank"}** · **[Download PDF](what-you-can-make.pdf)** · [Source markdown](what-you-can-make.md)

## Working MCP servers to clone

The June 8–11 repo ships six working MCP servers and API clients as self-contained folders — Semantic Scholar paper search, arXiv, Google Gemini vision, Replicate image generation, the Harvard Art Museums collection, and a HOLLIS (Harvard Library) client — each wired into the repo's `.mcp.json` so they load on clone. See [`claude-code-20260611/mcps-apis/`](https://github.com/bok-learning-lab/claude-code-20260611/tree/main/mcps-apis) for the table of servers and the setup instructions, and the [How to Build an MCP]({{ site.baseurl }}/activities/how-to-build-an-mcp/) walkthrough for building your own.

---

*[← All Daily Recaps]({{ site.baseurl }}/encyclopedia/daily-recaps/)*
