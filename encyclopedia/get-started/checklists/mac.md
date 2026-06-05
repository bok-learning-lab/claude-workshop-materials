---
layout: default
title: Mac Setup Checklist
section: get-started
---

# Claude Code Setup Checklist — macOS

Open **Terminal** (`Cmd+Space` → "Terminal"). Run commands one at a time.

---

### Before you start

<label><input type="checkbox"> Run <code>brew --version</code> — if it errors, install Homebrew from the <a href="{{ site.baseurl }}/encyclopedia/get-started/claude-code-mac-setup/">full guide</a>, then reopen Terminal</label>

---

### Install core tools

<label><input type="checkbox"> <code>brew install git</code></label>

<label><input type="checkbox"> <code>brew install node</code></label>

<label><input type="checkbox"> <code>brew install --cask visual-studio-code</code></label>

<label><input type="checkbox"> <code>brew install python@3.13</code></label>

<label><input type="checkbox"> Close Terminal (<code>Cmd+Q</code>), reopen, then verify each: <code>git --version</code> · <code>node --version</code> · <code>npm --version</code> · <code>python3 --version</code> · <code>code --version</code></label>

*If `code` fails: VS Code → `Cmd+Shift+P` → "Shell Command: Install 'code' command in PATH," reopen Terminal.*

---

### Install Claude Code

<label><input type="checkbox"> <code>curl -fsSL https://claude.ai/install.sh | bash</code></label>

<label><input type="checkbox"> Close Terminal (<code>Cmd+Q</code>), reopen, then <code>claude --version</code></label>

<label><input type="checkbox"> <code>claude doctor</code> — no errors</label>

---

### Clone the repo

<label><input type="checkbox"> <code>cd ~ && mkdir Development && cd Development</code></label>

<label><input type="checkbox"> <code>git clone https://github.com/bok-learning-lab/claude-code-20260519.git</code></label>

---

### Open in VS Code

<label><input type="checkbox"> <code>cd claude-code-20260519 && code .</code></label>

<label><input type="checkbox"> "Do you trust the authors?" → **Yes**</label>

---

### Log in to Claude

<label><input type="checkbox"> VS Code: **Terminal → New Terminal** (`` Ctrl+` ``)</label>

<label><input type="checkbox"> <code>claude</code> — follow login prompts, sign in via browser</label>

<label><input type="checkbox"> Test: *"What files are in this project?"*</label>

---

### VS Code extension (optional)

<label><input type="checkbox"> <code>Cmd+Shift+X</code> → search **Claude Code** → install (publisher: **Anthropic**)</label>

<label><input type="checkbox"> Click the ✱ icon in the Activity Bar → sign in → test a message</label>

<style>
label { display: block; margin: 0.4rem 0; cursor: pointer; }
label input[type="checkbox"] { margin-right: 0.5rem; }
</style>
