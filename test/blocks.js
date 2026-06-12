const test = require('brittle')
const { tokenizeBlocks } = require('..')

test('classifies headings, paragraphs, and lists', (t) => {
  const blocks = tokenizeBlocks('# H\n\npara\n\n- a\n- b')
  t.alike(
    blocks.map((b) => b.type),
    ['heading', 'blank', 'paragraph', 'blank', 'list']
  )
  t.is(blocks[0].level, 1)
  t.is(blocks[4].items.length, 2)
  t.absent(blocks[4].ordered)
})

test('soft newline joins, hard break (two spaces) splits', (t) => {
  const [para] = tokenizeBlocks('a\nb')
  t.is(para.text, 'a b', 'single newline is a soft wrap')
  const [hard] = tokenizeBlocks('a  \nb')
  t.is(hard.text, 'a\nb', 'two trailing spaces force a break')
})

test('fenced code is captured verbatim with its lang', (t) => {
  const [code] = tokenizeBlocks('```js\nconst x = 1\n# not a heading\n```')
  t.is(code.type, 'code')
  t.is(code.lang, 'js')
  t.alike(code.lines, ['const x = 1', '# not a heading'])
})

test('--- is a rule, not an empty bullet; headings clamp to 3', (t) => {
  t.is(tokenizeBlocks('---')[0].type, 'hr')
  t.is(tokenizeBlocks('#### deep')[0].level, 3)
})

test('blockquote recurses one level', (t) => {
  const [quote] = tokenizeBlocks('> hello\n> world')
  t.is(quote.type, 'blockquote')
  t.is(quote.children[0].type, 'paragraph')
  t.is(quote.children[0].text, 'hello world')
})

test('leading/trailing/duplicate blanks are collapsed', (t) => {
  const blocks = tokenizeBlocks('\n\na\n\n\nb\n\n')
  t.alike(
    blocks.map((b) => b.type),
    ['paragraph', 'blank', 'paragraph']
  )
})
