# MCP: Connecting Claude to Live Data

## What MCP is (start here)

Claude does some things pretty well: analysis, brainstorming, explaining things. But Claude has a blind spot. It can only work with what's in its training data (which has a cutoff date) and whatever you paste into the conversation. It can't go look something up.

MCP changes that. It stands for **Model Context Protocol**, and it's a way to connect Claude to external services such as databases, search engines, and APIs, so it can query them in real time.

Here's the key mental model: **MCP servers are like browser extensions for Claude.** They don't change what Claude *is* -- they change what Claude *can do*.

Three things to know up front:

1. **You don't have to build anything to use one.** If an MCP is already set up in your project (like the Semantic Scholar one in this workshop), you just talk to Claude normally. "Find papers about X" works, and Claude handles the rest.
2. **An MCP is not magic.** It's a small program (~400 lines of Python) that translates Claude's requests into API calls and formats the results. You can read the code if you're curious.
3. **The results are really real.** When Claude uses an MCP to search Semantic Scholar, every paper it returns actually exists, with real citation counts and real DOIs. This is fundamentally different from asking Claude to recall papers from memory, where it might hallucinate.

### What's an API?

You'll see the word "API" throughout this document, so here's what it means. An API (Application Programming Interface) is a structured way for one program to request data from another. When you search Semantic Scholar in your browser, you're using their website. Behind that website is an API -- a set of URLs that accept specific requests and return structured data. The website uses the API internally; so do mobile apps and other services.

The key distinction: a website is designed for humans to click through. An API is designed for programs to call directly. When we say "an MCP wraps an API," we mean the MCP server makes the same kind of structured requests on Claude's behalf.

