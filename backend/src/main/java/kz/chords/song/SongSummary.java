package kz.chords.song;

/**
 * Строка списка песен (без content). Отдельный top-level record, потому что его создаёт
 * JPQL constructor expression в {@link SongRepository}.
 */
public record SongSummary(Long id, String title, String artist, String originalKey, String createdBy) {
}
