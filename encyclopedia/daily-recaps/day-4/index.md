---
layout: default
title: Day 4 — Recap
section: encyclopedia
---

# Day 4 — MCPs, security, and what's next

<div class="page-lead">The closing session. Faculty connect Claude Code to external services through the Model Context Protocol — Harvard Art Museums, arXiv, Replicate — and meet the security implications head-on. The day's central tension is responsibility: once Claude can take actions on your behalf, "yes yes yes" through permission prompts becomes a real attack surface. Two MCP handouts plus a security-concerns handout faculty are encouraged to keep next to their first MCP install.</div>

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

---

*[← All Daily Recaps]({{ site.baseurl }}/encyclopedia/daily-recaps/)*
