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
```

To test manually, copy `main.js` and `manifest.json` to `<Vault>/.obsidian/plugins/checkbox-property-stats/`, reload Obsidian, and enable the plugin in **Settings → Community plugins**.
