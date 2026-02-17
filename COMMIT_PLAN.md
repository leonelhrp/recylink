# Plan de Commits — EventBoard

Estrategia para crear commits descriptivos que reflejen una evolución incremental del proyecto.

> **Problema**: Archivos como `app.module.ts`, `events.module.ts`, `events.controller.ts` y `main.ts`
> ya importan Auth, GraphQL y guards en su estado final. Si se commitean así en el commit de REST API,
> los commits posteriores de "agregar auth" y "agregar GraphQL" no tendrían sentido.
>
> **Solución**: Commitear versiones intermedias de esos archivos y actualizarlos en commits posteriores.

---

## Dependencias entre archivos (por qué se necesitan versiones intermedias)

```
app.module.ts (final) ──imports──► AuthModule, GraphQLModule, EventsModule
events.module.ts (final) ──imports──► AuthModule, EventsResolver
events.controller.ts (final) ──uses──► JwtAuthGuard, @Public()
main.ts (final) ──excludes──► /graphql del prefix, logea GraphQL URL
```

Archivos que evolucionan a través de los commits:

| Archivo | Commit 2 (REST) | Commit 3 (+Auth) | Commit 4 (+GraphQL) |
|---|---|---|---|
| `app.module.ts` | Solo ConfigModule + Mongoose + EventsModule | + AuthModule | + GraphQLModule (versión final) |
| `events.module.ts` | Solo controller + service + schema | + AuthModule import | + EventsResolver (versión final) |
| `events.controller.ts` | Sin guards ni @Public() | + JwtAuthGuard + @Public() (versión final) | — |
| `main.ts` | prefix 'api' simple | — | + exclude /graphql + log GraphQL (versión final) |

---

## Secuencia de Commits

### 1. `chore: scaffold Nx monorepo with shared types library`

**Archivos nuevos**:
```
.gitignore, .prettierignore, .prettierrc, .vscode/, eslint.config.mjs,
jest.config.ts, jest.preset.js, nx.json, package.json, package-lock.json,
tsconfig.base.json, libs/shared-types/
```

**Descripción**: Workspace Nx con ESLint flat config, Jest, TypeScript, y librería shared-types exportando enums y interfaces.

---

### 2. `feat(api): add NestJS REST API with events CRUD and MongoDB`

**Archivos nuevos**: toda la carpeta `apps/api/` con config, DTOs, service, schema, controller

**Versiones intermedias** (sin auth ni GraphQL):

**`app.module.ts` v1** — Solo MongoDB + EventsModule:
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsModule } from '../modules/events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>(
          'MONGODB_URI',
          'mongodb://localhost:27017/event-board',
        ),
      }),
    }),
    EventsModule,
  ],
})
export class AppModule {}
```

**`events.module.ts` v1** — Sin AuthModule ni Resolver:
```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { Event, EventSchema } from './schemas/event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }]),
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
```

**`events.controller.ts` v1** — Sin guards:
```typescript
import {
  Controller, Get, Post, Body, Patch, Param, Delete, Query,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { FilterEventsDto } from './dto/filter-events.dto';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  create(@Body() createEventDto: CreateEventDto) {
    return this.eventsService.create(createEventDto);
  }

  @Get()
  findAll(@Query() filterDto: FilterEventsDto) {
    return this.eventsService.findAll(filterDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventsService.update(id, updateEventDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }
}
```

**`main.ts` v1** — Sin exclusión de /graphql:
```typescript
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:4200';
  const allowedOrigins = new Set(corsOrigin.split(',').map((o) => o.trim()));
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`Application is running on: http://localhost:${port}/${globalPrefix}`);
}

bootstrap();
```

**`events.service.ts`**, **schema**, **DTOs** — Se commitean en su versión final (no dependen de auth/graphql).

---

### 3. `feat(api): add JWT authentication with guards and public decorator`

**Archivos nuevos**: Toda la carpeta `apps/api/src/modules/auth/` (excepto `gql-auth.guard.ts`)

**Archivos actualizados** (evolucionan a v2):

**`app.module.ts` v2** — Se agrega AuthModule:
```diff
+ import { AuthModule } from '../modules/auth/auth.module';
  // ...imports array:
+   AuthModule,
    EventsModule,
