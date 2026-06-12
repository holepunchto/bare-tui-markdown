// theme — how rendered markdown is styled.
//
// A small bag of block-level style functions (string → string), a couple of
// inline colour attributes the wrapper composes per word, and a few literal
// markers. Pass a partial theme to render({ theme }) and it's shallow-merged over
// these defaults (the nested `inline` object is merged too), so you override only
// what you care about:
//
//   render(text, { theme: { bullet: '* ', inline: { codeFg: 'magenta' } } })
//
// Inline emphasis (bold/italic/link/code) is composed per word from the flag set
// rather than via single-purpose functions, so combinations like ***bold italic***
// or a bold word inside a link render correctly — see render.styleWord.
const { style } = require('bare-tui')

const defaultTheme = {
  // block styles
  h1: (s) => style().bold(true).underline(true).foreground('#5BC8FF').render(s),
  h2: (s) => style().bold(true).foreground('#7AA2F7').render(s),
  h3: (s) => style().bold(true).render(s),
  codeBlock: (s) => style().faint(true).render(s), // applied per source line
  quoteBar: (s) => style().faint(true).render(s),
  hr: (s) => style().faint(true).render(s),

  // inline colour attributes (the wrapper builds the style() chain per word)
  inline: {
    codeFg: '#E5C07B',
    linkFg: '#5BC8FF'
  },

  // literal markers
  bullet: '• ', // replaces -, *, + (width 2)
  hrChar: '─', // repeated to fill the width
  quoteChar: '│ ' // prefixes every wrapped row inside a blockquote
}

// Shallow-merge a partial theme over the defaults, merging the nested `inline`
// object so a caller can override one colour without dropping the others.
function merge(theme) {
  if (!theme) return { ...defaultTheme, inline: { ...defaultTheme.inline } }
  return {
    ...defaultTheme,
    ...theme,
    inline: { ...defaultTheme.inline, ...(theme.inline || {}) }
  }
}

module.exports = { defaultTheme, merge }
