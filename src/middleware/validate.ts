import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Это фабрика middleware — функция, которая ВОЗВРАЩАЕТ middleware.
// Принимает Zod схему, возвращает функцию-middleware.
//
// Аналогия с фронтом: как HOC (Higher Order Component) — функция,
// которая принимает компонент и возвращает новый компонент с доп. логикой.
//
// Использование: router.post('/', validate(createNoteSchema), createNote)
//
// NextFunction — это функция next(). Вызов next() говорит Express:
// "этот middleware закончил работу, передай управление следующему"
export const validate = (schema: z.ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // schema.safeParse() проверяет данные по схеме.
    // В отличие от parse(), не бросает исключение при ошибке —
    // возвращает объект { success: true, data } или { success: false, error }
    const result = schema.safeParse(req.body);

    if (!result.success) {
      // result.error.issues — массив всех найденных ошибок валидации (в Zod v4 — .issues, не .errors).
      // Форматируем их в удобный вид для клиента.
      const errors = result.error.issues.map((e) => ({
        field:   e.path.join('.'), // какое поле: "title", "content"
        message: e.message,        // что не так: "Заголовок не может быть пустым"
      }));

      // 400 Bad Request — клиент прислал неверные данные, это его ошибка
      res.status(400).json({
        message: 'Ошибка валидации',
        errors,
      });
      return; // прерываем цепочку — до контроллера не доходим
    }

    // Валидация прошла успешно.
    // Кладём проверенные (и приведённые к типу) данные обратно в req.body.
    // Теперь в контроллере req.body гарантированно соответствует схеме.
    req.body = result.data;

    // Передаём управление следующему middleware или контроллеру
    next();
  };
};
