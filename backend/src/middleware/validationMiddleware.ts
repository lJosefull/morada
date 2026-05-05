```typescript
import { Request, Response, NextFunction } from 'express';

export const validateRegister = (req: Request, res: Response, next: NextFunction) => {
  const { email, password, name } = req.body;
  const errors: string[] = [];

  if (!email || !email.includes('@')) {
    errors.push('Valid email is required');
  }
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  if (!name || name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      message: errors.join(', '),
      error: 'VALIDATION_ERROR'
    });
  }

  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  const errors: string[] = [];

  if (!email) {
    errors.push('Email is required');
  }
  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      message: errors.join(', '),
      error: 'VALIDATION_ERROR'
    });
  }

  next();
};

export const validateProperty = (req: Request, res: Response, next: NextFunction) => {
  const { title, price, address, city, state, zipCode } = req.body;
  const errors: string[] = [];

  if (!title || title.trim().length === 0) {
    errors.push('Title is required');
  }
  if (!price || price <= 0) {
    errors.push('Valid price is required');
  }
  if (!address || address.trim().length === 0) {
    errors.push('Address is required');
  }
  if (!city || city.trim().length === 0) {
    errors.push('City is required');
  }
  if (!state || state.trim().length === 0) {
    errors.push('State is required');
  }
  if (!zipCode || zipCode.trim().length === 0) {
    errors.push('Zip code is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      message: errors.join(', '),
      error: 'VALIDATION_ERROR'
    });
  }

  next();
};
```