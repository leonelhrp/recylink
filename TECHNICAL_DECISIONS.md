# Decisiones Técnicas — EventBoard

Este documento justifica cada decisión de arquitectura, stack y diseño tomada durante el desarrollo de EventBoard.

---

## 1. Monorepo con Nx

**Decisión**: Usar Nx como orquestador del monorepo en lugar de workspaces de npm o Turborepo.

**Por qué**:
- Nx tiene soporte nativo para NestJS y React con generators y executors pre-configurados.
- `nx affected` permite ejecutar lint, test y build solo en proyectos impactados por un cambio. Esto reduce tiempos de CI significativamente en monorepos.
- Task caching local y remoto evita re-ejecutar tareas cuyos inputs no cambiaron.
- El project graph permite visualizar dependencias entre apps y libs, y `@nx/enforce-module-boundaries` las enforce a nivel de linting.

**Cómo se implementó**:
- Se creó el workspace con el preset NestJS + React.
- Se definieron cuatro projects: `api`, `api-e2e`, `web-host`, `webEvents` y una lib `shared-types`.
- CI usa `npx nx affected --target=<target>` en todos los jobs.

**Trade-off**: Nx agrega complejidad de configuración inicial, pero se justifica al tener backend, frontend, micro-frontend, tests e2e y tipos compartidos en un solo repositorio.

---

## 2. Backend: NestJS con Mongoose y Apollo

### 2.1 NestJS como Framework Backend

**Decisión**: NestJS sobre Express plano o Fastify directo.

**Por qué**:
- Arquitectura modular con inyección de dependencias — cada feature (Auth, Events) es un módulo autocontenido con controller, service, schemas y DTOs.
- Soporte nativo para guards, pipes, interceptors y decoradores. Esto permite implementar auth, validación y transformación de forma declarativa.
- Integración directa con Mongoose (`@nestjs/mongoose`) y GraphQL (`@nestjs/graphql` + Apollo).

### 2.2 MongoDB + Mongoose

**Decisión**: MongoDB como base de datos con Mongoose como ODM.

**Por qué**:
- El modelo de datos de Event es naturalmente documental — un objeto con campos planos, enums y timestamps. No hay relaciones complejas que justifiquen SQL.
- Mongoose provee schemas con validación, tipos, defaults y hooks. El decorador `@Schema({ timestamps: true })` genera `createdAt/updatedAt` automáticamente.
- MongoDB se levanta trivialmente con Docker (`mongo:7` en docker-compose) y para tests se usa `mongodb-memory-server` (cero dependencias externas).

**Detalle de implementación**: Los enums de Mongoose se definen con arrays explícitos (`Object.values(EventCategory) as string[]`) porque los bundlers eliminan el metadata de los TypeScript enums en runtime. Sin esto, la validación de Mongoose falla silenciosamente en builds de producción.

### 2.3 GraphQL Code-First con Apollo

**Decisión**: Implementar un endpoint GraphQL adicional al REST usando el approach code-first.

**Por qué**:
- Code-first genera el schema SDL automáticamente desde decoradores TypeScript (`@ObjectType`, `@Field`, `@Query`, `@Mutation`). Esto evita mantener dos fuentes de verdad (schema + tipos).
- El resolver reutiliza el mismo `EventsService` que el controller REST — sin duplicación de lógica de negocio.
- Apollo Server provee GraphQL Playground en `/graphql` para exploración interactiva del API.

**Cómo se logró**:
- `EventType` define el tipo GraphQL con `@ObjectType()` y `@Field()` por campo.
- `CreateEventInput` y `FilterEventsInput` mapean los DTOs REST a inputs GraphQL.
- Enums se registran con `registerEnumType()` para que aparezcan correctamente en el schema.
- Las mutations protegidas usan `GqlAuthGuard` (ver sección 2.4).

### 2.4 Autenticación JWT — Sistema de Guards Dual

**Decisión**: Implementar dos guards separados para REST y GraphQL, con un decorador `@Public()` para opt-out.

**Por qué**:
- NestJS tiene un `ExecutionContext` diferente para HTTP y GraphQL. En REST se accede al request con `context.switchToHttp().getRequest()`, pero en GraphQL se necesita `GqlExecutionContext.create(context).getContext().req`. Un solo guard no puede manejar ambos contextos de forma limpia.
- El guard JWT REST se aplica globalmente vía `@UseGuards()` en el controller. Las rutas públicas (login, register, listado de eventos) usan `@Public()` que setea metadata `IS_PUBLIC_KEY` — el guard lo chequea vía `Reflector` y permite el paso.

