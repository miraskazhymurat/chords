package kz.chords;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import java.util.Map;
import kz.chords.user.AppUser;
import kz.chords.user.AppUserRepository;
import kz.chords.user.Role;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
public abstract class AbstractIntegrationTest {

    @Autowired
    protected MockMvc mvc;

    @Autowired
    protected ObjectMapper json;

    @Autowired
    protected AppUserRepository users;

    @Autowired
    protected PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcTemplate jdbc;

    @BeforeEach
    void cleanDatabase() {
        jdbc.execute("TRUNCATE song, invite, app_user, spring_session RESTART IDENTITY CASCADE");
    }

    protected AppUser createUser(String username, String password, Role role) {
        return users.save(new AppUser(username, passwordEncoder.encode(password), role));
    }

    protected ResultActions postJson(String url, Object body, Cookie... cookies) throws Exception {
        return sendJson(post(url), body, cookies);
    }

    protected ResultActions putJson(String url, Object body, Cookie... cookies) throws Exception {
        return sendJson(put(url), body, cookies);
    }

    protected ResultActions deleteWithCsrf(String url, Cookie... cookies) throws Exception {
        MockHttpServletRequestBuilder request = delete(url).with(csrf());
        if (cookies.length > 0) {
            request.cookie(cookies);
        }
        return mvc.perform(request);
    }

    private ResultActions sendJson(MockHttpServletRequestBuilder request, Object body, Cookie... cookies)
            throws Exception {
        request.with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(body));
        if (cookies.length > 0) {
            request.cookie(cookies);
        }
        return mvc.perform(request);
    }

    protected ResultActions attemptLogin(String username, String password) throws Exception {
        return postJson("/api/auth/login", Map.of("username", username, "password", password));
    }

    /** Логинится и возвращает cookie сессии Spring Session. */
    protected Cookie login(String username, String password) throws Exception {
        return sessionCookie(attemptLogin(username, password).andExpect(status().isOk()));
    }

    protected static Cookie sessionCookie(ResultActions result) {
        Cookie cookie = result.andReturn().getResponse().getCookie("SESSION");
        if (cookie == null) {
            throw new AssertionError("SESSION cookie is not set");
        }
        return cookie;
    }
}
