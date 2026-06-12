const test = require('brittle')
const { wrapWords, wrapSpans, spansToWords, wordText } = require('..')

const word = (text) => [{ text }] // a one-segment plain word

test('greedy packing breaks at the width boundary', (t) => {
  const rows = wrapWords([word('aa'), word('bb'), word('cc')], 5)
  t.is(rows.length, 2, 'aa bb | cc')
  t.alike(
    rows.map((r) => r.map(wordText).join(' ')),
    ['aa bb', 'cc']
  )
})

test('an over-long word gets its own row and overflows', (t) => {
  const rows = wrapWords([word('tiny'), word('enormouslylongword')], 6)
  t.is(rows.length, 2)
  t.is(wordText(rows[1][0]), 'enormouslylongword')
})

test('wrapSpans splits spans into styled words', (t) => {
  const rows = wrapSpans([{ text: 'a b', bold: true, italic: false, code: false, link: null }], 80)
  t.is(rows.length, 1)
  t.is(rows[0].length, 2, 'two words')
  t.ok(
    rows[0].every((w) => w[0].bold),
    'flags carried onto each segment'
  )
})

test('segments that abut with no space glue into one word', (t) => {
  // "options" (bold) immediately followed by ":" (plain) — one word, two segments
  const spans = [
    { text: 'options', bold: true, italic: false, code: false, link: null },
    { text: ':', bold: false, italic: false, code: false, link: null }
  ]
  const words = spansToWords(spans)
  t.is(words.length, 1, 'one word')
  t.is(words[0].length, 2, 'two segments')
  t.is(wordText(words[0]), 'options:')
})
