import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { api, type Page, type SongSummary } from '../api'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { Button, ErrorText, buttonClass, errorMessage, inputClass } from '../ui'

export function SongsPage() {
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(() => params.get('q') ?? '')
  const q = useDebouncedValue(query.trim(), 300)
  const [result, setResult] = useState<Page<SongSummary> | null>(null)
  const [error, setError] = useState('')
  const [loadingMore, setLoadingMore] = useState(false)

  // Запрос живёт в URL, чтобы «назад» со страницы песни возвращал к тем же результатам.
  // setParams не в зависимостях: он меняется при каждом обновлении URL.
  useEffect(() => {
    setParams(q ? { q } : {}, { replace: true })
  }, [q])

  useEffect(() => {
    let cancelled = false
    setError('')
    api
      .searchSongs(q)
      .then((page) => !cancelled && setResult(page))
      .catch((e) => !cancelled && setError(errorMessage(e)))
    return () => {
      cancelled = true
    }
  }, [q])

  async function loadMore() {
    if (!result) return
    setLoadingMore(true)
    try {
      const next = await api.searchSongs(q, result.page + 1)
      setResult({ ...next, items: [...result.items, ...next.items] })
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Название или исполнитель"
          aria-label="Поиск песен"
          enterKeyHint="search"
          className={`min-h-12 flex-1 ${inputClass}`}
        />
        <Link to="/songs/import" className={buttonClass('primary', 'shrink-0')}>
          Добавить
        </Link>
      </div>

      <ErrorText>{error}</ErrorText>

      {result && result.items.length === 0 && (
        <p className="py-10 text-center text-fg-subtle">
          {q ? 'Ничего не нашлось.' : 'Песен пока нет — добавь первую.'}
        </p>
      )}

      {result && result.items.length > 0 && (
        <ul className="divide-y divide-line">
          {result.items.map((song) => (
            <li key={song.id}>
              <Link to={`/songs/${song.id}`} className="flex min-h-14 items-center gap-3 py-3 hover:bg-surface/60">
                <span className="min-w-0 flex-1 truncate text-lg">
                  <span className="font-medium">{song.title}</span>
                  {song.artist && <span className="text-fg-muted"> — {song.artist}</span>}
                </span>
                {song.originalKey && <span className="shrink-0 font-semibold text-chord">{song.originalKey}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {result?.hasNext && (
        <Button variant="secondary" onClick={loadMore} disabled={loadingMore} className="w-full">
          {loadingMore ? 'Загружаем…' : 'Показать ещё'}
        </Button>
      )}
    </div>
  )
}
