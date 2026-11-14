# Mercato API — AI Conventions

## Project Overview

Mercato is a TypeScript REST API for an e-commerce store, built as a portfolio project. The
roadmap: product catalogue, cart, orders, checkout with Paystack and Flutterwave, automated
order-status updates, an admin dashboard API, and later an AI customer-support agent that can
read order statuses (with restrictions) and answer guests as well as signed-in customers.

Git workflow: `main` is for fixes only. All feature work branches off `develop` and lands via a
PR into `develop` that the project owner reviews. Never push feature work straight to `develop`
or `main`.

Architecture, folder layout and
conventions follow `branda-core-api` (sibling folder in `BACKEND/`); the differences are listed
under **Deviations from Branda** below.

## Tech Stack

- **Runtime:** Node.js 22, TypeScript 7 (native compiler, strict mode), ESM (`"type": "module"`)
- **Framework:** Express 5
- **Database:** PostgreSQL 16 with Prisma 7 (`@prisma/adapter-pg`)
- **Validation:** Joi 18
- **Logging:** winston (`src/util/appLogger.ts`) — request/response/error events joined by `tag`
- **API Docs:** Scalar (`@scalar/express-api-reference`) at `/docs`
- **Testing:** Vitest + supertest (test files run serially against a separate test DB)
- **Lint/format:** oxlint + Prettier

## Architecture

**Controller → Service → Repository → Model** layered architecture:

```
routes/ → middleware/ → controllers/ → services/ → repository/ → database/
```

### Folder Layout

```
app.ts                    Express app: middleware, /docs, routes, 404, error handler
server.ts                 Starts the HTTP server, graceful shutdown
config/env.ts             All env vars, read once
database/postgres/
  schema.prisma           Table definitions
  migrations/             Prisma migrations
  prisma.ts               Shared PrismaClient
  generated/              Generated client (gitignored — `npm run db:generate`)
middleware/               error.ts, log.ts (cross-cutting Express middleware)
routes/                   index.ts mounts each router; one file per mount path
src/<domain>/             One folder per domain, e.g. src/product/
  controllers/            Validate (Joi) → call service → ResponseService
  services/               Business logic, throws AppError
  repository/             Thin Prisma wrapper
  models/                 Row + input types for the domain
  schemas/                Joi validation shapes
  constants/              (when needed) enums / fixed values
src/util/                 AppError, response (ResponseService), validate, appLogger
docs/openapi.ts           OpenAPI 3.1 spec served at /docs
tests/                    *.test.ts (unit) and *.e2e.test.ts (supertest), helpers/
```

### Layer Rules

| Layer      | Responsibility                                                        | Must NOT               |
| ---------- | --------------------------------------------------------------------- | ---------------------- |
| Route      | Mount path (+ future auth/role gates, rate limiter)                   | Business logic         |
| Controller | Validate input (Joi), call service, format response (ResponseService) | Query DB, domain rules |
| Service    | Business logic, transactions, throw AppError                          | Touch req/res          |
| Repository | Thin wrapper over `prisma.<model>`                                    | Business rules, HTTP   |
| Model      | Types for the domain's rows and inputs                                | Logic                  |
| Schema     | Joi validation shape                                                  | Anything else          |

Only repositories (and `database/`) import Prisma. Services and controllers import types from
`src/<domain>/models/`.

### Response Envelope

```ts
{ status: 'success' | 'failed', message: string, data: any }
```

Always use `ResponseService.json()` / `ResponseService.resolveError()`. Never `res.json()` directly.

### Error Handling

```ts
throw new AppError(404, 'Product not found');
```

`resolveError` maps `AppError` to its status code, malformed JSON bodies to 400, and anything
else to a logged 500 with a generic message. Controllers wrap their body in `try/catch` and call
`ResponseService.resolveError(res, e)`.

## Code Conventions

- **One responsibility per file** — split controllers, services, repositories
- **Depend inward, never outward** — lower layers never import upper layers
- **Validate at the edge, trust inside** — Joi validation only in controllers
- **No secrets in responses** — `password` stripped by ResponseService
- **TypeScript strict** — no `any`, no `@ts-ignore`
- **Modules:** controllers/services/repositories export a default object of functions
  (`export default { list, getOne, create }`)
