import { useDeferredValue, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { api, ApiError, type SongDetails, type SongInput, type SongSummary } from '../api'
import { parseChordPro } from '../chords/chordpro'
import { ChordSheet } from '../components/ChordSheet'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { Button, ErrorText, Field, buttonClass, errorMessage, inputClass } from '../ui'

const EMPTY: SongInput = { title: '', artist: '', originalKey: '', content: '' }

function toInput(song: SongDetails): SongInput {
  return { title: song.title, artist: song.artist ?? '', originalKey: song.originalKey ?? '', content: song.content }
}

/** Создание (/songs/new) и редактирование (/songs/:id/edit). */
export function SongEditPage() {
  const params = useParams()
  const id = params.id ? Number(params.id) : null
  const navigate = useNavigate()
  const [form, setForm] = useState<SongInput>(EMPTY)
  const [version, setVersion] = useState(0)
  const [loaded, setLoaded] = useState(id === null)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [conflict, setConflict] = useState(false)
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState<'text' | 'preview'>('text')

  async function load(songId: number) {
    try {
      const song = await api.getSong(songId)
      if (!song.canEdit) {
        setLoadError('Править эту песню может только её автор или администратор.')
        return
      }
      setForm(toInput(song))
      setVersion(song.version)
      setLoaded(true)
    } catch (e) {
      setLoadError(errorMessage(e))
    }
  }

  useEffect(() => {
    if (id !== null) void load(id)
  }, [id])

  async function reload() {
    if (id === null) return
    setConflict(false)
    setError('')
    await load(id)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setConflict(false)
    try {
      const saved = id === null ? await api.createSong(form) : await api.updateSong(id, form, version)
      navigate(`/songs/${saved.id}`, { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setConflict(true)
      else setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const set = (field: keyof SongInput) => (value: string) => setForm((f) => ({ ...f, [field]: value }))

  if (!loaded) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <ErrorText>{loadError}</ErrorText>
        {loadError && id !== null && (
          <Link to={`/songs/${id}`} className="text-accent">
            ← К песне
          </Link>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-2xl font-semibold">{id === null ? 'Новая песня' : 'Редактирование'}</h1>

      <div className="grid gap-4 sm:grid-cols-[2fr_2fr_1fr]">
        <Field label="Название" value={form.title} onChange={(e) => set('title')(e.target.value)} maxLength={255} required />
        <Field label="Исполнитель" value={form.artist} onChange={(e) => set('artist')(e.target.value)} maxLength={255} />
        <Field
          label="Тональность"
          value={form.originalKey}
          onChange={(e) => set('originalKey')(e.target.value)}
          placeholder="Am"
          maxLength={8}
          autoCapitalize="none"
          autoCorrect="off"
        />
      </div>

      {id === null && <Duplicates title={form.title} artist={form.artist} />}

      <div className="flex gap-1 rounded-xl bg-surface p-1 lg:hidden" role="tablist">
        <TabButton active={tab === 'text'} onClick={() => setTab('text')}>
          Текст
        </TabButton>
        <TabButton active={tab === 'preview'} onClick={() => setTab('preview')}>
          Превью
        </TabButton>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className={`min-w-0 ${tab === 'text' ? 'block' : 'hidden lg:block'}`}>
          <span className="mb-1.5 hidden text-sm text-fg-muted lg:block">Текст в формате ChordPro</span>
          <textarea
            value={form.content}
            onChange={(e) => set('content')(e.target.value)}
            required
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            placeholder={'{start_of_verse}\n[Am]Песен ещё не[F]написанных, [C]сколько[G]\n{end_of_verse}'}
            className={`min-h-[60dvh] resize-y py-3 font-mono text-base ${inputClass}`}
          />
        </label>
        <div className={`min-w-0 ${tab === 'preview' ? 'block' : 'hidden lg:block'}`}>
          <span className="mb-1.5 hidden text-sm text-fg-muted lg:block">Превью</span>
          <Preview content={form.content} />
        </div>
      </div>

      {conflict && (
        <div className="space-y-3 rounded-xl border border-notice-line/50 bg-notice-bg/40 p-4">
          <p>
            Песню уже изменил кто-то другой, пока ты редактировал. Загрузи актуальную версию и внеси правки заново —
            твой текст при этом пропадёт, так что при необходимости скопируй его.
          </p>
          <Button type="button" variant="secondary" onClick={reload}>
            Загрузить актуальную версию
          </Button>
        </div>
      )}
      <ErrorText>{error}</ErrorText>

      <div className="flex gap-2">
        <Button type="submit" disabled={busy}>
          {busy ? 'Сохраняем…' : 'Сохранить'}
        </Button>
        <Link to={id === null ? '/' : `/songs/${id}`} className={buttonClass('ghost')}>
          Отмена
        </Link>
      </div>
    </form>
  )
}

function Preview({ content }: { content: string }) {
  const deferred = useDeferredValue(content)
  const parsed = useMemo(() => parseChordPro(deferred), [deferred])
  return (
    <div className="min-h-[60dvh] rounded-xl border border-line px-4 py-3 text-lg">
      {!deferred.trim() ? (
        <p className="text-fg-subtle">Здесь появится песня.</p>
      ) : parsed.song ? (
        <ChordSheet song={parsed.song} />
      ) : (
        <ErrorText>{parsed.error}</ErrorText>
      )}
    </div>
  )
}

function Duplicates({ title, artist }: { title: string; artist: string }) {
  // Строка, а не объект: debounce сравнивает значения по ссылке.
  const query = useDebouncedValue(JSON.stringify([title.trim(), artist.trim()]), 400)
  const [duplicates, setDuplicates] = useState<SongSummary[]>([])

  useEffect(() => {
    const [debouncedTitle, debouncedArtist] = JSON.parse(query) as [string, string]
    if (!debouncedTitle) {
      setDuplicates([])
      return
    }
    let cancelled = false
    api
      .findDuplicates(debouncedTitle, debouncedArtist)
      .then((found) => !cancelled && setDuplicates(found))
      .catch(() => !cancelled && setDuplicates([]))
    return () => {
      cancelled = true
    }
  }, [query])

  if (duplicates.length === 0) return null
  return (
    <div className="rounded-xl border border-notice-line/50 bg-notice-bg/40 p-4">
      <p className="mb-2">Возможно, такая песня уже есть:</p>
      <ul className="space-y-1">
        {duplicates.map((song) => (
          <li key={song.id}>
            {/* в новой вкладке, чтобы не потерять набранный текст */}
            <Link to={`/songs/${song.id}`} target="_blank" rel="noopener" className="text-notice-fg underline">
              {song.title}
              {song.artist && ` — ${song.artist}`}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`min-h-10 flex-1 rounded-lg ${active ? 'bg-raised text-fg' : 'text-fg-muted'}`}
    >
      {children}
    </button>
  )
}
