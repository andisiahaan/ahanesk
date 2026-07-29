# Ahanesk — Ahandev Enterprise Starter Kit

A mid-to-high scale Monorepo Starter Kit based on **NestJS**, **Next.js App Router**, and **Turborepo**, designed with **SSOT, DRY, Modular, and Separation of Concerns (SOC)** principles.

---

## 🏛️ Architecture & Monorepo Structure

```
ahanesk/
├── apps/
│   ├── backend/    → NestJS API Server (Port 10311)
│   ├── frontend/   → Next.js User-Facing App Router (Port 10312)
│   └── admin/      → Next.js Admin Panel Dashboard (Port 10313)
├── packages/
│   ├── shared/     → Zod schemas, types, constants, i18n locales registry, pagination utils
│   └── ui/         → Shared UI Components & assets (Logo, favicon, shadcn tokens)
├── ecosystem.config.js → PM2 Cluster & Instance Configuration
└── turbo.json      → Turborepo Pipeline
```

---

## 🛠️ Tech Stack & Architecture Choices

| Layer | Technology & Library | Description / Key Rules |
| :--- | :--- | :--- |
| **Monorepo Engine** | **Turborepo** + **pnpm workspaces** | Orchestration & caching of dev/build/test tasks across workspaces |
| **Backend** | **NestJS** (TypeScript) | Domain `api.domain.com`, without `/api` prefix. Only `/admin/*` and `/v1/*` routes have prefixes |
| **Frontend** | **Next.js 16 App Router** | Domain `domain.com`, pure Tailwind CSS styling in JSX, shadcn/ui |
| **Admin Panel** | **Next.js 16 App Router** | Domain `admin.domain.com`, no `/admin/` prefix in URLs, 2-layer auth |
| **ORM & Database** | **Prisma** + **MySQL / MariaDB** | DB Queries exclusively in `*.repository.ts`. All SQL migrations must be tracked in Git |
| **Data Validation** | **Zod v4** (`z.object(...)`) | Backend: `ZodValidationPipe`; Frontend/Admin: `react-hook-form` + `zodResolver` |
| **Authentication** | **JWT httpOnly Cookie** + **Passport** | Access token (15m) & Refresh token (7d) in httpOnly cookies (`access_token`) |
| **Caching** | **Redis DB 1** (`@nestjs/cache-manager`) | Namespace `cache:*`. Explicitly invalidated on write (Memcached is not used) |
| **Queue** | **BullMQ + Redis DB 0** | Async/background job processing separated from cache |
| **Internationalization** | **next-intl** (`packages/shared/src/locales`) | SSOT translation EN/ID in shared package, cookie-based `locale` |

---

## 📋 System Prerequisites

Before running the project, ensure your development environment has the following installed:
- **Node.js**: version `>= 20.0.0`
- **pnpm**: version `>= 9.0.0` (`npm install -g pnpm`)
- **Database**: Local or remote MySQL / MariaDB
- **Redis Server**: Running on port `6379` (must support at least DB 0 & DB 1)

---

## 🚀 Quick Start (Local Development)

### 1. Clone & Install Dependencies
```bash
git clone <your-repository-url> my-app
cd my-app
pnpm install
```

### 2. Configure Environment Variables (`.env`)
Copy the `.env.example` file to `.env` in each workspace, then adjust the values:
```bash
# Backend (apps/backend/.env)
cp apps/backend/.env.example apps/backend/.env

# Frontend (apps/frontend/.env.local)
cp apps/frontend/.env.example apps/frontend/.env.local

# Admin Panel (apps/admin/.env.local)
cp apps/admin/.env.example apps/admin/.env.local
```

> **Important Backend Note (`apps/backend/.env`)**:
> Ensure `DATABASE_URL` points to an active MySQL/MariaDB database:
> `DATABASE_URL="mysql://root:@localhost:3306/ahanesk_extended"`

### 3. Migrate & Seed Database (Prisma)
Run database schema migrations and initial seeding directly from the monorepo root:
```bash
pnpm run db:migrate
pnpm run db:seed
```

### 4. Run Development Server (Concurrently via Turborepo)
```bash
pnpm run dev
```
Once the server is running, services will be accessible at:
- **Backend API**: http://localhost:10311 (`GET /` to check health status)
- **Frontend App**: http://localhost:10312
- **Admin Dashboard**: http://localhost:10313

---

## 🧪 Development & Testing Commands

All the commands below can be run from the monorepo root to execute concurrently across all packages/apps:

| Command | Function |
| :--- | :--- |
| `pnpm run dev` | Run development servers (`turbo run dev`) |
| `pnpm run build` | Compile production TypeScript & Next.js (`turbo run build`) |
| `pnpm run lint` | Check ESLint across all workspaces |
| `pnpm run type-check` | Check TypeScript typings (`tsc --noEmit`) |
| `pnpm run test` | Run Jest unit tests (focused on services & repositories) |
| `pnpm run format` | Format code using Prettier |

---

## 🛡️ Testing & Security

This Starter Kit is built with a high priority on testing (*mid-to-high* scale), covering multi-layered tests from Unit to Load/Penetration Testing.

### 1. Unit & Integration Test
Used to test *business logic* (Service) and database queries (Repository) in isolation.
```bash
# Run tests across all workspaces
pnpm run test
```

### 2. End-to-End (E2E) API Test
Every module in the Backend (Auth, User, Blog, Settings, etc.) is equipped with full E2E specs, ensuring controller integration, interceptors, Zod validation, and email delivery work perfectly.
```bash
# Run backend E2E API specs
pnpm --filter backend run test:e2e
```
*(This process uses a global test environment setup, cleans up isolated data, and uses Cookie-based authentication transparently).*

### 3. Load & Security Penetration Testing (CSRF)
The application is secured using **Double-Submit Cookie** (`x-csrf-token` header vs `csrf_token` cookie).
A proof-of-concept and load testing script is provided to test server resilience.
```bash
# Perform bombard test & verify mutation security live (optional)
node apps/backend/scripts/bombard.mjs
```

---

## 📦 Production Deployment Guide (PM2)

This project comes with a production configuration file `ecosystem.config.js` to be executed by **PM2**.

### 1. Build All Applications
```bash
pnpm run build
```

### 2. Run PM2 Cluster
```bash
# First-time start
pm2 start ecosystem.config.js --env production

# Reload (zero-downtime reload after update)
pm2 reload ecosystem.config.js --env production

# Check status and application logs
pm2 status
pm2 logs ahanesk-backend
```

---

## 📜 Development Rules & Standards (SSOT)

1. **Maximum Code Lines Limit**: Every code file is limited to a maximum of **300 lines** (ideal: 200–300 lines). If it exceeds the limit, modularization/splitting of functions or components is mandatory.
2. **Readability & Data Types**: The use of `any` type is strictly forbidden. Use `unknown` + type narrowing or Zod inferred types.
3. **Auth Token Storage**: Access tokens and Refresh tokens are set directly via **httpOnly cookies** by the backend server. Frontend and Admin are not permitted to store authentication tokens in `localStorage`.
4. **I18n / Localization**: Hardcoding UI strings in JSX/TSX is prohibited. All translated strings are stored in the SSOT registry at `packages/shared/src/locales`.
5. **Custom Guides**: Any addition of new conventions must be immediately updated in the guide files located inside `.agents/rules/` (`project-guide.md`, `backend-app-guide.md`, `frontend-app-guide.md`, `admin-app-guide.md`).
