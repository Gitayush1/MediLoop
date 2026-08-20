import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

export function auditLog(action: string, resource: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      await prisma.auditLog.create({
        data: {
          userId: req.user?.userId ?? null,
          action,
          resource,
          resourceId: (req.params.id as string) ?? null,
          metadata: {
            method: req.method,
            path: req.path,
            query: req.query,
          },
          ipAddress: (req.ip ?? req.socket.remoteAddress ?? 'unknown').substring(0, 45),
          userAgent: req.headers['user-agent']?.substring(0, 500),
        },
      });
    } catch (err) {
      logger.warn({ err }, 'Failed to write audit log');
    }
    next();
  };
}
