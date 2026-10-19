package kz.chords.user;

/** Общие правила для логинов и паролей (используются в @Pattern/@Size DTO). */
public final class CredentialRules {

    public static final int MIN_LENGTH = 8;
    public static final int MAX_LENGTH = 100;
    public static final String USERNAME_PATTERN = "^[a-zA-Z0-9_.-]{3,32}$";

    private CredentialRules() {
    }
}
