package kz.chords.auth;

import jakarta.validation.Valid;
import kz.chords.auth.AuthDtos.ChangePasswordRequest;
import kz.chords.user.AppUser;
import kz.chords.user.AppUserRepository;
import kz.chords.user.UserDto;
import kz.chords.web.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me")
public class MeController {

    private final AppUserRepository users;
    private final PasswordEncoder passwordEncoder;

    public MeController(AppUserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public UserDto me(Authentication auth) {
        return UserDto.from(currentUser(auth));
    }

    @PostMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void changePassword(@Valid @RequestBody ChangePasswordRequest body, Authentication auth) {
        AppUser user = currentUser(auth);
        if (!passwordEncoder.matches(body.oldPassword(), user.getPasswordHash())) {
            throw ApiException.badRequest("Текущий пароль указан неверно");
        }
        user.setPasswordHash(passwordEncoder.encode(body.newPassword()));
    }

    private AppUser currentUser(Authentication auth) {
        // Сессия может пережить удалённого пользователя — отвечаем 401, а не 500.
        return users.findByUsernameIgnoreCase(auth.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Пользователь не найден"));
    }
}
