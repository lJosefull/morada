# Test Plan — CRM Interno + Tracking + Favoritos

> **Proyecto:** InmobiliarIA  
> **Versión:** 1.0.0  
> **Fecha:** 17-May-2026  
> **QA:** Diogenes 🦞

---

## Estado Actual del Testing en el Proyecto

### 🔴 Hallazgos

| Item | Estado | Detalle |
|------|--------|---------|
| Tests existentes | ❌ **0 tests** | No se encontró ningún archivo `.spec.ts` ni `.test.ts` en `backend/src/` ni `frontend/src/` |
| Configuración Jest (backend) | ⚠️ Configurada pero sin tests | Jest 29.7 + ts-jest configurado en `package.json`. `rootDir: "src"`, `testRegex: ".*\\.spec\\.ts$"` |
| Configuración testing (frontend) | ❌ No existe | `package.json` no incluye vitest, jest, react-testing-library ni ningún framework de testing |
| Coverage | ❌ No hay métricas | No hay baseline ni reportes de cobertura |

### 🟢 Compilación

| Componente | Estado |
|-----------|--------|
| Backend (`npx nest build`) | ✅ Compila sin errores |
| Frontend (`npx tsc --noEmit`) | ✅ Compila sin errores |

---

## 🐛 Issues/Riesgos Encontrados

### 🔴 Críticos (pueden causar errores en runtime)

| ID | Issue | Archivo(s) | Detalle |
|----|-------|-----------|---------|
| BQ-01 | **Status de inquiries incompatible backend ↔ frontend** | `inquiry.dto.ts`, `InquiryKanban.tsx`, `types/index.ts` | Backend usa enum `['new', 'read', 'contacted', 'closed']`. Frontend usa `['new', 'contacted', 'interested', 'not_interested', 'converted']`. Al hacer PATCH status desde el kanban con valores como `'interested'`, el backend responde 400 (ValidationPipe con `@IsEnum`). **ROMPE TODO EL FLUJO DEL KANBAN.** |
| BQ-02 | **Favorite check usa endpoint incorrecto** | `PropertyDetailPage.tsx` | Llama a `GET /favorites/check/${id}` pero el backend expone `GET /favorites/check?propertyIds=...` (query param). Resultado: 404 o error. |
| BQ-03 | **InquiryDetail referencia `statusHistory` inexistente** | `InquiryDetail.tsx`, `types/index.ts` | `Inquiry` type tiene campo `statusHistory?: InquiryStatusChange[]`, pero el backend no tiene tabla/modelo `InquiryStatusChange` ni lo retorna. La UI renderizaría datos undefined. |

### 🟡 Medios

| ID | Issue | Archivo(s) | Detalle |
|----|-------|-----------|---------|
| BQ-04 | **Navbar sin enlaces a Inquiries** | `Navbar.tsx` | No hay links a `/inquiries` (leads kanban) ni `/inquiries/history` (historial). Usuarios no pueden navegar al CRM. |
| BQ-05 | **PropertyStats type mismatch** | `types/index.ts` vs `view.service.ts` | Frontend espera `{totalViews, weeklyViews, inquiryCount}`. Backend retorna `{totalViews, uniqueViews}`. `weeklyViews` no se calcula. |
| BQ-06 | **InquiryCard usa `inquiry.property` no incluido en la query base** | `InquiryCard.tsx` | El componente renderiza `inquiry.property.title`, pero `GET /inquiries/mine` no incluye `include: { property: true }` en Prisma. El valor será `undefined`. |
| BQ-07 | **Sin paginación en inquiries ni favoritos** | `InquiryKanban.tsx`, `FavoritesController` | Los endpoints tienen skip/take pero el frontend no implementa paginación. Con muchos leads, el rendimiento se degrada. |
| BQ-08 | **No hay manejo de duplicados en views** | `view.service.ts` | Misma IP + mismo user en <1 minuto registra vistas duplicadas. El PRD menciona deduplicación como opcional. |
| BQ-09 | **InquiryKanban columns sin estado 'read' ni 'closed'** | `InquiryKanban.tsx` | El backend permite 'read' y 'closed' pero el frontend no los expone como columnas. Leads en estos estados no aparecerían. |
| BQ-10 | **`CheckFavoritesDto` no se usa** | `favorites.controller.ts` | El controller recibe `propertyIds` como query param string (split por comas) en vez de usar el DTO con validación. |

### 🟢 Leves

