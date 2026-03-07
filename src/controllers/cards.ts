import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../middleware/errorHandler';

// Вспомогательная функция: проверяем, что колонка принадлежит указанной доске
const verifyColumnOwnership = async (colId: number, boardId: number) => {
  const column = await prisma.column.findUnique({ where: { id: colId } });
  if (!column || column.boardId !== boardId) {
    throw new AppError(404, 'Колонка не найдена');
  }
  return column;
};

// POST /api/boards/:id/columns/:colId/cards — создать карточку
// Если position не передан — добавляем в конец колонки
export const createCard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const boardId = parseInt(req.params.id as string);
    const colId = parseInt(req.params.colId as string);
    const { title, position } = req.body;

    await verifyColumnOwnership(colId, boardId);

    let pos = position;
    if (pos === undefined) {
      const last = await prisma.card.findFirst({
        where: { columnId: colId },
        orderBy: { position: 'desc' },
      });
      pos = last ? last.position + 1 : 0;
    }

    const card = await prisma.card.create({
      data: { columnId: colId, title, position: pos },
    });

    res.status(201).json(card);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/boards/:id/columns/:colId/cards/:cardId — обновить карточку
// columnId в теле запроса позволяет переместить карточку в другую колонку (drag & drop).
// При изменении position перенумеровываем все карточки затронутых колонок,
// чтобы гарантировать последовательные позиции без пробелов и дублей.
export const updateCard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const boardId = parseInt(req.params.id as string);
    const colId = parseInt(req.params.colId as string);
    const cardId = parseInt(req.params.cardId as string);
    const { title, position, columnId: newColumnId } = req.body;

    await verifyColumnOwnership(colId, boardId);

    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card || card.columnId !== colId) {
      return next(new AppError(404, 'Карточка не найдена'));
    }

    const targetColumnId = newColumnId ?? colId;

    // Если меняется только title — простое обновление без пересортировки
    if (position === undefined && newColumnId === undefined) {
      const updated = await prisma.card.update({ where: { id: cardId }, data: { title } });
      return res.json(updated);
    }

    // Если карточку перемещают в другую колонку — проверяем принадлежность доске
    if (newColumnId !== undefined && newColumnId !== colId) {
      await verifyColumnOwnership(newColumnId, boardId);
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (targetColumnId === colId) {
        // Перемещение внутри одной колонки
        const allCards = await tx.card.findMany({
          where: { columnId: colId },
          orderBy: { position: 'asc' },
        });
        const others = allCards.filter((c) => c.id !== cardId);
        const clampedPos = Math.max(0, Math.min(position ?? 0, others.length));
        others.splice(clampedPos, 0, card);

        for (let i = 0; i < others.length; i++) {
          await tx.card.update({ where: { id: others[i].id }, data: { position: i } });
        }
      } else {
        // Перемещение в другую колонку:
        // 1. Убираем карточку из исходной колонки и перенумеровываем
        const sourceCards = await tx.card.findMany({
          where: { columnId: colId },
          orderBy: { position: 'asc' },
        });
        const sourceOthers = sourceCards.filter((c) => c.id !== cardId);
        for (let i = 0; i < sourceOthers.length; i++) {
          await tx.card.update({ where: { id: sourceOthers[i].id }, data: { position: i } });
        }

        // 2. Вставляем карточку в целевую колонку на нужную позицию
        const targetCards = await tx.card.findMany({
          where: { columnId: targetColumnId },
          orderBy: { position: 'asc' },
        });
        const clampedPos = Math.max(0, Math.min(position ?? targetCards.length, targetCards.length));
        targetCards.splice(clampedPos, 0, card);

        for (let i = 0; i < targetCards.length; i++) {
          await tx.card.update({ where: { id: targetCards[i].id }, data: { position: i } });
        }

        // Переносим карточку в целевую колонку
        await tx.card.update({ where: { id: cardId }, data: { columnId: targetColumnId } });
      }

      return tx.card.findUnique({ where: { id: cardId } });
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/boards/:id/columns/:colId/cards/:cardId — удалить карточку
export const deleteCard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const boardId = parseInt(req.params.id as string);
    const colId = parseInt(req.params.colId as string);
    const cardId = parseInt(req.params.cardId as string);

    await verifyColumnOwnership(colId, boardId);

    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card || card.columnId !== colId) {
      return next(new AppError(404, 'Карточка не найдена'));
    }

    await prisma.card.delete({ where: { id: cardId } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
