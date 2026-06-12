const test = require('brittle')
const { parseInline } = require('..')

test('bold span carries the bold flag and strips the markers', (t) => {
  const spans = parseInline('a **b** c')
  const bold = spans.find((s) => s.bold)
  t.ok(bold, 'a bold span exists')
  t.is(bold.text, 'b', 'markers removed')
  t.absent(bold.italic, 'not italic')
})

test('italic via single marker', (t) => {
  const spans = parseInline('*hi*')
  t.is(spans.length, 1)
  t.is(spans[0].text, 'hi')
  t.ok(spans[0].italic)
})

test('intra-word underscores are literal', (t) => {
  const spans = parseInline('foo_bar_baz')
  t.is(spans.length, 1)
  t.is(spans[0].text, 'foo_bar_baz')
  t.absent(spans[0].italic, 'underscores inside a word do not toggle italic')
})

test('code span suppresses inner markdown', (t) => {
  const spans = parseInline('`x*y*`')
  t.is(spans.length, 1)
  t.ok(spans[0].code)
  t.is(spans[0].text, 'x*y*', 'asterisks inside code are literal')
})

test('link text is parsed and tagged with the url', (t) => {
  const spans = parseInline('see [the **docs**](http://x)')
  const linked = spans.filter((s) => s.link !== null)
  t.ok(linked.length, 'link spans tagged')
  t.is(linked.map((s) => s.text).join(''), 'the docs', 'link text shown, markers stripped')
  t.ok(
    linked.some((s) => s.bold),
    'inline bold inside the link is preserved'
  )
})

test('unterminated bold degrades without throwing', (t) => {
  const spans = parseInline('**oops')
  t.is(spans.map((s) => s.text).join(''), 'oops')
  t.ok(spans[spans.length - 1].bold, 'tail stays bold')
})
