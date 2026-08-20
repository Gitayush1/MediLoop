import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { sendSuccess, sendNoContent } from '../../lib/response';

export class UsersController {
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await usersService.getMe(req.user!.userId);
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await usersService.updateProfile(req.user!.userId, req.body as {
        firstName?: string;
        lastName?: string;
        dateOfBirth?: string;
        phone?: string;
        timezone?: string;
      });
      sendSuccess(res, profile);
    } catch (err) {
      next(err);
    }
  }

  async deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await usersService.deleteAccount(req.user!.userId);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  }

  async registerDevice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const device = await usersService.registerDevice(req.user!.userId, req.body as {
        pushToken: string;
        platform: string;
        deviceId: string;
      });
      sendSuccess(res, device);
    } catch (err) {
      next(err);
    }
  }
}

export const usersController = new UsersController();
