// render — turn markdown into styled, width-wrapped terminal rows.
//
// The orchestration layer: sanitize the input, tokenize it into blocks, then walk
// the blocks emitting one styled string per visual row. renderLines() returns the
// array (the natural shape for a TUI that owns its own scrollback); render() joins
// it with newlines.
//
//   renderLines(text, { width = 80, theme }) → string[]
//   render(text, { width = 80, theme })      → string
//
// Styling is applied here and ONLY here, per word, after wrapping has chosen the
// line breaks on raw text — so no ANSI escape ever straddles a wrap boundary.
const { style } = require('bare-tui')
const { sanitize } = require('./sanitize')
const { tokenizeBlocks } = require('./blocks')
const { parseInline } = require('./inline')
const { wrapSpans, wrapWords, spansToWords, wordText } = require('./wrap')
const { merge } = require('./theme')

function renderLines(text, opts = {}) {
  const width = Math.max(1, opts.width || 80)
  const theme = merge(opts.theme)
  return renderBlocks(tokenizeBlocks(sanitize(text)), width, theme)
}

function render(text, opts) {
  return renderLines(text, opts).join('\n')
}

function renderBlocks(blocks, width, theme) {
  const out = []
  for (const b of blocks) out.push(...renderBlock(b, width, theme))
  return out
}

function renderBlock(block, width, theme) {
  switch (block.type) {
    case 'blank':
      return ['']
    case 'hr':
      return [theme.hr(theme.hrChar.repeat(width))]
    case 'heading':
      return renderHeading(block, width, theme)
    case 'paragraph':
      return renderParagraph(block, width, theme)
    case 'list':
      return renderList(block, width, theme)
    case 'code':
      return renderCode(block, theme)
    case 'blockquote':
      return renderQuote(block, width, theme)
    default:
      return []
  }
}

// Headings render their inline text as plain words (markers stripped) and apply
// the level style to the whole row, so no nested reset cuts the heading short.
function renderHeading(block, width, theme) {
  const fn = theme['h' + block.level] || theme.h3
  const rows = wrapWords(spansToWords(parseInline(block.text)), width)
  if (!rows.length) return [fn('')]
  return rows.map((r) => fn(r.map(wordText).join(' ')))
}

function renderParagraph(block, width, theme) {
  const out = []
  for (const seg of block.text.split('\n')) {
    const rows = wrapSpans(parseInline(seg), width)
    if (!rows.length) {
      out.push('')
      continue
    }
    for (const r of rows) out.push(emitRow(r, theme))
  }
  return out
}

function renderList(block, width, theme) {
  const out = []
  block.items.forEach((item, idx) => {
    const marker = block.ordered ? idx + 1 + '. ' : theme.bullet
    const indent = style.width(marker)
    const pad = ' '.repeat(indent)
    const rows = wrapSpans(parseInline(item.text), Math.max(1, width - indent))
    if (!rows.length) {
      out.push(marker)
      return
    }
    rows.forEach((r, ri) => out.push((ri === 0 ? marker : pad) + emitRow(r, theme)))
  })
  return out
}

// Code is never inline-parsed or wrapped — source layout is preserved verbatim,
// styled per line. Over-wide lines are left to overflow (wrapping corrupts code).
function renderCode(block, theme) {
  return block.lines.map((l) => theme.codeBlock(l))
}

function renderQuote(block, width, theme) {
  const barWidth = style.width(theme.quoteChar)
  const bar = theme.quoteBar(theme.quoteChar)
  const inner = renderBlocks(block.children, Math.max(1, width - barWidth), theme)
  return inner.map((line) => bar + line)
}

// Render one wrapped row: style each segment, concatenate the segments within a
// word (no space — they abut), and join words with a single plain space.
function emitRow(words, theme) {
  return words.map((word) => word.map((seg) => styleSeg(seg, theme)).join('')).join(' ')
}

function styleSeg(seg, theme) {
  if (seg.code) return style().foreground(theme.inline.codeFg).render(seg.text)
  let s = style()
  let styled = false
  if (seg.bold) {
    s = s.bold(true)
    styled = true
  }
  if (seg.italic) {
    s = s.italic(true)
    styled = true
  }
  if (seg.link !== null) {
    s = s.underline(true).foreground(theme.inline.linkFg)
    styled = true
  }
  return styled ? s.render(seg.text) : seg.text
}

module.exports = { render, renderLines }
