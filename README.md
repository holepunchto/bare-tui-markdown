# bare-tui-markdown

A limited markdown → ANSI renderer for [bare-tui](../bare-tui).

> [!NOTE]
> This is an experimental library. A version 1.0.0 release will signal stability.

Models (and humans) reply in markdown; a bare-tui transcript shows plain, width-wrapped lines. This package bridges the two — it renders a **deliberately limited** subset of markdown into styled, width-correct terminal rows, and degrades gracefully on anything it doesn't model rather than erroring. It builds entirely on bare-tui's `style` (the only source of ANSI, and the ANSI-aware width measurement that word-wrap needs).

```js
const md = require('bare-tui-markdown')

const lines = md.renderLines('Run **keet** with:\n\n- `--mode terminal`\n- `--dev`', { width: 60 })
for (const line of lines) console.log('  ' + line) // indent into your own transcript
```

## What it supports

bold (`**` / `__`), italic (`*` / `_`), inline code (`` ` ``), headings (`#`–`###`), unordered and ordered lists, fenced code blocks (` ``` `), blockquotes (`>`), horizontal rules (`---`), and links `[text](url)` (rendered as styled text, url hidden). Paragraphs reflow to the given width — a single newline is a soft wrap, a blank line separates paragraphs, two trailing spaces force a hard break.

Out of scope (rendered as plain/flat text): nested lists, tables, images, reference-style links, HTML, task lists.

## API

```js
md.render(text, { width = 80, theme })      // → string  (lines joined with '\n')
md.renderLines(text, { width = 80, theme }) // → string[]  (one styled row per line) — primary
md.defaultTheme                              // the theme, to spread/extend
md.mergeTheme(partial)                       // → a full theme over the defaults
```

`renderLines` is the primary entry for a TUI that owns its own scrollback (it indents each row itself). `width` is the content width you have available; the renderer never returns a row wider than it (except an unbreakable word or a code line, which overflow rather than split).

### Theme

A small bag of block style functions, inline colour attributes the renderer composes per word, and literal markers — shallow-merged over the defaults:

```js
md.render(text, { theme: { bullet: '* ', inline: { codeFg: 'magenta' } } })
```

## Security

Input is treated as untrusted (it's often LLM- or peer-authored). It's `sanitize`d of terminal-control bytes — every C0/C1/DEL byte except newline and tab, so a raw `ESC`/`CSI` can never reach the terminal — before parsing, and the renderer emits ANSI **only** through `style().render()`. A `\x1b[31m`-style payload in the input is stripped to inert text.

## License

Apache-2.0