**Flujo de auth**:
1. `POST /api/auth/register`: Valida DTO → verifica email único → hashea password con bcrypt (salt 10) → guarda en MongoDB → genera JWT → retorna `{ access_token, user }`.
2. `POST /api/auth/login`: Busca por email → compara password con bcrypt → genera JWT → retorna token.
3. JWT payload: `{ sub: userId, email, name }` — mínimo necesario para identificar al usuario.
4. Rutas protegidas: El guard extrae el `Bearer` token del header `Authorization`, lo verifica con `jwtService.verify()` e inyecta el payload en `request.user`.

### 2.5 Validación con class-validator y ValidationPipe Global

**Decisión**: `ValidationPipe` global con `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.

**Por qué**:
- `whitelist` elimina propiedades no declaradas en el DTO — previene mass assignment.
- `forbidNonWhitelisted` rechaza requests con propiedades desconocidas — el cliente recibe un error explícito en lugar de un 200 silencioso con datos ignorados.
- `transform` convierte tipos automáticamente (string → Date, string → number) según los decoradores del DTO.
- Los decoradores (`@IsEmail()`, `@IsEnum()`, `@MinLength()`, `@IsDateString()`, `@IsOptional()`) documentan y enforcean las reglas en el mismo lugar.

### 2.6 Filtros Combinables en EventsService

**Decisión**: Query builder dinámico que acumula filtros opcionales.

**Implementación**:
```typescript
const query: Record<string, any> = {};
if (filter.category) query.category = filter.category;
if (filter.status) query.status = filter.status;
if (filter.startDate || filter.endDate) {
  query.date = {};
  if (filter.startDate) query.date.$gte = new Date(filter.startDate);
  if (filter.endDate) query.date.$lte = new Date(filter.endDate);
}
if (filter.search) {
  const regex = { $regex: filter.search, $options: 'i' };
  query.$or = [{ title: regex }, { description: regex }, { organizer: regex }];
}
return this.eventModel.find(query).sort({ date: 1 }).exec();
```

**Por qué este approach**: Cada filtro es independiente y opcional. Construir el query object incrementalmente es más legible que anidar condicionales o usar query builders complejos. El `$or` con regex case-insensitive permite búsqueda full-text básica sin requerir un índice text de MongoDB.

---

## 3. Frontend: React 19 + Module Federation

### 3.1 Module Federation con Rspack

**Decisión**: Arquitectura micro-frontend con Module Federation, usando Rspack (vía Nx) en lugar de Webpack.

**Por qué**:
- Module Federation permite que `webEvents` (el CRUD de eventos) se desarrolle, buildee y despliegue independientemente del shell (`web-host`).
- El shell maneja auth, routing global y layout. El remote expone un módulo (`./Module`) que se carga lazily.
- Rspack es compatible con Webpack Module Federation pero significativamente más rápido en builds (escrito en Rust).
- Nx provee `NxModuleFederationPlugin` que configura sharing, remotes y exposes automáticamente.

**Configuración clave**:
- `web-host` declara `remotes: ['webEvents']` — Nx auto-inicia el dev server del remote al hacer `nx serve web-host`.
- `webEvents` expone `./Module` → `remote-entry.ts`.
- React, React DOM y TanStack Query se comparten como singletons. `@hookform/resolvers` no se comparte (`singleton: false`) porque cada app puede tener versiones diferentes de resolvers.

**Decisión crítica**: `remote-entry.ts` importa `./styles.css` explícitamente. Sin esto, el CSS del remote no se bundlea cuando el host lo carga vía federation — las clases de Tailwind no se aplicarían.

### 3.2 Aislamiento entre Host y Remote

**Decisión**: Cada micro-frontend tiene su propio QueryClient, API service y manejo de auth.

**Por qué**:
- El remote (`webEvents`) no puede depender del `AuthContext` del host porque Module Federation no comparte React context trees de forma confiable entre bundles independientes.
- `webEvents` lee el token directamente de `localStorage` — el contrato es la key `access_token`. Esto desacopla completamente el remote del host.
- Cada app tiene su propio `QueryClient` con `staleTime: 30_000` y `retry: 1`. Esto evita conflictos de cache entre apps.

**Trade-off**: Hay duplicación del API service y utils entre apps. En un proyecto más grande se moveía a una lib compartida, pero aquí la duplicación es mínima (~30 líneas) y el aislamiento vale más.

### 3.3 TanStack Query para Data Fetching

**Decisión**: TanStack Query v5 sobre SWR, Redux Toolkit Query, o fetch manual.

**Por qué**:
- Manejo automático de estados de carga (`isPending`), error (`isError`), y datos (`data`).
- Cache inteligente con `staleTime` — evita re-fetches innecesarios al navegar entre vistas.
- Invalidación por query key: al crear un evento, `queryClient.invalidateQueries({ queryKey: ['events'] })` refresca automáticamente el listado sin importar qué filtros estén activos.
- Queries parametrizados: `useEvents(filters)` usa key `['events', filters]` — cada combinación de filtros tiene su propio cache.

### 3.4 React Hook Form + Zod v4

**Decisión**: Validación client-side con Zod schemas resueltos por `@hookform/resolvers/zod`.

**Por qué**:
- Zod permite definir schemas de validación que infieren tipos TypeScript automáticamente — una sola fuente de verdad para tipo + validación.
- React Hook Form minimiza re-renders usando refs internos en lugar de state controlado.
- Para componentes controlados de shadcn (DatePicker, Select), se usa `Controller` de RHF que envuelve el componente y maneja el registro con el form.

### 3.5 shadcn/ui + Tailwind CSS v4

**Decisión**: Componentes UI basados en shadcn/ui (Radix primitives + CVA) con Tailwind CSS v4.

**Por qué**:
- shadcn/ui no es una dependencia de npm sino código copiado al proyecto. Esto da control total sobre el styling sin vendor lock-in.
- Los componentes usan Radix UI para accesibilidad (keyboard navigation, ARIA, focus management) sin imponer diseño visual.
- CVA (Class Variance Authority) permite definir variantes de componentes de forma type-safe.
- Tailwind CSS v4 usa `@theme inline` con CSS custom properties — el theming se define una vez en variables CSS y todos los componentes lo heredan.

**Theming**: Paleta de tonos neutros cálidos (oklch) inspirada en lu.ma. Variables como `--background`, `--foreground`, `--primary`, `--border` se definen en `:root` y se mapean a Tailwind via `@theme inline { --color-background: var(--background); }`.

**Integración con Tailwind v4**: Google Fonts se carga via `<link>` en HTML, no via CSS `@import url()`. Esto es porque `@import url()` en el mismo archivo que `@import "tailwindcss"` rompe el pipeline PostCSS de Tailwind v4 silenciosamente.

---

## 4. Tipos Compartidos (libs/shared-types)

**Decisión**: Librería dedicada para interfaces, enums y DTOs compartidos entre backend y frontend.

**Por qué**:
- `IEvent`, `ICreateEventDto`, `IFilterEventsDto`, `IUser`, `IAuthResponse` se usan tanto en el API (tipado de responses) como en el frontend (tipado de state y API calls).
- Los enums `EventCategory` y `EventStatus` se comparten — garantizan que frontend y backend usen los mismos valores.
- El path alias `@event-board/shared-types` permite imports limpios desde cualquier app sin paths relativos.
- `@nx/enforce-module-boundaries` valida en linting que las dependencias entre projects sean correctas.

---

## 5. Testing: Tres Niveles

### 5.1 Estrategia General

| Nivel | Cantidad | Scope | Herramientas |
|---|---|---|---|
| **Unit** | 12 | Lógica de servicio aislada | Jest + Mongoose Model mockeado |
| **Integration** | 8 | Controller + ValidationPipe + HTTP | Jest + Supertest + NestJS Testing Module |
| **E2E** | 13 | Flujo completo auth → CRUD | Jest + Supertest + mongodb-memory-server |
| **Total** | **33** | | |

### 5.2 Tests Unitarios (events.service.spec.ts)

**Approach**: Mock del Mongoose Model con chain mocking (`.find().sort().exec()`).

**Cobertura**:
- CRUD completo: create, findAll, findOne, update, remove.
- Filtros individuales: category, status, date range ($gte/$lte), search ($or con regex).
- Casos de error: NotFoundException cuando el ID no existe.

**Por qué mock en lugar de BD real**: Los unit tests deben ser rápidos y aislados. Testean la lógica de construcción de queries y manejo de errores, no la integración con MongoDB.

### 5.3 Tests de Integración (events.controller.spec.ts)

**Approach**: `NestApplication` completa con `EventsService` mockeado y `JwtAuthGuard` overrideado.

**Cobertura**:
- Endpoints HTTP: GET/POST/PATCH/DELETE con status codes correctos.
- Validación de DTOs: campos requeridos, longitud mínima, enums válidos.
- Paso de query params como filtros.

**Por qué override del guard**: Testear la integración controller ↔ service sin depender de auth real. El guard se override para siempre retornar true.

### 5.4 Tests E2E (api-e2e/)

**Approach**: NestJS app completa contra `mongodb-memory-server`.

**Infraestructura**:
- `global-setup.ts`: Inicia mongod in-memory, setea `MONGODB_URI` y `PORT=0` (puerto aleatorio).
- `global-teardown.ts`: Detiene mongod.
- `test-setup.ts`: Inicializa la app NestJS y compila.

**Cobertura**:
- Auth flow completo: register → duplicate rejection → login → invalid credentials.
- CRUD con auth: create con token (201), create sin token (401), create con datos inválidos (400).
- Listado público, filtro por categoría, detalle, update, delete, 404 post-delete.

**Por qué mongodb-memory-server**: Cero dependencias externas para E2E. No requiere Docker ni MongoDB instalado. Se ejecuta en CI sin servicios adicionales.

---

## 6. Infraestructura

### 6.1 Docker Compose — Tres Servicios

```yaml
services:
  mongodb:   # mongo:7, health check con mongosh, volumen persistente
  api:       # Multi-stage build NestJS, depende de mongodb healthy
  web:       # Multi-stage build React → nginx:alpine
