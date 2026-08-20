import { Request, Response, NextFunction } from 'express';
import { refillsService } from './refills.service';
import { sendSuccess } from '../../lib/response';

export class RefillsController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await refillsService.getAll(req.user!.userId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getByMedication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await refillsService.getByMedication(
        req.user!.userId,
        req.params.medicationId,
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async acknowledge(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await refillsService.acknowledge(req.user!.userId, req.params.medicationId);
      sendSuccess(res, { message: 'Refill warning acknowledged' });
    } catch (err) {
      next(err);
    }
  }

  async addInventory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await refillsService.addInventory(
        req.user!.userId,
        req.params.medicationId,
        req.body as { quantity: number; type?: string; note?: string },
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const refillsController = new RefillsController();
