package kz.chords.song;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class SongDtos {

    static final int MAX_CONTENT_LENGTH = 100_000;

    private SongDtos() {
    }

    public record CreateSongRequest(
            @NotBlank @Size(max = 255) String title,
            @Size(max = 255) String artist,
            @Size(max = 8) String originalKey,
            @NotBlank @Size(max = MAX_CONTENT_LENGTH) String content) {
    }

    public record UpdateSongRequest(
            @NotBlank @Size(max = 255) String title,
            @Size(max = 255) String artist,
            @Size(max = 8) String originalKey,
            @NotBlank @Size(max = MAX_CONTENT_LENGTH) String content,
            @NotNull Long version) {
    }

    public record SongDetails(
            Long id,
            String title,
            String artist,
            String originalKey,
            String content,
            String createdBy,
            String updatedBy,
            Instant createdAt,
            Instant updatedAt,
            long version,
            boolean canEdit,
            boolean canDelete) {
    }
}
