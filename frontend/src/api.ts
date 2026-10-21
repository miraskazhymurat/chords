export type Role = 'USER' | 'ADMIN'

export interface User {
  id: number
  username: string
  role: Role
  createdAt: string
}

export interface Invite {
  code: string
  url: string
  expiresAt: string
}

export interface SongSummary {
  id: number
  title: string
  artist: string | null
  originalKey: string | null
  createdBy: string
}

export interface SongDetails {
  id: number
  title: string
  artist: string | null
  originalKey: string | null
  content: string
  createdBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
  version: number
  canEdit: boolean
  canDelete: boolean
}

export interface SongInput {
  title: string
  artist: string
  originalKey: string
  content: string
}

export interface Page<T> {
  items: T[]
  page: number
  size: number
  total: number
  hasNext: boolean
}

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function readCookie(name: string): string | null {
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null
}

async function ensureCsrfToken(): Promise<string> {
  let token = readCookie('XSRF-TOKEN')
  if (!token) {
    await fetch('/api/auth/csrf', { credentials: 'same-origin' })
    token = readCookie('XSRF-TOKEN')
  }
  return token ?? ''
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (UNSAFE_METHODS.has(method)) headers['X-XSRF-TOKEN'] = await ensureCsrfToken()

  const res = await fetch(url, {
    method,
    headers,
    credentials: 'same-origin',
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (!res.ok) {
    let message = `Ошибка ${res.status}`
    try {
      const problem = await res.json()
      if (problem?.detail) message = problem.detail
    } catch {
      // тело не JSON — оставляем общее сообщение
    }
    throw new ApiError(res.status, message)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const api = {
  me: () => request<User>('GET', '/api/me'),
  login: (username: string, password: string) => request<User>('POST', '/api/auth/login', { username, password }),
  register: (username: string, password: string, inviteCode: string) =>
    request<User>('POST', '/api/auth/register', { username, password, inviteCode }),
  logout: () => request<void>('POST', '/api/auth/logout'),
  changePassword: (oldPassword: string, newPassword: string) =>
    request<void>('POST', '/api/me/password', { oldPassword, newPassword }),
  createInvite: () => request<Invite>('POST', '/api/admin/invites'),
  listUsers: () => request<User[]>('GET', '/api/admin/users'),
  resetPassword: (id: number) => request<{ temporaryPassword: string }>('POST', `/api/admin/users/${id}/reset-password`),

  searchSongs: (q: string, page = 0) =>
    request<Page<SongSummary>>('GET', `/api/songs?${new URLSearchParams({ q, page: String(page) })}`),
  findDuplicates: (title: string, artist: string) =>
    request<SongSummary[]>('GET', `/api/songs/duplicates?${new URLSearchParams({ title, artist })}`),
  getSong: (id: number) => request<SongDetails>('GET', `/api/songs/${id}`),
  createSong: (song: SongInput) => request<SongDetails>('POST', '/api/songs', song),
  updateSong: (id: number, song: SongInput, version: number) =>
    request<SongDetails>('PUT', `/api/songs/${id}`, { ...song, version }),
  deleteSong: (id: number) => request<void>('DELETE', `/api/songs/${id}`),
}
