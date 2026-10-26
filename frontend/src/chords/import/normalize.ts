// Ширина табуляции как в браузере по умолчанию (tab-size: 8): так текст выглядел на сайте.
const TAB_SIZE = 8

/**
 * Предобработка вставленного текста: переводы строк, табы → пробелы до следующей позиции
 * табуляции (иначе аккорды съезжают со своих слогов), неразрывные и прочие пробелы → обычные,
 * без пробелов в конце строк, подряд идущие пустые строки → одна.
 */
export function normalizeText(text: string): string {
  const lines = text
    .replace(/\r\n?/g, '\n')
    .replace(/[  -   　]/g, ' ')
    .replace(/[​-‍⁠﻿]/g, '')
    .split('\n')
    .map((line) => expandTabs(line).trimEnd())
  return trimBlankLines(collapseBlankLines(lines.join('\n')))
}

export function expandTabs(line: string): string {
  let out = ''
  for (const char of line) {
    out += char === '\t' ? ' '.repeat(TAB_SIZE - (out.length % TAB_SIZE)) : char
  }
  return out
}

/** Две и больше пустых строки подряд → одна. Строки уже без пробелов в конце. */
export function collapseBlankLines(text: string): string {
  return text.replace(/\n{3,}/g, '\n\n')
}

/** Пустые строки в начале и в конце. Пробелы в начале первой строки не трогаем: это может быть отступ аккорда. */
export function trimBlankLines(text: string): string {
  return text.replace(/^\n+/, '').replace(/\n+$/, '')
}
