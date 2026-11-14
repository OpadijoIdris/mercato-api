# Mercato API

**An e-commerce backend with Paystack and Flutterwave checkout, automated order tracking, a
full admin dashboard API, and an AI customer-support agent that can answer order questions.**

Mercato is the backend for an online store. Customers browse products, fill a cart, place
orders and pay with Paystack or Flutterwave; order statuses update automatically as payments
and fulfilment progress. Admins manage the catalogue, customers and orders from a dashboard
API. The final piece is an AI support agent that reads order statuses (within strict limits) and
answers enquiries, including from visitors who aren't signed in.

> **Status: early development.** The foundation and the first APIs are in place; features land
> one pull request at a time. See the [roadmap](#roadmap).

## Roadmap

- [x] Layered architecture, response envelope, centralised error handling, structured logging
- [x] Interactive API docs (OpenAPI 3.1 + Scalar)
- [x] Users API: CRUD, pagination, filtering, search, bcrypt password hashing
- [x] Products API: create, list, get
- [ ] Authentication: JWT access and refresh tokens, roles (customer / admin)
- [ ] Product catalogue: categories, images, inventory, search
- [ ] Cart
- [ ] Orders and checkout
- [ ] Payments: Paystack and Flutterwave, with verified webhooks
- [ ] Automated order-status updates (paid → processing → shipped → delivered)
- [ ] Admin dashboard API: sales, orders, customers and inventory management
- [ ] AI customer-support agent: answers order and store enquiries for guests and customers

## Tech stack

| Area           | Choice                                                    |
| -------------- | --------------------------------------------------------- |
| Runtime        | Node.js 22, TypeScript 7 (strict), ES modules             |
| Framework      | Express 5                                                 |
| Database       | PostgreSQL 16, Prisma 7                                   |
| Validation     | Zod (schemas generate both the TS types and the API docs) |
| Logging        | winston (structured JSON, per-request correlation tags)   |
| API docs       | OpenAPI 3.1 rendered with Scalar                          |
| Testing        | Vitest + supertest against a real Postgres test database  |
| Code quality   | oxlint, Prettier, Husky git hooks, GitHub Actions CI      |
| Local services | Docker Compose                                            |

## Architecture

Requests flow through clearly separated layers, and each layer only depends on the one below it:

```
routes → controllers → services → repositories → database
```

| Layer            | Responsibility                                                          |
| ---------------- | ----------------------------------------------------------------------- |
| **Routes**       | Map URLs to controllers (and, soon, auth and role guards)               |
| **Controllers**  | Validate input with Zod, call a service, send a consistent response     |
| **Services**     | Business rules; throw `AppError(status, message)` for expected failures |
| **Repositories** | Thin data-access wrappers over Prisma                                   |

Every response uses the same envelope:

```json
{ "status": "success", "message": "User created", "data": { "id": "…" } }
```

Some design decisions worth noting:

- **Money is stored as integers** in the smallest currency unit (kobo, cents), so prices never
  hit floating-point rounding errors.
- **Password hashes can't leak.** The Prisma client omits `password` from every user query by
  default; code has to opt in explicitly to read it.
- **Uniqueness is enforced by the database.** An email check gives a friendly error, and the
  unique index is the real guarantee, so concurrent sign-ups with the same email still get a
  clean `409` instead of a duplicate row or a `500`.
- **Secrets are masked in logs** (passwords, tokens, authorization headers).

### Project structure

```
src/
  app.ts, server.ts        Express app and HTTP server
  config/                  Environment configuration
  database/                Prisma client and database error translation
  middleware/              Logging and error-handling middleware
  routes/                  One router per resource, mounted in routes/index.ts
  <domain>/                controllers/ services/ repository/ models/ schemas/
  util/                    AppError, response envelope, validation, logger, pagination
  docs/openapi.ts          OpenAPI spec served at /docs
database/postgres/         Prisma schema and SQL migrations
docs/                      Insomnia collection
tests/                     Unit and end-to-end tests
```

## Getting started

**Prerequisites:** Node.js 22+ and Docker.

```bash
git clone https://github.com/OpadijoIdris/mercato-api.git
cd mercato-api
npm install                  # also generates the Prisma client
cp .env.example .env
npm run docker:up            # Postgres on localhost:5434 (dev + test databases)
npm run migrate              # apply database migrations
npm run dev                  # http://localhost:3000
```

Then open **http://localhost:3000/docs** for the interactive API reference.

### Testing the API by hand

Import [`docs/insomnia.json`](docs/insomnia.json) into Insomnia and choose the **Local**
environment. It contains every endpoint with example bodies, plus deliberate error cases.

## API

| Method | Endpoint        | Description                                    |
| ------ | --------------- | ---------------------------------------------- |
| GET    | `/health`       | Health check                                   |
| GET    | `/users`        | List users (`page`, `limit`, `role`, `search`) |
| POST   | `/users`        | Create a user                                  |
| GET    | `/users/:id`    | Get a user                                     |
| PATCH  | `/users/:id`    | Update a user                                  |
| DELETE | `/users/:id`    | Delete a user                                  |
| GET    | `/products`     | List products (`page`, `limit`, `search`)      |
| POST   | `/products`     | Create a product                               |
| GET    | `/products/:id` | Get a product                                  |

> User endpoints are open while authentication is being built; they move behind admin-only
> access when auth lands.

## Scripts

| Command               | What it does                                      |
| --------------------- | ------------------------------------------------- |
| `npm run dev`         | Start the dev server with hot reload              |
| `npm test`            | Run the test suite (migrates the test DB first)   |
| `npm run typecheck`   | Type-check without emitting                       |
| `npm run lint`        | Lint with oxlint                                  |
| `npm run format`      | Format with Prettier                              |
| `npm run build`       | Generate the Prisma client and compile to `dist/` |
| `npm start`           | Run the compiled server                           |
| `npm run migrate:dev` | Create a migration after editing the schema       |

## Development workflow

- `main` holds released code and fixes.
- `develop` is the integration branch.
- Every feature is built on its own branch off `develop` and merged through a reviewed pull
  request. CI runs typecheck, lint, format check, build and the full test suite on every push.
