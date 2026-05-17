# Feature Spec: Sistema de Calificación con Estrellas y Comentarios

## Resumen

Agregar un sistema de reviews (calificación + comentario) a las propiedades del marketplace inmobiliario InmobiliarIA.

---

## 1. Modelo de Datos (Prisma)

Agregar modelo `Review` al schema:

```prisma
model Review {
  id         String   @id @default(cuid())
  propertyId String
  userId     String
  rating     Int      // 1-5
  comment    String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  property Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, propertyId])  // 1 review por usuario por propiedad
  @@index([propertyId])
}
```

### Migración
```bash
cd backend
npx prisma migrate dev --name add_reviews
npx prisma generate
```

---

## 2. Arquitectura Backend (DDD Lite)

Siguiendo la estructura existente:

### 2.1 Domain Layer

**`src/domain/reviews/review.entity.ts`**
```typescript
export interface IReview {
  id: string;
  propertyId: string;
  userId: string;
  rating: number;  // 1-5
  comment: string;
  createdAt: Date;
  updatedAt: Date;
  user?: { id: string; name: string; email: string; phone?: string };
}

export type CreateReviewInput = {
  propertyId: string;
  userId: string;
  rating: number;
  comment: string;
};

export type ReviewStats = {
  average: number;
  total: number;
  distribution: Record<number, number>;  // { 1: X, 2: Y, 3: Z, 4: W, 5: V }
};
```

**`src/domain/reviews/review.repository.ts`**
```typescript
export const REVIEW_REPOSITORY = 'REVIEW_REPOSITORY';

export interface IReviewRepository {
  findByProperty(propertyId: string, skip?: number, take?: number): Promise<[IReview[], number]>;
  findByUserAndProperty(userId: string, propertyId: string): Promise<IReview | null>;
  create(input: CreateReviewInput): Promise<IReview>;
  update(id: string, input: { rating: number; comment: string }): Promise<IReview>;
  delete(id: string): Promise<void>;
  getStats(propertyId: string): Promise<ReviewStats>;
  hasUserInquired(userId: string, propertyId: string): Promise<boolean>;
}
```

### 2.2 Application Layer

**`src/application/reviews/reviews.service.ts`**
```typescript
@Injectable()
export class ReviewsService {
  constructor(
    @Inject(REVIEW_REPOSITORY)
    private readonly reviewRepository: IReviewRepository,
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: IPropertyRepository,
  ) {}

  // GET /api/properties/:id/reviews - público
  async findAll(propertyId: string, page?: number, limit?: number) { ... }

  // POST /api/properties/:id/reviews - Bearer, 1 por usuario
  async create(propertyId: string, userId: string, dto: CreateReviewDto) {
    // Validar propiedad existe
    // Validar rating 1-5
    // Validar que el usuario NO es el dueño de la propiedad
    // Validar que el usuario NO ha dejado review antes (unique constraint)
    // Opcional: validar que el usuario ha contactado al vendedor (inquiry)
  }

  // PATCH /api/properties/:id/reviews/mine - Bearer, editar mi review
  async update(propertyId: string, userId: string, dto: UpdateReviewDto) { ... }

  // DELETE /api/properties/:id/reviews/mine - Bearer, eliminar mi review
  async remove(propertyId: string, userId: string) { ... }

  // GET /api/properties/:id/reviews/stats - público
  async getStats(propertyId: string) {
    // Validar propiedad existe
    // Retornar { average, total, distribution }
  }
}
```

### 2.3 Infrastructure Layer

**`src/infrastructure/database/prisma-review.repository.ts`**
Implementar `IReviewRepository` usando PrismaService. Seguir el mismo patrón que `prisma-favorite.repository.ts`.

### 2.4 Interfaces Layer

**`src/interfaces/reviews/reviews.controller.ts`**

| Método  | Ruta                                       | Auth     | Descripción                        |
|---------|--------------------------------------------|----------|-------------------------------------|
| GET     | /api/properties/:propertyId/reviews        | Público  | Lista de reviews paginada           |
| GET     | /api/properties/:propertyId/reviews/stats  | Público  | Estadísticas de reviews             |
| POST    | /api/properties/:propertyId/reviews        | Bearer   | Crear review (1 por usuario)        |
| PATCH   | /api/properties/:propertyId/reviews/mine   | Bearer   | Editar mi review                    |
| DELETE  | /api/properties/:propertyId/reviews/mine   | Bearer   | Eliminar mi review                  |

