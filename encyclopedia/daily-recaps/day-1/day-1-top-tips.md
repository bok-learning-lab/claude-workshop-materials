# Day 1 — Top Tips for Using LLMs and Harnesses

The Day 1 walk-through teaches the *clicks*. This is the other half: the
guidance the instructors kept returning to about **how to think about these
tools** so you get good output instead of confident nonsense. These are the
ideas worth carrying into every chat, Cowork task, and (later) Claude Code
session.

---

## 1. Know which surface you're in: claude.ai vs. Cowork vs. Claude Code

These are three doors onto the *same* models. What differs is how much reach the
model has into your machine — and therefore what it can do for you and what you
have to be careful about. (This goes a little beyond what was said on Day 1, to
give you the whole map.)

- **claude.ai (browser / desktop chat).** A conversation, plus files you paste
  or upload, plus artifacts it generates. **Nothing touches your computer.**
  Best for: thinking, drafting, a one-off analysis, or producing a single
  self-contained artifact (a chart, a page, a document) from data you hand it.
  Lowest setup, lowest risk. Ceiling: it can't see or change your files — you
  copy context *in* and copy results *out* by hand.

- **Claude Cowork (desktop app, connected to a folder).** The same chat, but it
  can **read and — with permission — change the files in a folder you grant
  it.** Best for: work that *is* your local files — rename/transcribe/summarize
  a whole folder, generate many interlinked outputs, iterate on real documents.
  The local-file access is the game-changer; the cost is that you must be
  deliberate about *which* folder and *what* permissions (see tips 9 and 10).

- **Claude Code (terminal + editor).** The harness with the most control: it can
  run commands, follow repeatable multi-step workflows, and use slash commands
  (`/compact`, `/context`), skills, and agents. Best for: scale, automation, and
  repeatability — "once words can *do things* in the world via the command line,
  it's game-changing." Steeper entry (you work in a terminal) but the highest
  ceiling. This is Day 2's focus.

**Rule of thumb:** start at claude.ai for thinking and one-offs; move to Cowork
when the work *is* your local files; reach for Claude Code when you need scale,
repeatability, or fine-grained control. Each step gives the model more reach
into your machine — so it's a progression of *capability* and of
*responsibility*. Match the surface to both the task and its risk.

## 2. Don't ask the model to *do* the hard thing — ask it to write the code that does it

The signature demo of the day: ask the model to multiply two large random
numbers and it gets close but wrong (right number of digits, first few digits
right, the rest invented). Ask it to *write a little Python script* to do the
same multiplication and it's perfect, every time.

Why: the model learned arithmetic as text patterns from the internet, so it
*approximates*. But "write a function that multiplies two numbers" is the most
practiced task on the internet — it never gets that wrong. **Lean into what it's
reliably great at (writing code) rather than asking it to one-shot something
it's structurally bad at (precise computation).** Code is also "how you take
strings of words and do things in the world" — that's the multiplier.

## 3. Give it context — don't ask cold, "one-shot" questions

The Shakespeare close-reading demo: asked cold for a close reading of a scene,
the model insists the scene doesn't exist and offers near-misses. Paste in the
actual text and it does a credible reading. Same pattern as the multiplication:
**"When you just ask a question without context, it might go wrong. Give it the
right context and the right tools, and it starts to go really, really right."**

## 4. The technology is powerful but *inhuman* — it's all just text and tokens

The recurring "beat" of the day. Words go in as strings of numbers (tokens, and
the splits are weird and non-human), numbers come out. Memory, `/compact`,
skills — none of it is magic; **it's all just markdown text files being added to
the conversation.** The payoff of understanding this: you stop being surprised
by hallucinations, and you realize *you* have control over those text documents.

## 5. Understand the context window — and that position matters

Everything lives in a context window (~200K tokens for most models, up to 1M for
some — "the length of a novel"). Before you type anything it already holds the
**system prompt** and your **memory file**, then your attached docs and query,
then every exchange stacks on top until it's full and gets summarized ("every
new thread is a new day" — the *Memento* analogy).

The pro-tip inside this: **not all context is equal.** The beginning (system
prompt, memory, initial query/docs) and the *most recent* thing you said carry
the most weight; material in the middle of a long context gets lost ("context
rot" / "lost in the middle"). So put what matters most at the start or say it
again at the end.

## 6. Start a new chat / new task whenever you switch tasks

Leftover conversation is silently passed as context and *misleads* the model —
if you were doing math and then ask it to write an email, the math is still in
there shaping the answer. **"New chat / new task is the cleanest way to keep
your context tidy."** Cheap habit, big quality difference.

## 7. Actively manage the context — compact, fork, and watch usage

When a conversation goes down the wrong path or gets long, you don't have to
start from zero: `/compact` crushes the history into a summary and continues;
you can fork a conversation; `/context` shows you exactly how many tokens the
system prompt, tools, and messages are eating. Knowing "what's going on under
the hood" is what lets you steer instead of just hoping.

## 8. Pick the model to match the job

Opus 4.7 is the strongest but burns credits fastest. Use **Sonnet/Haiku for
light or simple questions**, and **bump up to Opus for heavy research, complex
reasoning, or code that has to be right.** Start low, escalate when you hit a
wall. You can switch mid-conversation.

## 9. Mind data sensitivity — this plan is "at your own risk" for now

The HUIT bridge plan has **no Harvard data agreement yet**. Only put in data
you're comfortable sharing — public material and the workshop sample files are
fine; **student work and research data wait until the Anthropic Enterprise
agreement is in place.** The memory toggle carries the same caveat: useful, but
you decide what Claude gets to remember about you.

## 10. Be deliberate about what folders you give Cowork

Cowork can read — and, with permission, *change* — every file in a folder you
connect. The classic "watch it tidy my Downloads folder" demo is genuinely
dangerous if that folder holds research data, taxes, or anything sensitive.
**Create a dedicated project folder (or link the one we provided) rather than
pointing it at Downloads/Screenshots**, and grant write permission consciously.

## 11. Use exact file paths for reliable local work

When you want Claude to act on a specific file or folder, give it the full
path (Mac: option-click → *Copy as Pathname*; or drag the file in). A path is
"like a URL — a unique identifier for that resource," so the model acts on
*exactly* what you mean instead of guessing.

## 12. Iterate by just telling Claude what's wrong

Artifacts and outputs are conversational. "If there's anything you don't like
about the visualization, just tell Claude." Don't restart from scratch to fix
one thing — describe the change and let it revise.

## 13. Keep your judgment in the loop — the model extends you, it doesn't replace you

The honest framing from the instructors: an LLM summary of 30 papers isn't as
good as reading them yourself — but you'd never read all 30 otherwise, so it's
"at least a little better than nothing." The mental model to carry forward:
**bring in context → manipulate it with the LLM → produce outputs, and chain
those operations** — with you making the decisions at each fork. That's where
your agency, and the value of understanding the mechanism, lives.
