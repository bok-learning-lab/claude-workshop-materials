# MCP: Connecting Claude to Live Data (Overview)

> **In one line:** MCP lets Claude query real databases in real time instead of guessing from memory.

## What it is

Claude has a blind spot. It can only work with its training data (which has a cutoff date) and whatever you paste into the conversation. It can't go look something up.

**MCP (Model Context Protocol)** changes that. It connects Claude to external services such as databases, search engines, and APIs, so it can query them in real time.

The mental model: **MCP servers are like browser extensions for Claude.** They don't change what Claude *is* -- they change what Claude *can do*.

Behind the scenes, MCP works by wrapping **APIs** (Application Programming Interfaces). An API is a structured way for one program to request data from another -- it's what powers the website when you search Semantic Scholar in your browser. An MCP server makes those same requests on Claude's behalf. Most major academic services have APIs (Semantic Scholar, PubMed, CrossRef, Canvas, Zotero). Whether a service has one determines whether an MCP can connect to it.

## Why it matters

**The results are real.** When Claude uses an MCP to search Semantic Scholar, every paper it returns actually exists, with real citation counts and real DOIs. This is fundamentally different from asking Claude to recall papers from memory, where it might hallucinate.

Compare:

- **Without MCP:** "Claude, what papers exist on grade inflation?" Claude draws on training data that may be outdated or simply wrong. It might invent plausible-sounding citations.
- **With MCP:** "Claude, search Semantic Scholar for papers on grade inflation." Claude makes a live query and gets real results it can filter by year, field, and citation count.

And understanding the pattern matters even if you never build one yourself. When a vendor says "our AI is connected to your data," you now have a framework for asking *how* -- and for understanding the limits.

## What you could connect Claude to

Any service with a web API can become an MCP server. Here are some relevant to academic work:

| Service | What it provides | Key for faculty |
|---|---|---|
| [Semantic Scholar](https://api.semanticscholar.org/api-docs/) | Paper search, citation data, recommendations | Literature discovery with real citation counts |
| [OpenAlex](https://docs.openalex.org/) | Open scholarly metadata | Free, no API key required |
| [CrossRef](https://api.crossref.org/) | DOI metadata for publications | Verify and enrich citations (no key required) |
| [ORCID](https://info.orcid.org/documentation/api-tutorials/) | Researcher profiles and publication lists | Look up a colleague's or collaborator's work |
| [Zotero](https://www.zotero.org/support/dev/web_api/v3/start) | Personal reference library | Claude could search and organize your own collection |
| [Canvas LMS](https://canvas.instructure.com/doc/api/) | Course data, assignments, grades | Student-facing tools within institutional guardrails |

The Semantic Scholar MCP in this workshop is one example. The pattern is general: **anyone can connect Claude to any web service that has an API.**

## The big idea

An MCP doesn't make Claude smarter. It gives Claude access to real, current data that it couldn't otherwise reach. The model still does the synthesis -- but now it's working with verified, live information instead of guessing from training data.

## Want more info?

For setup instructions, config file locations, troubleshooting, a step-by-step walkthrough you can try yourself, and guidance on building your own MCP, see **mcp-for-faculty.md** in the workshop resources.
