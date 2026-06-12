const test = require('brittle')
const md = require('..')

test('mergeTheme overlays a partial onto the defaults', (t) => {
  const merged = md.mergeTheme({ bullet: '> ' })
  t.is(merged.bullet, '> ', 'override applied')
  t.is(merged.hrChar, md.defaultTheme.hrChar, 'untouched key kept')
  t.is(typeof merged.h1, 'function', 'block styles retained')
})

test('mergeTheme deep-merges the inline bag', (t) => {
  const merged = md.mergeTheme({ inline: { codeFg: 'magenta' } })
  t.is(merged.inline.codeFg, 'magenta', 'override applied')
  t.is(merged.inline.linkFg, md.defaultTheme.inline.linkFg, 'sibling inline key kept')
})

test('mergeTheme with nothing returns a fresh default copy', (t) => {
  const merged = md.mergeTheme()
  t.is(merged.bullet, md.defaultTheme.bullet)
  t.not(merged.inline, md.defaultTheme.inline, 'inline is a copy, not the same ref')
})