Most major academic services have APIs: Semantic Scholar, PubMed, CrossRef, Canvas, Zotero. (Google Scholar notably does not, which is why you can't easily automate it.) Whether a service has an API -- and how well it's documented -- determines whether an MCP can connect to it.

### What it is not

- Not an API itself. It's a standard way to *connect to* APIs.
- Not exclusive to Anthropic. The spec is open; other tools are adopting it.
- Not required to use Claude. Most Claude users never touch MCP. It's an advanced capability.

## Why this matters for faculty work

### For research

Faculty already use specialized databases: PubMed, JSTOR, Semantic Scholar, Web of Science, discipline-specific archives. MCP lets Claude query these directly.

The difference is significant:

- **Without MCP:** "Claude, what papers exist on grade inflation?" Claude draws on training data that may be incomplete, outdated, or simply wrong. It might invent plausible-sounding citations that don't exist.
- **With MCP:** "Claude, search Semantic Scholar for papers on grade inflation." Claude makes a live query, gets real results with real citation counts, and can filter by year, field, and open-access status.

### For teaching

- **Reading lists grounded in real sources.** An MCP connected to a library catalog or discipline database means Claude can build reading lists from materials that actually exist and are actually available.
- **Student-facing tools.** An MCP connecting to Canvas or another LMS could let Claude help students navigate course materials, check deadlines, or review feedback within institutional guardrails.

### Why understanding the mechanism matters (even if you never build one)

1. **You can evaluate AI tools more critically.** When a vendor says "our AI is connected to your data," you now have a framework for asking *how*.
2. **You can make better requests.** "Could we build an MCP that connects Claude to our IRB database?" is a much more productive conversation than "can AI do IRB stuff?"
3. **You can understand the limits.** An MCP is only as good as the API it wraps. If the underlying database doesn't have the data, the MCP can't conjure it.

## How it works

### The flow

```
You (in Claude Code)
    |
    | "Find papers about active learning in STEM"
    v
Claude (the model)
    |
    | Decides to call the academic_search tool
    | Sends: {query: "active learning STEM", year: "2020-", limit: 10}
    v
MCP Server (a Python program running on your machine)
    |
    | Translates to an HTTP request to Semantic Scholar
    v
Semantic Scholar API (external service)
    |
    | Returns: papers, authors, citation counts, abstracts
    v
MCP Server
    |
    | Formats results into readable text
    v
Claude
    |
    | Synthesizes results, presents them to you
    v
You (see a formatted literature summary)
```

You type a prompt, and Claude figures out what tool to call and what parameters to send. The MCP server makes the actual request. The results come back through Claude, which synthesizes and presents them. The whole cycle takes a few seconds.

### What an MCP server actually is

It's a Python file. That's it. The academic search MCP in this workshop is about 400 lines of Python, and most of that is input validation and formatting. The actual API calls are 3-4 lines each. You can open it and read it: `_mcp/academic_search/server.py`.

### How Claude discovers MCP tools

When Claude Code starts, it reads a file called `.mcp.json` in your project directory. This file lists every MCP server: what program to run, what arguments to pass, and what environment variables to set (like API keys). Claude Code launches each server and discovers its tools. From that point on, Claude can call those tools whenever they're relevant.

### API keys

An API key is a credential that identifies you to an external service. Think of it like a library card: it doesn't cost anything (for many services), but it tells the service who's making requests so it can manage rate limits.

For the Semantic Scholar MCP:
- **Without a key:** works, but limited to about 1 request every 5 seconds. You'll hit "rate limited" errors constantly.
- **With a free key:** about 10 requests per second. More than enough.
- **How to get one:** [semanticscholar.org/product/api](https://www.semanticscholar.org/product/api#api-key-form) -- takes 30 seconds, no credit card required.

The key goes in `.mcp.json`, not in the code itself. This means the code can be shared without sharing your credentials.

### Where MCP servers are set up

MCP servers need to be registered so Claude knows to launch them. Where you register them depends on which Claude product you're using.

**Reminder / Important distinction:** "Claude Code" and the "Code" tab in the Claude desktop app are two different things. **Claude Code** is the standalone command-line tool you run in a terminal (Terminal on Mac, Command Prompt on Windows). The **"Code" tab** is a feature inside the Claude desktop app that looks similar but has different capabilities and different config. If you're not sure which one you're in: if you are in a terminal window with a `>` prompt, that's Claude Code. If you see the Claude chat interface with tabs at the top, that's the desktop app.

**In Claude Code (the standalone terminal tool):**

- **`.mcp.json`** in the project folder -- project-scoped MCPs. This is what we're using today: the academic search MCP is registered here, and anyone who opens this project gets it automatically.
- **`~/.claude/settings.json`** -- global MCPs that are available in every project. You can edit this by typing `/config` inside Claude Code, or from the command line with `claude mcp add`.

**In the Claude Desktop app (the Mac/Windows application):**

- **macOS:** edit `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** edit `%APPDATA%\Claude\claude_desktop_config.json`

On a Mac, the `~/Library` folder is hidden by default. In Finder, use Go > Go to Folder and paste the path.

The format is similar across all three files. The practical difference: Claude Code supports project-scoped MCPs (so collaborators get them automatically), while the Desktop app only has global config. For today's workshop, everything is project-scoped -- you don't need to edit any config files.

## Try it yourself

Here's a sequence you can run right now in Claude Code, using the Semantic Scholar MCP that's already set up in this project.

**1. Search.** Type something like:

> Find recent papers about [your research topic]

Claude will narrate what it's doing: "I'm calling `academic_search` with..." Watch for that narration -- it shows the MCP call happening.

**2. Go deeper.** Pick a paper from the results and ask:

> Tell me more about the [Author Year] paper -- who cites it?

Claude calls a different tool (`academic_get_paper`) to get full details.

**3. Discover.** Ask:

> Find papers related to this one.

Claude calls a third tool (`academic_recommend`) that uses citation-graph patterns to find related work.

**4. Save.** Ask:

> Search for papers on [topic] and save the results.

A markdown file appears in `output/`. You can open it later.

The pattern is always the same: you ask in English, Claude translates to a structured tool call, the MCP makes the API request, results come back. By the third or fourth query, the pattern should feel natural.

### Troubleshooting

- **"Rate limited":** The API key isn't loaded. Check `.mcp.json` and restart Claude Code.
- **"Paper not found":** DOIs need the `DOI:` prefix (e.g., `DOI:10.1038/s41586-024-07487-w`). If you paste a bare DOI, just add the prefix.
- **Off-topic results:** Semantic Scholar's relevance ranking can be noisy for broad queries. Try adding filters: "search for papers on X in the Education field from 2020 onward."
- **Tools not appearing:** The Python environment may not be set up. Run `bash _mcp/academic_search/setup.sh` and restart Claude Code.

## Common questions

**"Can someone build one of these for [database I use]?"**
If the database has a web API (most major ones do), yes. The pattern is the same regardless of the service. Realistically, a working MCP for a well-documented API takes 1-2 hours to build. A poorly documented or institutionally authenticated system takes longer and may need IT support. Talk to the Bok Center -- we can help scope what's feasible.

**"Is my data safe? Does Anthropic see my searches?"**
The MCP server runs on your local machine. Your API calls go directly from your machine to the external service (Semantic Scholar, in our example). Anthropic sees the conversation text, including the tool results Claude receives, under the same terms as any Claude usage. The privacy story is "better than pasting everything into a web form, but not zero exposure." As of June 2026, Claude Code conversations are not used to train models -- but always check current terms.

**"How is this different from just googling?"**
Three ways. (1) Claude can make multiple searches, filter, and synthesize without you managing tabs. (2) The results are structured data -- citation counts, DOIs, author lists -- not web pages you have to read through. (3) Claude can chain tools: search, then get details, then find related work, all in a single conversation.

**"Do students have access to this?"**
Not directly. MCP servers run in Claude Code, which requires a subscription and local setup. But AI tools connected to real data sources are coming to student-facing products too. Understanding the pattern now prepares you to evaluate those tools when they arrive.

**"What's the difference between an MCP and a plugin?"**
Functionally similar -- both extend what the model can do. MCP is a standardized, open protocol; "plugin" usually means a proprietary extension specific to one platform (like ChatGPT plugins). MCP's advantage is portability: the same server works across any MCP-compatible tool.

## If you want to build one

You don't need to. But if you're curious, there are three paths.

### Path 1: Let Claude build it for you (least code)

Claude Code has a built-in skill called `/mcp-builder` that creates an MCP server through conversation. You tell it what API you want to connect to, paste in the API's documentation, and it generates the code.

1. Type `/mcp-builder` in Claude Code.
2. Say: "I want to build a Python MCP server that wraps [API name]. Here are the docs: [paste or link]."
3. Claude proposes tools based on the API's capabilities. You pick which to keep.
4. It generates the server code and setup files.
5. Run setup, restart Claude Code, and the tools are live.

The output is a starting point, not a finished product. Expect to iterate on error handling and formatting.

### Path 2: Copy and modify an existing one (medium effort)

Find an MCP that does something similar to what you want, copy its folder, and adapt it. The academic search MCP (`_mcp/academic_search/`) is a good template for any "search an external database" use case.

You can find existing MCPs to study at:
- [MCP Registry](https://mcpregistry.com/) -- a growing directory of community-built servers
- [Anthropic's MCP examples](https://github.com/modelcontextprotocol/servers) -- reference implementations

### Path 3: Write one from scratch (most control)

The walkthrough in this workshop repo (`_mcp/academic_search/how-to-build-an-mcp.md`) documents every design decision. The academic search MCP was designed to be readable: 400 lines, heavily commented, simple structure.

### Before any path: get the API documentation

This is the most important prep step. Go to the service's website and find their API docs. You need to know what endpoints exist, how authentication works, what the rate limits are, and what the data looks like. If you're using the `/mcp-builder` skill, paste the API docs directly into the conversation -- the builder can only generate correct code from accurate information.

API docs for services relevant to academic work:
- [Semantic Scholar](https://api.semanticscholar.org/api-docs/) -- paper search, citation data
- [CrossRef](https://api.crossref.org/) -- DOI metadata (no key required)
- [ORCID](https://info.orcid.org/documentation/api-tutorials/) -- researcher profiles
- [Zotero](https://www.zotero.org/support/dev/web_api/v3/start) -- personal library access
- [Canvas LMS](https://canvas.instructure.com/doc/api/) -- course data (requires institutional OAuth)
- [OpenAlex](https://docs.openalex.org/) -- open scholarly metadata (no key required)

## The big idea

An MCP doesn't make Claude smarter. It gives Claude access to real, current data that it couldn't otherwise reach. The model still does the synthesis and presentation -- but now it's working with verified, live information instead of guessing from training data.

The broader point is that **anyone can connect Claude to any web service that has an API** -- your library catalog, your LMS, a government data portal -- using this same pattern. The academic search MCP is one example. The pattern is general.

## Links

- [MCP specification](https://modelcontextprotocol.io/) -- the official protocol documentation
- [Anthropic's MCP documentation](https://docs.anthropic.com/en/docs/agents-and-tools/mcp) -- setup guides
- [Semantic Scholar API docs](https://api.semanticscholar.org/api-docs/) -- the API behind our workshop example
- [FastMCP documentation](https://gofastmcp.com) -- the Python framework for building MCP servers
