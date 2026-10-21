import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { api } from '../api'
import { useAuth } from '../auth'
import { AuthLayout } from '../Layout'
import { Button, ErrorText, Field, errorMessage } from '../ui'

export function RegisterPage() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const code = params.get('code') ?? ''
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password !== password2) {
      setError('Пароли не совпадают')
      return
    }
    setBusy(true)
    setError('')
    try {
      setUser(await api.register(username.trim(), password, code))
      navigate('/', { replace: true })
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (!code) {
    return (
      <AuthLayout title="Регистрация">
        <ErrorText>Нужна ссылка-приглашение. Попроси её у администратора.</ErrorText>
        <Link to="/login" className="mt-6 block text-center text-accent">
          Ко входу
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Регистрация">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label="Имя пользователя"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          pattern="[a-zA-Z0-9_.\-]{3,32}"
          title="3–32 символа: латиница, цифры, _ . -"
          required
        />
        <Field
          label="Пароль (минимум 8 символов)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
        <Field
          label="Пароль ещё раз"
          type="password"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
        <ErrorText>{error}</ErrorText>
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? 'Создаём…' : 'Зарегистрироваться'}
        </Button>
      </form>
      <Link to="/login" className="mt-6 block text-center text-sm text-fg-subtle">
        Уже есть аккаунт? Войти
      </Link>
    </AuthLayout>
  )
}
