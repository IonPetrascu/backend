import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../middleware/errorHandler';

// GET /api/boards — все доски, где текущий пользователь является участником
export const getBoards = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.session.userId!;

    const members = await prisma.boardMember.findMany({
      where: { userId },
      include: {
        board: true,
      },
      orderBy: { joinedAt: 'desc' },
    });

    const boards = members.map((m) => ({ ...m.board, role: m.role }));
    res.json(boards);
  } catch (err) {
    next(err);
  }
};

// POST /api/boards — создать доску
// Транзакция: создаём Board + сразу добавляем создателя как OWNER в BoardMember.
// Это гарантирует, что у каждой доски всегда есть хотя бы один owner.
export const createBoard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.session.userId!;
    const { title } = req.body;

    const board = await prisma.$transaction(async (tx) => {
      const board = await tx.board.create({
        data: { title, ownerId: userId },
      });
      await tx.boardMember.create({
        data: { boardId: board.id, userId, role: 'OWNER' },
      });
      return board;
    });

    res.status(201).json(board);
  } catch (err) {
    next(err);
  }
};

// GET /api/boards/:id — доска + колонки (по position asc) + карточки (по position asc)
// requireBoardRole() уже проверил, что пользователь — участник доски
export const getBoardById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);

    const board = await prisma.board.findUnique({
      where: { id },
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            cards: { orderBy: { position: 'asc' } },
          },
        },
      },
    });

    if (!board) return next(new AppError(404, 'Доска не найдена'));

    res.json({ ...board, role: res.locals.boardRole });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/boards/:id — переименовать доску (OWNER или EDITOR)
export const updateBoard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    const { title } = req.body;

    const board = await prisma.board.update({
      where: { id },
      data: { title },
    });

    res.json(board);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/boards/:id — удалить доску (только OWNER)
// onDelete: Cascade в схеме автоматически удалит BoardMember, BoardInvitation, Column, Card
export const deleteBoard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    await prisma.board.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
