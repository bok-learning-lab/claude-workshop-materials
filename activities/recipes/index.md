---
layout: default
title: "Recipes"
section: activities
---

# Recipes

<div class="page-lead">A folder of badly-named image files becomes a structured recipe website in two prompts. The move: give Claude messy inputs and ask it to rename, describe, and reorganize them. This pattern works in almost every field.</div>

## The inputs

The `inputs/` folder holds eight recipe images scraped or photographed without care. The filenames are exactly what a camera or CDN produced:

```
20130811-164637.jpg
27756_Hospitality_12-7e7ff36328884d81b10f6ae04fe9d801.jpg
942x1200xCOL_RSH2017_0003_10-THREE-FRUIT-MARMALADE-1.jpg.pagespeed.ic.FIJUjvHpiB.jpg
iart-blog-handwrittenrecipes-dumplingsrecipecard.jpg
oz72fqz9oo321.jpg
recipe-christmasfruitcookies.jpg
scan0005.jpg
thinkengraved-cutting-board-3-x5-engraved-handwritten-recipe-wood-card-personalized-grandma-s-recipe-card-4x6-or-3x5-recipe-card-41258712924385.webp
```

The images themselves are a mix: a photo of finished dumplings, a handwritten card for peanut butter fudge, a printed marmalade recipe, an engraved cutting board. Claude can read all of them.

**[Browse the inputs folder](https://github.com/bok-learning-lab/claude-code-20260519/tree/main/projects/03_recipes/inputs)**

---

## Step 1 — Rename

Share all the images with Claude and use the prompt in `operations-tools-commands/01-rename-images-prompt.md`. Claude identifies each recipe, suggests a slug-friendly filename (`three-fruit-marmalade.jpg`, `peanut-butter-fudge.jpg`), and flags anything it can't read confidently. It returns a renaming table.

This is the first half of the move: **messy inputs → structured names**. The model is using vision to read the images and language to produce clean identifiers.

---

## Step 2 — Extract and build

With the renamed files, use `operations-tools-commands/02-extract-recipes-build-site-prompt.md`. Claude reads each image again, transcribes the full recipe, fills in any gaps from its training, and generates a self-contained HTML website — one index page with a visual grid, one page per recipe.

This is the second half: **structured names → structured data → rendered output**.

---

## The output

The workshop produced this recipe collection:

| Recipe | Description |
|---|---|
| [Christmas Fruit Cookies](christmas-fruit-cookies.html) | Holiday drop cookie with candied fruit |
| [Dumplings](dumplings.html) | Pan-fried pork and cabbage dumplings |
| [Eagle Brand Ice Cream](eagle-brand-ice-cream.html) | No-churn condensed milk ice cream |
| [French Toast Cupcakes](french-toast-cupcakes.html) | Maple-glazed cupcakes |
| [Peanut Butter Fudge](peanut-butter-fudge.html) | Two-ingredient stovetop fudge |
| [Rhubarb Cookie Squares](rhubarb-cookie-squares.html) | Shortbread base with rhubarb custard |
| [Three-Fruit Marmalade](three-fruit-marmalade.html) | Orange, lemon, grapefruit preserves |
| [Zuppa Pavese](zuppa-pavese.html) | Bread and egg broth soup |

Or browse the full collection: **[Recipe collection index](recipe-collection.html)**

---

## The move

The point of this activity is not recipes. It's the pattern:

**Messy inputs → rename/identify → structured data → rendered output.**

A folder of badly-named images is a stand-in for any pile of unstructured material: student submissions, field notes, archival scans, spreadsheets with inconsistent column names, a shared drive full of PDFs. Claude can look at each item, understand what it is, assign it a clean identifier, extract its content into a consistent schema, and produce a usable output. The two prompts here are reusable templates for any version of that pipeline.

The same instinct that makes you say "use Python to do the math" applies here: ask Claude to *restructure* the data, not just describe it.
