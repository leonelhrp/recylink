# EventBoard

> **Modalidad elegida: Opción A — Desarrollar el proyecto propuesto**
>
> Todos los deseables fueron implementados: GraphQL, JWT, Docker, Micro-frontend, Testing avanzado, CI/CD.

Aplicación full-stack para gestionar eventos internos de un equipo. Construida como un monorepo Nx con NestJS (REST + GraphQL), React (Module Federation con Rspack), MongoDB, Docker y CI/CD.

## Arquitectura

```
event-board/
├── apps/
│   ├── api/                  # NestJS Backend (REST + GraphQL + JWT Auth)
│   ├── api-e2e/              # E2E tests (mongodb-memory-server + Supertest)
│   ├── web-host/             # React Host (Module Federation Shell)
│   └── webEvents/            # React Remote (Events micro-frontend)
├── libs/
│   └── shared-types/         # Interfaces, enums y DTOs compartidos
├── docker-compose.yml        # Orquestación Docker full-stack
├── Dockerfile.web            # Multi-stage build para frontend
├── nginx.conf                # Nginx config para SPA + API proxy
├── .github/workflows/ci.yml  # Pipeline CI/CD
└── TECHNICAL_DECISIONS.md    # Justificación de decisiones técnicas
```

### Diagrama de Arquitectura

```
┌──────────────────────────────────────────────────────────┐
│                       Nx Monorepo                         │
│                                                           │
│  ┌─────────────┐   Module    ┌───────────────┐           │
│  │  web-host   │◄═══════════►│  webEvents    │           │
│  │  (React     │  Federation │  (React       │           │
│  │   Shell)    │             │   Remote)     │           │
│  │  Port 4200  │             │  Port 4201    │           │
│  └──────┬──────┘             └───────┬───────┘           │
│         │          REST / GQL        │                    │
│         └────────────┬───────────────┘                    │
│                      ▼                                    │
│              ┌───────────────┐    ┌───────────────────┐   │
│              │     api       │    │  libs/shared-types │   │
│              │  (NestJS)     │◄───│  Enums, Interfaces │   │
│              │  REST+GraphQL │    │  DTOs              │   │
│              │  Port 3000    │    └───────────────────┘   │
│              └───────┬───────┘                            │
└──────────────────────┼────────────────────────────────────┘
                       │
                  ┌────▼─────┐
                  │ MongoDB  │
                  │ Port     │
                  │ 27017    │
                  └──────────┘
```

## Stack Tecnológico

### Backend
| Tecnología | Propósito |
|---|---|
| **NestJS** | Framework backend con inyección de dependencias y arquitectura modular |
| **MongoDB + Mongoose** | Base de datos documental con ODM |
| **Apollo Server** | Endpoint GraphQL (code-first) |
| **JWT (`@nestjs/jwt`)** | Autenticación con guards globales para REST y GraphQL |
| **class-validator** | Validación de DTOs con decoradores |
| **bcrypt** | Hashing seguro de contraseñas |

### Frontend
| Tecnología | Propósito |
|---|---|
| **React 19** | Framework UI con TypeScript |
| **Module Federation (Rspack)** | Arquitectura micro-frontend vía Nx |
| **shadcn/ui + Radix UI** | Componentes accesibles (DatePicker, Select, Textarea, Button, Input, Badge) |
| **TanStack Query** | Data fetching, caché, estados de carga/error |
| **React Hook Form + Zod v4** | Formularios con validación schema-first |
| **Tailwind CSS v4** | CSS utilitario con variables CSS para theming |
| **Lucide React** | Iconografía consistente |

### Infraestructura
| Tecnología | Propósito |
|---|---|
| **Nx** | Monorepo con task caching y comandos `affected` |
| **Docker + Docker Compose** | Despliegue containerizado (MongoDB + API + Web + Nginx) |
| **GitHub Actions** | CI/CD: lint, test (con coverage), build, e2e |
| **Husky + commitlint** | Git hooks: lint-staged en pre-commit, validación Conventional Commits en commit-msg |

## Inicio Rápido

### Prerrequisitos
- Node.js 20+
- npm 9+
- MongoDB 7+ (local o Docker)

