import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import prisma from '../prisma';
import { AppError } from '../middleware/errorHandler';

// POST /api/boards/:id/invitations — пригласить пользователя по email
// Генерируем уникальный UUID-токен, который отправляется в ссылке.
// В реальном приложении здесь отправляется email — сейчас токен возвращается в ответе.
export const createInvitation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const boardId = parseInt(req.params.id as string);
    const invitedBy = req.session.userId!;
    const { email, role } = req.body;

    // Проверяем, что приглашаемый пользователь не уже участник
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const existingMember = await prisma.boardMember.findUnique({
        where: { boardId_userId: { boardId, userId: user.id } },
      });
      if (existingMember) {
        return next(new AppError(409, 'Пользователь уже является участником доски'));
      }
    }

    // Проверяем, нет ли уже pending-приглашения для этого email на эту доску
    const existingInvite = await prisma.boardInvitation.findFirst({
      where: { boardId, email, status: 'PENDING' },
    });
    if (existingInvite) {
      return next(new AppError(409, 'Приглашение для этого email уже отправлено'));
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 дней

    const invitation = await prisma.boardInvitation.create({
      data: { boardId, invitedBy, email, token, role, expiresAt },
      include: { board: { select: { title: true } } },
    });

    // TODO: здесь будет отправка email со ссылкой /invite/{token}
    res.status(201).json(invitation);
  } catch (err) {
    next(err);
  }
};

// GET /api/boards/:id/invitations — список приглашений для доски
export const getInvitations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const boardId = parseInt(req.params.id as string);

    const invitations = await prisma.boardInvitation.findMany({
      where: { boardId },
      include: {
        inviter: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(invitations);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/boards/:id/invitations/:invId — отозвать приглашение
export const revokeInvitation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const boardId = parseInt(req.params.id as string);
    const invId = parseInt(req.params.invId as string);

    const invitation = await prisma.boardInvitation.findUnique({ where: { id: invId } });
    if (!invitation || invitation.boardId !== boardId) {
      return next(new AppError(404, 'Приглашение не найдено'));
    }
    if (invitation.status !== 'PENDING') {
      return next(new AppError(400, 'Можно отозвать только pending-приглашение'));
    }

    await prisma.boardInvitation.delete({ where: { id: invId } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// GET /api/invitations — все входящие pending-приглашения для текущего пользователя
// Пользователь видит список досок, на которые его пригласили, и может принять/отклонить
export const getMyInvitations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.session.userId!;
    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!currentUser) return next(new AppError(401, 'Пользователь не найден'));

    const invitations = await prisma.boardInvitation.findMany({
      where: { email: currentUser.email, status: 'PENDING', expiresAt: { gt: new Date() } },
      include: {
        board: { select: { id: true, title: true } },
        inviter: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Не возвращаем токен — принятие/отклонение идёт через POST /invitations/:token/accept|decline
    const safe = invitations.map(({ token: _t, ...rest }) => rest);
    res.json(safe);
  } catch (err) {
    next(err);
  }
};

// GET /api/invitations/:token — публичная проверка токена (без авторизации)
// Фронтенд вызывает этот эндпоинт, чтобы показать страницу "Вас пригласили на доску X"
export const getInvitationByToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.params.token as string;

    const invitation = await prisma.boardInvitation.findUnique({
      where: { token },
      include: {
        board: { select: { id: true, title: true } },
        inviter: { select: { id: true, email: true, name: true } },
      },
    });

    if (!invitation) return next(new AppError(404, 'Приглашение не найдено'));
    if (invitation.status !== 'PENDING') {
      return next(new AppError(410, 'Приглашение уже использовано или отклонено'));
    }
    if (invitation.expiresAt < new Date()) {
      return next(new AppError(410, 'Срок действия приглашения истёк'));
    }

    // Не возвращаем токен в ответе — он уже есть у пользователя в URL
    const { token: _t, ...safe } = invitation;
    res.json(safe);
  } catch (err) {
    next(err);
  }
};

// POST /api/invitations/:token/accept — принять приглашение (нужна авторизация)
// Создаём запись в BoardMember и помечаем приглашение как ACCEPTED
export const acceptInvitation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.params.token as string;
    const userId = req.session.userId!;

    const invitation = await prisma.boardInvitation.findUnique({
      where: { token },
    });

    if (!invitation) return next(new AppError(404, 'Приглашение не найдено'));
    if (invitation.status !== 'PENDING') {
      return next(new AppError(410, 'Приглашение уже использовано'));
    }
    if (invitation.expiresAt < new Date()) {
      return next(new AppError(410, 'Срок действия приглашения истёк'));
    }

    // Проверяем, что email приглашения совпадает с email текущего пользователя
    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!currentUser || currentUser.email !== invitation.email) {
      return next(new AppError(403, 'Приглашение предназначено для другого email'));
    }

    // Проверяем, не стал ли пользователь уже участником (повторный accept)
    const alreadyMember = await prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId: invitation.boardId, userId } },
    });
    if (alreadyMember) {
      return next(new AppError(409, 'Вы уже являетесь участником этой доски'));
    }

    // Атомарно: создаём участника и обновляем статус приглашения
    await prisma.$transaction([
      prisma.boardMember.create({
        data: { boardId: invitation.boardId, userId, role: invitation.role },
      }),
      prisma.boardInvitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      }),
    ]);

    res.json({ boardId: invitation.boardId });
  } catch (err) {
    next(err);
  }
};

// POST /api/invitations/:token/decline — отклонить приглашение (нужна авторизация)
export const declineInvitation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.params.token as string;
    const userId = req.session.userId!;

    const invitation = await prisma.boardInvitation.findUnique({ where: { token } });
    if (!invitation) return next(new AppError(404, 'Приглашение не найдено'));
    if (invitation.status !== 'PENDING') {
      return next(new AppError(410, 'Приглашение уже использовано'));
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!currentUser || currentUser.email !== invitation.email) {
      return next(new AppError(403, 'Приглашение предназначено для другого email'));
    }

    await prisma.boardInvitation.update({
      where: { id: invitation.id },
      data: { status: 'DECLINED' },
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
