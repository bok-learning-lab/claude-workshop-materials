# G7 Demographics

Seven interactive country profiles — the full G7 — drawn from the UN *World Population Prospects 2024* revision: United States, United Kingdom, Canada, France, Germany, Italy, and Japan.

Each page shows population trends from 1950 through 2100, an animated age pyramid, fertility, mortality, and life expectancy — all rendered client-side with Chart.js.

## Live site

Once GitHub Pages is enabled, the site will be at `https://<your-username>.github.io/githubpages-test/`.

## Files

- `index.html` — landing page linking to all seven country profiles
- `usa.html`, `uk.html`, `canada.html`, `france.html`, `germany.html`, `italy.html`, `japan.html` — country pages
- `data/*.json` — per-country demographic data, also inlined into each HTML page so no fetch is needed
- `build_pages.py` — regenerates the HTML from `data/*.json`

The raw UN CSVs (`wpp2024_*.csv`) are gitignored. They were used once to produce `data/*.json` and aren't needed to deploy or rebuild the site.

## Data source

United Nations, Department of Economic and Social Affairs, Population Division (2024). *World Population Prospects 2024*. Values after 2024 are medium-variant projections.
