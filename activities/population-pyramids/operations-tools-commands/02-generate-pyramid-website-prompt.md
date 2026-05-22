# Prompt: Generate Population Pyramid Website

Use this prompt after analyzing the data (see `01-analyze-data-prompt.md`). Provide Claude with the CSV data and ask it to generate a multi-page HTML website with interactive population pyramids.

---

## Prompt

I have population data from `wpp2024_population_country.csv` and `wpp2024_population_additional.csv`. I want you to generate a self-contained, multi-page HTML website that visualizes this data as population pyramids.

### Website requirements

**Structure:**
- An `index.html` landing page with an introduction and links to each country page
- Individual pages for at least: USA, Japan, Germany, France, Italy, UK, Canada (or substitute countries from the data)
- Clean, modern design — dark or light theme, your choice, but consistent across pages

**Each country page should include:**
1. A population pyramid for a recent year (e.g., 2024) showing male/female age distribution
2. A second pyramid or animated comparison showing the same country at a different year (e.g., 1990 vs. 2024) to show demographic change over time
3. A brief interpretive paragraph (2–3 sentences) explaining what the pyramid shape tells us about that country's demographic situation

**Technical requirements:**
- Pure HTML/CSS/JavaScript — no external dependencies or frameworks (so it works offline)
- Population pyramids built with SVG or Canvas, or using a lightweight charting approach
- Data should be embedded directly in the HTML (no separate data files needed)
- Pages should work when opened directly in a browser from the file system

**Design notes:**
- Use horizontal bar charts extending left (male) and right (female) from a central age-group axis
- Age groups should run from youngest (bottom) to oldest (top)
- Include a legend and clear axis labels

Please generate each HTML file separately. Start with `index.html`, then one country at a time.

---

## Reference

See `outputs/` for an example of what the finished website looks like — use it as a reference for the structure and design, but feel free to improve on it.