```

**`events.module.ts` v2** — Se importa AuthModule para acceder al guard:
```diff
+ import { AuthModule } from '../auth/auth.module';
  // ...imports array:
+   AuthModule,
```

**`events.controller.ts` v2** — Se agregan guards (versión final):
```diff
+ import { UseGuards } from '@nestjs/common';
+ import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
+ import { Public } from '../auth/guards/public.decorator';

  @Post()
+ @UseGuards(JwtAuthGuard)
  create(...) { ... }

  @Get()
+ @Public()
  findAll(...) { ... }

  @Get(':id')
+ @Public()
  findOne(...) { ... }

  @Patch(':id')
+ @UseGuards(JwtAuthGuard)
  update(...) { ... }

  @Delete(':id')
+ @UseGuards(JwtAuthGuard)
  remove(...) { ... }
```

---

### 4. `feat(api): add GraphQL endpoint with Apollo Server code-first`

**Archivos nuevos**:
```
apps/api/src/modules/events/events.resolver.ts
apps/api/src/modules/events/graphql/event.type.ts
apps/api/src/modules/events/graphql/create-event.input.ts
apps/api/src/modules/events/graphql/filter-events.input.ts
apps/api/src/modules/auth/guards/gql-auth.guard.ts
```

**Archivos actualizados** (evolucionan a versión final):

**`app.module.ts` v3 (final)** — Se agrega GraphQLModule:
```diff
+ import { GraphQLModule } from '@nestjs/graphql';
+ import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
+ import { join } from 'path';
  // ...imports array:
+   GraphQLModule.forRoot<ApolloDriverConfig>({
+     driver: ApolloDriver,
+     autoSchemaFile: join(process.cwd(), 'schema.gql'),
+     sortSchema: true,
+     playground: true,
+     introspection: true,
+   }),
```

**`events.module.ts` v3 (final)** — Se agrega EventsResolver:
```diff
+ import { EventsResolver } from './events.resolver';
  // ...providers:
+ providers: [EventsService, EventsResolver],
```

**`main.ts` v2 (final)** — Se excluye /graphql del prefix y se logea:
```diff
- app.setGlobalPrefix(globalPrefix);
+ app.setGlobalPrefix(globalPrefix, { exclude: ['graphql'] });
  // ...al final:
+ Logger.log(`GraphQL Playground: http://localhost:${port}/graphql`);
```

---

### 5. `test(api): add unit, integration and e2e tests (33 total)`

**Archivos nuevos**:
```
apps/api/src/modules/events/__tests__/events.service.spec.ts    (12 unit)
apps/api/src/modules/events/__tests__/events.controller.spec.ts (8 integration)
apps/api-e2e/                                                    (13 e2e)
```

Ningún archivo existente se modifica. Los tests importan los módulos ya commiteados.

---

### 6. `feat(web): add React shell with auth context and Module Federation`

**Archivos nuevos**: Toda la carpeta `apps/web-host/`

No depende de archivos previos más allá de `libs/shared-types` (commit 1).

---

### 7. `feat(web): add webEvents micro-frontend with event CRUD UI`

**Archivos nuevos**: Toda la carpeta `apps/webEvents/`

No depende de archivos previos más allá de `libs/shared-types` (commit 1).

---

### 8. `infra: add Docker multi-stage builds, nginx and docker-compose`

**Archivos nuevos**:
```
.dockerignore
Dockerfile.web
apps/api/Dockerfile
docker-compose.yml
nginx.conf
```

---

### 9. `ci: add GitHub Actions pipeline with lint, test, e2e and build`

**Archivos nuevos**:
```
.github/workflows/ci.yml
```

---

### 10. `chore: add Husky with commitlint and lint-staged`

**Archivos nuevos**:
```
.husky/pre-commit
.husky/commit-msg
commitlint.config.js
```

**Archivos actualizados**: `package.json` (lint-staged config, nuevas devDependencies)

**Descripción**: Git hooks con Husky — lint-staged en pre-commit (ESLint + Prettier sobre staged files), commitlint en commit-msg (valida Conventional Commits).

---

### 11. `docs: add README, technical decisions and commit plan`

**Archivos nuevos**:
```
README.md
TECHNICAL_DECISIONS.md
COMMIT_PLAN.md
```

---

## Script de ejecución

> Ejecutar desde la raíz del proyecto. El script escribe versiones intermedias de archivos,
> los commitea, y luego los sobreescribe con la versión siguiente.

```bash
#!/bin/bash
set -e

