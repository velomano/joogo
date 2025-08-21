import { Request, Response, NextFunction } from 'express';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header required' });
  }
  
  const token = authHeader.substring(7);
  
  // For development, accept any token
  if (token === process.env.DEV_TOKEN || token === 'dev-tenant') {
    // Set tenant ID for development
    (req as any).tenantId = 'dev-tenant';
    next();
  } else {
    return res.status(403).json({ error: 'Invalid token' });
  }
};
