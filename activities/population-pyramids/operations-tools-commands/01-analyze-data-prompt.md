# Prompt: Analyze Population Data CSVs

Use this prompt first to understand the structure and content of the data in `inputs/` before generating visualizations.

---

## Prompt

I have two CSV files with population data from the UN World Population Prospects 2024:

- `wpp2024_population_country.csv`
- `wpp2024_population_additional.csv`

Please analyze these files and tell me:

1. **Structure** — what columns does each file have? What does each column represent?
2. **Coverage** — which countries and regions are included? What years does the data span?
3. **Age/sex breakdown** — how is the population broken down by age group and sex?
4. **Data quality** — are there any missing values, inconsistencies, or things I should know before visualizing?
5. **Interesting comparisons** — based on the data, which country or regional comparisons would make for the most visually striking or analytically interesting population pyramids? Suggest 4–6 specific comparisons and explain why each is interesting (e.g., rapidly aging population, demographic dividend, population momentum, effects of conflict or emigration).

I want to use this data to build population pyramid visualizations. Your analysis will guide which comparisons I prioritize.
