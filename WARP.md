# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project overview

StopSmoke is a full-stack smoking-cessation tracker and gamification app:
- **Backend** (`backend/`): ASP.NET Core 10 Web API with PostgreSQL, Entity Framework Core, ASP.NET Identity, and JWT authentication.
- **Frontend** (`frontend/`): React 19 + TypeScript + Vite SPA that talks to the backend via a `/api` HTTP API.
- **Infrastructure**: Docker Compose wiring Postgres, backend, frontend (served via Nginx) and Certbot. See `docker-compose.yml` and `.env.example`.

TASKs, high-level status and roadmap are documented in `TASK.md` and should be treated as the primary project brief.

## Common commands

### Run everything with Docker (recommended)

From the repo root:

```bash
# 1) Copy env template and edit values (POSTGRES_PASSWORD, JWT_SECRET, VITE_API_URL)
cp .env.example .env

# 2) Build and start Postgres, backend, frontend, migration job, and Certbot
docker-compose up --build
```

Key URLs in this setup (see `docker-compose.yml` and `frontend/nginx.conf`):
- Frontend SPA: `http://localhost` (port 80)
- Backend API: `http://localhost:5216`
- Swagger / OpenAPI UI: `http://localhost:5216/swagger`

### Backend (.NET / ASP.NET Core)

From `backend/`:

```bash
cd backend

# Restore tools (required for EF Core CLI in docker-compose and locally)
dotnet tool restore

# Build
dotnet build

# Run with hot reload for development
dotnet watch run

# Run normally
dotnet run

# Apply latest EF Core migrations to the configured database
dotnet ef database update

# Add a new EF Core migration (name it meaningfully)
dotnet ef migrations add <MigrationName>
```

Notes:
- Connection strings and JWT settings are defined in `appsettings.json` and overridden via environment variables in `docker-compose.yml`.
- `Program.cs` calls `context.Database.Migrate()` on startup, so migrations are applied automatically when the app boots (as long as the DB is reachable).

There is currently **no dedicated test project** for the backend; `dotnet test` will not run anything until a test project is added.

### Frontend (React + Vite)

From `frontend/`:

```bash
cd frontend

# Install dependencies (once)
npm install

# Dev server with Vite (proxies /api to backend:5216, see vite.config.ts)
npm run dev

# Production build (output to dist/)
npm run build

# Preview built app on a local server
npm run preview

# Lint TypeScript/JS code with ESLint
npm run lint
```

There are currently **no test scripts** defined in `frontend/package.json`; add a test runner (e.g. Vitest) before expecting `npm test` or single-test commands to work.

## High-level backend architecture

### Composition root and infrastructure

- `backend/Program.cs` is the main composition root:
  - Registers MVC controllers and OpenAPI.
  - Configures `ApplicationDbContext` to use PostgreSQL via a `DefaultConnection` connection string.
  - Wires ASP.NET Identity with a custom `User` entity and relaxed password requirements.
  - Configures JWT Bearer authentication using `Jwt` settings (issuer, audience, key) from configuration.
  - Enables CORS policy `AllowFrontend` permitting the Vite frontend origin.
  - Registers `MarathonCompletionService` both as a singleton service and as a hosted background service.
  - On startup, creates a DI scope and calls `Database.Migrate()` on `ApplicationDbContext` to apply pending EF Core migrations.

- Configuration files:
  - `appsettings.json`: default connection string and JWT settings for local development.
  - `appsettings.Development.json`: logging overrides.
  - In Docker, equivalent values are provided via environment variables (`ConnectionStrings__DefaultConnection`, `JwtSettings__*`).

### Data model and EF Core

- `Data/ApplicationDbContext.cs` extends `IdentityDbContext<User>` and defines:
  - `DbSet<Relapse> Relapses`
  - `DbSet<Marathon> Marathons`
  - `DbSet<MarathonParticipant> MarathonParticipants`

- Core entities (see `Models/`):
  - `User` (extends `IdentityUser`):
    - Smoking profile: `QuitDate`, `CigarettesPerDay`, `PricePerPack`, `Currency`.
    - Display name: `Name` (optional, length-validated).
    - Authorization: `IsAdmin` flag for simple admin checks.
  - `Relapse`:
    - Links to `User` via `UserId`.
    - Records `Date` and optional `Reason`.
  - `Marathon` and `MarathonParticipant`:
    - `Marathon` defines a time-bounded challenge with `StartDate`, `EndDate`, `IsActive`, and a collection of participants.
    - `MarathonParticipant` links a `User` to a `Marathon` and tracks `JoinedAt` and `Status` (`Active`, `Disqualified`, `Completed`).

