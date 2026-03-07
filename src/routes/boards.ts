import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requireBoardRole } from '../middleware/requireBoardRole';
import { validate } from '../middleware/validate';
import {
  createBoardSchema,
  updateBoardSchema,
  updateMemberRoleSchema,
  createInvitationSchema,
  createColumnSchema,
  updateColumnSchema,
  createCardSchema,
  updateCardSchema,
} from '../schemas/board';
import { getBoards, createBoard, getBoardById, updateBoard, deleteBoard } from '../controllers/boards';
import { getMembers, updateMember, removeMember } from '../controllers/members';
import { createInvitation, getInvitations, revokeInvitation } from '../controllers/invitations';
import { createColumn, updateColumn, deleteColumn } from '../controllers/columns';
import { createCard, updateCard, deleteCard } from '../controllers/cards';

const router = Router();

// Все роуты требуют авторизации
router.use(requireAuth);

// --- Доски ---
router.get('/', getBoards);
router.post('/', validate(createBoardSchema), createBoard);

// requireBoardRole() без аргументов = любой участник
router.get('/:id', requireBoardRole(), getBoardById);
router.patch('/:id', requireBoardRole('OWNER', 'EDITOR'), validate(updateBoardSchema), updateBoard);
router.delete('/:id', requireBoardRole('OWNER'), deleteBoard);

// --- Участники ---
router.get('/:id/members', requireBoardRole(), getMembers);
router.patch('/:id/members/:userId', requireBoardRole('OWNER'), validate(updateMemberRoleSchema), updateMember);
router.delete('/:id/members/:userId', requireBoardRole('OWNER'), removeMember);

// --- Приглашения ---
router.get('/:id/invitations', requireBoardRole('OWNER'), getInvitations);
router.post('/:id/invitations', requireBoardRole('OWNER'), validate(createInvitationSchema), createInvitation);
router.delete('/:id/invitations/:invId', requireBoardRole('OWNER'), revokeInvitation);

// --- Колонки ---
router.post('/:id/columns', requireBoardRole('OWNER', 'EDITOR'), validate(createColumnSchema), createColumn);
router.patch('/:id/columns/:colId', requireBoardRole('OWNER', 'EDITOR'), validate(updateColumnSchema), updateColumn);
router.delete('/:id/columns/:colId', requireBoardRole('OWNER', 'EDITOR'), deleteColumn);

// --- Карточки ---
router.post('/:id/columns/:colId/cards', requireBoardRole('OWNER', 'EDITOR'), validate(createCardSchema), createCard);
router.patch('/:id/columns/:colId/cards/:cardId', requireBoardRole('OWNER', 'EDITOR'), validate(updateCardSchema), updateCard);
router.delete('/:id/columns/:colId/cards/:cardId', requireBoardRole('OWNER', 'EDITOR'), deleteCard);

export default router;
