import { ChordLyricsPair, ChordProParser, type Song } from 'chordsheetjs'

export type ParseResult = { song: Song; error: null } | { song: null; error: string }

/** Разбирает ChordPro; синтаксическую ошибку возвращает текстом с номером строки. */
export function parseChordPro(source: string): ParseResult {
  try {
    return { song: new ChordProParser().parse(source), error: null }
  } catch (e) {
    const line = (e as { location?: { start?: { line?: number } } }).location?.start?.line
    const message = e instanceof Error ? e.message : String(e)
    return { song: null, error: line ? `Строка ${line}: ${message}` : message }
  }
}

/** Тональность как высота тоники (C = 0) + лад. */
export interface MusicalKey {
  semitone: number
  minor: boolean
}

const NOTE_SEMITONES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11, H: 11 }

// Общепринятое написание тональностей: Bb, а не A#; F#m, а не Gbm.
const MAJOR_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
const MINOR_NAMES = ['Cm', 'C#m', 'Dm', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'Bbm', 'Bm']
// Тональности с бемолями при ключе — в них аккорды пишем через «b».
const FLAT_MAJOR = new Set([1, 3, 5, 8, 10])
const FLAT_MINOR = new Set([0, 2, 3, 5, 7, 10])

/** «Am», «C#», «Bb», «Hm», «Am7» → тональность; всё остальное → null. */
export function parseKey(name: string | null | undefined): MusicalKey | null {
  const match = /^([A-H])([#b]?)(m(?!aj))?/.exec((name ?? '').trim())
  if (!match) return null
  const [, note, accidental, minor] = match
  const shift = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0
  return { semitone: mod12(NOTE_SEMITONES[note] + shift), minor: Boolean(minor) }
}

export function keyName(key: MusicalKey): string {
  return (key.minor ? MINOR_NAMES : MAJOR_NAMES)[key.semitone]
}

export function transposeKey(key: MusicalKey, delta: number): MusicalKey {
  return { semitone: mod12(key.semitone + delta), minor: key.minor }
}

/** Тональность песни: поле originalKey, затем {key: …} в тексте, затем первый аккорд. */
export function detectKey(song: Song, originalKey: string | null): MusicalKey | null {
  const explicit = parseKey(originalKey) ?? parseKey(song.key)
  if (explicit) return explicit
  for (const line of song.lines) {
    for (const item of line.items) {
      if (item instanceof ChordLyricsPair && item.chords) {
        const key = parseKey(item.chords)
        if (key) return key
      }
    }
  }
  return null
}

/**
 * Транспонирует все аккорды на delta полутонов. Знаки альтерации выбираются по целевой
 * тональности (в F — Bb, в E — G#), иначе chordsheetjs выдаёт «E#m» и «B#7».
 */
export function transposeSong(song: Song, delta: number, baseKey: MusicalKey | null): Song {
  if (mod12(delta) === 0) return song
  const accidental = baseKey ? accidentalFor(transposeKey(baseKey, delta)) : delta > 0 ? '#' : 'b'
  return song.changeChords((chord) =>
    chord.transpose(delta).useAccidental(accidental).normalize(null, { normalizeSuffix: false }),
  )
}

function accidentalFor(key: MusicalKey): '#' | 'b' {
  return (key.minor ? FLAT_MINOR : FLAT_MAJOR).has(key.semitone) ? 'b' : '#'
}

function mod12(n: number): number {
  return ((n % 12) + 12) % 12
}
