package kz.chords.admin;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import kz.chords.auth.Invite;
import kz.chords.auth.InviteRepository;
import kz.chords.user.AppUser;
import kz.chords.user.AppUserRepository;
import kz.chords.user.UserDto;
import kz.chords.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.session.FindByIndexNameSessionRepository;
import org.springframework.session.Session;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    static final Duration INVITE_TTL = Duration.ofDays(7);

    private final SecureRandom random = new SecureRandom();
    private final AppUserRepository users;
    private final InviteRepository invites;
    private final PasswordEncoder passwordEncoder;
    private final FindByIndexNameSessionRepository<? extends Session> sessions;
    private final Clock clock;

    public AdminController(AppUserRepository users, InviteRepository invites, PasswordEncoder passwordEncoder,
                           FindByIndexNameSessionRepository<? extends Session> sessions, Clock clock) {
        this.users = users;
        this.invites = invites;
        this.passwordEncoder = passwordEncoder;
        this.sessions = sessions;
        this.clock = clock;
    }

    public record InviteResponse(String code, String url, Instant expiresAt) {
    }

    public record ResetPasswordResponse(String temporaryPassword) {
    }

    @PostMapping("/invites")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public InviteResponse createInvite(Authentication auth) {
        AppUser admin = users.findByUsernameIgnoreCase(auth.getName()).orElseThrow();
        Invite invite = invites.save(new Invite(randomToken(24), admin, clock.instant().plus(INVITE_TTL)));
        return new InviteResponse(invite.getCode(), "/register?code=" + invite.getCode(), invite.getExpiresAt());
    }

    @GetMapping("/users")
    public List<UserDto> users() {
        return users.findAllByOrderByUsernameAsc().stream().map(UserDto::from).toList();
    }

    /** Ставит временный пароль (показывается админу один раз) и завершает все сессии пользователя. */
    @PostMapping("/users/{id}/reset-password")
    @Transactional
    public ResetPasswordResponse resetPassword(@PathVariable long id) {
        AppUser user = users.findById(id).orElseThrow(() -> ApiException.notFound("Пользователь не найден"));
        String temporaryPassword = randomToken(9);
        user.setPasswordHash(passwordEncoder.encode(temporaryPassword));
        sessions.findByPrincipalName(user.getUsername()).keySet().forEach(sessions::deleteById);
        return new ResetPasswordResponse(temporaryPassword);
    }

    private String randomToken(int bytes) {
        byte[] buf = new byte[bytes];
        random.nextBytes(buf);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buf);
    }
}
