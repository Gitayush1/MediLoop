import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthenticationError } from '../lib/errors';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AuthenticationError('UNAUTHORIZED', 'No token provided'));
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as {
      userId: string;
      email: string;
      role: string;
    };

    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(new AuthenticationError('TOKEN_EXPIRED', 'Access token expired'));
    } else {
      next(new AuthenticationError('TOKEN_INVALID', 'Invalid token'));
    }
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError());
    }
    if (!roles.includes(req.user.role)) {
      return next(new AuthenticationError('FORBIDDEN', 'Insufficient permissions'));
    }
    next();
  };
}

export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as {
      userId: string;
      email: string;
      role: string;
    };
    req.user = payload;
  } catch {
    // ignore invalid token for optional auth
  }

  next();
}
