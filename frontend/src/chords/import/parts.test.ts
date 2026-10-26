import { describe, expect, it } from 'vitest'
import { fromRussianNotation, isChordLine, keyOfChord, usesRussianNotation } from './chords'
import { isJunkLine } from './junk'
import { normalizeText } from './normalize'
import { isTabLine, parseCapoLine, parseSectionHeader } from './structure'

describe('isChordLine', () => {
  it.each([
    'Am  F  C  G',
    '   Am7   Dsus4   Cmaj7   G/B',
    'F#m7b5  Bb  Ebm  C#dim  Aadd9  E5',
    'Am(maj7)  C7(b9)  A6/9',
    'Am | F | C | G |',
    '|: Am  F :|  x2',
    'Am  -  F  -  (2x)',
    'N.C.   Am',
    '(Am  F)',
    'Hm  H7  D/H',
  ])('аккорды: %j', (line) => expect(isChordLine(line)).toBe(true))

  it.each([
    'Песня про дождь',
    'Am I wrong',
    'A на дворе',
    '| - - |',
    'x2',
    '',
  ])('текст: %j', (line) => expect(isChordLine(line)).toBe(false))
})

describe('русская нотация', () => {
  it('замечает H в тонике и в басе', () => {
    expect(usesRussianNotation(['Am', 'Hm'])).toBe(true)
    expect(usesRussianNotation(['Am', 'D/H'])).toBe(true)
    expect(usesRussianNotation(['Am', 'B', 'Bb'])).toBe(false)
  })

  it.each([
    ['H', 'B'],
    ['Hm', 'Bm'],
    ['H7', 'B7'],
    ['B', 'Bb'],
    ['Bm', 'Bbm'],
    ['B7/H', 'Bb7/B'],
    ['D/B', 'D/Bb'],
    ['Bb', 'Bb'],
    ['Am', 'Am'],
  ])('%s → %s', (from, to) => expect(fromRussianNotation(from)).toBe(to))
})

describe('keyOfChord', () => {
  it.each([
    ['Am7', 'Am'],
    ['F#maj7', 'F#'],
    ['Bbm', 'Bbm'],
    ['C/E', 'C'],
    ['Hm', 'Bm'],
    ['N.C.', ''],
  ])('%s → %j', (chord, key) => expect(keyOfChord(chord)).toBe(key))
})

describe('isJunkLine', () => {
  it.each([
    'Аккорды для гитары',
    'аккорды',
    'Показать аппликатуры',
    'Автоскролл',
    'Распечатать',
    'Источник: сайт',
    'https://example.com/song',
    'Просмотров: 1 234',
  ])('мусор: %j', (line) => expect(isJunkLine(line)).toBe(true))

  it.each(['Исполнитель — Название (аккорды)', 'Распечатать бы эту ночь', 'Am  F', ''])('не мусор: %j', (line) =>
    expect(isJunkLine(line)).toBe(false),
  )
})

describe('parseSectionHeader', () => {
  it.each([
    ['Припев:', 'chorus', 'Припев', ''],
    ['ПРИПЕВ', 'chorus', 'ПРИПЕВ', ''],
    ['[Chorus]', 'chorus', 'Chorus', ''],
    ['Припев (x2)', 'chorus', 'Припев (x2)', ''],
    ['Куплет 2.', 'comment', 'Куплет 2', ''],
    ['[Verse 1]', 'comment', 'Verse 1', ''],
    ['Вступление: Am F', 'comment', 'Вступление', 'Am F'],
    ['Проигрыш', 'comment', 'Проигрыш', ''],
    ['Бридж', 'comment', 'Бридж', ''],
    ['Coda', 'comment', 'Coda', ''],
  ])('%j', (line, kind, label, rest) => expect(parseSectionHeader(line)).toEqual({ kind, label, rest }))

  it.each(['Припевая песню', 'Куплеты про лето', 'Am'])('не секция: %j', (line) =>
    expect(parseSectionHeader(line)).toBeNull(),
  )
})

describe('parseCapoLine', () => {
  it.each([
    ['Каподастр: 2', 2],
    ['Capo 2', 2],
    ['каподастр на 2 ладу', 2],
    ['Капо 4', 4],
    ['Capo: 1st fret', 1],
    ['Каподастр на II ладу', 2],
  ])('%j → %i', (line, fret) => expect(parseCapoLine(line)).toBe(fret))

  it.each(['Каподастр нужен', 'Capoeira 2'])('не каподастр: %j', (line) => expect(parseCapoLine(line)).toBeNull())
})

describe('isTabLine', () => {
  it.each(['e|-----0-----|', 'B|--1--3h5--|', 'E:---------', '  G|-2-------2-|'])('табулатура: %j', (line) =>
    expect(isTabLine(line)).toBe(true),
  )
  it.each(['A | D | E |', 'Am - - -', 'e|'])('не табулатура: %j', (line) => expect(isTabLine(line)).toBe(false))
})

describe('normalizeText', () => {
  it('табы раскрывает до позиций кратных 8', () => {
    expect(normalizeText('Am\tF\nабв\tгде')).toBe('Am      F\nабв     где')
  })

  it('\\r\\n, nbsp, пробелы в конце, пустые строки, отступ первой строки сохраняет', () => {
    expect(normalizeText('\r\n\r\n   Am  \r\nа б \r\n\r\n\r\n\r\nв\r\n\r\n')).toBe('   Am\nа б\n\nв')
  })
})
