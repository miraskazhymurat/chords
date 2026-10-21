package kz.chords;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.empty;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import jakarta.servlet.http.Cookie;
import java.util.HashMap;
import java.util.Map;
import kz.chords.user.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.ResultActions;

class SongIntegrationTest extends AbstractIntegrationTest {

    private static final String CONTENT = "{title: Кукушка}\n[Am]Песен ещё не[F]написанных, [C]сколько[G]";

    private Cookie admin;
    private Cookie alice;
    private Cookie bob;

    @BeforeEach
    void setUp() throws Exception {
        createUser("admin", "admin-pass", Role.ADMIN);
        createUser("alice", "alice-pass", Role.USER);
        createUser("bob", "bob-password", Role.USER);
        admin = login("admin", "admin-pass");
        alice = login("alice", "alice-pass");
        bob = login("bob", "bob-password");
    }

    @Test
    void createAndGetSong() throws Exception {
        postJson("/api/songs", Map.of("title", "  Кукушка ", "artist", "Кино", "originalKey", "Am", "content", CONTENT),
                alice)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Кукушка"))
                .andExpect(jsonPath("$.createdBy").value("alice"))
                .andExpect(jsonPath("$.updatedBy").value("alice"))
                .andExpect(jsonPath("$.version").value(0))
                .andExpect(jsonPath("$.canEdit").value(true))
                .andExpect(jsonPath("$.canDelete").value(false));
        long id = createSong(alice, "Группа крови", "Кино");

        mvc.perform(get("/api/songs/" + id).cookie(bob))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Группа крови"))
                .andExpect(jsonPath("$.artist").value("Кино"))
                .andExpect(jsonPath("$.content").value(CONTENT))
                .andExpect(jsonPath("$.createdBy").value("alice"))
                .andExpect(jsonPath("$.canEdit").value(false))
                .andExpect(jsonPath("$.canDelete").value(false));
        mvc.perform(get("/api/songs/" + id).cookie(admin))
                .andExpect(jsonPath("$.canEdit").value(true))
                .andExpect(jsonPath("$.canDelete").value(true));
    }

    @Test
    void optionalFieldsMayBeBlank() throws Exception {
        postJson("/api/songs", Map.of("title", "Без автора", "artist", " ", "content", CONTENT), alice)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.artist").doesNotExist())
                .andExpect(jsonPath("$.originalKey").doesNotExist());
    }

    @Test
    void titleAndContentAreRequired() throws Exception {
        postJson("/api/songs", Map.of("title", " ", "content", CONTENT), alice).andExpect(status().isBadRequest());
        postJson("/api/songs", Map.of("title", "Кукушка", "content", ""), alice).andExpect(status().isBadRequest());
        postJson("/api/songs", Map.of("title", "Кукушка"), alice).andExpect(status().isBadRequest());
    }

    @Test
    void songsRequireLogin() throws Exception {
        mvc.perform(get("/api/songs")).andExpect(status().isUnauthorized());
        postJson("/api/songs", Map.of("title", "x", "content", CONTENT)).andExpect(status().isUnauthorized());
    }

    @Test
    void unknownSongReturns404() throws Exception {
        mvc.perform(get("/api/songs/999999").cookie(alice)).andExpect(status().isNotFound());
        putJson("/api/songs/999999", updateBody("x", 0), alice).andExpect(status().isNotFound());
        deleteWithCsrf("/api/songs/999999", admin).andExpect(status().isNotFound());
    }

