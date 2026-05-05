```typescript
import { Router } from 'express';
import { PropertyController } from '../controllers/PropertyController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateProperty } from '../middleware/validationMiddleware';

const router = Router();

// GET /api/v1/properties - List properties with pagination
router.get('/api/v1/properties', authMiddleware, PropertyController.list);

// GET /api/v1/properties/:id - Get single property
router.get('/api/v1/properties/:id', authMiddleware, PropertyController.getById);

// POST /api/v1/properties - Create new property
router.post('/api/v1/properties', authMiddleware, validateProperty, PropertyController.create);

// PUT /api/v1/properties/:id - Update property
router.put('/api/v1/properties/:id', authMiddleware, validateProperty, PropertyController.update);

// DELETE /api/v1/properties/:id - Delete property
router.delete('/api/v1/properties/:id', authMiddleware, PropertyController.delete);

export default router;
```