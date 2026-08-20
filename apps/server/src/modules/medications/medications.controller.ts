import { Request, Response, NextFunction } from 'express';
import { medicationsService } from './medications.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../lib/response';

export class MedicationsController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, page, limit } = req.query as {
        status?: string;
        page?: string;
        limit?: string;
      };

      const result = await medicationsService.list(req.user!.userId, {
        status: status as never,
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
      });

      sendSuccess(res, result.items, 200, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        hasNext: result.hasNext,
        hasPrev: result.hasPrev,
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const medication = await medicationsService.getById(req.user!.userId, req.params.id);
      sendSuccess(res, medication);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const medication = await medicationsService.create(req.user!.userId, req.body as Parameters<typeof medicationsService.create>[1]);
      sendCreated(res, medication);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const medication = await medicationsService.update(
        req.user!.userId,
        req.params.id,
        req.body as Parameters<typeof medicationsService.update>[2],
      );
      sendSuccess(res, medication);
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await medicationsService.softDelete(req.user!.userId, req.params.id);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  }
}

export const medicationsController = new MedicationsController();
