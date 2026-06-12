// inline — scan one block's text into styled spans.
//
// A single left-to-right pass (no CommonMark backtracking) that turns a run of
// text into spans the wrapper can style word by word:
//
//   { text, bold, italic, code, link }   // link is a url string, or null
//
// Rules, in precedence order:
//   - a backslash escapes the next markdown punctuation char (\* \_ \` \[ …)
//   - code spans (`…` or ``…``) win and suppress ALL inner parsing
//   - links [text](url): the text is parsed recursively, every span tagged `link`
//   - ** / __ toggle bold; * / _ toggle italic (the 2-char marker is tested first)
//   - `_`/`__` only toggle at a word boundary, so intra_word_underscores stay literal
//
// Unterminated markers degrade rather than throw: a flag simply stays on until
// the end of the string, and a `` ` `` with no closing run is literal text.

function parseInline(raw, base) {
  const text = String(raw ?? '')
  const baseLink = base && base.link !== null ? base.link : null
  const spans = []
  let buf = ''
  let bold = false
  let italic = false

  function flush() {
    if (buf) spans.push({ text: buf, bold, italic, code: false, link: baseLink })
    buf = ''
  }

  let i = 0
  const n = text.length
  while (i < n) {
    const c = text[i]

    // backslash escape of markdown punctuation
    if (c === '\\' && i + 1 < n && '\\`*_[]()'.indexOf(text[i + 1]) !== -1) {
      buf += text[i + 1]
      i += 2
      continue
    }

    // code span — everything between matching backtick runs is literal
    if (c === '`') {
      let ticks = 0
      while (i + ticks < n && text[i + ticks] === '`') ticks++
      const fence = '`'.repeat(ticks)
      const close = text.indexOf(fence, i + ticks)
      if (close !== -1) {
        flush()
        spans.push({ text: text.slice(i + ticks, close), bold, italic, code: true, link: baseLink })
        i = close + ticks
        continue
      }
      buf += fence
      i += ticks
      continue
    }

    // link [text](url) — text parsed recursively, url hidden (styled text only)
    if (c === '[') {
      const m = /^\[([^\]]*)\]\(([^)\s]*)\)/.exec(text.slice(i))
      if (m) {
        flush()
        const url = m[2] || ''
        for (const s of parseInline(m[1], { link: url })) {
          spans.push({
            text: s.text,
            bold: bold || s.bold,
            italic: italic || s.italic,
            code: s.code,
            link: s.link !== null ? s.link : url
          })
        }
        i += m[0].length
        continue
      }
      buf += c
      i++
      continue
    }

    // emphasis markers
    if (c === '*' || c === '_') {
      const double = text[i + 1] === c
      if (c === '_' && !atWordBoundary(text, i, double ? 2 : 1)) {
        buf += c
        i++
        continue
      }
      flush()
      if (double) {
        bold = !bold
        i += 2
      } else {
        italic = !italic
        i += 1
      }
      continue
    }

    buf += c
    i++
  }
  flush()
  return coalesce(spans)
}

function isWord(ch) {
  return ch !== undefined && /[A-Za-z0-9]/.test(ch)
}

// An underscore run opens/closes emphasis only when at least one side is a
// non-word char (or the string edge); surrounded by letters/digits it's literal.
function atWordBoundary(text, i, len) {
  return !isWord(text[i - 1]) || !isWord(text[i + len])
}

// Merge adjacent spans that carry identical styling so the wrapper sees fewer,
// larger spans.
function coalesce(spans) {
  const out = []
  for (const s of spans) {
    if (!s.text) continue
    const last = out[out.length - 1]
    if (
      last &&
      last.bold === s.bold &&
      last.italic === s.italic &&
      last.code === s.code &&
      last.link === s.link
    ) {
      last.text += s.text
    } else {
      out.push({ text: s.text, bold: s.bold, italic: s.italic, code: s.code, link: s.link })
    }
  }
  return out
}

module.exports = { parseInline }