# ============================================================
# PREPARACIÓN: Unstage todo y guardar versiones finales
# ============================================================
git reset HEAD

# ============================================================
# COMMIT 1: Scaffold monorepo
# ============================================================
git add \
  .gitignore .prettierignore .prettierrc \
  .vscode/ \
  eslint.config.mjs jest.config.ts jest.preset.js \
  nx.json package.json package-lock.json tsconfig.base.json \
  libs/

git commit -m "$(cat <<'EOF'
chore: scaffold Nx monorepo with shared types library

Configure Nx workspace with ESLint flat config, Jest, TypeScript base config,
and shared-types library exporting enums (EventCategory, EventStatus) and
interfaces (IEvent, IUser, IAuthResponse, DTOs).
EOF
)"

# ============================================================
# COMMIT 2: REST API (versiones intermedias sin auth/graphql)
# ============================================================

# Escribir versiones intermedias de archivos que evolucionan
cat > apps/api/src/app/app.module.ts << 'APPMOD'
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsModule } from '../modules/events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>(
          'MONGODB_URI',
          'mongodb://localhost:27017/event-board',
        ),
      }),
    }),
    EventsModule,
  ],
})
export class AppModule {}
APPMOD

cat > apps/api/src/modules/events/events.module.ts << 'EVMOD'
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { Event, EventSchema } from './schemas/event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }]),
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
EVMOD

