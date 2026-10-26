import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { parseChordPro } from '../chords/chordpro'
import { ChordSheet } from './ChordSheet'

const LYRICS = 'whitespace-pre-wrap'

function render(source: string): string {
  const { song } = parseChordPro(source)
  return renderToStaticMarkup(<ChordSheet song={song!} />)
}

describe('ChordSheet', () => {
  it('строка из одних аккордов — без пустой строки текста под ними', () => {
    const html = render('[Am][F][C][G]')
    expect(html).toContain('>Am<')
    expect(html).not.toContain(LYRICS)
  })

  it('строка с текстом — аккорды над текстом', () => {
    const html = render('[Am]Тихо горит [F]фонарь')
    expect(html).toContain(LYRICS)
    expect(html).toContain('>Тихо <')
    expect(html).toContain('>фонарь<')
  })

  it('каподастр', () => {
    expect(render('{capo: 2}\n\n[Am]Слова')).toContain('Каподастр: 2 лад')
  })
})
