import { chordsOverWordsToChordPro } from './align'
import {
  type ChordLineToken,
  formatChordLine,
  fromRussianNotation,
  isChordToken,
  keyOfChord,
  parseChordLine,
  usesRussianNotation,
} from './chords'
import { extractHeader } from './header'
import { isJunkLine } from './junk'
import { collapseBlankLines, normalizeText, trimBlankLines } from './normalize'
import { type SectionHeader, isTabLine, parseCapoLine, parseKeyLine, parseSectionHeader } from './structure'

/** Данные для редактора песни. Пустая строка — не удалось определить. */
export interface ImportedSong {
  title: string
  artist: string
  originalKey: string
  content: string
}

/**
 * Вставленный текст песни → поля редактора. «Аккорды над текстом» переводятся в ChordPro;
 * текст, который уже в ChordPro, остаётся как есть.
 */
export function importSong(raw: string): ImportedSong {
  if (isChordPro(raw)) return importChordPro(raw)

  let capo: number | null = null
  let key: string | null = null
  const lines = normalizeText(raw)
    .split('\n')
    .filter((line) => {
      if (isJunkLine(line)) return false
      const fret = parseCapoLine(line)
      if (fret !== null) {
        capo ??= fret
        return false
      }
      const lineKey = parseKeyLine(line)
      if (lineKey !== null) {
        key ??= lineKey
        return false
      }
      return true
    })

  const header = extractHeader(lines)
  const items = classify(header.rest)
  const chords = items.flatMap((item) => (item.kind === 'chords' ? item.tokens.filter((t) => t.chord) : []))
  if (usesRussianNotation(chords.map((t) => t.text))) {
    for (const token of chords) token.text = fromRussianNotation(token.text)
    if (key) key = fromRussianNotation(key)
  }

  const body = render(items)
  const content = capo ? `{capo: ${capo}}\n\n${body}` : body
  return {
    title: header.title,
    artist: header.artist,
    originalKey: keyOfChord(key ?? chords[0]?.text ?? ''),
    content: trimBlankLines(collapseBlankLines(content)),
  }
}

const DIRECTIVE = /^\s*\{\s*[a-z_]+\s*(:[^}]*)?\}\s*$/im
const BRACKETED = /\[([^\]\s]+)\]/g

/** Уже ChordPro: есть директивы {…} или аккорды в [ ]. «[Verse]» и «[x2]» — не аккорды. */
export function isChordPro(text: string): boolean {
  return DIRECTIVE.test(text) || [...text.matchAll(BRACKETED)].some((match) => isChordToken(match[1]))
}

function importChordPro(raw: string): ImportedSong {
  const content = trimBlankLines(raw.replace(/\r\n?/g, '\n'))
  const directive = (...names: string[]) =>
    new RegExp(String.raw`^\s*\{\s*(?:${names.join('|')})\s*:\s*(.*?)\s*\}\s*$`, 'im').exec(content)?.[1] ?? ''
  const firstChord = [...content.matchAll(BRACKETED)].find((match) => isChordToken(match[1]))?.[1] ?? ''
  return {
    title: directive('title', 't'),
    artist: directive('artist') || directive('subtitle', 'st'),
    originalKey: keyOfChord(directive('key') || firstChord),
    content,
  }
}

type Item =
  | { kind: 'blank' }
  | { kind: 'tab'; line: string }
  | { kind: 'section'; header: SectionHeader }
  | { kind: 'chords'; tokens: ChordLineToken[] }
  | { kind: 'lyric'; line: string }

function classify(lines: string[]): Item[] {
  const items: Item[] = []
  const add = (line: string) => {
    const tokens = parseChordLine(line)
    items.push(tokens ? { kind: 'chords', tokens } : { kind: 'lyric', line })
  }
  for (const line of lines) {
    if (!line.trim()) {
      items.push({ kind: 'blank' })
      continue
    }
    if (isTabLine(line)) {
      items.push({ kind: 'tab', line })
      continue
    }
    const header = parseSectionHeader(line)
    if (header) {
      items.push({ kind: 'section', header })
      if (header.rest) add(header.rest)
      continue
    }
    add(line)
  }
  return items
}

/**
 * Секции и табулатуры отделяем пустыми строками: по ним chordsheetjs делит песню на абзацы.
 * Секция, за которой сразу идёт табулатура, становится её подписью. Припев длится до пустой строки или следующей секции. «Припев» без строк после него —
 * отсылка «спеть припев», а не сам припев: для неё просто комментарий.
 */
function render(items: Item[]): string {
  const out: string[] = []
  let inChorus = false
  let tabLabel = ''
  const paragraphBreak = () => {
    if (out.length > 0 && out[out.length - 1] !== '') out.push('')
  }
  const endChorus = () => {
    if (inChorus) out.push('{end_of_chorus}')
    inChorus = false
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    switch (item.kind) {
      case 'blank':
        endChorus()
        paragraphBreak()
        break
      case 'tab':
        endChorus()
        paragraphBreak()
        out.push(tabLabel ? `{start_of_tab: ${tabLabel}}` : '{start_of_tab}')
        tabLabel = ''
        for (let tab = items[i]; tab?.kind === 'tab'; tab = items[++i]) out.push(tab.line)
        i--
        out.push('{end_of_tab}')
        paragraphBreak()
        break
      case 'section': {
        endChorus()
        paragraphBreak()
        const next = items[i + 1]
        const hasLines = next?.kind === 'chords' || next?.kind === 'lyric'
        if (next?.kind === 'tab') {
          tabLabel = item.header.label
        } else if (item.header.kind === 'chorus' && hasLines) {
          out.push(`{start_of_chorus: ${item.header.label}}`)
          inChorus = true
        } else {
          out.push(`{comment: ${item.header.label}}`)
        }
        break
      }
      case 'chords': {
        const next = items[i + 1]
        const lyric = next?.kind === 'lyric' ? next.line : null
        out.push(chordsOverWordsToChordPro(formatChordLine(item.tokens), lyric))
        if (lyric !== null) i++
        break
      }
      case 'lyric':
        out.push(item.line.trim())
        break
    }
  }
  endChorus()
  return out.join('\n')
}