cat > apps/api/src/modules/events/events.controller.ts << 'EVCTRL'
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { FilterEventsDto } from './dto/filter-events.dto';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  create(@Body() createEventDto: CreateEventDto) {
    return this.eventsService.create(createEventDto);
  }

  @Get()
  findAll(@Query() filterDto: FilterEventsDto) {
    return this.eventsService.findAll(filterDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventsService.update(id, updateEventDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }
}
EVCTRL

cat > apps/api/src/main.ts << 'MAIN'
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:4200';
  const allowedOrigins = new Set(
    corsOrigin.split(',').map((o) => o.trim())
  );
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(
    `Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap();
MAIN

# Agregar archivos del API (versiones intermedias ya escritas)
git add \
  apps/api/project.json apps/api/tsconfig.json apps/api/tsconfig.app.json \
  apps/api/tsconfig.spec.json apps/api/webpack.config.js apps/api/jest.config.ts \
  apps/api/.env.example apps/api/src/main.ts apps/api/src/app/ apps/api/src/assets/ \
  apps/api/src/modules/events/events.module.ts \
  apps/api/src/modules/events/events.controller.ts \
  apps/api/src/modules/events/events.service.ts \
  apps/api/src/modules/events/schemas/ \
  apps/api/src/modules/events/dto/

git commit -m "$(cat <<'EOF'
feat(api): add NestJS REST API with events CRUD and MongoDB

Implement EventsModule with controller, service, Mongoose schema and DTOs.
Endpoints: POST/GET/GET:id/PATCH/DELETE /api/events with combinable filters
(category, status, date range, search). Global ValidationPipe with whitelist
and transform enabled. MongoDB connection via Mongoose with ConfigService.
EOF
)"

# ============================================================
# COMMIT 3: JWT Auth (actualizar archivos a v2)
# ============================================================

# Actualizar app.module.ts v2: agregar AuthModule
cat > apps/api/src/app/app.module.ts << 'APPMOD2'
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsModule } from '../modules/events/events.module';
import { AuthModule } from '../modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>(
          'MONGODB_URI',
          'mongodb://localhost:27017/event-board',
        ),
      }),
    }),
    AuthModule,
    EventsModule,
  ],
})
export class AppModule {}
APPMOD2

# Actualizar events.module.ts v2: agregar AuthModule
cat > apps/api/src/modules/events/events.module.ts << 'EVMOD2'
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { Event, EventSchema } from './schemas/event.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }]),
    AuthModule,
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
EVMOD2

# Actualizar events.controller.ts v2: agregar guards (versión final)
cat > apps/api/src/modules/events/events.controller.ts << 'EVCTRL2'
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { FilterEventsDto } from './dto/filter-events.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/guards/public.decorator';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createEventDto: CreateEventDto) {
    return this.eventsService.create(createEventDto);
  }

  @Get()
  @Public()
  findAll(@Query() filterDto: FilterEventsDto) {
    return this.eventsService.findAll(filterDto);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventsService.update(id, updateEventDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }
}
EVCTRL2

# Agregar archivos de auth + actualizar los que evolucionaron
git add \
  apps/api/src/modules/auth/auth.module.ts \
  apps/api/src/modules/auth/auth.controller.ts \
  apps/api/src/modules/auth/auth.service.ts \
  apps/api/src/modules/auth/dto/ \
  apps/api/src/modules/auth/guards/jwt-auth.guard.ts \
  apps/api/src/modules/auth/guards/public.decorator.ts \
  apps/api/src/modules/auth/schemas/ \
  apps/api/src/app/app.module.ts \
  apps/api/src/modules/events/events.module.ts \
  apps/api/src/modules/events/events.controller.ts

git commit -m "$(cat <<'EOF'
feat(api): add JWT authentication with guards and public decorator

Implement AuthModule with register/login endpoints, bcrypt password hashing,
JWT token generation. Add global JwtAuthGuard protecting write endpoints,
@Public() decorator for opt-out on read routes. Update EventsModule and
controller to integrate auth guards.
EOF
)"

# ============================================================
# COMMIT 4: GraphQL (actualizar archivos a versión final)
# ============================================================

# Restaurar app.module.ts a versión final (con GraphQL)
cat > apps/api/src/app/app.module.ts << 'APPMOD3'
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { EventsModule } from '../modules/events/events.module';
import { AuthModule } from '../modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>(
          'MONGODB_URI',
          'mongodb://localhost:27017/event-board',
        ),
      }),
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'schema.gql'),
      sortSchema: true,
      playground: true,
      introspection: true,
    }),
    AuthModule,
    EventsModule,
  ],
})
export class AppModule {}
APPMOD3

# Restaurar events.module.ts a versión final (con Resolver)
cat > apps/api/src/modules/events/events.module.ts << 'EVMOD3'
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { EventsResolver } from './events.resolver';
import { Event, EventSchema } from './schemas/event.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }]),
    AuthModule,
  ],
  controllers: [EventsController],
  providers: [EventsService, EventsResolver],
  exports: [EventsService],
})
export class EventsModule {}
EVMOD3

# Restaurar main.ts a versión final (con /graphql exclusion)
cat > apps/api/src/main.ts << 'MAIN3'
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix, {
    exclude: ['graphql'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:4200';
  const allowedOrigins = new Set(
    corsOrigin.split(',').map((o) => o.trim())
  );
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(
    `Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
  Logger.log(`GraphQL Playground: http://localhost:${port}/graphql`);
}

bootstrap();
MAIN3

# Agregar nuevos archivos de GraphQL + archivos actualizados
git add \
  apps/api/src/modules/events/events.resolver.ts \
  apps/api/src/modules/events/graphql/ \
  apps/api/src/modules/auth/guards/gql-auth.guard.ts \
  apps/api/src/app/app.module.ts \
  apps/api/src/modules/events/events.module.ts \
  apps/api/src/main.ts

git commit -m "$(cat <<'EOF'
feat(api): add GraphQL endpoint with Apollo Server code-first

Add EventsResolver reusing existing EventsService. Separate GqlAuthGuard
for GraphQL execution context. Queries: events(filter), event(id).
Mutation: createEvent with JWT protection. Update AppModule with
GraphQLModule and main.ts to exclude /graphql from API prefix.
EOF
)"

# ============================================================
# COMMIT 5: Tests
# ============================================================
git add \
  apps/api/src/modules/events/__tests__/ \
  apps/api-e2e/

git commit -m "$(cat <<'EOF'
test(api): add unit, integration and e2e tests (33 total)

Unit tests (12): EventsService with mocked Mongoose model, all CRUD
operations, filter combinations (category, status, date range, search).
Integration tests (8): Controller endpoints with ValidationPipe and mocked service.
E2E tests (13): Full auth + CRUD flow with mongodb-memory-server and Supertest.
EOF
)"

