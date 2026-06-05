# Primacy effect

> **In one line:** The primacy effect is the fact that information placed at
> the *beginning* of Claude's context tends to influence the answer more than
> information placed in the middle.

## In plain terms

Claude reads its entire [context window](context-window.md) for every reply,
but it does not weight every part equally. Information at the very start of
the context — typically the [system prompt](system-prompt.md), then any
[CLAUDE.md](claude-md.md) files, then the earliest things you said — exerts
disproportionate gravitational pull on the answer. Information near the
*end* of the context, the most recent few messages, also pulls hard (this is
the recency effect, primacy's twin). The stuff in the *middle* — long
documents you pasted ten messages ago, the third file Claude read into context
two hours back — sometimes gets quietly forgotten. This middle-of-context fade
is called [context rot](context-rot.md).

Primacy is the reason the workshop puts so much emphasis on **CLAUDE.md** and
on the system prompt. Anything you write there sits at the beginning of every
single conversation in that project, and the model will lean on it more than
on anything else you say later. It is the highest-leverage place to put a
standing instruction.

The flip side is a warning: anything that should *not* drift around the
session — a critical constraint, a hard rule, a piece of style — does not
belong in the middle of a long conversation. Put it in CLAUDE.md, or restate it
near the end of your message right before the question.

## Why it matters in this workshop

Once you see primacy as a real force, two design decisions follow naturally.
First: put standing facts in CLAUDE.md, not in chat. Second: when a long
conversation has drifted, don't argue with Claude about the rule it has
forgotten — surface the rule at the top of your next message and continue.

## See also

- [Context Window](context-window.md) — the substrate
- [Context Rot](context-rot.md) — what happens to the middle
- [CLAUDE.md](claude-md.md) — where to put rules that need to *stay* primary
- [System Prompt](system-prompt.md) — the most primary text of all
