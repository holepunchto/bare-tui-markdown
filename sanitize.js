// sanitize — strip terminal-control bytes from untrusted input, keep layout.
//
// Markdown text reaching this library is often LLM- or peer-authored, so it's
// treated as hostile: a raw ESC (0x1b) or CSI (0x9b) in the input could move the
// cursor, rewrite the screen, or set the window title once printed. We strip the
// whole C0/C1/DEL range — EXCEPT newline (0x0a) and tab (0x09), which carry the
// block structure markdown depends on (paragraphs, lists, code blocks). Carriage
// returns (0x0d) are dropped so the tokenizer sees clean `\n`-delimited lines.
//
// This is the same posture as bare-tui-form's harden.cleanText, minus the two
// layout bytes. After this pass the renderer is the ONLY source of escapes — it
// emits ANSI exclusively through bare-tui's style().render(), so nothing the
// model wrote can reach the terminal as a control sequence.
//
// Built from an ASCII string literal so no control bytes live in this source.
const CONTROL_CHARS = new RegExp('[\\u0000-\\u0008\\u000b-\\u001f\\u007f-\\u009f]', 'g')

function sanitize(text) {
  return String(text ?? '').replace(CONTROL_CHARS, '')
}

module.exports = { sanitize }
