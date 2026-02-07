# Dynamic Resource Management Engine (DRME)

An advanced Project Management/ERP system with meta-schema architecture, dynamic frontend, and enterprise-grade security.

## Tech Stack

- **Backend**: Node.js with NestJS (TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **Frontend**: React with Vite
- **Styling**: External CSS with CSS Variables
- **Deployment**: Docker + Docker Compose

## Project Structure

```
DynamicResourceManagementEngine/
├── apps/
│   ├── api/                 # NestJS backend
│   └── client/              # React frontend
├── packages/
│   └── shared/              # Shared types/utilities
├── docker/                  # Docker Compose files
└── docs/                    # Architecture documentation
```

## Getting Started

### Prerequisites

- Node.js 20.x LTS
- Docker and Docker Compose
- PostgreSQL 16 (via Docker)

### Local Development

1. Clone the repository
2. Copy environment files:
   ```bash
   cp .env.example .env
   ```
3. Start the database:
   ```bash
   docker-compose -f docker/docker-compose.dev.yml up -d postgres
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Run database migrations:
   ```bash
   npm run db:migrate
   ```
6. Start development servers:
   ```bash
   npm run dev
   ```

## Security

DRME implements enterprise-grade security with defense-in-depth. All security measures follow OWASP best practices.

### Security Features

| Feature              | Implementation                                                          |
| -------------------- | ----------------------------------------------------------------------- |
| **Authentication**   | JWT with HttpOnly refresh token cookies, token rotation on use          |
| **Authorization**    | RBAC (Role-Based) + ABAC (Attribute-Based) policy evaluation            |
| **Multi-Tenancy**    | Strict tenant isolation via AsyncLocalStorage context                   |
| **Rate Limiting**    | Tiered throttling: 100 req/min general, 5 req/min for auth endpoints    |
| **Password Policy**  | 12+ chars, mixed case, numbers, special chars, common pattern detection |
| **HTTP Security**    | Helmet.js with CSP, HSTS, XSS protection, clickjacking prevention       |
| **CORS**             | Strict origin validation, credentials support for cookies               |
| **Input Validation** | Global ValidationPipe with whitelist and forbidNonWhitelisted           |
| **SQL Injection**    | Prisma parameterized queries (no raw SQL)                               |

### Security Testing

Tests run with Jest. Execute with `npm test` in `apps/api/`:

```
Test Suites: 4 passed
Tests:       36 passed

Tested components:
- PolicyEvaluatorService: ABAC policy matching, priority, operators, AND/OR conditions
- TenantContextService: AsyncLocalStorage isolation, context management
- Password Validator: Strength requirements, common pattern detection
```

### Environment Variables

All secrets must be configured in `.env` (never committed). Critical variables:

| Variable             | Description                                       | Required |
| -------------------- | ------------------------------------------------- | -------- |
| `JWT_SECRET`         | Access token signing key (32+ chars)              | Yes      |
| `JWT_REFRESH_SECRET` | Refresh token signing key (different from access) | Yes      |
| `DATABASE_URL`       | PostgreSQL connection string                      | Yes      |
| `CORS_ORIGINS`       | Comma-separated allowed origins                   | Yes      |

Generate secrets with: `openssl rand -base64 64`

### Security Best Practices

1. **Secrets**: Use strong, unique secrets per environment
2. **HTTPS**: Always use HTTPS in production (HSTS enabled)
3. **Logging**: Sensitive data is never logged
4. **Updates**: Keep dependencies updated (`npm audit`)
5. **Cookies**: Refresh tokens use HttpOnly, Secure, SameSite=Strict

## Git Workflow

- `main`: Production (locked, requires PR)
- `development`: Staging (locked, requires PR)
- `feature/camelCaseName`: Feature branches

# Development

npm run start:dev # Start API in watch mode
npm run build # Build for production
npm run start:prod # Run production build

# Database

npm run prisma:generate # Generate Prisma client
npm run prisma:migrate # Create and apply migration
npm run prisma:migrate:deploy # Apply migrations (production)
npm run prisma:seed # Seed database
npm run db:setup # Migrate + Seed

# Testing

npm run test # Run unit tests
npm run test:watch # Watch mode
npm run test:cov # Coverage report
npm run test:e2e # End-to-end tests

# Code Quality

npm run lint # Lint and fix
npm run format # Format code

# Docker

docker-compose -f docker/docker-compose.dev.yml up -d # Start DB
docker-compose -f docker/docker-compose.dev.yml down # Stop DB
docker-compose -f docker/docker-compose.dev.yml logs -f # View logs

## License

Proprietary - All rights reserved.