- **File naming:** PascalCase (`ProductService.ts`); schemas named `<Domain>Schema.ts`
- **Imports:** relative paths, with the `.js` extension (required by ESM/`nodenext`)
- **Money:** integers in the smallest currency unit (kobo, cents)
- **Strings:** single quotes, 2-space indent, 100 cols (Prettier-enforced)

## Commands

```bash
npm run docker:up     # Local Postgres on :5434 (creates ecommerce + ecommerce_test DBs)
npm run dev           # Hot-reload dev server (tsx watch)
npm run build         # prisma generate + tsc
npm start             # Run compiled JS (dist/server.js)
npm run typecheck     # tsc --noEmit
npm run lint          # oxlint --fix
npm run format        # prettier --write
npm test              # Vitest; applies migrations to TEST_DATABASE_URL first
npm run migrate:dev   # Create a migration after editing schema.prisma
npm run migrate       # Apply migrations (prisma migrate deploy)
```

### Before Committing

All must pass: `typecheck`, `lint`, `format:check`, `test`, `build`.

## Feature Workflow (AI or Human)

1. **Design spec** first — `docs/specs/YYYY-MM-DD-<feature-name>.md` covering purpose,
   endpoints, data model, auth requirements
2. **Branch** from `develop`: `feature/<ticket>-<short-name>`
3. **Implement** outside-in:
   - Schema change in `database/postgres/schema.prisma` + `npm run migrate:dev`
   - Model types (`src/<domain>/models/`)
   - Joi schema
   - Service (business logic) — write test first
   - Repository
   - Controller (validate → call service → respond)
   - Route (wire under `routes/`, mount in `routes/index.ts`)
   - E2E test (supertest against `app`)
4. **Update OpenAPI spec** in `docs/openapi.ts`
5. **Verify** — `npm run typecheck && npm run lint && npm test && npm run build`
6. **Open PR** into `develop` — description covers what, why, how verified

## Where to Look When Adding Code

| Need                    | Reference                                     |
| ----------------------- | --------------------------------------------- |
| Existing domain to copy | `src/product/`                                |
| Route mounting          | `routes/index.ts`, `routes/product.ts`        |
| DB client               | `database/postgres/prisma.ts`                 |
| Response formatting     | `src/util/response.ts`                        |
| Error class             | `src/util/AppError.ts`                        |
| Validation helper       | `src/util/validate.ts`                        |
| Logger                  | `src/util/appLogger.ts`, `middleware/log.ts`  |
| Config                  | `config/env.ts`                               |
| OpenAPI spec            | `docs/openapi.ts`                             |
| Tests to follow         | `tests/` (`helpers/db.ts` resets the test DB) |

## Endpoints Reference

- `GET /`, `GET /health` — Health check
- `GET /products`, `POST /products`, `GET /products/:id`
- `GET /users` (paginated: `page`, `limit`, `role`, `search`), `POST /users`
- `GET|PATCH|DELETE /users/:id`
- `GET /docs` — API reference

User routes are unauthenticated for now. When auth lands they move under `/admin` behind
`authMiddleware` + `requireRole(ADMIN)`. Passwords are bcrypt-hashed and omitted from every Prisma
query by default (`database/postgres/prisma.ts`).

## Deviations from Branda

- **Prisma instead of Knex** — no generic `knexRepository`; repositories call `prisma.<model>`
  directly, and models hold types instead of `{ tableName, attributes }`.
- **Vitest instead of Jest, oxlint instead of ESLint** — TypeScript 7 is the native compiler with
  no JS API, which `ts-jest` and `typescript-eslint` need; Prisma 7's client is ESM-only.
- **ESM** — imports carry `.js` extensions.
- **No Redis, auth, rate limiting or OpenTelemetry yet** — add them following Branda's
  `database/redis`, `middleware/auth.ts`, `middleware/ratelimit.ts`, `tracing.ts` when needed.
