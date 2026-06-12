const test = require('brittle')

require('./sanitize')
require('./inline')
require('./blocks')
require('./wrap')
require('./render')
require('./theme')

test('works', (t) => {
  t.pass()
})
