import type { SongInput } from './api'

/** Состояние перехода из импорта в редактор: импорт только готовит поля, сохраняет редактор. */
export interface SongDraftState {
  draft: SongInput
}

// Отдельный модуль, а не SongImportPage: страницы грузятся лениво, редактору не нужен код импорта.
const IMPORT_TEXT_KEY = 'chords.importText'

/**
 * Вставленный на /songs/import текст живёт в sessionStorage, чтобы «назад» из редактора
 * возвращал к нему. Хранилище недоступно (приватный режим) — просто не сохраняем.
 */
export function loadImportText(): string {
  try {
    return sessionStorage.getItem(IMPORT_TEXT_KEY) ?? ''
  } catch {
    return ''
  }
}

export function saveImportText(text: string): void {
  try {
    if (text) sessionStorage.setItem(IMPORT_TEXT_KEY, text)
    else sessionStorage.removeItem(IMPORT_TEXT_KEY)
  } catch {
    // не сохранилось — не страшно
  }
}

/** После сохранения песни вставленный текст больше не нужен. */
export function clearImportText(): void {
  saveImportText('')
}
