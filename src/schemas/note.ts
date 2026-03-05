import { z } from 'zod';

// z.object() — описываем форму объекта, как interface в TypeScript.
// Только Zod не просто описывает тип — он ещё ПРОВЕРЯЕТ данные в рантайме.

// Схема для создания заметки (POST).
// Оба поля обязательны и должны быть непустыми строками.
export const createNoteSchema = z.object({
  // z.string() — должна быть строка
  // .min(1) — минимум 1 символ (запрещаем пустую строку "")
  // .max(...) — ограничиваем максимум чтобы не хранить мусор
  title:   z.string().min(1, 'Заголовок не может быть пустым').max(255),
  content: z.string().min(1, 'Содержимое не может быть пустым'),
});

// Схема для полного обновления (PUT).
// Те же правила что и при создании — оба поля обязательны.
export const updateNoteSchema = z.object({
  title:   z.string().min(1, 'Заголовок не может быть пустым').max(255),
  content: z.string().min(1, 'Содержимое не может быть пустым'),
});

// Схема для частичного обновления (PATCH).
// .partial() делает все поля необязательными (оборачивает в Optional).
// Аналог TypeScript Partial<UpdateNoteSchema>.
// Но хотя бы одно поле должно прийти — проверим это в контроллере.
export const patchNoteSchema = updateNoteSchema.partial();

// Экспортируем TypeScript типы из схем — чтобы использовать их как типы в контроллере.
// z.infer<> извлекает TypeScript тип из Zod схемы.
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type PatchNoteInput  = z.infer<typeof patchNoteSchema>;
