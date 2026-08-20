import { Request, Response, NextFunction } from 'express';
import { dosesService } from './doses.service';
import { sendSuccess } from '../../lib/response';

export class DosesController {
  async getToday(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await dosesService.getToday(req.user!.userId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { medicationId, from, to, page, limit } = req.query as Record<string, string>;
      const result = await dosesService.getHistory(req.user!.userId, {
        medicationId,
        from,
        to,
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
      });
      sendSuccess(res, result.items, 200, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
    } catch (err) {
      next(err);
    }
  }

  async markTaken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await dosesService.markTaken(req.user!.userId, req.params.id, req.body as { takenAt?: string; notes?: string });
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async markSkipped(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await dosesService.markSkipped(req.user!.userId, req.params.id, req.body as { notes?: string });
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async snooze(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { snoozeMinutes = 15 } = req.body as { snoozeMinutes?: number };
      const result = await dosesService.snooze(req.user!.userId, req.params.id, snoozeMinutes);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getAdherence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { period } = req.query as { period?: '7d' | '30d' | '90d' };
      const result = await dosesService.getAdherence(req.user!.userId, period);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const dosesController = new DosesController();
