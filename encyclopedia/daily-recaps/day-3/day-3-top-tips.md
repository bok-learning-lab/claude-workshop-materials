# Day 3 — Top Tips and Tricks

Day 3 moved us from *getting Claude Code working* to *working well inside it*:
cloning anything from GitHub, organizing projects and sessions, and the two
document types — `CLAUDE.md` and skills — that let a folder teach Claude how to
behave. These are the tips worth carrying forward.

---

## 1. Cloning a repo is a core skill — and there are three ways to do it

Every session this week starts the same way, on purpose: get the repo, open a
session in it. Three routes, all equivalent: (1) download the ZIP from the
green **Code** button and unzip it; (2) in the terminal, `cd` into your
development folder and `git clone <url>`; (3) easiest of all — open a Claude
session *in the parent folder* (e.g. `Development`) and say "can you clone this
repo?" with the URL pasted in.

The catch everyone hits: cloning and working are **two different sessions**.
You clone from the parent folder, then start a *new* session and select the
cloned folder itself. The folder shown at the bottom of the app is the one
you're actually working in.

## 2. `git pull` makes a repo a living document

If we add files to a repo after you cloned it, you don't re-download anything.
Open a session in that folder and ask Claude to "do a git pull of this repo" —
it pulls down exactly what changed. That's what makes a repo "more similar to a
Google Doc" than a ZIP file: multiple people can collaborate on it and everyone
can pull the updates down.

## 3. GitHub is a context goldmine for your discipline

You've been cloning *our* repos; now go find your own. Google
"github repo *<your topic>*" — there's an MIT repo of all of Shakespeare's
plays, a Berkeley course on computational social science, and countless papers
whose authors publish their data, methods, and scripts so you can re-run or
extend them. Tools you already use — Canvas, Scalar, TimelineJS, StoryMap —
live there too, openable for the first time: "up until 2023 there were so many
black boxes that academics were given … and now it's relatively easy to peer
into these tools." Until you've built up your own folders of context, other
people's repos are the fastest way to fill the context window with something
real.

## 4. Judge a repo before you clone it: stars, forks, age, and institution

Anything from the internet can carry something malicious, so assess before you
clone. The signals: **stars, forks, and watchers** (evidence other people use
it), **who published it** (MIT, Harvard, Berkeley are good signs), and **age**
(never install something brand-new with zero stars that no one has ever used).
For coders: modern package managers (`uv` for Python, `pnpm` for JavaScript)
can refuse anything published in the last 24 hours or 7 days — usually enough
time for the internet to discover a problem. GitHub's own bots constantly scan
public repos (commit an API key and "within four hours they found that thing").
And once you've cloned something, a great first prompt is to ask Claude itself:
*look around — how safe do you think this thing is?*

## 5. Pick the model deliberately: Fable 5 is here, but Opus is the workhorse

A new top-tier model, **Fable 5**, appeared in the picker this week. It's
extremely capable but burns credits faster and ships with tight safety
constraints — anything brushing against cybersecurity or biology can trigger a
refusal and bump you down a tier. For almost everything in this workshop,
**Opus 4.8 (or Sonnet) is the right choice.** Check where you stand anytime
with `/usage` or the settings graph; if Opus feels slow during live work, turn
**thinking** down from high to low rather than switching models.

## 6. Untangle the vocabulary: a session is a context window; a project is a folder

The naming is genuinely confusing across surfaces, so here's the decoder ring:
**session = chat = task = thread — each one is a context window.** And in
Claude Code (and Cowork), **a project is just a folder on your computer** — the
same thing you'd call a repository once it's on GitHub. (On claude.ai,
"project" confusingly means a cloud-side bundle of chats instead.) The folder
is "the unit of work to think about as you're sketching out the work you're
doing against these tools."

## 7. Organize the app: group your chats by project

Once you have a few projects going, the sidebar gets noisy. In the recents
settings, **Group by project** sorts every chat under the folder it ran in.
For finer control, open any chat's three-dots menu → **Move to group** → **New
group** — name it whatever you like ("Wednesday," "writing zone"; it's a label,
not a filename, so spaces are fine). You can also rename individual chats.
Groups are purely cosmetic — they organize *you*, not the model's context.

