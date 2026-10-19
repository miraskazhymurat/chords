import { useState, type FormEvent } from 'react'
import { api } from '../api'
import { useAuth } from '../auth'
import { Button, Card, ErrorText, Field, SuccessText, errorMessage } from '../ui'

export function ProfilePage() {
  const { user } = useAuth()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPassword2, setNewPassword2] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (newPassword !== newPassword2) {
      setError('Новые пароли не совпадают')
      return
    }
    setBusy(true)
    try {
      await api.changePassword(oldPassword, newPassword)
      setSuccess('Пароль изменён')
      setOldPassword('')
      setNewPassword('')
      setNewPassword2('')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Профиль</h1>
      <Card>
        <p className="text-neutral-400">
          Пользователь: <span className="text-neutral-100">{user?.username}</span>
        </p>
        <p className="mt-1 text-neutral-400">
          Роль: <span className="text-neutral-100">{user?.role === 'ADMIN' ? 'администратор' : 'пользователь'}</span>
        </p>
      </Card>
      <Card title="Смена пароля">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field
            label="Текущий пароль"
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <Field
            label="Новый пароль (минимум 8 символов)"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
          <Field
            label="Новый пароль ещё раз"
            type="password"
            value={newPassword2}
            onChange={(e) => setNewPassword2(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
          <ErrorText>{error}</ErrorText>
          <SuccessText>{success}</SuccessText>
          <Button type="submit" disabled={busy} className="w-full sm:w-auto">
            {busy ? 'Сохраняем…' : 'Сменить пароль'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
