---
layout: default
title: Research Paper Site
section: activities
---

# Research Paper Site — a thin viewer over a research-in-progress folder

A worked example of **publishing research-in-progress with about 150 lines of Next.js code**. No CMS, no headless content layer, no rewriting research as web posts — the markdown files the researcher writes for themselves *are* the published content; the website is a friendly viewer over the file tree.

Drawn from the production site at **[harvest-times.vercel.app](https://harvest-times.vercel.app/)**, the public research site for an investigation into Anglo-Saxon harvest-time pharmacology. Source repository: **[github.com/ll-catacomb/harvest-times](https://github.com/ll-catacomb/harvest-times)**. The repo *is* the research; the site is the viewer.

## What it is

A single Next.js app with three routes that together produce a navigable research site:

- **`/`** — landing page. Renders the repo's `README.md` plus five section cards (one per top-level research folder).
- **`/browse/[...path]`** — the dynamic catch-all route. Renders directories (sorted file listings) or files (markdown via `react-markdown`, plain text in `<pre>`, PDFs in `<iframe>`, anything else as a download link). Gated by `ensureSafe()` so the browse route can only read files under the five declared section roots.
- **`/api/file/[...path]`** — a thin serverless route returning raw bytes for PDFs and other binary downloads.

That's the whole architecture. The research itself lives in five folders at the repo root:

- **`sources/`** — primary texts and PDFs (Old English Herbarium translation, Review of Scholarship).
- **`analysis/`** — the researcher's analytical work (candidate remedies, expanded candidates, deep research findings, theoretical framework, paper arcs).
- **`drafts/`** — working paper drafts (ethnopharmacology, intellectual history, folklore).
- **`proposal/`** — the experimental proposal (6 proposed experiments).
- **`agent-output/`** — AI-generated drafts, syntheses, and bibliographies, kept structurally distinct.

## The moves worth noticing

### Move 1 — File tree as navigation, repo root as content root

Most research-publication tools rebuild research as web content — paste your paper into a CMS, copy your notes into a wiki, export to Substack. This site's commitment is the opposite: **the markdown files you wrote for yourself are the published content**.

That commitment shapes every design decision:

- **No `_content/` directory.** Section folders live at the repo root, where a researcher would put them if there were no website. Adding the site doesn't change where the files go.
- **No frontmatter required.** Markdown files don't need YAML headers. The site renders whatever's there.
- **Relative links work the same way in your editor and on the web.** A markdown file at `analysis/candidate_remedies.md` containing `[theoretical framework](theoretical_framework.md)` produces a link to `/browse/analysis/theoretical_framework.md`. A ~15-line link rewriter in the Markdown component handles this.
- **No build step for content.** Edit a markdown file, push, refresh.

### Move 2 — `ensureSafe()`: the one piece of hard code

The `[...path]` route accepts an arbitrary path and reads from disk. The hard security constraint: **the request must not be able to read anything outside the declared sections.** That's enforced by a single guard function:

```typescript
const SAFE_PREFIXES = SECTIONS.map((s) => s.slug);

function ensureSafe(parts: string[]): string {
  if (parts.length === 0) throw new Error("empty path");
  if (!SAFE_PREFIXES.includes(parts[0])) throw new Error("forbidden");
  const full = path.normalize(path.join(ROOT, ...parts));
  const sectionRoot = path.join(ROOT, parts[0]);
  if (!full.startsWith(sectionRoot)) throw new Error("traversal");
  return full;
}
```

Three checks (non-empty, first-part-is-a-section, post-normalization-stays-under-section-root), and every file-reading function routes through this guard. Get this wrong and the site exposes the whole filesystem; get this right and the site can serve anything under the declared sections without further security ceremony.

This is the *one* hard piece of code in the otherwise-thin viewer. The rest is short by design — five file-type branches in the browse route cover most research artifacts, the Markdown component is ~35 lines, the landing page is ~30 lines.

### Move 3 — The agent-output firebreak

The research repo dedicates **one top-level section** (`agent-output/`) to AI-generated artifacts, kept structurally distinct from human-authored research. The reader navigating the site can see, on the landing page, that there's a separate section for AI work — and can click in to see exactly what the AI was producing during the research process.

The agent-output firebreak is a convention with teeth: agents write into the firebreak folder so their drafts don't pollute the curated research. Without it, a polished paper hides AI provenance; with it, the AI's outputs are right there to inspect. The firebreak doesn't *prevent* AI from influencing the human-authored work — of course it does — but it makes the AI artifacts *available as a separate reference object*, which is what auditability actually requires.

The blurb on the section card plainly states "generated by AI agents." No euphemism. Honest labels are part of the contract.

## Things this approach taught us

**The repo IS the publication.** Once you commit to reading the file tree directly, you stop thinking about "publishing" as a separate workflow. The researcher writes; the site reads; the reader navigates. There is no intermediate "publish" step.

**Frontmatter is overhead at this scale.** Smaller research projects don't benefit from a metadata schema; the filename and the section ARE the metadata. Adding YAML frontmatter would introduce an authoring tax for no reader benefit.

**Relative-link rewriting is the load-bearing piece for editor-fidelity.** Without it, the researcher would have to write `[link](/browse/analysis/x.md)` (a URL) in their markdown, which breaks in the editor. With it, they write `[link](../analysis/x.md)` (a relative path) and both contexts work.

**Pages render at request time, not at build time, on purpose.** `generateStaticParams()` returns `[]`. A researcher who pushes a new markdown file sees it live as soon as Vercel rebuilds the small Next.js code (which doesn't depend on content).

## Live demo and source

- **Live site:** [harvest-times.vercel.app](https://harvest-times.vercel.app/)
- **Source repo:** [github.com/ll-catacomb/harvest-times](https://github.com/ll-catacomb/harvest-times)

## Notes for adapting

The 150 lines of Next.js code port nearly verbatim. The substance — your research — replaces this site's substance. What changes for your discipline is the **section list** and the **file types you render**, not the architecture.

- **Doctoral students preparing dissertations** — section folders like `{ chapters, citations, drafts, archive, agent-output }`.
- **Lab notebooks for empirical research** — `{ protocols, raw-data-summaries, analyses, drafts, agent-output }` (point at the raw-data-summaries rather than the actual large data files).
- **Reading groups and seminar journals** — `{ readings, notes, discussion-summaries, drafts, agent-output }`.
- **Editorial projects with multiple contributors** — each contributor owns a subdirectory under a section; the firebreak applies to whichever contributors used AI assistance.
- **Open peer review** — the reviewer reads the public research-in-progress site and submits notes via the repo's PR workflow; the site stays read-only and remains the canonical reference for the reviewed material.

Candidate operations to add against the same architecture: per-section landing pages that override the generic directory rendering; a build-time full-text search index (Pagefind) when the corpus grows past skim-navigation; a `/print` route that concatenates all human-authored markdown into a printable single page; citation extraction that walks all markdown for `[author year](url)` style citations and produces a per-section bibliography.

### Alignment constraints that survive translation

- **The repo root is the navigation root.** Section folders at the repo root, not in `_content/` or `content/` or anywhere hidden. The researcher reads and edits the same paths that get URLs.
- **Safe-prefix routing is non-negotiable.** Every file-read must go through `ensureSafe()`. Don't add a back-door reader function that skips the check.
- **No frontmatter required.** Markdown files render as-is.
- **Relative links resolve the same in the editor and the browser.**
- **Agent-output is a top-level section, not nested.** The firebreak only works if it's visible from the landing page next to the human-authored sections.
- **Agent-output is kept in original form.** Not polished after the fact; if you absorb parts, take them into `analysis/` or `drafts/` and leave the original intact.
- **Read-only by default.** No edit UI. The site reads; the researcher edits in their editor.
- **No LLM call at runtime.** The site is fully static. Where AI is used, the outputs live as static files in `agent-output/`.
