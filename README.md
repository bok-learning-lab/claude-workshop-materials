# Claude Workshop Materials

Bok Center AI faculty workshop — get started, encyclopedia, activities, and examples. Hosted on GitHub Pages via Jekyll.

## Structure

```
encyclopedia/get-started/  setup guides (Harvard Edu account, Cowork, Claude Code Mac/Windows)
encyclopedia/              glossary, cheatsheets, documentation
activities/                workshop activities and walkthroughs (web pages + source)
gallery/                   example projects grouped into six pattern families (web pages + source)
web/                       site infrastructure (not content)
  _data/nav.yml            sidebar navigation data
  _layouts/                Jekyll HTML layout template
  assets/css/              stylesheet (Learning Lab house style — white/red/Inter)
_config.yml                Jekyll config (points layouts and data at web/)
index.md                   homepage
```

The site has three top-level navigation entries: **Get Started**, **Encyclopedia**, and **Activities & Examples** (which unifies `activities/` and `gallery/` under one sidebar). URLs preserve the underlying folder structure even where the navigation regroups things. Source materials (skills, transcripts, CLAUDE.md files) live alongside the web pages inside each section — in underscore-prefixed subfolders (`_projects/`, `_server/`) so Jekyll skips them but they're browseable on GitHub.

## Local development

```bash
gem install bundler jekyll
bundle exec jekyll serve
```

Site builds to `_site/` (gitignored). GitHub Pages builds and deploys automatically on push to `main`.
