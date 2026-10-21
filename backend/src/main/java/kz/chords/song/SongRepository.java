package kz.chords.song;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface SongRepository extends JpaRepository<Song, Long> {

    /** {@code pattern} — ILIKE-шаблон с экранированием через «!» (см. {@link SongService#likePattern}). */
    @Query(value = """
            select new kz.chords.song.SongSummary(s.id, s.title, s.artist, s.originalKey, u.username)
            from Song s join s.createdBy u
            where s.title ilike :pattern escape '!' or s.artist ilike :pattern escape '!'
            order by lower(s.artist) nulls last, lower(s.title), s.id
            """,
            countQuery = """
                    select count(s) from Song s
                    where s.title ilike :pattern escape '!' or s.artist ilike :pattern escape '!'
                    """)
    Page<SongSummary> search(String pattern, Pageable pageable);

    /**
     * Песни с тем же названием (без учёта регистра и лишних пробелов). Если {@code artist} не пустой —
     * ещё и с тем же исполнителем либо без исполнителя. Аргументы уже нормализованы {@link SongService#normalize}.
     */
    @Query("""
            select new kz.chords.song.SongSummary(s.id, s.title, s.artist, s.originalKey, u.username)
            from Song s join s.createdBy u
            where lower(function('regexp_replace', trim(s.title), '\\s+', ' ', 'g')) = :title
              and (:artist = ''
                   or s.artist is null
                   or lower(function('regexp_replace', trim(s.artist), '\\s+', ' ', 'g')) = :artist)
            order by lower(s.artist) nulls last, s.id
            limit 10
            """)
    List<SongSummary> findDuplicates(String title, String artist);

    @EntityGraph(attributePaths = {"createdBy", "updatedBy"})
    Optional<Song> findWithUsersById(Long id);
}
