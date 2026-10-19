package kz.chords.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import kz.chords.auth.AuthDtos.LoginRequest;
import kz.chords.auth.AuthDtos.RegisterRequest;
import kz.chords.user.AppUserRepository;
import kz.chords.user.UserDto;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final SessionLogin sessionLogin;
    private final RegistrationService registrationService;
    private final AppUserRepository users;

    public AuthController(SessionLogin sessionLogin, RegistrationService registrationService, AppUserRepository users) {
        this.sessionLogin = sessionLogin;
        this.registrationService = registrationService;
        this.users = users;
    }

    /** Выставляет cookie XSRF-TOKEN; SPA вызывает перед первым POST и шлёт её значение в X-XSRF-TOKEN. */
    @GetMapping("/csrf")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void csrf(CsrfToken token) {
        token.getToken();
    }

    @PostMapping("/login")
    public UserDto login(@Valid @RequestBody LoginRequest body, HttpServletRequest request, HttpServletResponse response) {
        Authentication auth = sessionLogin.login(body.username().trim(), body.password(), request, response);
        return UserDto.from(users.findByUsernameIgnoreCase(auth.getName()).orElseThrow());
    }

    @PostMapping("/register")
    public UserDto register(@Valid @RequestBody RegisterRequest body, HttpServletRequest request,
                            HttpServletResponse response) {
        var user = registrationService.register(body.username(), body.password(), body.inviteCode());
        sessionLogin.login(user.getUsername(), body.password(), request, response);
        return UserDto.from(user);
    }
}
