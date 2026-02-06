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

## Git Workflow

- `main`: Production (locked, requires PR)
- `development`: Staging (locked, requires PR)
- `feature/camelCaseName`: Feature branches

All naming conventions follow **camelCase**.

## License

Proprietary - All rights reserved.