## 8. Start new sessions early and often — context rot is real

The first half of a context window is where the action is: what comes in early
(system prompt, `CLAUDE.md`, your opening documents) and what you said most
recently carry the most weight, and quality sags in the middle. So don't wait
for auto-compact — start a fresh session whenever you switch tasks, and
"pretty frequently" even when you don't. The cautionary tale: nearly every
case of so-called AI psychosis traces to someone who stayed in one thread for
months while the system prompt got summarized, diluted, and strange. The cure
for re-explaining yourself in every new session isn't a six-month thread — it's
the next two tips.

## 9. `CLAUDE.md` is for things that are *always true* in a folder

A file literally named `CLAUDE.md` at the root of a project is read
automatically at the start of every session there. The proof from class: one
line at the bottom of an otherwise-normal doc — "end every single thing with a
limerick" — and every response in that repo arrived in verse. Use it for what's
always true: who you are, how you want HTML styled, what this project is, what
the folder structure means. There's a global one for things true everywhere
("my name is …, never use emojis") and a per-project one for everything else.
Creating one is the move to practice: open a session in a new folder and say
"please create a CLAUDE.md file in this folder that …" — you'll want one in
every project you ever make. (Edits to it load in *new* sessions — not
necessarily the one you're in.)

## 10. Skills are for things that are *sometimes true* — a prompt library that loads itself

A **skill** is a `SKILL.md` file: a long text description of how you like a
recurring process done — "it's just a prompt … a conditional prompt." The magic
is the header: every skill carries a name and description, and at session
start Claude loads *just the headers* — a map of your prompt library — then
proposes the right skill when your request matches. You can name it explicitly
("run the syllabus-redesign skill on this syllabus") or just describe what you
want and let it find the skill itself. Project skills live in
`.claude/skills/<skill-name>/` at the project root — open one up, read it,
argue with it, edit it. Rule of thumb from class: if you'd copy-paste the same
prompt even twice, make it a skill. And a skill can point at a script you
trust, so Claude runs your known-good code instead of whipping up new code
every time. (The handouts you've been getting every morning? That's a
formatting skill — colors, fonts, structure — run on each day's draft.)

## 11. To use a worked example on your own material: drop the file in, copy its path

The pattern for every example in our repos (`inputs/` → `operations/` →
`outputs/`): drag **your** syllabus (or transcript, or PDF) into the example's
`inputs/` folder, click the file's three-dots menu → **copy path**, paste the
path into the chat, and say "please run these operations on just this file."
Absolute or relative path — either works. The output lands in `outputs/`. And
don't be shy about scale: you can also say "loop through all twenty syllabi in
inputs and produce an output for each." A million tokens is a lot.

## 12. Build a harvesting workflow — let Claude structure what you collect

The demoed researcher move: make a subfolder (even in Downloads) where you
toss PDFs as you find them, and put a standing instruction in your project's
`CLAUDE.md`: when asked, convert what's in that folder to markdown and write a
summary. Then "I'm ready for you to harvest my downloads" does the rest. For
web pages, select-all → copy → paste into a chat with "write a new doc with
this content" and let Claude convert the mess to clean markdown. Getting
quickly "from stuff you see on the internet to structured, cleaned-up text" is
the habit that makes every future session start rich.

## 13. Keep the thinking in text — PDFs are a view layer

From the PDFs-to-LaTeX example: a PDF is for *showing people* the result, not
where the work happens. Convert inherited PDFs into a text format the model
reads natively — markdown, or LaTeX when equations and precise layout matter —
do all the editing and generation there, and render back to PDF at the very
end. Text in, text out: the model "can read the LaTeX … it's not gonna
hallucinate."

## 14. Coming attractions: APIs and MCPs (Day 4)

The skills you saw hint at it: a vision script comparing Claude's and Gemini's
transcriptions of board work, an API fetching Luhmann's Zettelkasten cards from
a server. **API keys** are "little secret passwords" that let services talk to
each other — pull documents in from elsewhere, push results out, bring other
models into the loop and compare them for ground truth. That — plus MCPs — is
Day 4.
