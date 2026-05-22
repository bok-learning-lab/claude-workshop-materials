---
layout: default
title: "03 · Recipes"
section: activities
---

# 03 · Recipes

<div class="page-lead">A gentle introduction to multimodal prompting and context sensitivity. Give Claude a photo, a partial recipe, or a list of ingredients — and observe how much it can reconstruct from partial context.</div>

## The activity

Recipes are a good first multimodal exercise because everyone has prior knowledge. You can evaluate Claude's output against what you know a dish should taste like, which is harder to do with, say, code or data.

**Try:** Upload a photo of a finished dish and ask Claude to reverse-engineer the recipe. Then compare it with the actual recipe below.

**Try:** Give Claude a list of ingredients and ask for a recipe — then add a constraint ("it has to be ready in 30 minutes" / "no dairy") and see how it adjusts.

**Try:** Ask Claude to write a recipe in the style of a specific cookbook author. Notice where the style feels accurate and where it blurs.

## The recipes

These are family recipes used in the workshop. Each page shows the finished dish and the recipe — useful for comparing against Claude-generated versions.

| Recipe | Description |
|---|---|
| [Christmas Fruit Cookies]({{ site.baseurl }}/activities/03-recipes/christmas-fruit-cookies.html) | Holiday drop cookie with candied fruit |
| [Dumplings]({{ site.baseurl }}/activities/03-recipes/dumplings.html) | Pan-fried pork and cabbage dumplings |
| [Eagle Brand Ice Cream]({{ site.baseurl }}/activities/03-recipes/eagle-brand-ice-cream.html) | No-churn condensed milk ice cream |
| [French Toast Cupcakes]({{ site.baseurl }}/activities/03-recipes/french-toast-cupcakes.html) | Maple-glazed cupcakes |
| [Peanut Butter Fudge]({{ site.baseurl }}/activities/03-recipes/peanut-butter-fudge.html) | Two-ingredient stovetop fudge |
| [Rhubarb Cookie Squares]({{ site.baseurl }}/activities/03-recipes/rhubarb-cookie-squares.html) | Shortbread base with rhubarb custard |
| [Three-Fruit Marmalade]({{ site.baseurl }}/activities/03-recipes/three-fruit-marmalade.html) | Orange, lemon, grapefruit preserves |
| [Zuppa Pavese]({{ site.baseurl }}/activities/03-recipes/zuppa-pavese.html) | Bread and egg broth soup |

---

## Why recipes?

Recipes sit at an interesting spot in Claude's training distribution — common enough that it has strong priors, specific enough that the details matter. The activity surfaces how Claude fills in gaps (sometimes correctly, sometimes confidently wrong), and how much the quality of your prompt shapes the output.
