```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/UserRepository';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'No token provided',
        error: 'AUTHENTICATION_ERROR'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JwtPayload;
    
    const user = await UserRepository.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        message: 'User not found',
        error: 'AUTHENTICATION_ERROR'
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        message: 'Token expired',
        error: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(401).json({
      message: 'Invalid token',
      error: 'AUTHENTICATION_ERROR'
    });
  }
};
```