package kz.chords;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
import kz.chords.user.Role;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class AuthIntegrationTest extends AbstractIntegrationTest {

    @Test
    void loginWithCorrectPasswordCreatesSession() throws Exception {
        createUser("alice", "secret-pass", Role.USER);

        Cookie session = sessionCookie(attemptLogin("alice", "secret-pass")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("alice"))
                .andExpect(jsonPath("$.role").value("USER")));

        mvc.perform(get("/api/me").cookie(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("alice"));
    }

    @Test
    void loginIsCaseInsensitiveForUsername() throws Exception {
        createUser("alice", "secret-pass", Role.USER);

        attemptLogin("ALICE", "secret-pass")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("alice"));
    }

    @Test
    void loginWithWrongPasswordReturns401() throws Exception {
        createUser("alice", "secret-pass", Role.USER);

        attemptLogin("alice", "wrong-pass").andExpect(status().isUnauthorized());
        attemptLogin("nobody", "secret-pass").andExpect(status().isUnauthorized());
    }

    @Test
    void apiWithoutSessionReturns401WithoutRedirect() throws Exception {
        mvc.perform(get("/api/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist("Location"));
    }

    @Test
    void loginWithoutCsrfTokenIsRejected() throws Exception {
        createUser("alice", "secret-pass", Role.USER);

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"alice\",\"password\":\"secret-pass\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void logoutInvalidatesSession() throws Exception {
        createUser("alice", "secret-pass", Role.USER);
        Cookie session = login("alice", "secret-pass");

        postJson("/api/auth/logout", "", session).andExpect(status().isNoContent());

        mvc.perform(get("/api/me").cookie(session)).andExpect(status().isUnauthorized());
    }
}
