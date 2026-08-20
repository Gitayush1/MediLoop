import { Response } from 'express';
import { ApiResponse } from '@mediloop/shared';

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: Record<string, unknown>,
): void {
  const response: ApiResponse<T> = { success: true, data };
  if (meta) response.meta = meta;
  res.status(statusCode).json(response);
}

export function sendCreated<T>(res: Response, data: T): void {
  sendSuccess(res, data, 201);
}

export function sendNoContent(res: Response): void {
  res.status(204).send();
}
