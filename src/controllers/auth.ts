import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prisma';
import { AppError } from '../middleware/errorHandler';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError(409, 'Пользователь с таким email уже существует');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    req.session.userId = user.id;
    req.session.role   = user.role;

    res.status(201).json(user);
  } catch (err) { next(err); }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError(401, 'Неверный email или пароль');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AppError(401, 'Неверный email или пароль');

    req.session.userId = user.id;
    req.session.role   = user.role;

    res.status(200).json({ id: user.id, email: user.email, role: user.role });
  } catch (err) { next(err); }
};

export const logout = (req: Request, res: Response, next: NextFunction) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('connect.sid');
    res.status(200).json({ message: 'Вы вышли из системы' });
  });
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: req.session.userId },
      select: { id: true, email: true, role: true, createdAt: true },
    });
    if (!user) throw new AppError(404, 'Пользователь не найден');
    res.status(200).json(user);
  } catch (err) { next(err); }
};