- Database migrations are tracked under `Migrations/` and should be kept in sync with the entity model and DTOs.

### Web API surface

All controllers live under `Controllers/` and are attribute-routed under `api/`.

- **AuthController (`api/auth`)**
  - `POST /api/auth/register`: creates a new Identity `User` from `RegisterDto`.
  - `POST /api/auth/login`: validates credentials from `LoginDto`, then issues a JWT using the configured signing key and issuer/audience.
  - JWT claims include `Name`, `NameIdentifier` (user ID), and a JTI.

- **ProfileController (`api/profile`, `[Authorize]`)**
  - `GET /api/profile`: returns `UserProfileDto` for the current user, including `CompletedMarathonsCount` computed from `MarathonParticipants` with `Status == Completed`.
  - `PUT /api/profile`: updates basic profile fields using `UpdateProfileDto` (name, quit date, cigarettes per day, price per pack, currency).

- **RelapseController (`api/relapse`, `[Authorize]`)**
  - `GET /api/relapse`: returns the current user’s relapse history ordered by date.
  - `POST /api/relapse`: core relapse business rule:
    - Resets the user’s `QuitDate` to `null`.
    - Creates a new `Relapse` record with `Date = UtcNow` and optional reason.
    - Finds all **active** marathon participations for the user in currently running marathons and sets their status to `Disqualified`.

- **MarathonController (`api/marathon`, `[Authorize]`)**
  - `GET /api/marathon`: returns a list of `MarathonDto` for active, future-ending marathons, including per-user participation info (`IsJoined`, `UserStatus`).
  - `POST /api/marathon`: creates a new marathon **only if the caller is admin** (`User.IsAdmin == true`), from `CreateMarathonDto`.
  - `POST /api/marathon/{id}/join`: lets the current user join a marathon if it has not started yet and they are not already joined or previously disqualified.
  - `POST /api/marathon/complete-ended`: admin-only endpoint that calls `MarathonCompletionService.CompleteEndedMarathonsAsync()` on demand.

- **LeaderboardController (`api/leaderboard`, `[Authorize]`)**
  - Uses `UserManager<User>` to query users with a `QuitDate` and non-empty `Name`.
  - Computes `DaysClean` as the difference between `DateTime.UtcNow` and `QuitDate`.
  - Returns up to 50 users ordered by `DaysClean` with rank, name, days clean, and a boolean indicating the current user.

- **AdminController (`api/admin`, `[Authorize]`)**
  - `POST /api/admin/grant-access`: sets `IsAdmin = true` for the current user.
  - Frontend access is via the secret `/secret-admin-access` page protected only by a hard-coded client-side code; this is intended for development and should be treated as non-production-safe.

### Background processing

- `Services/MarathonCompletionService.cs` is a `BackgroundService` that runs in the host:
  - On a fixed interval (currently 1 hour), it creates a scoped `ApplicationDbContext`, finds ended but still active marathons, and:
    - Marks `MarathonParticipant` entries with `Status == Active` as `Completed`.
    - Sets the marathon’s `IsActive` flag to `false`.
  - Logs progress and errors via `ILogger<MarathonCompletionService>`.
  - Can also be invoked manually via the admin-only controller endpoint described above.

## High-level frontend architecture

### Application entry and routing

- `frontend/src/main.tsx` bootstraps React and renders `<App />`.
- `frontend/src/App.tsx` configures `BrowserRouter` with routes:
  - Public: `/login`, `/register`.
  - Protected (via `ProtectedRoute`): `/profile`, `/dashboard`, `/leaderboard`, `/marathons`, `/secret-admin-access`, and `/` (redirects to `/dashboard`).
- `ProtectedRoute` checks for a JWT token in `localStorage` and redirects unauthenticated users to `/login`.

### API client and auth flow

- `src/api/axios.ts` exports a preconfigured Axios instance:
  - `baseURL: '/api'` so all calls go through `/api`.
  - A request interceptor adds `Authorization: Bearer <token>` from `localStorage` if present.
- Local dev: Vite’s dev server proxies `/api` to `http://localhost:5216` (see `vite.config.ts`).
- Docker / production: Nginx (`frontend/nginx.conf`) proxies `/api/` to the backend container at `http://backend:5216`.

- Auth pages:
  - `LoginPage` posts credentials to `/api/auth/login`, stores `token` and `email` in `localStorage`, then navigates to `/dashboard`.
  - `RegisterPage` posts registration data to `/api/auth/register` and redirects to login on success.

### Core pages

