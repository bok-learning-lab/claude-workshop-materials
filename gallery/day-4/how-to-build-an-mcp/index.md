# How to build an MCP

A worked example: building a small Python MCP server that wraps a public API,
using Claude Code and the `/mcp-builder` skill. The target was the
[Replicate](https://replicate.com) image-generation API. This document walks
through the actual path that produced the server in this folder — you can use
it as a template for wrapping any HTTP API.

---

## What we built

Four MCP tools, all prefixed `replicate_`:

- `replicate_generate_image` — prompt → saved image(s) on disk
- `replicate_run_model` — generic runner for any Replicate model
- `replicate_get_model` — fetch a model's input schema (for discovery)
- `replicate_get_prediction` — look up a prediction by id

Plus the bootstrap pieces that make it usable by faculty: a `.mcp.json` for
registration, a `setup.sh` that creates the venv on first run, and a
`CLAUDE.md` instruction that tells the assistant to run setup automatically.

---

## The path I actually took

### Step 1 — Invoke `/mcp-builder`

In Claude Code I typed:

```
/mcp-builder
```

`/mcp-builder` is a built-in skill that loads a structured guide for building
MCP servers. It contains best practices, language-specific templates
(Python/FastMCP and TypeScript), and an evaluation framework. Triggering it
makes Claude follow that workflow instead of improvising.

What Claude does when the skill loads:

1. Loads the MCP best-practices reference into context.
2. Pulls the language-specific implementation guide.
3. Walks through four phases: **Research → Implement → Refine → Evaluate**.

> **Why this matters:** without `/mcp-builder`, Claude will still build you
> an MCP, but it won't necessarily follow naming conventions, character
> limits, response-format options, or error-handling patterns that the MCP
> community has settled on. The skill enforces a baseline of quality.

### Step 2 — Tell Claude what to wrap, in concrete terms

After the skill loaded, Claude asked what to build. My answer:

> we can do this in python/fastmcp — we are going to wrap the public
> replicate image generation api. here is their main docs page... [pasted the
> Replicate Python quickstart content]
>
> We want this mcp to be in this project — can you do that?

Two things to notice:

1. **I named the language up front.** `/mcp-builder` supports Python and
   Node/TypeScript; saying "Python/FastMCP" saved a clarifying question.
2. **I pasted the docs directly into the chat.** This is the highest-bang
   move you can make. Claude could have fetched the page itself, but giving
   it the relevant content immediately removed ambiguity about which API,
   which client library, and which surface area I cared about (image
   generation, not Replicate's full REST API).

You don't need to paste the whole docs site. The "quickstart" page is
usually enough — it shows authentication, the simplest call, and one or two
common variations. Claude can fetch deeper docs if it needs them.

### Step 3 — Research phase (Claude does most of this)

Claude then did its own background reading by fetching the
`replicate-python` GitHub README. It pulled out:

- How the SDK authenticates (`REPLICATE_API_TOKEN` env var)
- The `replicate.run()` signature and what `FileOutput` returns
- Async variants (`replicate.async_run`)
- Exception classes (`ReplicateError`, `ModelError`)
- The `predictions` and `models` sub-APIs

I didn't have to read any of this myself. Claude summarized what it found
and used it to plan the tool surface.

### Step 4 — Planning the tool surface

Claude proposed four tools (not one per API endpoint — see below) and asked
me to confirm. The proposal was:

| Tool | Workflow |
|---|---|
| `replicate_generate_image` | Default to `flux-schnell`, save images to `output/` |
| `replicate_run_model` | Escape hatch for any model + arbitrary input dict |
| `replicate_get_model` | Discover what inputs a model accepts |
| `replicate_get_prediction` | Check status of a prior prediction |

> **Design principle:** `/mcp-builder` explicitly tells Claude to build
> **workflow tools, not endpoint wrappers**. Replicate has a dozen REST
> endpoints. We only need four tools because we asked the question "what
> does an LLM agent actually want to do with this API?", not "what URLs does
> this API expose?".

### Step 5 — Scaffolding

Claude created the project at `_mcp/replicate_image/`:

```
_mcp/replicate_image/
├── server.py          # FastMCP server, 4 tools
├── requirements.txt   # mcp, replicate, pydantic
├── .env.example       # placeholder for the token
└── README.md          # setup instructions
```

`server.py` follows the `/mcp-builder` Python template:

- Pydantic models for each tool's input (with `extra="forbid"` to catch typos)
- An enum for response format (`markdown` vs `json`)
- Module-level constants (`CHARACTER_LIMIT = 25_000`, `DEFAULT_IMAGE_MODEL`)
- Shared helpers (`_get_client`, `_save_file_output`, `_format_error`)
- Tool functions decorated with `@mcp.tool(name=..., annotations={...})`
- An entrypoint: `if __name__ == "__main__": mcp.run()`

### Step 6 — Iteration on real-world concerns

This is where the "happy path" stopped and the boring-but-essential work
started. The questions I asked, in order:

1. **"Where does the API key live?"**
   Three options: shell `export`, `.env` file, or `.mcp.json` env block.
   We picked **`.mcp.json` env block** because it's the only one that
   "just works" with zero faculty intervention beyond pasting a token.

2. **"Do I need `.mcp.json` in the project, or is that only for public
   servers?"**
   You need it. `.mcp.json` is how Claude Code discovers project-scoped MCP
   servers — public/private has nothing to do with it.

3. **"Make sure `.env*` is gitignored except `.env.example`, and gitignore
   the real `.mcp.json` too."**
   We added a `.mcp.json.example` (committed, with placeholder token) and
   `.mcp.json` (gitignored, with the real one). Same pattern works for
   any file that holds a secret.

4. **"Do I need to keep a server process running?"**
   No. MCP stdio servers are spawned on demand by Claude Code as
   subprocesses. They live only for the session. No daemon, no port.

5. **"Will dependency versions cause problems if I don't use a venv?"**
   Yes. We use a venv at `_mcp/replicate_image/.venv/`. The path is
   hard-coded in `.mcp.json` so Claude Code knows which Python to spawn.

6. **"Can faculty avoid the terminal entirely?"**
   This was the key constraint: workshop attendees often haven't used a
   terminal. The only manual step they should have is **paste a token**.

### Step 7 — Bootstrap so faculty never see the terminal

To meet constraint #6, we added three pieces:

1. **`setup.sh`** — idempotent shell script. Creates the venv if missing,
   installs `requirements.txt`, runs a sanity check. Safe to re-run.

2. **An instruction in project `CLAUDE.md`** — tells the assistant to check
   for the venv on session start and run `setup.sh` if it's missing. Since
   `CLAUDE.md` is loaded into every Claude Code session in this repo,
   Claude takes care of setup automatically.

3. **`.claude/settings.local.json`** — pre-allows the setup commands so
   faculty don't get permission prompts mid-bootstrap.

The faculty journey is now:

1. Clone repo.
2. Copy `.mcp.json.example` → `.mcp.json`, paste their token.
3. Open Claude Code. Claude runs setup automatically.
4. Restart Claude Code. The MCP is live.

### Step 8 — Test

Two ways to test the server:

1. **Through the MCP itself** (preferred). Restart Claude Code so it spawns
   the new server, then ask Claude to use `replicate_generate_image`.
2. **Direct call** (useful for debugging). Write a small script that
   imports the tool function and calls it through the venv's Python. The
   smoke-test script we wrote (later deleted) followed this pattern.

The first thing I ran once the server was live:

> make me an image of a cat solving a physics problem

Claude called `replicate_generate_image`, the file landed in `output/`, and
this is what came back:

![A cat at a chalkboard covered in physics equations, holding a piece of chalk](cat_physics_0.webp)

Total elapsed time from prompt to saved file: a few seconds. No terminal,
no Python invocation, no manual file-handling — exactly the experience
the bootstrap work was designed to produce.

---

## What you can copy for your own API wrapper

If you want to wrap a different API (Notion, Linear, your university's
gradebook, etc.), the recipe is:

1. **Type `/mcp-builder` in Claude Code.** Let the skill load.
2. **Tell Claude the language and the target.** "Python/FastMCP wrapping the
   Notion API." Paste the API's quickstart page if you have it handy.
3. **Let Claude propose 3–5 workflow tools.** Push back if any of them feel
   like raw endpoint wrappers ("`notion_get_page`" is fine; "`notion_get`"
   with a generic URL param is not — that's not a workflow tool).
4. **Decide on secret storage early.** `.mcp.json` env block is the easiest
   path. Gitignore the real file; commit a `.example`.
5. **Use a venv.** Hard-code the venv's Python path in `.mcp.json`. Write a
   `setup.sh` that creates it. Add a line to `CLAUDE.md` that says "if the
   venv is missing, run setup.sh".
6. **Test by restarting Claude Code and using the tool from a prompt.**

The whole loop, including the iterative refinement, took about an hour. Most
of that time was spent on the bootstrap (steps 6–7), not the actual MCP
code. The `/mcp-builder` skill does the heavy lifting for the code itself.

---

## Files in the MCP folder, annotated

In `_mcp/replicate_image/`:

- **`server.py`** — the MCP server. Pydantic models define each tool's input
  schema; `@mcp.tool` decorators register the tools. Read this top-to-bottom
  to see the Python/FastMCP pattern.
- **`requirements.txt`** — three packages: `mcp`, `replicate`, `pydantic`.
- **`setup.sh`** — idempotent installer. Run it any time; it skips work
  that's already done.
- **`.env.example`** — placeholder showing the env var name. Not actually
  loaded by `server.py` (we use the `.mcp.json` env block instead) — it's
  there as documentation.
- **`README.md`** — the user-facing setup guide.
- **`how-to.md`** — the in-folder copy of this document.

External to that folder but part of the system:

- **`/.mcp.json`** (gitignored) — project-level MCP registration. Holds the
  real token. Tells Claude Code where to find this server's Python and
  `server.py`.
- **`/.mcp.json.example`** — committed template with placeholder token.
- **`/CLAUDE.md`** — has a "MCP bootstrap" section that triggers
  `setup.sh` automatically when the venv is missing.
- **`/.claude/settings.local.json`** — pre-allows the setup commands so the
  faculty flow has zero permission prompts.
- **`/.gitignore`** — ignores `.venv/`, `__pycache__/`, `.env*` (except
  `.env.example`), and `.mcp.json` (but not `.mcp.json.example`).
- **`/output/`** — where generated images land by default.

---

## When this approach is the wrong fit

This pattern works well for read/write APIs with HTTP endpoints and an
existing Python client library. It's a worse fit for:

- **Local-only tools that don't talk to a network service.** A skill is
  usually simpler than an MCP server for those.
- **APIs where the LLM needs to maintain state between calls.** MCP tools
  are stateless; if you need a long-running session, you'll be working
  against the grain.
- **Production-grade services with many users.** This pattern uses stdio
  transport, which is single-user, single-session. For multi-user
  deployments you'd switch to HTTP transport and add proper auth/rate
  limiting.

For everything else — wrapping a public API so an LLM can use it
fluently — `/mcp-builder` plus a pasted quickstart is the fastest route to a
working tool.
