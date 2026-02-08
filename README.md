# Dynamic Resource Management Engine (DRME)

A multi-tenant ERP / Project Management platform built on a **meta-schema architecture**. Business entity types, attributes, and workflows are defined at runtime — no code changes or migrations needed to add new resource types.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | NestJS 11 · TypeScript · Node.js ≥ 20 |
| **Database** | PostgreSQL 16 · Prisma 7 ORM (driver adapter: `@prisma/adapter-pg`) |
| **Frontend** | React 19 · Vite 7 · React Router 7 |
| **Auth** | Passport.js (JWT, Google OAuth2, GitHub OAuth) |
| **Email** | Resend SDK (dev: console fallback) |
| **Styling** | CSS Modules with CSS Custom Properties |
| **Animations** | anime.js |
| **Deployment** | Render (API) · Vercel (Client) · Neon (Database) |

---

## Architecture

DRME uses an **Entity-Attribute-Value (EAV) meta-schema** pattern ([ADR-001](docs/architecture/adr/001-metaSchemaArchitecture.md)):

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│ EntityType   │────▶│ Attribute    │────▶│ AttributeOption  │
│ (project,    │     │ (title,      │     │ (low, medium,    │
│  task, etc.) │     │  status...)  │     │  high, urgent)   │
└──────┬───────┘     └──────┬───────┘     └─────────────────┘
       │                    │
       ▼                    ▼
┌─────────────┐     ┌─────────────────┐
│EntityInstance│────▶│ AttributeValue   │
│ (record #42) │     │ (stringValue,    │
└──────┬───────┘     │  numberValue...) │
       │             └─────────────────┘
       ▼
┌──────────────────┐     ┌────────────────┐     ┌──────────────────┐
│WorkflowInstance   │────▶│ WorkflowState   │────▶│WorkflowTransition │
│ (current: active) │     │ (draft, active, │     │ (activate,        │
└──────────────────┘     │  completed)     │     │  complete)        │
                         └────────────────┘     └──────────────────┘
```

New entity types (e.g. "Purchase Order", "Ticket") are created through the API — each gets its own attributes, validation rules, enum options, and workflow states automatically.

---

## Project Structure

```
DynamicResourceManagementEngine/
├── apps/
│   ├── api/                    # NestJS backend
│   │   ├── prisma/             #   Schema, migrations, seed
│   │   └── src/
│   │       ├── auth/           #   JWT + OAuth authentication
│   │       ├── security/       #   RBAC + ABAC authorization
│   │       ├── tenant/         #   Multi-tenancy (AsyncLocalStorage)
│   │       ├── entity-type/    #   Entity type CRUD
│   │       ├── attribute/      #   Attribute CRUD + options
│   │       ├── prisma/         #   Database service
│   │       └── common/         #   Shared validators
│   └── client/                 # React SPA
│       └── src/
│           ├── api/            #   API client + auth + entity APIs
│           ├── components/     #   UI, layout, workspace, renderer
│           ├── context/        #   10 React context providers
│           ├── hooks/          #   Animation + keyboard shortcuts
│           ├── pages/          #   14 pages (public + protected)
│           └── styles/         #   CSS modules
├── packages/
│   └── shared/                 # Shared types (placeholder)
├── docker/                     # Docker Compose (dev + staging)
└── docs/                       # Architecture Decision Records
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **Docker** & Docker Compose (for PostgreSQL)

### Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd DynamicResourceManagementEngine
npm install

# 2. Create your environment file
cp .env.production.template .env
# Edit .env with your values (defaults work for local dev)

# 3. Start PostgreSQL
docker-compose -f docker/docker-compose.dev.yml up -d

# 4. Generate Prisma client + run migrations
cd apps/api
npx prisma generate
npx prisma migrate deploy

# 5. Seed the database
npx prisma db seed

