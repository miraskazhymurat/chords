package kz.chords.song;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import kz.chords.user.AppUser;

@Entity
@Table(name = "song")
public class Song {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String artist;

    /** Исходный ChordPro; бэкенд его не разбирает. */
    @Column(nullable = false, columnDefinition = "text")
    private String content;

    @Column(name = "original_key", length = 8)
    private String originalKey;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private AppUser createdBy;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "updated_by", nullable = false)
    private AppUser updatedBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private long version;

    protected Song() {
    }

    public Song(String title, String artist, String originalKey, String content, AppUser author, Instant now) {
        this.createdBy = author;
        this.createdAt = now;
        update(title, artist, originalKey, content, author, now);
    }

    public void update(String title, String artist, String originalKey, String content, AppUser editor, Instant now) {
        this.title = title;
        this.artist = artist;
        this.originalKey = originalKey;
        this.content = content;
        this.updatedBy = editor;
        this.updatedAt = now;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getArtist() {
        return artist;
    }

    public String getContent() {
        return content;
    }

    public String getOriginalKey() {
        return originalKey;
    }

    public AppUser getCreatedBy() {
        return createdBy;
    }

    public AppUser getUpdatedBy() {
        return updatedBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public long getVersion() {
        return version;
    }
}
