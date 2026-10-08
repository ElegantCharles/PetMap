import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthUserPayload {
  id: number;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'No autorizado',
    });
  }

  const token = authHeader.slice(7).trim();

  if (!token || !env.jwt.secret) {
    return res.status(401).json({
      error: 'No autorizado',
    });
  }

  try {
    const decoded = jwt.verify(token, env.jwt.secret) as JwtPayload;

    if (typeof decoded !== 'object' || decoded === null || typeof decoded.id !== 'number' || typeof decoded.email !== 'string') {
      return res.status(401).json({
        error: 'Token inválido o expirado',
      });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
    };

    return next();
  } catch {
    return res.status(401).json({
      error: 'Token inválido o expirado',
    });
  }
}
