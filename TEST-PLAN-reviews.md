# Test Plan — Sistema de Calificación con Estrellas y Comentarios

## 1. Backend Tests (Unitarios con Jest)

### ReviewsService

#### `create()`
| # | Escenario | Status esperado | Validación |
|---|-----------|----------------|------------|
| 1 | Crear review exitosamente | 201 | Retorna el review con user, rating, comment |
| 2 | Propiedad no existe | 404 | `Property not found` |
| 3 | Usuario es el dueño de la propiedad | 403 | `You cannot review your own property` |
| 4 | Usuario ya dejó review previamente | 409 | `You have already reviewed this property` |
| 5 | Rating < 1 | 400 | Validation error |
| 6 | Rating > 5 | 400 | Validation error |
| 7 | Comment < 10 caracteres | 400 | Validation error |
| 8 | Comment > 1000 caracteres | 400 | Validation error |

#### `findAll()`
| # | Escenario | Status esperado | Validación |
|---|-----------|----------------|------------|
| 1 | Obtener reviews de propiedad existente | 200 | Retorna data[], total, page, limit |
| 2 | Propiedad no existe | 404 | `Property not found` |
| 3 | Propiedad sin reviews | 200 | data vacío, total = 0 |
| 4 | Paginación funciona | 200 | Retorna correcta página/limit |

#### `getStats()`
| # | Escenario | Status esperado | Validación |
|---|-----------|----------------|------------|
| 1 | Propiedad con múltiples reviews | 200 | average, total, distribution correctos |
| 2 | Propiedad sin reviews | 200 | average=0, total=0, distribution con ceros |
| 3 | Propiedad no existe | 404 | `Property not found` |

#### `update()`
| # | Escenario | Status esperado | Validación |
|---|-----------|----------------|------------|
| 1 | Actualizar mi review exitosamente | 200 | rating y/o comment actualizados |
| 2 | No existe mi review | 404 | `Review not found` |

#### `remove()`
| # | Escenario | Status esperado | Validación |
|---|-----------|----------------|------------|
| 1 | Eliminar mi review exitosamente | 200 | `{ deleted: true }` |
| 2 | No existe mi review | 404 | `Review not found` |

### Endpoints (Integration/E2E)

#### GET /api/properties/:id/reviews
| # | Escenario | Status esperado |
|---|-----------|----------------|
| 1 | Sin autenticación (público) | 200 |
| 2 | Propiedad inválida | 404 |

#### POST /api/properties/:id/reviews
| # | Escenario | Status esperado |
|---|-----------|----------------|
| 1 | Sin token | 401 |
| 2 | Token válido, datos correctos | 201 |
| 3 | Mismo usuario intenta 2 reviews | 409 |

#### GET /api/properties/:id/reviews/stats
| # | Escenario | Status esperado |
|---|-----------|----------------|
| 1 | Sin autenticación | 200 |
| 2 | Propiedad con reviews reales | 200 con stats correctos |

#### PATCH /api/properties/:id/reviews/mine
| # | Escenario | Status esperado |
|---|-----------|----------------|
| 1 | Actualizar rating | 200 |
| 2 | Actualizar solo comment | 200 |
| 3 | Sin token | 401 |

#### DELETE /api/properties/:id/reviews/mine
| # | Escenario | Status esperado |
|---|-----------|----------------|
| 1 | Eliminar review | 200 |
| 2 | Sin token | 401 |

---

## 2. Frontend Tests (Manual / Component)

### StarRating Component
- [ ] Renderiza 5 estrellas correctamente
- [ ] Display mode: muestra estrellas llenas según rating
- [ ] Input mode: hover preview funciona
- [ ] Input mode: click selecciona rating correcto
- [ ] Tamaños sm/md/lg funcionan
- [ ] Prop showValue muestra número

### ReviewForm Component
- [ ] Formulario create se renderiza
- [ ] Formulario edit se renderiza con datos existentes
- [ ] Validación: rating requerido (0 = error)
- [ ] Validación: comment mínimo 10 caracteres
- [ ] Validación: comment máximo 1000 caracteres
- [ ] Submit exitoso → muestra mensaje de éxito
- [ ] Submit con error → muestra mensaje de error
- [ ] Estado "sending" muestra spinner

### ReviewSection Component
- [ ] Carga y muestra stats (promedio, distribución)
- [ ] Distribución con barras de porcentaje correctas
- [ ] Lista de reviews se renderiza
- [ ] Paginación funciona
- [ ] Usuario puede crear review (si autenticado)
- [ ] Usuario puede editar review existente
- [ ] Usuario puede eliminar review existente
- [ ] Dueño de propiedad NO puede dejar review
- [ ] Usuario no autenticado ve link "Log in"

### PropertyDetailPage Integration
- [ ] ReviewSection aparece debajo de la info principal
- [ ] Sin reviews muestra "No reviews yet"

---

## 3. Pruebas de Integración

- [ ] Crear usuario → crear propiedad → otro usuario logueado deja review
- [ ] Crear review → verificar en GET reviews/stats
- [ ] Editar review → verificar cambios reflejados
- [ ] Eliminar review → verificar stats se actualizan
- [ ] Dueño de propiedad no puede review su propia propiedad
- [ ] Un solo review por usuario por propiedad

---

## 4. Pruebas de Seguridad

- [ ] No se puede review propiedad sin token (POST)
- [ ] No se puede editar/eliminar review de otro usuario
- [ ] Rate limiting aplica a endpoints de review

---

## 5. Prueba Opcional (Feature Flag)

Si se activa `requireInquiry` en el servicio:
- [ ] Usuario sin inquiry previo → 403
- [ ] Usuario con inquiry → 201
