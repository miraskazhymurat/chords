import { describe, expect, it } from 'vitest'
import { parseChordPro } from '../chordpro'
import { importSong, isChordPro } from './importSong'
import alignment from './__fixtures__/alignment.txt?raw'
import alignmentExpected from './__fixtures__/alignment.expected.chordpro?raw'
import alreadyChordPro from './__fixtures__/already-chordpro.chordpro?raw'
import bWithoutH from './__fixtures__/b-without-h.txt?raw'
import bWithoutHExpected from './__fixtures__/b-without-h.expected.chordpro?raw'
import russianSite from './__fixtures__/russian-site.txt?raw'
import russianSiteExpected from './__fixtures__/russian-site.expected.chordpro?raw'

describe('importSong: фикстуры', () => {
  it('песня с сайта: мусор, заголовок, каподастр, русская нотация, секции, табулатура', () => {
    expect(importSong(russianSite)).toEqual({
      title: 'Песня о фонаре',
      artist: 'Вымышленная группа',
      originalKey: 'Bm',
      content: russianSiteExpected.trimEnd(),
    })
  })

  it('выравнивание аккордов над словами: табы, отступы, аккорды после конца строки', () => {
    const song = importSong(alignment)
    expect(song.content).toBe(alignmentExpected.trimEnd())
    expect(song.originalKey).toBe('Am')
  })

  it('B без H не трогает', () => {
    const song = importSong(bWithoutH)
    expect(song.content).toBe(bWithoutHExpected.trimEnd())
    expect(song.originalKey).toBe('Bb')
  })

  it('уже ChordPro: текст не трогает, поля берёт из директив', () => {
    expect(isChordPro(alreadyChordPro)).toBe(true)
    expect(importSong(alreadyChordPro)).toEqual({
      title: 'Готовая песня',
      artist: 'Вымышленный автор',
      originalKey: 'Bm',
      content: alreadyChordPro.trimEnd(),
    })
  })

  it('результат разбирается ChordProParser и даёт нужные абзацы', () => {
    const { song } = parseChordPro(importSong(russianSite).content)
    expect(song).not.toBeNull()
    expect(song!.capo).toBe('2')
    const types = song!.bodyParagraphs.map((p) => p.type)
    expect(types).toContain('chorus')
    expect(types).toContain('tab')
    const tab = song!.bodyParagraphs.find((p) => p.type === 'tab')!
    expect(tab.isLiteral()).toBe(true)
    expect(tab.contents).toBe('e|-----2-----|\nB|---3---3---|\nG|-2-------2-|')
  })
})

describe('importSong: строки', () => {
  it('аккорды над словами ставит перед нужным слогом', () => {
    expect(importSong('Am        F\nПесня про дождь').content).toBe('[Am]Песня про [F]дождь')
    expect(importSong('   Dm\nТихо идёт').content).toBe('Тих[Dm]о идёт')
  })

  it('строка из одних аккордов', () => {
    expect(importSong('Am  F  C  G').content).toBe('[Am][F][C][G]')
  })

  it('служебные символы и повторы в строке аккордов', () => {
    expect(importSong('Am   C/G  F  |  N.C.  x2\nСлова строки тут').content).toBe(
      '[Am]Слова[C/G] стро[F]ки [|]тут[N.C.][(2x)]',
    )
  })

  it('скобки вокруг аккордов убирает, колонку сохраняет', () => {
    expect(importSong('Am     (C   G)\nСлова строки тут').content).toBe('[Am]Слова ст[C]роки[G] тут')
  })

  it('аккорды, набранные кириллицей, превращает в латиницу', () => {
    expect(importSong('Аm      Е7\nКириллица тут').content).toBe('[Am]Кириллиц[E7]а тут')
  })

  it('аккорды, которые библиотека не понимает или меняет, оставляет как в тексте', () => {
    expect(importSong('A6/9      Em/D#\nОсобые аккорды тут').content).toBe('[A6/9]Особые акк[Em/D#]орды тут')
  })

  it('русская нотация: H → B, B → Bb, в тонике и в басе', () => {
    expect(importSong('Hm   H7   B   Bm   D/H\nСтрока песни про русскую нотацию').content).toBe(
      '[Bm]Строк[B7]а пес[Bb]ни п[Bbm]ро ру[D/B]сскую нотацию',
    )
  })

  it('русская нотация меняет и явную тональность', () => {
    expect(importSong('Тональность: Hm\n\nHm   G\nСтрока песни').originalKey).toBe('Bm')
  })

  it('слова, похожие на аккорды, в тексте не меняет', () => {
    expect(importSong('Hm\nБыл Bm и H в тексте').content).toBe('[Bm]Был Bm и H в тексте')
  })

  it('предобработка: \\r\\n, nbsp, пробелы в конце, лишние пустые строки', () => {
    expect(importSong('Am\r\nСтрока один   \r\n\r\n\r\n\r\nСтрока два').content).toBe(
      '[Am]Строка один\n\nСтрока два',
    )
  })
})

