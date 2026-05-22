# Prompt: Rename Recipe Images

Use this prompt first. It asks Claude to look at each image in `inputs/` and suggest descriptive, slug-friendly filenames based on what recipe the image shows.

---

## Prompt

I have a folder of recipe images with unhelpful, auto-generated filenames (e.g., `20130811-164637.jpg`, `oz72fqz9oo321.jpg`). I'm going to share these images with you one at a time (or all at once if you can see them).

For each image, please:

1. **Identify the recipe** — what dish or food item is shown or written on the recipe card?
2. **Suggest a descriptive filename** in kebab-case (lowercase, hyphens, no spaces or special characters), e.g., `three-fruit-marmalade.jpg` or `peanut-butter-fudge.jpg`
3. **Note the image type** — is it a photo of a finished dish, a handwritten recipe card, a printed recipe, an engraved or decorative card?
4. **Flag any images that are unclear** — if you can't confidently identify the recipe, say so and describe what you see

Return your results as a table with columns: `original filename | suggested filename | image type | confidence`.

---

## How to use

1. Share the images from `inputs/` with Claude (drag and drop, or use the file picker in Claude.ai)
2. Claude will return a renaming table
3. Use the suggested names when building the recipe website (see `02-extract-recipes-build-site-prompt.md`)

---

## Note

The images in `inputs/` include both handwritten recipe cards and photos. This variety is intentional — the project demonstrates that Claude can read and interpret diverse visual formats.
