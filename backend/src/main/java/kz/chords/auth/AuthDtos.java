package kz.chords.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import kz.chords.user.CredentialRules;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record LoginRequest(@NotBlank String username, @NotBlank String password) {
    }

    public record RegisterRequest(
            @NotBlank
            @Pattern(regexp = CredentialRules.USERNAME_PATTERN,
                    message = "3–32 символа: латиница, цифры, «_», «.», «-»")
            String username,
            @NotBlank @Size(min = CredentialRules.MIN_LENGTH, max = CredentialRules.MAX_LENGTH) String password,
            @NotBlank String inviteCode) {
    }

    public record ChangePasswordRequest(
            @NotBlank String oldPassword,
            @NotBlank @Size(min = CredentialRules.MIN_LENGTH, max = CredentialRules.MAX_LENGTH) String newPassword) {
    }
}
