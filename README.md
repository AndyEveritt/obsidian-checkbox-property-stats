# Checkbox Property Stats

An [Obsidian](https://obsidian.md) plugin that keeps a note property up to date with how many checkboxes the note contains, grouped by state.

Whenever a checkbox is added, removed, or toggled, the note's frontmatter is updated:

```markdown
---
checkboxes:
  total: 4
  states:
    todo: 2
    done: 1
    /: 1
---

- [ ] Write the draft
- [ ] Review it
- [x] Pick a topic
- [/] Gather sources
```

Checkboxes at any nesting level are counted. Checkboxes inside code blocks are ignored.

## Behaviour

- Notes that have never had a checkbox are left alone; the property is only added once a note has at least one checkbox.
- When the last checkbox is removed, the total drops to `0`. Turn on **Remove property when empty** to delete the property instead.
- The note is only written to when the stats actually change.

## Settings

- **Property name**: the frontmatter property to write to. Defaults to `checkboxes`.
- **State names**: maps state characters to names, one per line, e.g. `[x] done`. Several characters can share a name (by default `[x]` and `[X]` both count as `done`). Named states always appear in the property, with `0` if unused. Any other state character is used as its own key.
- **Remove property when empty**: see above.

## Commands

- **Update checkbox stats in current note**
- **Update checkbox stats in all notes**: useful after installing the plugin or changing settings, since notes are otherwise only updated when they change.

## Development

```bash
npm install
npm run dev    # watch
npm run build  # production build
npm run lint
npm test       # unit tests
npm run test:e2e
```

### Tests

`npm test` runs unit tests for the counting logic in `src/stats.ts`. They run in CI.

`npm run test:e2e` builds the plugin and tests it inside Obsidian using the [Obsidian CLI](https://obsidian.md/help/cli). It creates notes, edits checkboxes and runs the plugin's commands, then checks the property Obsidian ends up with. Before running it:

1. Turn on **Settings → General → Command line interface** in Obsidian, and make sure `obsidian` is on your `PATH`. Set `OBSIDIAN_CLI` to use a different path.
2. Run `npm run demo` and open `demo-vault` in Obsidian.

The tests refuse to run unless the CLI is connected to the demo vault. They work in a temporary `e2e-tests/` folder, which is deleted afterwards, and reload the plugin at the end to restore its saved settings. The **Update checkbox stats in all notes** test also updates the demo notes, so those may end up with their stats corrected.

### Demo vault

```bash
npm run demo   # create or reset demo-vault/
npm run dev
```

`npm run demo` creates `demo-vault/` (gitignored) from the notes in `scripts/demo-notes/`, with the plugin enabled. The vault's plugin files are symlinks to the repo's `main.js` and `manifest.json`, so open the folder as a vault in Obsidian and reload the plugin after each rebuild. See `Welcome.md` in the vault for things to try.

Run `npm run demo` again to reset the notes. It deletes and recreates everything in the vault except `.obsidian/`, so Obsidian's workspace and the plugin's settings are kept.

To test in another vault, copy `main.js` and `manifest.json` to `<Vault>/.obsidian/plugins/checkbox-property-stats/`, reload Obsidian, and enable the plugin in **Settings → Community plugins**.
