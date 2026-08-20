import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export type ValidationTarget = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const error = new ZodError(result.error.issues);
      next(error);
      return;
    }
    // Replace with parsed/coerced values
    req[target] = result.data as typeof req[typeof target];
    next();
  };
}