```

**Decisiones**:
- **Multi-stage builds**: Stage 1 instala deps y buildea con Nx. Stage 2 copia solo los artefactos necesarios. Reduce drásticamente el tamaño de la imagen final.
- **nginx como servidor web**: Maneja SPA routing (`try_files $uri $uri/ /index.html`), proxy reverso al API (`/api/` → `http://api:3000`) y cache de assets estáticos (1 año, immutable).
- **Health check en MongoDB**: El API espera con `depends_on: condition: service_healthy` a que MongoDB responda a `db.adminCommand('ping')` antes de iniciar.

### 6.2 CI/CD con GitHub Actions

**Pipeline**: lint → test (parallel) → e2e → build

```
lint ────────────┐
                 ├──► build
test (coverage) ─┘
     │
     └──► e2e
```

**Decisiones**:
- `npx nx affected` en todos los targets — solo se ejecutan los projects que cambiaron.
- Tests con `--coverage` generan artefactos de cobertura.
- E2E usa mongodb-memory-server (no requiere un servicio MongoDB en CI).
- Build depende de lint y test — si alguno falla, no se buildea.

---

## 7. Flujo de Datos Completo

### Crear un Evento (de clic a base de datos)

```
1. Usuario llena el formulario en EventForm (webEvents)
2. React Hook Form valida con Zod schema
3. onSubmit → useCreateEvent().mutate(data)
4. eventsApi.create(data) → POST /api/events
   └── Header: Authorization: Bearer {token de localStorage}

5. NestJS recibe el request:
   a. JwtAuthGuard extrae y verifica el JWT
   b. ValidationPipe valida el body contra CreateEventDto
      - whitelist: elimina campos no declarados
      - transform: convierte strings a tipos esperados
   c. EventsController.create() invoca EventsService.create()
   d. Mongoose valida contra el Event schema (enums, minlength)
   e. MongoDB persiste el documento con _id y timestamps

6. Response 201 con el evento creado (JSON)

7. Frontend:
   a. TanStack Query recibe la response exitosa
   b. onSuccess → queryClient.invalidateQueries(['events'])
   c. Todas las queries con key ['events'] se marcan como stale
   d. Si el listado está montado, re-fetch automático
   e. Navigate a la lista de eventos
```

