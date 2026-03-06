import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return next(new AppError(401, 'Необходима авторизация'));
  }
  next();
};
