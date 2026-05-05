```typescript
import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { UserRepository } from '../repositories/UserRepository';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { email, password, name } = req.body;
      const result = await AuthService.register(email, password, name);
      
      res.status(201).json({
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role
        },
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        }
      });
    } catch (error: any) {
      res.status(400).json({
        message: error.message || 'Registration failed',
        error: 'REGISTRATION_ERROR'
      });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      
      res.json({
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role
        },
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        }
      });
    } catch (error: any) {
      res.status(401).json({
        message: error.message || 'Invalid credentials',
        error: 'AUTHENTICATION_ERROR'
      });
    }
  }

  static async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      const tokens = await AuthService.refreshToken(refreshToken);
      
      res.json({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      });
    } catch (error: any) {
      res.status(401).json({
        message: error.message || 'Invalid refresh token',
        error: 'TOKEN_REFRESH_ERROR'
      });
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      await AuthService.logout(refreshToken);
      res.json({ message: 'Logged out successfully' });
    } catch (error: any) {
      res.status(400).json({
        message: error.message || 'Logout failed',
        error: 'LOGOUT_ERROR'
      });
    }
  }
}
```