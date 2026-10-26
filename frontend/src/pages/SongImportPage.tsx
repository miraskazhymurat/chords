import { useState, type ClipboardEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import type { SongInput } from '../api'
import { importSong } from '../chords/import/importSong'
import { Button, inputClass } from '../ui'

/** Состояние перехода в редактор: импорт только готовит поля, сохраняет редактор. */
export interface SongDraftState {
  draft: SongInput
}

/** /songs/import: вставить песню «аккорды над текстом» (или ChordPro) → редактор с заполненными полями. */
export function SongImportPage() {
  const navigate = useNavigate()
  const [text, setText] = useState('')

  function openEditor(source: string) {
    if (!source.trim()) return
    const state: SongDraftState = { draft: importSong(source) }
    navigate('/songs/new', { state })
  }

  // Вставили в пустое поле — сразу в редактор. Вставка в начатый текст или набор руками — по кнопке.
  function handlePaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    const pasted = e.clipboardData.getData('text/plain')
    if (text.trim() || !pasted.trim()) return
    e.preventDefault()
    openEditor(pasted)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">Новая песня</h1>
      <label className="block">
        <span className="mb-1.5 block text-sm text-fg-muted">
          Вставь песню: аккорды над текстом, как на сайтах. Название, исполнителя и лишние строки разберём сами,
          проверишь в редакторе.
        </span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPaste={handlePaste}
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          autoFocus
          wrap="off"
          placeholder={'Исполнитель — Название\n\nAm           F\nТихо горит фонарь\nC            G\nНад пустой мостовой'}
          className={`min-h-[60dvh] resize-y py-3 font-mono text-base ${inputClass}`}
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={() => openEditor(text)} disabled={!text.trim()}>
          Дальше
        </Button>
        <Link to="/songs/new" className="px-2 py-3 text-accent">
          Написать ChordPro вручную
        </Link>
      </div>
    </div>
  )
}
