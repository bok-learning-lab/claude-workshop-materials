# Day 1 (8 June 2026) — Top 10 Key Takeaways

_Distilled from the diarized session transcript ([`20260608-transcript.md`](../../day-1-recap/20260608-transcript.md)), Chunks 1–9 (~13:24–14:53). Instructors: Madeleine (MW), Marlon (MK), with the executive-director demo from Becca and questions from Jonah, Ian, Christine, Jordan, and Jungyoon, among others._

---

1. **"Strings in, strings of numbers out" — that is all an LLM is.** The day's most repeated mantra. The Tiktokenizer demo on `unhappily` (split into `un` + `app` + `ily`) makes it visceral: language gets chopped into chunks "no human decided," reduced to integers, and the model predicts more integers. The intuition this builds: it is a "very inhuman sort of machine" that mimics patterns of human knowledge — and everything downstream (memory, the system prompt, skills, even `/compact`) is just more text.

2. **LLMs recognize patterns but cannot actually calculate — so make them call a tool.** The five-digit × five-digit demo: the first three digits, last three digits, and order of magnitude come out right; the middle is hallucinated. Marlon's line: it's "close to truth, capable of persuading you that they are true if you're not careful." Ask for a Python function and it nails it — "we're really leveraging what it's trained to do well." The LLM-alone-vs.-LLM-plus-tool pattern recurs everywhere.

3. **It will be confidently — and sycophantically — wrong.** The live *Coriolanus* close-reading demo: Claude insists Act 1 Scene 9 doesn't exist, then ("I apologize. I'm so sorry. You're totally right") flips and analyzes it once the scene is pasted in. Hallucination plus sycophancy on stage. This is the naïve "do my homework" failure mode faculty most need to internalize.

4. **Don't ask for an *image* of a data viz — ask for an interactive artifact and attach the CSV.** The population-pyramid contrast: a diffusion model produces something pretty but wrong (pixels, not data); Claude artifacts open code tools, read the CSV's structure, and generate an actual interactive. As Marlon put it for the recipe-website moment later: "you don't need to know code at all, you just need to know to ask for an HTML doc." Same logic as Python for math — route the task to the tool that does it well.

5. **The "light at the end of the tunnel" is Becca's demos — what faculty can actually build.** A Monty Hall lesson auto-assembled from her existing course materials into the new LXP (video clip → quiz → vibe-coded interactive → reveal clip). Handwriting grading on in-class assessments, where Claude reads the student's diagonal cross-outs and `UUURRR` lattice notation, and gets it wrong "at a lesser rate than my TFs." A blackboard-video lecture transcribed and turned into course notes. The point of the failure demos is to make these results legible — not to scare people off.

6. **The context window = Memento (or "a brilliant student who hasn't done the reading").** Every new chat is amnesiac. What loads first and invisibly: the **system prompt** (Anthropic publishes theirs — safety plus style; "you can't edit it"), then **memory** (also just text — a file you can toggle on). Then your prompts and Claude's responses pile in until you hit the wall: ~200K tokens for older models, 1M for the newer ones. Marlon's alternative metaphor for the non-Memento-watchers: don't let the brilliant student fill the window with smart-sounding stuff that isn't grounded in your reading.

7. **Primacy, recency, and "context rot" — the middle of a long thread quietly loses weight.** The first tokens (system prompt) and the most recent instruction pull the most weight; everything in between degrades as the window grows. The practical move: refresh aggressively — start new chats, run `/compact` before you have to, and shift the ratio toward your own vetted, high-signal context so Claude isn't dominating the conversation with its own long outputs.

8. **Cowork's killer feature is local-file access — and its main risk is yes-fatigue.** Chat (cloud-only) can't touch your files; Cowork and Code can read and write them. Point Cowork at one specific folder (subfolders are included — "I wouldn't give it access to my desktop or, you know, my root drive"). And watch the permission prompts: the Homer-Simpson-at-the-reactor warning — Claude will keep asking until you stop reading and just click yes. Create a dedicated `Development/` folder so the system-wide pop-up stops creeping you out.

9. **The recipe-cards demo is the whole workshop in five minutes.** Point Cowork at a folder of weirdly-named recipe photos; ask it to rename each by what's actually on the card, write a markdown doc of the recipe, add historical context on the dish, and finally produce "one single stylish HTML file" embedding all of them. In one prompt: batch file ops + image reading + transcription + creative writing + HTML output. Marlon's pitch — translate the same move to syllabi, manuscripts, marginalia, blackboard photos, a teaching journal.

10. **The recipe mental model — ingredients (context) + instructions (prompt) → dish (output).** The day's closing analogy and the take-home homework: when you plan a project, list the ingredients you'd hand a "brilliant student who hasn't done the reading" (syllabus, readings, P-sets, course videos), specify the output precisely (a new file? slides plus a lecture script?), and write the prompts that connect them. Skills, scripts, and tools — coming on later days — are just ways of packaging the same recipe so you stop copy-pasting.

---

## Secondary points worth keeping

- **Model tiers.** Opus 4.8 (most capable, slowest, priciest); Sonnet 4.6 (workhorse); Haiku (cheapest). You can also dial reasoning effort high → low for speed during demos.
- **Markdown is the lingua franca** for feeding context — also HTML and other structured formats. Matthew Schwartz's online interactive physics textbook is the scale-up example.
- **"Coding is just reading and writing files."** Said in passing while introducing GitHub, but it's the frame that lets non-coders work in Cowork and Code without flinching.
- **"You are X" is the speaker-audience inversion.** With an LLM you're at "interaction zero" — the LLM is the speaker, you set the role and the form. ChatGPT's original "You are a helpful assistant" is the ur-version.
- **Chain prompts, and draft prompts with another LLM.** Translation courses use this: produce a draft, ask "what are the top five problems with this," then fix. Madeleine grows a "super prompt" inside one chat, then starts a fresh chat with it.
- **Compaction sands off rough edges.** As Claude summarizes its own context to keep going, your original vision drifts — worth flagging for academics and creatives.
- **"Ten top tips from yesterday" is the model for your own course materials.** Hand students the curated repo and let Claude be their index — grounding their learning in context you've vetted.
- **3D / spatial layout is still weak.** Madeleine still hand-edits XY coordinates in vibe-coded frontends.
- **`/compact` is editable.** Madeleine wrote her own `/mw-compact` slash command because she disagrees with some of Anthropic's defaults.
- **Sycophancy is a feature of training, not a bug** — flag for faculty so they don't read "you're absolutely right" as confirmation.
