import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.role || !roles.includes(req.session.role)) {
      return next(new AppError(403, 'Доступ запрещён'));
    }
    next();
  };
};
