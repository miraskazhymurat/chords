package kz.chords;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
import java.util.Map;
import kz.chords.user.Role;
import org.junit.jupiter.api.Test;

class PasswordChangeIntegrationTest extends AbstractIntegrationTest {

    @Test
    void changePassword() throws Exception {
        createUser("alice", "old-password", Role.USER);
        Cookie session = login("alice", "old-password");

        postJson("/api/me/password", Map.of("oldPassword", "old-password", "newPassword", "new-password"), session)
                .andExpect(status().isNoContent());

        attemptLogin("alice", "old-password").andExpect(status().isUnauthorized());
        attemptLogin("alice", "new-password").andExpect(status().isOk());
    }

    @Test
    void wrongOldPasswordIsRejected() throws Exception {
        createUser("alice", "old-password", Role.USER);
        Cookie session = login("alice", "old-password");

        postJson("/api/me/password", Map.of("oldPassword", "not-my-password", "newPassword", "new-password"), session)
                .andExpect(status().isBadRequest());

        attemptLogin("alice", "old-password").andExpect(status().isOk());
    }

    @Test
    void tooShortNewPasswordIsRejected() throws Exception {
        createUser("alice", "old-password", Role.USER);
        Cookie session = login("alice", "old-password");

        postJson("/api/me/password", Map.of("oldPassword", "old-password", "newPassword", "short"), session)
                .andExpect(status().isBadRequest());
    }

    @Test
    void anonymousCannotChangePassword() throws Exception {
        postJson("/api/me/password", Map.of("oldPassword", "old-password", "newPassword", "new-password"))
                .andExpect(status().isUnauthorized());
    }
}
