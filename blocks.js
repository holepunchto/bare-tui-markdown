// blocks — split sanitized markdown into block tokens.
//
// A top-to-bottom line walk; each line is classified against the rules below in
// order (first match wins) and folded into a block. Block shapes:
//
//   { type: 'heading', level: 1..3, text }     // text is raw inline, parsed later
//   { type: 'paragraph', text }                // soft breaks → ' ', hard → '\n'
//   { type: 'list', ordered, items: [{ text }] }
//   { type: 'code', lang, lines }              // RAW, never inline-parsed
//   { type: 'blockquote', children: Block[] }  // recursed one level
//   { type: 'hr' }
//   { type: 'blank' }                          // a paragraph separator
//
// Deliberately limited: nested lists are flattened to one level, and a single
// newline inside a paragraph is a soft wrap (joined with a space) — markdown's
// own rule and the one that reflows cleanly to the terminal's real width. A line
// ending in two or more spaces is a hard break (a real newline, same paragraph).

function tokenizeBlocks(text) {
  const lines = String(text ?? '').split('\n')
  const blocks = []
  let para = null // [{ text, hard }]
  let list = null // { type:'list', ordered, items }
  let i = 0

  function flushPara() {
    if (para) {
      blocks.push({ type: 'paragraph', text: joinPara(para) })
      para = null
    }
  }
  function flushList() {
    if (list) {
      blocks.push(list)
      list = null
    }
  }
  function flushAll() {
    flushPara()
    flushList()
  }

  while (i < lines.length) {
    const line = lines[i]

    // fenced code — consume verbatim to a closing fence (or EOF)
    const fence = /^ {0,3}(`{3,}|~{3,})\s*([^\s`]*)\s*$/.exec(line)
    if (fence) {
      flushAll()
      const ch = fence[1][0]
      const len = fence[1].length
      const close = new RegExp('^ {0,3}\\' + ch + '{' + len + ',}\\s*$')
      const body = []
      i++
      while (i < lines.length && !close.test(lines[i])) body.push(lines[i++])
      if (i < lines.length) i++ // swallow the closing fence
      blocks.push({ type: 'code', lang: fence[2] || '', lines: body })
      continue
    }

    // horizontal rule — before lists so `---` / `***` is a rule, not a bullet
    if (/^ {0,3}([-*_])(\s*\1){2,}\s*$/.test(line)) {
      flushAll()
      blocks.push({ type: 'hr' })
      i++
      continue
    }

    // ATX heading (clamped to 3 levels)
    const h = /^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line)
    if (h) {
      flushAll()
      blocks.push({ type: 'heading', level: Math.min(3, h[1].length), text: h[2] })
      i++
      continue
    }

    // blockquote — accumulate consecutive `>` lines, recurse one level
    if (/^ {0,3}>\s?/.test(line)) {
      flushAll()
      const buf = []
      while (i < lines.length && /^ {0,3}>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^ {0,3}>\s?/, ''))
        i++
      }
      blocks.push({ type: 'blockquote', children: tokenizeBlocks(buf.join('\n')) })
      continue
    }

    // ordered list item (numbers are regenerated at render time)
    const ol = /^\s*\d{1,9}[.)]\s+(.*)$/.exec(line)
    if (ol) {
      flushPara()
      if (!list || !list.ordered) {
        flushList()
        list = { type: 'list', ordered: true, items: [] }
      }
      list.items.push({ text: ol[1] })
      i++
      continue
    }

    // unordered list item (the space after the marker is required)
    const ul = /^\s*[-*+]\s+(.*)$/.exec(line)
    if (ul) {
      flushPara()
      if (!list || list.ordered) {
        flushList()
        list = { type: 'list', ordered: false, items: [] }
      }
      list.items.push({ text: ul[1] })
      i++
      continue
    }

    // blank — a paragraph/list boundary
    if (/^\s*$/.test(line)) {
      flushAll()
      blocks.push({ type: 'blank' })
      i++
      continue
    }

    // paragraph text (also ends any open list)
    flushList()
    if (!para) para = []
    para.push({ text: line.trim(), hard: /  +$/.test(line) })
    i++
  }

  flushAll()
  return collapseBlanks(blocks)
}

// Join a paragraph's lines: a hard-broken line keeps its newline, the rest are
// soft-wrapped into one reflowable run.
function joinPara(segs) {
  let out = ''
  for (let k = 0; k < segs.length; k++) {
    out += segs[k].text
    if (k < segs.length - 1) out += segs[k].hard ? '\n' : ' '
  }
  return out
}

// Collapse runs of blank tokens and trim leading/trailing ones, so output never
// opens or closes with empty rows and paragraphs are separated by exactly one.
function collapseBlanks(blocks) {
  const out = []
  for (const b of blocks) {
    if (b.type === 'blank') {
      if (!out.length || out[out.length - 1].type === 'blank') continue
    }
    out.push(b)
  }
  while (out.length && out[out.length - 1].type === 'blank') out.pop()
  return out
}

module.exports = { tokenizeBlocks }
