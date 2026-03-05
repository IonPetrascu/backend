import { Router } from 'express';
import {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  patchNote,
  deleteNote,
} from '../controllers/notes.js';
import { validate } from '../middleware/validate.js';
import { createNoteSchema, updateNoteSchema, patchNoteSchema } from '../schemas/note.js';

const router = Router();

router.get('/',    getAllNotes);
router.get('/:id', getNoteById);
router.post('/',    validate(createNoteSchema), createNote);
router.put('/:id',  validate(updateNoteSchema), updateNote);
router.patch('/:id', validate(patchNoteSchema), patchNote);
router.delete('/:id', deleteNote);

export default router;
