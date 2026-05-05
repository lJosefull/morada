```typescript
import { Request, Response } from 'express';
import { PropertyService } from '../services/PropertyService';

export class PropertyController {
  static async list(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      const userId = req.user?.id;

      const result = await PropertyService.list(userId, page, limit);
      
      res.json({
        data: result.properties,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to fetch properties',
        error: 'FETCH_ERROR'
      });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const property = await PropertyService.getById(id);
      
      if (!property) {
        return res.status(404).json({
          message: 'Property not found',
          error: 'NOT_FOUND'
        });
      }
      
      res.json({ data: property });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to fetch property',
        error: 'FETCH_ERROR'
      });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const propertyData = req.body;
      const userId = req.user?.id;
      
      const property = await PropertyService.create(userId, propertyData);
      res.status(201).json({ data: property });
    } catch (error: any) {
      res.status(400).json({
        message: error.message || 'Failed to create property',
        error: 'CREATION_ERROR'
      });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const propertyData = req.body;
      const userId = req.user?.id;
      
      const property = await PropertyService.update(id, userId, propertyData);
      
      if (!property) {
        return res.status(404).json({
          message: 'Property not found',
          error: 'NOT_FOUND'
        });
      }
      
      res.json({ data: property });
    } catch (error: any) {
      res.status(400).json({
        message: error.message || 'Failed to update property',
        error: 'UPDATE_ERROR'
      });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      const deleted = await PropertyService.delete(id, userId);
      
      if (!deleted) {
        return res.status(404).json({
          message: 'Property not found',
          error: 'NOT_FOUND'
        });
      }
      
      res.json({ message: 'Property deleted successfully' });
    } catch (error: any) {
      res.status(400).json({
        message: error.message || 'Failed to delete property',
        error: 'DELETION_ERROR'
      });
    }
  }
}
```