package kz.chords.auth;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface InviteRepository extends JpaRepository<Invite, Long> {

    Optional<Invite> findByCode(String code);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select i from Invite i where i.code = :code")
    Optional<Invite> findByCodeForUpdate(String code);
}