- `DashboardPage`:
  - Fetches `/api/profile` on mount and stores profile info.
  - Derives a precise number of days since `QuitDate`, then calculates:
    - Days/hours/minutes clean.
    - Money saved based on `CigarettesPerDay` and `PricePerPack` (assuming 20 cigarettes per pack).
    - Total cigarettes and packs not smoked.
  - Renders summary cards, `HealthTimeline`, and `Achievements` using these derived metrics.

- `ProfilePage`:
  - Loads and edits profile data via `/api/profile` (`GET`/`PUT`).
  - Uses `react-hook-form` for inputs, including a local-time-friendly datetime picker for `QuitDate`.
  - Supports relapse management via `/api/relapse`:
    - “I relapsed” opens a modal, posts optional reason to `POST /api/relapse`, resets local quit date, and refreshes relapse history.
    - A history modal displays past relapses returned from `GET /api/relapse`.

- `MarathonPage`:
  - Loads marathons via `/api/marathon` and user profile via `/api/profile` (for `isAdmin`).
  - Non-admin users can join upcoming marathons via `POST /api/marathon/{id}/join`.
  - Admin users see a modal to create marathons, which posts ISO datetimes to `POST /api/marathon`.
  - Uses `src/types/index.ts` interfaces (`Marathon`, `CreateMarathonDto`, `User`) for strong typing.

- `LeaderboardPage`:
  - Calls `/api/leaderboard` and renders a ranked list with special styling for the top 3 and for the current user.

- `SecretAdminPage`:
  - Exposes a dev-only code-based flow: if the user enters the correct hard-coded code, the page calls `POST /api/admin/grant-access` and then redirects back to `/dashboard`.

### Shared UI and utilities

- `Navbar`:
  - Central navigation with links to dashboard, profile, leaderboard, and marathons.
  - Integrates the `LanguageSwitcher`, an SOS emergency modal trigger, and logout behavior (clears auth token and redirects to login).
- `SOSModal`:
  - Full-screen “craving emergency” flow with:
    - A 3-minute countdown timer.
    - Guided breathing (4–7–8 technique) via timed state changes.
    - Rotating motivational quotes from `sos.quotes` translation keys.
- `HealthTimeline`:
  - Visualizes medical milestones after quitting at various elapsed times (minutes, hours, weeks, months, years) using translation keys under `health.milestones.*`.
- `Achievements`:
  - Defines a set of achievement thresholds over time, money saved, cigarettes not smoked, and completed marathons.
  - Computes which achievements are unlocked and shows overall progress.
- `LanguageSwitcher` + `i18n.ts`:
  - Initializes `i18next` with `en` and `ru` translations from `src/locales/`.
  - Dropdown for switching language at runtime, used in auth pages and navbar.
- `LoadingSpinner`, `Toast`:
  - Simple reusable components for loading states and transient notifications.

## Infrastructure and environment wiring

- `docker-compose.yml` orchestrates:
  - `postgres`: backing PostgreSQL DB with persisted volume and healthcheck.
  - `backend`: builds from `backend/Dockerfile`, exposes port 5216, and reads connection string and JWT settings from environment variables.
  - `migration`: an SDK container that mounts `backend/` and runs `dotnet tool restore && dotnet ef database update` once to apply migrations to the Postgres instance.
  - `frontend`: builds from `frontend/Dockerfile`, serves static assets via Nginx, and proxies `/api/` to the backend.
  - `certbot`: handles certificate storage in shared volumes, referenced from `frontend/nginx.conf`.

- `.env.example` documents required environment variables:
  - `POSTGRES_PASSWORD` for the DB.
  - `JWT_SECRET` to sign access tokens.
  - `VITE_API_URL` for frontend builds (used as a build arg in `docker-compose.yml`; the runtime Axios client still uses `/api`).

## Notes for future agents

- **Source of truth for product scope and roadmap**: consult `TASK.md` before major changes; it reflects the intended feature set and planned improvements (including testing strategy, gamification ideas, and CI/CD plans).
- **Adding tests**:
  - Backend: create a separate test project (e.g., `StopSmoke.Backend.Tests`) and wire it into the solution so `dotnet test` has something to run.
  - Frontend: add a testing stack (e.g., Vitest + React Testing Library) and expose scripts in `package.json` (`test`, `test:watch`) before relying on test commands.
- **Admin and security**:
  - The `/secret-admin-access` flow and client-side admin code are explicitly for development; treat them as unsafe for production and adjust or remove them in production-focused work.
- **API evolution**:
  - When adding new endpoints, follow the existing REST-style conventions under `/api/*`, honor JWT-based authentication and `IsAdmin` checks where appropriate, and update both DTOs and frontend types/consumers together to keep the contract consistent.