# ============================================================
# COMMIT 6: Web Host (React shell)
# ============================================================
git add apps/web-host/

git commit -m "$(cat <<'EOF'
feat(web): add React shell with auth context and Module Federation

Configure web-host as Module Federation shell (port 4200) consuming
webEvents remote. AuthContext with localStorage persistence, login/register
pages, Navbar with user dropdown. UI with shadcn/ui components, Tailwind
CSS v4 theming with oklch color palette, Inter font.
EOF
)"

# ============================================================
# COMMIT 7: WebEvents Remote (micro-frontend)
# ============================================================
git add apps/webEvents/

git commit -m "$(cat <<'EOF'
feat(web): add webEvents micro-frontend with event CRUD UI

Module Federation remote exposing ./Module via remote-entry.ts (imports
styles.css for CSS bundling). Timeline event list grouped by date with
Upcoming/Past tabs, filters (category, status, search), creation form
with shadcn/ui DatePicker/Select/Textarea and Zod v4 validation, detail
view with two-column layout. TanStack Query hooks with cache invalidation.
EOF
)"

# ============================================================
# COMMIT 8: Docker
# ============================================================
git add .dockerignore Dockerfile.web apps/api/Dockerfile docker-compose.yml nginx.conf

git commit -m "$(cat <<'EOF'
infra: add Docker multi-stage builds, nginx and docker-compose

Multi-stage Dockerfiles for API (node:20-alpine) and web (nginx:alpine).
Nginx reverse proxy for /api and /graphql, SPA fallback, static asset
caching (1y immutable). Docker Compose orchestrates MongoDB (with health
check), API and web services.
EOF
)"

# ============================================================
# COMMIT 9: CI/CD
# ============================================================
git add .github/

git commit -m "$(cat <<'EOF'
ci: add GitHub Actions pipeline with lint, test, e2e and build

Four-job pipeline using nx affected for monorepo efficiency:
lint, test (with coverage artifact), e2e (mongodb-memory-server),
build (gated on lint + test success).
EOF
)"

# ============================================================
# COMMIT 10: Husky + commitlint + lint-staged
# ============================================================
git add .husky/ commitlint.config.js package.json package-lock.json

git commit -m "$(cat <<'EOF'
chore: add Husky with commitlint and lint-staged

Configure git hooks: pre-commit runs ESLint and Prettier on staged files
via lint-staged, commit-msg validates Conventional Commits via commitlint.
Custom types include 'infra' for infrastructure changes.
EOF
)" --no-verify

# ============================================================
# COMMIT 11: Documentación
# ============================================================
git add README.md TECHNICAL_DECISIONS.md COMMIT_PLAN.md

git commit -m "$(cat <<'EOF'
docs: add README with setup instructions and technical decisions

README with architecture diagram, stack tables, API reference, testing
summary (33 tests), desirables checklist (6/6), code quality section,
and git hooks documentation. TECHNICAL_DECISIONS.md justifies every
architectural choice with trade-offs.
EOF
)"

echo "✓ 11 commits creados exitosamente"
git log --oneline
```

---

## Convenciones

- **Prefijos**: `chore`, `feat`, `test`, `infra`, `ci`, `docs` — Conventional Commits (enforced por commitlint)
- **Scopes**: `(api)`, `(web)` — identifican el project del monorepo
- **Cuerpo**: Primera línea <100 chars. Cuerpo con detalle técnico separado por línea vacía
- **Evolución**: Los archivos clave evolucionan incrementalmente a través de los commits:
  - Commit 2: API REST pura
  - Commit 3: + autenticación JWT (controller se protege, module importa auth)
  - Commit 4: + GraphQL (module agrega resolver, main excluye /graphql)
  - Commit 10: Husky hooks enforcan convenciones desde este punto

## Verificación post-script

Después de ejecutar, verificar que el último commit tiene los archivos en su versión final:
```bash
git diff HEAD -- apps/api/src/app/app.module.ts        # Debe estar vacío
git diff HEAD -- apps/api/src/modules/events/events.module.ts  # Debe estar vacío
git diff HEAD -- apps/api/src/main.ts                   # Debe estar vacío
```
