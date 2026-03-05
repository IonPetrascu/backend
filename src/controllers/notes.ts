import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { AppError } from '../middleware/errorHandler';

export const getAllNotes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notes = await prisma.note.findMany({ orderBy: { createdAt: 'desc' } });
    res.status(200).json(notes);
  } catch (err) { next(err); }
};

export const getNoteById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) throw new AppError(400, 'ID должен быть числом');
    const note = await prisma.note.findUnique({ where: { id } });
    if (!note) throw new AppError(404, 'Заметка не найдена');
    res.status(200).json(note);
  } catch (err) { next(err); }
};

export const createNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, content } = req.body;
    const note = await prisma.note.create({ data: { title, content } });
    res.status(201).json(note);
  } catch (err) { next(err); }
};

export const updateNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    const { title, content } = req.body;
    const exists = await prisma.note.findUnique({ where: { id } });
    if (!exists) throw new AppError(404, 'Заметка не найдена');
    const note = await prisma.note.update({ where: { id }, data: { title, content } });
    res.status(200).json(note);
  } catch (err) { next(err); }
};

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
  } catch (err) { next(err); }
};

export const deleteNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    const exists = await prisma.note.findUnique({ where: { id } });
    if (!exists) throw new AppError(404, 'Заметка не найдена');
    await prisma.note.delete({ where: { id } });
    res.status(204).send();
  } catch (err) { next(err); }
};
