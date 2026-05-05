```typescript
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/UserRepository';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export class AuthService {
  private static readonly ACCESS_TOKEN_EXPIRY = '15m';
  private static readonly REFRESH_TOKEN_EXPIRY = '7d';

  static async register(email: string, password: string, name: string) {
    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await UserRepository.create({
      email,
      password: hashedPassword,
      name,
      role: 'user'
    });

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    await UserRepository.saveRefreshToken(user.id, refreshToken);

    return { user, accessToken, refreshToken };
  }

  static async login(email: string, password: string) {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    await UserRepository.saveRefreshToken(user.id, refreshToken);

    return { user, accessToken, refreshToken };
  }

  static async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || 'your-refresh-secret'
      ) as TokenPayload;

      const storedToken = await UserRepository.findRefreshToken(decoded.userId, refreshToken);
      if (!storedToken) {
        throw new Error('Invalid refresh token');
      }

      const user = await UserRepository.findById(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }

      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      await UserRepository.saveRefreshToken(user.id, newRefreshToken);
      await UserRepository.removeRefreshToken(decoded.userId, refreshToken);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  static async logout(refreshToken: string) {
    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || 'your-refresh-secret'
      ) as TokenPayload;

      await UserRepository.removeRefreshToken(decoded.userId, refreshToken);
    } catch (error) {
      // Token might be expired, still consider logout successful
    }
  }

  private static generateAccessToken(user: any): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
      expiresIn: this.ACCESS_TOKEN_EXPIRY
    });
  }

  private static generateRefreshToken(user: any): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret', {
      expiresIn: this.REFRESH_TOKEN_EXPIRY
    });
  }
}
```