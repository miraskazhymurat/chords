import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { api } from '../api'
import { useAuth } from '../auth'
import { AuthLayout } from '../Layout'
import { Button, ErrorText, Field, errorMessage } from '../ui'

export function LoginPage() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const user = await api.login(username.trim(), password)
      setUser(user)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from && from !== '/login' ? from : '/', { replace: true })
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout title="Аккорды">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label="Имя пользователя"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          required
        />
        <Field
          label="Пароль"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <ErrorText>{error}</ErrorText>
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? 'Входим…' : 'Войти'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-neutral-500">Регистрация — только по приглашению.</p>
    </AuthLayout>
  )
}