**`src/interfaces/reviews/reviews.dto.ts`**
```typescript
export class CreateReviewDto {
  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiProperty({ example: 'Excelente propiedad, muy recomendada...' })
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  comment!: string;
}

export class UpdateReviewDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  comment?: string;
}
```

### 2.5 App Module Registration

En `app.module.ts`:
- Importar `ReviewsController` en controllers
- Importar `ReviewsService` en providers
- Agregar `REVIEW_REPOSITORY` provider en `PrismaModule` (infrastructure)

### 2.6 Rate Limiting & Validation

- POST/PATCH endpoints: protegidos con rate limiting estándar (ya configurado globalmente)
- Validación con class-validator + ValidationPipe (ya configurado globalmente)
- Response DTOs para Swagger (opcional pero recomendado)

---

## 3. Endpoints API Completo

### 3.1 GET /api/properties/:propertyId/reviews

**Response:**
```json
{
  "data": [
    {
      "id": "clx...",
      "propertyId": "clx...",
      "userId": "clx...",
      "user": { "id": "clx...", "name": "Juan Pérez" },
      "rating": 4,
      "comment": "Excelente propiedad, muy bien ubicada...",
      "createdAt": "2026-05-17T00:00:00.000Z",
      "updatedAt": "2026-05-17T00:00:00.000Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 10
}
```

### 3.2 GET /api/properties/:propertyId/reviews/stats

**Response:**
```json
{
  "average": 4.2,
  "total": 25,
  "distribution": {
    "5": 12,
    "4": 8,
    "3": 3,
    "2": 1,
    "1": 1
  }
}
```

### 3.3 POST /api/properties/:propertyId/reviews

**Request (Bearer token):**
```json
{
  "rating": 4,
  "comment": "Muy buena propiedad, excelente ubicación."
}
```
**Validaciones:**
- Rating: 1-5 (integer)
- Comment: 10-1000 caracteres
- Propiedad debe existir
- Usuario no puede review su propia propiedad
- Máximo 1 review por usuario por propiedad
- Opcional: usuario debe haber contactado al vendedor (tener inquiry)

### 3.4 PATCH /api/properties/:propertyId/reviews/mine

Editar rating y/o comment de mi review existente.

### 3.5 DELETE /api/properties/:propertyId/reviews/mine

Eliminar mi review.

---

## 4. Frontend

### 4.1 Nuevos Componentes

#### ⭐ StarRating (Componente compartido)
- Props: `rating: number`, `size?: 'sm' | 'md' | 'lg'`, `interactive?: boolean`, `onChange?: (rating: number) => void`
- Display mode: muestra estrellas llenas/vacías según rating
- Input mode: click para seleccionar, hover preview
- Usar SVG inline de estrella (como el ícono de favorito)

#### 📝 ReviewSection (Sección en PropertyDetailPage)
- Muestra el promedio de estrellas grande
- Muestra la distribución de estrellas con barras de progreso (como Google Maps)
  - 5 ★: [████████░░] 48%
  - 4 ★: [██████░░░░] 32%
  - 3 ★: [██░░░░░░░░] 12%
  - 2 ★: [░░░░░░░░░░] 4%
  - 1 ★: [░░░░░░░░░░] 4%
- Muestra lista de reviews con usuario, fecha, rating, comentario
- Paginación de reviews
- "Comentarios destacados" (reviews de 4-5 estrellas con más recientes primero)

#### ✍️ ReviewForm (Formulario para dejar review)
- Solo visible para usuarios autenticados
- StarRating interactivo
- Textarea para comentario
- Validación: rating requerido, comment 10-1000 caracteres
- Botón "Enviar Review"
- Mostrar toast/feedback después de enviar
- Si ya dejó review: mostrar "Editar review" o "Eliminar review"

### 4.2 Modificaciones a PropertyDetailPage

- **En sidebar** (donde está el contacto): agregar sección de reviews con promedio estelar y enlace "Ver reseñas"
- **Debajo de la descripción**: agregar sección completa de reviews (ReviewSection)
- **Al final de la página**: agregar ReviewForm para usuarios autenticados
- **En PropertyCard**: opcionalmente mostrar rating promedio (feature menor, post-MVP)

### 4.3 Nuevos tipos en frontend

