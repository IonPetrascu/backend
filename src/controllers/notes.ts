import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../middleware/errorHandler';

// ─────────────────────────────────────────────
// GET /api/v1/notes — получить все заметки
// ─────────────────────────────────────────────
export const getAllNotes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notes = await prisma.note.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(notes);
  } catch (err) {
    // Передаём ошибку в errorHandler через next(err).
    // Это стандартный способ передачи ошибок в Express —
    // вместо того чтобы обрабатывать каждую ошибку вручную.
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET /api/v1/notes/:id — получить одну заметку
// ─────────────────────────────────────────────
export const getNoteById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);

    if (isNaN(id)) {
      // Бросаем AppError — она долетит до errorHandler и вернёт правильный статус
      throw new AppError(400, 'ID должен быть числом');
    }

    const note = await prisma.note.findUnique({ where: { id } });

    if (!note) {
      throw new AppError(404, 'Заметка не найдена');
    }

    res.status(200).json(note);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// POST /api/v1/notes — создать заметку
// ─────────────────────────────────────────────
export const createNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, content } = req.body;

    const note = await prisma.note.create({
      data: { title, content },
    });

    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// PUT /api/v1/notes/:id — полное обновление
// ─────────────────────────────────────────────
export const updateNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    const { title, content } = req.body;

    const exists = await prisma.note.findUnique({ where: { id } });
    if (!exists) throw new AppError(404, 'Заметка не найдена');

    const note = await prisma.note.update({
      where: { id },
      data: { title, content },
    });

    res.status(200).json(note);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// PATCH /api/v1/notes/:id — частичное обновление
// ─────────────────────────────────────────────
export const patchNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    const { title, content } = req.body;

    const exists = await prisma.note.findUnique({ where: { id } });
    if (!exists) throw new AppError(404, 'Заметка не найдена');

    const data: { title?: string; content?: string } = {};
    if (title !== undefined) data.title = title;
    if (content !== undefined) data.content = content;

    const note = await prisma.note.update({ where: { id }, data });

    res.status(200).json(note);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// DELETE /api/v1/notes/:id — удалить заметку
// ─────────────────────────────────────────────
export const deleteNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);

    const exists = await prisma.note.findUnique({ where: { id } });
    if (!exists) throw new AppError(404, 'Заметка не найдена');

    await prisma.note.delete({ where: { id } });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
