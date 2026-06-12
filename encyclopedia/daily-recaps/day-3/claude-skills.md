# Skills: A Field Guide

*What a skill is, where skills live (the cloud-vs-local quirk), how to arrange one in a repo, and how to write the SKILL.md itself.*

A **skill** is a folder containing a markdown file named `SKILL.md` — a *conditional prompt* with a header. At the start of every session Claude loads just the headers (name + description) of every skill it can see — a map of your prompt library. When your request matches a description, the full skill body is read in and followed. That staging is called **progressive disclosure**: header always, body on trigger, bundled files only if needed.

## Where skills live — the cloud-vs-local quirk

There are **two completely separate places** a skill can live, and they do not sync:

1. **In the cloud, attached to your claude.ai account.** Uploaded (as a zip) under Settings → Capabilities/Features on claude.ai. These follow your *account* — they're available wherever you're signed in to chat, but they are not files on your computer.
2. **On your computer, as plain folders.** Personal skills at `~/.claude/skills/<name>/` (available in every project), and project skills at `.claude/skills/<name>/` inside a repo (they travel with the folder — clone the repo, get the skills).

In the desktop app's three panels:

| | Chat | Cowork | Code |
|---|---|---|---|
| **Cloud skills** (claude.ai account) | yes | yes | no |
| **Local skills** (`~/.claude/skills`, project `.claude/skills`) | no | yes | yes |

The quirk to remember: a skill you uploaded to claude.ai **does not exist on your machine**, and a skill sitting in `~/.claude/skills` **does not exist in the Chat panel**. If a skill "disappears" when you switch panels, this split is why. When in doubt, keep the canonical copy in a repo and treat the cloud upload as a copy.

## How a skill is arranged in a repo

One folder per skill, named in lowercase-with-hyphens (Anthropic suggests gerunds: `making-handouts`, `processing-pdfs`):

```
your-project/
├── .claude/
│   └── skills/
│       └── making-handouts/
│           ├── SKILL.md          ← required — the skill itself
│           ├── reference.md      ← optional extra detail, read only when needed
│           ├── assets/           ← templates, CSS, fonts the skill uses
│           └── scripts/          ← known-good code Claude RUNS (never loads into context)
├── inputs/
├── operations/
└── outputs/
```

- **`SKILL.md` is the only required file.** Everything else is optional support.
- **Reference files** (`reference.md`, `examples.md`) hold detail too long for the main file; link them from SKILL.md (`See [reference.md](reference.md)`) and Claude reads them only when the task calls for it. Keep references **one level deep** — don't chain file → file → file.
- **`scripts/`** holds code you've already gotten working. Claude executes it without reading the source into context — your known-good code runs the same way every time, instead of being re-invented per session.
- **`assets/`** holds files the *output* needs: templates, stylesheets, fonts, boilerplate.

## Anatomy of SKILL.md

Two zones: a YAML header between `---` lines, then a markdown body.

```yaml
---
name: making-handouts
description: Formats class notes into the course handout style
  (Inter, white, red accent, 11x17). Use when the user asks for
  a handout, printable, or formatted one-pager.
---
```

**Frontmatter rules:**

- `name` — required. Max 64 characters; lowercase letters, numbers, and hyphens only.
- `description` — required. Max 1,024 characters. Must say **what the skill does AND when to use it** — this is the only thing Claude sees before deciding to open the skill, so it carries the triggers. Write in third person ("Formats…", not "I can format…"). Vague descriptions ("Helps with documents") are the #1 reason skills never fire.
- Claude Code adds optional fields (e.g. `disable-model-invocation: true` for side-effect skills you want to trigger only by hand, `allowed-tools`, `argument-hint`), but name + description is the whole required contract.

**Body guidelines (from Anthropic's skill-authoring docs):**

- **Keep it under ~500 lines.** Past that, split detail into reference files.
- **Assume Claude is already smart.** Only write what it *doesn't* know: your preferences, your conventions, your domain specifics. Challenge every sentence with "does Claude really need this?"
- **Set the right degree of freedom.** Multiple valid approaches → describe steps in prose. One fragile, must-be-exact operation → "run exactly `python scripts/build.py`, do not modify." Prose where judgment helps; scripts where consistency matters.
- **Use consistent terminology.** Pick one name per concept and stick to it.
- **No time-sensitive instructions.** "Before August, use the old API" rots; write the current way only.
- **Test and iterate.** Run real tasks, watch what Claude actually does with the skill, and edit. A skill is a living document — open it, argue with it, revise it.

## What "firing" means

At session start, only the headers load: Claude reads every skill's name and description — the map of your prompt library — and none of the bodies. A skill **fires** when its full body is loaded into the conversation and its instructions take effect. There are two routes:

1. **You fire it.** Type the slash command (`/making-handouts`) or name it in a prompt ("run the syllabus-redesign skill on this file"). The body loads because you said so.
2. **Claude fires it.** You describe what you want in plain language ("I need help redesigning my syllabus"); Claude matches the request against the descriptions on its map, proposes the skill, and loads the body once you confirm. You don't need to know the skill exists.

The description is the entire trigger surface for route two. A vague one ("helps with documents") matches nothing, so the skill only ever runs when called by name — the #1 reason skills sit unused. (Claude Code adds frontmatter switches for both routes: `disable-model-invocation: true` blocks route two for side-effect skills you want to trigger only by hand; `user-invocable: false` hides a skill from the slash menu and leaves only route two.)

## The rule of thumb

If you'd paste the same prompt twice, make it a skill. If the skill needs the same code twice, give it a script. If the body grows past a screen or two, split it into reference files. The header is the hook; everything else is staged so it costs nothing until used.

---

*Sources: Anthropic Agent Skills documentation (overview + authoring best practices), Claude Code skills documentation, Anthropic engineering blog "Equipping agents for the real world with Agent Skills," Claude Help Center articles on skills and Cowork.*