### Listado con Filtros

```
1. Usuario selecciona filtros en EventFilters (category, status, search)
2. State local actualiza → useEvents(filters) se re-ejecuta
3. Query key cambia: ['events', { category: 'workshop' }]
4. TanStack Query verifica cache:
   - Si hay datos fresh (< 30s): retorna inmediato
   - Si stale o inexistente: fetch a GET /api/events?category=workshop
5. EventsService.findAll() construye query dinámico
6. MongoDB ejecuta .find(query).sort({ date: 1 })
7. Respuesta renderizada por EventList en layout timeline agrupado por fecha
```

---

## 8. Decisiones de UI/UX

### Diseño Inspirado en lu.ma

**Por qué lu.ma**: Es una referencia establecida para plataformas de eventos. Su diseño prioriza claridad, jerarquía visual y facilidad de uso.

**Implementación**:
- **Timeline layout**: Eventos agrupados por fecha con columna de fecha a la izquierda, línea vertical con dots, y cards a la derecha. Separa visualmente "Upcoming" y "Past".
- **Event cards horizontales**: Hora + título + organizador + ubicación + badge de estado + thumbnail. Densidad de información alta sin saturar.
- **Formulario de creación**: Layout side-by-side con preview de cover autogenerado (picsum.photos con seed determinístico basado en título+categoría) a la izquierda y campos flat a la derecha.
- **Detalle de evento**: Dos columnas — izquierda con cover e información principal, derecha con card sticky con datos clave (fecha, ubicación, categoría).
- **Navbar**: Logo a la izquierda, navegación centrada con iconos, acciones y avatar dropdown a la derecha.

