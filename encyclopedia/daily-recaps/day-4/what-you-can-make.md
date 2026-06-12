# What You Can Make with Claude — A Gallery

*A gallery of faculty projects, ordered from familiar text toward unfamiliar code.*

**How to read this.** A review of what faculty are building, arranged on one axis. It begins in the writing you already command and descends toward forms that did not exist two years ago. Each row is a genre of output: quick examples first, then one project unpacked — situation, inputs, operations, outputs, and the interface suited to it (Chat / Cowork / Code). The loop is constant — inputs, operations, outputs. Only the medium changes. Begin where you are fluent. Descend.

## 1. Structured Text & Documents — *most familiar*

Generating finished products in genres you already know.

**Examples:** an email to a chair proposing a new course · an NSF/NIH grant Specific Aims page from a project description · a committee report from raw meeting notes · a letter of recommendation from a CV and a prompt · a conference abstract from a draft paper · a syllabus skeleton from a reading list.

**Unpacked: meeting notes → a clean report for the dean**
- **Situation:** you left a faculty meeting with messy notes and need a structured report by tomorrow.
- **Inputs:** `meeting-notes.md` — your raw bullet points.
- **Operations:** one prompt: "Turn these notes into a report with a summary, decisions made, and action items with owners and dates."
- **Outputs:** `report.md`, or a polished `.docx` on request.
- **Best fit:** Chat or Cowork; Code if repeated monthly.

## 2. Reference Pages (Static HTML) — *intro to code*

Your first step into code: one file, opens in any browser, no setup.

**Examples:** a searchable glossary of course terms · a one-page syllabus website · a printable command/reference dashboard · an illustrated lecture handout · a course-policy FAQ page.

**Unpacked: a glossary your students can search and copy from**
- **Situation:** you want one page holding every key term in your course, searchable, that works offline.
- **Inputs:** `glossary.md` — terms and definitions.
- **Operations:** "Build a single-file HTML page with a search box and click-to-copy, styled for comfortable reading."
- **Outputs:** `glossary.html` — one file you can email or host anywhere.
- **Best fit:** Code or Cowork.

## 3. Web Apps (Next.js) — *more complex*

Multi-page, deployable sites with real interactivity.

**Examples:** a course website with interactive concept demos · a reading-response collection app · an interactive timeline of a period or movement · a "build your own X" student exercise.

**Unpacked: course site for GENED 1049 *East Asian Cinema***
- **Situation:** you want a site that pairs a cinematography glossary with interactive demos built on the films you actually teach.
- **Inputs:** syllabus, *Rashomon* stills, glossary text.
- **Operations:** scaffold a Next.js app, build parametric demo components, deploy to Vercel.
- **Outputs:** a live site (e.g. `gened-1049.vercel.app`) you share by link.
- **Best fit:** Code.

## 4. Bots & Connected Tools (MCP, Slack) — *more complex; today's topic*

Claude wired to live data and other services.

**Examples:** Claude connected to Semantic Scholar for live literature search · an art-history lecture pulling live images from Harvard Art Museums · a Slack bot that answers from your course materials · an oral-exam practice bot · Claude connected to your Google Drive.

**Unpacked: an art-history lecture, illustrated from the museum's own records**
- **Situation:** plain lecture notes name a dozen works. The illustrated page must show the real objects — fetched, not remembered.
- **Inputs:** the lecture notes; a free Harvard Art Museums API key in `.mcp.json`.
- **Operations:** a custom MCP gives Claude the museum's search and object tools. It looks up each work, pulls images and tombstone metadata, builds the page.
- **Outputs:** an illustrated lecture page where every image and caption traces to an accession record.
- **Best fit:** Code (MCP servers run here). The worked version is this repo's `simple-art-history-lecture` example.

## 5. Data Visualizations (d3, three.js) — *even more complex*

Turning a corpus or dataset into something you can see and manipulate.

**Examples:** a 2D semantic-embedding map of a text corpus · an interactive chart of course-evaluation trends · a 3D model of a molecule, artifact, or building · a network graph of citations or characters · an animated explainer for a hard concept.

**Unpacked: Calvino's *Six Memos*, by the numbers**
- **Situation:** you want students to see literary qualities as a measurable space — and plot their own prose against it.
- **Inputs:** the five memos as text; definitions for each measure.
- **Operations:** deterministic text analysis + a 2D embedding map + a live draft composer, charts drawn in d3.
- **Outputs:** a live page where pasted prose appears in every chart in real time.
- **Best fit:** Code.

## 6. Agentic Pipelines & Systems — *most complex*

Many tools orchestrated at scale: subagents, connected data, automation.

**Examples:** close-reading a whole corpus with parallel subagents · a reproducible coding pipeline for interview transcripts · an automated weekly research digest (scheduled) · a recommendation engine grounded in institutional data.

**Unpacked: naming every writer cited across 538 Dylan songs**
- **Situation:** you want a close reading at corpus scale — every author named in any lyric, with the line quoted — not a keyword grep.
- **Inputs:** the full corpus of songs (or transcripts, or a long text).
- **Operations:** spawn parallel close-reading subagents, each told to read like a scholar and refuse to grep; aggregate their findings.
- **Outputs:** one aggregated JSON plus a prose writeup pairing each name with its quoted line.
- **Best fit:** Code (subagents, scale).

## ?. Unknown ??? — *beyond the map*

One day, a sort of Gesamtkunstwerk. Past the bottom: potentially new mediums, or new combinations of the rows above — text, application, visualization, sound, physical space in one project — buildable as the remaining technical barriers come down. Too early to catalogue.
