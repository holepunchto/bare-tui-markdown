// bare-tui-markdown — a limited markdown → ANSI renderer for bare-tui.
//
// Models (and humans) reply in markdown; a bare-tui transcript shows plain,
// width-wrapped lines. This package bridges the two: it renders a deliberately
// LIMITED subset of markdown — bold, italic, inline code, headings, bullet and
// ordered lists, fenced code blocks, blockquotes, horizontal rules, and links —
// into styled, width-correct terminal rows, and degrades gracefully on anything
// it doesn't model (nested lists, tables, HTML) rather than erroring.
//
//   const md = require('bare-tui-markdown')
//   for (const line of md.renderLines(assistantText, { width: 76 })) {
//     out.push('  ' + line)   // indent into your transcript
//   }
//
// Input is treated as untrusted: it's sanitized of terminal-control bytes before
// parsing, and the renderer emits ANSI ONLY through bare-tui's style().render().
const { render, renderLines } = require('./render')
const { defaultTheme, merge } = require('./theme')
const { tokenizeBlocks } = require('./blocks')
const { parseInline } = require('./inline')
const { wrapSpans, wrapWords, spansToWords, wordText } = require('./wrap')
const { sanitize } = require('./sanitize')

module.exports = {
  // Primary API
  render, // render(text, { width, theme }) → string
  renderLines, // renderLines(text, { width, theme }) → string[]  (one row per line)
  defaultTheme, // the theme object, to spread/extend
  mergeTheme: merge, // mergeTheme(partial) → a full theme over the defaults

  // Lower-level pieces, exposed for testing and advanced reuse
  tokenizeBlocks, // (text) → Block[]
  parseInline, // (rawText) → Span[]
  wrapSpans, // (spans, width) → word[][]  (word = styled segment[])
  wrapWords, // (words, width) → word[][]
  spansToWords, // (spans) → word[]
  wordText, // (word) → string  (concatenated segment text)
  sanitize // (text) → text  (the input cleaner)
}
