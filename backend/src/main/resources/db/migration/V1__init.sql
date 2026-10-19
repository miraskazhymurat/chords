-- Пользователи и инвайты
CREATE TABLE app_user (
    id            BIGSERIAL PRIMARY KEY,
    username      VARCHAR(64)  NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    role          VARCHAR(16)  NOT NULL CHECK (role IN ('USER', 'ADMIN')),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
-- логин без учёта регистра: «Miko» и «miko» — один пользователь
CREATE UNIQUE INDEX uq_app_user_username_lower ON app_user (lower(username));

CREATE TABLE invite (
    id         BIGSERIAL PRIMARY KEY,
    code       VARCHAR(64) NOT NULL UNIQUE,
    created_by BIGINT      NOT NULL REFERENCES app_user (id),
    used_by    BIGINT REFERENCES app_user (id),
    used_at    TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_invite_created_by ON invite (created_by);
CREATE INDEX idx_invite_used_by ON invite (used_by);

-- Общая библиотека песен
CREATE TABLE song (
    id           BIGSERIAL PRIMARY KEY,
    title        VARCHAR(255) NOT NULL,
    artist       VARCHAR(255),
    content      TEXT         NOT NULL,
    original_key VARCHAR(8),
    created_by   BIGINT       NOT NULL REFERENCES app_user (id),
    updated_by   BIGINT       NOT NULL REFERENCES app_user (id),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_song_created_by ON song (created_by);
CREATE INDEX idx_song_updated_by ON song (updated_by);

-- Личные теги
CREATE TABLE tag (
    id      BIGSERIAL PRIMARY KEY,
    user_id BIGINT       NOT NULL REFERENCES app_user (id),
    name    VARCHAR(64)  NOT NULL,
    CONSTRAINT uq_tag_user_name UNIQUE (user_id, name)
);

CREATE TABLE song_tag (
    song_id BIGINT NOT NULL REFERENCES song (id) ON DELETE CASCADE,
    tag_id  BIGINT NOT NULL REFERENCES tag (id) ON DELETE CASCADE,
    PRIMARY KEY (song_id, tag_id)
);
CREATE INDEX idx_song_tag_tag_id ON song_tag (tag_id);

-- Личные плейлисты
CREATE TABLE playlist (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT       NOT NULL REFERENCES app_user (id),
    name       VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_playlist_user_id ON playlist (user_id);

CREATE TABLE playlist_song (
    playlist_id BIGINT  NOT NULL REFERENCES playlist (id) ON DELETE CASCADE,
    song_id     BIGINT  NOT NULL REFERENCES song (id) ON DELETE CASCADE,
    position    INTEGER NOT NULL,
    PRIMARY KEY (playlist_id, song_id)
);
CREATE INDEX idx_playlist_song_song_id ON playlist_song (song_id);

-- История исполнений
CREATE TABLE play_event (
    id        BIGSERIAL PRIMARY KEY,
    user_id   BIGINT      NOT NULL REFERENCES app_user (id),
    song_id   BIGINT      NOT NULL REFERENCES song (id) ON DELETE CASCADE,
    played_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_play_event_user_played ON play_event (user_id, played_at);
CREATE INDEX idx_play_event_song_id ON play_event (song_id);

-- Spring Session JDBC (org/springframework/session/jdbc/schema-postgresql.sql)
CREATE TABLE SPRING_SESSION (
    PRIMARY_ID            CHAR(36) NOT NULL,
    SESSION_ID            CHAR(36) NOT NULL,
    CREATION_TIME         BIGINT   NOT NULL,
    LAST_ACCESS_TIME      BIGINT   NOT NULL,
    MAX_INACTIVE_INTERVAL INT      NOT NULL,
    EXPIRY_TIME           BIGINT   NOT NULL,
    PRINCIPAL_NAME        VARCHAR(100),
    CONSTRAINT SPRING_SESSION_PK PRIMARY KEY (PRIMARY_ID)
);
CREATE UNIQUE INDEX SPRING_SESSION_IX1 ON SPRING_SESSION (SESSION_ID);
CREATE INDEX SPRING_SESSION_IX2 ON SPRING_SESSION (EXPIRY_TIME);
CREATE INDEX SPRING_SESSION_IX3 ON SPRING_SESSION (PRINCIPAL_NAME);

CREATE TABLE SPRING_SESSION_ATTRIBUTES (
    SESSION_PRIMARY_ID CHAR(36)     NOT NULL,
    ATTRIBUTE_NAME     VARCHAR(200) NOT NULL,
    ATTRIBUTE_BYTES    BYTEA        NOT NULL,
    CONSTRAINT SPRING_SESSION_ATTRIBUTES_PK PRIMARY KEY (SESSION_PRIMARY_ID, ATTRIBUTE_NAME),
    CONSTRAINT SPRING_SESSION_ATTRIBUTES_FK FOREIGN KEY (SESSION_PRIMARY_ID) REFERENCES SPRING_SESSION (PRIMARY_ID) ON DELETE CASCADE
);
