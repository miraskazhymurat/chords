import { ChordProFormatter, ChordsOverWordsParser } from 'chordsheetjs'

/**
 * Строка аккордов (+ строка текста под ней) → строка ChordPro: «[Am]Песня про [F]дождь».
 *
 * Выравнивание делает ChordsOverWordsParser из chordsheetjs. Что строка аккордов, а что текст,
 * решаем сами (parseChordLine) и отдаём парсеру по одной паре строк — иначе он может принять
 * строку текста вида «слово: …» за метаданные, а «---» — за разделитель заголовка.
 * Обходим две его особенности:
 * - аккорды он нормализует (Em/D# → Em/Eb) — подставляем обратно аккорды как в исходной строке;
 * - некоторые аккорды не понимает вовсе (A6/9) и возвращает пару строк как текст — тогда
 *   расставляем аккорды по колонкам сами, тем же способом.
 */
export function chordsOverWordsToChordPro(chordLine: string, lyricLine: string | null): string {
  const [chords, lyrics] = dedent([chordLine, lyricLine ?? ''])
  const tokens = chords.trim().split(/\s+/)
  const parsed = parseWithLibrary(lyricLine === null ? chords : `${chords}\n${lyrics}`)
  if (parsed !== null) {
    const found = [...parsed.matchAll(/\[[^\]]*\]/g)]
    if (!parsed.includes('\n') && found.length === tokens.length) {
      let i = 0
      return parsed.replace(/\[[^\]]*\]/g, () => `[${tokens[i++]}]`)
    }
  }
  return alignByColumns(chords, lyrics)
}

function parseWithLibrary(text: string): string | null {
  try {
    return new ChordProFormatter().format(new ChordsOverWordsParser().parse(text)).trim()
  } catch {
    return null
  }
}

function alignByColumns(chords: string, lyrics: string): string {
  let out = ''
  let position = 0
  for (const match of chords.matchAll(/\S+/g)) {
    if (match.index > position) {
      out += lyrics.slice(position, match.index)
      position = match.index
    }
    out += `[${match[0]}]`
  }
  return out + lyrics.slice(position)
}

/** Убирает общий отступ строк (пустые не в счёт), сохраняя выравнивание между ними. */
function dedent(lines: string[]): string[] {
  const indents = lines.filter((line) => line.trim()).map((line) => line.length - line.trimStart().length)
  const common = indents.length ? Math.min(...indents) : 0
  return lines.map((line) => line.slice(common))
}
