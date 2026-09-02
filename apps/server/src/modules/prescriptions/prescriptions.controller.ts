import { Request, Response, NextFunction } from 'express';
import { prescriptionsService } from './prescriptions.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../lib/response';
import { BadRequestError } from '../../lib/errors';

export class PrescriptionsController {
  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new BadRequestError('No file uploaded');
      }
      const prescription = await prescriptionsService.upload(req.user!.userId, req.file as Parameters<typeof prescriptionsService.upload>[1]);
      sendCreated(res, prescription);
    } catch (err) {
      next(err);
    }
  }

  async process(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await prescriptionsService.process(req.user!.userId, req.params.id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getExtractionReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await prescriptionsService.getExtractionReview(req.user!.userId, req.params.id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async confirmMedicines(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await prescriptionsService.confirmMedicines(
        req.user!.userId,
        req.params.id,
        req.body.confirmations as Parameters<typeof prescriptionsService.confirmMedicines>[2],
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = req.query as { page?: string; limit?: string };
      const result = await prescriptionsService.list(req.user!.userId, {
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

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await prescriptionsService.getById(req.user!.userId, req.params.id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await prescriptionsService.delete(req.user!.userId, req.params.id);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  }

  async explain(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await prescriptionsService.explain(req.user!.userId, req.body as {
        medicationName: string;
        dosage?: string;
        frequency?: string;
        instructions?: string;
        duration?: string;
      });
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const prescriptionsController = new PrescriptionsController();
