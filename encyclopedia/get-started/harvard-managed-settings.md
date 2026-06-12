---
layout: default
title: Harvard Managed Settings
section: get-started
---

# Harvard managed settings — what may not work, and why

<div class="page-lead">Harvard Edu Claude accounts are centrally managed by Harvard University Information Technology (<strong>HUIT</strong>). A remote settings policy is pushed to every Claude Code session on the account — including the Code panel of the desktop app, which is where most workshop participants work. Some examples on this site and in the workshop repos will fail under that policy. <strong>When they do, it is almost never because the example or the repo is broken — it's the managed permissions.</strong></div>

This page is the canonical list of what's currently restricted. HUIT adjusts these settings as the service matures — sometimes between one workshop week and the next — so treat this as a snapshot, not a contract. **We'll update this page as we learn more.** HUIT's own framing of the service lives at the [HUIT AI guidelines](https://www.huit.harvard.edu/ai/guidelines) and Harvard's [generative AI best practices for community members](https://privsec.harvard.edu/best-practices-generative-ai-community-members) — the two links the managed policy itself announces at sign-in.

*Last verified: June 12, 2026.*

---

## What's currently restricted

**MCP servers don't load — none of them.** The policy only permits MCP servers from a HUIT-approved allowlist, and that allowlist is currently **empty**. A project's `.mcp.json` is ignored no matter how correctly it's set up. This affects everything on the [Day 4 recap]({{ site.baseurl }}/encyclopedia/daily-recaps/day-4/) page, the [How to Build an MCP]({{ site.baseurl }}/activities/how-to-build-an-mcp/) walkthrough, the six servers in [`claude-code-20260611/mcps-apis/`](https://github.com/bok-learning-lab/claude-code-20260611/tree/main/mcps-apis), and the [art history lecture]({{ site.baseurl }}/gallery/source-to-teaching/art-history-lecture/) example. The walkthroughs are still worth reading — the concepts transfer — but the servers won't run on a managed account today.

**No web access from inside a session.** The WebFetch tool is denied, and so are `curl` and `wget` in the shell. Claude can't fetch a web page, pull docs, or call an HTTP API directly. Examples that say "paste the docs page" still work — *you* paste; Claude just can't fetch.

**No installs.** Any command ending in `install` is denied (`pip install`, `npm install`, `brew install`, …), and so is `npm run build`. Setup scripts that build a Python venv or install Node dependencies — including the `setup.sh` bootstraps in the workshop repos — will fail partway.

**Claude can't read secrets files.** `.env`, `.env.*`, `secrets/`, and credential files are blocked from being read. This is good hygiene (it's exactly what our [security-concerns handout]({{ site.baseurl }}/encyclopedia/daily-recaps/day-4/) recommends you enforce yourself), but it also means examples that load an API key from a `.env` file can't complete.

**Skills can't run their bundled scripts.** A skill's `SKILL.md` instructions still load and work — skills as *prompts* are unaffected. But shell execution from inside a skill is disabled, so a skill's `scripts/` folder (the "known-good code Claude runs instead of re-inventing" pattern from the [skills field guide]({{ site.baseurl }}/encyclopedia/daily-recaps/day-3/)) won't execute.

**Permission rules are locked.** Bypass-permissions mode is disabled, hooks are restricted to managed ones, and you can't allowlist your way around the denials in your own settings files.

## Check the settings yourself

You don't have to take this page's word for it — the policy is inspectable on your own machine, three ways.

**1. Inside any Claude Code session**, two slash commands show you exactly what's in force:

```
/permissions   — every allow/ask/deny rule, labeled with where it came from (managed vs. yours)
/status        — which settings sources are active, including the managed policy
```

Rules marked as coming from *managed settings* are HUIT's; they can't be overridden by your own settings files.

**2. Read the cached policy file.** Org-pushed settings are cached locally at:

```
~/.claude/remote-settings.json
```

It's plain JSON — open it in any editor. (It refreshes from Anthropic's servers when you sign in and roughly hourly after that, so what you see is current or close to it. On a HUIT-managed *device*, policy can also arrive as a file at `/Library/Application Support/ClaudeCode/managed-settings.json` on macOS, `C:\Program Files\ClaudeCode\managed-settings.json` on Windows, or `/etc/claude-code/managed-settings.json` on Linux/WSL.)

**3. Or just ask Claude.** Paste this into a Claude Code session:

```
Please read ~/.claude/remote-settings.json and summarize it for me in plain
language: what is denied or restricted in my sessions, what does each
restriction mean in practice, and is there anything in it that isn't a
restriction (like announcements)?
```

If the file looks different from what this page describes, the policy has changed since our last check — let us know at the Learning Lab and we'll update this page.

## What still works (which is most of the site)

Everything local and file-based: reading and writing files in a project folder, transcribing images, building self-contained HTML pages, the recipe-cards pipeline, the population pyramids, close reading, the class-summarizer / takeaways pipeline, glossary work, markdown ↔ document conversion, and skills used as prompts. The large majority of the activities and gallery patterns on this site run entirely on local files and are unaffected.

## The data rule that doesn't change

Whatever the permission settings do, the data classification rule is constant: Harvard Edu Claude is approved for **Level 3 data and below only**. See the [HUIT AI guidelines](https://www.huit.harvard.edu/ai/guidelines) and [generative AI best practices](https://privsec.harvard.edu/best-practices-generative-ai-community-members), and this site's [data classification]({{ site.baseurl }}/encyclopedia/glossary/data-classification/) glossary entry.

## If you hit a wall

If an example fails with a permission denial (or just quietly refuses to do a step), check this page first. If your work genuinely needs one of the blocked capabilities, talk to us at the Learning Lab — in some cases there is a sanctioned path, and your asking is also how the approved-tools list grows.
