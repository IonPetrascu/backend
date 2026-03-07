import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from './errorHandler';

// BoardRole hierarchy: OWNER > EDITOR > VIEWER
type BoardRoleType = 'OWNER' | 'EDITOR' | 'VIEWER';

// Middleware factory: checks that the current user is a member of the board
// AND has one of the allowed roles. If allowedRoles is empty — any member passes.
// Attaches res.locals.boardRole for use in controllers.
export const requireBoardRole = (...allowedRoles: BoardRoleType[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const boardId = parseInt(req.params.id as string);
      const userId = req.session.userId!;

      if (isNaN(boardId)) return next(new AppError(400, 'ID доски должен быть числом'));

      const member = await prisma.boardMember.findUnique({
        where: { boardId_userId: { boardId, userId } },
      });

      if (!member) return next(new AppError(403, 'Нет доступа к доске'));

      if (allowedRoles.length > 0 && !allowedRoles.includes(member.role as BoardRoleType)) {
        return next(new AppError(403, 'Недостаточно прав'));
      }

      res.locals.boardRole = member.role;
      next();
    } catch (err) {
      next(err);
    }
  };
