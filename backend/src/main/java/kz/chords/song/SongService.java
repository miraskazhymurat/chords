package kz.chords.song;

import java.time.Clock;
import java.util.List;
import java.util.Locale;
import kz.chords.song.SongDtos.CreateSongRequest;
import kz.chords.song.SongDtos.SongDetails;
import kz.chords.song.SongDtos.UpdateSongRequest;
import kz.chords.user.AppUser;
import kz.chords.user.AppUserRepository;
import kz.chords.user.Role;
import kz.chords.web.ApiException;
import kz.chords.web.ApiExceptionHandler;
import kz.chords.web.PageDto;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SongService {

    static final int MAX_PAGE_SIZE = 100;

    private final SongRepository songs;
    private final AppUserRepository users;
    private final Clock clock;

    public SongService(SongRepository songs, AppUserRepository users, Clock clock) {
        this.songs = songs;
        this.users = users;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public PageDto<SongSummary> search(String query, int page, int size) {
        PageRequest pageRequest = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, MAX_PAGE_SIZE));
        return PageDto.from(songs.search(likePattern(query), pageRequest));
    }

    @Transactional(readOnly = true)
    public List<SongSummary> findDuplicates(String title, String artist) {
        String normalizedTitle = normalize(title);
        if (normalizedTitle.isEmpty()) {
            return List.of();
        }
        return songs.findDuplicates(normalizedTitle, normalize(artist));
    }

    @Transactional(readOnly = true)
    public SongDetails get(long id, String username) {
        return toDetails(findSong(id), currentUser(username));
    }

    @Transactional
    public SongDetails create(CreateSongRequest body, String username) {
        AppUser author = currentUser(username);
        Song song = songs.save(new Song(body.title().trim(), blankToNull(body.artist()), blankToNull(body.originalKey()),
                body.content(), author, clock.instant()));
        return toDetails(song, author);
    }

    @Transactional
    public SongDetails update(long id, UpdateSongRequest body, String username) {
        AppUser editor = currentUser(username);
        Song song = findSong(id);
        if (!canEdit(song, editor)) {
            throw ApiException.forbidden("Править песню может только её автор или администратор");
        }
        // Версия из тела сверяется вручную: @Version у загруженной сущности всегда текущая
        // и ловит только гонку между этим select и update.
        if (body.version() != song.getVersion()) {
            throw ApiException.conflict(ApiExceptionHandler.STALE_VERSION_MESSAGE);
        }
        song.update(body.title().trim(), blankToNull(body.artist()), blankToNull(body.originalKey()), body.content(),
                editor, clock.instant());
        songs.flush();
        return toDetails(song, editor);
    }

    @Transactional
    public void delete(long id, String username) {
        if (currentUser(username).getRole() != Role.ADMIN) {
            throw ApiException.forbidden("Удалять песни может только администратор");
        }
        songs.delete(findSong(id));
    }

    private Song findSong(long id) {
        return songs.findWithUsersById(id).orElseThrow(() -> ApiException.notFound("Песня не найдена"));
    }

    private AppUser currentUser(String username) {
        return users.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Пользователь не найден"));
    }

    private static boolean canEdit(Song song, AppUser user) {
        return user.getRole() == Role.ADMIN || song.getCreatedBy().getId().equals(user.getId());
    }

    private static SongDetails toDetails(Song song, AppUser user) {
        return new SongDetails(song.getId(), song.getTitle(), song.getArtist(), song.getOriginalKey(),
                song.getContent(), song.getCreatedBy().getUsername(), song.getUpdatedBy().getUsername(),
                song.getCreatedAt(), song.getUpdatedAt(), song.getVersion(),
                canEdit(song, user), user.getRole() == Role.ADMIN);
    }

    /** «  Кино  » → «кино», «Группа   крови» → «группа крови». Пустая строка для null. */
    static String normalize(String value) {
        return value == null ? "" : value.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
    }

    /** Подстрока для ILIKE: «%» и «_» из запроса ищутся буквально. */
    static String likePattern(String query) {
        String q = query == null ? "" : query.trim();
        return "%" + q.replace("!", "!!").replace("%", "!%").replace("_", "!_") + "%";
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
