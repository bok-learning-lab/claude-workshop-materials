---
layout: default
title: Research & Curriculum Synthesis
section: activities
---

# Research & Curriculum Synthesis

Two projects, two directions, the same intellectual terrain. The inputs are institutional, policy, or research-in-progress documents the author already keeps and cites — the Bok Center guidance, Harvard's institutional case for change, the empirical literature on grading; or the markdown notes of an investigation in progress, drafts in folders, AI-generated agent output, primary sources. The outputs face a different audience than student-facing materials: colleagues, deans, department chairs, the public reading along with the work. The bet running through both projects is that the documents you already work with — the guidance you cite, the research notes you keep — should be operable directly. No CMS in the middle, no rewriting into best-practice boilerplate, no copying-and-pasting into a Substack template.

One project goes inward — **synthesis**: pull three layers of source material together (a normative framework, an institutional case, an empirical research base) and apply them as discipline-specific curricular recommendations a department chair or instructor can act on. The discipline that keeps the project honest is that *every recommendation must trace back to a specific source principle and a specific feature of the target* — generic best-practice boilerplate is the failure mode the prompt is structured to defeat. The other goes outward — **publishing**: take a researcher's working folder, put it behind ~150 lines of Next.js code, and let colleagues navigate the research-in-progress without you re-authoring any of it as web content. The markdown files the researcher writes for themselves *are* the published content. The website is the viewer.

## Projects in this category

- **[Research paper site](research-paper-site/)** — about 150 lines of Next.js code that publish a researcher's file tree as a navigable public site. Three routes: a landing page that renders the repo's README plus section cards, a dynamic catch-all `/browse/[...path]` that handles markdown, plain text, PDFs, and arbitrary file types, and a thin serverless byte route for binaries. Drawn from the production site at *Harvest Times*, the public site for an investigation into Anglo-Saxon harvest-time pharmacology. The repo *is* the research; the site is the viewer.
- **[Recentering Academics](recentering-academics/)** — turns three layers of source material (the Bok Center's *Recentering Academics* initiative, Harvard's institutional case for change, external empirical research on grading) into discipline-specific curricular recommendations. Two operations: one for a whole concentration's Fields-of-Concentration profile, one for an individual course syllabus. Demonstrated against Linguistics. Every recommendation traces back to a specific source principle *and* a specific feature of the target.
