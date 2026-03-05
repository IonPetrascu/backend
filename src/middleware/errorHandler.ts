import { Request, Response, NextFunction } from 'express';

// Кастомный класс ошибки с HTTP статус-кодом.
// Наследуем от встроенного Error — получаем message и stack бесплатно.
// Добавляем statusCode чтобы контроллеры могли указать нужный HTTP статус.
export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    // Восстанавливаем прототип — особенность TypeScript при наследовании от Error
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Глобальный обработчик ошибок Express.
// Отличие от обычного middleware — ЧЕТЫРЕ параметра (err, req, res, next).
// Express распознаёт его по сигнатуре и вызывает только при ошибках.
// Подключается ПОСЛЕДНИМ в app.ts — после всех маршрутов.
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Если это наша AppError — используем её статус и сообщение
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  // Любая другая ошибка — логируем для себя (в консоль сервера),
  // но клиенту отдаём обезличенное сообщение.
  // Никогда не отдавай реальный текст ошибки БД пользователю —
  // он может содержать названия таблиц, структуру данных и т.д.
  console.error(err);
  res.status(500).json({ message: 'Внутренняя ошибка сервера' });
};
