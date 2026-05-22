---
layout: default
title: Getting Started with Claude Code
section: encyclopedia
---

# Getting Started with Claude Code

![Claude Code in VS Code](https://files.slack.com/files-pri/T0HTW3H0V-F0B4Z7E9QA1/screenshot_2026-05-20_at_10.03.42___am.png?pub_secret=7a1c812771)

A walk-through for installing **Claude Code** on your own computer, opening the workshop repository in a code editor, and understanding how it extends what you did on Day 1 with claude.ai and Cowork.

Day 2 of the workshop is mostly this one task: a setup that takes 15–25 minutes and involves a little troubleshooting — but it's a *one-time* setup. Once Claude Code is installed, it stays installed and works from then on.

This guide covers the **concepts** and the **shape** of the setup. The exact, copy-pasteable commands — with a fix for every common snag — live in the companion pages: [Mac Setup]({{ site.baseurl }}/encyclopedia/get-started/claude-code-mac-setup/) and [Windows Setup]({{ site.baseurl }}/encyclopedia/get-started/claude-code-windows-setup/). Keep whichever one matches your machine open alongside this guide; there's also a one-page printable checklist for each under [Setup Checklists]({{ site.baseurl }}/encyclopedia/get-started/checklists/).

---

## How Claude Code fits with claude.ai and Cowork

Day 1 used two surfaces. **claude.ai** in the browser is a conversation, plus files you upload, plus artifacts that live inside the chat. **Cowork** in the desktop app is the same conversation, but pointed at a folder on your computer, so Claude can read and — with permission — change real files.

Claude Code is the third door onto the same Claude models. Two things make it different:

- **It runs in a code editor and a terminal.** You'll work in VS Code, with the files of a project on one side and a conversation with Claude on the other. The terminal — the text-only way of moving around your computer that you may have glimpsed on Day 1 — is where Claude Code is installed and launched.
- **You can see what it's doing.** With Cowork, a lot stays out of sight: you ask, files change, but *how* it happened stays hidden behind a friendly interface. Claude Code is the opposite. Every file it reads, every command it runs, and every line of code it writes is visible in the editor in front of you.

That second point is the heart of Day 2. Someone in the workshop brought up a very important question: if Claude is working through a large dataset, how do you know it did it right — isn't it just a black box? Claude Code is the answer to that. Because the work happens as visible, readable code, you can check each step, give Claude precise constraints on *how* to do the job, and even ask it to write detailed logs of what it did. You're not trusting a black box; you're reading the receipts.

The trade Day 2 asks you to make: Claude Code takes more effort to set up and gives you a terminal instead of a tidy chat box. In return you can watch and verify every step, work across far more files at once, and build operations you can run again. The setup pain is paid once.

---

## The shape of the work: inputs → operations → outputs

Before the repo will make sense, one simple mental model. Any project you do with AI tends to have three kinds of thing:

- **Inputs** — the raw material you start with. The Shakespeare texts. The CSV files. The recipe photos. The past exams.
- **Operations** (also called tools, commands, or processes) — whatever moves you from inputs to outputs. Often this is just a prompt saved as a text file; sometimes it's a script.
- **Outputs** — the thing you make. The close reading. The interactive website. The makeup exam.

The whole workshop repo is organized this way. Open any project under `projects/` and you'll find three folders: `inputs/`, `operations-tools-commands/`, and `outputs/`.

Real projects aren't always a clean left-to-right line. Everything still happens inside the **context window** — the system prompt, memory, your files, and the running conversation, all stacked together. So steps can chain: the output of one operation becomes the input to the next. This three-part pattern isn't a rigid assembly line — it's just a way to keep the pieces straight as they stack up.

---

## 1. Before you start

- **A paid Claude account.** Pro, Max, Team, or Enterprise — the free plan does not include Claude Code. Your HUIT workshop account qualifies.
- **15–25 minutes**, most of it spent waiting on downloads. Expect a little troubleshooting along the way. That's normal, and it's exactly why this part of the workshop is run in person with the whole team on hand.

> **Data sensitivity.** Claude Code can read every file in a folder, change those files, and run commands on your computer — more reach into your machine than either of the Day 1 tools. Until Harvard's Enterprise agreement with Anthropic is in place, treat it the same way: public materials and the workshop sample files are fine, but **do not point Claude Code at — or run it inside — folders containing student work, grades, or research data above Harvard Level 2.**

---

## 2. One-time setup: install Claude Code

The full step-by-step is in the [Mac Setup]({{ site.baseurl }}/encyclopedia/get-started/claude-code-mac-setup/) or [Windows Setup]({{ site.baseurl }}/encyclopedia/get-started/claude-code-windows-setup/) guide. **Follow that guide for the exact commands.** This section explains what each step is *for*, so the commands aren't just magic you paste.

Mac users work in the **Terminal** app; Windows users work in **PowerShell**. The two paths are equivalent — the same seven steps, just with slightly different commands.

1. **Get a package manager.** A package manager installs applications from the terminal — like an app store you drive with text. Macs need **Homebrew** (`brew`) installed once; Windows 11 already ships with **winget**.
2. **Install the core tools** — Git, Node, VS Code, and Python — one command each. Git is the slow one; let it finish. **When all four finish, fully quit the terminal and open a fresh window** — a terminal that was already open won't notice newly installed programs, but a fresh window will.
3. **Install Claude Code itself.** One command runs the official installer. Reopen the terminal, then run `claude --version` to confirm it's there.
4. **Clone the workshop repo.** The workshop materials live on GitHub. *Cloning* copies the repo down onto your machine. The setup guide creates a `Development` folder and clones the workshop repo into it.
5. **Open the project in VS Code** with `code .` from inside the cloned folder.
6. **Log in to Claude.** Open the terminal inside VS Code (**Terminal → New Terminal**), type `claude`, and follow the prompts.

![Setup walkthrough](https://files.slack.com/files-pri/T0HTW3H0V-F0B4Y507R2Q/screenrecording2026-05-19at11.40.12am-ezgif.com-video-to-gif-converter.gif?pub_secret=ebaed0b723)

**(Optional) Add the VS Code extension.** Open the Extensions panel, search for **Claude Code**, and install the one published by **Anthropic**.

**The one snag that explains most setup problems:** if a command "isn't recognized" right after you installed the thing, quit the terminal completely, open a fresh window, and try again.

---

## 3. Tour of the VS Code window

![VS Code layout](https://files.slack.com/files-pri/T0HTW3H0V-F0B507FPL30/animation_10.gif?pub_secret=486dc52e5a)

VS Code has three panels you'll use constantly:

- **Explorer (left).** The list of files and folders in the repo. Click any file to open it.
- **Editor (middle).** The file's contents — and where you'll see every change Claude makes.
- **Claude (right).** Your conversation with Claude.

![Three-panel view](https://files.slack.com/files-pri/T0HTW3H0V-F0B506L82VC/animation_8.gif?pub_secret=53a60bba98)

You can open VS Code through the terminal (`code .`) or open it like any other app and import a folder manually:

![Opening VS Code](https://files.slack.com/files-pri/T0HTW3H0V-F0B548HRT5X/side_by_side_comparison.gif?pub_secret=aa791ef625)

---

## 4. How Claude sees your files

![Claude reading files](https://files.slack.com/files-pri/T0HTW3H0V-F0B5WHF2N1E/animation_9.gif?pub_secret=b007687f71)

In the browser, you paste information *in* and copy results *out* by hand. In Claude Code, that mostly disappears: **whatever file you have open, Claude can automatically see.**

Click a file in the Explorer and ask Claude *"what does this file contain?"* — it already has the file, because you have it selected. You'll see the filename appear at the bottom of the Claude panel confirming what it can see.

When you want to hand Claude a specific file, type `@` in the Claude panel: a list of the project's files appears. Type a few letters to narrow it down, then pick the one you want.

![Referencing files with @](https://files.slack.com/files-pri/T0HTW3H0V-F0B4VUX9LQK/screenshot_2026-05-20_at_9.32.18___am.png?pub_secret=d5ef6b8bc8)

> **Note:** When you create or add a new file inside VS Code, it immediately appears as a real file on your hard drive. Keep your work inside a dedicated `Development` folder so you always know where to find things.

---

## 5. The workshop repo and its projects

The repo you copied down has three main folders.

**`projects/`** holds the Day 1 and Day 2 projects, each in the inputs → operations → outputs layout:

- `01_close-reading` — Shakespeare texts; a close-reading prompt; a close reading.
- `02_population-pyramids` — UN population CSVs; analyze-and-build prompts; an interactive HTML site.
- `03_recipes` — recipe photos; prompts to rename and transcribe them; a small recipe website.
- `04_class-schedule-conflict` and `05_makeup-exams` — schedule reshuffling; makeup-exam questions from a bank of past exams.
- `06_research_helper` — recent papers in; a summary site out.
- `07_summary_of_day_1` — built from the workshop itself. Input: the Day 1 recording transcript. Outputs: the setup guides, top-tips list, and glossary. The "top 13 tips" file was created 45 minutes before Day 2 began — same input, new prompt, new output.

**`resources/`** holds reference material, including the two setup guides and the printable checklists.

**`my-project/`** is an empty project — the three folders, ready for your own work.

### Project instructions: the CLAUDE.md file

Some projects have a `CLAUDE.md` file in their main folder. This is Claude Code's version of Cowork's custom instructions: a plain-text file describing what the project is, how you'd like Claude to work in it, and any rules to follow. Claude reads it automatically whenever you work in that folder. When you find yourself giving Claude the same guidance over and over, write it into a `CLAUDE.md` so you don't have to keep repeating it.

---

## 6. Start your own project

The goal of Day 2 isn't to finish a project. It's to leave with the tool installed and a clear idea of what you'd point it at. `my-project/` is there for exactly that.

1. **Rename it.** Right-click `my-project` in the Explorer and choose Rename. Give it a name that means something to you.
2. **Put something in `inputs/`.** Drag a file in, or create a new file and paste text into it. A syllabus, a draft email, lecture notes, an exported document — anything textual works.
3. **Write the operation.** Create a text file in `operations-tools-commands/` that describes, in plain sentences, what you want done.
4. **Ask Claude to run it.** In the Claude panel, point it at your input and your operation, and have it write the result to `outputs/`.
5. **Iterate.** If the first result is 70% right, tell Claude what to change rather than starting over.

---

## 7. What this unlocks

Two examples shown in the workshop, both built by Becca:

- **Grading support.** Inputs: anonymized exam answers, the exam, solutions, and a rubric. Operations: draft a rubric, then generate per-student grading instructions. Output: a grading report you can read side by side with the original answer. It handled hard-to-read handwriting and correctly recognized a crossed-out attempt, awarding full credit for an answer left in factorial notation rather than the rubric's "choose" notation, because it understood the two are equivalent.

- **Building an online course.** Inputs: recorded videos, a Canvas export, problem sets, and a syllabus. Operations: transcribe every video, build a topic index, work through the problems. Output: a learning sequence on Canvas — a lecture clip, a quiz built from a live question, and an interactive simulation Claude built in about ten minutes from a plain-language description.

These are also the clearest illustration of the point about checking Claude's work. You don't hand Claude a dataset and hope. You give it precise instructions, you read the code it writes, you can ask it for a step-by-step record of what it did — and as you go you'll notice the mistakes it tends to make and the preferences you have. Save those into a `CLAUDE.md`, and the next run goes better. That's what "seeing under the hood" buys you.

---

## 8. Habits and gotchas

- **"Command not recognized" right after install?** Quit the terminal fully and open a fresh window. This is the fix nine times out of ten.
- **Check what changed.** When Claude edits files, the changes show up in the editor — glance at them before moving on.
- **One project per folder.** Point each project at the smallest folder that holds what it needs.
- **Start a new conversation when you switch tasks.** Leftover context from a previous task quietly misleads Claude. `/compact` shrinks a long conversation into a summary if you need to keep going.
- **Back up before big changes.** Before any task that renames or deletes many files, make a copy of the folder first.
- **Type `/exit`** to close Claude Code when you're done in the terminal.
