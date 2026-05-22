# Claude Workshop Materials

Bok Center AI faculty workshop — reference encyclopedia, activities, and project gallery. Hosted on GitHub Pages via Jekyll.

## Structure

```
activities/          workshop activities and moves (web pages + source)
encyclopedia/        setup guides, glossary, cheatsheets, docs (web pages)
gallery/             project gallery — Becca's interactives + Day 4 projects (web pages + source)
web/                 site infrastructure (not content)
  _data/nav.yml      sidebar navigation data
  _layouts/          Jekyll HTML layout template
  assets/css/        stylesheet
_config.yml          Jekyll config (points layouts and data at web/)
index.md             homepage
```

Content lives in `activities/`, `encyclopedia/`, and `gallery/`. Each section has its own sidebar defined in `web/_data/nav.yml`. Source materials (skills, transcripts, CLAUDE.md files) live alongside the web pages inside each section — in underscore-prefixed subfolders (`_projects/`, `_server/`) so Jekyll skips them but they're browseable on GitHub.

## Local development

```bash
gem install bundler jekyll
bundle exec jekyll serve
```

Site builds to `_site/` (gitignored). GitHub Pages builds and deploys automatically on push to `main`.
