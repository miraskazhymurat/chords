import { isChordLine } from './chords'
import { isTabLine, parseSectionHeader } from './structure'

export interface SongHeader {
  title: string
  artist: string
  /** Строки песни без строк заголовка. */
  rest: string[]
}

const SEPARATOR = /\s+[-—–]\s+/
// Хвосты заголовка: «(аккорды)», «- аккорды для гитары», «chords», «текст и аккорды».
const TAIL =
  /\s*[-—–:]?\s*[(\[]?\s*(?:текст(?: песни)? и аккорды|подбор аккордов|аккорды(?: и текст(?: песни)?| для гитары| песни| на гитаре)?|(?:guitar )?chords(?: and lyrics)?|tabs?)\s*[)\]]?\.?$/i
const PREFIX = /^аккорды(?: песни| к песне)?\s+/i
const MAX_LENGTH = 100

/**
 * Название и исполнитель из первых непустых строк:
 * - «Исполнитель - Название», «Исполнитель — Название (аккорды)»;
 * - «Название» и «Исполнитель» двумя строками подряд;
 * - одна строка «Название аккорды» (хвост «аккорды» говорит, что это заголовок).
 * Заголовок должен отделяться от песни пустой строкой или сразу переходить в аккорды, секцию,
 * табулатуру. Если уверенности нет — поля пустые, строки остаются в песне.
 */
export function extractHeader(lines: string[]): SongHeader {
  const start = lines.findIndex((line) => line.trim() !== '')
  const none = { title: '', artist: '', rest: lines }
  if (start < 0 || !isHeaderCandidate(lines[start])) return none

  const first = lines[start].trim()
  const firstClean = stripTail(first)
  const rest = (count: number) => [...lines.slice(0, start), ...lines.slice(start + count)]

  const separator = SEPARATOR.exec(firstClean)
  if (separator && endsHeader(lines, start + 1)) {
    const artist = firstClean.slice(0, separator.index)
    const title = firstClean.slice(separator.index + separator[0].length)
    return { title: stripTail(title), artist: stripTail(artist), rest: rest(1) }
  }

  const second = lines[start + 1]
  if (
    second !== undefined &&
    isHeaderCandidate(second) &&
    !SEPARATOR.test(second.trim()) &&
    !looksLikeLyric(first) &&
    !looksLikeLyric(second) &&
    endsHeader(lines, start + 2)
  ) {
    return { title: firstClean, artist: stripTail(second.trim()), rest: rest(2) }
  }

  if (firstClean !== first && firstClean && endsHeader(lines, start + 1)) {
    return { title: firstClean, artist: '', rest: rest(1) }
  }
  return none
}

function stripTail(text: string): string {
  return text.replace(PREFIX, '').replace(TAIL, '').trim()
}

function isHeaderCandidate(line: string): boolean {
  const trimmed = line.trim()
  return (
    trimmed !== '' &&
    trimmed.length <= MAX_LENGTH &&
    !isChordLine(trimmed) &&
    !isTabLine(trimmed) &&
    parseSectionHeader(trimmed) === null
  )
}

/** После заголовка — конец текста, пустая строка, аккорды, секция или табулатура, но не текст песни. */
function endsHeader(lines: string[], index: number): boolean {
  const line = lines[index]
  return (
    line === undefined ||
    line.trim() === '' ||
    isChordLine(line) ||
    isTabLine(line) ||
    parseSectionHeader(line) !== null
  )
}

/** Строки песни обычно кончаются знаком препинания, названия и имена — нет. */
function looksLikeLyric(line: string): boolean {
  return /[,.;!?…]$/.test(line.trim())
}
