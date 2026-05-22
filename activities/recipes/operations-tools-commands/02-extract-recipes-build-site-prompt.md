# Prompt: Extract Recipes and Build a Recipe Website

Use this prompt after renaming the images (see `01-rename-images-prompt.md`). It asks Claude to extract full recipe data from the images and generate a complete recipe website.

---

## Step 1 — Extract recipe data from images

Share the recipe images with Claude and use this prompt:

```
I'm sharing a set of recipe images with you — some are photos of handwritten recipe cards, some are printed recipes, and some are photos of finished dishes. For each image:

1. **Transcribe the recipe exactly** as written, including any handwritten notes or unusual spellings
2. **Fill in what's missing** — if the card has a title but no quantities, or instructions but no ingredient list, search the web for a reliable version of this recipe and fill in the gaps. Note clearly what came from the image vs. what you sourced externally
3. **Standardize the format** for each recipe:
   - Recipe name (as a heading)
   - Brief description (1–2 sentences)
   - Yield (servings or quantity)
   - Ingredients (with measurements)
   - Instructions (numbered steps)
   - Notes (any tips, variations, or historical context)
   - Source (image filename + any web sources you consulted)

Return each recipe as structured markdown.
```

---

## Step 2 — Generate the recipe website

Once you have structured recipe data, use this prompt:

```
I have recipe data for [N] recipes. Please generate a self-contained HTML recipe website with:

**Structure:**
- An `index.html` landing page with a visual grid of recipe cards (title, thumbnail image, brief description)
- A separate HTML page for each recipe

**Each recipe page should include:**
- Recipe title and description
- Yield, prep time, cook time (if available)
- Ingredients list
- Numbered instructions
- A photo (link to the source image from inputs/)
- A consistent header/nav to return to the index

**Design:**
- Warm, inviting aesthetic — think a well-designed food blog
- Clean typography, readable font sizes
- Works offline (no external CDN dependencies)
- Consistent styling across all pages via a shared `<style>` block or inline CSS

Generate `index.html` first, then each recipe page. Name each page after the recipe in kebab-case (e.g., `three-fruit-marmalade.html`).
```

---

## Reference

See `outputs/` for an example of a finished recipe website to use as reference or compare against your generated output.
