---
layout: default
title: Windows Setup Checklist
section: get-started
---

# Claude Code Setup Checklist — Windows

Open **PowerShell** (`Win+R` → type `powershell` → Enter). Run commands one at a time.

---

### Before you start

<label><input type="checkbox"> Confirm winget works: <code>winget --version</code></label>

*If it errors: search "App Installer" in the Microsoft Store, install it, reopen PowerShell.*

---

### Install core tools

<label><input type="checkbox"> <code>winget install --id Git.Git -e --accept-source-agreements --accept-package-agreements</code></label>

<label><input type="checkbox"> <code>winget install --id OpenJS.NodeJS -e --accept-source-agreements --accept-package-agreements</code></label>

<label><input type="checkbox"> <code>winget install --id Microsoft.VisualStudioCode -e --accept-source-agreements --accept-package-agreements</code></label>

<label><input type="checkbox"> <code>winget install --id Python.Python.3.13 -e --accept-source-agreements --accept-package-agreements</code></label>

<label><input type="checkbox"> Close PowerShell, reopen, then verify each: <code>git --version</code> · <code>node --version</code> · <code>npm --version</code> · <code>python --version</code> · <code>code --version</code></label>

*If `npm` fails: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`, type Y, reopen PowerShell.*  
*If `python` opens the Store: Settings → Apps → App execution aliases → turn off `python.exe`.*

---

### Install Claude Code

<label><input type="checkbox"> <code>irm https://claude.ai/install.ps1 | iex</code></label>

<label><input type="checkbox"> Close PowerShell, reopen, then <code>claude --version</code></label>

<label><input type="checkbox"> <code>claude doctor</code> — no errors</label>

---

### Clone the repo

<label><input type="checkbox"> <code>cd $env:USERPROFILE; mkdir Development; cd Development</code></label>

<label><input type="checkbox"> <code>git clone https://github.com/bok-learning-lab/claude-code-20260519.git</code></label>

---

### Open in VS Code

<label><input type="checkbox"> <code>cd claude-code-20260519; code .</code></label>

<label><input type="checkbox"> "Do you trust the authors?" → **Yes**</label>

---

### Log in to Claude

<label><input type="checkbox"> VS Code: **Terminal → New Terminal** (`` Ctrl+` ``)</label>

<label><input type="checkbox"> <code>claude</code> — follow login prompts, sign in via browser</label>

<label><input type="checkbox"> Test: *"What files are in this project?"*</label>

---

### VS Code extension (optional)

<label><input type="checkbox"> <code>Ctrl+Shift+X</code> → search **Claude Code** → install (publisher: **Anthropic**)</label>

<label><input type="checkbox"> Click the ✱ icon in the Activity Bar → sign in → test a message</label>

<style>
label { display: block; margin: 0.4rem 0; cursor: pointer; }
label input[type="checkbox"] { margin-right: 0.5rem; }
</style>
