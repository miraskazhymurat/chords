import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import './index.css'
import { AuthProvider, GuestOnly, RequireAdmin, RequireAuth } from './auth'
import { Layout } from './Layout'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { SongsPage } from './pages/SongsPage'
import { SongPage } from './pages/SongPage'
import { SongEditPage } from './pages/SongEditPage'
import { SongImportPage } from './pages/SongImportPage'
import { ProfilePage } from './pages/ProfilePage'
import { AdminPage } from './pages/AdminPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<GuestOnly />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>
          <Route element={<RequireAuth />}>
            <Route element={<Layout />}>
              <Route index element={<SongsPage />} />
              <Route path="/songs/import" element={<SongImportPage />} />
              <Route path="/songs/new" element={<SongEditPage />} />
              <Route path="/songs/:id" element={<SongPage />} />
              <Route path="/songs/:id/edit" element={<SongEditPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route element={<RequireAdmin />}>
                <Route path="/admin" element={<AdminPage />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
