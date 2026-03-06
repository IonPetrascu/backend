import { Router } from "express";
import { register, login, logout, me } from "../controllers/auth";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/requireAuth";
import { registerSchema, loginSchema } from "../schemas/auth";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, me);

export default router;