### Instalación

```bash
git clone <repo-url>
cd event-board
npm install
```

### Variables de Entorno

Crear `apps/api/.env` (ver `apps/api/.env.example`):

| Variable | Default | Descripción |
|---|---|---|
| `MONGODB_URI` | `mongodb://localhost:27017/event-board` | Conexión MongoDB |
| `JWT_SECRET` | `event-board-secret` | Secreto para firmar JWT |
| `JWT_EXPIRES_IN` | `1h` | Expiración del token |
| `PORT` | `3000` | Puerto del API |
| `CORS_ORIGIN` | `http://localhost:4200` | Orígenes CORS permitidos |

### Ejecución Local (sin Docker)

```bash
# 1. Iniciar MongoDB
mongod

# 2. Iniciar el API (puerto 3000)
npx nx serve api

# 3. Iniciar el Frontend (puerto 4200, auto-inicia webEvents en 4201)
npx nx serve web-host
```

- Frontend: http://localhost:4200
- API REST: http://localhost:3000/api
- GraphQL Playground: http://localhost:3000/graphql

### Ejecución con Docker

```bash
docker-compose up --build
```

Inicia MongoDB, API (puerto 3000) y Web (puerto 80 con nginx).

## API

### Endpoints REST

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/auth/register` | Pública | Registrar usuario |
| `POST` | `/api/auth/login` | Pública | Login, retorna JWT |
| `GET` | `/api/events` | Pública | Listar eventos con filtros |
| `GET` | `/api/events/:id` | Pública | Detalle de evento |
| `POST` | `/api/events` | JWT | Crear evento |
| `PATCH` | `/api/events/:id` | JWT | Actualizar evento |
| `DELETE` | `/api/events/:id` | JWT | Eliminar evento |

**Filtros para GET /api/events:**
- `category` — workshop, meetup, talk, social
- `status` — draft, confirmed, cancelled
- `startDate` / `endDate` — Rango de fechas
- `search` — Búsqueda en título, descripción, organizador

### API GraphQL

Disponible en `/graphql`:

```graphql
# Listar eventos con filtros
query {
  events(filter: { category: WORKSHOP, status: CONFIRMED }) {
    _id, title, description, date, location, category, organizer, status
  }
}

# Detalle de evento
query {
  event(id: "...") { _id, title, description }
}

# Crear evento (requiere JWT en header Authorization)
mutation {
  createEvent(input: {
    title: "Team Workshop"
    description: "A hands-on workshop"
    date: "2026-03-15T10:00:00Z"
    location: "Room 3"
    category: WORKSHOP
    organizer: "John Doe"
  }) { _id, title }
}
```

## Testing

```bash
# Unit + Integration tests
npx nx test api

# Con coverage
npx nx test api --coverage

# E2E (usa mongodb-memory-server, no requiere BD externa)
npx jest --config apps/api-e2e/jest.config.cts --forceExit

