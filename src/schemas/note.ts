import { z } from 'zod';

export const createNoteSchema = z.object({
  title:   z.string().min(1, 'Заголовок не может быть пустым').max(255),
  content: z.string().min(1, 'Содержимое не может быть пустым'),
});

export const updateNoteSchema = z.object({
  title:   z.string().min(1, 'Заголовок не может быть пустым').max(255),
  content: z.string().min(1, 'Содержимое не может быть пустым'),
});

export const patchNoteSchema = updateNoteSchema.partial();

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type PatchNoteInput  = z.infer<typeof patchNoteSchema>;
