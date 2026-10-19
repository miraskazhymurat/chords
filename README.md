# Chords

Приватный сайт аккордов: общая библиотека песен, личные плейлисты, рекомендации. Вход только по приглашению.

- `backend/` — Spring Boot 3 (Java 21, Maven), PostgreSQL, Flyway, Spring Session JDBC
- `frontend/` — Vite + React + TypeScript + Tailwind

## Требования

- Java 21 (Maven ставить не нужно — есть `./mvnw`)
- Node.js 22 (`nvm use` в `frontend/`)
- Docker + Docker Compose

## Настройка

```bash
cp .env.example .env   # поменяй пароли
```

| Переменная | Назначение |
|---|---|
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | база данных |
| `POSTGRES_PORT` | порт Postgres на хосте (только 127.0.0.1), по умолчанию 5434 |
| `APP_PORT` | порт приложения на хосте, по умолчанию 8080 |
| `APP_ADMIN_USERNAME`, `APP_ADMIN_PASSWORD` | первый админ; создаётся при старте, если пользователей ещё нет |
| `COOKIE_SECURE` | `true`, если сайт работает по HTTPS |

## Запуск через Docker Compose

```bash
docker compose up -d --build
```

Открой http://localhost:8080 и войди под `APP_ADMIN_USERNAME` / `APP_ADMIN_PASSWORD`.
В админке создай приглашение и отправь ссылку другу.

Сессии хранятся в Postgres (30 дней), поэтому пересборка и рестарт `app` не разлогинивают.

## Разработка

```bash
# 1. База
docker compose up -d postgres

# 2. Бэкенд (http://localhost:8080)
cd backend
set -a; source ../.env; set +a
DB_USERNAME=$POSTGRES_USER DB_PASSWORD=$POSTGRES_PASSWORD \
  DB_URL=jdbc:postgresql://localhost:${POSTGRES_PORT:-5434}/$POSTGRES_DB \
  ./mvnw spring-boot:run

# 3. Фронтенд (http://localhost:5173, /api проксируется на :8080)
cd frontend
nvm use
npm install
npm run dev
```

## Тесты

```bash
cd backend
./mvnw verify
```

Интеграционные тесты сами поднимают Postgres через Testcontainers — нужен запущенный Docker.

## API (шаг 0)

| Метод | Путь | Доступ |
|---|---|---|
| GET | `/api/auth/csrf` | все — выдаёт cookie `XSRF-TOKEN` |
| POST | `/api/auth/login` `{username, password}` | все |
| POST | `/api/auth/register` `{username, password, inviteCode}` | все |
| POST | `/api/auth/logout` | все |
| GET | `/api/me` | вошедшие |
| POST | `/api/me/password` `{oldPassword, newPassword}` | вошедшие |
| POST | `/api/admin/invites` | ADMIN |
| GET | `/api/admin/users` | ADMIN |
| POST | `/api/admin/users/{id}/reset-password` | ADMIN |

Все изменяющие запросы требуют заголовок `X-XSRF-TOKEN` со значением cookie `XSRF-TOKEN`.
Без сессии `/api/**` отвечает 401 (без редиректа).
