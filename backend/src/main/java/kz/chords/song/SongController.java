package kz.chords.song;

import jakarta.validation.Valid;
import java.util.List;
import kz.chords.song.SongDtos.CreateSongRequest;
import kz.chords.song.SongDtos.SongDetails;
import kz.chords.song.SongDtos.UpdateSongRequest;
import kz.chords.web.PageDto;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/songs")
public class SongController {

    private final SongService songService;

    public SongController(SongService songService) {
        this.songService = songService;
    }

    @GetMapping
    public PageDto<SongSummary> search(@RequestParam(defaultValue = "") String q,
                                       @RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "50") int size) {
        return songService.search(q, page, size);
    }

    @GetMapping("/duplicates")
    public List<SongSummary> duplicates(@RequestParam(defaultValue = "") String title,
                                        @RequestParam(defaultValue = "") String artist) {
        return songService.findDuplicates(title, artist);
    }

    @GetMapping("/{id}")
    public SongDetails get(@PathVariable long id, Authentication auth) {
        return songService.get(id, auth.getName());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SongDetails create(@Valid @RequestBody CreateSongRequest body, Authentication auth) {
        return songService.create(body, auth.getName());
    }

    @PutMapping("/{id}")
    public SongDetails update(@PathVariable long id, @Valid @RequestBody UpdateSongRequest body, Authentication auth) {
        return songService.update(id, body, auth.getName());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable long id, Authentication auth) {
        songService.delete(id, auth.getName());
    }
}
