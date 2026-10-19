package kz.chords;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import jakarta.servlet.http.Cookie;
import kz.chords.user.AppUser;
import kz.chords.user.Role;
import org.junit.jupiter.api.Test;

class AdminAccessIntegrationTest extends AbstractIntegrationTest {

    @Test
    void userGets403OnAdminApi() throws Exception {
        AppUser user = createUser("bob", "bob-password", Role.USER);
        Cookie session = login("bob", "bob-password");

        mvc.perform(get("/api/admin/users").cookie(session)).andExpect(status().isForbidden());
        postJson("/api/admin/invites", "", session).andExpect(status().isForbidden());
        postJson("/api/admin/users/" + user.getId() + "/reset-password", "", session)
                .andExpect(status().isForbidden());
    }

    @Test
    void anonymousGets401OnAdminApi() throws Exception {
        mvc.perform(get("/api/admin/users")).andExpect(status().isUnauthorized());
    }

    @Test
    void adminCanListUsersAndCreateInvites() throws Exception {
        createUser("admin", "admin-pass", Role.ADMIN);
        createUser("bob", "bob-password", Role.USER);
        Cookie session = login("admin", "admin-pass");

        mvc.perform(get("/api/admin/users").cookie(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].username").value("admin"))
                .andExpect(jsonPath("$[1].username").value("bob"))
                .andExpect(jsonPath("$[0].passwordHash").doesNotExist());
        postJson("/api/admin/invites", "", session).andExpect(status().isCreated());
    }

    @Test
    void adminResetsPasswordAndUserSessionsAreTerminated() throws Exception {
        createUser("admin", "admin-pass", Role.ADMIN);
        AppUser bob = createUser("bob", "bob-password", Role.USER);
        Cookie adminSession = login("admin", "admin-pass");
        Cookie bobSession = login("bob", "bob-password");

        String response = postJson("/api/admin/users/" + bob.getId() + "/reset-password", "", adminSession)
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String temporaryPassword = JsonPath.read(response, "$.temporaryPassword");

        mvc.perform(get("/api/me").cookie(bobSession)).andExpect(status().isUnauthorized());
        attemptLogin("bob", "bob-password").andExpect(status().isUnauthorized());
        attemptLogin("bob", temporaryPassword).andExpect(status().isOk());
    }
}
