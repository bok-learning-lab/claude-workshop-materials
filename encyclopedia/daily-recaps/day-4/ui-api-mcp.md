# UI, API, MCP

*Three ways into any digital service — and why the third one matters.*

Every digital service you use — Google Drive, Zotero, Canvas, your library catalog — can be reached in three ways. Two have existed for decades. The third is new, and it's the reason tools like Claude Code are different in kind, not just degree.

## UI — the user interface

The door you already know: the website, the app, the search box. A UI is built for a human, working by hand, one action at a time. It's legible and friendly, and it's also a bottleneck — it moves at the speed of your clicking, and it only does what its designers imagined you'd want to do.

## API — the application programming interface

Behind every UI sits an API: the same data and services, raw and in bulk, meant for *programs* rather than people. The catalog you search one title at a time will hand a program ten thousand records in a minute through its API. APIs are where all the real power has always been — but they've been gated. Using one meant writing code, running it somewhere, handling authentication and errors. The power was there; the price of entry was becoming a developer.

## MCP — the Model Context Protocol

MCP is a standard adapter that plugs an API into an AI agent. An MCP server for Zotero, arXiv, Google Drive, or Slack lets Claude Code use that service's API *for you*: you describe what you want in plain language, and the agent makes the calls. And because Claude Code can also write code, an MCP server that doesn't exist yet is often an afternoon's request away.

## Why this is a big deal: the Costco move

Think of UIs as retail and APIs as the warehouse behind the store. The warehouse always had better prices and bulk quantities — but its doors were marked *for the trade*. Wholesale meant *for resale*: to get warehouse access, you had to be a business.

Costco's invention was severing that link. A regular household could walk the warehouse and take home the industrial pallet — not to open a shop, just to use it.

MCP is the Costco move for software. It walks you through the API doors without requiring you to become a developer first. The tools you build there only have to work for *you*, once, today — no documentation, no maintenance, no users to answer to. Bulk capability, personal ends.

## What it changes

Everything *upstream* of your judgment: gathering, sorting, cross-referencing, processing at scales that used to require a team or a grant. What it doesn't change is the judgment itself — knowing which question to ask and what's worth keeping. The warehouse is open to everyone now. The scarce skill is knowing what you came for.
