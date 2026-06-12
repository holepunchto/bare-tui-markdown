// wrap — width-correct wrapping of STYLED text.
//
// The load-bearing rule of this package: never measure or split a string that
// already contains ANSI escapes, or a wrap could fall in the middle of an escape
// and corrupt the terminal. So wrapping happens on RAW words — no escapes — and
// styling is applied only at emit time, once per segment (see render.js). Splits
// land between words, on plain text.
//
// A WORD is a list of styled SEGMENTS with no whitespace between them; words are
// separated by whitespace. Modelling a word as segments (rather than a single
// styled token) keeps adjacency correct across style boundaries — `**a**b` is one
// word "ab", not "a b" — while still letting emphasis change mid-word.
//
//   segment: { text, bold, italic, code, link }   // text has no spaces
//   word:    segment[]
//   spansToWords(spans) → word[]
//   wrapWords(words, width) → word[][]             // greedy rows
//   wrapSpans(spans, width) → word[][]
//
// Width is measured with bare-tui's style.width (ANSI-aware, wide glyphs = two
// cells). A word wider than the available width gets its own row and overflows
// rather than being split mid-grapheme.
const { style } = require('bare-tui')

// Split spans into words, breaking on spaces wherever they fall (inside a span or
// at a span boundary) while gluing segments that abut with no space between them.
function spansToWords(spans) {
  const words = []
  let cur = []
  for (const s of spans) {
    const parts = String(s.text).split(' ')
    for (let j = 0; j < parts.length; j++) {
      if (j > 0 && cur.length) {
        words.push(cur)
        cur = []
      }
      if (parts[j] !== '') {
        cur.push({ text: parts[j], bold: s.bold, italic: s.italic, code: s.code, link: s.link })
      }
    }
  }
  if (cur.length) words.push(cur)
  return words
}

function wordWidth(word) {
  let w = 0
  for (const seg of word) w += style.width(seg.text)
  return w
}

function wordText(word) {
  let t = ''
  for (const seg of word) t += seg.text
  return t
}

function wrapWords(words, width) {
  const avail = Math.max(1, width)
  const rows = []
  let row = []
  let w = 0
  for (const word of words) {
    const ww = wordWidth(word)
    if (row.length && w + 1 + ww > avail) {
      rows.push(row)
      row = []
      w = 0
    }
    row.push(word)
    w += (row.length > 1 ? 1 : 0) + ww
  }
  if (row.length) rows.push(row)
  return rows
}

function wrapSpans(spans, width) {
  return wrapWords(spansToWords(spans), width)
}

module.exports = { wrapSpans, wrapWords, spansToWords, wordWidth, wordText }
