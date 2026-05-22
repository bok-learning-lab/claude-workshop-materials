---
layout: default
title: "04 · Class Schedule Conflict"
section: gallery
---

# 04 · Class Schedule Conflict

<div class="page-lead">A demonstration of Claude Code's document-processing loop: load a calendar, detect conflicts, propose resolutions, output a clean schedule.</div>

## Project structure

This project follows the workshop's standard `inputs → operations-tools-commands → outputs` layout.

- **`inputs/`** — The source calendar or schedule files
- **`operations-tools-commands/`** — The prompts and Claude Code sessions used to process them
- **`outputs/`** — The resolved schedule

## What this demonstrates

- Reading and reasoning over structured data (calendar format, time slots, room assignments)
- Multi-step reasoning with dependencies (can't resolve conflict B until conflict A is handled)
- Generating clean human-readable output from a messy input

## How to replicate

1. Put your own schedule file in `inputs/`
2. Run Claude Code with a CLAUDE.md that describes the conflict-resolution logic you want
3. Check `outputs/` for the resolved version

*This is a good first project for participants who want to try the inputs/outputs pattern with their own course materials.*
