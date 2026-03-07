# FinishVision — Phase 1: Foundation Delivery

**Status:** COMPLETE  
**Date:** March 7, 2026  
**Phase:** 1 of 8 — Foundation

---

## 1. Monorepo Structure

The project uses a **pnpm workspace monorepo** with the following top-level layout:

```
finishvision/
├── apps/
│   ├── backend/          # NestJS + Prisma + PostgreSQL
│   └── frontend/         # Next.js + TypeScript + Tailwind
├── packages/
│   └── shared/           # Shared types and utilities (future)
├── package.json          # Root workspace scripts
├── pnpm-workspace.yaml   # Workspace configuration
└── .npmrc                # pnpm settings
```

---

## 2. Backend Architecture

The backend is built with **NestJS 10** using a modular architecture. Each domain entity has its own module containing a controller, service, and DTOs.

### Technology Stack

| Component | Technology |
|---|---|
| Framework | NestJS 10 |
| Language | TypeScript 5.3 |
| ORM | Prisma 5.8 |
| Database | PostgreSQL 14 |
| Auth | JWT (Passport) |
| Validation | class-validator + class-transformer |
| API Docs | Swagger (OpenAPI) |
| Storage | AWS S3 / MinIO abstraction |
| Rate Limiting | @nestjs/throttler |

### Module Structure

```
apps/backend/src/
├── main.ts                          # Bootstrap + Swagger + global pipes
├── app.module.ts                    # Root module
├── config/
│   ├── env.config.ts                # Environment variable loader
│   ├── prisma.service.ts            # Prisma client lifecycle
│   └── prisma.module.ts             # Global Prisma module
├── storage/
│   ├── storage.service.ts           # S3 upload/download/presign
│   └── storage.module.ts
├── common/
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   └── roles.decorator.ts
│   ├── guards/
│   │   └── roles.guard.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   └── interceptors/
│       └── transform.interceptor.ts
└── modules/
    ├── auth/
    │   ├── auth.controller.ts
    │   ├── auth.service.ts
    │   ├── auth.module.ts
    │   ├── jwt.strategy.ts
    │   └── dto/index.ts
    ├── company/
    │   ├── company.controller.ts
    │   ├── company.service.ts
    │   ├── company.module.ts
    │   └── dto/index.ts
    ├── user/
    │   ├── user.controller.ts
    │   ├── user.service.ts
    │   └── user.module.ts
    └── project/
        ├── project.controller.ts
        ├── project.service.ts
        ├── project.module.ts
        └── dto/index.ts
```

### API Routes

All routes are prefixed with `/api/v1`.

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Register new company + owner |
| POST | `/auth/login` | No | Login and receive JWT |
| GET | `/auth/me` | Yes | Get current user profile |
| GET | `/company` | Yes | Get company details |
| PATCH | `/company` | Owner/Admin | Update company settings |
| GET | `/users` | Yes | List company users |
| POST | `/users/invite` | Owner/Admin | Invite new user |
| PATCH | `/users/:id/deactivate` | Owner/Admin | Deactivate a user |
| GET | `/projects` | Yes | List projects (filterable) |
| GET | `/projects/:id` | Yes | Get project with full hierarchy |
| POST | `/projects` | Yes | Create new project |
| PATCH | `/projects/:id` | Yes | Update project |
| DELETE | `/projects/:id` | Yes | Soft-delete project |

### Global Features

The backend implements several cross-cutting concerns applied globally. The **TransformInterceptor** wraps every successful response in a standard `{ success, data, timestamp }` envelope. The **GlobalExceptionFilter** catches all exceptions and returns a consistent error format with status code, message, and timestamp. The **ValidationPipe** with `whitelist: true` and `forbidNonWhitelisted: true` ensures only declared DTO properties are accepted. Rate limiting is configured at 100 requests per minute per client.

---

## 3. Database Schema

The database uses **PostgreSQL 14** with **Prisma ORM** managing migrations. The schema implements a multi-tenant architecture where every entity is scoped to a company.

### Entity Hierarchy

```
Company (tenant)
├── User (belongs to company)
└── Project
    └── Building
        └── Floor
            └── Unit
                └── Room
```

### Tables Created

| Table | Description |
|---|---|
| `companies` | Tenant root with subscription tier, defaults |
| `users` | Company members with roles and auth |
| `projects` | Construction projects with status tracking |
| `buildings` | Buildings within a project |
| `floors` | Floors within a building |
| `units` | Units/apartments within a floor |
| `rooms` | Individual rooms within a unit |

### Enums

The schema defines three PostgreSQL enums: **UserRole** (OWNER, ADMIN, ESTIMATOR, VIEWER), **ProjectStatus** (BIDDING, AWARDED, IN_PROGRESS, COMPLETED, ARCHIVED), and **SubscriptionTier** (STARTER, PROFESSIONAL, BUSINESS, ENTERPRISE).

### Seed Data

The seed script creates a demo company ("Demo Carpentry Co."), two users (admin and estimator), and a sample project ("Sunset Ridge Apartments") with a complete hierarchy down to 6 rooms in Unit 101.

