import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middleware/validate';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@mediloop/shared';
import { z } from 'zod';

const router = Router();

/**
 * @route POST /auth/register
 * @desc Register a new user
 */
router.post('/register', validate(registerSchema), authController.register.bind(authController));

/**
 * @route POST /auth/login
 * @desc Login with email/password
 */
router.post('/login', validate(loginSchema), authController.login.bind(authController));

/**
 * @route POST /auth/refresh
 * @desc Refresh access token using refresh token
 */
router.post(
  '/refresh',
  validate(z.object({ refreshToken: z.string().min(1) })),
  authController.refresh.bind(authController),
);

/**
 * @route POST /auth/logout
 * @desc Logout (revoke refresh token)
 */
router.post('/logout', authController.logout.bind(authController));

/**
 * @route POST /auth/verify-email
 * @desc Verify email address
 */
router.post(
  '/verify-email',
  validate(z.object({ token: z.string().min(1) })),
  authController.verifyEmail.bind(authController),
);

/**
 * @route POST /auth/forgot-password
 * @desc Request password reset email
 */
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  authController.forgotPassword.bind(authController),
);

/**
 * @route POST /auth/reset-password
 * @desc Reset password using token
 */
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  authController.resetPassword.bind(authController),
);

export default router;
