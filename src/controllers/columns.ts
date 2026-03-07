import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../middleware/errorHandler';

// POST /api/boards/:id/columns — создать колонку
// Если position не передан — добавляем в конец (max position + 1)
export const createColumn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const boardId = parseInt(req.params.id as string);
    const { title, position } = req.body;

    let pos = position;
    if (pos === undefined) {
      const last = await prisma.column.findFirst({
        where: { boardId },
        orderBy: { position: 'desc' },
      });
      pos = last ? last.position + 1 : 0;
    }

    const column = await prisma.column.create({
      data: { boardId, title, position: pos },
    });

    res.status(201).json(column);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/boards/:id/columns/:colId — переименовать колонку или изменить position
// position — это целевой 0-based индекс в массиве колонок после перемещения.
// Алгоритм: загружаем все колонки, переставляем в памяти, перезаписываем все позиции.
// Это гарантирует последовательные позиции (0, 1, 2...) без пробелов и дублей.
export const updateColumn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const boardId = parseInt(req.params.id as string);
    const colId = parseInt(req.params.colId as string);
    const { title, position } = req.body;

    const column = await prisma.column.findUnique({ where: { id: colId } });
    if (!column || column.boardId !== boardId) {
      return next(new AppError(404, 'Колонка не найдена'));
    }

    // Если меняется только title — простое обновление без пересортировки
    if (position === undefined) {
      const updated = await prisma.column.update({
        where: { id: colId },
        data: { title },
      });
      return res.json(updated);
    }

    // Загружаем все колонки доски, отсортированные по текущей позиции
    const allColumns = await prisma.column.findMany({
      where: { boardId },
      orderBy: { position: 'asc' },
    });

    // Убираем перемещаемую колонку из массива и вставляем на новое место
    const others = allColumns.filter((c) => c.id !== colId);
    const clampedPos = Math.max(0, Math.min(position, others.length));
    others.splice(clampedPos, 0, column);

    const updated = await prisma.$transaction(async (tx) => {
      for (let i = 0; i < others.length; i++) {
        await tx.column.update({ where: { id: others[i].id }, data: { position: i } });
      }
      return tx.column.findUnique({ where: { id: colId } });
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/boards/:id/columns/:colId — удалить колонку (Cascade удалит все карточки)
export const deleteColumn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const boardId = parseInt(req.params.id as string);
    const colId = parseInt(req.params.colId as string);

    const column = await prisma.column.findUnique({ where: { id: colId } });
    if (!column || column.boardId !== boardId) {
      return next(new AppError(404, 'Колонка не найдена'));
    }

    await prisma.column.delete({ where: { id: colId } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
