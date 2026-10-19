package kz.chords.user;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/** Создаёт первого ADMIN из env, если в базе ещё нет пользователей. */
@Component
public class AdminBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final AppUserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final String username;
    private final String password;

    public AdminBootstrap(AppUserRepository users, PasswordEncoder passwordEncoder,
                          @Value("${app.admin.username}") String username,
                          @Value("${app.admin.password}") String password) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.username = username;
        this.password = password;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (users.count() > 0) {
            return;
        }
        if (!StringUtils.hasText(username) || !StringUtils.hasText(password)) {
            log.warn("app_user is empty and APP_ADMIN_USERNAME/APP_ADMIN_PASSWORD are not set: no admin created");
            return;
        }
        users.save(new AppUser(username.trim(), passwordEncoder.encode(password), Role.ADMIN));
        log.info("Created initial admin '{}'", username.trim());
    }
}
