import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { api, ApiError, type SongDetails } from '../api'
import { detectKey, keyName, parseChordPro, transposeKey, transposeSong } from '../chords/chordpro'
import { ChordSheet } from '../components/ChordSheet'
import { useStoredNumber } from '../hooks/useStoredNumber'
import { useWakeLock } from '../hooks/useWakeLock'
import { Button, ErrorText, buttonClass, errorMessage } from '../ui'

const FONT_MIN = 12
const FONT_MAX = 36
const FONT_STEP = 2

export function SongPage() {
  const id = Number(useParams().id)
  const navigate = useNavigate()
  const [song, setSong] = useState<SongDetails | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setSong(null)
    setError('')
    api
      .getSong(id)
      .then((s) => !cancelled && setSong(s))
      .catch((e) => !cancelled && setError(e instanceof ApiError && e.status === 404 ? 'Песня не найдена' : errorMessage(e)))
    return () => {
      cancelled = true
    }
  }, [id])

  async function handleDelete() {
    if (!song || !window.confirm(`Удалить «${song.title}» для всех? Это не отменить.`)) return
    try {
      await api.deleteSong(song.id)
      navigate('/', { replace: true })
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  if (!song) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <ErrorText>{error}</ErrorText>
        {error && (
          <Link to="/" className="text-accent">
            ← К списку песен
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl pb-24">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">{song.title}</h1>
        {song.artist && <p className="mt-1 text-lg text-fg-muted">{song.artist}</p>}
        {(song.canEdit || song.canDelete) && (
          <div className="mt-3 flex gap-2">
            {song.canEdit && (
              <Link to={`/songs/${song.id}/edit`} className={buttonClass('secondary')}>
                Редактировать
              </Link>
            )}
            {song.canDelete && (
              <Button variant="ghost" onClick={handleDelete}>
                Удалить
              </Button>
            )}
          </div>
        )}
        <div className="mt-3">
          <ErrorText>{error}</ErrorText>
        </div>
      </header>
      <SongView song={song} />
    </div>
  )
}

function SongView({ song }: { song: SongDetails }) {
  const parsed = useMemo(() => parseChordPro(song.content), [song.content])
  const baseKey = useMemo(() => (parsed.song ? detectKey(parsed.song, song.originalKey) : null), [parsed, song.originalKey])
  const [delta, setDelta] = useState(0)
  const transposed = useMemo(
    () => (parsed.song ? transposeSong(parsed.song, delta, baseKey) : null),
    [parsed, delta, baseKey],
  )
  const [fontSize, setFontSize] = useStoredNumber('chords.fontSize', 18)
  const [keepAwake, setKeepAwake] = useState(true)
  const wakeLock = useWakeLock(keepAwake)

  // ±12 полутонов — та же тональность, поэтому держим сдвиг в пределах −11…+11.
  const shift = (step: number) => setDelta((d) => (d + step) % 12)
  const changeFont = (step: number) => setFontSize(Math.min(FONT_MAX, Math.max(FONT_MIN, fontSize + step)))
  const signedDelta = delta > 0 ? `+${delta}` : String(delta)

  return (
    <>
      {transposed ? (
        <ChordSheet song={transposed} fontSize={fontSize} />
      ) : (
        <div className="space-y-3">
          <ErrorText>Не удалось разобрать ChordPro. {parsed.error}</ErrorText>
          <pre className="overflow-x-auto font-mono whitespace-pre-wrap" style={{ fontSize: `${fontSize}px` }}>
            {song.content}
          </pre>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-canvas/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-3 py-2">
          <ToolGroup>
            <ToolButton onClick={() => shift(-1)} label="Тональность ниже" disabled={!transposed}>
              −
            </ToolButton>
            <button
              onClick={() => setDelta(0)}
              disabled={delta === 0}
              title="Вернуть исходную тональность"
              className="flex min-h-11 min-w-16 flex-col items-center justify-center rounded-lg px-1 leading-tight"
            >
              <span className="font-bold text-chord">
                {baseKey ? keyName(transposeKey(baseKey, delta)) : delta === 0 ? 'Тон' : signedDelta}
              </span>
              {baseKey && delta !== 0 && <span className="text-xs text-fg-subtle">{signedDelta}</span>}
            </button>
            <ToolButton onClick={() => shift(1)} label="Тональность выше" disabled={!transposed}>
              +
            </ToolButton>
          </ToolGroup>

          <ToolGroup>
            <ToolButton onClick={() => changeFont(-FONT_STEP)} label="Шрифт меньше" disabled={fontSize <= FONT_MIN}>
              <span className="text-sm">A−</span>
            </ToolButton>
            <ToolButton onClick={() => changeFont(FONT_STEP)} label="Шрифт больше" disabled={fontSize >= FONT_MAX}>
              <span className="text-lg">A+</span>
            </ToolButton>
          </ToolGroup>

          {wakeLock.supported && (
            <button
              onClick={() => setKeepAwake((v) => !v)}
              aria-pressed={keepAwake}
              title={keepAwake ? 'Экран не гаснет' : 'Экран гаснет как обычно'}
              className={`min-h-11 rounded-lg px-3 text-sm ${wakeLock.active ? 'bg-raised text-chord' : 'text-fg-subtle'}`}
            >
              {wakeLock.active ? 'Экран вкл' : 'Экран'}
            </button>
          )}
        </div>
      </div>
    </>
  )
}

function ToolGroup({ children }: { children: ReactNode }) {
  return <div className="flex items-center rounded-xl bg-surface">{children}</div>
}

function ToolButton({
  onClick,
  label,
  disabled,
  children,
}: {
  onClick: () => void
  label: string
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      disabled={disabled}
      className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-xl text-fg hover:bg-raised disabled:opacity-40"
    >
      {children}
    </button>
  )
}
