package kz.chords.user;

import java.time.Instant;

public record UserDto(Long id, String username, Role role, Instant createdAt) {

    public static UserDto from(AppUser user) {
        return new UserDto(user.getId(), user.getUsername(), user.getRole(), user.getCreatedAt());
    }
}
