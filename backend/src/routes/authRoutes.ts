```typescript
import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validateLogin, validateRegister } from '../middleware/validationMiddleware';

const router = Router();

// POST /api/v1/auth/register - Register new user
router.post('/api/v1/auth/register', validateRegister, AuthController.register);

// POST /api/v1/auth/login - Login user
router.post('/api/v1/auth/login', validateLogin, AuthController.login);

// POST /api/v1/auth/refresh - Refresh access token
router.post('/api/v1/auth/refresh', AuthController.refreshToken);

// POST /api/v1/auth/logout - Logout user
router.post('/api/v1/auth/logout', AuthController.logout);

export default router;
```