-- Оптимистичная блокировка для правок песни (@Version)
ALTER TABLE song ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

-- Поиск и проверка дубликатов без учёта регистра
CREATE INDEX idx_song_title_lower ON song (lower(title));
CREATE INDEX idx_song_artist_lower ON song (lower(artist));
