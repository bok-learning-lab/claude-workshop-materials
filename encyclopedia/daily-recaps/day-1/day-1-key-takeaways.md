# Day 1 / Session 1 — Top 10 Key Takeaways

_Distilled from the diarized rough-cut transcript ([`rough_cut_diarize.md`](rough_cut_diarize.md)), Chunks 1–8 (~14:25–15:42). Instructors: Madeleine (MW), Marlon (MK), with faculty demos from Becca._

---

1. **"Everything is just text — strings in, strings out."** The single most repeated mantra. LLMs don't *read*; they tokenize text into numbers (the `unhap-`/`-ily` split demo) and predict more text. The intelligence is "consistently inhuman." Memory, skills, system prompts, even code — *all just text files* ("sometimes there are scripts; most of the time it's just text files").

2. **LLMs recognize patterns but can't actually calculate.** The five-digit-times-five-digit demo: it nails the first digits, last digits, and magnitude, but **hallucinates the middle**. A *general* question gets a plausible-but-wrong *general* answer. For real math it must make a **tool call** (writes Python) — and that pattern (LLM alone vs. LLM + tool) recurs everywhere.

3. **It will be confidently — and stubbornly — wrong.** The *Coriolanus* close-reading demo: Claude insists Act 1 Scene 9 doesn't exist, then ("you're right, it absolutely exists!") flips and analyzes it anyway. Sycophancy + hallucination, live. The teaching point: this is why naïve "do my homework" use fails.

4. **But once you understand *how* it fails, you can constrain it to produce excellent work.** The whole AI-literacy framing — the failure demos aren't to scare people off, they're to build the intuition that lets you get Becca-quality outputs.

5. **The context window = Memento.** Every new chat starts amnesiac. What gets loaded *first and invisibly*: the **system prompt** (~10k words / ~15k tokens, published by Anthropic, present in chat *and* Cowork *and* Code, and **you can't edit it**), then **memory**. Windows run 200K–1M tokens.

6. **Primacy + recency, and "context rot."** First instructions and last instructions matter most (why the system prompt sits at the very front). More context helps — *up to a point* — then quality degrades ("lost in the sauce" / "lost in the middle" papers in the shared folder).

7. **Shift the ratio toward human-vetted context; start fresh chats.** You typically contribute far fewer tokens than Claude does — deliberately flip that. And errors **persist forward** in a thread, so a hallucination doesn't go away when you correct it; spin up a new chat rather than dragging low-signal tokens (your old email thread) into a research question.

8. **The triptych: Chat → Cowork → Code = rising power *and* rising danger.** Chat (web/desktop) is cloud-only and can't touch your files — "nothing bad can happen." Cowork and Code can **access local files** — the killer feature, but the risk. Point it at **one specific folder**, and don't reflexively click "yes, yes, yes" (the Homer-Simpson-at-the-reactor warning). And the standing promise: **you can stay in Cowork all week and still accomplish everything.**

9. **Artifacts vanish in chat; Cowork saves real local files.** The friction that pushes you out of the web UI: you make a great artifact, then can't find it / can't share it. Cowork writes actual `.html`, `.pdf`, `.txt` to disk where you can manipulate and share it. (Also: don't ask for an *image* of a data viz — that's a diffusion model and it'll be pretty but wrong; ask for an **interactive artifact + attach the CSV**, and it writes code.)

10. **The "recipe" mental model: ingredients (context) + instructions (prompt) → dish (output).** Becca's grading examples anchored it — a rubric-drafting skill, and final-grade tabulation that took **30 minutes instead of 4 hours**. The closing analogy: you're building a **course pack for a brilliant student who hasn't done the reading** — give it the right inputs and instructions and it delivers. This sets up the Day-1→Day-2 homework: faculty map a project as ingredients + instructions + output.

---

## Secondary points worth keeping

- **Model tiers** — Opus 4.8 = most capable for ambitious work; Haiku 4.5 = cheapest. Match model to task to conserve tokens.
- **Memory is just a text file** you can turn on and edit (Harvard instance not accruing it *yet*); it can also import memory from other providers — also just a pasted text file.
- **Harvard data-safety guarantee** — safe through Level 3 data (student work OK); Anthropic won't train on it or share it.
- **Claude doesn't watch your files** — edit a file and it won't know until you tell it to re-read it (foreshadows hooks / git automation on later days).