describe('importSong: мусор', () => {
  it('удаляет типовые строки сайтов', () => {
    const text = [
      'Аккорды для гитары',
      'Показать аппликатуры',
      'Автоскролл',
      'Am',
      'Строка песни',
      'Распечатать',
      'Источник: где-то в сети',
      'Смотри https://example.com/x',
      'www.example.org',
    ].join('\n')
    expect(importSong(text).content).toBe('[Am]Строка песни')
  })
})

describe('importSong: секции', () => {
  it('припев → start_of_chorus/end_of_chorus, остальные → comment, пустые строки вокруг', () => {
    const text = 'Куплет 1:\nAm\nСтрока куплета\nПрипев:\nC\nСтрока припева\nКода\nAm'
    expect(importSong(text).content).toBe(
      [
        '{comment: Куплет 1}',
        '[Am]Строка куплета',
        '',
        '{start_of_chorus: Припев}',
        '[C]Строка припева',
        '{end_of_chorus}',
        '',
        '{comment: Кода}',
        '[Am]',
      ].join('\n'),
    )
  })

  it('припев заканчивается на пустой строке', () => {
    expect(importSong('Chorus\nC\nСтрока\n\nВторая строка').content).toBe(
      '{start_of_chorus: Chorus}\n[C]Строка\n{end_of_chorus}\n\nВторая строка',
    )
  })

  it('«Припев» без строк — отсылка к припеву, а не пустой припев', () => {
    expect(importSong('Am\nСтрока\n\nПрипев x2').content).toBe('[Am]Строка\n\n{comment: Припев x2}')
  })

  it('секция с аккордами в той же строке и в скобках, как на Ultimate Guitar', () => {
    expect(importSong('Вступление: Am  F\n\n[Verse 2]\nAm\nСлова').content).toBe(
      '{comment: Вступление}\n[Am][F]\n\n{comment: Verse 2}\n[Am]Слова',
    )
  })
})

describe('importSong: каподастр', () => {
  it.each([
    ['Каподастр: 2', 2],
    ['Capo 2', 2],
    ['каподастр на 2 ладу', 2],
    ['Capo on 3rd fret', 3],
    ['Каподастр - V лад', 5],
  ])('%s → {capo: %i}', (line, fret) => {
    expect(importSong(`${line}\nAm\nСлова`).content).toBe(`{capo: ${fret}}\n\n[Am]Слова`)
  })
})

describe('importSong: табулатура', () => {
  it('строки табулатуры → start_of_tab/end_of_tab без разбора аккордов', () => {
    const text = 'Am\nСлова\ne|---0---|\nB|---1---|\nG|-2-----|\nC\nДальше'
    expect(importSong(text).content).toBe(
      [
        '[Am]Слова',
        '',
        '{start_of_tab}',
        'e|---0---|',
        'B|---1---|',
        'G|-2-----|',
        '{end_of_tab}',
        '',
        '[C]Дальше',
      ].join('\n'),
    )
  })
})

describe('importSong: название и исполнитель', () => {
  const body = '\n\nAm\nСтрока песни'

  it.each([
    ['Исполнитель - Название', 'Название', 'Исполнитель'],
    ['Исполнитель — Название (аккорды)', 'Название', 'Исполнитель'],
    ['Исполнитель – Название - аккорды для гитары', 'Название', 'Исполнитель'],
    ['Исполнитель - Название chords', 'Название', 'Исполнитель'],
    ['Название\nИсполнитель', 'Название', 'Исполнитель'],
    ['Название аккорды', 'Название', ''],
  ])('%j', (header, title, artist) => {
    const song = importSong(header + body)
    expect(song).toMatchObject({ title, artist })
    expect(song.content).toBe('[Am]Строка песни')
  })

  it('заголовок сразу перед аккордами', () => {
    expect(importSong('Исполнитель - Название\nAm\nСтрока песни')).toMatchObject({
      title: 'Название',
      artist: 'Исполнитель',
      content: '[Am]Строка песни',
    })
  })

  it('не уверен — оставляет поля пустыми и строки в песне', () => {
    for (const text of [
      'Ночь над рекою,\nТихие звёзды.\n\nAm\nСтрока',
      'Просто строка текста\nи ещё одна\nи третья',
      'Одна строка без пометок\n\nAm\nСтрока',
    ]) {
      const song = importSong(text)
      expect(song).toMatchObject({ title: '', artist: '' })
      expect(song.content.split('\n')[0]).toBe(text.split('\n')[0])
    }
  })
})

describe('importSong: тональность', () => {
  it('по первому аккорду', () => {
    expect(importSong('N.C.  F#m7  D\nСлова').originalKey).toBe('F#m')
  })

  it('явная важнее первого аккорда, строка убирается', () => {
    expect(importSong('Key: C\nAm\nСлова')).toMatchObject({ originalKey: 'C', content: '[Am]Слова' })
  })

  it('без аккордов — пусто', () => {
    expect(importSong('Просто текст').originalKey).toBe('')
  })
})
