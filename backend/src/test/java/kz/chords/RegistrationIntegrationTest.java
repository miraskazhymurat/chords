package kz.chords;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import jakarta.servlet.http.Cookie;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import kz.chords.auth.Invite;
import kz.chords.auth.InviteRepository;
import kz.chords.user.AppUser;
import kz.chords.user.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.ResultActions;

class RegistrationIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private InviteRepository invites;

    private AppUser admin;
    private Cookie adminSession;

    @BeforeEach
    void setUp() throws Exception {
        admin = createUser("admin", "admin-pass", Role.ADMIN);
        adminSession = login("admin", "admin-pass");
    }

    @Test
    void registerWithValidInvite() throws Exception {
        String response = postJson("/api/admin/invites", "", adminSession)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.url").value(org.hamcrest.Matchers.startsWith("/register?code=")))
                .andReturn().getResponse().getContentAsString();
        String code = JsonPath.read(response, "$.code");

        Cookie session = sessionCookie(register("bob", "bob-password", code)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("bob"))
                .andExpect(jsonPath("$.role").value("USER")));

        // Сразу после регистрации пользователь залогинен.
        mvc.perform(get("/api/me").cookie(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("bob"));
        Invite invite = invites.findByCode(code).orElseThrow();
        assertThat(invite.isUsed()).isTrue();
        attemptLogin("bob", "bob-password").andExpect(status().isOk());
    }

    @Test
    void alreadyUsedInviteIsRejected() throws Exception {
        String code = invites.save(new Invite("used-code", admin, Instant.now().plus(7, ChronoUnit.DAYS))).getCode();
        register("bob", "bob-password", code).andExpect(status().isOk());

        register("carol", "carol-password", code)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Приглашение уже использовано"));
        assertThat(users.findByUsernameIgnoreCase("carol")).isEmpty();
    }

    @Test
    void expiredInviteIsRejected() throws Exception {
        String code = invites.save(new Invite("expired-code", admin, Instant.now().minus(1, ChronoUnit.HOURS))).getCode();

        register("bob", "bob-password", code)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Срок действия приглашения истёк"));
        assertThat(users.findByUsernameIgnoreCase("bob")).isEmpty();
        assertThat(invites.findByCode(code).orElseThrow().isUsed()).isFalse();
    }

    @Test
    void unknownInviteIsRejected() throws Exception {
        register("bob", "bob-password", "no-such-code").andExpect(status().isBadRequest());
    }

    @Test
    void takenUsernameIsRejectedAndInviteStaysUnused() throws Exception {
        String code = invites.save(new Invite("fresh-code", admin, Instant.now().plus(7, ChronoUnit.DAYS))).getCode();

        register("Admin", "another-pass", code).andExpect(status().isConflict());
        assertThat(invites.findByCode(code).orElseThrow().isUsed()).isFalse();
    }

    private ResultActions register(String username, String password, String code) throws Exception {
        return postJson("/api/auth/register", Map.of("username", username, "password", password, "inviteCode", code));
    }
}