    @Test
    void searchIsCaseInsensitiveSortedAndPaged() throws Exception {
        createSong(alice, "Звезда по имени Солнце", "Кино");
        createSong(alice, "Кукушка", "Кино");
        createSong(bob, "Батарейка", "Жуки");
        createSong(bob, "Без исполнителя", null);
        createSong(bob, "100%_правда", "Тест");

        // artist, затем title; песни без исполнителя — в конце
        mvc.perform(get("/api/songs").cookie(alice))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].title").value(contains(
                        "Батарейка", "Звезда по имени Солнце", "Кукушка", "100%_правда", "Без исполнителя")))
                .andExpect(jsonPath("$.items[0].artist").value("Жуки"))
                .andExpect(jsonPath("$.items[0].createdBy").value("bob"))
                .andExpect(jsonPath("$.items[0].content").doesNotExist())
                .andExpect(jsonPath("$.total").value(5));

        // по названию и по исполнителю, без учёта регистра (кириллица)
        mvc.perform(get("/api/songs").param("q", "КУКУ").cookie(alice))
                .andExpect(jsonPath("$.items[*].title").value(contains("Кукушка")));
        mvc.perform(get("/api/songs").param("q", " кино ").cookie(alice))
                .andExpect(jsonPath("$.items[*].title").value(contains("Звезда по имени Солнце", "Кукушка")));

        // % и _ ищутся буквально
        mvc.perform(get("/api/songs").param("q", "%_").cookie(alice))
                .andExpect(jsonPath("$.items[*].title").value(contains("100%_правда")));
        mvc.perform(get("/api/songs").param("q", "_").cookie(alice))
                .andExpect(jsonPath("$.items[*].title").value(contains("100%_правда")));

        mvc.perform(get("/api/songs").param("size", "2").param("page", "1").cookie(alice))
                .andExpect(jsonPath("$.items[*].title").value(contains("Кукушка", "100%_правда")))
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.size").value(2))
                .andExpect(jsonPath("$.total").value(5))
                .andExpect(jsonPath("$.hasNext").value(true));
    }

    @Test
    void duplicatesIgnoreCaseAndExtraSpaces() throws Exception {
        createSong(alice, "Группа  крови", "Кино");
        createSong(alice, "Группа крови", "Другая группа");
        createSong(alice, "Группа крови", null);
        createSong(alice, "Кукушка", "Кино");

        mvc.perform(get("/api/songs/duplicates").param("title", "  группа КРОВИ ").param("artist", " кино").cookie(bob))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].artist").value(contains("Кино", null)));

        // без исполнителя — все песни с таким названием
        mvc.perform(get("/api/songs/duplicates").param("title", "группа крови").cookie(bob))
                .andExpect(jsonPath("$.length()").value(3));

        mvc.perform(get("/api/songs/duplicates").param("title", "Группа").param("artist", "Кино").cookie(bob))
                .andExpect(jsonPath("$").value(empty()));
        mvc.perform(get("/api/songs/duplicates").param("title", " ").cookie(bob))
                .andExpect(jsonPath("$").value(empty()));
    }

    @Test
    void authorCanEditOwnSong() throws Exception {
        long id = createSong(alice, "Кукушка", "Кино");

        putJson("/api/songs/" + id, updateBody("Кукушка (live)", 0), alice)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Кукушка (live)"))
                .andExpect(jsonPath("$.content").value("[Em]new"))
                .andExpect(jsonPath("$.version").value(1));

        mvc.perform(get("/api/songs/" + id).cookie(bob))
                .andExpect(jsonPath("$.title").value("Кукушка (live)"))
                .andExpect(jsonPath("$.version").value(1));
    }

    @Test
    void userCannotEditOrDeleteSomeoneElsesSong() throws Exception {
        long id = createSong(alice, "Кукушка", "Кино");

        putJson("/api/songs/" + id, updateBody("Взлом", 0), bob).andExpect(status().isForbidden());
        deleteWithCsrf("/api/songs/" + id, bob).andExpect(status().isForbidden());

        mvc.perform(get("/api/songs/" + id).cookie(alice))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Кукушка"))
                .andExpect(jsonPath("$.version").value(0));
    }

    @Test
    void authorWhoIsNotAdminCannotDelete() throws Exception {
        long id = createSong(alice, "Кукушка", "Кино");

        deleteWithCsrf("/api/songs/" + id, alice).andExpect(status().isForbidden());
        mvc.perform(get("/api/songs/" + id).cookie(alice)).andExpect(status().isOk());
    }

    @Test
    void adminCanEditAndDeleteAnySong() throws Exception {
        long id = createSong(alice, "Кукушка", "Кино");

        putJson("/api/songs/" + id, updateBody("Кукушка", 0), admin)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.createdBy").value("alice"))
                .andExpect(jsonPath("$.updatedBy").value("admin"));

        deleteWithCsrf("/api/songs/" + id, admin).andExpect(status().isNoContent());
        mvc.perform(get("/api/songs/" + id).cookie(alice)).andExpect(status().isNotFound());
    }

    @Test
    void staleVersionReturns409() throws Exception {
        long id = createSong(alice, "Кукушка", "Кино");
        putJson("/api/songs/" + id, updateBody("Первая правка", 0), admin).andExpect(status().isOk());

        putJson("/api/songs/" + id, updateBody("Вторая правка", 0), alice)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").exists());

        mvc.perform(get("/api/songs/" + id).cookie(alice))
                .andExpect(jsonPath("$.title").value("Первая правка"))
                .andExpect(jsonPath("$.version").value(1));
    }

    @Test
    void updateRequiresVersion() throws Exception {
        long id = createSong(alice, "Кукушка", "Кино");

        putJson("/api/songs/" + id, Map.of("title", "Кукушка", "content", CONTENT), alice)
                .andExpect(status().isBadRequest());
    }

    private long createSong(Cookie session, String title, String artist) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("title", title);
        body.put("artist", artist);
        body.put("content", CONTENT);
        ResultActions result = postJson("/api/songs", body, session).andExpect(status().isCreated());
        return ((Number) JsonPath.read(result.andReturn().getResponse().getContentAsString(), "$.id")).longValue();
    }

    private static Map<String, Object> updateBody(String title, long version) {
        return Map.of("title", title, "artist", "Кино", "content", "[Em]new", "version", version);
    }
}
