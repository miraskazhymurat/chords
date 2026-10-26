import { CHORUS, ChordLyricsPair, Literal, Tag, type Line, type Paragraph, type Song } from 'chordsheetjs'

/**
 * Рендер песни: аккорды над текстом. Собираем разметку сами, а не через HtmlDivFormatter:
 * он вставляет текст песни в HTML без экранирования (а песни пишут другие пользователи).
 */
export function ChordSheet({ song, fontSize }: { song: Song; fontSize?: number }) {
  return (
    <div className="min-w-0 space-y-5 leading-snug" style={fontSize ? { fontSize: `${fontSize}px` } : undefined}>
      {song.capo && <p className="text-[0.9em] text-fg-muted">Каподастр: {String(song.capo)} лад</p>}
      {song.expandedBodyParagraphs.map((paragraph, i) => (
        <SheetParagraph key={i} paragraph={paragraph} />
      ))}
    </div>
  )
}

function SheetParagraph({ paragraph }: { paragraph: Paragraph }) {
  if (paragraph.isLiteral()) {
    return (
      <section>
        {paragraph.label && <SectionLabel>{paragraph.label}</SectionLabel>}
        <pre className="overflow-x-auto font-mono text-[0.85em]">{paragraph.contents}</pre>
      </section>
    )
  }
  const lines = paragraph.lines.filter((line) => line.items.some((item) => item.isRenderable()))
  if (lines.length === 0) return null
  const chorus = paragraph.type === CHORUS
  return (
    <section className={chorus ? 'border-l-2 border-section pl-3' : undefined}>
      {lines.map((line, i) => (
        <SheetLine key={i} line={line} />
      ))}
    </section>
  )
}

function SheetLine({ line }: { line: Line }) {
  const hasChords = line.items.some((item) => item instanceof ChordLyricsPair && (item.chords || item.annotation))
  // Строка из одних аккордов (вступление, проигрыш) — без пустой строки текста под ними.
  const hasLyrics = line.items.some(
    (item) => (item instanceof ChordLyricsPair && item.lyrics?.trim()) || item instanceof Literal,
  )
  return (
    <div className="flex flex-wrap items-end">
      {line.items.map((item, i) => {
        if (item instanceof ChordLyricsPair) {
          const chord = item.annotation || item.chords
          return (
            <span key={i} className="inline-flex max-w-full flex-col">
              {hasChords && (
                <span className="min-h-[1.3em] pr-[0.4em] font-bold whitespace-pre text-chord">{chord}</span>
              )}
              {hasLyrics && <span className="break-words whitespace-pre-wrap">{item.lyrics || (chord ? ' ' : '')}</span>}
            </span>
          )
        }
        if (item instanceof Tag) {
          if (item.isComment()) {
            return (
              <p key={i} className="w-full py-1 text-[0.9em] text-fg-muted italic">
                {item.value}
              </p>
            )
          }
          if (item.hasRenderableLabel()) return <SectionLabel key={i}>{item.label}</SectionLabel>
          return null
        }
        if (item instanceof Literal) {
          return (
            <span key={i} className="break-words whitespace-pre-wrap">
              {item.string}
            </span>
          )
        }
        return null
      })}
    </div>
  )
}

function SectionLabel({ children }: { children: string }) {
  return <p className="mb-1 w-full text-[0.75em] font-semibold tracking-wide text-section uppercase">{children}</p>
}