| ID | Issue | Archivo(s) | Detalle |
|----|-------|-----------|---------|
| BQ-11 | **No hay ProtectedRoute para /inquiries** | `App.tsx` | Las rutas de inquiries no están declaradas en el Router. Sin acceso a las páginas. |
| BQ-12 | **Error al hacer toggle favorite sin estar logueado** | `PropertyDetailPage.tsx` | Si el usuario no está autenticado y hace click en favorito, el catch es silencioso. Debería redirigir a login. |

---

## Plan de Pruebas Detallado

### 🔵 Fase 1: Inquiry Creation (Público)

```markdown
- [ ] POST /api/properties/:id/inquiry sin auth → 201 (success)
- [ ] Con datos inválidos (email malo, message vacío) → 400 (ValidationPipe)
- [ ] Con name < 2 chars → 400
- [ ] Con message > 2000 chars → 400
- [ ] Con propertyId inexistente → 404
- [ ] XSS: inyectar <script> en name/message → se guarda como texto plano (no se ejecuta)
- [ ] Rate limiting: >3 requests en 1s → 429
- [ ] SQL injection en campos string → safe (Prisma parameteriza)
```

### 🔵 Fase 2: Inquiry Management (Dueño de propiedad)

```markdown
- [ ] GET /inquiries/mine sin auth → 401
- [ ] GET /inquiries/mine como dueño → 200 + array de inquiries
- [ ] GET /inquiries/mine con status filter → 200 + solo ese status
- [ ] GET /inquiries/mine como user sin properties → 200 + empty array (no error)
- [ ] GET /inquiries/mine/:id como dueño correcto → 200 + detalle
- [ ] GET /inquiries/mine/:id como otro user → 403
- [ ] GET /inquiries/mine/:id con id inexistente → 404
- [ ] PATCH status con valor válido → 200 + status actualizado
- [ ] PATCH status con valor inválido (ej: 'invalid') → 400
- [ ] PATCH status de inquiry de otro user → 403
- [ ] PATCH notes → 200 + notas guardadas
- [ ] PATCH notes con > 2000 chars → 400
- [ ] PATCH notes de inquiry de otro user → 403
- [ ] GET /inquiries/my-history como user → 200 + inquiries hechas por ese user
- [ ] GET /inquiries/my-history sin inquiries → empty array
- [ ] GET /inquiries/stats → 200 + stats por status
```

### 🔵 Fase 3: Property View Tracking

```markdown
- [ ] POST /properties/:id/view sin auth → 201 (view registrada)
- [ ] POST /properties/:id/view con ip en body → 201
- [ ] POST con propertyId inexistente → 404
- [ ] Misma IP + mismo user en <1 minuto → registra view (no hay dedup)
- [ ] GET /properties/:id/stats como dueño → 200 + totalViews + uniqueViews
- [ ] GET /properties/:id/stats como otro user → 403
- [ ] GET /properties/:id/stats sin auth → 401
- [ ] GET /properties/:id/stats con propertyId inexistente → 404
- [ ] GET /properties/:id/stats/daily → 200 + últimos 30 días
- [ ] GET /properties/:id/stats/daily como otro user → 403
- [ ] POST view + GET stats: el contador incrementa correctamente
- [ ] POST view mismo user 2 veces → uniqueViews = 1, totalViews = 2
```

### 🔵 Fase 4: Favorites / Wishlist

```markdown
- [ ] POST /favorites/toggle sin auth → 401
- [ ] POST /favorites/toggle con propertyId válido → { favorited: true }
- [ ] POST /favorites/toggle mismo propertyId → { favorited: false } (unfavorited)
- [ ] POST /favorites/toggle con propertyId inexistente → 404
- [ ] GET /favorites sin auth → 401
- [ ] GET /favorites → 200 + solo propiedades del usuario + con imágenes incluidas
- [ ] GET /favorites?propertyIds=id1,id2 → 200 + { id1: true, id2: false }
- [ ] GET /favorites sin favoritos → 200 + empty array
- [ ] Verificar integridad: si se elimina propiedad, el favorito se elimina (CASCADE)
```

### 🔵 Fase 5: Frontend — Formulario de Contacto