### Componentes shadcn/ui Implementados

| Componente | Primitiva | Uso |
|---|---|---|
| Button | CVA | Acciones primarias/secundarias/ghost |
| Input | HTML input | Campos de texto |
| Textarea | HTML textarea | Descripción del evento |
| Select | Radix Select | Categoría, estado (filtros y formulario) |
| DatePicker | Radix Popover + react-day-picker | Selección de fecha |
| Badge | CVA | Estado del evento, categoría |
| Popover | Radix Popover | Contenedor para calendario |
| Calendar | react-day-picker v9 | Selector de fecha |
| Label | Radix Label | Labels accesibles |
| Separator | Radix Separator | Divisores visuales |

---

## 9. Git Hooks y Conventional Commits

**Decisión**: Husky + commitlint + lint-staged para enforcar calidad en cada commit.

**Por qué**:
- **lint-staged** (pre-commit): Ejecuta ESLint y Prettier solo sobre archivos staged. Evita que código sin formatear o con errores de lint llegue al repositorio, sin penalizar el tiempo de commit corriendo linters sobre todo el proyecto.
- **commitlint** (commit-msg): Valida que los mensajes sigan Conventional Commits. Esto garantiza un historial legible, facilita la generación automática de changelogs, y permite entender el alcance de cada cambio (tipo + scope).

**Configuración**:
- Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `infra`, `revert`
- Scopes sugeridos (warning, no error): `api`, `web`, `shared`, `e2e`
- Header máximo: 100 caracteres
- Se agregó `infra` como tipo custom para commits de Docker/nginx

**Trade-off**: `lint-staged` agrega ~2-3s a cada commit. Se justifica porque detecta problemas antes de que lleguen a CI.

---

## 10. Seguridad

| Aspecto | Implementación |
|---|---|
| **Passwords** | bcrypt con salt 10 — hashing irreversible |
| **Autenticación** | JWT en header Authorization (inmune a CSRF) |
| **Validación** | whitelist + forbidNonWhitelisted previene mass assignment |
| **Enums** | Validados tanto en DTO (class-validator) como en schema (Mongoose) |
| **CORS** | Configurable por variable de entorno, no wildcard |
| **Input sanitization** | class-validator + ValidationPipe rechazan datos malformados antes de llegar al servicio |

---

## 11. Trade-offs y Decisiones Conscientes

| Decisión | Alternativa descartada | Razón |
|---|---|---|
| MongoDB sobre PostgreSQL | SQL con Prisma/TypeORM | Modelo documental plano, sin relaciones complejas, setup más simple |
| Module Federation sobre monolito React | Single SPA o iframe | Permite deploy independiente manteniendo shared dependencies |
| `localStorage` para JWT | Cookies httpOnly | Simplifica Module Federation (el remote lee el token sin depender del host) |
| Duplicación de API service entre apps | Lib compartida de API | Aislamiento de micro-frontends. La duplicación es ~30 líneas |
| mongodb-memory-server para E2E | Testcontainers o Docker en CI | Cero dependencias externas, funciona en CI sin servicios |
| Zod v4 + RHF sobre Formik | Formik con Yup | Inferencia de tipos automática, menor re-renders, schema-first |
| CSS custom properties sobre Tailwind config | tailwind.config.js theme | Tailwind v4 usa `@theme inline` nativamente, más performante |
| Google Fonts via `<link>` HTML | CSS `@import url()` | `@import url()` rompe PostCSS de Tailwind v4 silenciosamente |

---

## 12. Qué Mejoraría con Más Tiempo

- **Refresh tokens**: Rotación de tokens para mayor seguridad sin re-login frecuente.
- **Tests de frontend**: Vitest + Testing Library para componentes React.
- **Upload de imágenes**: S3/Cloudinary en lugar de picsum.photos.
- **Rate limiting**: Protección contra abuso en endpoints públicos.
- **Paginación**: Cursor-based pagination en listado de eventos.
- **Monitoring**: OpenTelemetry + structured logging.
- **Nx Cloud**: Cache remoto para CI más rápido en equipos.
