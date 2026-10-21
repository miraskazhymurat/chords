import { useCallback, useEffect, useState } from 'react'
import { api, type User } from '../api'
import { useAuth } from '../auth'
import { Button, Card, ErrorText, errorMessage } from '../ui'

export function AdminPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Админка</h1>
      <InviteCard />
      <UsersCard />
    </div>
  )
}

function InviteCard() {
  const [link, setLink] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function createInvite() {
    setBusy(true)
    setError('')
    setCopied(false)
    try {
      const invite = await api.createInvite()
      setLink(window.location.origin + invite.url)
      setExpiresAt(new Date(invite.expiresAt).toLocaleString('ru-RU'))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
    } catch {
      setError('Не удалось скопировать — выдели ссылку и скопируй вручную')
    }
  }

  return (
    <Card title="Приглашение">
      <div className="space-y-4">
        <Button onClick={createInvite} disabled={busy} className="w-full sm:w-auto">
          {busy ? 'Создаём…' : 'Создать приглашение'}
        </Button>
        {link && (
          <div className="space-y-2">
            <input
              readOnly
              value={link}
              onFocus={(e) => e.target.select()}
              className="min-h-12 w-full rounded-xl border border-line bg-canvas px-4 font-mono text-sm text-fg"
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="secondary" onClick={copy}>
                {copied ? 'Скопировано ✓' : 'Копировать ссылку'}
              </Button>
              <span className="text-sm text-fg-subtle">Одноразовая, действует до {expiresAt}</span>
            </div>
          </div>
        )}
        <ErrorText>{error}</ErrorText>
      </div>
    </Card>
  )
}

function UsersCard() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [error, setError] = useState('')
  const [reset, setReset] = useState<{ username: string; password: string } | null>(null)

  const load = useCallback(() => {
    api.listUsers().then(setUsers).catch((err) => setError(errorMessage(err)))
  }, [])

  useEffect(load, [load])

  async function resetPassword(user: User) {
    if (!window.confirm(`Сбросить пароль пользователю ${user.username}? Его текущие сессии завершатся.`)) return
    setError('')
    try {
      const { temporaryPassword } = await api.resetPassword(user.id)
      setReset({ username: user.username, password: temporaryPassword })
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <Card title="Пользователи">
      {reset && (
        <div className="mb-4 rounded-xl border border-notice-line/50 bg-notice-bg/40 p-3 text-sm">
          Временный пароль для <b>{reset.username}</b>:{' '}
          <span className="select-all font-mono text-base text-notice-fg">{reset.password}</span>
          <p className="mt-1 text-fg-muted">Покажется один раз. Передай его пользователю — пусть сменит в профиле.</p>
        </div>
      )}
      <ErrorText>{error}</ErrorText>
      <ul className="divide-y divide-line">
        {users.map((u) => (
          <li key={u.id} className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {u.username}
                {u.role === 'ADMIN' && <span className="ml-2 text-xs text-accent">админ</span>}
              </p>
              <p className="text-xs text-fg-subtle">с {new Date(u.createdAt).toLocaleDateString('ru-RU')}</p>
            </div>
            {u.id !== me?.id && (
              <Button variant="ghost" onClick={() => resetPassword(u)} className="text-sm">
                Сбросить пароль
              </Button>
            )}
          </li>
        ))}
      </ul>
    </Card>
  )
}
