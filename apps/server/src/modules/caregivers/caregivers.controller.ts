import { Request, Response, NextFunction } from 'express';
import { caregiversService } from './caregivers.service';
import { sendSuccess } from '../../lib/response';
import type { CaregiverPermission } from '@mediloop/shared';

export class CaregiversController {
  async invite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await caregiversService.invite(req.user!.userId, req.body as {
        email: string;
        permissions: CaregiverPermission[];
      });
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async acceptInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await caregiversService.acceptInvitation(
        (req.body as { token: string }).token,
        req.user!.userId,
      );
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async getCaregivers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await caregiversService.getCaregivers(req.user!.userId);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async getPatients(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await caregiversService.getPatients(req.user!.userId);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async getPatientMedications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await caregiversService.getPatientMedications(
        req.user!.userId,
        req.params.patientId,
      );
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async getPatientAdherence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await caregiversService.getPatientAdherence(
        req.user!.userId,
        req.params.patientId,
      );
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  async revoke(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await caregiversService.revoke(req.user!.userId, req.params.caregiverId);
      sendSuccess(res, { message: 'Caregiver access revoked' });
    } catch (err) { next(err); }
  }
}

export const caregiversController = new CaregiversController();
