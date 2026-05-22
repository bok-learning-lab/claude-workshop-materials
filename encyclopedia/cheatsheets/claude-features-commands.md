# Claude Code: Features and Commands

**The core features of Claude Code:**

- **The model itself** — the AI that reads your prompts, reasons about them, and generates responses. This is what you are talking to directly.
- **Tools** — capabilities the model can invoke mid-response: reading files, editing code, running shell commands, searching the web. Each tool call appears in the transcript so you can see exactly what happened.
- **Context management** — the session, the context window, memory (CLAUDE.md), and compaction. Everything the model "knows" during a session passes through here.
- **Permissions and modes** — rules governing what Claude can do without asking. Plan mode (read-only), Accept Edits mode (auto-approve file edits), and per-project permission settings all live here.
- **MCP (Model Context Protocol)** — an open standard for connecting external systems — GitHub, Jira, databases, internal APIs — as tools Claude can call directly.
- **Agents and subagents** — the ability to spawn secondary Claude instances to handle focused subtasks (running tests, searching a large codebase, reviewing code) in their own context windows, then report back.
- **Hooks** — shell commands that fire automatically at defined points in Claude's lifecycle: before a tool runs, after an edit, on session start. Used for formatting, linting, or blocking unsafe actions.
- **Skills** — packaged instructions (and optionally scripts) that teach Claude a specific repeatable workflow. Defined in `.claude/skills/<name>/SKILL.md` and invoked with `/`.

**Slash commands are the interface to all of this.** Type `/` on an empty prompt and you get a menu of everything reachable — built-in session controls, bundled skills, any custom skills your project defines, and tools provided by connected MCP servers. The commands below are the ones you will reach for most often.

---

## Commands

Type `/` on an empty prompt to see every command available in your setup, including custom, plugin, and MCP-provided ones. The list below covers the built-in defaults you will reach for most often. A few entries vary by platform and plan.

| Command | What it does |
|---------|--------------|
| `/help` | List all available commands. |
| `/init` | Explore the codebase and generate a starter CLAUDE.md. |
| `/clear` | Wipe conversation history and start fresh (project memory stays). Aliases: `/reset`, `/new`. |
| `/compact` | Summarize the conversation so far to free up context. Accepts optional focus instructions. |
| `/btw` | Ask a quick side question without adding it to the main conversation or consuming context. |
| `/rewind` | Roll the conversation and/or your code back to an earlier checkpoint. |
| `/model` | View or switch the active model. |
| `/cost` | Show token usage and spend for this session. |
| `/usage` | Show your plan's usage limits and current rate-limit status. |
| `/context` | Visualize what is currently loaded into the context window and where it is being spent. |
| `/memory` | View or edit the CLAUDE.md files in scope. |
| `/add-dir` | Grant Claude file access to an additional directory for this session. |
| `/permissions` | View or change which tools require approval. |
| `/config` | Open configuration settings (theme, defaults, editor mode). Alias: `/settings`. |
| `/plan` | Drop straight into Plan Mode, optionally with a task description. |
| `/diff` | Open an interactive viewer of uncommitted changes and per-turn diffs. |
| `/copy` | Copy the last response (or a selected code block) to your clipboard. |
| `/export` | Save the current conversation to a file or the clipboard. |
| `/mcp` | Manage MCP server connections and authentication. |
| `/agents` | List, create, or edit subagents. |
| `/hooks` | View hook configuration for tool events. |
| `/skills` | List the skills available in this session. |
| `/simplify` | Bundled skill: review recently changed files for reuse, quality, and efficiency issues, then apply fixes. |
| `/status` | Show account, model, working directory, and version. |
| `/doctor` | Diagnose install and environment issues. |
| `/feedback` | Report an issue to Anthropic with session context attached. Alias: `/bug`. |
| `/resume` | Reopen a previous session and continue where you left off. Alias: `/continue`. |
| `/login` / `/logout` | Authenticate, switch accounts, or sign out. |
| `/exit` | Quit the CLI. Alias: `/quit`. |

---

## The Big Three: Session Commands

These three commands all operate on your session history and context window — worth understanding together.

```
/resume — reopen a previous session and pick up where you left off

  past sessions (oldest → newest):

  session 1  │ ░ │ ▒▒▒ │ ░░ │
  session 2  │ ░░ │ ▒▒ │ ░ │ ▒ │
  session 3  │ ░ │ ▒▒▒ │ ░░░ │ ▒▒ │  ←── /resume continues from any of these
  (current)  │                          new, empty

  ░ your messages   ▒ Claude's responses
```

```
/rewind vs. /compact — two ways to handle a full context window

  current session:
  ┌──────────────────────────────────────────────────┐
  │ ░ │ ▒▒ │ ░░ │ ▒▒▒ │ ░ │ ▒ │                    │
  └──────────────────────────────────────────────────┘
                  ╰──────────────────────────────────╮
                                          /rewind rolls back to here
                                          — turns after the checkpoint are gone

  /rewind result:
  ┌────────────────────┐
  │ ░ │ ▒▒ │           │
  └────────────────────┘

  vs. /compact — keeps everything, but compresses it into a summary:

  before:
  ┌──────────────────────────────────────────────────┐
  │ ░ │ ▒▒ │ ░░ │ ▒▒▒ │ ░ │ ▒ │                    │
  └──────────────────────────────────────────────────┘

  after:
  ┌──────────────────────────────────────────────────┐
  │ ▓▓▓ │                   (available)              │
  └──────────────────────────────────────────────────┘
    ▓ = compressed summary of everything so far; history preserved, space freed
```

Use `/rewind` when the session went in the wrong direction and you want to undo it. Use `/compact` when the session is going well but running long and you need to free up space without losing what happened.

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Shift + Tab | Cycle permission mode: default → acceptEdits → plan. |
| Esc | Interrupt Claude mid-response so you can type again. |
| Esc, Esc | Open the rewind/checkpoint menu to roll back to an earlier point in the session. |
| Ctrl + C | Cancel the current input, or exit on an empty prompt. |
| Ctrl + R | Reverse search through your prompt history. |
| Ctrl + O | Expand to the verbose, full transcript view. |
| ↑ / ↓ | Scroll through your prompt history. |
| @ + path | Reference a file or directory in your prompt. |
| / | Open the command menu. |
| ? | Show shortcuts for your current terminal or IDE. |

Shortcuts vary slightly by terminal and IDE. Press `?` inside a session for the exact list in your environment.
