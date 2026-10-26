/** Токен строки аккордов: текст и колонка, с которой он начинается (для выравнивания над текстом). */
export interface ChordLineToken {
  text: string
  column: number
  chord: boolean
}

const NOTE = '[A-H][#b]?'
// m, maj7, sus4, add9, 7b5, (b9), 6/9, +, °, ø…
const SUFFIX = String.raw`(?:maj|min|dim|aug|sus|add|alt|omit|no|m|M|[+°øΔ#b-]|\d+|\(|\)|\/(?=\d))*`
const CHORD = new RegExp(`^${NOTE}${SUFFIX}(?:/${NOTE})?$`)

// Служебные символы в строке аккордов: такты, ритм, «без аккорда».
const SERVICE_TOKENS = new Set(['|', '||', '|:', ':|', ':||', ':|:', '|.', '-', '/', 'N.C.', 'N.C', 'NC', 'N/C'])
const DASH = /^[–—]$/
// x2, х2 (кириллицей), 2x, ×2, (x2) → (2x): в такой форме повтор понимает chordsheetjs.
const REPEAT = /^\(?(?:[xх×*](\d+)|(\d+)[xх×*])\)?$/i

// Кириллические буквы, похожие на латинские ноты: «Аm», «Нm7» набраны с русской раскладки.
const LOOKALIKES: Record<string, string> = { А: 'A', В: 'B', С: 'C', Е: 'E', Н: 'H', '♯': '#', '♭': 'b' }

export function isChordToken(token: string): boolean {
  return CHORD.test(token)
}

/**
 * Разбирает строку как строку аккордов. Все токены должны быть аккордами (с басом через «/»,
 * в скобках) или служебными символами, и хотя бы один — аккордом. Иначе это текст: null.
 */
export function parseChordLine(line: string): ChordLineToken[] | null {
  const tokens: ChordLineToken[] = []
  for (const match of line.matchAll(/\S+/g)) {
    const token = readToken(match[0], match.index)
    if (!token) return null
    if (token.text) tokens.push(token)
  }
  return tokens.some((t) => t.chord) ? tokens : null
}

export function isChordLine(line: string): boolean {
  return parseChordLine(line) !== null
}

function readToken(raw: string, column: number): ChordLineToken | null {
  if (SERVICE_TOKENS.has(raw)) return { text: raw, column, chord: false }
  if (DASH.test(raw)) return { text: '-', column, chord: false }
  const repeat = REPEAT.exec(raw)
  if (repeat) return { text: `(${repeat[1] ?? repeat[2]}x)`, column, chord: false }

  // Скобки вокруг аккордов «(Am F)» — без них: аккорд остаётся над своим слогом.
  let text = raw
  let lead = 0
  while (text.startsWith('(')) {
    text = text.slice(1)
    lead++
  }
  while (text.endsWith(')') && count(text, ')') > count(text, '(')) text = text.slice(0, -1)
  if (!text) return { text: '', column, chord: false }

  text = text.replace(/[АВСЕН♯♭]/g, (c) => LOOKALIKES[c])
  return isChordToken(text) ? { text, column: column + lead, chord: true } : null
}

/**
 * Собирает строку аккордов обратно, сохраняя колонки: каждый токен на своём месте, а если
 * предыдущий стал длиннее (B → Bb) — через один пробел после него.
 */
export function formatChordLine(tokens: ChordLineToken[]): string {
  let out = ''
  for (const token of tokens) {
    const column = out ? Math.max(token.column, out.length + 1) : token.column
    out = out.padEnd(column) + token.text
  }
  return out
}

/** Русская (немецкая) нотация: в песне есть аккорд на H (тоника или бас). */
export function usesRussianNotation(chords: string[]): boolean {
  return chords.some((chord) => /(^|\/)H/.test(chord))
}

/** H → B, B → Bb, в тонике и в басе: Hm → Bm, H7 → B7, Bm → Bbm, D/H → D/B. Bb и B# не трогаем. */
export function fromRussianNotation(chord: string): string {
  return chord.replace(/(^|\/)([BH])([#b]?)/g, (_, slash: string, note: string, accidental: string) => {
    if (note === 'H') return `${slash}B${accidental}`
    return `${slash}B${accidental || 'b'}`
  })
}

/** Тональность по аккорду: «Am7» → «Am», «F#maj7» → «F#», «Hm» → «Bm». */
export function keyOfChord(chord: string): string {
  const match = /^([A-H])([#b]?)(m(?!aj))?/.exec(chord)
  if (!match) return ''
  const [, note, accidental, minor] = match
  return (note === 'H' ? 'B' : note) + accidental + (minor ?? '')
}

function count(text: string, char: string): number {
  return text.split(char).length - 1
}
