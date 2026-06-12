const test = require('brittle')
const { sanitize } = require('..')

test('sanitize strips ESC/control bytes but keeps newline and tab', (t) => {
  const out = sanitize('a\x1b[0mb\nc\td')
  t.absent(out.includes('\x1b'), 'ESC removed')
  t.ok(out.includes('\n'), 'newline preserved')
  t.ok(out.includes('\t'), 'tab preserved')
  t.is(out, 'a[0mb\nc\td', 'only the ESC byte is dropped; bracket text is inert')
})

test('sanitize coerces null/undefined to empty string', (t) => {
  t.is(sanitize(null), '')
  t.is(sanitize(undefined), '')
})