# Tests afectados
npx nx affected --target=test
```

### Resumen de Tests

| Tipo | Ubicación | Tests | Descripción |
|---|---|---|---|
| Unit | `apps/api/.../events.service.spec.ts` | 12 | Lógica del servicio, filtros, CRUD, manejo de errores |
| Integration | `apps/api/.../events.controller.spec.ts` | 8 | Endpoints HTTP con servicio mockeado |
| E2E | `apps/api-e2e/.../api.spec.ts` | 13 | Flujo completo auth + CRUD con MongoDB in-memory |
| **Total** | | **33** | |

## Modelo de Datos

```typescript
interface Event {
  _id: string;
  title: string;           // mín. 3 caracteres
  description: string;
  date: Date;
  location: string;        // ej: "Sala 3", "Virtual"
  category: 'workshop' | 'meetup' | 'talk' | 'social';
  organizer: string;
  status: 'draft' | 'confirmed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}
```

## Deseables Implementados

| Feature | Estado | Detalle |
|---|---|---|
| GraphQL | ✅ | Apollo Server code-first, queries + mutation con JWT guard |
| Autenticación JWT | ✅ | Register/login, guards globales REST + GraphQL separados, bcrypt |
| Docker | ✅ | Multi-stage Dockerfiles, docker-compose con MongoDB + API + nginx |
| Micro-frontend | ✅ | Module Federation vía Rspack/Nx, host + remote independientes |
| Testing avanzado | ✅ | Unit, integration, E2E con mongodb-memory-server + Supertest (33 tests) |
| CI/CD | ✅ | GitHub Actions: lint → test (coverage) → e2e → build |

## Calidad y Estructura de Código

### Separación de Responsabilidades

**Backend** — Arquitectura modular NestJS:
- Cada feature es un módulo autocontenido (`AuthModule`, `EventsModule`) con controller, service, schemas y DTOs.
- Controllers son "thin" (1-2 líneas por handler) — solo delegan al service. Toda la lógica de negocio está en los services.
- Guards, decoradores (`@Public()`) y pipes (`ValidationPipe`) son reutilizables y desacoplados de la lógica de negocio.
- GraphQL resolver reutiliza el mismo `EventsService` que el controller REST — sin duplicación de lógica.

**Frontend** — Componentes por responsabilidad:
- **UI primitivos** (`components/ui/`): Button, Input, Badge, Select, DatePicker, StatusBadge — componentes genéricos reutilizables.
- **Feature components** (`components/`): EventList, EventCard, EventForm, EventDetail, EventFilters — cada uno con responsabilidad única.
- **Hooks** (`hooks/useEvents.ts`): Tres hooks focalizados — `useEvents`, `useEvent`, `useCreateEvent`. Encapsulan data fetching y cache.
- **Services** (`services/events-api.ts`): Capa de abstracción HTTP pura. Construye requests con auth headers automáticos.
- **Utilities** (`lib/getCoverUrl.ts`, `lib/utils.ts`): Funciones puras reutilizables extraídas para evitar duplicación.

### Patrones Aplicados

| Patrón | Aplicación |
|---|---|
| **Single Responsibility** | Controllers delegan, services contienen lógica, hooks manejan estado, components renderizan |
| **DRY** | `getCoverUrl` y `StatusBadge` extraídos como utilidades compartidas |
| **Module encapsulation** | Cada NestJS module exporta solo lo necesario (`JwtAuthGuard`, `EventsService`) |
| **Presentational vs Container** | `EventFilters` es presentacional puro; `EventList` maneja estado + render |
| **Custom hooks** | `useEvents` abstrae TanStack Query, los componentes no conocen la implementación del fetching |

### Git Hooks (Husky)

| Hook | Herramienta | Acción |
|---|---|---|
| `pre-commit` | **lint-staged** | Ejecuta ESLint (`--fix`) y Prettier (`--write`) solo sobre archivos staged |
| `commit-msg` | **commitlint** | Valida que el mensaje siga [Conventional Commits](https://www.conventionalcommits.org/) |

**Tipos permitidos**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `infra`, `revert`

**Scopes sugeridos**: `api`, `web`, `shared`, `e2e`

**Ejemplos válidos**:
```
feat(api): add event filtering by date range
fix(web): resolve token persistence after login
test(e2e): add auth flow integration tests
docs: update README with setup instructions
```

## UI/UX

Diseño inspirado en [lu.ma](https://lu.ma) con componentes [shadcn/ui](https://ui.shadcn.com):

- **Paleta**: Tonos neutros cálidos con CSS custom properties (`@theme inline`)
- **Tipografía**: Inter (Google Fonts)
- **Componentes**: shadcn/ui — Button, Input, Textarea, Select (Radix), DatePicker (react-day-picker), Badge, Separator, Popover, Calendar, Label
- **Eventos**: Layout timeline agrupado por fecha (Upcoming/Past)
- **Formulario**: Layout side-by-side con cover preview auto-generado (picsum.photos)
- **Detalle**: Dos columnas con imagen, info card sticky, badges semánticos
- **Auth**: Formularios centrados con card y iconografía

> Para la justificación detallada de cada decisión técnica, ver [TECHNICAL_DECISIONS.md](./TECHNICAL_DECISIONS.md)

## Licencia

MIT
