---
tags:
  - demo
---

# Checkbox Property Stats demo

This vault is for manually testing the plugin. This note has no checkboxes, so the plugin should never add a property to it.

## Setup

1. Run `npm run demo` in the repo root to create this vault, then `npm run dev` (or `npm run build`). The plugin files in this vault link to the repo's build output.
2. Open the `demo-vault` folder as a vault in Obsidian.
3. If prompted, turn off **Restricted mode** and trust the vault so the plugin loads.

## Things to try

- Open [[Shopping list]], tick a checkbox, and watch the `checkboxes` property update.
- Add and delete checkboxes in [[Project plan]]. It uses custom states (`[/]`, `[-]`) and uppercase `[X]`.
- Check that the checkboxes inside code blocks in [[Edge cases]] aren't counted.
- Open [[Stale stats]] and run **Update checkbox stats in current note** from the command palette. The wrong counts should be corrected.
- Delete every checkbox in [[Shopping list]]. The total should drop to `0`, or the property should be removed if **Remove property when empty** is on.
- Change the state names in **Settings → Checkbox Property Stats**, then run **Update checkbox stats in all notes**.

To reset the notes afterwards, run `npm run demo` again. Any notes you added are deleted; the plugin's settings are kept.
