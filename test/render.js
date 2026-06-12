const test = require('brittle')
const { style } = require('bare-tui')
const md = require('..')

const strip = style.stripAnsi

test('bold and italic emit ANSI and strip to plain text', (t) => {
  const b = md.render('**hi**')
  t.ok(b.includes('\x1b['), 'bold emits an escape')
  t.is(strip(b), 'hi')

  const i = md.render('*hi*')
  t.ok(i.includes('\x1b['), 'italic emits an escape')
  t.is(strip(i), 'hi')
})

test('inline code suppresses inner markdown', (t) => {
  t.is(strip(md.render('`a**b**c`')), 'a**b**c')
})

test('emphasis abutting punctuation does not gain a stray space', (t) => {
  t.is(strip(md.render('**options**:')), 'options:')
  t.is(strip(md.render('a**b**c')), 'abc')
})

test('no rendered line exceeds the given width', (t) => {
  const text =
    'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod ' +
    'tempor incididunt ut labore et dolore magna aliqua'
  const lines = md.renderLines(text, { width: 40 })
  t.ok(
    lines.every((l) => style.width(l) <= 40),
    'every row fits'
  )
  t.is(strip(lines.join(' ')).replace(/\s+/g, ' ').trim(), text, 'all words preserved')
})

test('injected ANSI in the input is de-fanged', (t) => {
  const out = md.render('a\x1b[31mRED\x1b[0m b')
  t.absent(out.includes('\x1b'), 'no escape survives')
  t.is(strip(out), 'a[31mRED[0m b', 'the bracket text remains as inert characters')
})

test('fenced code passes through unparsed', (t) => {
  const out = md.render('```\n- not a bullet **x**\n```')
  t.ok(strip(out).includes('- not a bullet **x**'), 'no bullet glyph, no bold')
  t.absent(strip(out).includes('•'))
})

test('unordered bullets render with the bullet glyph', (t) => {
  const lines = md.renderLines('- one\n- two')
  t.is(lines.length, 2)
  t.is(strip(lines[0]), '• one')
  t.is(strip(lines[1]), '• two')
})

test('ordered list numbers are regenerated 1..n', (t) => {
  const lines = md.renderLines('1. a\n1. b\n1. c').map(strip)
  t.alike(lines, ['1. a', '2. b', '3. c'])
})

test('list item wraps with a hanging indent', (t) => {
  const lines = md.renderLines('- alpha beta gamma delta', { width: 12 })
  t.ok(
    lines.every((l) => style.width(l) <= 12),
    'rows fit'
  )
  t.is(strip(lines[0]), '• alpha beta')
  t.ok(
    lines.slice(1).every((l) => strip(l).startsWith('  ')),
    'continuation rows align under the text'
  )
})

test('heading is styled, strips to its text, and clamps past level 3', (t) => {
  const h2 = md.render('## Title')
  t.ok(h2.includes('\x1b['))
  t.is(strip(h2), 'Title')
  t.is(strip(md.render('#### Deep')), 'Deep')
})

test('link shows its text only, styled', (t) => {
  const out = md.render('[click](http://example.com)')
  t.is(strip(out), 'click', 'url hidden')
  t.ok(out.includes('\x1b['), 'styled')
})

test('blockquote prefixes every wrapped row', (t) => {
  const lines = md.renderLines('> ' + 'word '.repeat(20).trim(), { width: 20 })
  t.ok(
    lines.every((l) => strip(l).startsWith('│ ')),
    'bar on each row'
  )
  t.ok(lines.every((l) => style.width(l) <= 20))
})

test('soft break joins, blank line separates paragraphs', (t) => {
  t.alike(md.renderLines('a\nb\n\nc').map(strip), ['a b', '', 'c'])
})

test('empty input yields no lines', (t) => {
  t.alike(md.renderLines(''), [])
  t.is(md.render('   '), '')
})

test('horizontal rule fills the width', (t) => {
  const lines = md.renderLines('---', { width: 10 })
  t.is(lines.length, 1)
  t.is(style.width(lines[0]), 10)
  t.is(strip(lines[0]), '──────────')
})

test('theme override changes the bullet, keeps other defaults', (t) => {
  const lines = md.renderLines('- x', { theme: { bullet: '* ' } }).map(strip)
  t.is(lines[0], '* x')
  // inline override merges rather than replacing the whole inline bag
  const code = md.render('`y`', { theme: { inline: { linkFg: 'red' } } })
  t.ok(code.includes('\x1b['), 'code still styled via the retained codeFg default')
})