```markdown
- [ ] Formulario se renderiza solo si NO eres el dueño
- [ ] Envío exitoso → mensaje de éxito + reset de campos (si no logueado)
- [ ] Envío con email inválido → validación nativa HTML (required + type=email)
- [ ] Envío con message vacío → validación nativa HTML
- [ ] Error del servidor → muestra mensaje de error rojo
- [ ] Estado "sending" → botón deshabilitado + spinner
- [ ] Usuario logueado → name y email se autocompletan
- [ ] Usuario no logueado → campos vacíos
```

### 🔵 Fase 6: Frontend — Kanban de Leads

```markdown
- [ ] Kanban carga inquiries del dueño al montar
- [ ] Cada columna muestra solo inquiries de ese status
- [ ] Columna vacía → mensaje "Drop leads here"
- [ ] Loading state → spinner centrado
- [ ] Error state → ErrorAlert con retry
- [ ] **Drag & drop entre columnas → PATCH status al backend**
- [ ] Drop en mismo status → no hace nada
- [ ] **Drop con status 'interested' → backend devuelve 400 por enum mismatch** 🔴
- [ ] Click en card → abre modal de detalle
- [ ] Refresh manual → recarga datos
- [ ] Contador de leads totales correcto
```

### 🔵 Fase 7: Frontend — Detalle de Inquiry (Modal)

```markdown
- [ ] Modal se abre al click en InquiryCard
- [ ] Muestra: nombre, email, teléfono, mensaje, fecha
- [ ] Link a la propiedad funcionando
- [ ] **Status change buttons → PATCH status → 400 por status inválido** 🔴
- [ ] Botón activo = status actual (highlighted)
- [ ] Notas: textarea + Save Notes button
- [ ] Notas guardadas → feedback "Saved!"
- [ ] **StatusHistory section → no renderiza nada (backend no lo soporta)** 🟡
- [ ] Cerrar modal → click fuera o X
- [ ] Errores silenciosos en catch → no hay feedback
```

### 🔵 Fase 8: Frontend — Dashboard / Analytics

```markdown
- [ ] Dashboard carga properties + inquiry stats
- [ ] Muestra "No properties yet" si el usuario no tiene propiedades
- [ ] Stats se cargan con Promise.all (paralelo)
- [ ] Error en stats no bloquea carga de properties (catch → null)
- [ ] Cards de propiedades con acciones: view, edit, delete
- [ ] Delete → confirmación + remove de la UI
- [ ] Loading state → spinner
- [ ] Error state → alerta dismissible
```

---

## Pruebas de Seguridad

```markdown
- [ ] No se puede acceder a inquiries de otro dueño (ownership check en service)
- [ ] No se puede modificar status/notes de inquiry ajena (403)
- [ ] Rate limiting en endpoints públicos (3/s)
- [ ] JWT expirado → 401 + refresh flow
- [ ] Inyección XSS en campos de texto → almacenado como texto plano
- [ ] CSRF: endpoints protegidos requieren Bearer token
- [ ] Helmet activo para security headers
- [ ] ValidationPipe con whitelist + forbidNonWhitelisted (no permitir campos extras)
```

---

## Issues Prioritarios para Corrección

### 🚨 Deben arreglarse ANTES de QA

1. **BQ-01**: Alinear enum de estados entre backend y frontend (decisión: usar los 5 del frontend o los 4 del backend)
2. **BQ-02**: Corregir llamada a `/favorites/check/${id}` → usar query params correctos
3. **BQ-03**: Eliminar o implementar statusHistory (backend no lo soporta)
4. **BQ-11**: Agregar rutas de inquiries en el App.tsx + Navbar

### 📋 Deben arreglarse durante QA

5. **BQ-05**: Alinear PropertyStats type con lo que retorna el backend
6. **BQ-06**: Incluir `property` en la query de inquiries
7. **BQ-07**: Agregar paginación básica en frontend

---

## Resumen Ejecutivo

| Métrica | Valor |
|---------|-------|
| Tests existentes | **0** |
| Backend compila | ✅ |
| Frontend compila | ✅ |
| Issues críticos | **3** (BQ-01, BQ-02, BQ-03) |
| Issues medios | **7** (BQ-04 a BQ-10) |
| Issues leves | **2** (BQ-11, BQ-12) |
| Casos de prueba planificados | ~45+ |
| Prioridad | **ALTA: Los issues BQ-01 y BQ-02 rompen funcionalidad core del CRM** |

> ⚠️ **Nota importante:** El mismatch de status enum (BQ-01) hace que TODO el kanban de leads no funcione. Cada drag & drop o cambio de status resultará en un error 400 del backend. Es el issue más crítico y debe resolverse primero.
