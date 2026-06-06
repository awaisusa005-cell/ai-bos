# AI BOS — AI Business Operating System

A production-grade SaaS platform for managing business operations with AI-powered employees and automation.

## Architecture

```
ai-bos/
├── apps/
│   ├── web          # Next.js 14 App Router frontend
│   └── api          # Express.js REST API
├── packages/
│   ├── ui           # Shared React design system
│   ├── database     # Prisma schema & client
│   ├── shared       # Types, constants, utilities
│   ├── auth         # JWT auth, RBAC, password hashing
│   ├── ai           # AI service layer (placeholder)
│   ├── workflows    # Workflow engine (placeholder)
│   ├── integrations # Third-party integrations (placeholder)
│   └── eslint-config# Shared ESLint configuration
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Tech Stack

- **Monorepo**: Turborepo + pnpm workspaces
- **Frontend**: Next.js 14, Tailwind CSS, Lucide icons
- **Backend**: Express.js, Zod validation, Helmet, CORS
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT + refresh tokens, bcrypt, RBAC
- **Security**: Rate limiting, input validation, secure cookies
- **DX**: ESLint, Prettier, Husky, lint-staged, Docker Compose, GitHub Actions

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 9
- Docker & Docker Compose (for database)

### Setup

```bash
# Install dependencies
pnpm install

# Start infrastructure (Postgres + Redis)
docker compose up -d postgres redis

# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Start development servers
pnpm dev
```

The web app runs at `http://localhost:3000` and the API at `http://localhost:4000`.

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

## API Endpoints

| Method | Path                                  | Description             |
| ------ | ------------------------------------- | ----------------------- |
| GET    | `/api/v1/health`                      | Health check            |
| POST   | `/api/v1/auth/register`               | Register a new user     |
| POST   | `/api/v1/auth/login`                  | Login                   |
| POST   | `/api/v1/auth/refresh`                | Refresh tokens          |
| POST   | `/api/v1/auth/logout`                 | Logout                  |
| POST   | `/api/v1/auth/password-reset/request` | Request password reset  |
| POST   | `/api/v1/auth/password-reset`         | Reset password          |
| GET    | `/api/v1/auth/me`                     | Get current user        |
| POST   | `/api/v1/organizations`               | Create organization     |
| GET    | `/api/v1/organizations`               | List user organizations |
| GET    | `/api/v1/organizations/:id`           | Get organization        |

## Scripts

| Command            | Description                    |
| ------------------ | ------------------------------ |
| `pnpm dev`         | Start all apps in development  |
| `pnpm build`       | Build all packages and apps    |
| `pnpm lint`        | Lint all packages              |
| `pnpm typecheck`   | Typecheck all packages         |
| `pnpm format`      | Format all files with Prettier |
| `pnpm db:generate` | Generate Prisma client         |
| `pnpm db:push`     | Push schema to database        |
| `pnpm db:migrate`  | Run migrations                 |

## Roadmap (Phase 2+)

- [ ] AI Employee management & orchestration
- [ ] Workflow builder with visual editor
- [ ] Integration marketplace (Slack, Google, Salesforce, etc.)
- [ ] Revenue tracking & financial dashboards
- [ ] Marketing automation with AI content generation
- [ ] Sales pipeline & CRM
- [ ] Customer support with AI agents
- [ ] Advanced analytics & reporting
- [ ] Email notifications
- [ ] Stripe billing integration

## License

Private — All rights reserved.
