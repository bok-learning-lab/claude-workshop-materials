---
layout: default
title: Windows Setup (Claude Code)
section: encyclopedia
---

# Claude Code Setup (Windows)

This guide takes a fresh Windows machine to a working Claude Code environment with the
workshop repo cloned and open in VS Code. Run everything in **PowerShell** (your prompt
should start with `PS`). You do **not** need to run as Administrator.

Estimated time: 15–25 minutes, mostly waiting on downloads.

> **Tip:** Open **VS Code** from the Start menu (`Win` → type "VS Code"). Open **PowerShell** with `Win + R` → type `powershell` → `Enter`.

---

## Before you start

- You need a **paid Claude account** (Pro, Max, Team, or Enterprise). The free plan does
  not include Claude Code.
- `winget` is built into Windows 11 and modern Windows 10. Confirm it works:
  ```powershell
  winget --version
  ```
  If that errors, install "App Installer" from the Microsoft Store, then reopen PowerShell.

  An example of an error caused by `winget` not being installed:

  ![winget error](https://files.slack.com/files-pri/T0HTW3H0V-F0B4LMNJ399/image.png?pub_secret=44e5c54983)

  If you get the error above, it is also possible that the app is installed but may not be in your **PATH**. Open your PowerShell and run this:

  ```powershell
  [Environment]::SetEnvironmentVariable("PATH", $env:PATH + ";$env:LOCALAPPDATA\Microsoft\WindowsApps", "User")
  ```

  Then **restart PowerShell** and try again:

  ```powershell
  winget --version
  ```

  ![winget version success](https://files.slack.com/files-pri/T0HTW3H0V-F0B5MJ5EHL0/image.png?pub_secret=3048b491fc)

---

## Step 1 — Install the core tools with winget

Run these four commands one at a time. Each downloads and installs silently.

```powershell
winget install --id Git.Git -e --accept-source-agreements --accept-package-agreements
```

```powershell
winget install --id OpenJS.NodeJS -e --accept-source-agreements --accept-package-agreements
```

```powershell
winget install --id Microsoft.VisualStudioCode -e --accept-source-agreements --accept-package-agreements
```

```powershell
winget install --id Python.Python.3.13 -e --accept-source-agreements --accept-package-agreements
```

Examples of successful installation in PowerShell:

![successful install 1](https://files.slack.com/files-pri/T0HTW3H0V-F0B4TBQCEAE/image.png?pub_secret=093ae5c1fc)

![successful install 2](https://files.slack.com/files-pri/T0HTW3H0V-F0B4M21H6QK/image.png?pub_secret=3f7f8cdc09)

Notes:
- `-e` forces an exact match on the package ID so you get the right package.
- If winget says a package is **already installed**, that's fine — skip it.
- If it asks you to accept source agreements, type `Y`.
- The Git installer's defaults are correct for this workshop — in particular it adds Git to your PATH, which Claude Code needs.

When all four finish, **close PowerShell completely and open a fresh window.** This is required — installers update your PATH, and an already-open terminal won't see the change.

---

## Step 2 — Verify the core tools

In the new PowerShell window, check the status of your installs by running each of these commands one at a time:

```powershell
git --version
```
```powershell
node --version
```
```powershell
npm --version
```
```powershell
python --version
```
```powershell
code --version
```

![version check success](https://files.slack.com/files-pri/T0HTW3H0V-F0B4TE0AEV8/image.png?pub_secret=aec21900bb)

You should get a version number from each. Three common snags:

- **`npm --version` errors with "running scripts is disabled on this system":** PowerShell's default execution policy blocks `npm` (which is a PowerShell script on Windows). Fix it from your normal PowerShell window:

  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```

  Type `Y` when prompted. Close and reopen PowerShell, then re-run `npm --version`.

- **`python --version` opens the Microsoft Store or says "Python was not found":** the Windows Store stub is shadowing your real Python install. Fix it by going to **Settings → Apps → Advanced app settings → App execution aliases** and turning **off** the toggles for `python.exe` and `python3.exe`, then reopening PowerShell.

  ![app execution aliases](https://files.slack.com/files-pri/T0HTW3H0V-F0B5MP73CDN/image.png?pub_secret=c4aa1769f7)
  ![python toggle off](https://files.slack.com/files-pri/T0HTW3H0V-F0B4X3QRZ0C/image.png?pub_secret=ffe285bc2e)

- **`code --version` errors with "not recognized":** VS Code's CLI shim isn't on your PATH yet. Close and reopen PowerShell. If it still fails, open VS Code manually, press `Ctrl+Shift+P`, and run **"Shell Command: Install 'code' command in PATH"**, then reopen PowerShell again.

---

## Step 3 — Install the Claude Code CLI

Run the official native installer in PowerShell:

```powershell
irm https://claude.ai/install.ps1 | iex
```

When it finishes, **close PowerShell and open a fresh window**, then check:

```powershell
claude --version
```

![claude version](https://files.slack.com/files-pri/T0HTW3H0V-F0B4RES08SJ/image.png?pub_secret=53fca27515)

### If you get "claude is not recognized"

This is a known issue — the installer sometimes doesn't add its folder to your PATH. Fix it with:

```powershell
$new = "$env:USERPROFILE\.local\bin"
$current = [Environment]::GetEnvironmentVariable("Path", "User")
[Environment]::SetEnvironmentVariable("Path", "$current;$new", "User")
```

Then **fully close every PowerShell window**, open a new one, and try `claude --version` again. Once it works, run a quick health check:

```powershell
claude doctor
```

![claude doctor](https://files.slack.com/files-pri/T0HTW3H0V-F0B4X5K217W/image.png?pub_secret=72fee9eb0f)

---

## Step 4 — Create the workspace folder and clone the repo

```powershell
cd $env:USERPROFILE
mkdir Development
cd Development
git clone https://github.com/bok-learning-lab/claude-code-20260519.git
```

The repo is public, so cloning needs no login. It clones into a subfolder named `claude-code-20260519`.

> **Tip:** To use a specific folder, open it in File Explorer, right-click → **"Copy as path"**, then in PowerShell type `cd` followed by the copied path and press `Enter`.

![git clone](https://files.slack.com/files-pri/T0HTW3H0V-F0B4C5KGB47/image.png?pub_secret=4f4ad17e2b)

---

## Step 5 — Open the project in VS Code

```powershell
cd claude-code-20260519
code .
```

![code .](https://files.slack.com/files-pri/T0HTW3H0V-F0B4TKY615Y/image.png?pub_secret=92f386d600)

> **Alternatively:** Open VS Code, go to **File → Open Folder**, and navigate to the folder you want to work on.

VS Code opens with the project loaded. If it asks **"Do you trust the authors of the files in this folder?"**, choose **Yes, I trust the authors**.

---

## Step 6 — Log in to Claude in the integrated terminal

1. In VS Code, open the integrated terminal: **Terminal → New Terminal** (or `` Ctrl+` ``).

   ![new terminal](https://files.slack.com/files-pri/T0HTW3H0V-F0B4VGECD9P/image.png?pub_secret=5b31c14413)

2. Confirm you're at the project root — the prompt should end in `...\claude-code-20260519`.

   ![project root](https://files.slack.com/files-pri/T0HTW3H0V-F0B4XA6ATL4/image.png?pub_secret=f23f6ddaf1)

3. Start Claude Code:
   ```powershell
   claude
   ```

   ![starting claude](https://files.slack.com/files-pri/T0HTW3H0V-F0B4C8M2MGF/image.png?pub_secret=bfbe2f2e08)

4. On first run it walks you through login. Choose your account option and a browser window opens for sign-in. Log in with your paid Claude account and approve the request.

5. Back in the terminal, Claude Code is ready. Type a message to confirm it responds, e.g. *"What files are in this project?"*

   ![claude responding](https://files.slack.com/files-pri/T0HTW3H0V-F0B4MBLRFRR/image.png?pub_secret=c55afd35a0)

To exit Claude Code, type `/exit` or press `Ctrl+C` twice.

![exit](https://files.slack.com/files-pri/T0HTW3H0V-F0B4VJ4LW73/image.png?pub_secret=837030ca1c)

---

## Step 7 — (Optional) Add the Claude Code side panel in VS Code

If you'd rather work with Claude in a dedicated chat panel inside VS Code — with inline diffs, a sessions list, and `@`-mention file picking — install the official extension.

1. Open the **Extensions** view: click the puzzle-piece icon in the Activity Bar, or press `Ctrl+Shift+X`.

   ![extensions panel](https://files.slack.com/files-pri/T0HTW3H0V-F0B4UFXUW7L/screenrecording2026-05-19at11.40.12am-ezgif.com-video-to-gif-converter.gif?pub_secret=46fbad2613)

2. Search for **Claude Code**. Install the one published by **Anthropic** — check the publisher, since there are similarly-named imitations.

3. After it installs, click the **spark icon** (✱) in the Activity Bar to open the Claude Code panel. If you don't see the icon, open the Command Palette (`Ctrl+Shift+P`), type **Claude Code**, and pick **"Claude Code: Open in Sidebar"**.

   ![claude sidebar](https://files.slack.com/files-pri/T0HTW3H0V-F0B4UGPE0LA/screenrecording2026-05-19at11.40.54am-ezgif.com-video-to-gif-converter.gif?pub_secret=3bdbbcbfd0)

4. Sign in when prompted — same flow as Step 6, but through the panel.

Notes:
- **Pin the panel:** in VS Code settings (`Ctrl+,`), search for `claudeCode.preferredLocation` and set it to **sidebar**.
- **CLI and extension don't always share credentials.** If the panel shows a sign-in screen even after Step 6, just sign in once more from the panel.
- **Requires VS Code 1.98 or higher.** If you installed via winget in Step 1, you're already current.
- **Open files with `@`:** in the prompt box, type `@` to fuzzy-search files in your project.

---

## Quick reference

| Goal | Command |
|------|---------|
| Check a tool is installed | `git --version`, `node --version`, etc. |
| See where a command lives | `Get-Command claude` |
| Claude Code health check | `claude doctor` |
| Start Claude Code | `claude` (from the project folder) |
| Exit Claude Code | `/exit` |
| Open Claude Code panel | Click ✱ in Activity Bar, or `Ctrl+Shift+P` → "Claude Code" |

---

## Troubleshooting

- **A command "is not recognized" right after installing it** — almost always a stale PATH. Close every terminal window and open a fresh one.
- **`claude` still not found after the PATH fix** — confirm the binary exists with `Test-Path "$env:USERPROFILE\.local\bin\claude.exe"`. If `True`, you have a stale terminal; if `False`, re-run the Step 3 installer.
- **Browser login gets stuck in a loop** — try a different browser, or temporarily relax strict tracker/cookie blocking.
- **Claude Code panel disappears after restarting VS Code** — set `claudeCode.preferredLocation` to `sidebar` in VS Code settings (`Ctrl+,`).
- **Spark icon missing from the Activity Bar** — confirm the extension is published by **Anthropic**, then reload the window from the Command Palette: **Developer: Reload Window**.
