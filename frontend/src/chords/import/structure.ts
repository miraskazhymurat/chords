import { parseChordLine } from './chords'

export interface SectionHeader {
  kind: 'chorus' | 'comment'
  /** Название секции как в тексте, без скобок и двоеточия: «Куплет 2», «Chorus x2». */
  label: string
  /** Что стоит в той же строке после двоеточия: «Вступление: Am F C G» → «Am F C G». */
  rest: string
}

const CHORUS_LABELS = ['припев', 'chorus', 'refrain', 'рефрен']
const COMMENT_LABELS = [
  'куплет',
  'verse',
  'вступление',
  'интро',
  'intro',
  'проигрыш',
  'interlude',
  'instrumental',
  'соло',
  'solo',
  'бридж',
  'bridge',
  'кода',
  'coda',
  'outro',
  'концовка',
  'окончание',
  'предприпев',
  'пред-припев',
  'pre-chorus',
  'prechorus',
]

// Название, номер («Куплет 2», «Verse II») и повтор («x2», «(2 раза)»), всё необязательно в [ ] или ( ).
const SECTION = new RegExp(
  String.raw`^[\[(]?\s*(${[...COMMENT_LABELS, ...CHORUS_LABELS].join('|')})` +
    String.raw`(\s*№?\s*\d+|\s+[IVX]+)?` +
    String.raw`(\s*\(?(?:[xх×]\s?\d+|\d+\s?[xх×]|\d+\s*раза?)\)?)?\s*[\])]?\.?$`,
  'i',
)

/** «Припев:», «[Verse 1]», «Куплет 2.», «Chorus x2», «Вступление: Am F». Иначе null. */
export function parseSectionHeader(line: string): SectionHeader | null {
  const trimmed = line.trim()
  const colon = trimmed.indexOf(':')
  const head = (colon >= 0 ? trimmed.slice(0, colon) : trimmed).trim()
  const match = SECTION.exec(head)
  if (!match) return null
  const name = match[1].toLowerCase()
  let label = head.replace(/\.$/, '')
  if (/^\[.*\]$|^\(.*\)$/.test(label)) label = label.slice(1, -1).trim()
  return {
    kind: CHORUS_LABELS.includes(name) ? 'chorus' : 'comment',
    label,
    rest: colon >= 0 ? trimmed.slice(colon + 1).trim() : '',
  }
}

// Строка табулатуры: имя струны, «|» или «:», дальше только символы табулатуры.
const TAB_LINE = /^\s*[A-Ha-h][#b]?\s?[|:][-0-9|:hpbrstvx/\\~().^*<>= ]*$/

/** «e|---0---|», «B|--1-3h5--|», «E:-----». */
export function isTabLine(line: string): boolean {
  return TAB_LINE.test(line) && (line.match(/-/g)?.length ?? 0) >= 3
}

const ROMAN: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12 }

const CAPO =
  /^(?:каподастр|капо|capo)(?![a-zа-яё])\s*(?:[:\-—–]\s*)?(?:(?:на|on)\s+)?(\d{1,2}|[IVX]{1,4})(?:-?(?:й|ом|ой|th|st|nd|rd))?(?:\s+(?:лад[ауе]?|fret))?\.?$/i

/**
 * «Каподастр: 2», «Capo 2», «каподастр на 2 ладу», «Capo on 3rd fret», «Каподастр - II лад» → номер лада.
 * Не строка каподастра → null.
 */
export function parseCapoLine(line: string): number | null {
  const match = CAPO.exec(line.trim())
  if (!match) return null
  const value = match[1].toUpperCase()
  const fret = /^\d+$/.test(value) ? Number(value) : ROMAN[value]
  return fret !== undefined && fret <= 24 ? fret : null
}

const KEY = /^(?:тональность|key)\s*[:\-—–]?\s*(\S+)\s*(?:\(.*\))?\.?$/i

/** «Тональность: Am», «Key: F#m» → аккорд тональности (как в строке аккордов). Иначе null. */
export function parseKeyLine(line: string): string | null {
  const match = KEY.exec(line.trim())
  const tokens = match ? parseChordLine(match[1]) : null
  return tokens?.length === 1 && tokens[0].chord ? tokens[0].text : null
}
