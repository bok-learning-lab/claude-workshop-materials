# Hand-off doc

> **In one line:** A hand-off doc is a short markdown file you (or Claude) write
> at the end of a session so the next session — yours, or another Claude's —
> can pick up where you left off.

## In plain terms

Claude is [the guy in *Memento*](context.md): every new conversation is a fresh
day. The [context window](context-window.md) does not persist across sessions,
and [memory](memory.md) only carries the smallest set of standing facts. If you
spent two hours yesterday working out a plan for a course revision, none of that
reasoning survives unless you write it down somewhere Claude will read it next
time.

A **hand-off doc** is the workshop's name for that written record. It is just a
markdown file — `handoff.md`, or `2026-06-04-handoff.md`, or whatever — that
captures, in your own voice or Claude's:

- What this project is, in two sentences.
- What was done in the last session, including dead ends.
- What is open: the next move, the question waiting on you, the decision not yet
  made.
- Any specific facts (file paths, names, version numbers) the next session will
  need to find its bearings.

You paste it (or `@`-reference it) into the next conversation, and the next
Claude — yours tomorrow, or a parallel Claude in another window today — starts
oriented.

## Why it matters in this workshop

Hand-off docs are the most direct answer to the most common faculty pain point:
*"I had this great session yesterday and now Claude has no idea what we were
doing."* They are also how you run several Claudes in parallel on the same
project — each one reads the same hand-off doc and gets the same starting
ground.

## See also

- [Context](context.md) — the *Memento* problem the hand-off doc addresses
- [Memory](memory.md) — automatic, limited, less precise
- [CLAUDE.md](claude-md.md) — for facts that are *always* true about the project
