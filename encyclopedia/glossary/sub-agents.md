# Sub-agents

> **In one line:** Sub-agents are smaller Claudes spawned by your main Claude
> to carry out part of a task in parallel — each with its own context window,
> reporting back to the one that launched it.

## In plain terms

A normal [agent](agent.md) loop is one Claude doing one task. A **sub-agent** is
when that Claude decides — or you ask — to spin off a helper Claude to handle a
piece of the work on its own. The helper gets its own [context window](context-window.md),
does the bounded job (read these 40 files, summarize each, report back), and
hands its result up to the main Claude. You can spawn several sub-agents at once;
they run in parallel.

The pedagogical point: this is how Claude Code handles tasks too large for one
context window. If you ask "read every paper in this folder and tell me which ones
cite Foucault," the main Claude is much better off sending each paper to its own
sub-agent — which reads the paper, returns one line, and exits — than trying to
hold all forty papers in its own working memory at once.

Sub-agents are visible: in Claude Code's CLI, you can open a tab and watch each
sub-agent's transcript as it runs. They are not magic; they are bounded little
researchers.

## Why it matters in this workshop

Two reasons. First: it explains why "read 40 PDFs and synthesize" works without
overflowing the context window — the synthesis Claude never reads them all itself.
Second: when you ask for help and the work splits naturally into parallel parts
("audit each of these grants" / "run this analysis on each transcript"), saying
"use sub-agents" in your prompt is a real performance lever.

## See also

- [Agent](agent.md) — the main loop a sub-agent supports
- [Context Window](context-window.md) — why splitting helps
- [Tool Call](tool-call.md) — sub-agents are a kind of tool
