import { Router } from 'express';
import {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  patchNote,
  deleteNote,
} from '../controllers/notes';
import { validate } from '../middleware/validate';
import { createNoteSchema, updateNoteSchema, patchNoteSchema } from '../schemas/note';

const router = Router();

// GET маршруты — тела нет, валидировать нечего
router.get('/',    getAllNotes);
router.get('/:id', getNoteById);

// POST/PUT/PATCH — перед контроллером ставим validate() middleware.
// Цепочка: запрос → validate() → контроллер (только если валидация прошла)
router.post('/',    validate(createNoteSchema), createNote);
router.put('/:id',  validate(updateNoteSchema), updateNote);
router.patch('/:id', validate(patchNoteSchema), patchNote);

// DELETE — тела нет
router.delete('/:id', deleteNote);

export default router;
