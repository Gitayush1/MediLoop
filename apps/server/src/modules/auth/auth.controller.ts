import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { sendSuccess, sendCreated } from '../../lib/response';
import { BadRequestError } from '../../lib/errors';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body as {
        email: string;
        password: string;
        firstName: string;
        lastName?: string;
      });
      sendCreated(res, result);
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body as { email: string; password: string });
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body as { refreshToken: string };
      if (!refreshToken) {
        throw new BadRequestError('refreshToken is required');
      }
      const tokens = await authService.refresh(refreshToken);
      sendSuccess(res, tokens);
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body as { refreshToken?: string };
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      sendSuccess(res, { message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body as { token: string };
      if (!token) throw new BadRequestError('token is required');
      await authService.verifyEmail(token);
      sendSuccess(res, { message: 'Email verified successfully' });
    } catch (err) {
      next(err);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body as { email: string };
      await authService.forgotPassword(email);
      // Always return success to prevent email enumeration
      sendSuccess(res, {
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = req.body as { token: string; password: string };
      await authService.resetPassword(token, password);
      sendSuccess(res, { message: 'Password reset successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
