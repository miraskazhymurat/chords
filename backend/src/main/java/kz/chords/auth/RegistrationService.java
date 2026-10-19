package kz.chords.auth;

import java.time.Clock;
import java.time.Instant;
import kz.chords.user.AppUser;
import kz.chords.user.AppUserRepository;
import kz.chords.user.Role;
import kz.chords.web.ApiException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RegistrationService {

    private final InviteRepository invites;
    private final AppUserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;

    public RegistrationService(InviteRepository invites, AppUserRepository users,
                               PasswordEncoder passwordEncoder, Clock clock) {
        this.invites = invites;
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.clock = clock;
    }

    @Transactional
    public AppUser register(String username, String password, String inviteCode) {
        Instant now = clock.instant();
        Invite invite = invites.findByCodeForUpdate(inviteCode.trim())
                .orElseThrow(() -> ApiException.badRequest("Приглашение не найдено"));
        if (invite.isUsed()) {
            throw ApiException.badRequest("Приглашение уже использовано");
        }
        if (invite.isExpired(now)) {
            throw ApiException.badRequest("Срок действия приглашения истёк");
        }
        if (users.existsByUsernameIgnoreCase(username)) {
            throw ApiException.conflict("Имя пользователя уже занято");
        }
        AppUser user = users.save(new AppUser(username, passwordEncoder.encode(password), Role.USER));
        invite.markUsed(user, now);
        return user;
    }
}
