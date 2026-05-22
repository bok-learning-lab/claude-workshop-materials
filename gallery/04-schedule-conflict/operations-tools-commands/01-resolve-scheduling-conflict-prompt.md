# Prompt: Resolve a Guest Speaker Scheduling Conflict

Use this prompt after sharing the course schedule and syllabus from `inputs/`. It presents a specific scheduling conflict and asks Claude to suggest solutions.

---

## Context

Provide Claude with both files from `inputs/`:
- `GENED1104_Schedule.md` — the full course schedule
- `GENED1104_Syllabus.md` — the course syllabus (learning goals, course structure, topic sequence)

---

## Prompt

```
I'm teaching GENED 1104: Science and Cooking at Harvard. I've shared the course schedule and syllabus with you.

Here's the problem: Joanne Chang from Flour Bakery is scheduled as a guest lecturer, but she's just let us know she can't make her assigned date. She can only come on the 30th.

Please help me figure out what to do. Specifically:

1. **Identify her current scheduled date** in the course schedule
2. **Check what's on the 30th** — is there already something scheduled that day? If so, what is it?
3. **Propose 2–3 concrete options** for resolving the conflict. For each option, describe:
   - What changes would need to be made to the schedule
   - Any pedagogical trade-offs (e.g., does moving her session disrupt a topic sequence? Is there a thematic connection between her content and what's around the 30th?)
   - How much disruption the change causes to the rest of the schedule

4. **Recommend one option** and explain your reasoning

5. **Draft a revised schedule** reflecting your recommended solution — output it in the same format as the original schedule

Be specific — use actual dates and topic names from the schedule.
```

---

## Output

Save the proposed revised schedule(s) to `outputs/`. You can ask Claude to generate multiple versions (one per option) for comparison.
