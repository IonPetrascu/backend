import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { getMyInvitations, getInvitationByToken, acceptInvitation, declineInvitation } from '../controllers/invitations';

const router = Router();

// GET /api/invitations — список входящих приглашений текущего пользователя (нужна авторизация)
router.get('/', requireAuth, getMyInvitations);

// GET /api/invitations/:token — публичный эндпоинт, авторизация НЕ нужна
// Фронтенд вызывает его сразу при открытии ссылки, чтобы показать название доски и роль
router.get('/:token', getInvitationByToken);

// Принятие/отклонение — нужна авторизация (пользователь должен быть залогинен)
router.post('/:token/accept', requireAuth, acceptInvitation);
router.post('/:token/decline', requireAuth, declineInvitation);

export default router;
