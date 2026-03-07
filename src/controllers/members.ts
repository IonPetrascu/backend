import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../middleware/errorHandler';

// GET /api/boards/:id/members — список участников доски с данными пользователя
export const getMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const boardId = parseInt(req.params.id as string);

    const members = await prisma.boardMember.findMany({
      where: { boardId },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    res.json(members);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/boards/:id/members/:userId — сменить роль участника (только OWNER)
// Нельзя сменить роль самому себе и нельзя назначить роль OWNER через этот эндпоинт
export const updateMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const boardId = parseInt(req.params.id as string);
    const targetUserId = parseInt(req.params.userId as string);
    const { role } = req.body;

    if (targetUserId === req.session.userId) {
      return next(new AppError(400, 'Нельзя изменить собственную роль'));
    }

    const member = await prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId, userId: targetUserId } },
    });
    if (!member) return next(new AppError(404, 'Участник не найден'));

    // Защита: нельзя понизить роль другого владельца
    if (member.role === 'OWNER') {
      return next(new AppError(400, 'Нельзя изменить роль владельца доски'));
    }

    const updated = await prisma.boardMember.update({
      where: { boardId_userId: { boardId, userId: targetUserId } },
      data: { role },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/boards/:id/members/:userId — исключить участника (только OWNER)
// Нельзя исключить самого себя (для этого есть отдельная логика "покинуть доску")
export const removeMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const boardId = parseInt(req.params.id as string);
    const targetUserId = parseInt(req.params.userId as string);

    if (targetUserId === req.session.userId) {
      return next(new AppError(400, 'Нельзя исключить самого себя'));
    }

    const member = await prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId, userId: targetUserId } },
    });
    if (!member) return next(new AppError(404, 'Участник не найден'));

    if (member.role === 'OWNER') {
      return next(new AppError(400, 'Нельзя исключить владельца доски'));
    }

    await prisma.boardMember.delete({
      where: { boardId_userId: { boardId, userId: targetUserId } },
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
