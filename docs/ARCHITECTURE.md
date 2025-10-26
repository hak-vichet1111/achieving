# Achieving App — Architecture & Database Guide

This document summarizes the important parts of the project across frontend, backend, and the database. It serves as a quick reference for development, onboarding, and operations.

## Overview
- Stack: `React + Vite + TypeScript` (frontend), `Go` (backend), `MySQL` (database)
- Codebase layout:
  - `backend/` — Go service, routes, handlers, models, schema
  - `frontend/` — React app, contexts, pages, components, router
  - `backend/db/schema.sql` — Canonical MySQL schema

## Backend
- Entry point: `backend/main.go`
- Key directories:
  - `backend/internal/routes/` — HTTP route registration
  - `backend/internal/handlers/` — Request handlers
  - `backend/internal/services/` — Business logic
  - `backend/internal/repository/` — Data access
  - `backend/internal/models/` — ORM models and migrations
  - `backend/internal/config/` — Configuration and environment handling
- Configuration: `backend/.env` (e.g., DB connection, secrets)

### Models & Migrations
- Core models defined in `backend/internal/models/spending.go` and `backend/internal/models/goal.go`.
- Guarded migrations self-heal legacy databases:
  - Uses `HasConstraint` checks to prevent duplicate foreign key creation when constraints already exist.
  - Enforces column sizes via guarded `ALTER TABLE` for legacy schemas.
  - Backfills computed fields (e.g., `month_key` derived from date) when missing.
- Enforced column sizes for entry tables (spending/earning/borrow):
  - `id` and `user_id`: `VARCHAR(36)`
  - `month_key`: `VARCHAR(7)` (format `YYYY-MM`)
  - `category`: `VARCHAR(64)`

## Database Schema
- Canonical schema: `backend/db/schema.sql` (single source of truth for DDL)
- Tables:
  - `users` — user accounts (PK: `id`, unique `email`)
  - `months` — per-user month keys (`user_id`, `key` unique)
  - `categories` — per-user category names
  - `plans` — planned amounts by month and category (per user)
  - `spending_entries` — spending logs with `user_id`, `month_key`, `category`, `amount`, `date`
  - `earning_entries` — earning logs with `user_id`, `month_key`, `source`, `amount`, `date`
  - `borrow_entries` — borrow logs with `user_id`, `month_key`, `from`, `amount`, repayment fields
  - `goals` — personal goals with status, target dates/amounts
- Common conventions:
  - All tables `ENGINE=InnoDB` and `DEFAULT CHARSET=utf8mb4`.
  - Foreign keys reference `users(id)` and `months(id)` as applicable.
  - Column sizes align with Go models for compatibility with legacy schemas.

### Initialize or Align a Database
- Create database (example):
  - `mysql -u <user> -p -e "CREATE DATABASE achieving CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"`
- Apply canonical schema:
  - `mysql -u <user> -p achieving < backend/db/schema.sql`
- Legacy DBs: backend migrations run at startup and guard/align column sizes and constraints without breaking existing data.

## Backend API (High-Level)
- Auth:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `PATCH /api/auth/profile`
- Goals:
  - `GET /api/goals` (used by frontend `GoalsContext`)
  - Additional CRUD endpoints typically follow RESTful patterns
- Spending/Earning/Borrow/Plans:
  - Contexts load monthly data and entries using REST endpoints scoped by the authenticated user
  - Endpoints follow `GET/POST/DELETE/PATCH` patterns under `/api/...`

## Frontend
- Entry: `frontend/src/main.jsx`
  - Providers (outer → inner): `AuthProvider` → `GoalsProvider` → `SpendingProvider` → `ThemeProvider`
- Routing: `frontend/src/router.tsx`
  - Public: `/`, `/login`, `/register`
  - Protected: `/dashboard`, `/goals`, `/goals/:goalId`, `/spend`, `/spend/:monthId`, `/settings`
  - Guard: `frontend/src/components/RequireAuth.tsx`

### State Management & Auth
- `frontend/src/contexts/AuthContext.tsx`
  - Manages `user`, `token`, `isAuthenticated`, and an `authVersion` counter
  - Persists `auth_token` and `auth_user` to `localStorage`
  - Exposes `login(token, user)`, `logout()`, `updateUser(user)`
- `frontend/src/contexts/SpendingContext.tsx`
  - Loads entries, earnings, borrows, categories, months, and plans
  - Reacts to `authVersion`/`isAuthenticated`: refetches on login; clears on logout
  - Centralized `refetchAll()` runs after mutations to keep UI in sync
- `frontend/src/contexts/GoalsContext.tsx`
  - Loads goals from `${API_BASE}/api/goals`
  - Reacts to auth changes: refetches on login; clears on logout

### Pages & Components (Selected)
- Pages: `Login.tsx`, `Register.tsx`, `Dashboard.tsx`, `Goals.tsx`, `GoalDetails.tsx`, `Spend.tsx`, `SpendDetails.tsx`, `Settings.tsx`, `Landing.tsx`
- Components: `Sidebar.tsx`, `UserProfile.tsx`, `QuickAdd.tsx`, `GoalCard.tsx`, `ToastViewport.tsx`
- Theme: `frontend/src/contexts/ThemeProvider.tsx` stores theme in `localStorage` and toggles classes

## Configuration
- Frontend: `frontend/.env`
  - `VITE_API_BASE` — backend URL, defaults to `http://localhost:8080`
- Backend: `backend/.env` — database credentials, secrets, and other service settings

## Development
- Frontend:
  - `cd frontend && npm install && npm run dev`
  - Dev server runs on `http://localhost:5173/` (fallbacks to an available port, e.g., `5174`)
- Backend:
  - `cd backend && go run .` (or your preferred build/run target)
- Database:
  - Apply schema: `mysql -u <user> -p achieving < backend/db/schema.sql`

## Testing & QA Scenarios
- Auth switching:
  - Login as User A → verify dashboard/spend/goals data
  - Logout/login as User B → data refreshes automatically without manual reload
- Legacy DB alignment:
  - Start backend against an older schema → verify migrations guard and align sizes/constraints

## Known Gotchas & Notes
- `RequireAuth.tsx` currently checks `localStorage` for `auth_token`; this remains compatible with `AuthContext` which persists to `localStorage`. You may refactor to use `useAuth().isAuthenticated` for consistency.
- Some fetch helpers read tokens from `localStorage` directly (e.g., `authHeaders` pattern); this is fine since the `AuthContext` persists token, but you can centralize via a helper in `AuthContext`.
- Vite ports: default `5173`; if busy, it chooses another (e.g., `5174`).

## Future Enhancements
- Centralize `getAuthHeaders()` in `AuthContext`
- Add `storage` event listeners in `AuthContext` to sync auth state across browser tabs
- Extend migration guards for index creation on entry tables
- Add end-to-end tests for auth-switch flows and CRUD operations