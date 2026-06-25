import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const secret = process.env.JWT_SECRET || 'supersecretjwtkeychangeinproduction12345';

  jwt.verify(token, secret, (err, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired access token' });
    }
    
    if (!decoded || !decoded.userId) {
      return res.status(403).json({ error: 'Malformed access token claims' });
    }

    req.userId = decoded.userId;
    next();
  });
}
