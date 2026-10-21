package kz.chords.web;

import java.util.List;
import org.springframework.data.domain.Page;

/** Стабильный JSON для страницы результатов (сериализация PageImpl в Spring Data не гарантируется). */
public record PageDto<T>(List<T> items, int page, int size, long total, boolean hasNext) {

    public static <T> PageDto<T> from(Page<T> page) {
        return new PageDto<>(page.getContent(), page.getNumber(), page.getSize(), page.getTotalElements(),
                page.hasNext());
    }
}
