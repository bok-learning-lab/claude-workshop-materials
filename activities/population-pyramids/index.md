---
layout: default
title: "Population Pyramids"
section: activities
---

# Population Pyramids

<div class="page-lead">Feed Claude UN population data. Ask it to do arithmetic. Watch it fail. Then ask it to write code — and watch it succeed. This is the clearest demonstration in the workshop of why tool use matters.</div>

## The activity

**Step 1 — Arithmetic failure.** Open Claude.ai and paste in a few rows from the CSV. Ask it to compute the dependency ratio for Japan in 2024. It will likely get it wrong, or hedge heavily. This is not a bug — it's how LLMs work.

**Step 2 — Code success.** Now switch to Claude Code (or use the Artifacts/tool-use mode in Claude.ai Pro). Give it the CSV file and ask for the same calculation. It will write Python or JavaScript, run it, and produce the correct answer.

**Step 3 — Visualization.** Ask Claude Code to generate a population pyramid for two countries. Sample outputs are linked below.

## Data

The workshop uses UN World Population Prospects 2024 data. Country-level population by five-year age group, both sexes, 1950–2100.

- `inputs/wpp2024_population_country.csv` — main dataset (country-level)
- `inputs/wpp2024_population_additional.csv` — supplementary projections

[View country CSV]({{ site.baseurl }}/activities/02-population-pyramids/inputs/wpp2024_population_country.csv)

## Sample outputs

These were generated during the workshop from the data above:

- [Japan & Nigeria demographics — version 1]({{ site.baseurl }}/activities/02-population-pyramids/outputs/japan_nigeria_demographics_1.html)
- [Japan & Nigeria demographics — version 2]({{ site.baseurl }}/activities/02-population-pyramids/outputs/japan_nigeria_demographics_2.html)

---

## Prompting sequence

```
Here's population data for several countries. 
What is the dependency ratio for Japan in 2024?
```
*(Watch it struggle or hallucinate)*

```
Now write Python code to calculate the dependency 
ratio from this CSV file. Run it and show me the result.
```

```
Generate a population pyramid visualization for Japan and Nigeria, 
side by side, for the year 2024.
```

---

## Why this matters

The failure in step 1 is not a quirk — it's a feature of the architecture. LLMs predict text; they don't compute. The jump to step 2 is the jump to *tool use*: Claude writing and running code to get a reliable answer. This is the mental model shift the workshop is trying to install.
