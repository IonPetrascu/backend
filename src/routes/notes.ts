import { Router } from "express";
import {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  patchNote,
  deleteNote,
} from "../controllers/notes";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/requireAuth";
import {
  createNoteSchema,
  updateNoteSchema,
  patchNoteSchema,
} from "../schemas/note";

const router = Router();

router.use(requireAuth);

router.get("/", getAllNotes);
router.get("/:id", getNoteById);
router.post("/", validate(createNoteSchema), createNote);
router.put("/:id", validate(updateNoteSchema), updateNote);
router.patch("/:id", validate(patchNoteSchema), patchNote);
router.delete("/:id", deleteNote);

export default router;