```typescript
export interface Review {
  id: string;
  propertyId: string;
  userId: string;
  user?: { id: string; name: string };
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStats {
  average: number;
  total: number;
  distribution: Record<string, number>;
}
```

### 4.4 API Calls

```typescript
// En api.ts o un nuevo archivo lib/reviews.ts o usar api directamente
const reviewsApi = {
  getReviews: (propertyId: string, page?: number, limit?: number) =>
    api.get(`/properties/${propertyId}/reviews`, { params: { page, limit } }),
  getReviewStats: (propertyId: string) =>
    api.get(`/properties/${propertyId}/reviews/stats`),
  createReview: (propertyId: string, data: { rating: number; comment: string }) =>
    api.post(`/properties/${propertyId}/reviews`, data),
  updateMyReview: (propertyId: string, data: { rating?: number; comment?: string }) =>
    api.patch(`/properties/${propertyId}/reviews/mine`, data),
  deleteMyReview: (propertyId: string) =>
    api.delete(`/properties/${propertyId}/reviews/mine`),
  getMyReview: (propertyId: string) =>
    api.get(`/properties/${propertyId}/reviews/mine`),
};
```

---

## 5. Validación: Usuario debe haber contactado al vendedor

Esta es una validación **opcional** que se puede activar/desactivar. El flujo:

1. Cuando un usuario autenticado intenta crear un review:
2. Se verifica si existe un Inquiry donde `inquiry.userId === userId` Y `inquiry.propertyId === propertyId`
3. Si NO existe → responder 403 "Debes contactar al vendedor antes de dejar una reseña"

Para implementar esto, el `IReviewRepository` necesita un método `hasUserInquired(userId, propertyId)` que haga la consulta directa a la tabla Inquiry (o se puede inyectar el InquiryService/InquiryRepository).

---

## 6. Test Plan

### Backend Tests (Unitarios con Jest)

1. **ReviewsService.create()**
   - ✅ Crea review exitosamente
   - ❌ Propiedad no existe → 404
   - ❌ Usuario es dueño → 403
   - ❌ Usuario ya dejó review → 409
   - ❌ Rating inválido (< 1 o > 5) → 400
   - ❌ Comment muy corto (< 10 chars) → 400
   - ❌ Comment muy largo (> 1000 chars) → 400
   - ❌ (Opcional) Usuario no ha contactado → 403

2. **ReviewsService.findAll()**
   - ✅ Retorna reviews paginados
   - ✅ Propiedad sin reviews → data vacío

3. **ReviewsService.getStats()**
   - ✅ Retorna average, total, distribution
   - ✅ Sin reviews → average 0, total 0, distribution vacío

4. **ReviewsService.update() / delete()**
   - ✅ Usuario puede editar/eliminar su propio review
   - ❌ Usuario no puede editar/eliminar review de otro

### Frontend Tests (si se configura testing)

- StarRating renderiza correctas estrellas
- ReviewSection muestra stats correctamente
- ReviewForm valida campos

---

## 7. Orden de Implementación

1. **Backend primero**: modelo Prisma → domain entities → repository → infrastructure → service → controller → app.module
2. **Frontend después**: types → componentes → integrar en PropertyDetailPage
3. **QA**: tests de integración + manual

---

## 8. Archivos a Modificar/Crear

### Backend
- ✅ `backend/prisma/schema.prisma` → agregar modelo Review
- ✅ `backend/src/domain/reviews/review.entity.ts` → CREAR
- ✅ `backend/src/domain/reviews/review.repository.ts` → CREAR
- ✅ `backend/src/infrastructure/database/prisma-review.repository.ts` → CREAR
- ✅ `backend/src/infrastructure/database/prisma.module.ts` → agregar provider
- ✅ `backend/src/application/reviews/reviews.service.ts` → CREAR
- ✅ `backend/src/interfaces/reviews/reviews.controller.ts` → CREAR
- ✅ `backend/src/interfaces/reviews/reviews.dto.ts` → CREAR
- ✅ `backend/src/app.module.ts` → agregar controller + service

### Frontend
- ✅ `frontend/src/types/index.ts` → agregar Review, ReviewStats
- ✅ `frontend/src/components/StarRating.tsx` → CREAR
- ✅ `frontend/src/components/ReviewSection.tsx` → CREAR
- ✅ `frontend/src/components/ReviewForm.tsx` → CREAR
- ✅ `frontend/src/pages/PropertyDetailPage.tsx` → modificar