---

## 4. Frontend Architecture

The frontend is built with **Next.js 14** (App Router) using TypeScript and Tailwind CSS.

### Technology Stack

| Component | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5.3 |
| Styling | Tailwind CSS 3.4 |
| State Management | Zustand 4.5 |
| Server State | TanStack Query 5 |
| HTTP Client | Axios |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |

### Page Structure

```
apps/frontend/src/
├── app/
│   ├── layout.tsx              # Root layout + providers
│   ├── page.tsx                # Root redirect
│   ├── globals.css             # Tailwind + custom classes
│   ├── auth/
│   │   ├── layout.tsx          # Split-screen auth layout
│   │   ├── login/page.tsx      # Login form
│   │   └── register/page.tsx   # Registration form
│   └── dashboard/
│       ├── layout.tsx          # Sidebar + auth guard
│       ├── page.tsx            # Dashboard home
│       ├── projects/page.tsx   # Projects list + create
│       └── settings/page.tsx   # Company settings
├── components/
│   ├── layout/providers.tsx    # QueryClient provider
│   └── ui/
│       ├── button.tsx          # Reusable Button
│       ├── card.tsx            # Reusable Card
│       ├── input.tsx           # Reusable Input
│       └── index.ts            # Barrel export
├── hooks/
│   └── use-projects.ts        # TanStack Query hooks
├── lib/
│   ├── api.ts                  # Axios client + API functions
│   └── utils.ts                # cn() utility
├── stores/
│   └── auth-store.ts           # Zustand auth state
└── types/
    └── index.ts                # TypeScript interfaces
```

### Design System

The Tailwind configuration extends the default theme with brand colors (blue-based), category colors for takeoff items (doors = blue, windows = green, closets = purple, cabinets = amber, etc.), and Inter as the primary font. Three global utility classes are defined: `.btn-primary`, `.btn-secondary`, and `.input-field`.

---

## 5. Authentication System

Authentication uses **JWT tokens** with Passport.js. The flow works as follows:

1. User registers or logs in via `/auth/register` or `/auth/login`.
2. Backend validates credentials and returns a signed JWT containing `sub` (user ID), `email`, `companyId`, and `role`.
3. Frontend stores the token in `localStorage` and attaches it to all API requests via an Axios interceptor.
4. Protected routes use `AuthGuard('jwt')` which validates the token via the `JwtStrategy`.
5. Role-based access is enforced by the `RolesGuard` using the `@Roles()` decorator.
6. The frontend dashboard layout checks authentication on mount and redirects to login if no valid token exists.

---

## 6. Environment Configuration

### Backend (.env)

```
DATABASE_URL=postgresql://finishvision:finishvision_dev@localhost:5432/finishvision_dev
JWT_SECRET=fv-dev-jwt-secret-change-in-production-2024
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=fv-dev-refresh-secret-change-in-production-2024
JWT_REFRESH_EXPIRES_IN=7d
PORT=4000
NODE_ENV=development
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET_NAME=finishvision-dev
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

---

## 7. How to Run Locally

### Prerequisites

PostgreSQL 14 must be running with a database named `finishvision_dev` and a user `finishvision` with password `finishvision_dev`. Node.js 18+ and pnpm must be installed.

### Step-by-step

```bash
# 1. Clone and enter the project
cd finishvision

# 2. Install all dependencies
pnpm install

# 3. Generate Prisma client
cd apps/backend && npx prisma generate

# 4. Run database migrations
npx prisma migrate dev

# 5. Seed demo data
npx ts-node prisma/seed.ts

# 6. Build and start backend
npx nest build && node dist/src/main.js
# Backend runs on http://localhost:4000
# Swagger docs at http://localhost:4000/api/docs

# 7. In another terminal, start frontend
cd apps/frontend && npx next dev
# Frontend runs on http://localhost:3000
```

### Demo Credentials

| Email | Password | Role |
|---|---|---|
| admin@demo.com | Demo@2024! | OWNER |
| estimator@demo.com | Demo@2024! | ESTIMATOR |

---

## 8. Verified Test Results

All API endpoints have been tested and confirmed working:

| Test | Result |
|---|---|
| User registration (new company) | PASS |
| User login (JWT issued) | PASS |
| Get authenticated profile | PASS |
| Get company details | PASS |
| List projects (with building count) | PASS |
| Get project with full hierarchy (Building > Floor > Unit > Room) | PASS |
| Create new project | PASS |
| List company users | PASS |
| Swagger documentation accessible | PASS |
| Frontend builds successfully (all 7 pages) | PASS |

---

## 9. What Comes Next — Phase 2

Phase 2 (Project Management) will build upon this foundation by adding:

- Building/Floor/Unit/Room CRUD API endpoints
- Project detail page with hierarchy tree view
- Drag-and-drop reordering of hierarchy items
- Unit type templates for quick room creation
- Project duplication functionality

---

**PHASE 1 — FOUNDATION: COMPLETE**