# 6. Start development servers (from root)
cd ../..
npm run dev
```

The API runs at **http://127.0.0.1:3000** and the client at **http://127.0.0.1:5173**.

### Default Credentials

| Field | Value |
|-------|-------|
| Email | `admin@demo.local` |
| Password | `ChangeMe123!` |
| Tenant | `demo` (slug) |

---

## API Reference

### Authentication (`/auth`)

All auth routes are **public** (no JWT required).

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register new user (sends verification email) |
| `GET` | `/auth/verify-email/:token` | Verify email address |
| `POST` | `/auth/login` | Login → returns access token + sets HttpOnly refresh cookie |
| `POST` | `/auth/refresh` | Rotate tokens via refresh cookie |
| `POST` | `/auth/logout` | Clears refresh token |
| `GET` | `/auth/me` | Get current user profile *(requires JWT)* |
| `POST` | `/auth/forgot-password` | Request password reset email |
| `POST` | `/auth/reset-password` | Reset password with token |
| `GET` | `/auth/google` | Initiate Google OAuth flow |
| `GET` | `/auth/google/callback` | Google OAuth callback |
| `GET` | `/auth/github` | Initiate GitHub OAuth flow |
| `GET` | `/auth/github/callback` | GitHub OAuth callback |

### Entity Types (`/entity-types`)

All routes require JWT + `entityType:{action}` permission.

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| `POST` | `/entity-types` | `create` | Create entity type |
| `GET` | `/entity-types` | `read` | List (paginated, searchable, sortable) |
| `GET` | `/entity-types/:id` | `read` | Get by ID |
| `GET` | `/entity-types/:id/with-relations` | `read` | Get with attribute/instance/workflow counts |
| `PUT` | `/entity-types/:id` | `update` | Update entity type |
| `DELETE` | `/entity-types/:id` | `delete` | Soft delete |
| `POST` | `/entity-types/bulk` | `create` | Bulk create (max 50, partial success) |

### Attributes (`/attributes`)

All routes require JWT + `attribute:{action}` permission.

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| `POST` | `/attributes` | `create` | Create attribute |
| `GET` | `/attributes` | `read` | List (paginated, filterable by entity type / data type) |
| `GET` | `/attributes/:id` | `read` | Get by ID |
| `PUT` | `/attributes/:id` | `update` | Update attribute |
| `DELETE` | `/attributes/:id` | `delete` | Delete attribute |
| `POST` | `/attributes/bulk` | `create` | Bulk create (max 50) |
| `POST` | `/attributes/:id/options` | `update` | Add enum option |
| `PUT` | `/attributes/:id/options/:optionId` | `update` | Update enum option |
| `DELETE` | `/attributes/:id/options/:optionId` | `update` | Delete enum option |

### Supported Data Types

`STRING` · `TEXT` · `NUMBER` · `DECIMAL` · `DATE` · `DATETIME` · `BOOLEAN` · `ENUM` · `RELATION` · `JSON`

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check (no auth, no tenant required) |

---

## Multi-Tenancy

Every request (except `/auth/*` and `/health`) must identify a tenant. Resolution order:

1. `X-Tenant-Id` header (UUID or slug)
2. Subdomain (`tenant.example.com`)
3. Query parameter (`?tenantId=...`)
4. JWT payload `tenantId`

Tenant context propagates via Node.js `AsyncLocalStorage`. All repository queries are automatically scoped to the current tenant through `TenantAwareRepository`.

---

## Security

DRME implements defense-in-depth following OWASP best practices.

### Security Layers

| Layer | Implementation |
|-------|---------------|
| **Rate Limiting** | 100 req/min global · 20 req/min on auth endpoints |
| **Authentication** | JWT access tokens (15min) · HttpOnly refresh cookies (7d) · Token rotation |
| **RBAC** | Role → Permission mapping with 5-minute cache · `manage` grants all actions |
| **ABAC** | JSON policy engine with AND/OR conditions, 11 operators, priority-based evaluation |
| **Tenant Isolation** | AsyncLocalStorage context · Automatic query scoping · Cross-tenant access throws `ForbiddenException` |
| **Password Security** | bcrypt (12 rounds) · Min 12 chars · Common pattern detection · Account lockout after 5 failures (15min) |
| **HTTP Headers** | Helmet.js: CSP, HSTS (prod), X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy |
| **CORS** | Strict origin whitelist · Credentials enabled for cookies |
| **Input Validation** | Global `ValidationPipe` · Whitelist mode · Non-whitelisted properties rejected |
| **SQL Injection** | Prisma parameterized queries only (no raw SQL) |

### Default Roles

| Role | Permissions |
|------|------------|
| `admin` | Full `manage` on all resources |
| `manager` | CRUD on entityType, entityInstance, workflow |
| `member` | Read-only on entityType, entityInstance |

### ABAC Policy Engine

Access policies support fine-grained, attribute-based rules:

```json
{
  "conditions": {
    "all": [
      { "attribute": "context.userRoles", "operator": "contains", "value": "manager" },
      { "attribute": "entity.createdById", "operator": "eq", "value": "context.userId" }
    ]
  },
  "effect": "ALLOW",
  "priority": 10
}
```

**Operators:** `eq` · `neq` · `in` · `nin` · `gt` · `gte` · `lt` · `lte` · `contains` · `startsWith` · `endsWith`

---

## Database Schema

### Models

| Model | Description |
|-------|-------------|
| `Tenant` | Organization / workspace (slug-based) |
| `User` | Tenant-scoped user with email/password or OAuth (Google/GitHub) |
| `Role` | Named role per tenant (system or custom) |
| `Permission` | Resource + action pair (e.g. `entityType:create`) |
| `RolePermission` | Many-to-many: Role ↔ Permission |
| `UserRole` | Many-to-many: User ↔ Role |
| `AccessPolicy` | ABAC policy with JSON conditions, effect (ALLOW/DENY), priority |
| `EntityType` | Dynamic business object definition (e.g. Project, Task, Invoice) |
| `Attribute` | Field definition for an entity type (name, data type, validation) |
| `AttributeOption` | Enum values for ENUM-type attributes |
| `EntityInstance` | Actual record / row of a given entity type |
| `AttributeValue` | Polymorphic value storage (string, number, boolean, date, JSON columns) |
| `WorkflowDefinition` | State machine definition per entity type |
| `WorkflowState` | Named state (draft, active, completed, etc.) |
| `WorkflowTransition` | Allowed state change with optional permission requirement |
| `WorkflowInstance` | Current workflow state for an entity instance |

### Seed Data

The seed script creates a complete demo environment:

- **1 Tenant** — "Demo Organization" (slug: `demo`)
- **30 Permissions** — 6 resources × 5 actions (create, read, update, delete, manage)
- **3 Roles** — admin, manager, member (with appropriate permissions)
- **1 Admin User** — `admin@demo.local` / `ChangeMe123!`
- **3 Entity Types** with attributes:
  - **Project** — title, description, startDate, endDate, budget, isActive
  - **Task** — title, description, dueDate, priority (enum: low/medium/high/urgent), estimatedHours
  - **Invoice** — invoiceNumber (unique), clientName, amount, issueDate, dueDate, notes
- **3 Workflows** — Each entity type gets: draft → active → completed

---

## Frontend

### Pages

| Route | Page | Access |
|-------|------|--------|
| `/` | Landing Page | Public |
| `/features` | Features | Public |
| `/about` | About | Public |
| `/contact` | Contact | Public |
| `/pricing` | Pricing | Public |
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/verify-email` | Email Verification | Public |
| `/forgot-password` | Forgot Password | Public |
| `/reset-password` | Reset Password | Public |
| `/auth/callback` | OAuth Callback | Public |
| `/app` | Dashboard | Protected |
| `/app/schemas` | Schema Manager | Protected |
| `/app/settings` | Settings | Protected |

### Key Components

- **SchemaRenderer** — Dynamically renders forms/views from entity type definitions
- **CommandPalette** — Ctrl+K search across workspace
- **FluidShell** — Main application layout shell
- **CommentsPanel / ProjectPanel / ProjectTabs** — Workspace panels

### Context Providers

`ThemeProvider` · `AuthProvider` · `ToastProvider` · `WorkspaceProvider` · `PriorityProvider` · `FavoritesProvider` · `PinsProvider` · `RecentProvider` · `ActivityProvider` · `CommentsProvider`

### API Client

The frontend uses a custom fetch-based API client with:
- Automatic tenant detection (subdomain → localStorage → env)
- JWT token management with auto-refresh on 401
- `X-Tenant-Id` header injection on every request
- `credentials: 'include'` for HttpOnly cookie support

---

## Environment Variables

All secrets are configured in `.env` (never committed). See `.env.production.template` for the full list.

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | — |
| `JWT_SECRET` | Access token signing key (32+ chars) | Yes | — |
| `JWT_REFRESH_SECRET` | Refresh token signing key | Yes | — |
| `JWT_ACCESS_EXPIRY` | Access token TTL | No | `15m` |
| `JWT_REFRESH_EXPIRY` | Refresh token TTL | No | `7d` |
| `NODE_ENV` | Environment | No | `development` |
| `API_PORT` | API listen port | No | `3000` |
| `CORS_ORIGINS` | Comma-separated allowed origins | Yes | — |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | No | `60000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | No | `100` |
| `RESEND_API_KEY` | Resend email API key | No | Logs to console |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No | Disables Google auth |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | No | — |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | No | Disables GitHub auth |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth secret | No | — |
| `VITE_API_URL` | API URL for client (Vercel) | No | `http://127.0.0.1:3000` |
| `VITE_DEFAULT_TENANT_ID` | Default tenant for client | No | — |

Generate secrets: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

---

## Available Scripts

### Root (workspace)

```bash
npm run dev              # Start API + client in dev mode
npm run dev:api          # Start API only (watch mode)
npm run dev:client       # Start client only (Vite HMR)
npm run build            # Build all workspaces
npm run build:api        # Build API → apps/api/dist
npm run build:client     # Build client → apps/client/dist
npm run test             # Run all tests
npm run test:api         # Run API tests only
npm run lint             # Lint all workspaces
```

### Database

```bash
npm run db:migrate       # Apply migrations (production)
npm run db:migrate:dev   # Create + apply migration (development)
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio GUI
```

### Docker

```bash
npm run docker:up        # Start PostgreSQL container
npm run docker:down      # Stop PostgreSQL container
npm run docker:logs      # Follow container logs
```

### API (`apps/api`)

```bash
npm run start:dev        # Watch mode
npm run start:debug      # Debug mode
npm run build            # Production build
npm run start:prod       # Run production build
npm run test             # Unit tests
npm run test:watch       # Watch mode
npm run test:cov         # Coverage report
npm run test:e2e         # End-to-end tests
npm run lint             # Lint + autofix
npm run format           # Prettier format
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Create dev migration
```

---

## Deployment

DRME deploys for free across three platforms:

| Component | Platform | Free Tier |
|-----------|----------|-----------|
| **API** | [Render](https://render.com) | 750 hrs/month, auto-sleep after 15min |
| **Client** | [Vercel](https://vercel.com) | 100 GB bandwidth/month |
| **Database** | [Neon](https://neon.tech) | 0.5 GB storage, 191 compute hrs/month |

Configuration files:
- `render.yaml` — Render blueprint (auto-detected on connect)
- `vercel.json` — Vercel build config (SPA routing)
- `.env.production.template` — Reference for all production env vars

See the deployment guide in `.env.production.template` comments for step-by-step instructions.

---

## Testing

```bash
# Run all API tests
npm run test:api

# Tested components:
# - PolicyEvaluatorService: ABAC matching, priority, operators, AND/OR conditions
# - TenantContextService: AsyncLocalStorage isolation, context management
# - Password Validator: Strength requirements, common pattern detection
# - EntityType: Controller, service, repository unit tests
# - Auth: Security-focused tests (lockout, token rotation, etc.)
```

---

## Git Workflow

| Branch | Purpose |
|--------|---------|
| `main` | Production (locked, requires PR) |
| `development` | Staging integration |
| `feature/camelCaseName` | Feature branches |

---

## License

Proprietary — All rights reserved.
