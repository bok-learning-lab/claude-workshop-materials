---
layout: default
title: "Art history lecture"
section: activities
---

# Art history lecture

A small Claude Code project that turns a lecturer's plain-text notes into a single, self-contained, illustrated web page — where every image and every catalogue fact is pulled **live from the Harvard Art Museums** through a custom MCP server, not from the model's memory.

**This is the MCP example.** Most of the other projects in this gallery teach Claude a *discipline* through a prompt or a skill: write the neutral summary before the twist, steelman before diagnosing, rank exactly ten things. This one is different. It gives Claude a *new sense* — live, sourced access to an external collection — and lets that change what kind of artifact it can be trusted to build. The leverage is the tool, not the prompt.

> **Live output:** [The Broken Surface — illustrated lecture page](outputs/index.html){:target="_blank"} — opens in a new tab. The twelve plates load live from Harvard Art Museums' IIIF service.
>
> **Source repo:** [`claude-code-20260604/examples/simple-art-history-lecture/`](https://github.com/bok-learning-lab/claude-code-20260604/tree/main/examples/simple-art-history-lecture)

> **Heads-up for Harvard Edu accounts:** reproducing this on a Harvard-managed account currently won't work — Harvard IT's managed permissions block MCP servers from loading (along with installs and `.env` reads), especially in Claude Code via the desktop app. The finished output page above still works in any browser; only the *build* path is blocked, and the policy shifts as the service matures. See **[Harvard managed settings]({{ site.baseurl }}/encyclopedia/get-started/harvard-managed-settings/)**.

---

## What it is

The input is `inputs/lecture-notes.md`: an imagined one-hour undergraduate lecture on late nineteenth-century painting in France (c. 1872–1897), "The Broken Surface." It is plain text — five parts, twelve `SHOW:` markers naming the work the lecturer wants on screen at each beat, plus the lecturer's own interpretive glosses. There are no images, no accession numbers, and no guarantee in the notes that the works are even at Harvard.

The lecture-notes input pattern is worth pausing on. The `SHOW:` marker is a tiny grammar — a single word that the lecturer writes in their flow without breaking voice. It says: *here is the work I want on screen at this moment.* The pipeline does the rest. The lecturer never has to leave their prose to look up a date or paste in an image URL.

The output is `outputs/index.html`: one self-contained web page that keeps the lecturer's prose and glosses, presents each of the twelve works as a captioned plate — correct title, date, medium, accession number, and a link back to its Harvard catalogue record — and closes with a twelve-thumbnail "plate index." Every image streams live from the museum's IIIF service; nothing is downloaded. Inline CSS, no external assets, so it survives being posted to a course site or emailed.

In between sits the Harvard Art Museums MCP server, wired into Claude Code through the repo-root `.mcp.json`. The MCP exposes three tools: `ham_search_objects` (by artist + title), `ham_get_object` (canonical metadata), and `ham_get_image_url` (the exact IIIF URL to embed).

---

## How it was built

One short session, three steps:

1. **Brought in the notes.** The plain-text script, with twelve `SHOW:` markers and no images.

2. **Resolved every `SHOW:` against the real collection.** For each named work, Claude called `ham_search_objects` (by artist + title), confirmed the match with `ham_get_object` — pulling the canonical **title, date, medium, and accession number** and verifying an image existed, correcting the notes where they differed — then `ham_get_image_url` to construct the exact IIIF URL to embed.

3. **Composed one self-contained page.** Claude wrote a single HTML file that preserves the lecturer's text and glosses, sets each work as a captioned plate linked to its catalogue record, and ends with the thumbnail index. Live IIIF images, inline CSS, no external assets.

The whole apparatus is one custom MCP plus one plain instruction. There is no skill and no clever prompt here — the leverage is the tool.

### The thing this example is really about

A general-purpose model can write a fluent art-history lecture from memory — and quietly attribute a painting to the wrong museum, invent an accession number, or get a date wrong by a decade. The MCP changes the epistemics of the task: **every factual claim in the captions is fetched from the institution that owns the object, and every image is the institution's own.** The model still does what it is good at — the prose, the sequencing, the interpretation — while the tool supplies the verifiable facts it would otherwise be tempted to fabricate. That division of labor is the lesson.

The Harvard Art Museums MCP gives Claude something it does not have on its own: a way to *check*. It is the difference between a model that confidently asserts and a model that confidently asserts only what it has confirmed against a source of record.

---

## Notes for adapting

The pattern is: **a body of human writing that references real-world objects, + an MCP that can look those objects up in an authoritative source, → an artifact where the prose is the human's and the facts are sourced.** It transfers to any domain with a queryable collection or API and a free or institutional key.

- **Any museum or archive with an API.** The same shape against a different IIIF/collections endpoint — a literature syllabus illustrated from a manuscripts library (the Beinecke, the Houghton, the Folger), a history lecture from a photo archive (the Library of Congress, the Imperial War Museum), a science unit from a specimen database (iDigBio, GBIF).
- **A reading list illustrated from a library catalogue.** `SHOW:` markers become "find this edition," and the MCP returns correct citations, call numbers, and cover images via the HOLLIS or WorldCat API.
- **A research talk grounded in a dataset or repository.** Notes name results or papers; an arXiv/Zenodo/data-portal MCP confirms the citation, the version, the DOI, the figure.
- **A music history lecture illustrated from a digital sheet-music archive** or recording catalogue — replace IIIF image URLs with audio embeds from the institution's own player.
- **A course site that must stay factually current.** Because the facts live in the tool, not the prose, regenerating the page re-checks every claim against the source of record. This is how a syllabus stays accurate across years without manual fact-checking each fall.

In every case the move is the same as here: let the model write, and let the tool be the thing that cannot be allowed to lie.

### Alignment constraints that survive translation

- **Facts from the tool, never from memory.** No title, date, medium, or accession number that was not confirmed via the lookup tool. Never invent an accession number. If a work can't be found or has no image, say so — don't fabricate.
- **Live images only.** Embed the institution's URLs; never download or cache copies. (Required by most API terms of use.)
- **Self-contained HTML.** Inline `<style>`, no external assets — portability is part of the contract.
- **Keep the lecturer's voice.** The tool corrects facts; it does not rewrite interpretation.
- **One page, overwritten in place** when regenerating.
