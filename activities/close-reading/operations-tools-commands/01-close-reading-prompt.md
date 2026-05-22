# Prompt: Generate a Technical Close Reading

Use this prompt with Claude after providing the text of a Shakespeare play or passage from the `inputs/shakespeare-complete-works/` folder.

---

## Prompt

I'm providing you with the text of [PLAY TITLE], specifically [ACT/SCENE or PASSAGE]. Please write a rigorous academic close reading of this passage.

Your close reading should:

1. **Attend to language at the level of the word and line** — analyze diction, word choice, and any significant ambiguities or puns.
2. **Analyze prosody** — identify the metrical scheme (e.g., iambic pentameter), note any deviations (trochaic inversions, feminine endings, caesuras), and explain their effect.
3. **Identify and interpret literary devices** — including but not limited to: metaphor, simile, imagery, personification, apostrophe, synecdoche, irony, chiasmus, anaphora, and alliteration.
4. **Address structure and syntax** — how are sentences shaped? What does enjambment or end-stopping do? How does the passage's internal structure reinforce or complicate its meaning?
5. **Situate the passage historically and dramatically** — where does it fall in the play? What does it reveal about character, theme, or dramatic situation? What would an early modern audience have recognized here that we might miss?
6. **Make an argument** — don't just catalog devices. Build toward a claim about what this passage *does* and what it means in the larger context of the work.

Aim for the tone and depth of a graduate seminar paper. Cite specific lines using act.scene.line notation.

---

## How to use

1. Open a play file from `inputs/shakespeare-complete-works/` — for example, `hamlet/` or `macbeth/`.
2. Copy the passage you want to analyze.
3. Paste the passage into your conversation with Claude, followed by this prompt.
4. The output should go into `outputs/close-reading-output.md`.
